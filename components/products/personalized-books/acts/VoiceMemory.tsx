"use client";

/**
 * ACT 04.5 - OVOZLI XOTIRA · the differentiator beat
 * ----------------------------------------------------------------
 * Sits between EXCLUSIVITY (desire for the object) and PROCESS/PRICE.
 * The optional Voice Memory: a personalized TALIMOON book can also
 * preserve the REAL VOICE of the close person the book is given from
 * (parent, grandparent, aunt, uncle, sibling, relative or friend).
 *
 * Recomposed to THREE dense acts (~2.5 viewport heights, not six long
 * chapters). Emotion first, mechanism second, technology discreet:
 *
 *   ACT 1  EMOTION + MEMORY    two columns: headline + intro + key
 *                              statement | one layered BUGUN -> YILLAR
 *                              O‘TGACH composition (one dominant visual
 *                              with a smaller future crop set into it)
 *   ACT 2  THE PRODUCT REVEAL  the physical final book page (hero) beside
 *                              a restrained private-Memory player they
 *                              visually connect; 01/02/03 folded in below
 *   ACT 3  TRUST + CLOSE       a compact privacy row, then the emotional
 *                              close and the page's shared gold CTA
 *
 * Voice Memory is OPTIONAL. No audio -> normal final page, no QR. The QR
 * exists ONLY on the audio-selected path. Private by default. Presentation
 * only: never records/uploads/creates a real Memory; leads into the
 * existing order journey via #pricing.
 *
 * Motion: the shared CSS `Reveal` primitive + one SVG line that draws once;
 * full `prefers-reduced-motion` opt-out. No motion library. No em dash in
 * customer-facing copy (project rule).
 */

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/LanguageContext";
import { Reveal, usePrefersReducedMotion } from "../_shared/Reveal";

// ---------------------------------------------------------------------------
// Copy - UZ is the approved source. EN / RU are careful (not literal)
// translations that preserve the emotional meaning; flagged for review.
// ---------------------------------------------------------------------------

interface Step {
  n: string;
  title: string;
  body: string;
}

const COPY_UZ = {
  eyebrow: "OVOZLI XOTIRA",
  heading: "Farzandingiz uchun sizni eslatadigan bir ovoz qoldiring.",
  intro: [
    "Surat bir lahzani saqlaydi. Ovoz esa insonning ohangini, mehrini va bizga qanday murojaat qilganini ham eslatadi.",
    "TALIMOON kitobida farzandingiz uchun yozilgan so‘zlarni o‘z ovozingizda ham qoldirishingiz mumkin.",
  ],
  keyLine:
    "Bugun oddiy tuyulgan ovozingiz, bir kun uning eng qadrli xotiralaridan biriga aylanishi mumkin.",
  todayLabel: "BUGUN",
  todayNote: "Bolaligida unga atalgan so‘zlar.",
  laterLabel: "YILLAR O‘TGACH",
  laterNote: "O‘sha so‘zlar. O‘sha haqiqiy ovoz.",
  act2Heading: "Xotira kitobning bir qismiga aylanadi.",
  stepsLabel: "Qanday ishlaydi",
  steps: [
    {
      n: "01",
      title: "So‘zlaringizni qoldiring",
      body: "Farzandingiz uchun kitobda qolishini istagan shaxsiy so‘zlaringizni yozing.",
    },
    {
      n: "02",
      title: "O‘z ovozingizda ayting",
      body: "Istasangiz, shu so‘zlarni 2 daqiqagacha haqiqiy ovozingizda yozib qoldiring.",
    },
    {
      n: "03",
      title: "Kitob orqali yana tinglang",
      body: "Ovozli xotira tanlansa, yakuniy sahifadagi maxsus QR orqali saqlangan ovoz yana tinglanadi.",
    },
  ] satisfies Step[],
  finalPageAria:
    "Kitobning yakuniy sahifasi: farzand va yaqin insonning birgalikdagi surati, shaxsiy so‘zlar, hamda ovozli xotira tanlangan bo‘lsa, uni tinglash uchun kichik QR kod.",
  photoTodayAlt:
    "Farzand va unga kitobni taqdim etayotgan yaqin inson TALIMOON kitobi bilan birga",
  photoLaterAlt: "Bir necha yil o‘tib o‘sha TALIMOON kitobi yana ochilmoqda",
  playerAria: "Shaxsiy xotira sahifasi: saqlangan ovozni tinglash uchun oddiy ijro tugmasi.",
  qrLabel: "Ovozli xotirani tinglash",
  phoneTitle: "Shaxsiy xotira",
  phonePlay: "Ovozni tinglash",
  privacyHeading: "Shaxsiy xotira",
  privacy: [
    "Ovozli xotirangiz dastlab ommaviy e'lon qilinmaydi. U kitobingizdagi maxsus QR havola orqali ochiladi.",
    "Ovozli xotira ixtiyoriy. Audio tanlanmasa, kitob QR va ovozli xotirasiz tayyorlanadi.",
  ],
  closeLine1: "Kitob bolalikni hikoya qiladi.",
  closeLine2: "Ovoz esa sizni eslatib turadi.",
  closeSupport:
    "Farzandingiz ulg‘ayadi. Ammo ayrim xotiralarni vaqt bilan birga olib yurish mumkin.",
  cta: "Farzandimning hikoyasini yarating",
};

