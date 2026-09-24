// orderFormData.ts
// Single source of truth for order-form copy, pricing, and step config.
// Mirrors nasiha_bot's lang.py pricing logic — keep both in sync if prices change.
//
// Bilingual fields carry both `en`/`uz` (or `label`/`labelUz`, etc.) directly
// on the same record, rather than two parallel arrays — this project's other
// per-item bilingual data (e.g. RealTalimoonMoments' MOMENT_COPY_UZ) keys a
// separate lookup by id instead, but everything here is a fixed, small,
// closed list (never fetched/filtered by id elsewhere), so co-locating both
// languages on one object is simpler and keeps a price change or a wording
// fix a one-line diff instead of two arrays to keep in sync by hand.
//
// This file stays a plain .ts module (no JSX) even though it imports
// lucide-react icon *components* for STEPS — importing a component
// reference isn't JSX, so the extension doesn't need to change, and every
// consumer of STEPS gets the icon and its copy from one place instead of
// a second array to keep index-aligned by hand.

import type { LucideIcon } from "lucide-react";
import { Globe, Heart, Camera, PenLine } from "lucide-react";

export type BookType = "single" | "multi";

// ════════════════════════════════════════════════════════════════════
//  MARKET-AWARE COMMERCIAL PRICING — the single source of truth.
// ════════════════════════════════════════════════════════════════════
// TALIMOON is an international product with TWO commercial markets and
// two INDEPENDENTLY defined price lists. These are business prices, not
// an FX conversion — nothing here fetches a rate or derives USD from
// UZS. One order is always ONE market and ONE currency; the two never
// mix. `market` follows from the destination country ("UZ" for
// Uzbekistan, "INTERNATIONAL" for everywhere else), never from the
// site UI language.
export type Market = "UZ" | "INTERNATIONAL";
export type Currency = "UZS" | "USD";

interface MarketPricing {
  currency: Currency;
  /** One-child personalised book — the first printed copy is included. */
  single: number;
  /** Multi-child personalised book — the first printed copy is included. */
  multi: number;
  /** Each ADDITIONAL printed copy beyond the included first one. */
  extraCopy: number;
  delivery: {
    /** UZ: flat fee for any supported region EXCEPT Toshkent city
     *  (which is free). INTERNATIONAL: flat postal fee PER ORDER —
     *  never multiplied by copies or children. */
    fee: number;
  };
}

export const MARKET_PRICING: Record<Market, MarketPricing> = {
  UZ: {
    currency: "UZS",
    single: 499_000,
    multi: 699_000,
    extraCopy: 300_000,
    delivery: { fee: 40_000 },
  },
  INTERNATIONAL: {
    currency: "USD",
    single: 49,
    multi: 69,
    extraCopy: 30,
    delivery: { fee: 15 },
  },
} as const;

/** Book meta (page counts, labels) is market-independent; the numeric
 *  base/extra-copy/delivery live in {@link MARKET_PRICING}. Kept as
 *  `PRICING` for the many call sites that only need the UZ numbers or
 *  the labels — its numbers deliberately mirror `MARKET_PRICING.UZ`. */
export const PRICING = {
  single: {
    base: MARKET_PRICING.UZ.single,
    pages: "15–20",
    label: "One child",
    labelUz: "Bitta farzand",
  },
  multi: {
    base: MARKET_PRICING.UZ.multi,
    pages: "25–30",
    label: "Multiple children",
    labelUz: "Bir nechta farzand",
  },
  extraCopy: MARKET_PRICING.UZ.extraCopy,
  /** Flat fee for delivery to any supported region except Toshkent city. */
  regionalDelivery: MARKET_PRICING.UZ.delivery.fee,
} as const;

export function currencyForMarket(market: Market): Currency {
  return MARKET_PRICING[market].currency;
}

/** Destination country → commercial market. Uzbekistan is the only
 *  country in the UZ market; every other supported country is
 *  INTERNATIONAL. `""` / unknown defaults to UZ (the home market). */
export function marketForCountry(countryCode: string): Market {
  return countryCode.toUpperCase() === "UZ" || countryCode === ""
    ? "UZ"
    : "INTERNATIONAL";
}

/** Base book price for a market + book type (the included first copy). */
export function bookBasePrice(market: Market, bookType: BookType): number {
  return MARKET_PRICING[market][bookType];
}

