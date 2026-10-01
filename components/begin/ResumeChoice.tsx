"use client";

/**
 * "Oldingi buyurtmani davom ettirasizmi?" — shown before the order form
 * whenever this device holds a valid unfinished order (components/begin/
 * orderDraft) and the customer is starting an order afresh: from "Yangi
 * buyurtma" on the order menu (/begin/personalized-book/resume), or from a
 * plan card straight into the form.
 *
 *   Davom ettirish          → the caller reopens the saved order exactly
 *                             where it was left (nothing is sent anywhere)
 *   Yangi buyurtma boshlash → ONE lightweight confirmation first; only
 *                             "Ha, yangi boshlayman" calls `onStartNew`
 *                             (which deletes the local draft). "Orqaga"
 *                             returns to the choice with nothing touched.
 *
 * Privacy: deliberately generic. Never a child's name, photo, phone, address
 * or any answer — the device may be shared, the screen may be watched.
 *
 * Visual language mirrors the order menu (PersonalizedBookEntry): warm
 * paper surfaces, navy text, gold as an accent only, display serif titles.
 * Continue carries the gold edge; the destructive fresh start is quieter.
 */

import { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, RotateCcw } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { FlowBackButton } from "./FlowBack";

type Loc = "uz" | "en" | "ru";

export interface ResumeCopy {
  eyebrow: string;
  title: string;
  body: string;
  continueCta: string;
  continueHelper: string;
  startNewCta: string;
  startNewHelper: string;
  confirmTitle: string;
  confirmBody: string;
  confirmYes: string;
  confirmNo: string;
  back: string;
}

export const RESUME_COPY: Record<Loc, ResumeCopy> = {
  uz: {
    eyebrow: "Tugallanmagan buyurtma",
    title: "Oldingi buyurtmani davom ettirasizmi?",
    body: "Sizda tugallanmagan buyurtma bor.",
    continueCta: "Davom ettirish",
    continueHelper: "Avval to‘xtagan joyingizdan davom etasiz.",
    startNewCta: "Yangi buyurtma boshlash",
    startNewHelper: "Oldingi ma’lumotlar o‘chiriladi va forma boshidan boshlanadi.",
    confirmTitle: "Yangi buyurtma boshlaysizmi?",
    confirmBody: "Oldingi tugallanmagan ma’lumotlaringiz o‘chiriladi.",
    confirmYes: "Ha, yangi boshlayman",
    confirmNo: "Orqaga",
    back: "Orqaga",
  },
  en: {
    eyebrow: "Unfinished order",
    title: "Continue your previous order?",
    body: "You have an unfinished order.",
    continueCta: "Continue",
    continueHelper: "Pick up right where you left off.",
    startNewCta: "Start a new order",
    startNewHelper: "Your earlier answers will be deleted and the form starts from the beginning.",
    confirmTitle: "Start a new order?",
    confirmBody: "Your unfinished answers will be deleted.",
    confirmYes: "Yes, start new",
    confirmNo: "Back",
    back: "Back",
  },
  ru: {
    eyebrow: "Незавершённый заказ",
    title: "Продолжить предыдущий заказ?",
    body: "У Вас есть незавершённый заказ.",
    continueCta: "Продолжить",
    continueHelper: "Вы продолжите с того места, где остановились.",
    startNewCta: "Начать новый заказ",
    startNewHelper: "Прежние данные будут удалены, и форма начнётся сначала.",
    confirmTitle: "Начать новый заказ?",
    confirmBody: "Ваши незавершённые данные будут удалены.",
    confirmYes: "Да, начать заново",
    confirmNo: "Назад",
    back: "Назад",
  },
};

/** Same focus treatment as the order menu's cards (see PersonalizedBookEntry). */
const focusRing =
  "outline-none focus-visible:outline-none! focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-4 focus-visible:ring-offset-[color:var(--surface-base)]";

