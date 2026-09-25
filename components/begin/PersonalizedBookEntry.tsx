"use client";

/**
 * TALIMOON — Personalized Books — order entry
 * ----------------------------------------------------------------
 * `/begin/personalized-book/price`. The customer has already chosen the
 * Personalized Books world (`/begin`); here they choose their INTENT:
 *
 *   A · Yangi buyurtma               → reveals the book choice inline
 *                                      (1 farzand / bir nechta farzand) →
 *                                      "Buyurtmani boshlash" → the existing
 *                                      form, child count pre-seeded
 *   B · Mavjud buyurtma uchun to‘lov → /pay (payment code). NEVER the form.
 *
 * Prices are read from MARKET_PRICING only — the one pricing source — for the
 * market the customer picks (the existing, persisted market preference). The
 * chosen book type reaches the form through lib/order/planIntent (memory
 * only: no URL parameter, no storage).
 *
 * Visual language: the existing TALIMOON tokens — warm paper surfaces, navy
 * contrast, gold as an accent only, display serif titles, restrained depth.
 * Motion: 220–260ms colour / 2px lift / 6px reveal, off under reduced motion.
 */

import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Check, KeyRound } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ENTRY_COPY } from "@/lib/order/entry-copy";
import { MARKET_PRICING, formatMoney, type BookType, type Market } from "./orderFormData";
import { useMarketPreference } from "@/lib/order/market";
import { setPlanIntent } from "@/lib/order/planIntent";

export const FORM_PATH = "/begin/personalized-book/form";
export const PAY_PATH = "/pay";
const PLANS: readonly BookType[] = ["single", "multi"];

/**
 * Keyboard focus for the cards: a ring (box-shadow) that follows each card's
 * radius. The site-wide `:focus-visible` rule (globals.css) sets an outline
 * AND `border-radius: var(--radius-sm)` — unlayered, so it beats utilities;
 * the `!` overrides keep these cards' own shape when focused.
 */
const focusRing =
  "outline-none focus-visible:outline-none! focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-4 focus-visible:ring-offset-[color:var(--surface-base)]";