const COPY_EN: typeof COPY_UZ = {
  eyebrow: "A VOICE MEMORY",
  heading: "Leave a voice that will remind your child of you.",
  intro: [
    "A photograph keeps a moment. A voice also keeps a person's tone, their warmth, and the way they spoke to us.",
    "In a TALIMOON book you can also leave the words written for your child in your own voice.",
  ],
  keyLine:
    "The voice that feels ordinary today may one day become one of their most treasured memories.",
  todayLabel: "TODAY",
  todayNote: "Words meant for them in childhood.",
  laterLabel: "YEARS LATER",
  laterNote: "The same words. The same real voice.",
  act2Heading: "The memory becomes part of the book.",
  stepsLabel: "How it works",
  steps: [
    {
      n: "01",
      title: "Leave your words",
      body: "Write the personal words you would like to stay in the book for your child.",
    },
    {
      n: "02",
      title: "Say them in your own voice",
      body: "If you wish, record those same words in your real voice, up to two minutes.",
    },
    {
      n: "03",
      title: "Hear it again through the book",
      body: "If a voice memory is added, a discreet QR on the final page plays the preserved voice again.",
    },
  ],
  finalPageAria:
    "The book's final page: a photograph of the child together with the close person, the personal written words, and, when a voice memory is chosen, a small QR to listen to it.",
  photoTodayAlt: "A child and the close person giving them the book, together with a TALIMOON book",
  photoLaterAlt: "Some years later, the same TALIMOON book being opened again",
  playerAria: "A private memory screen with a simple play control for the preserved voice.",
  qrLabel: "Listen to the voice memory",
  phoneTitle: "Private memory",
  phonePlay: "Play the voice",
  privacyHeading: "A private memory",
  privacy: [
    "Your voice memory is not published publicly at first. It opens through the private QR link inside your book.",
    "The voice memory is optional. If no audio is added, the book is made without a QR and without a voice memory.",
  ],
  closeLine1: "The book tells the story of childhood.",
  closeLine2: "The voice keeps reminding them of you.",
  closeSupport: "Your child will grow up. But some memories can be carried along with time.",
  cta: "Create my child's story",
};

