"use client";

/**
 * Shown when an unfinished order was restored but some of its files are no
 * longer on the device: photos and the voice note are kept for only 48
 * hours after the customer last worked on the order (the answers for 7
 * days). The answers and the place in the form are back — only the listed
 * files need adding again. Nothing here asks the customer to start over.
 *
 *   variant "banner" — once, above the current screen (dismissible)
 *   variant "inline" — on the step that owns the files, until re-added
 */

import { ImagePlus, X } from "lucide-react";
import type { MediaGap } from "./orderDraft";

type Loc = "uz" | "en" | "ru";

export const REUPLOAD_COPY: Record<
  Loc,
  {
    title: string;
    body: string;
    inlineTitle: string;
    childPhotos: (name: string, n: number) => string;
    characterPhotos: (name: string, n: number) => string;
    special: string;
    voice: string;
    dismiss: string;
  }
> = {
  uz: {
    title: "Faqat ba’zi fayllarni qayta qo‘shing",
    body: "Javoblaringiz va formadagi joyingiz saqlangan. Xavfsizlik uchun suratlar va ovozli xabar bu qurilmada faqat 48 soat saqlanadi, shuning uchun faqat quyidagilarni qayta qo‘shish kerak:",
    inlineTitle: "Qayta qo‘shish kerak",
    childPhotos: (name, n) => `${name || "Farzandingiz"} suratlari (${n} ta)`,
    characterPhotos: (name, n) => `${name || "Qo‘shimcha qahramon"} suratlari (${n} ta)`,
    special: "Esdalik surati",
    voice: "Ovozli xabar",
    dismiss: "Tushunarli",
  },
  en: {
    title: "Only a few files need adding again",
    body: "Your answers and your place in the form are saved. For your privacy, photos and the voice note are kept on this device for only 48 hours, so only these need adding again:",
    inlineTitle: "Needs adding again",
    childPhotos: (name, n) => `${name || "Your child"}’s photos (${n})`,
    characterPhotos: (name, n) => `${name || "Additional character"}’s photos (${n})`,
    special: "Keepsake photo",
    voice: "Voice note",
    dismiss: "Got it",
  },
  ru: {
    title: "Нужно заново добавить только несколько файлов",
    body: "Ваши ответы и место в форме сохранены. Ради конфиденциальности фото и голосовое сообщение хранятся на этом устройстве только 48 часов, поэтому заново нужно добавить только это:",
    inlineTitle: "Нужно добавить заново",
    childPhotos: (name, n) => `Фото: ${name || "ребёнок"} (${n})`,
    characterPhotos: (name, n) => `Фото: ${name || "дополнительный герой"} (${n})`,
    special: "Памятное фото",
    voice: "Голосовое сообщение",
    dismiss: "Понятно",
  },
};

export function gapLabel(g: MediaGap, loc: Loc): string {
  const c = REUPLOAD_COPY[loc];
  switch (g.kind) {
    case "child":
      return c.childPhotos(g.name.trim(), g.count);
    case "character":
      return c.characterPhotos(g.name.trim(), g.count);
    case "special":
      return c.special;
    case "voice":
      return c.voice;
  }
}

export function MediaReuploadNotice({
  gaps,
  loc,
  variant,
  onDismiss,
}: {
  gaps: MediaGap[];
  loc: Loc;
  variant: "banner" | "inline";
  onDismiss?: () => void;
}) {
  if (gaps.length === 0) return null;
  const c = REUPLOAD_COPY[loc];
  const list = (
    <ul className="mt-2 list-disc space-y-0.5 ps-5">
      {gaps.map((g) => (
        <li key={g.kind + ("id" in g ? g.id : "")}>{gapLabel(g, loc)}</li>
      ))}
    </ul>
  );

  if (variant === "inline") {
    return (
      <div
        data-media-reupload="inline"
        className="rounded-lg border border-accent-primary/35 bg-accent-primary/[0.07] px-4 py-3 font-sans text-[13px] leading-[1.6] text-text-primary"
      >
        <p className="flex items-center gap-2 font-medium">
          <ImagePlus size={15} strokeWidth={1.75} className="shrink-0 text-accent-primary" aria-hidden="true" />
          {c.inlineTitle}
        </p>
        {list}
      </div>
    );
  }

  return (
    // data-order-flow: the flow's scroll anchor (useFlowScroll targets the
    // FIRST one) — so each screen change lands with this notice in view,
    // not scrolled up under the fixed navbar.
    <div data-order-flow="" className="mx-auto w-full max-w-container-content bg-surface-base px-6 pt-6 sm:px-8 lg:px-16">
      <div
        role="status"
        data-media-reupload="banner"
        className="mx-auto flex max-w-xl items-start gap-3 rounded-lg border border-accent-primary/35 bg-accent-primary/[0.07] px-4 py-3.5 font-sans text-[13px] leading-[1.6] text-text-primary"
      >
        <ImagePlus size={17} strokeWidth={1.75} className="mt-0.5 shrink-0 text-accent-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{c.title}</p>
          <p className="mt-1 text-text-secondary">{c.body}</p>
          {list}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={c.dismiss}
            className="-me-2 -mt-2 inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md text-text-secondary outline-none hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary"
          >
            <X size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
