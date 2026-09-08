"use client";

/**
 * ACT 04.5 - OVOZLI XOTIRA · the differentiator beat
 * ----------------------------------------------------------------
 * Sits between EXCLUSIVITY (desire for the object) and PROCESS/PRICE.
 * The optional Voice Memory: a personalized TALIMOON book can also
 * preserve the REAL VOICE of the close person the book is given from
 * (parent, grandparent, aunt, uncle, sibling, relative or friend).
 *
 * ONE premium editorial product spread, per the approved composition
 * reference:
 *
 *   LEFT    the large physical final book page (a dominant visual anchor;
 *           it SHOWS "the memory becomes part of the book" - no heading
 *           says it) with the private-Memory player attached to its
 *           lower-right, spilling past the page edge
 *   CENTER  the Voice Memory copy: eyebrow, headline, body, and the
 *           emotional statement lower down with a gold vertical rule
 *   RIGHT   two overlapping time-story frames, BUGUN behind / YILLAR
 *           O‘TGACH in front, linked by one restrained gold time thread
 *   BELOW   a compact 01 / 02 / 03 rail that belongs to the spread
 *   THEN    a slim privacy row, then the emotional close + the page's
 *           shared gold CTA
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
  photoLaterAlt:
    "O‘sha bola ulg‘aygach, o‘sha TALIMOON kitobini yana qo‘lida ushlab turibdi",
  playerAria: "Shaxsiy xotira: saqlangan ovozni tinglash uchun oddiy ijro tugmasi bo‘lgan kartcha.",
  qrLabel: "Ovozli xotirani tinglash",
  playerTitle: "Shaxsiy xotira",
  playerPlay: "Ovozni tinglash",
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
  photoLaterAlt: "That same child, grown up, holding the same TALIMOON book again",
  playerAria: "A private memory card with a simple play control for the preserved voice.",
  qrLabel: "Listen to the voice memory",
  playerTitle: "Private memory",
  playerPlay: "Play the voice",
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
  photoLaterAlt: "Тот же ребёнок, повзрослев, снова держит ту же книгу TALIMOON",
  playerAria: "Карточка личной памяти с простой кнопкой воспроизведения сохранённого голоса.",
  qrLabel: "Послушать голосовую память",
  playerTitle: "Личная память",
  playerPlay: "Воспроизвести голос",
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
 * Final assets, dropped in later as `next/image` (fill, sizes, quality 100)
 * keeping this element's aspect box unchanged:
 *   variant "today" -> /images/products/personalized-books/voice-memory/voice-memory-today.webp   (3:2 source crop)
 *   variant "later" -> /images/products/personalized-books/voice-memory/voice-memory-years-later.webp (4:3 source crop)
 * Use object-fit: cover; object-position ~ "50% 38%" (today) / "50% 42%" (later).
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

/** One short gold time thread between the two right-side frames, drawing once
 *  on scroll-in (reduced motion: static). Not an arrow, not an infographic. */
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
      viewBox="0 0 80 60"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`overflow-visible ${className}`}
    >
      <path
        ref={ref}
        d="M6,6 C30,10 34,44 74,52"
        pathLength={1}
        fill="none"
        stroke="var(--gold-mid)"
        strokeWidth={1.4}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        style={{
          opacity: 0.62,
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
function QrGlyph({ size = 44 }: { size?: number }) {
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

/** A very small concentric-arc glyph: the QR being read into the memory
 *  card. Static, decorative, shown only where the card meets the book. */
function ReadArc() {
  return (
    <svg
      viewBox="0 0 30 44"
      aria-hidden="true"
      className="h-10 w-6 text-[color:var(--gold-mid)]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
    >
      <path d="M22 8a20 20 0 0 1 0 28" strokeWidth="1.3" opacity="0.5" />
      <path d="M15 15a10 10 0 0 1 0 14" strokeWidth="1.4" opacity="0.72" />
      <path d="M9 20a3 3 0 0 1 0 4" strokeWidth="1.6" opacity="0.92" />
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

/**
 * The private-memory card. A small floating audio-memory card, NOT a phone:
 * no device chrome, just a warm-white card with a label, a play cue, a thin
 * progress line and a time. Non-functional; the play control is a cue only.
 */
function MemoryCard({ title, playLabel }: { title: string; playLabel: string }) {
  return (
    <div
      aria-hidden="true"
      className="w-[172px] rounded-xl border border-border-subtle bg-surface-overlay p-3.5 shadow-[0_20px_44px_-22px_rgba(28,42,58,0.4)] sm:w-[188px]"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
          {title}
        </p>
        <QrGlyph size={13} />
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-accent-primary/50 text-accent-primary">
          <svg viewBox="0 0 20 20" width="11" height="11" fill="currentColor">
            <path d="M5 3.5v13a1 1 0 0 0 1.54.84l10-6.5a1 1 0 0 0 0-1.68l-10-6.5A1 1 0 0 0 5 3.5Z" />
          </svg>
        </span>
        <span className="sr-only">{playLabel}</span>
        <div className="flex-1">
          <div className="relative h-[3px] rounded-full bg-text-primary/12">
            <span className="absolute left-0 top-0 h-full w-1/4 rounded-full bg-accent-primary/70" />
            <span className="absolute left-1/4 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-primary" />
          </div>
          <div className="mt-1 flex justify-between text-[8px] tabular-nums text-text-muted">
            <span>0:18</span>
            <span>1:12</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function StepRail({ steps }: { steps: Step[] }) {
  return (
    <ol className="mx-auto grid max-w-[1040px] gap-y-6 md:grid-cols-3 md:gap-x-10">
      {steps.map((s, i) => (
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
            <h3 className="font-display text-[1.0625rem] font-medium leading-[1.3] text-text-primary">
              {s.title}
            </h3>
          </div>
          <p className="mt-1.5 max-w-[40ch] font-sans text-[0.8125rem] leading-[1.6] text-text-secondary md:text-[0.875rem]">
            {s.body}
          </p>
        </Reveal>
      ))}
    </ol>
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
      <div className="mx-auto max-w-[1480px] px-5 pb-10 pt-9 sm:px-8 md:pb-12 md:pt-6 lg:pt-4">
        {/* ============ THE SPREAD: book | copy | time-story ============ */}
        <div
          className="
            flex flex-col gap-14
            md:grid md:grid-cols-2 md:gap-x-10 md:gap-y-14
            lg:grid-cols-[minmax(0,34fr)_minmax(0,33fr)_minmax(0,33fr)] lg:items-center lg:gap-x-6 lg:gap-y-0 xl:gap-x-10
          "
        >
          {/*
           * DOM order = the mobile / screen-reader reading order the spec asks
           * for: copy, then the time-story images, then the book page with its
           * attached player. On lg the three become one horizontal spread and
           * `order` pulls the book to the LEFT, copy to the CENTER, images RIGHT.
           */}

          {/* ---- CENTER (desktop) / first (mobile+tablet): the copy ---- */}
          <Reveal delay={70} className="md:order-1 lg:order-2 lg:px-1">
            <p className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.22em] text-accent-primary">
              {t.eyebrow}
            </p>
            <h2
              id="voice-memory-heading"
              className="mt-3.5 max-w-[19ch] font-display text-[1.8125rem] font-medium leading-[1.15] tracking-[-0.015em] text-text-primary sm:text-[2.125rem] lg:text-[2.25rem] xl:text-[2.5rem]"
            >
              {t.heading}
            </h2>
            <div className="mt-4 max-w-[42ch] space-y-3">
              {t.intro.map((p, i) => (
                <p
                  key={i}
                  className="font-sans text-[0.9375rem] leading-[1.7] text-text-secondary"
                >
                  {p}
                </p>
              ))}
            </div>
            <p className="mt-7 max-w-[40ch] border-s-2 border-accent-primary/40 ps-5 font-display text-[1.1875rem] font-normal leading-[1.55] text-text-primary lg:text-[1.3125rem]">
              {t.keyLine}
            </p>
          </Reveal>

          {/* ---- RIGHT (desktop) / second: BUGUN / YILLAR O‘TGACH time-story ---- */}
          <Reveal delay={130} className="md:order-2 lg:order-3">
            <div className="relative mx-auto w-full max-w-[380px] lg:mx-0 lg:ms-auto">
              {/* BUGUN - behind, slightly left, rotated -1deg */}
              <figure className="relative w-[86%]" style={{ transform: "rotate(-1deg)" }}>
                <figcaption className="mb-2">
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-primary">
                    {t.todayLabel}
                  </span>
                  <span className="ms-2 font-display text-[0.875rem] italic text-text-secondary">
                    {t.todayNote}
                  </span>
                </figcaption>
                <PhotoField
                  variant="today"
                  label={t.photoTodayAlt}
                  className="aspect-[3/2] w-full rounded-[11px] shadow-[0_20px_44px_-26px_rgba(28,42,58,0.34)] ring-1 ring-border-subtle"
                />
              </figure>

              <TimeThread className="pointer-events-none absolute right-3 top-[42%] hidden h-12 w-16 sm:block" />

              {/* YILLAR O‘TGACH - in front, smaller, pushed further right and
                  lower so BUGUN stays clearly readable underneath it */}
              <figure
                className="relative -mt-3 ms-auto w-[70%]"
                style={{ transform: "translateX(6%) rotate(1deg)" }}
              >
                <PhotoField
                  variant="later"
                  label={t.photoLaterAlt}
                  className="aspect-[4/3] w-full rounded-[11px] shadow-[0_22px_46px_-24px_rgba(28,42,58,0.42)] ring-2 ring-[#FDFBF7]"
                />
                <figcaption className="mt-2">
                  <span className="block font-sans text-[9.5px] font-semibold uppercase tracking-[0.18em] text-accent-primary">
                    {t.laterLabel}
                  </span>
                  <span className="font-display text-[0.8125rem] italic leading-snug text-text-secondary">
                    {t.laterNote}
                  </span>
                </figcaption>
              </figure>
            </div>
          </Reveal>

          {/* ---- LEFT (desktop) / last: the large final book page + player ---- */}
          <Reveal className="md:order-3 md:col-span-2 lg:order-1 lg:col-span-1">
            <div className="relative mx-auto w-full max-w-[440px] md:max-w-[460px] lg:mx-0 lg:max-w-none lg:ps-4 lg:pe-14 xl:ps-10 xl:pe-20">
              <div
                role="img"
                aria-label={t.finalPageAria}
                className="rounded-[12px] bg-[#FEFDFB] p-4 shadow-[0_34px_70px_-36px_rgba(28,42,58,0.34)] ring-1 ring-[color:var(--border-subtle)] sm:p-5"
                style={{ transform: "rotate(-1deg)" }}
              >
                <PhotoField
                  variant="today"
                  className="aspect-[4/3] w-full rounded-[8px] ring-1 ring-border-subtle"
                />
                <div aria-hidden="true" className="mt-4 space-y-2 sm:mt-5">
                  <span className="block h-2 w-[92%] rounded-full bg-text-primary/10" />
                  <span className="block h-2 w-[82%] rounded-full bg-text-primary/10" />
                  <span className="block h-2 w-[88%] rounded-full bg-text-primary/10" />
                  <span className="block h-2 w-[46%] rounded-full bg-text-primary/10" />
                </div>
                <div className="mt-5 flex items-center gap-3 border-t border-border-subtle pt-4">
                  <QrGlyph size={42} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                    {t.qrLabel}
                  </span>
                </div>
              </div>

              {/* memory card: attached to the lower-right, spilling past the
                  page edge on lg+; stacked below the book on smaller screens */}
              <div className="mt-6 flex items-center justify-center gap-1 lg:absolute lg:-bottom-8 lg:-right-2 lg:z-20 lg:mt-0 xl:-right-4">
                <span className="hidden lg:block">
                  <ReadArc />
                </span>
                <div style={{ transform: "rotate(2deg)" }}>
                  <MemoryCard title={t.playerTitle} playLabel={t.playerPlay} />
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ============ 01 / 02 / 03 rail - belongs to the spread ============ */}
        <div className="mt-14 md:mt-16">
          <StepRail steps={t.steps} />
        </div>

        {/* ============ slim privacy row ============ */}
        <Reveal className="mx-auto mt-11 flex max-w-[72ch] items-start gap-3 border-t border-border-subtle pt-5 md:mt-12">
          <span className="mt-0.5 text-text-muted">
            <LockGlyph />
          </span>
          <p className="font-sans text-[0.8125rem] leading-[1.65] text-text-muted">
            <span className="font-medium text-text-primary">{t.privacyHeading}. </span>
            {t.privacy[0]} {t.privacy[1]}
          </p>
        </Reveal>

        {/* ============ emotional close ============ */}
        <Reveal delay={50} className="mt-14 text-center md:mt-16">
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