const COPY_RU: typeof COPY_UZ = {
  eyebrow: "ГОЛОСОВАЯ ПАМЯТЬ",
  heading: "Оставьте голос, который будет напоминать Вашему ребёнку о Вас.",
  intro: [
    "Фотография сохраняет мгновение. А голос сохраняет ещё и интонацию человека, его теплоту и то, как он обращался к нам.",
    "В книге TALIMOON слова, написанные для Вашего ребёнка, можно оставить и своим голосом.",
  ],
  keyLine:
    "Голос, который сегодня кажется обычным, однажды может стать одним из самых дорогих его воспоминаний.",
  todayLabel: "СЕГОДНЯ",
  todayNote: "Слова, обращённые к нему в детстве.",
  laterLabel: "СПУСТЯ ГОДЫ",
  laterNote: "Те же слова. Тот же настоящий голос.",
  act2Heading: "Память становится частью книги.",
  stepsLabel: "Как это работает",
  steps: [
    {
      n: "01",
      title: "Оставьте свои слова",
      body: "Напишите личные слова, которые хотите оставить в книге для Вашего ребёнка.",
    },
    {
      n: "02",
      title: "Скажите их своим голосом",
      body: "При желании запишите те же слова своим настоящим голосом, до двух минут.",
    },
    {
      n: "03",
      title: "Услышьте это снова через книгу",
      body: "Если голосовая память добавлена, небольшой QR на последней странице снова воспроизводит сохранённый голос.",
    },
  ],
  finalPageAria:
    "Последняя страница книги: фотография ребёнка вместе с близким человеком, личные написанные слова и, если выбрана голосовая память, небольшой QR, чтобы её послушать.",
  photoTodayAlt: "Ребёнок и близкий человек, который дарит ему книгу, вместе с книгой TALIMOON",
  photoLaterAlt: "Спустя несколько лет та же книга TALIMOON открывается снова",
  playerAria: "Экран личной памяти с простой кнопкой воспроизведения сохранённого голоса.",
  qrLabel: "Послушать голосовую память",
  phoneTitle: "Личная память",
  phonePlay: "Воспроизвести голос",
  privacyHeading: "Личная память",
  privacy: [
    "Ваша голосовая память сначала не публикуется открыто. Она открывается по частной QR-ссылке внутри Вашей книги.",
    "Голосовая память по желанию. Если аудио не добавлено, книга изготавливается без QR и без голосовой памяти.",
  ],
  closeLine1: "Книга рассказывает о детстве.",
  closeLine2: "А голос продолжает напоминать о Вас.",
  closeSupport: "Ваш ребёнок вырастет. Но некоторые воспоминания можно нести с собой сквозь время.",
  cta: "Создать историю моего ребёнка",
};

// ---------------------------------------------------------------------------
// Decorative building blocks - pure CSS / SVG, no assets required.
// ---------------------------------------------------------------------------

/**
 * Warm editorial photo field: a soft "window light" paper wash with a faint
 * child, close-person and book line motif. Intentionally graphic, never a
 * broken image. `label` -> role="img" with that description; otherwise it is
 * decorative (meaning carried by an adjacent caption / wrapping role="img").
 *
 * Final assets, dropped in later as `next/image` (fill, sizes, quality 100),
 * keeping this element's aspect box unchanged:
 *   variant "today" -> /images/products/personalized-books/voice-memory/voice-memory-today.webp
 *   variant "later" -> /images/products/personalized-books/voice-memory/voice-memory-years-later.webp
 */
function PhotoField({
  variant,
  className = "",
  label,
}: {
  variant: "today" | "later";
  className?: string;
  label?: string;
}) {
  const a11y = label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true };
  return (
    <div
      {...a11y}
      data-asset={
        variant === "today" ? "voice-memory-today.webp" : "voice-memory-years-later.webp"
      }
      className={`relative overflow-hidden ${className}`}
      style={{
        background:
          variant === "today"
            ? "radial-gradient(120% 100% at 28% 8%, #FEFCF7 0%, #F6EEDF 55%, #EEE1CC 100%)"
            : "radial-gradient(120% 100% at 74% 14%, #FDFAF3 0%, #F1E7D6 58%, #E6D8BF 100%)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0) 40%, rgba(120,95,55,0.11) 100%)",
        }}
      />
      <svg
        viewBox="0 0 240 160"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full text-[color:var(--gold-mid)]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.24"
        aria-hidden="true"
      >
        <circle cx="96" cy="58" r="13" />
        <path d="M80 110c0-14 7-24 16-24s16 10 16 24" />
        <circle cx="134" cy="52" r="17" />
        <path d="M114 116c0-18 9-30 20-30s20 12 20 30" />
        <path d="M84 118h72l-5 34H89z" />
        <path d="M120 118v34" />
      </svg>
    </div>
  );
}

/** A short gold line that carries from the present-day frame toward the
 *  smaller future frame, drawing once on scroll-in (reduced motion: static). */
function TimeThread({ className = "" }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<SVGPathElement | null>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -14% 0px" },
    );
    io.observe(el);
    const fallback = window.setTimeout(() => setDrawn(true), 1600);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, [reduced]);

  return (
    <svg
      viewBox="0 0 120 40"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`overflow-visible ${className}`}
    >
      <path
        ref={ref}
        d="M4,8 C48,8 66,34 116,34"
        pathLength={1}
        fill="none"
        stroke="var(--gold-mid)"
        strokeWidth={1.4}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        style={{
          opacity: 0.6,
          strokeDasharray: 1,
          strokeDashoffset: reduced || drawn ? 0 : 1,
          transition: reduced ? undefined : "stroke-dashoffset 1200ms cubic-bezier(0.22,1,0.36,1)",
        }}
      />
    </svg>
  );
}

