"use client";

/**
 * PricingSection — TALIMOON personalized-books pricing step
 * ----------------------------------------------------------------
 * Two plan cards + the market/currency selector + the reassurance row.
 * Rendered on `/products/personalized-books` at `#pricing`. The order
 * journey's own choice screen (`/begin/personalized-book/price`,
 * PersonalizedBookPlans) shares its visual language and reads the same
 * data. There is no second pricing source of truth — all values, calculations,
 * market/currency/delivery logic and package definitions live in
 * `@/components/begin/orderFormData`.
 *
 * The "Choose …" buttons navigate to `/begin/personalized-book/form` —
 * the only route that renders the actual order form. This section never
 * renders the form itself; the chosen package is carried in memory
 * (lib/order/planIntent) and pre-seeds the form's child count.
 *
 * Container/spacing matches every other section on the product page
 * exactly (max-w-[1440px], px-5 md:px-10 lg:px-16, py-16 md:py-20
 * lg:py-28); the two plan cards nest a narrower max-w-3xl inside.
 */

import Link from "next/link";
import { Book, Clock, Copy, Truck, Image as ImageIcon, Users, User } from "lucide-react";
import { useLanguage, useT } from "@/lib/i18n/LanguageContext";
import {
  BookType,
  MARKET_PRICING,
  PRICING,
  formatMoney,
  type Market,
} from "@/components/begin/orderFormData";
import { useMarketPreference } from "@/lib/order/market";
import { setPlanIntent } from "@/lib/order/planIntent";

const PLANS: Array<{
  type: BookType;
  featured?: boolean;
  features: { icon: React.ElementType; text: string; textUz: string; textRu: string }[];
}> = [
  {
    type: "single",
    features: [
      {
        icon: User,
        text: "Your child as the story's hero",
        textUz: "Farzandingiz hikoyaning bosh qahramoni",
        textRu: "Ваш ребёнок в роли главного героя истории",
      },
      {
        icon: ImageIcon,
        text: "Custom illustrations from their photos",
        textUz: "Ularning suratlaridan yaratilgan maxsus illyustratsiyalar",
        textRu: "Индивидуальные иллюстрации по фотографиям Вашего ребёнка",
      },
      {
        icon: Book,
        text: "Hardcover keepsake edition",
        textUz: "Qattiq muqovali, umrbod saqlanadigan nashr",
        textRu: "Издание в твёрдом переплёте на долгую память",
      },
    ],
  },
  {
    type: "multi",
    featured: true,
    features: [
      {
        icon: Users,
        text: "All siblings woven into one story",
        textUz: "Barcha farzandlar bitta hikoyada birlashadi",
        textRu: "Все братья и сёстры в одной общей истории",
      },
      {
        icon: ImageIcon,
        text: "Custom illustrations from their photos",
        textUz: "Ularning suratlaridan yaratilgan maxsus illyustratsiyalar",
        textRu: "Индивидуальные иллюстрации по фотографиям Ваших детей",
      },
      {
        icon: Book,
        text: "Hardcover keepsake edition",
        textUz: "Qattiq muqovali, umrbod saqlanadigan nashr",
        textRu: "Издание в твёрдом переплёте на долгую память",
      },
    ],
  },
];

const CHROME_EN = {
  eyebrow: "Pricing",
  heading: "Simple, transparent pricing",
  subheading: "No hidden fees. Every book is made to order.",
  pagesStory: (pages: string) => `${pages} page personalized story`,
  choosePlan: (label: string) => `Choose ${label}`,
  mostChosen: "Most chosen",
  extraCopies: (amount: string) => `Extra copies: +${amount} each`,
  extraCopiesIntl: (amount: string) => `Additional copy — +${amount} each`,
  readyInUz: "Preparation time — 7–10 days",
  readyInIntl: "Preparation time — 15–25 days",
  marketUz: "Uzbekistan",
  marketIntl: "International",
  marketAria: "Order region",
  deliveryUz: "Delivery — free within Tashkent, 40 000 so‘m to other regions",
  deliveryIntl: "International delivery service — $15",
  badgeUrgency: "NOW ONLY",
  badgePercent: (pct: number) => `−${pct}%`,
  badgeSr: (pct: number, was: string) => `${pct}% off, now only — was ${was}`,
};

