"use client";

/**
 * Shown only when the customer arrives at the form having chosen a book
 * type DIFFERENT from the unfinished order saved on this device. The two
 * are never merged: they either continue the saved order (as it was, its
 * own book type) or explicitly start a new one — which discards the saved
 * answers, and says so before they choose.
 */

import { useEffect, useRef } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { PLAN_COPY } from "@/lib/order/entry-copy";
import type { BookType } from "./orderFormData";
import type { RestoredOrderDraft } from "./orderDraft";
import { parsePhase01Snapshot } from "./Phase01";
import { FlowBackButton } from "./FlowBack";

type Loc = "uz" | "en" | "ru";

export const DRAFT_CHOICE_COPY: Record<
  Loc,
  {
    eyebrow: string;
    title: string;
    body: (savedType: string, chosenType: string) => string;
    forNames: (names: string) => string;
    continueCta: string;
    startNewCta: string;
    startNewNote: string;
    back: string;
  }
> = {
  uz: {
    eyebrow: "Tugallanmagan buyurtma",
    title: "Sizda boshlangan buyurtma bor",
    body: (saved, chosen) =>
      `Bu qurilmada «${saved}» buyurtmasi to‘liq yuborilmagan. Hozir esa «${chosen}» tanlandi.`,
    forNames: (names) => `Qahramon: ${names}`,
    continueCta: "Boshlangan buyurtmani davom ettirish",
    startNewCta: "Yangi buyurtma boshlash",
    startNewNote: "Yangi buyurtma boshlansa, oldingi javoblar bu qurilmadan o‘chiriladi.",
    back: "Orqaga",
  },
  en: {
    eyebrow: "Unfinished order",
    title: "You have an order in progress",
    body: (saved, chosen) =>
      `An order “${saved}” was started on this device and not sent yet. You have now chosen “${chosen}”.`,
    forNames: (names) => `Hero: ${names}`,
    continueCta: "Continue the started order",
    startNewCta: "Start a new order",
    startNewNote: "Starting a new order removes the earlier answers from this device.",
    back: "Back",
  },
  ru: {
    eyebrow: "Незавершённый заказ",
    title: "У Вас есть начатый заказ",
    body: (saved, chosen) =>
      `На этом устройстве начат и не отправлен заказ «${saved}». Сейчас выбрано «${chosen}».`,
    forNames: (names) => `Герой: ${names}`,
    continueCta: "Продолжить начатый заказ",
    startNewCta: "Начать новый заказ",
    startNewNote: "При новом заказе прежние ответы будут удалены с этого устройства.",
    back: "Назад",
  },
};

function draftChildNames(draft: RestoredOrderDraft): string {
  const kids = draft.phase01Seeded
    ? draft.data.children
    : (parsePhase01Snapshot(draft.phase01)?.pool ?? []);
  return kids
    .map((k) => k.name.trim())
    .filter(Boolean)
    .join(", ");
}

export default function DraftChoice({
  draft,
  chosenBookType,
  onContinue,
  onStartNew,
  onBack,
}: {
  draft: RestoredOrderDraft;
  chosenBookType: BookType;
  onContinue: () => void;
  onStartNew: () => void;
  onBack: () => void;
}) {
  const { language } = useLanguage();
  const loc: Loc = language === "UZ" ? "uz" : language === "RU" ? "ru" : "en";
  const c = DRAFT_CHOICE_COPY[loc];
  const plan = PLAN_COPY[loc];
  const label = (t: BookType) => (t === "multi" ? plan.multiTitle : plan.singleTitle);
  const names = draftChildNames(draft);

  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => titleRef.current?.focus({ preventScroll: true }), []);

  return (
    <section
      data-order-flow=""
      className="mx-auto w-full max-w-container-content bg-surface-base px-6 pb-16 pt-9 sm:px-8 md:pb-24 md:pt-12 lg:px-16"
    >
      <div className="mx-auto max-w-md">
        <div className="mb-10">
          <FlowBackButton onBack={onBack} label={c.back} />
        </div>
        <p className="mb-3 font-sans text-[11.5px] font-semibold uppercase tracking-[0.18em] text-accent-primary">
          {c.eyebrow}
        </p>
        <h2
          ref={titleRef}
          tabIndex={-1}
          className="font-display text-[26px] font-medium leading-tight text-text-primary outline-none"
        >
          {c.title}
        </h2>
        <p className="mt-4 font-sans text-[14px] leading-[1.65] text-text-secondary">
          {c.body(label(draft.bookType), label(chosenBookType))}
        </p>
        {names && (
          <p className="mt-2 font-sans text-[13px] text-text-muted">{c.forNames(names)}</p>
        )}
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-accent-primary px-5 font-sans text-[14px] font-medium text-white outline-none transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
          >
            {c.continueCta}
          </button>
          <button
            type="button"
            onClick={onStartNew}
            aria-describedby="draft-start-new-note"
            className="inline-flex min-h-[48px] items-center justify-center rounded-md border border-border-strong px-5 font-sans text-[14px] font-medium text-text-primary outline-none transition-colors hover:border-accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
          >
            {c.startNewCta}
          </button>
          <p id="draft-start-new-note" className="font-sans text-[12.5px] leading-[1.6] text-text-muted">
            {c.startNewNote}
          </p>
        </div>
      </div>
    </section>
  );
}
