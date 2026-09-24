import { describe, it, expect, afterEach } from "vitest";
import { PAYMENT_PATH, paymentPath, paymentUrl, takePaymentFragment } from "../link";

const TOKEN = "A".repeat(20) + "b_c-" + "Z".repeat(19); // 43 base64url chars

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("payment link", () => {
  it("puts the token only in the fragment", () => {
    expect(TOKEN).toHaveLength(43);
    expect(paymentPath(TOKEN)).toBe(`${PAYMENT_PATH}#p_${TOKEN}`);
    const url = new URL(paymentUrl("https://talimoon.com/", TOKEN));
    expect(url.pathname).toBe(PAYMENT_PATH);
    expect(url.search).toBe("");
    expect(url.hash).toBe(`#p_${TOKEN}`);
  });

  it("takes the token and removes the fragment from the address bar", () => {
    window.history.replaceState(null, "", `${PAYMENT_PATH}?x=1#p_${TOKEN}`);
    expect(takePaymentFragment()).toEqual({ kind: "token", token: TOKEN });
    expect(window.location.hash).toBe("");
    expect(window.location.href).not.toContain(TOKEN);
    expect(window.location.pathname).toBe(PAYMENT_PATH);
    expect(window.location.search).toBe("?x=1");
  });

  it("rejects a malformed fragment locally — and still strips it", () => {
    window.history.replaceState(null, "", `${PAYMENT_PATH}#p_short`);
    expect(takePaymentFragment()).toEqual({ kind: "malformed" });
    expect(window.location.hash).toBe("");

    window.history.replaceState(null, "", `${PAYMENT_PATH}#${TOKEN}`);
    expect(takePaymentFragment()).toEqual({ kind: "malformed" });
  });

  it("reports no fragment when there is none", () => {
    window.history.replaceState(null, "", PAYMENT_PATH);
    expect(takePaymentFragment()).toEqual({ kind: "none" });
  });
});