const CHROME_UZ: typeof CHROME_EN = {
  eyebrow: "Narxlar",
  heading: "Sodda va Shaffof narxlar",
  subheading: "Yashirin to'lovlar yo'q. Har bir kitob buyurtma asosida tayyorlanadi.",
  pagesStory: (pages) => `${pages} betlik shaxsiylashtirilgan hikoya`,
  choosePlan: (label) => `${label} tanlash`,
  mostChosen: "Eng ko'p tanlanadi",
  extraCopies: (amount) => `Qo'shimcha nusxalar: har biri +${amount}`,
  extraCopiesIntl: (amount) => `Qo‘shimcha nusxa — har biri +${amount}`,
  readyInUz: "Tayyorlash muddati — 7–10 kun",
  readyInIntl: "Tayyorlash muddati — 15–25 kun",
  marketUz: "O‘zbekiston",
  marketIntl: "Xalqaro",
  marketAria: "Buyurtma hududi",
  deliveryUz: "Yetkazib berish — Toshkent bo‘yicha bepul, boshqa viloyatlarga 40 000 so‘m",
  deliveryIntl: "Xalqaro yetkazib berish xizmati — $15",
  badgeUrgency: "FAQAT HOZIR",
  badgePercent: (pct) => `−${pct}%`,
  badgeSr: (pct, was) => `Faqat hozir ${pct}% chegirma — avvalgi narx ${was}`,
};

const CHROME_RU: typeof CHROME_EN = {
  eyebrow: "Цены",
  heading: "Простые, прозрачные цены",
  subheading: "Никаких скрытых платежей. Каждая книга создаётся на заказ.",
  pagesStory: (pages) => `Именная история объёмом ${pages} стр.`,
  choosePlan: (label) => `Выбрать «${label}»`,
  mostChosen: "Самый популярный",
  extraCopies: (amount) => `Дополнительные экземпляры: +${amount} за штуку`,
  extraCopiesIntl: (amount) => `Дополнительный экземпляр: +${amount} за штуку`,
  readyInUz: "Срок подготовки: 7–10 дней",
  readyInIntl: "Срок подготовки: 15–25 дней",
  marketUz: "Узбекистан",
  marketIntl: "Международный",
  marketAria: "Регион заказа",
  deliveryUz: "Доставка: бесплатно по Ташкенту, 40 000 сум в другие регионы",
  deliveryIntl: "Международная доставка: $15",
  badgeUrgency: "ТОЛЬКО СЕЙЧАС",
  badgePercent: (pct) => `−${pct}%`,
  badgeSr: (pct, was) => `Скидка ${pct}%, только сейчас, было ${was}`,
};

/** "499 000" — the bare number; the currency word is rendered
 *  separately so it can sit smaller. USD prices carry their own "$" and
 *  need no suffix. */
function priceParts(amount: number, market: Market): { value: string; unit: string } {
  if (market === "INTERNATIONAL") {
    return { value: formatMoney(amount, "USD"), unit: "" };
  }
  return { value: amount.toLocaleString("en-US").replace(/,/g, " "), unit: "so'm" };
}

/** Display-only "was" prices for the sales page's discount seal. NOT a
 *  real prior price point tracked in orderFormData.ts — the /begin flow
 *  always bills the live MARKET_PRICING. These are the exact values this
 *  page originally shipped with: they agree across commit 11afe7a
 *  (ORIGINAL_PRICE) and 7e4387f (ANCHOR_PRICE). The saving % shown on
 *  the seal is derived from these, never hardcoded. */
const ANCHOR_PRICE: Record<Market, Record<BookType, number>> = {
  UZ: { single: 600_000, multi: 850_000 },
  INTERNATIONAL: { single: 59, multi: 84 },
};

/** Discount seal — a compact vertical marker beside the live price that
 *  says the offer is active RIGHT NOW: a small "FAQAT HOZIR" over a
 *  dominant "−17%". Deep-navy base, one thin gold hairline, warm
 *  cream/gold type, a whisper of depth. No starburst, no red, no
 *  supermarket-sticker energy, no animation. Decorative: aria-hidden,
 *  with the saving spoken in an sr-only line beside the price. */
function SavingsBadge({
  urgency,
  percent,
  featured,
}: {
  urgency: string;
  percent: string;
  featured?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={[
        "inline-flex shrink-0 select-none items-center justify-center gap-1.5 rounded-full border px-2.5 py-1.5 text-center leading-none",
        featured
          ? "border-[color:var(--gold-highlight)]/50 bg-[color:var(--gold-mid)]/[0.10] text-[color:var(--gold-highlight)]"
          : "border-[color:var(--gold-mid)]/35 bg-[color:var(--gold-mid)]/[0.08] text-[color:var(--gold-shadow)]",
      ].join(" ")}
    >
      <span className="font-sans text-[8.5px] font-semibold uppercase tracking-[0.14em]">
        {urgency}
      </span>
      <span className="font-display text-[14px] font-semibold tracking-[-0.01em]">
        {percent}
      </span>
    </span>
  );
}

