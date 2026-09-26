"use client";

/**
 * TALIMOON — Personalized Books — order entry
 * ----------------------------------------------------------------
 * `/begin/personalized-book`. The customer has already chosen the
 * Personalized Books world (`/begin`); here they choose their INTENT — and
 * nothing else:
 *
 *   A · Yangi buyurtma               → /begin/personalized-book/price
 *                                      (its own page: the book-type choice)
 *   B · Mavjud buyurtma uchun to‘lov → /pay (payment code). NEVER the form.
 *
 * Both cards are plain links: no inline reveal, no state on this screen.
 *
 * Visual language: the existing TALIMOON tokens — warm paper surfaces, navy
 * contrast, gold as an accent only, display serif titles, restrained depth.
 * Motion: 240ms colour / 2px lift, off under reduced motion.
 */

import Link from "next/link";
import { ArrowRight, BookOpen, Check, KeyRound } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ENTRY_COPY } from "@/lib/order/entry-copy";
import { PAY_PATH, PRICE_PATH } from "@/lib/order/paths";

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
          <Link
            href={PRICE_PATH}
            data-intent="new"
            className={[
              "group relative flex h-full flex-col overflow-hidden rounded-[20px] focus-visible:rounded-[20px]! border p-6 text-left sm:p-8",
              "transition-[transform,box-shadow,border-color,background-color] duration-[240ms] ease-out motion-reduce:transition-none",
              "border-[color:var(--gold-mid)]/30 bg-surface-overlay shadow-[0_18px_48px_-34px_rgba(28,42,58,0.30)] hover:-translate-y-0.5 hover:border-[color:var(--gold-mid)]/55 hover:shadow-[0_24px_54px_-32px_rgba(28,42,58,0.34)] motion-reduce:hover:translate-y-0",
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
                className="transition-transform duration-[240ms] ease-out group-hover:translate-x-1 motion-reduce:transition-none"
              />
            </span>
          </Link>

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
      </div>
    </section>
  );
}