/** Book price only — base + each ADDITIONAL copy. Delivery is separate,
 *  see {@link calculateOrderTotal}. Defaults to the UZ market so the
 *  older call sites keep working unchanged. */
export function calculatePrice(
  bookType: BookType,
  copies: number,
  market: Market = "UZ",
): number {
  const p = MARKET_PRICING[market];
  return p[bookType] + Math.max(0, copies - 1) * p.extraCopy;
}

/** "499 000 so'm" — Uzbek-market money. */
export function formatSom(amount: number): string {
  return amount.toLocaleString("en-US").replace(/,/g, " ") + " so'm";
}

/** Currency-aware formatting. UZS → "499 000 so'm"; USD → "$49" (whole
 *  dollars — every international price is an integer, so no decimals in
 *  the UI and no floating-point money maths anywhere). */
export function formatMoney(amount: number, currency: Currency): string {
  if (currency === "USD") {
    const n = Math.round(amount);
    return "$" + n.toLocaleString("en-US");
  }
  return formatSom(amount);
}

// ── Delivery regions (Uzbekistan) — stable codes are the business
//    identity; display labels never drive logic. Toshkent SHAHRI and
//    Toshkent VILOYATI are deliberately separate codes: the city is
//    free, the region is not.
export type DeliveryRegionCode =
  | "tashkent_city"
  | "tashkent_region"
  | "andijan"
  | "bukhara"
  | "fergana"
  | "jizzakh"
  | "khorezm"
  | "namangan"
  | "navoi"
  | "kashkadarya"
  | "karakalpakstan"
  | "samarkand"
  | "sirdarya"
  | "surkhandarya";

export interface DeliveryRegion {
  code: DeliveryRegionCode;
  label: string;
  labelUz: string;
}

export const DELIVERY_REGIONS: readonly DeliveryRegion[] = [
  { code: "tashkent_city", label: "Tashkent (city)", labelUz: "Toshkent shahri" },
  { code: "tashkent_region", label: "Tashkent region", labelUz: "Toshkent viloyati" },
  { code: "andijan", label: "Andijan", labelUz: "Andijon viloyati" },
  { code: "bukhara", label: "Bukhara", labelUz: "Buxoro viloyati" },
  { code: "fergana", label: "Fergana", labelUz: "Farg‘ona viloyati" },
  { code: "jizzakh", label: "Jizzakh", labelUz: "Jizzax viloyati" },
  { code: "khorezm", label: "Khorezm", labelUz: "Xorazm viloyati" },
  { code: "namangan", label: "Namangan", labelUz: "Namangan viloyati" },
  { code: "navoi", label: "Navoi", labelUz: "Navoiy viloyati" },
  { code: "kashkadarya", label: "Kashkadarya", labelUz: "Qashqadaryo viloyati" },
  { code: "karakalpakstan", label: "Karakalpakstan", labelUz: "Qoraqalpog‘iston" },
  { code: "samarkand", label: "Samarkand", labelUz: "Samarqand viloyati" },
  { code: "sirdarya", label: "Sirdarya", labelUz: "Sirdaryo viloyati" },
  { code: "surkhandarya", label: "Surkhandarya", labelUz: "Surxondaryo viloyati" },
] as const;

/** Codes with free delivery. */
export const FREE_DELIVERY_REGIONS: readonly DeliveryRegionCode[] = ["tashkent_city"];

export function isDeliveryRegionCode(v: string): v is DeliveryRegionCode {
  return DELIVERY_REGIONS.some((r) => r.code === v);
}

export function deliveryRegionLabel(code: string, locale: "uz" | "en" | "ru"): string {
  const r = DELIVERY_REGIONS.find((x) => x.code === code);
  if (!r) return "";
  return locale === "uz" ? r.labelUz : r.label;
}

/** The delivery fee for a region CODE — never a free-text string.
 *  Empty / unknown code → 0. */
export function deliveryFeeFor(regionCode: string): number {
  if (!regionCode || !isDeliveryRegionCode(regionCode)) return 0;
  return FREE_DELIVERY_REGIONS.includes(regionCode) ? 0 : PRICING.regionalDelivery;
}