export default function ResumeChoice({
  onContinue,
  onStartNew,
  onBack,
}: {
  onContinue: () => void;
  /** called only after the explicit confirmation */
  onStartNew: () => void;
  onBack: () => void;
}) {
  const { language } = useLanguage();
  const c = RESUME_COPY[language === "UZ" ? "uz" : language === "RU" ? "ru" : "en"];
  const [confirming, setConfirming] = useState(false);
  // one tap = one action: a double tap can't continue AND start new
  const [busy, setBusy] = useState(false);

  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => titleRef.current?.focus({ preventScroll: true }), [confirming]);

  const act = (fn: () => void) => () => {
    if (busy) return;
    setBusy(true);
    fn();
  };

  return (
    <section
      data-order-flow=""
      data-resume-choice={confirming ? "confirm" : "choose"}
      aria-labelledby="resume-choice-title"
      className="w-full bg-surface-base"
    >
      <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-8 md:px-10 md:pb-24 md:pt-12 lg:px-16">
        <FlowBackButton
          onBack={confirming ? () => setConfirming(false) : onBack}
          label={confirming ? c.confirmNo : c.back}
          disabled={busy}
        />

        <header className="mx-auto mt-6 max-w-xl text-center md:mt-10">
          <p className="mb-3 font-sans text-[12px] font-medium uppercase tracking-[0.2em] text-accent-primary">
            {c.eyebrow}
          </p>
          <h1
            ref={titleRef}
            tabIndex={-1}
            id="resume-choice-title"
            className="outline-none font-display text-[28px] font-medium leading-[1.15] tracking-tight text-text-primary sm:text-[36px]"
          >
            {confirming ? c.confirmTitle : c.title}
          </h1>
          <p className="mx-auto mt-4 max-w-md font-sans text-[14.5px] leading-[1.65] text-text-secondary">
            {confirming ? c.confirmBody : c.body}
          </p>
        </header>

        {confirming ? (
          <div className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:mt-12 sm:flex-row-reverse sm:justify-center">
            <button
              type="button"
              data-resume-action="confirm-new"
              onClick={act(onStartNew)}
              disabled={busy}
              className="inline-flex min-h-[50px] flex-1 items-center justify-center rounded-full border border-[color:var(--surface-contrast)]/70 px-6 font-sans text-[14px] font-medium text-text-primary outline-none transition-colors duration-200 hover:bg-[color:var(--surface-contrast)]/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary disabled:opacity-50"
            >
              {c.confirmYes}
            </button>
            <button
              type="button"
              data-resume-action="cancel-new"
              onClick={() => setConfirming(false)}
              disabled={busy}
              className="inline-flex min-h-[50px] flex-1 items-center justify-center rounded-full border border-border-default bg-surface-raised px-6 font-sans text-[14px] font-medium text-text-secondary outline-none transition-colors duration-200 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary disabled:opacity-50"
            >
              {c.confirmNo}
            </button>
          </div>
        ) : (
          <div className="mx-auto mt-10 grid max-w-[880px] gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-6">
            <button
              type="button"
              data-resume-action="continue"
              onClick={act(onContinue)}
              disabled={busy}
              aria-describedby="resume-continue-helper"
              className={[
                "group relative flex h-full flex-col overflow-hidden rounded-[20px] focus-visible:rounded-[20px]! border p-6 text-left sm:p-8",
                "transition-[transform,box-shadow,border-color] duration-[240ms] ease-out motion-reduce:transition-none",
                "border-[color:var(--gold-mid)]/40 bg-surface-overlay shadow-[0_18px_48px_-34px_rgba(28,42,58,0.30)] hover:-translate-y-0.5 hover:border-[color:var(--gold-mid)]/60 hover:shadow-[0_24px_54px_-32px_rgba(28,42,58,0.34)] motion-reduce:hover:translate-y-0",
                focusRing,
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--gold-mid)]/60 to-transparent"
              />
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--gold-highlight)]/45 ring-1 ring-[color:var(--gold-mid)]/25">
                <BookOpen size={21} strokeWidth={1.5} className="text-[color:var(--gold-base)]" aria-hidden="true" />
              </span>
              <span className="mt-5 font-display text-[23px] font-medium leading-snug text-text-primary sm:text-[25px]">
                {c.continueCta}
              </span>
              <span id="resume-continue-helper" className="mt-2 font-sans text-[14px] leading-[1.65] text-text-secondary">
                {c.continueHelper}
              </span>
              <span aria-hidden="true" className="mt-auto pt-7 text-text-primary">
                <ArrowRight
                  size={16}
                  strokeWidth={1.75}
                  className="transition-transform duration-[240ms] ease-out group-hover:translate-x-1 motion-reduce:transition-none rtl:-scale-x-100"
                />
              </span>
            </button>

            <button
              type="button"
              data-resume-action="start-new"
              onClick={() => setConfirming(true)}
              disabled={busy}
              aria-describedby="resume-new-helper"
              className={[
                "group relative flex h-full flex-col rounded-[20px] focus-visible:rounded-[20px]! border border-border-default bg-surface-raised p-6 text-left sm:p-8",
                "transition-[border-color] duration-[240ms] ease-out motion-reduce:transition-none",
                "hover:border-[color:var(--surface-contrast)]/30",
                focusRing,
              ].join(" ")}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--surface-contrast)]/[0.05] ring-1 ring-[color:var(--surface-contrast)]/10">
                <RotateCcw size={19} strokeWidth={1.5} className="text-text-secondary" aria-hidden="true" />
              </span>
              <span className="mt-5 font-display text-[21px] font-medium leading-snug text-text-primary sm:text-[22px]">
                {c.startNewCta}
              </span>
              <span id="resume-new-helper" className="mt-2 font-sans text-[13.5px] leading-[1.65] text-text-muted">
                {c.startNewHelper}
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
