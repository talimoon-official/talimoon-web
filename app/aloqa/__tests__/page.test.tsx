import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AloqaPage from "../page";

/** base64url(JSON) — the exact scheme talimoon-intake `encodeAloqaPayload` uses. */
function frag(payload: Record<string, unknown>): string {
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `#${b64}`;
}

function setHash(h: string) {
  window.location.hash = h;
}

const SMS_PAYLOAD = {
  v: 1,
  action: "confirm",
  code: "TAL-2026-0127",
  name: "",
  phone: "998901234567",
  msg: "Assalomu alaykum, Sherzodbek. Buyurtmangiz tasdiqlandi. Buyurtma raqami: TAL-2026-0127",
  tg: "",
  channel: "sms",
};

const WA_PAYLOAD = { ...SMS_PAYLOAD, phone: "97430528703", channel: "whatsapp" };

beforeEach(() => {
  setHash("");
  vi.restoreAllMocks();
});

describe("/aloqa — routed channel handoff, never auto-send", () => {
  it("SMS route: primary action opens the SMS app, with copy helpers", async () => {
    setHash(frag(SMS_PAYLOAD));
    render(<AloqaPage />);

    const primary = await screen.findByRole("link", { name: /SMS ilovasida ochish/ });
    expect(primary.getAttribute("href")).toMatch(/^sms:998901234567[?&]body=/);
    // the prepared Uzbek text is carried, url-encoded, and NOT sent by the page
    expect(primary.getAttribute("href")).toContain(encodeURIComponent("Buyurtma raqami: TAL-2026-0127"));

    expect(screen.getByText(/SMS orqali yuboriladi/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Telefon raqamini nusxalash" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xabarni nusxalash" })).toBeInTheDocument();
  });

  it("WhatsApp route: primary action opens wa.me with the digits and text", async () => {
    setHash(frag(WA_PAYLOAD));
    render(<AloqaPage />);

    const primary = await screen.findByRole("link", { name: /WhatsApp'da ochish/ });
    expect(primary.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/97430528703\?text=/);
    expect(screen.getByText(/WhatsApp orqali yuboriladi/)).toBeInTheDocument();
  });

  it("every action is a link or a copy button — nothing submits or sends", async () => {
    setHash(frag(SMS_PAYLOAD));
    const { container } = render(<AloqaPage />);
    await screen.findByRole("link", { name: /SMS ilovasida ochish/ });

    expect(container.querySelector("form")).toBeNull();
    for (const a of container.querySelectorAll("a")) {
      expect(a.getAttribute("href") ?? "").toMatch(/^(sms:|https:\/\/wa\.me\/|https:\/\/t\.me\/)/);
    }
  });

  it("copy buttons use the clipboard (phone with a leading +, and the edited message)", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    setHash(frag(SMS_PAYLOAD));
    render(<AloqaPage />);
    await screen.findByRole("link", { name: /SMS ilovasida ochish/ });

    await userEvent.click(screen.getByRole("button", { name: "Telefon raqamini nusxalash" }));
    expect(writeText).toHaveBeenCalledWith("+998901234567");

    await userEvent.click(screen.getByRole("button", { name: "Xabarni nusxalash" }));
    expect(writeText).toHaveBeenLastCalledWith(SMS_PAYLOAD.msg);
  });

  it("a payload without an explicit channel falls back to a phone-based guess", async () => {
    const { channel, ...noChannel } = SMS_PAYLOAD;
    void channel;
    setHash(frag(noChannel));
    render(<AloqaPage />);
    // 998… -> SMS
    expect(await screen.findByRole("link", { name: /SMS ilovasida ochish/ })).toBeInTheDocument();
  });

  it("an empty / unreadable fragment shows a professional fallback, not a blank page", async () => {
    setHash("");
    render(<AloqaPage />);
    expect(await screen.findByText("Ma'lumot topilmadi")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
