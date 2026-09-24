import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OrderSaved } from "../OrderSaved";
import { PAYMENT_COPY } from "@/lib/payment/copy";
import { PAYMENT_PATH } from "@/lib/payment/link";

const c = PAYMENT_COPY.uz;
const TOKEN = "t".repeat(43);
const RESUME = { token: TOKEN, expiresAt: "2026-10-24T10:00:00.000Z" };
const FORBIDDEN = [/Tayyorlanmoqda/i, /Ishlab chiqarish boshlandi/i, /7[–-]10 kun/i, /Buyurtmangiz tayyorlanmoqda/i];

let setItem: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  setItem = vi.spyOn(Storage.prototype, "setItem");
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mount(navigate = vi.fn(), resume: typeof RESUME | null = RESUME) {
  render(<OrderSaved orderCode="TAL-2026-0142" resume={resume} copy={c} locale="uz" navigate={navigate} />);
  return navigate;
}

describe("OrderSaved — the post-submit decision screen", () => {
  it("shows the saved title, the order code, both CTAs and the production notice", () => {
    mount();
    expect(screen.getByRole("heading", { name: "Buyurtmangiz saqlandi" })).toBeInTheDocument();
    expect(screen.getByText(c.savedBody)).toBeInTheDocument();
    expect(screen.getByText("TAL-2026-0142")).toBeInTheDocument();
    expect(screen.getByText("Buyurtma raqami")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hozir to‘lash" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keyinroq to‘lash" })).toBeInTheDocument();
    expect(
      screen.getByText("Buyurtmangizni tayyorlash jarayoni to‘lov tasdiqlangandan keyin boshlanadi."),
    ).toBeInTheDocument();
    for (const re of FORBIDDEN) expect(document.body.textContent).not.toMatch(re);
  });

  it("'Hozir to‘lash' opens the separate payment page with the token in the fragment only", () => {
    const navigate = mount();
    fireEvent.click(screen.getByRole("button", { name: "Hozir to‘lash" }));
    expect(navigate).toHaveBeenCalledTimes(1);
    const target = navigate.mock.calls[0]![0] as string;
    expect(target).toBe(`${PAYMENT_PATH}#p_${TOKEN}`);
    const url = new URL(target, "https://talimoon.com");
    expect(url.search).toBe("");
    expect(url.pathname).not.toContain(TOKEN);
  });

  it("'Keyinroq to‘lash' shows the calm awaiting-payment state with a way back", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Keyinroq to‘lash" }));

    expect(screen.getByRole("heading", { name: "To‘lov kutilmoqda" })).toBeInTheDocument();
    expect(screen.getByText("Buyurtmangiz saqlangan. Uni qayta to‘ldirishingiz shart emas.")).toBeInTheDocument();
    expect(
      screen.getByText("Tayyorlash jarayoni to‘lov tasdiqlangandan keyin boshlanadi."),
    ).toBeInTheDocument();
    expect(screen.getByText("TAL-2026-0142")).toBeInTheDocument();
    // current status, from the canonical mapping
    expect(screen.getAllByText("To‘lov kutilmoqda").length).toBeGreaterThanOrEqual(2);
    for (const re of FORBIDDEN) expect(document.body.textContent).not.toMatch(re);

    fireEvent.click(screen.getByRole("button", { name: c.copyLink }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0]![0]).toBe(`${window.location.origin}${PAYMENT_PATH}#p_${TOKEN}`);
    expect(screen.getByRole("button", { name: "Hozir to‘lash" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Telegram/ })).toHaveAttribute("href", "https://t.me/Talimoon_DM");
  });

  it("never writes the order or the payment token to browser storage", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Keyinroq to‘lash" }));
    for (const call of setItem.mock.calls) {
      expect(String(call[1])).not.toContain(TOKEN);
      expect(String(call[1])).not.toContain("TAL-2026-0142");
    }
  });

  it("without a payment link (older backend) it still confirms the save, and offers no dead button", () => {
    mount(vi.fn(), null);
    expect(screen.getByRole("heading", { name: "Buyurtmangiz saqlandi" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hozir to‘lash" })).toBeNull();
    expect(screen.getByText(c.savedNoLink)).toBeInTheDocument();
  });
});
