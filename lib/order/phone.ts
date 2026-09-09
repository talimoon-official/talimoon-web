/**
 * Canonical customer phone handling for the order form.
 *
 * ONE number is collected per order. For an Uzbekistan order it is an
 * Uzbek mobile ("Telefon raqamingiz") reached later by SMS; for an
 * international order it is a WhatsApp-enabled number entered WITH its
 * country code ("WhatsApp raqamingiz") reached later on WhatsApp. The
 * SMS-vs-WhatsApp routing is decided downstream (talimoon-intake) purely
 * from the resulting E.164 value — this module's only job is to validate
 * the input for the selected market and return one canonical `+E.164`
 * string to submit.
 *
 * Parsing/validation is delegated to `libphonenumber-js` (real metadata,
 * per-country length rules) — no hand-rolled phone regex. `+998` is never
 * double-prepended; a foreign country code is never stripped or replaced.
 */

import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { Market } from "@/components/begin/orderFormData";

export type PhoneValidity =
  | "valid"
  | "empty"
  | "invalid"
  | "not-uz"; // a non-Uzbekistan number entered on an Uzbekistan order

export interface NormalizedPhone {
  /** true only when a canonical E.164 value is available. */
  ok: boolean;
  /** canonical `+<countrycode><national>` when `ok`, else null. */
  e164: string | null;
  validity: PhoneValidity;
}

const INVALID: NormalizedPhone = { ok: false, e164: null, validity: "invalid" };

/** Turn a leading international `00` prefix into `+`, and trim. Everything
 *  else is left for the parser. */
function preclean(raw: string): string {
  const t = (raw ?? "").trim();
  if (t.startsWith("00")) return `+${t.slice(2)}`;
  return t;
}

/**
 * Validate and canonicalise the order phone for the selected market.
 *
 *  - `UZ`            : accepts a local Uzbek mobile ("90 123 45 67"),
 *                     "+998…" or "998…"; the result MUST be a valid
 *                     Uzbekistan number, otherwise `not-uz` / `invalid`.
 *  - `INTERNATIONAL` : requires an explicit country code (a leading "+"
 *                     or "00"); the result must be a valid number for
 *                     that country. The country code is preserved as-is.
 */
export function normalizeOrderPhone(raw: string, market: Market): NormalizedPhone {
  const cleaned = preclean(raw);
  if (!cleaned || !/\d/.test(cleaned)) {
    return { ok: false, e164: null, validity: "empty" };
  }

  if (market === "UZ") {
    // Parse with UZ as the implied country so a bare national number works,
    // then fall back to a plain parse for an explicit "+998…" / "+<other>".
    const parsed =
      parsePhoneNumberFromString(cleaned, "UZ") ?? parsePhoneNumberFromString(cleaned);
    if (!parsed || !parsed.isValid()) return INVALID;
    if (parsed.countryCallingCode !== "998") {
      return { ok: false, e164: null, validity: "not-uz" };
    }
    return { ok: true, e164: parsed.number, validity: "valid" };
  }

  // INTERNATIONAL — an explicit country code is required.
  if (!cleaned.startsWith("+")) return INVALID;
  const parsed = parsePhoneNumberFromString(cleaned);
  if (!parsed || !parsed.isValid()) return INVALID;
  return { ok: true, e164: parsed.number, validity: "valid" };
}

/** Convenience: the canonical value to submit, or null when not valid. */
export function canonicalOrderPhone(raw: string, market: Market): string | null {
  return normalizeOrderPhone(raw, market).e164;
}
