"use client";

/**
 * TALIMOON — Personalized Books — book-type choice
 * ----------------------------------------------------------------
 * `/begin/personalized-book/price`. Its own screen, reached from
 * "Yangi buyurtma" on `/begin/personalized-book`. It does ONE thing: the
 * customer chooses "1 farzand uchun" or "Bir nechta farzand uchun", and the
 * card itself continues into the existing order form (child count pre-seeded
 * through lib/order/planIntent — memory only, no URL parameter, no storage).
 *
 * Prices are read from MARKET_PRICING only — the one pricing source — for
 * the persisted market preference (the same selector PricingSection uses).
 *
 * Visual language is PricingSection's (the proven premium pricing cards):
 * the .tm-cta-gold recipe, the two-layer gradient BORDER for the emphasised
 * card, gold hairlines, soft navy-tinted depth — here on warm ivory with
 * navy type, both cards equal, no discount seal (this screen only chooses).
 * Hover: 2px lift + stronger gold edge + arrow nudge. Chosen: full gold
 * gradient border, warmer ivory, check medallion. Off under reduced motion.
 */

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, User, Users } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { PLAN_COPY } from "@/lib/order/entry-copy";
import { ENTRY_PATH, FORM_PATH } from "@/lib/order/paths";
import { MARKET_PRICING, formatMoney, type BookType, type Market } from "./orderFormData";
import { useMarketPreference } from "@/lib/order/market";
import { setPlanIntent } from "@/lib/order/planIntent";

const PLANS: readonly BookType[] = ["single", "multi"];

/** Same gold recipe as .tm-cta-gold / PricingSection's featured border. */
const GOLD_GRADIENT =
  "linear-gradient(135deg, var(--gold-shadow) 0%, var(--gold-base) 20%, var(--gold-mid) 38%, var(--gold-highlight) 50%, var(--gold-mid) 62%, var(--gold-base) 80%, var(--gold-shadow) 100%)";
const IVORY = "linear-gradient(180deg, #FFFDF9 0%, #FAF5EA 100%)";
const IVORY_CHOSEN = "linear-gradient(180deg, #FDF7E9 0%, #F6EBD3 100%)";

/** "499 000" + "so‘m" — the number dominates, the currency word sits small.
 *  USD prices carry their own "$" and need no unit. */
function priceParts(amount: number, market: Market): { value: string; unit: string } {
  if (market === "INTERNATIONAL") return { value: formatMoney(amount, "USD"), unit: "" };
  return { value: amount.toLocaleString("en-US").replace(/,/g, " "), unit: "so‘m" };
}

/** Ring that follows the card radius (overrides the global :focus-visible). */
const focusRing =
  "outline-none focus-visible:outline-none! focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-4 focus-visible:ring-offset-[color:var(--surface-base)]";

