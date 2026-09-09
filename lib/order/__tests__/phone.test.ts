import { describe, it, expect } from "vitest";
import { normalizeOrderPhone, canonicalOrderPhone } from "../phone";

describe("normalizeOrderPhone — Uzbekistan order", () => {
  it("accepts local, +998 and 998 forms and canonicalises to +998…", () => {
    expect(normalizeOrderPhone("901234567", "UZ")).toMatchObject({
      ok: true,
      e164: "+998901234567",
      validity: "valid",
    });
    expect(normalizeOrderPhone("+998 90 123 45 67", "UZ").e164).toBe("+998901234567");
    expect(normalizeOrderPhone("998901234567", "UZ").e164).toBe("+998901234567");
    expect(normalizeOrderPhone("00998901234567", "UZ").e164).toBe("+998901234567");
  });

  it("never double-prepends +998", () => {
    const r = normalizeOrderPhone("+998901234567", "UZ");
    expect(r.e164).toBe("+998901234567");
    expect(r.e164?.match(/998/g)?.length).toBe(1);
  });

  it("rejects a malformed Uzbek number", () => {
    expect(normalizeOrderPhone("12345", "UZ").ok).toBe(false);
    expect(normalizeOrderPhone("+998123", "UZ").ok).toBe(false);
    expect(normalizeOrderPhone("", "UZ")).toMatchObject({ ok: false, validity: "empty" });
    expect(normalizeOrderPhone("   ", "UZ").validity).toBe("empty");
  });

  it("flags a foreign country code entered on a UZ order as not-uz", () => {
    expect(normalizeOrderPhone("+97430528703", "UZ")).toMatchObject({
      ok: false,
      validity: "not-uz",
    });
  });
});

describe("normalizeOrderPhone — international order", () => {
  it("accepts a valid country-coded number and preserves the country code", () => {
    expect(normalizeOrderPhone("+974 3052 8703", "INTERNATIONAL")).toMatchObject({
      ok: true,
      e164: "+97430528703",
      validity: "valid",
    });
    expect(normalizeOrderPhone("+966512345678", "INTERNATIONAL").e164).toBe("+966512345678");
    expect(normalizeOrderPhone("+971501234567", "INTERNATIONAL").e164).toBe("+971501234567");
    expect(normalizeOrderPhone("+447911123456", "INTERNATIONAL").e164).toBe("+447911123456");
  });

  it("accepts a 00-prefixed international number", () => {
    expect(normalizeOrderPhone("0097430528703", "INTERNATIONAL").e164).toBe("+97430528703");
  });

  it("a +998 number stays valid on an international order (channel is decided from the number, not the market)", () => {
    expect(normalizeOrderPhone("+998901234567", "INTERNATIONAL")).toMatchObject({
      ok: true,
      e164: "+998901234567",
    });
  });

  it("requires an explicit country code — a bare national number is rejected", () => {
    expect(normalizeOrderPhone("55123456", "INTERNATIONAL").ok).toBe(false);
    expect(normalizeOrderPhone("3052 8703", "INTERNATIONAL").ok).toBe(false);
  });

  it("rejects an invalid country-coded number", () => {
    expect(normalizeOrderPhone("+55123456", "INTERNATIONAL").ok).toBe(false);
    expect(normalizeOrderPhone("+9999999999", "INTERNATIONAL").ok).toBe(false);
    expect(normalizeOrderPhone("", "INTERNATIONAL").validity).toBe("empty");
  });
});

describe("canonicalOrderPhone", () => {
  it("returns the E.164 value or null", () => {
    expect(canonicalOrderPhone("901234567", "UZ")).toBe("+998901234567");
    expect(canonicalOrderPhone("nope", "UZ")).toBeNull();
    expect(canonicalOrderPhone("+97430528703", "INTERNATIONAL")).toBe("+97430528703");
  });

  it("produces ONE canonical value regardless of the input spacing", () => {
    const forms = ["+998901234567", "998901234567", "+998 90 123 45 67", "00998901234567"];
    const out = new Set(forms.map((f) => canonicalOrderPhone(f, "UZ")));
    expect([...out]).toEqual(["+998901234567"]);
  });
});