/** A small, decorative QR-style glyph. Deliberately NOT a scannable code: a
 *  visual representation of "a private key to the memory". */
function QrGlyph({ size = 46 }: { size?: number }) {
  const D =
    "M0 0h3v3H0zM4 0h1v1H4zM6 0h1v3H6zM2 2h1v1H2zM4 2h1v1H4z" +
    "M0 4h1v1H0zM2 4h1v1H2zM3 5h1v1H3zM5 4h1v1H5zM6 5h1v1H6z" +
    "M0 6h3v3H0zM4 6h1v1H4zM6 7h1v1H6zM2 8h1v1H2zM4 8h1v1H4zM5 6h1v1H5z";
  return (
    <svg
      viewBox="0 0 9 9"
      width={size}
      height={size}
      aria-hidden="true"
      className="shrink-0"
      shapeRendering="crispEdges"
    >
      <rect width="9" height="9" fill="#FDFBF7" />
      <path d={D} fill="var(--text-primary)" />
      <rect x="0.4" y="0.4" width="2.2" height="2.2" fill="none" stroke="var(--gold-mid)" strokeWidth="0.18" />
      <rect x="6.4" y="0.4" width="2.2" height="2.2" fill="none" stroke="var(--gold-mid)" strokeWidth="0.18" />
      <rect x="0.4" y="6.4" width="2.2" height="2.2" fill="none" stroke="var(--gold-mid)" strokeWidth="0.18" />
    </svg>
  );
}

/** Concentric "scan" arcs that read as the phone reading the book's QR.
 *  Static, decorative; shown only on the desktop overlap. */
function ScanArcs() {
  return (
    <svg
      viewBox="0 0 40 60"
      aria-hidden="true"
      className="hidden h-[70px] w-12 text-[color:var(--gold-mid)] lg:block"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
    >
      <path d="M30 12a24 24 0 0 1 0 36" strokeWidth="1.4" opacity="0.5" />
      <path d="M22 20a13 13 0 0 1 0 20" strokeWidth="1.4" opacity="0.7" />
      <path d="M14 27a4 4 0 0 1 0 6" strokeWidth="1.6" opacity="0.9" />
    </svg>
  );
}

function LockGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Restrained private-Memory device. Non-functional: a static play cue, a
 *  still progress line, a time read-out. Secondary to the book, but large
 *  enough to read at a glance. */