// The exact same gold recipe as .tm-cta-gold (globals.css §27), so the
// featured card's border reads as the same "gold effect" as the CTA
// buttons, not just a color from the same family. Duplicated as a
// literal here rather than shared: .tm-cta-gold's background-image is a
// flat button fill, while this is a gradient BORDER via the standard
// two-layer background-origin/background-clip technique (border-image
// would ignore rounded-lg's corner radius entirely) — different enough
// mechanisms that reusing one declaration between them isn't practical.
const GOLD_GRADIENT =
  "linear-gradient(135deg, var(--gold-shadow) 0%, var(--gold-base) 20%, var(--gold-mid) 38%, var(--gold-highlight) 50%, var(--gold-mid) 62%, var(--gold-base) 80%, var(--gold-shadow) 100%)";

export default function PricingSection() {
  const { language } = useLanguage();
  const t = useT(CHROME_EN, CHROME_UZ, CHROME_RU);
  // Which MARKET the visitor is pricing for — not a currency picker.
  // Persisted (useMarketPreference) so the choice carries across the
  // page AND into the order form, which reads the same preference — no
  // extra state is passed to the form route.
  const { preference, setPreference } = useMarketPreference();
  const market: Market = preference ?? "UZ";

  return (
    <section id="pricing" className="w-full bg-surface-base pb-14 pt-16 md:pb-16 md:pt-20 lg:pb-16 lg:pt-20">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10 lg:px-16">
        <div className="mx-auto max-w-lg text-center">
          <p className="mb-3 font-sans text-[13px] font-medium uppercase tracking-[0.16em] text-accent-primary">
            {t.eyebrow}
          </p>
          <h2 className="font-display text-[30px] font-medium leading-[1.15] tracking-tight text-text-primary sm:text-[36px]">
            {t.heading}
          </h2>
          <p className="mt-3 font-sans text-[14px] leading-[1.6] text-text-secondary">{t.subheading}</p>
        </div>

        {/* Market selector — small, editorial, obviously a choice of
            where the order is for, not a currency toggle (spec §5). */}
        <div
          role="radiogroup"
          aria-label={t.marketAria}
          className="mx-auto mt-7 flex w-fit items-center gap-1 rounded-full border border-border-default p-1"
        >
          {(["UZ", "INTERNATIONAL"] as const).map((m) => {
            const on = market === m;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setPreference(m)}
                className={[
                  "rounded-full px-4 py-1.5 font-sans text-[12.5px] transition-colors duration-200 motion-reduce:transition-none",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary",
                  on
                    ? "bg-accent-primary/[0.16] font-semibold text-text-primary"
                    : "font-medium text-text-secondary hover:text-text-primary",
                ].join(" ")}
              >
                {m === "UZ" ? t.marketUz : t.marketIntl}
              </button>
            );
          })}
        </div>

        <div className="mx-auto mt-12 grid max-w-[880px] gap-5 sm:grid-cols-[0.92fr_1.08fr] sm:items-stretch">
          {PLANS.map((plan) => {
            const info = PRICING[plan.type];
            const label = language === "UZ" ? info.labelUz : info.label;
            const base = MARKET_PRICING[market][plan.type];
            const priced = priceParts(base, market);
            const anchor = ANCHOR_PRICE[market][plan.type];
            const savingPct = anchor > base ? Math.round(((anchor - base) / anchor) * 100) : 0;
            const hasDiscount = savingPct > 0;
            const anchorPriced = priceParts(anchor, market);
            const anchorText = anchorPriced.unit
              ? `${anchorPriced.value} ${anchorPriced.unit}`
              : anchorPriced.value;
            return (
              <div
                key={plan.type}
                className={[
                  "relative flex flex-col rounded-[18px] p-7 transition-[transform,box-shadow] duration-300 motion-reduce:transition-none",
                  plan.featured
                    ? "order-first min-h-[450px] border-[1.5px] border-transparent bg-[color:var(--surface-contrast)] text-surface-base shadow-[0_30px_65px_-32px_rgba(21,34,53,0.65)] sm:order-none sm:-mt-3 sm:min-h-[470px] sm:p-9"
                    : "min-h-[430px] border border-[color:var(--gold-mid)]/20 bg-surface-overlay shadow-[0_18px_48px_-34px_rgba(28,42,58,0.30)] sm:hover:-translate-y-1 sm:hover:shadow-[0_24px_54px_-32px_rgba(28,42,58,0.34)]",
                ].join(" ")}
                style={
                  plan.featured
                    ? {
                        backgroundImage: `linear-gradient(145deg, #223249 0%, #152235 100%), ${GOLD_GRADIENT}`,
                        backgroundOrigin: "border-box",
                        backgroundClip: "padding-box, border-box",
                      }
                    : undefined
                }
              >
                {/* Plan label + (featured) an integrated "most chosen"
                    micro-chip — part of the card's header row, not a
                    sticker pinned over the border. */}
                <div className="flex items-center justify-between gap-3">
                  <span className={`font-sans text-[11.5px] font-medium uppercase tracking-[0.14em] ${plan.featured ? "text-[color:var(--gold-highlight)]/80" : "text-text-secondary"}`}>
                    {label}
                  </span>
                  {plan.featured && (
                    <span className="shrink-0 rounded-full border border-[color:var(--gold-highlight)]/45 bg-[color:var(--gold-mid)]/[0.09] px-2.5 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-[color:var(--gold-highlight)]">
                      {t.mostChosen}
                    </span>
                  )}
                </div>

                {/* Price hierarchy (identical in both cards):
                    live price + savings badge on one line → struck "was"
                    price → short descriptor → hairline → features → CTA.
                    flex-wrap lets the badge drop under the price on a very
                    narrow card instead of overflowing. */}
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className={`font-display text-[32px] font-medium leading-none tracking-[-0.025em] sm:text-[36px] ${plan.featured ? "text-surface-base" : "text-text-primary"}`}>
                    {priced.value}
                    {priced.unit && (
                      <span className={`font-sans text-[13px] font-normal ${plan.featured ? "text-surface-base/70" : "text-text-secondary"}`}> {priced.unit}</span>
                    )}
                  </span>
                  {hasDiscount && (
                    <>
                      <SavingsBadge
                        urgency={t.badgeUrgency}
                        percent={t.badgePercent(savingPct)}
                        featured={plan.featured}
                      />
                      <span className="sr-only">{t.badgeSr(savingPct, anchorText)}</span>
                    </>
                  )}
                </div>

                {hasDiscount && (
                  <div className="mt-2">
                    <span className={`font-sans text-[15px] line-through ${plan.featured ? "text-surface-base/45" : "text-text-muted"}`}>
                      {anchorText}
                    </span>
                  </div>
                )}

                <p className={`${hasDiscount ? "mt-2.5" : "mt-2"} font-sans text-[12.5px] ${plan.featured ? "text-surface-base/68" : "text-text-secondary"}`}>
                  {t.pagesStory(info.pages)}
                </p>

                <div className={`mt-6 flex-1 border-t pt-4 ${plan.featured ? "border-[color:var(--gold-mid)]/20" : "border-border-subtle"}`}>
                  {plan.features.map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <div
                        key={i}
                        className={["flex items-start gap-2.5 py-2.5", i === 0 ? "" : plan.featured ? "border-t border-surface-base/10" : "border-t border-border-subtle"].join(" ")}
                      >
                        <Icon size={16} strokeWidth={1.5} className={`mt-0.5 shrink-0 ${plan.featured ? "text-[color:var(--gold-highlight)]" : "text-accent-primary"}`} />
                        <span className={`font-sans text-[13px] leading-[1.45] ${plan.featured ? "text-surface-base/88" : "text-text-primary"}`}>
                          {language === "UZ" ? f.textUz : language === "RU" ? f.textRu : f.text}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <Link
                  href="/begin/personalized-book/form"
                  // carry the chosen plan into the form (memory only)
                  onClick={() => setPlanIntent(plan.type)}
                  className={[
                    "tm-cta-gold mt-6 flex h-12 w-full items-center justify-center rounded-lg font-sans text-[13.5px] font-medium tracking-[0.015em] transition-all duration-200",
                    plan.featured
                      ? "shadow-[0_12px_28px_-14px_rgba(226,196,119,0.75)]"
                      : "shadow-[0_10px_24px_-16px_rgba(164,124,52,0.55)]",
                  ].join(" ")}
                >
                  {t.choosePlan(label)} →
                </Link>
              </div>
            );
          })}
        </div>

        {/* Purchase reassurance — a calm strip, not footnotes and not
            cards. One hairline sets it apart from the plan grid. */}
        <div className="mx-auto mt-7 max-w-[880px] border-y border-[color:var(--gold-mid)]/20 px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
            <div className="flex items-center gap-2.5">
              <Copy size={18} strokeWidth={1.75} className="shrink-0 text-accent-primary" />
              <span className="font-sans text-[13px] leading-snug text-text-secondary">
                {(market === "UZ" ? t.extraCopies : t.extraCopiesIntl)(
                  (() => {
                    const p = priceParts(MARKET_PRICING[market].extraCopy, market);
                    return p.unit ? `${p.value} ${p.unit}` : p.value;
                  })(),
                )}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Truck size={18} strokeWidth={1.75} className="shrink-0 text-accent-primary" />
              <span className="font-sans text-[13px] leading-snug text-text-secondary">
                {market === "UZ" ? t.deliveryUz : t.deliveryIntl}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock size={18} strokeWidth={1.75} className="shrink-0 text-accent-primary" />
              <span className="font-sans text-[13px] leading-snug text-text-secondary">
                {market === "UZ" ? t.readyInUz : t.readyInIntl}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