export default function PersonalizedBookEntry() {
  const { language } = useLanguage();
  const c = ENTRY_COPY[language === "UZ" ? "uz" : language === "RU" ? "ru" : "en"];
  const router = useRouter();
  const { preference, setPreference } = useMarketPreference();
  const market: Market = preference ?? "UZ";

  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<BookType | null>(null);
  const [hint, setHint] = useState(false);
  const planHeadingRef = useRef<HTMLHeadingElement>(null);
  const planRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function reveal() {
    const next = !open;
    setOpen(next);
    if (next) {
      // Move focus to the revealed step (screen readers announce it); scroll
      // it into view gently — instantly when reduced motion is preferred.
      requestAnimationFrame(() => {
        const el = planHeadingRef.current;
        if (!el) return;
        el.focus({ preventScroll: true });
        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView?.({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
      });
    }
  }

  function choose(p: BookType) {
    setPlan(p);
    setHint(false);
  }

  /** radiogroup keyboard pattern: arrows move AND select */
  function onPlanKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + PLANS.length) % PLANS.length;
    choose(PLANS[next]!);
    planRefs.current[next]?.focus();
  }

  function start() {
    if (!plan) {
      setHint(true);
      return;
    }
    setPlanIntent(plan);
    router.push(FORM_PATH);
  }

  return (
    <section aria-labelledby="order-entry-heading" className="w-full bg-surface-base">
      <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-12 md:px-10 md:pb-24 md:pt-20 lg:px-16">
        {/* ── context ─────────────────────────────────────────────── */}
        <header className="mx-auto max-w-xl text-center">
          <p className="mb-3 font-sans text-[12px] font-medium uppercase tracking-[0.2em] text-accent-primary">
            {c.eyebrow}
          </p>
          <h1
            id="order-entry-heading"
            className="font-display text-[28px] font-medium leading-[1.15] tracking-tight text-text-primary sm:text-[36px]"
          >
            {c.heading}
          </h1>
          <p className="mx-auto mt-4 max-w-md font-sans text-[14.5px] leading-[1.65] text-text-secondary">
            {c.subheading}
          </p>
        </header>

        {/* ── intent ──────────────────────────────────────────────── */}
        <div className="mx-auto mt-10 grid max-w-[880px] gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-6">
          <button
            type="button"
            onClick={reveal}
            aria-expanded={open}
            aria-controls="order-entry-plans"
            data-intent="new"
            className={[
              "group relative flex h-full flex-col overflow-hidden rounded-[20px] focus-visible:rounded-[20px]! border p-6 text-left sm:p-8",
              "transition-[transform,box-shadow,border-color,background-color] duration-[240ms] ease-out motion-reduce:transition-none",
              open
                ? "border-[color:var(--gold-mid)]/70 bg-[color:var(--gold-highlight)]/[0.16] shadow-[0_22px_52px_-34px_rgba(94,70,32,0.45)]"
                : "border-[color:var(--gold-mid)]/30 bg-surface-overlay shadow-[0_18px_48px_-34px_rgba(28,42,58,0.30)] hover:-translate-y-0.5 hover:border-[color:var(--gold-mid)]/55 hover:shadow-[0_24px_54px_-32px_rgba(28,42,58,0.34)] motion-reduce:hover:translate-y-0",
              focusRing,
            ].join(" ")}
          >
            {/* hairline highlight: the "layered" premium edge */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--gold-mid)]/60 to-transparent"
            />
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--gold-highlight)]/45 ring-1 ring-[color:var(--gold-mid)]/25">
              <BookOpen size={21} strokeWidth={1.5} className="text-[color:var(--gold-base)]" aria-hidden="true" />
            </span>
            <span className="mt-5 font-display text-[23px] font-medium leading-snug text-text-primary sm:text-[25px]">
              {c.newTitle}
            </span>
            <span className="mt-2 font-sans text-[14px] leading-[1.65] text-text-secondary">{c.newBody}</span>
            <span className="mt-auto inline-flex items-center gap-2 pt-7 font-sans text-[12.5px] font-semibold uppercase tracking-[0.14em] text-text-primary">
              {c.newCta}
              <ArrowRight
                size={14}
                strokeWidth={1.75}
                aria-hidden="true"
                className={[
                  "transition-transform duration-[240ms] ease-out motion-reduce:transition-none",
                  open ? "rotate-90" : "group-hover:translate-x-1",
                ].join(" ")}
              />
            </span>
          </button>

          <Link
            href={PAY_PATH}
            data-intent="existing"
            className={[
              "group relative flex h-full flex-col rounded-[20px] focus-visible:rounded-[20px]! border border-border-default bg-surface-raised p-6 text-left sm:p-8",
              "shadow-[0_14px_40px_-34px_rgba(28,42,58,0.28)] transition-[transform,box-shadow,border-color] duration-[240ms] ease-out motion-reduce:transition-none",
              "hover:-translate-y-0.5 hover:border-[color:var(--surface-contrast)]/30 hover:shadow-[0_22px_50px_-32px_rgba(28,42,58,0.32)] motion-reduce:hover:translate-y-0",
              focusRing,
            ].join(" ")}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--surface-contrast)]/[0.06] ring-1 ring-[color:var(--surface-contrast)]/10">
              <KeyRound size={20} strokeWidth={1.5} className="text-[color:var(--surface-contrast)]" aria-hidden="true" />
            </span>
            <span className="mt-5 font-display text-[23px] font-medium leading-snug text-text-primary sm:text-[25px]">
              {c.existingTitle}
            </span>
            <span className="mt-2 font-sans text-[14px] leading-[1.65] text-text-secondary">{c.existingBody}</span>
            <span className="mt-4 inline-flex items-center gap-1.5 font-sans text-[12.5px] text-text-secondary">
              <Check size={14} strokeWidth={2} className="text-accent-primary" aria-hidden="true" />
              {c.existingNote}
            </span>
            <span className="mt-auto inline-flex items-center gap-2 pt-7 font-sans text-[12.5px] font-semibold uppercase tracking-[0.14em] text-text-primary">
              {c.existingCta}
              <ArrowRight
                size={14}
                strokeWidth={1.75}
                aria-hidden="true"
                className="transition-transform duration-[240ms] ease-out group-hover:translate-x-1 motion-reduce:transition-none"
              />
            </span>
          </Link>
        </div>

        {/* ── book choice (revealed for a NEW order only) ─────────── */}
        <div
          id="order-entry-plans"
          data-open={open ? "true" : "false"}
          hidden={!open}
          className="mx-auto max-w-[880px] motion-safe:animate-[entryReveal_260ms_ease-out]"
        >
          <div className="mt-12 flex flex-col items-center sm:mt-14">
            <span aria-hidden="true" className="h-8 w-px bg-gradient-to-b from-transparent to-[color:var(--gold-mid)]/50" />
            <h2
              ref={planHeadingRef}
              id="order-entry-plans-heading"
              tabIndex={-1}
              className="mt-4 font-display text-[22px] font-medium text-text-primary outline-none sm:text-[26px]"
            >
              {c.planHeading}
            </h2>

            {/* the existing market preference — decides UZS vs USD prices */}
            <div
              role="radiogroup"
              aria-label={c.marketAria}
              className="mt-5 flex items-center gap-1 rounded-full border border-border-default p-1"
            >
              {(["UZ", "INTERNATIONAL"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={market === m}
                  onClick={() => setPreference(m)}
                  className={[
                    "min-h-[44px] rounded-full px-5 font-sans text-[12.5px] sm:min-h-[36px] sm:px-4 transition-colors duration-200 motion-reduce:transition-none",
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
          </div>

          <div
            role="radiogroup"
            aria-labelledby="order-entry-plans-heading"
            className="mx-auto mt-8 grid max-w-[720px] gap-4 sm:grid-cols-2 sm:gap-5"
          >
            {PLANS.map((p, i) => {
              const selected = plan === p;
              const title = p === "single" ? c.singleTitle : c.multiTitle;
              const body = p === "single" ? c.singleBody : c.multiBody;
              const price = formatMoney(MARKET_PRICING[market][p], MARKET_PRICING[market].currency);
              return (
                <button
                  key={p}
                  ref={(el) => {
                    planRefs.current[i] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected || (plan === null && i === 0) ? 0 : -1}
                  data-plan={p}
                  onClick={() => choose(p)}
                  onKeyDown={(e) => onPlanKey(e, i)}
                  className={[
                    "relative flex flex-col rounded-[16px] focus-visible:rounded-[16px]! p-5 text-left sm:p-6",
                    "transition-[border-color,background-color,box-shadow] duration-[220ms] ease-out motion-reduce:transition-none",
                    selected
                      ? "border-[1.5px] border-[color:var(--gold-mid)] bg-[color:var(--gold-highlight)]/[0.14] shadow-[0_16px_40px_-30px_rgba(94,70,32,0.5)]"
                      : "border border-border-default bg-surface-overlay hover:border-[color:var(--gold-mid)]/50",
                    focusRing,
                  ].join(" ")}
                >
                  {/* check indicator */}
                  <span
                    aria-hidden="true"
                    className={[
                      "absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full transition-[opacity,transform] duration-[220ms] ease-out motion-reduce:transition-none",
                      selected
                        ? "scale-100 bg-[color:var(--gold-base)] opacity-100"
                        : "scale-90 border border-border-default opacity-100",
                    ].join(" ")}
                  >
                    {selected && <Check size={13} strokeWidth={2.5} className="text-surface-base" />}
                  </span>
                  <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                    {c.planEyebrow}
                  </span>
                  <span className="mt-2 pr-8 font-display text-[19px] font-medium leading-snug text-text-primary">
                    {title}
                  </span>
                  <span className="mt-3 font-display text-[30px] font-medium leading-none tracking-[-0.02em] text-text-primary">
                    {price}
                  </span>
                  <span className="mt-3 flex-1 font-sans text-[13px] leading-[1.55] text-text-secondary">{body}</span>
                  <span
                    className={[
                      "mt-5 flex h-11 items-center justify-center gap-1.5 rounded-lg font-sans text-[13px] font-medium transition-colors duration-[220ms] motion-reduce:transition-none",
                      selected
                        ? "bg-[color:var(--surface-contrast)] text-surface-base"
                        : "border border-border-strong text-text-primary",
                    ].join(" ")}
                  >
                    {selected && <Check size={14} strokeWidth={2.25} aria-hidden="true" />}
                    {selected ? c.chosen : c.choose}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col items-center">
            <button
              type="button"
              onClick={start}
              aria-disabled={plan === null || undefined}
              aria-describedby={hint ? "order-entry-hint" : undefined}
              className={[
                "flex h-12 w-full max-w-[360px] items-center justify-center gap-2 font-sans text-[14px] font-medium tracking-[0.015em]",
                "outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-primary",
                // not yet: a calm outline that reads as "waiting", never as broken;
                // chosen: the brand gold CTA
                plan === null
                  ? "rounded-[10px] border border-border-strong bg-transparent text-text-muted"
                  : "tm-cta-gold shadow-[0_12px_28px_-14px_rgba(164,124,52,0.6)]",
              ].join(" ")}
            >
              {c.start}
              <ArrowRight size={15} strokeWidth={1.75} aria-hidden="true" />
            </button>
            {hint && (
              <p id="order-entry-hint" role="alert" className="mt-3 font-sans text-[13px] text-text-secondary">
                {c.startHint}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