export default function PersonalizedBookPlans() {
  const { language } = useLanguage();
  const c = PLAN_COPY[language === "UZ" ? "uz" : language === "RU" ? "ru" : "en"];
  const { preference, setPreference } = useMarketPreference();
  const market: Market = preference ?? "UZ";
  const [chosen, setChosen] = useState<BookType | null>(null);

  return (
    <section aria-labelledby="plans-heading" className="w-full bg-surface-base">
      <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-8 md:px-10 md:pb-28 md:pt-12 lg:px-16">
        <Link
          href={ENTRY_PATH}
          className="inline-flex min-h-[44px] items-center gap-1.5 font-sans text-[13px] text-text-secondary transition-colors duration-200 hover:text-text-primary motion-reduce:transition-none"
        >
          <ArrowLeft size={15} strokeWidth={1.75} aria-hidden="true" />
          {c.back}
        </Link>

        <header className="mx-auto mt-4 max-w-xl text-center md:mt-6">
          <p className="mb-3 font-sans text-[12px] font-medium uppercase tracking-[0.2em] text-accent-primary">
            {c.eyebrow}
          </p>
          <h1
            id="plans-heading"
            className="font-display text-[30px] font-medium leading-[1.12] tracking-tight text-[color:var(--surface-contrast)] sm:text-[40px]"
          >
            {c.heading}
          </h1>
          <p className="mx-auto mt-4 max-w-md font-sans text-[15px] leading-[1.65] text-text-secondary">
            {c.subheading}
          </p>

          {/* the existing market preference — decides UZS vs USD prices */}
          <div
            role="radiogroup"
            aria-label={c.marketAria}
            className="mx-auto mt-7 flex w-fit items-center gap-1 rounded-full border border-[color:var(--gold-mid)]/25 p-1"
          >
            {(["UZ", "INTERNATIONAL"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={market === m}
                onClick={() => setPreference(m)}
                className={[
                  "min-h-[40px] rounded-full px-4 font-sans text-[12.5px] transition-colors duration-200 motion-reduce:transition-none sm:min-h-[34px]",
                  "outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary",
                  market === m
                    ? "bg-accent-primary/[0.16] font-semibold text-text-primary"
                    : "font-medium text-text-secondary hover:text-text-primary",
                ].join(" ")}
              >
                {m === "UZ" ? c.marketUz : c.marketIntl}
              </button>
            ))}
          </div>
        </header>

        <ul className="mx-auto mt-10 grid max-w-[880px] gap-5 md:mt-14 md:grid-cols-2 md:gap-7">
          {PLANS.map((p) => {
            const isChosen = chosen === p;
            const title = p === "single" ? c.singleTitle : c.multiTitle;
            const body = p === "single" ? c.singleBody : c.multiBody;
            const Icon = p === "single" ? User : Users;
            const price = priceParts(MARKET_PRICING[market][p], market);
            return (
              <li key={p} className="flex">
                <Link
                  href={FORM_PATH}
                  data-plan={p}
                  data-chosen={isChosen ? "true" : "false"}
                  onClick={() => {
                    setChosen(p);
                    setPlanIntent(p);
                  }}
                  className={[
                    "group relative flex w-full flex-col overflow-hidden rounded-[22px] focus-visible:rounded-[22px]! border-[1.5px] p-7 text-left sm:p-9",
                    "transition-[transform,box-shadow,border-color] duration-300 ease-out motion-reduce:transition-none",
                    isChosen
                      ? "border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_26px_60px_-34px_rgba(94,70,32,0.55)]"
                      : "border-[color:var(--gold-mid)]/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_18px_48px_-34px_rgba(28,42,58,0.30)] hover:-translate-y-0.5 hover:border-[color:var(--gold-mid)]/65 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_26px_56px_-32px_rgba(28,42,58,0.34)] motion-reduce:hover:translate-y-0",
                    focusRing,
                  ].join(" ")}
                  style={
                    isChosen
                      ? {
                          backgroundImage: `${IVORY_CHOSEN}, ${GOLD_GRADIENT}`,
                          backgroundOrigin: "border-box",
                          backgroundClip: "padding-box, border-box",
                        }
                      : { backgroundImage: IVORY }
                  }
                >
                  {/* hairline highlight along the top edge */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--gold-mid)]/60 to-transparent"
                  />

                  <span className="flex items-start justify-between">
                    <span
                      aria-hidden="true"
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--gold-highlight)]/45 ring-1 ring-[color:var(--gold-mid)]/30"
                    >
                      <Icon size={20} strokeWidth={1.5} className="text-[color:var(--gold-base)]" />
                    </span>
                    <span
                      aria-hidden="true"
                      className={[
                        "flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--surface-contrast)] transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
                        isChosen ? "scale-100 opacity-100" : "scale-75 opacity-0",
                      ].join(" ")}
                    >
                      <Check size={14} strokeWidth={2.5} className="text-[color:var(--gold-highlight)]" />
                    </span>
                  </span>

                  <span className="mt-6 font-sans text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[color:var(--gold-base)]">
                    {c.cardEyebrow}
                  </span>
                  <span className="mt-2 font-display text-[23px] font-medium leading-snug text-[color:var(--surface-contrast)] sm:text-[26px]">
                    {title}
                  </span>

                  <span
                    aria-hidden="true"
                    className="mt-5 h-px w-full bg-gradient-to-r from-[color:var(--gold-mid)]/45 via-[color:var(--gold-mid)]/20 to-transparent"
                  />

                  <span className="mt-5 flex items-baseline gap-2 text-[color:var(--surface-contrast)]" data-price>
                    <span className="font-display text-[44px] font-medium leading-none tracking-[-0.025em] sm:text-[50px]">
                      {price.value}
                    </span>
                    {/* real space for text/AT ("499 000 so‘m"); layout uses gap */}
                    {price.unit && " "}
                    {price.unit && (
                      <span className="font-sans text-[15px] font-medium text-text-secondary">{price.unit}</span>
                    )}
                  </span>

                  <span className="mt-4 flex-1 font-sans text-[14.5px] leading-[1.65] text-text-secondary">{body}</span>

                  <span className="tm-cta-gold mt-8 flex h-12 w-full items-center justify-center gap-2 font-sans text-[14px] font-medium tracking-[0.015em]">
                    {c.choose}
                    <ArrowRight
                      size={15}
                      strokeWidth={1.75}
                      aria-hidden="true"
                      className="transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transition-none"
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
