import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { STEPS } from "../orderFormData";
import { emptyForm, isStepComplete } from "../PersonalizedBookOrderForm";
import { SignatureModel } from "@/lib/order/signaturePad";

const FORM_SOURCE = readFileSync(
  resolve(process.cwd(), "components/begin/PersonalizedBookOrderForm.tsx"),
  "utf8",
);

function inkedSignature(): string {
  const m = new SignatureModel();
  m.begin(0.1, 0.5);
  for (let i = 1; i <= 40; i++) m.extend(0.1 + i * 0.02, 0.5 + Math.sin(i / 3) * 0.2);
  m.end();
  return m.toJSON();
}

describe("order form — payment is no longer a form step", () => {
  it("the final form step is consent + signature, and there is no payment step", () => {
    expect(STEPS[STEPS.length - 1]!.id).toBe("consent");
    expect(STEPS.map((s) => s.id)).not.toContain("payment");
  });

  it("consent completes with the three affirmations + a drawn signature and NO receipt", () => {
    const data = {
      ...emptyForm("UZ"),
      consentAuthority: true,
      consentPrivacy: true,
      consentTerms: true,
      consentDrawnSignature: inkedSignature(),
    };
    expect("receipt" in data).toBe(false);
    expect(isStepComplete("consent", data)).toBe(true);
  });

  it("consent still requires every affirmation and real ink", () => {
    const base = {
      ...emptyForm("UZ"),
      consentAuthority: true,
      consentPrivacy: true,
      consentTerms: true,
      consentDrawnSignature: inkedSignature(),
    };
    expect(isStepComplete("consent", { ...base, consentTerms: false })).toBe(false);
    expect(isStepComplete("consent", { ...base, consentDrawnSignature: "" })).toBe(false);
  });

  it("the form's submit path never declares or uploads a receipt", () => {
    expect(FORM_SOURCE).not.toMatch(/kind:\s*"receipt"/);
    expect(FORM_SOURCE).not.toMatch(/hasReceipt/);
    expect(FORM_SOURCE).not.toMatch(/ReceiptUpload/);
    expect(FORM_SOURCE).not.toMatch(/data\.receipt/);
  });

  it("the form holds no payment-card UI or client price authority for payment", () => {
    expect(FORM_SOURCE).not.toMatch(/PAYMENT_ACCOUNTS/);
    expect(FORM_SOURCE).not.toMatch(/<PaymentAccount/);
    expect(FORM_SOURCE).not.toMatch(/paymentMethod/);
  });

  it("the form never persists the order or the resume capability", () => {
    expect(FORM_SOURCE).not.toMatch(/localStorage\.setItem|sessionStorage\.setItem/);
  });

  it("after finalize the form shows the saved screen, not a 'being prepared' screen", () => {
    expect(FORM_SOURCE).toMatch(/<OrderSaved/);
    expect(FORM_SOURCE).not.toMatch(/doneHeading|doneBody/);
  });
});