export interface OrderTotals {
  market: Market;
  currency: Currency;
  bookSubtotal: number;
  extraCopyUnitPrice: number;
  extraCopyCount: number;
  extraCopiesSubtotal: number;
  deliveryFee: number;
  grandTotal: number;
}

/** THE deterministic order total. Every UI surface (review breakdown,
 *  payment amount, the submitted-order pricing snapshot) derives from
 *  this one function — no component recomputes pieces on its own. The
 *  whole result is in ONE currency, decided by `market`. */
export function calculateOrderTotal(opts: {
  /** Defaults to the home market so pre-market call sites keep working. */
  market?: Market;
  bookType: BookType;
  copies: number;
  deliveryRequired: boolean;
  /** UZ market only — region CODE drives the fee. Ignored elsewhere. */
  regionCode?: string;
}): OrderTotals {
  const market: Market = opts.market ?? "UZ";
  const p = MARKET_PRICING[market];
  const bookSubtotal = p[opts.bookType];
  const extraCopyCount = Math.max(0, opts.copies - 1);
  const extraCopiesSubtotal = extraCopyCount * p.extraCopy;

  let deliveryFee = 0;
  if (opts.deliveryRequired) {
    // UZ: Toshkent city is free, every other region is the flat fee.
    // INTERNATIONAL: one flat postal fee for the whole order.
    deliveryFee =
      market === "UZ"
        ? deliveryFeeFor(opts.regionCode ?? "")
        : p.delivery.fee;
  }

  return {
    market,
    currency: p.currency,
    bookSubtotal,
    extraCopyUnitPrice: p.extraCopy,
    extraCopyCount,
    extraCopiesSubtotal,
    deliveryFee,
    grandTotal: bookSubtotal + extraCopiesSubtotal + deliveryFee,
  };
}

// ── Destination countries ───────────────────────────────────────────
// Stable ISO 3166-1 alpha-2 codes are the business identity; the
// display label is localised and never drives logic. Uzbekistan maps
// to the UZ market; every other country maps to INTERNATIONAL. New
// markets (GCC, US, EU, UK …) can be split out later without touching
// the order flow — they would just stop resolving to INTERNATIONAL here.
export interface CountryOption {
  code: string;
  label: string;
  labelUz: string;
}

export const COUNTRIES: readonly CountryOption[] = [
  { code: "UZ", label: "Uzbekistan", labelUz: "O‘zbekiston" },
  { code: "KZ", label: "Kazakhstan", labelUz: "Qozog‘iston" },
  { code: "KG", label: "Kyrgyzstan", labelUz: "Qirg‘iziston" },
  { code: "TJ", label: "Tajikistan", labelUz: "Tojikiston" },
  { code: "TM", label: "Turkmenistan", labelUz: "Turkmaniston" },
  { code: "RU", label: "Russia", labelUz: "Rossiya" },
  { code: "TR", label: "Türkiye", labelUz: "Turkiya" },
  { code: "AE", label: "United Arab Emirates", labelUz: "Birlashgan Arab Amirliklari" },
  { code: "SA", label: "Saudi Arabia", labelUz: "Saudiya Arabistoni" },
  { code: "QA", label: "Qatar", labelUz: "Qatar" },
  { code: "KW", label: "Kuwait", labelUz: "Quvayt" },
  { code: "US", label: "United States", labelUz: "AQSH" },
  { code: "GB", label: "United Kingdom", labelUz: "Buyuk Britaniya" },
  { code: "DE", label: "Germany", labelUz: "Germaniya" },
  { code: "FR", label: "France", labelUz: "Fransiya" },
  { code: "KR", label: "South Korea", labelUz: "Janubiy Koreya" },
  { code: "CA", label: "Canada", labelUz: "Kanada" },
  { code: "OTHER", label: "Another country", labelUz: "Boshqa davlat" },
];

export function countryLabel(code: string, locale: "uz" | "en" | "ru"): string {
  const c = COUNTRIES.find((x) => x.code === code);
  if (!c) return "";
  return locale === "uz" ? c.labelUz : c.label;
}

