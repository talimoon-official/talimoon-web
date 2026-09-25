import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OrderSaved } from "../OrderSaved";
import { OrderPaths } from "../OrderPaths";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { PAYMENT_COPY } from "@/lib/payment/copy";

const c = PAYMENT_COPY.uz;
const RESUME = { token: "t".repeat(43), expiresAt: "2026-10-24T10:00:00.000Z" };
const CODE = { code: "K7M4P2", expiresAt: "2026-10-24T10:00:00.000Z" };
let writeText: ReturnType<typeof vi.fn>;
let setItem: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  setItem = vi.spyOn(Storage.prototype, "setItem");
});
afterEach(() => vi.restoreAllMocks());

function mount(delivery: Parameters<typeof OrderSaved>[0]["paymentCodeDelivery"] = { channel: "sms", status: "not_configured" }, navigate = vi.fn()) {
  render(
    <OrderSaved
      orderCode="TAL-2026-0013"
      resume={RESUME}
      paymentCode={CODE}
      paymentCodeDelivery={delivery}
      copy={c}
      locale="uz"
      navigate={navigate}
    />,
  );
  return navigate;
}

describe("saved screen — payment code", () => {
  it("shows order code AND payment code, the helper, and both CTAs", () => {
    mount();
    expect(screen.getByRole("heading", { name: "Buyurtmangiz saqlandi" })).toBeInTheDocument();
    expect(screen.getByText("TAL-2026-0013")).toBeInTheDocument();
    expect(screen.getByText("To‘lov kodi")).toBeInTheDocument();
    expect(screen.getByText("K7M 4P2")).toBeInTheDocument();
    expect(screen.getByText(/To‘lov kodini saqlab qo‘ying\. Keyinroq shu kod orqali buyurtmangizni ochib, to‘lovni davom ettirishingiz mumkin\./)).toBeInTheDocument();
    expect(screen.getByText("Keyinroq to‘lov qilish uchun shu kod kerak bo‘ladi.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hozir to‘lash" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keyinroq to‘lash" })).toBeInTheDocument();
  });

  it("copy copies the bare code (no display space)", async () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: c.copyCode }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("K7M4P2"));
  });

  it("never claims the code was sent unless the provider accepted it", () => {
    mount({ channel: "sms", status: "not_configured" });
    expect(screen.queryByText(c.deliveredSms)).toBeNull();
    expect(screen.getByText("To‘lov kodini saqlab qo‘ying.", { selector: "strong" })).toBeInTheDocument();
  });

  it("says SMS / WhatsApp only when accepted", () => {
    mount({ channel: "sms", status: "accepted" });
    expect(screen.getByText(/To‘lov kodi SMS orqali ham yuborildi\./)).toBeInTheDocument();
  });

  it("pay later: order code, payment code, talimoon.com/pay, calm copy — no refill, no production claim", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Keyinroq to‘lash" }));
    expect(screen.getByRole("heading", { name: "To‘lov kutilmoqda" })).toBeInTheDocument();
    expect(screen.getByText("Buyurtmangiz saqlangan. Uni qayta to‘ldirishingiz shart emas.")).toBeInTheDocument();
    expect(screen.getByText("Tayyorlash jarayoni to‘lov tasdiqlangandan keyin boshlanadi.")).toBeInTheDocument();
    expect(screen.getByText("TAL-2026-0013")).toBeInTheDocument();
    expect(screen.getByText("K7M 4P2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "talimoon.com/pay" })).toHaveAttribute("href", "/pay");
    expect(screen.getByText(/To‘lov kodini saqlab qo‘ying\. Keyinroq shu kod orqali saqlangan buyurtmangizni ochib, to‘lovni davom ettirasiz\./)).toBeInTheDocument();
    // with a code, the long personal link is no longer the main path
    expect(screen.queryByRole("button", { name: c.copyLink })).toBeNull();
    expect(document.body.textContent).not.toMatch(/Tayyorlanmoqda|Ishlab chiqarish boshlandi|7[–-]10 kun/);
  });

  it("never stores the code or the token", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Keyinroq to‘lash" }));
    for (const call of setItem.mock.calls) {
      expect(String(call[1])).not.toContain("K7M4P2");
      expect(String(call[1])).not.toContain(RESUME.token);
    }
  });
});

describe("/begin — two separate order paths", () => {
  it("offers a new order and a separate pay-for-existing path to /pay", () => {
    render(
      <LanguageProvider>
        <OrderPaths />
      </LanguageProvider>,
    );
    const newOrder = screen.getByRole("link", { name: /Yangi buyurtma/ });
    const existing = screen.getByRole("link", { name: /Oldingi buyurtma uchun to‘lov/ });
    expect(newOrder).toHaveAttribute("href", "/begin/personalized-book/price");
    expect(existing).toHaveAttribute("href", "/pay");
    expect(newOrder).toHaveTextContent("Farzandingiz uchun yangi shaxsiylashtirilgan kitob buyurtmasini boshlang.");
    expect(newOrder).toHaveTextContent("Yangi buyurtma berish");
    expect(existing).toHaveTextContent(
      "Avval formani yuborgan bo‘lsangiz, to‘lov kodini kiriting va saqlangan buyurtmangiz uchun to‘lovni davom ettiring.",
    );
    expect(existing).toHaveTextContent("To‘lovga o‘tish");
  });
});
