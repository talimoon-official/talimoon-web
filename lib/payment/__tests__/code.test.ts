import { describe, it, expect } from "vitest";
import {
  PAYMENT_CODE_ALPHABET,
  formatPaymentCode,
  isCompletePaymentCode,
  normalizePaymentCodeInput,
} from "../code";

describe("payment code input normalization", () => {
  it.each([
    ["k7m4p2", "K7M4P2"],
    ["K7M4P2", "K7M4P2"],
    ["k7-m4-p2", "K7M4P2"],
    ["K7 M4 P2", "K7M4P2"],
    ["  k7m4p2  ", "K7M4P2"],
    ["k7m4p2xyz", "K7M4P2"], // capped at 6
    ["k7", "K7"], // partial while typing
  ])("%j -> %j", (raw, out) => expect(normalizePaymentCodeInput(raw)).toBe(out));

  it("ignores characters that can never be in a code (never 'corrects' them)", () => {
    expect(normalizePaymentCodeInput("O0I1L5S")).toBe("");
    expect(normalizePaymentCodeInput("K7M4P0")).toBe("K7M4P");
    expect(normalizePaymentCodeInput("k7_m4.p2!")).toBe("K7M4P2");
  });

  it("mirrors the backend alphabet (29 symbols, no ambiguous ones)", () => {
    expect(PAYMENT_CODE_ALPHABET).toBe("ABCDEFGHJKMNPQRTUVWXYZ2346789");
  });

  it("a code is complete only at exactly 6 valid characters", () => {
    expect(isCompletePaymentCode("K7M4P2")).toBe(true);
    expect(isCompletePaymentCode("K7M4P")).toBe(false);
    expect(isCompletePaymentCode("K7M4PS")).toBe(false);
  });

  it("formats for display only", () => {
    expect(formatPaymentCode("K7M4P2")).toBe("K7M 4P2");
  });
});