// ── Submitted-order pricing snapshot ───────────────────────────────
// A submitted order must PRESERVE the prices that applied when it was
// sent — never recalculated from a later config (spec §36–37). This is
// the shape the backend/order payload stores alongside the order.
export interface OrderPricingSnapshot {
  market: Market;
  countryCode: string;
  currency: Currency;
  bookType: BookType;
  baseBookPrice: number;
  extraCopyCount: number;
  extraCopyUnitPrice: number;
  extraCopiesSubtotal: number;
  deliveryRequired: boolean;
  deliveryType: "pickup" | "regional" | "tashkent_city" | "international_postal" | "none";
  deliveryFee: number;
  grandTotal: number;
}

export function buildPricingSnapshot(opts: {
  market: Market;
  countryCode: string;
  bookType: BookType;
  copies: number;
  deliveryRequired: boolean;
  regionCode?: string;
}): OrderPricingSnapshot {
  const totals = calculateOrderTotal(opts);
  let deliveryType: OrderPricingSnapshot["deliveryType"] = "none";
  if (opts.deliveryRequired) {
    if (opts.market === "INTERNATIONAL") deliveryType = "international_postal";
    else if (opts.regionCode === "tashkent_city") deliveryType = "tashkent_city";
    else deliveryType = "regional";
  } else {
    deliveryType = "pickup";
  }
  return {
    market: totals.market,
    countryCode: opts.countryCode,
    currency: totals.currency,
    bookType: opts.bookType,
    baseBookPrice: totals.bookSubtotal,
    extraCopyCount: totals.extraCopyCount,
    extraCopyUnitPrice: totals.extraCopyUnitPrice,
    extraCopiesSubtotal: totals.extraCopiesSubtotal,
    deliveryRequired: opts.deliveryRequired,
    deliveryType,
    deliveryFee: totals.deliveryFee,
    grandTotal: totals.grandTotal,
  };
}

export const TRAITS = [
  { id: "learning", en: "Love of learning", uz: "Bilimga ishtiyoq", ru: "Любовь к знаниям" },
  { id: "responsibility", en: "Responsibility", uz: "Mas'uliyat", ru: "Ответственность" },
  { id: "patience", en: "Patience", uz: "Sabr-toqat", ru: "Терпение" },
  { id: "gratitude", en: "Gratitude", uz: "Minnatdorchilik", ru: "Благодарность" },
  { id: "courage", en: "Courage", uz: "Jasorat", ru: "Смелость" },
  { id: "kindness", en: "Kindness", uz: "Mehribonlik", ru: "Доброта" },
  { id: "cleanliness", en: "Cleanliness", uz: "Ozodalik", ru: "Опрятность" },
  { id: "manners", en: "Good manners", uz: "Odob-axloq", ru: "Хорошие манеры" },
] as const;

export type TraitId = (typeof TRAITS)[number]["id"];

export const MAX_TRAITS = 3;

// ── Book output language (spec §39–41) — the language the printed book
//    is written in, NOT the site UI language. Stable machine `code` is
//    the backend identity; `label` is shown in the language's own
//    script, never translated. `status: "soon"` renders disabled with a
//    "Tez orada" tag and cannot be ordered (spec §40). Only "available"
//    languages are production-supported; they must equal
//    BACKEND_BOOK_LANGUAGES in lib/order/api.ts (enforced by
//    lib/order/__tests__/bookLanguage-contract.test.ts).
export type BookLanguageCode = "uz" | "en" | "ru" | "kk" | "ky" | "tg" | "ar";

export interface BookLanguageOption {
  code: BookLanguageCode;
  label: string;
  status: "available" | "soon";
}

export const BOOK_LANGUAGE_OPTIONS: readonly BookLanguageOption[] = [
  { code: "uz", label: "O‘zbekcha", status: "available" },
  { code: "en", label: "English", status: "available" },
  { code: "ru", label: "Русский", status: "available" },
  { code: "kk", label: "Қазақша", status: "soon" },
  { code: "ky", label: "Кыргызча", status: "soon" },
  { code: "tg", label: "Тоҷикӣ", status: "soon" },
  { code: "ar", label: "العربية", status: "soon" },
] as const;

export function bookLanguageLabel(code: string): string {
  return BOOK_LANGUAGE_OPTIONS.find((l) => l.code === code)?.label ?? "";
}

