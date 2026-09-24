import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StrictMode } from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_INTAKE_API_URL = "https://api.talimoon.com";
});

import { PaymentPage } from "../PaymentPage";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { PAYMENT_COPY } from "@/lib/payment/copy";
import { PAYMENT_PATH } from "@/lib/payment/link";
import { formatMoney } from "@/components/begin/orderFormData";

const c = PAYMENT_COPY.uz;
const API = "https://api.talimoon.com";
const TOKEN = "Qk9vS2V5X2Zvcl90ZXN0X29ubHlfbm90X3JlYWxfMDA"; // 43 chars

function view(over: Record<string, unknown> = {}) {
  return {
    orderCode: "TAL-2026-0142",
    lifecycleStatus: "AWAITING_PAYMENT",
    orderSaved: true,
    paymentConfirmed: false,
    productionStarted: false,
    acceptsPayment: true,
    amount: 499000,
    currency: "UZS",
    book: { bookType: "single", copies: 1, childCount: 1 },
    paymentMethods: ["bank_transfer_receipt"],
    attempt: null,
    sessionExpiresAt: "2026-10-24T10:00:00.000Z",
    ...over,
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

let fetchMock: ReturnType<typeof vi.fn>;
let setItem: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  setItem = vi.spyOn(Storage.prototype, "setItem");
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mountAt(hash: string) {
  window.history.replaceState(null, "", `${PAYMENT_PATH}${hash}`);
  return render(
    <StrictMode>
      <LanguageProvider>
        <PaymentPage />
      </LanguageProvider>
    </StrictMode>,
  );
}

function calls(path: string) {
  return fetchMock.mock.calls.filter(([url]) => String(url).startsWith(`${API}${path}`));
}

describe("PaymentPage — resume token exchange", () => {
  it("exchanges the fragment token exactly once, strips it, and uses the cookie session", async () => {
    fetchMock.mockResolvedValue(json(view()));
    mountAt(`#p_${TOKEN}`);

    // the fragment is gone immediately — before the network answers
    expect(window.location.hash).toBe("");
    expect(window.location.href).not.toContain(TOKEN);

    expect(await screen.findByText("TAL-2026-0142")).toBeInTheDocument();
    const exchanges = calls("/v1/payment/session");
    expect(exchanges).toHaveLength(1); // StrictMode double-effect does not double-exchange
    const [url, init] = exchanges[0]!;
    expect(String(url)).toBe(`${API}/v1/payment/session`);
    expect(String(url)).not.toContain(TOKEN);
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(init.headers["x-talimoon-payment"]).toBe("1");
    expect(JSON.parse(init.body)).toEqual({ resumeToken: TOKEN });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows the order, the server amount + currency, instructions and the production notice", async () => {
    fetchMock.mockResolvedValue(json(view()));
    mountAt(`#p_${TOKEN}`);
    expect(await screen.findByRole("heading", { name: "To‘lov kutilmoqda" })).toBeInTheDocument();
    expect(screen.getByText(formatMoney(499000, "UZS"))).toBeInTheDocument();
    expect(screen.getByText("UZS")).toBeInTheDocument();
    expect(screen.getByText(c.howToPayHeading)).toBeInTheDocument();
    expect(
      screen.getByText("Buyurtmangizni tayyorlash jarayoni to‘lov tasdiqlangandan keyin boshlanadi."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: c.submitPayment })).toBeInTheDocument();
  });

  it("never stores the raw token in localStorage / sessionStorage", async () => {
    fetchMock.mockResolvedValue(json(view()));
    mountAt(`#p_${TOKEN}`);
    await screen.findByText("TAL-2026-0142");
    for (const call of setItem.mock.calls) expect(String(call[1])).not.toContain(TOKEN);
    expect(JSON.stringify({ ...localStorage })).not.toContain(TOKEN);
    expect(JSON.stringify({ ...sessionStorage })).not.toContain(TOKEN);
  });

  it("an invalid / expired / revoked link shows a neutral recovery state", async () => {
    fetchMock.mockResolvedValue(json({ error: "payment_session_invalid" }, 401));
    mountAt(`#p_${TOKEN}`);
    expect(await screen.findByRole("heading", { name: c.invalidTitle })).toBeInTheDocument();
    expect(screen.getByText(c.invalidReassurance)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Telegram/ })).toBeInTheDocument();
    expect(screen.queryByText(/TAL-/)).toBeNull();
    expect(window.location.hash).toBe("");
  });

  it("a malformed fragment never reaches the network", async () => {
    mountAt("#p_nope");
    expect(await screen.findByRole("heading", { name: c.invalidTitle })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("an order past the payment stage (409) gets its own safe state", async () => {
    fetchMock.mockResolvedValue(json({ error: "payment_not_accepted" }, 409));
    mountAt(`#p_${TOKEN}`);
    expect(await screen.findByRole("heading", { name: c.notPayableTitle })).toBeInTheDocument();
  });

  it("a network failure offers a retry that re-exchanges the in-memory token", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValue(json(view()));
    mountAt(`#p_${TOKEN}`);
    fireEvent.click(await screen.findByRole("button", { name: c.retry }));
    expect(await screen.findByText("TAL-2026-0142")).toBeInTheDocument();
    const exchanges = calls("/v1/payment/session");
    expect(exchanges).toHaveLength(2);
    expect(JSON.parse(exchanges[1]![1].body)).toEqual({ resumeToken: TOKEN });
  });

  it("without a fragment it resumes the existing cookie session (GET, credentials included)", async () => {
    fetchMock.mockResolvedValue(json(view()));
    mountAt("");
    expect(await screen.findByText("TAL-2026-0142")).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe(`${API}/v1/payment`);
    expect(init.credentials).toBe("include");
    expect(calls("/v1/payment/session")).toHaveLength(0);
  });
});

describe("PaymentPage — receipt", () => {
  it("opens the payment attempt, then uploads the receipt bound to it", async () => {
    const submitted = view({
      lifecycleStatus: "PAYMENT_SUBMITTED",
      attempt: { attemptNo: 1, status: "SUBMITTED", receiptSubmitted: true, submittedAt: "2026-09-24T10:00:00.000Z" },
    });
    fetchMock
      .mockResolvedValueOnce(json(view())) // exchange
      .mockResolvedValueOnce(json(view({ attempt: { attemptNo: 1, status: "PENDING", receiptSubmitted: false, submittedAt: null } }), 201))
      .mockResolvedValueOnce(json(submitted, 201));
    const { container } = mountAt(`#p_${TOKEN}`);
    await screen.findByText("TAL-2026-0142");

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["%PDF-1.4 receipt"], "chek.pdf", { type: "application/pdf" });
    await userEvent.upload(input, file);
    expect(screen.getByTestId("receipt-name")).toHaveTextContent("chek.pdf");
    fireEvent.click(screen.getByRole("button", { name: c.submitPayment }));

    expect(await screen.findByRole("heading", { name: "To‘lov tekshirilmoqda" })).toBeInTheDocument();

    const [attempt] = calls("/v1/payment/attempts");
    expect(attempt![1].credentials).toBe("include");
    expect(attempt![1].headers["x-talimoon-payment"]).toBe("1");
    const attemptBody = JSON.parse(attempt![1].body);
    expect(Object.keys(attemptBody)).toEqual(["idempotencyKey"]); // no amount, no order, no attempt id

    const [receipt] = calls("/v1/payment/receipt");
    const receiptUrl = new URL(String(receipt![0]));
    expect([...receiptUrl.searchParams.keys()]).toEqual(["receiptKey"]);
    expect(receipt![1].credentials).toBe("include");
    expect(receipt![1].headers["x-talimoon-payment"]).toBe("1");
    expect((receipt![1].body as FormData).get("file")).toBeInstanceOf(File);

    // order: attempt first, then the receipt
    const order = fetchMock.mock.calls.map(([u]) => new URL(String(u)).pathname);
    expect(order).toEqual(["/v1/payment/session", "/v1/payment/attempts", "/v1/payment/receipt"]);
  });

  it("the submitted state never says production started", async () => {
    fetchMock.mockResolvedValue(
      json(view({ lifecycleStatus: "PAYMENT_SUBMITTED", attempt: { attemptNo: 1, status: "SUBMITTED", receiptSubmitted: true, submittedAt: null } })),
    );
    mountAt(`#p_${TOKEN}`);
    expect(await screen.findByRole("heading", { name: "To‘lov tekshirilmoqda" })).toBeInTheDocument();
    expect(screen.getByText(c.submittedBody)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Tayyorlanmoqda|Ishlab chiqarish boshlandi|7[–-]10 kun/);
    expect(screen.queryByRole("button", { name: c.submitPayment })).toBeNull();
  });

  it("rejects a non-image, non-PDF file locally", async () => {
    fetchMock.mockResolvedValue(json(view()));
    const { container } = mountAt(`#p_${TOKEN}`);
    await screen.findByText("TAL-2026-0142");
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, new File(["x"], "a.txt", { type: "text/plain" }), { applyAccept: false });
    expect(screen.getByRole("alert")).toHaveTextContent(c.receiptNotAllowed);
    expect(calls("/v1/payment/attempts")).toHaveLength(0);
  });
});

describe("PaymentPage — status copy", () => {
  it("PAID and IN_PRODUCTION render distinctly", async () => {
    fetchMock.mockResolvedValue(json(view({ lifecycleStatus: "PAID", acceptsPayment: false, paymentConfirmed: true })));
    const first = mountAt("");
    expect(await screen.findByRole("heading", { name: "To‘lov tasdiqlandi" })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Tayyorlanmoqda/);
    first.unmount();

    fetchMock.mockResolvedValue(json(view({ lifecycleStatus: "IN_PRODUCTION", acceptsPayment: false, productionStarted: true })));
    mountAt("");
    expect(await screen.findByRole("heading", { name: "Tayyorlanmoqda" })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("To‘lov tasdiqlandi")).toBeNull());
  });
});
