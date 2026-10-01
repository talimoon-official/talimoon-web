"use client";

/**
 * Shown when an unfinished order was resumed: photos and the voice note are
 * NEVER stored with the draft (only text, choices and progress are), so the
 * form reopened on the earliest step whose required files are missing, with
 * every answer back. Only the listed files need adding again — calm, not an
 * error, and nothing here asks the customer to start over.
 *
 *   variant "banner" — once, above the current screen (dismissible)
 *   variant "inline" — on the step that owns the files, until re-added
 *
 * Also used when a selected file could no longer be READ at submit time
 * (gap reason "unreadable", e.g. an Android gallery / Google Photos file
 * whose temporary access was lost): only that file is asked for again, with
 * the specific "…o‘qib bo‘lmadi" message instead of the generic send error.
 */

import { ImagePlus, X } from "lucide-react";
import type { MediaGap } from "./orderDraft";

type Loc = "uz" | "en" | "ru";

export const REUPLOAD_COPY: Record<
  Loc,
  {
    /** banner title when only photos are missing */
    titlePhotos: string;
    /** … only the voice note */
    titleVoice: string;
    /** … both kinds */
    titleMixed: string;
    body: string;
    inlineTitle: string;
    childPhotos: (name: string, n: number) => string;
    characterPhotos: (name: string, n: number) => string;
    special: string;
    voice: string;
    dismiss: string;
    /** a selected file could no longer be read (see `unreadableTitle`) */
    unreadablePhoto: string;
    unreadableVoice: string;
    unreadableFile: string;
    unreadableBody: string;
  }
> = {
  uz: {
    titlePhotos: "Javoblaringiz saqlangan. Davom etish uchun rasmlarni qayta yuklang.",
    titleVoice: "Javoblaringiz saqlangan. Davom etish uchun ovozli faylni qayta qo‘shing.",
    titleMixed: "Javoblaringiz saqlangan. Faqat kerakli fayllarni qayta yuklang.",
    body: "Maxfiylik uchun suratlar va ovozli xabar qurilmada saqlanmaydi. Keyingi javoblaringiz ham joyida. Qayta qo‘shish kerak:",
    inlineTitle: "Qayta qo‘shish kerak",
    childPhotos: (name, n) => `${name || "Farzandingiz"} suratlari (${n} ta)`,
    characterPhotos: (name, n) => `${name || "Qo‘shimcha qahramon"} suratlari (${n} ta)`,
    special: "Esdalik surati",
    voice: "Ovozli xabar",
    dismiss: "Tushunarli",
    unreadablePhoto: "Bu suratni o‘qib bo‘lmadi. Iltimos, suratni qayta tanlang.",
    unreadableVoice: "Ovozli faylni o‘qib bo‘lmadi. Iltimos, uni qayta yozing yoki qayta tanlang.",
    unreadableFile: "Bu faylni o‘qib bo‘lmadi. Iltimos, uni qayta tanlang.",
    unreadableBody: "Javoblaringiz saqlangan. Faqat quyidagini qayta tanlang:",
  },
  en: {
    titlePhotos: "Your answers are saved. Please upload the photos again to continue.",
    titleVoice: "Your answers are saved. Please add the voice note again to continue.",
    titleMixed: "Your answers are saved. Just upload the needed files again.",
    body: "For your privacy, photos and voice notes are not stored on this device. Your later answers are all still here. To add again:",
    inlineTitle: "Needs adding again",
    childPhotos: (name, n) => `${name || "Your child"}’s photos (${n})`,
    characterPhotos: (name, n) => `${name || "Additional character"}’s photos (${n})`,
    special: "Keepsake photo",
    voice: "Voice note",
    dismiss: "Got it",
    unreadablePhoto: "This photo couldn’t be read. Please choose it again.",
    unreadableVoice: "The voice file couldn’t be read. Please record or choose it again.",
    unreadableFile: "This file couldn’t be read. Please choose it again.",
    unreadableBody: "Your answers are saved. Only choose this again:",
  },
  ru: {
    titlePhotos: "Ваши ответы сохранены. Чтобы продолжить, загрузите фото заново.",
    titleVoice: "Ваши ответы сохранены. Чтобы продолжить, добавьте голосовое сообщение заново.",
    titleMixed: "Ваши ответы сохранены. Загрузите заново только нужные файлы.",
    body: "Ради конфиденциальности фото и голосовые сообщения не хранятся на устройстве. Остальные ответы на месте. Добавить заново:",
    inlineTitle: "Нужно добавить заново",
    childPhotos: (name, n) => `Фото: ${name || "ребёнок"} (${n})`,
    characterPhotos: (name, n) => `Фото: ${name || "дополнительный герой"} (${n})`,
    special: "Памятное фото",
    voice: "Голосовое сообщение",
    dismiss: "Понятно",
    unreadablePhoto: "Не удалось прочитать это фото. Пожалуйста, выберите его заново.",
    unreadableVoice: "Не удалось прочитать голосовой файл. Пожалуйста, запишите или выберите его заново.",
    unreadableFile: "Не удалось прочитать этот файл. Пожалуйста, выберите его заново.",
    unreadableBody: "Ваши ответы сохранены. Выберите заново только это:",
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

/** The specific message for files the browser could not read: the photo
 *  one when every unreadable file is a photo, the voice one for the voice
 *  note, the generic file one otherwise. Null when none is unreadable. */
export function unreadableTitle(gaps: MediaGap[], loc: Loc): string | null {
  const bad = gaps.filter((g) => g.reason === "unreadable");
  if (bad.length === 0) return null;
  const c = REUPLOAD_COPY[loc];
  if (bad.every((g) => g.kind === "voice")) return c.unreadableVoice;
  if (bad.every((g) => g.kind !== "voice")) return c.unreadablePhoto;
  return c.unreadableFile;
}

/** The calm resume title: photos, the voice note, or both. */
export function resumeTitle(gaps: MediaGap[], loc: Loc): string {
  const c = REUPLOAD_COPY[loc];
  if (gaps.every((g) => g.kind === "voice")) return c.titleVoice;
  if (gaps.every((g) => g.kind !== "voice")) return c.titlePhotos;
  return c.titleMixed;
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
  const unreadable = unreadableTitle(gaps, loc);
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
          {unreadable ?? c.inlineTitle}
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
          <p className="font-medium">{unreadable ?? resumeTitle(gaps, loc)}</p>
          <p className="mt-1 text-text-secondary">{unreadable ? c.unreadableBody : c.body}</p>
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