function PhoneMock({ title, playLabel }: { title: string; playLabel: string }) {
  return (
    <div
      aria-hidden="true"
      className="w-[184px] rounded-[22px] border border-border-subtle bg-surface-overlay p-3 shadow-[0_22px_48px_-24px_rgba(28,42,58,0.42)] sm:w-[212px]"
    >
      <div className="mx-auto mb-2.5 h-1 w-9 rounded-full bg-text-primary/15" />
      <div className="flex items-center justify-between px-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          {title}
        </p>
        <QrGlyph size={14} />
      </div>
      <div className="mt-3 flex items-center gap-2.5 px-1.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-accent-primary/50 text-accent-primary">
          <svg viewBox="0 0 20 20" width="12" height="12" fill="currentColor">
            <path d="M5 3.5v13a1 1 0 0 0 1.54.84l10-6.5a1 1 0 0 0 0-1.68l-10-6.5A1 1 0 0 0 5 3.5Z" />
          </svg>
        </span>
        <span className="sr-only">{playLabel}</span>
        <div className="flex-1">
          <div className="relative h-1 rounded-full bg-text-primary/12">
            <span className="absolute left-0 top-0 h-full w-1/4 rounded-full bg-accent-primary/70" />
            <span className="absolute left-1/4 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-primary" />
          </div>
          <div className="mt-1 flex justify-between text-[8.5px] tabular-nums text-text-muted">
            <span>0:18</span>
            <span>1:12</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export default function VoiceMemory() {
  const t = useT(COPY_EN, COPY_UZ, COPY_RU);

  return (
    <section
      id="voice-memory"
      aria-labelledby="voice-memory-heading"
      className="w-full scroll-mt-20 bg-gradient-to-b from-[#FDFBF7] via-surface-base to-surface-base md:scroll-mt-24"
    >
      <div className="mx-auto max-w-[1240px] px-5 pb-9 pt-14 sm:px-8 md:pb-10 md:pt-16">
        {/* ================= ACT 1 - EMOTION + MEMORY ================= */}
        <div className="lg:grid lg:grid-cols-[minmax(0,43fr)_minmax(0,57fr)] lg:items-center lg:gap-x-10">
          {/* left - words */}
          <Reveal className="max-w-[34rem]">
            <p className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.22em] text-accent-primary">
              {t.eyebrow}
            </p>
            <h2
              id="voice-memory-heading"
              className="mt-3.5 max-w-[17ch] font-display text-[1.9375rem] font-medium leading-[1.13] tracking-[-0.015em] text-text-primary sm:text-[2.25rem] lg:text-[2.625rem]"
            >
              {t.heading}
            </h2>
            <div className="mt-5 max-w-[42ch] space-y-3">
              {t.intro.map((p, i) => (
                <p
                  key={i}
                  className="font-sans text-[0.9375rem] leading-[1.7] text-text-secondary lg:text-[1rem]"
                >
                  {p}
                </p>
              ))}
            </div>
            <p className="mt-6 max-w-[40ch] border-s-2 border-accent-primary/35 ps-5 font-display text-[1.25rem] font-medium leading-[1.42] text-text-primary lg:text-[1.4375rem]">
              {t.keyLine}
            </p>
          </Reveal>

          {/* right - one layered BUGUN -> YILLAR O‘TGACH composition */}
          <Reveal delay={90} className="mt-10 lg:mt-0">
            <div className="relative ms-auto w-full max-w-[540px] pb-7 pe-2 sm:pb-9 sm:pe-5">
              {/* dominant present-day frame */}
              <figure className="relative">
                <PhotoField
                  variant="today"
                  label={t.photoTodayAlt}
                  className="aspect-[3/2] w-full rounded-[13px] ring-1 ring-border-subtle"
                />
                <figcaption className="mt-2.5">
                  <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.2em] text-accent-primary">
                    {t.todayLabel}
                  </span>
                  <span className="ms-2 font-display text-[0.9375rem] italic text-text-secondary">
                    {t.todayNote}
                  </span>
                </figcaption>
              </figure>

              <TimeThread className="pointer-events-none absolute right-1 top-[calc(66%-1.2rem)] hidden h-8 w-20 sm:block" />

              {/* smaller future crop, set into the same story */}
              <figure className="absolute bottom-0 right-0 w-[40%] max-w-[196px] sm:w-[37%]">
                <PhotoField
                  variant="later"
                  label={t.photoLaterAlt}
                  className="aspect-[4/3] w-full rounded-[10px] shadow-[0_16px_34px_-20px_rgba(28,42,58,0.42)] ring-2 ring-surface-base"
                />
                <figcaption className="mt-1.5">
                  <span className="block font-sans text-[9px] font-semibold uppercase tracking-[0.16em] text-accent-primary">
                    {t.laterLabel}
                  </span>
                  <span className="font-display text-[0.8125rem] italic leading-snug text-text-secondary">
                    {t.laterNote}
                  </span>
                </figcaption>
              </figure>
            </div>
          </Reveal>
        </div>

        {/* ================= ACT 2 - THE PRODUCT REVEAL ============== */}
        <div className="mt-12 md:mt-14">
          <Reveal className="text-center">
            <h3 className="mx-auto max-w-[24ch] font-display text-[1.5rem] font-medium leading-[1.16] tracking-[-0.015em] text-text-primary sm:text-[1.875rem] lg:text-[2.125rem]">
              {t.act2Heading}
            </h3>
          </Reveal>

          {/* book (hero) + private-Memory player as ONE composition: from lg
              the phone hangs off the book's lower-right, its scan arcs over
              the QR so the QR visibly connects the page to the Memory. Below
              lg the phone drops under the book, centred. */}
          <Reveal className="mx-auto mt-8 w-full max-w-[560px] md:mt-10">
            <div className="relative">
              <div
                role="img"
                aria-label={t.finalPageAria}
                className="rounded-[14px] bg-surface-raised p-5 shadow-[0_28px_60px_-34px_rgba(28,42,58,0.32)] ring-1 ring-border-subtle sm:p-6"
                style={{ transform: "rotate(-0.8deg)" }}
              >
                <PhotoField
                  variant="today"
                  className="aspect-[4/3] w-full rounded-[10px] ring-1 ring-border-subtle"
                />
                <div aria-hidden="true" className="mt-4 space-y-2 sm:mt-5">
                  <span className="block h-2 w-[92%] rounded-full bg-text-primary/10" />
                  <span className="block h-2 w-[80%] rounded-full bg-text-primary/10" />
                  <span className="block h-2 w-[86%] rounded-full bg-text-primary/10" />
                  <span className="block h-2 w-[44%] rounded-full bg-text-primary/10" />
                </div>
                <div className="mt-5 flex items-center gap-3 border-t border-border-subtle pt-4">
                  <QrGlyph size={44} />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                    {t.qrLabel}
                  </span>
                </div>

                {/* the Memory player, pinned to the card's lower-right from lg;
                    below lg it renders after the card, centred (see sibling). */}
                <div className="hidden lg:absolute lg:-bottom-10 lg:-right-20 lg:flex lg:items-center lg:gap-1.5 xl:-right-28">
                  <ScanArcs />
                  <div role="img" aria-label={t.playerAria} style={{ transform: "rotate(2.4deg)" }}>
                    <PhoneMock title={t.phoneTitle} playLabel={t.phonePlay} />
                  </div>
                </div>
              </div>
            </div>

            {/* small screens: the player below the book, centred */}
            <div className="mt-6 flex justify-center lg:hidden">
              <div role="img" aria-label={t.playerAria} style={{ transform: "rotate(2.4deg)" }}>
                <PhoneMock title={t.phoneTitle} playLabel={t.phonePlay} />
              </div>
            </div>
          </Reveal>

          {/* 01 / 02 / 03 - folded into this act, not its own screen */}
          <ol className="mx-auto mt-10 grid max-w-[1000px] gap-y-6 md:mt-11 md:grid-cols-3 md:gap-x-10">
            {t.steps.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 80} className="relative md:pt-5">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 hidden h-px bg-border-subtle md:block"
                />
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent-primary md:block"
                />
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-4 left-[3px] h-3.5 w-px bg-accent-primary/30 md:hidden"
                  />
                )}
                <div className="flex items-baseline gap-2.5">
                  <span className="font-display text-[0.875rem] font-medium tracking-[0.06em] text-accent-primary">
                    {s.n}
                  </span>
                  <h4 className="font-display text-[1.0625rem] font-medium leading-[1.35] text-text-primary">
                    {s.title}
                  </h4>
                </div>
                <p className="mt-1.5 max-w-[40ch] font-sans text-[0.8125rem] leading-[1.65] text-text-secondary md:text-[0.875rem]">
                  {s.body}
                </p>
              </Reveal>
            ))}
          </ol>
        </div>

        {/* ================= ACT 3 - TRUST + CLOSE ================== */}
        <Reveal className="mt-12 flex max-w-[70ch] items-start gap-3 border-t border-border-subtle pt-5 md:mt-14">
          <span className="mt-0.5 text-text-muted">
            <LockGlyph />
          </span>
          <div>
            <h3 className="font-sans text-[0.9375rem] font-medium text-text-primary">
              {t.privacyHeading}
            </h3>
            <div className="mt-1.5 space-y-1.5">
              {t.privacy.map((p, i) => (
                <p key={i} className="font-sans text-[0.8125rem] leading-[1.65] text-text-muted">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={50} className="mt-12 text-center md:mt-14">
          <div aria-hidden="true" className="mx-auto mb-6 h-px w-12 bg-accent-primary/40" />
          <p className="text-balance font-display text-[1.75rem] font-medium leading-[1.2] tracking-[-0.015em] text-text-primary sm:text-[2.125rem] lg:text-[2.4375rem]">
            {t.closeLine1}
            <br />
            {t.closeLine2}
          </p>
          <p className="mx-auto mt-4 max-w-[44ch] font-sans text-[0.9375rem] leading-[1.7] text-text-secondary lg:text-[1.0625rem]">
            {t.closeSupport}
          </p>
          <a
            href="#pricing"
            className="tm-cta-gold mt-7 inline-flex h-12 items-center justify-center px-7 font-sans text-[13.5px] font-medium tracking-[0.015em]"
          >
            {t.cta}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
