import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_INTAKE_API_URL = "https://api.talimoon.com";
});

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

import { PayCodeEntry } from "../PayCodeEntry";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { PAYMENT_COPY } from "@/lib/payment/copy";
import { PAYMENT_PATH } from "@/lib/payment/link";

const c = PAYMENT_COPY.uz;
let fetchMock: ReturnType<typeof vi.fn>;
let setItem: ReturnType<typeof vi.spyOn>;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

beforeEach(() => {
  replace.mockReset();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  setItem = vi.spyOn(Storage.prototype, "setItem");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mount() {
  render(
    <LanguageProvider>
      <PayCodeEntry />
    </LanguageProvider>,
  );
  return screen.getByLabelText(c.payInputLabel) as HTMLInputElement;
}

describe("/pay — payment code entry", () => {
  it("shows the approved title, description, placeholder and button", () => {
    const input = mount();
    expect(screen.getByRole("heading", { name: "To‘lov kodini kiriting" })).toBeInTheDocument();
    expect(screen.getByText(c.payDescription)).toBeInTheDocument();
    expect(input.placeholder).toBe("K7M4P2");
    expect(input.autocomplete).toBe("off");
    expect(screen.getByRole("button", { name: "Buyurtmani ochish" })).toBeInTheDocument();
  });

  it("typing lowercase shows uppercase", async () => {
    const input = mount();
    await userEvent.type(input, "k7m4p2");
    expect(input.value).toBe("K7M4P2");
  });

  it("paste with spaces/hyphens is normalized and capped at 6", async () => {
    const input = mount();
    input.focus();
    await userEvent.paste("k7-m4 p2");
    expect(input.value).toBe("K7M4P2");
    await userEvent.type(input, "99");
    expect(input.value).toBe("K7M4P2");
  });

  it("a valid code opens the SEPARATE payment page — never the form", async () => {
    fetchMock.mockResolvedValue(json({ orderCode: "TAL-2026-0013", lifecycleStatus: "AWAITING_PAYMENT" }));
    const input = mount();
    await userEvent.type(input, "k7 m4-p2");
    fireEvent.click(screen.getByRole("button", { name: c.payOpen }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith(PAYMENT_PATH));
    expect(replace.mock.calls[0]![0]).not.toMatch(/form/);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("https://api.talimoon.com/v1/payment/code/session");
    expect(String(url)).not.toContain("K7M4P2");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(init.headers["x-talimoon-payment"]).toBe("1");
    expect(JSON.parse(init.body)).toEqual({ code: "K7M4P2" });
  });

  it("an invalid / expired code gets the one generic message", async () => {
    fetchMock.mockResolvedValue(json({ error: "payment_code_invalid" }, 401));
    const input = mount();
    await userEvent.type(input, "ZZZZZZ");
    fireEvent.click(screen.getByRole("button", { name: c.payOpen }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "To‘lov kodi topilmadi yoki amal qilish muddati tugagan. Kodni tekshirib, qayta urinib ko‘ring.",
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("rate limiting gets its own calm message", async () => {
    fetchMock.mockResolvedValue(json({ error: "rate_limited" }, 429));
    const input = mount();
    await userEvent.type(input, "ZZZZZZ");
    fireEvent.click(screen.getByRole("button", { name: c.payOpen }));
    expect(await screen.findByRole("alert")).toHaveTextContent(c.payRateLimited);
  });

  it("an incomplete code never reaches the network", async () => {
    const input = mount();
    await userEvent.type(input, "K7M");
    fireEvent.click(screen.getByRole("button", { name: c.payOpen }));
    expect(await screen.findByRole("alert")).toHaveTextContent(c.payInvalid);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never writes the code to browser storage", async () => {
    fetchMock.mockResolvedValue(json({ orderCode: "TAL-2026-0013" }));
    const input = mount();
    await userEvent.type(input, "K7M4P2");
    fireEvent.click(screen.getByRole("button", { name: c.payOpen }));
    await waitFor(() => expect(replace).toHaveBeenCalled());
    for (const call of setItem.mock.calls) expect(String(call[1])).not.toContain("K7M4P2");
  });
});