// ── Card-to-card transfer accounts (spec §10–11) ───────────────────
// Online automatic payment is NOT live yet; every order is paid by a
// card-to-card transfer to one of the accounts below, then a receipt
// is uploaded on the SEPARATE payment page (components/payment), after
// the order is saved — never inside the order form. Accounts are market-specific and never mixed on screen:
// a UZ order sees only the local card, an INTERNATIONAL order sees only
// the Visa / Mastercard cards.
//
// The card numbers here are FIXED business data:
//   • the local Uzbekistan card and the Mastercard number are the ones
//     that already existed in the flow — preserved verbatim, never
//     swapped or regenerated;
//   • the Visa number is the approved international card.
// Brand marks are rendered as restrained wordmarks (PaymentAccount) —
// swap in approved UZCARD / HUMO / Visa / Mastercard logo assets here
// if/when they are provided.
export type CardBrand = "uzcard" | "humo" | "visa" | "mastercard";

export interface PaymentAccount {
  /** Stable id — also scopes the "copied" state of its copy button. */
  id: string;
  /** Card number in human-readable four-digit groups. */
  number: string;
  /** Cardholder, shown exactly as written. */
  holder: string;
  /** Brand marks shown against THIS card (mapped one-to-one). */
  brands: CardBrand[];
}

export const PAYMENT_ACCOUNTS: Record<Market, readonly PaymentAccount[]> = {
  UZ: [
    {
      id: "uz-local-card",
      number: "9860 1701 1310 7875",
      holder: "Sh. Yunusov",
      brands: ["uzcard", "humo"],
    },
  ],
  INTERNATIONAL: [
    {
      id: "intl-visa",
      number: "4023 0601 2264 2365",
      holder: "Sh. Yunusov",
      brands: ["visa"],
    },
    {
      id: "intl-mastercard",
      number: "5476 3800 9259 3482",
      holder: "Sh. Yunusov",
      brands: ["mastercard"],
    },
  ],
} as const;

/** Digits only — for copy-to-clipboard, so a bank app receives a clean
 *  string. The grouped form stays on screen for readability. */
export function cardDigits(number: string): string {
  return number.replace(/\D/g, "");
}

export const CARD_BRAND_LABEL: Record<CardBrand, string> = {
  uzcard: "UZCARD",
  humo: "HUMO",
  visa: "VISA",
  mastercard: "Mastercard",
};


/**
 * Wizard steps AFTER Phase 01 ("Siz bilan tanishamiz" — orderer name,
 * relationship, children's names + ages — handled by Phase01.tsx).
 * The conversational chapters and these steps together form the seven
 * JOURNEY_CHAPTERS in `@/lib/order/phase01-copy`; the per-step
 * `chapter` index below points into that list so the progress rail
 * stays in sync. Chapter 3 ("Ko‘ngil so‘zlari") is its own quiet
 * screen between "a personal touch" and the photos — see
 * EmotionalBridge.tsx — not a wizard step, so no entry here.
 */
export type StepId =
  | "personal-touch"
  | "photos"
  | "review"
  | "consent";

export interface StepConfig {
  id: StepId;
  title: string;
  titleUz: string;
  eyebrow: string;
  eyebrowUz: string;
  /** 0-based index into JOURNEY_CHAPTERS (chapter 0 is Phase 01). */
  chapter: number;
  /** Small circular badge above the step title — see PersonalizedBookOrderForm. */
  icon: LucideIcon;
}

export const STEPS: StepConfig[] = [
  { id: "personal-touch", chapter: 2, eyebrow: "A personal touch", eyebrowUz: "Shaxsiy jozibasi", title: "A personal touch", titleUz: "Shaxsiy jozibasi", icon: Heart },
  { id: "photos", chapter: 4, eyebrow: "Photos", eyebrowUz: "Suratlar", title: "Photos for the illustrations", titleUz: "Illyustratsiyalar uchun suratlar", icon: Camera },
  { id: "review", chapter: 5, eyebrow: "Review", eyebrowUz: "Ko'rib chiqamiz", title: "Delivery, language & review", titleUz: "Yetkazish, til va ko'rib chiqish", icon: Globe },
  // The last form section is consent + signature. Payment is NOT a form
  // step: the order is saved first, then paid on its own page
  // (/begin/personalized-book/payment).
  { id: "consent", chapter: 6, eyebrow: "Finish", eyebrowUz: "Yakun", title: "Consent & signature", titleUz: "Rozilik va imzo", icon: PenLine },
];
