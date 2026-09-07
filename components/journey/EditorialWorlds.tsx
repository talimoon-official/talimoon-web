'use client';

/**
 * HAYOT — THE THREE EDITORIAL WORLDS (V2, landing section B).
 * ----------------------------------------------------------------
 * A premium editorial cover / visual table of contents, not three
 * SaaS cards. Each world is a PORTAL with its own composition:
 *
 *   01  TALIMOON HAYOTI   — a wide, layered landscape portal: a
 *       dominant media frame with a small overlapping second frame.
 *       Cinematic, active.
 *   02  OTA-ONALAR UCHUN   — an intimate portrait portal, reading-
 *       oriented, warm.
 *   03  ODATLAR VA ILM     — a precise square portal, observational.
 *
 * Every slot is REAL: a media frame, a facet row, a latest-content
 * area, an entry affordance. Until real content is published the
 * media frames render prepared editorial placeholders (warm paper,
 * a hairline gold inset, crop-mark ticks, a quiet media-type label)
 * and the latest-content area holds its space with one restrained
 * line. Nothing is faked — no invented headline, date, source or
 * count. When entries are added the portal fills itself:
 * `getWorldPreview()` supplies the newest entry's media (via
 * `mediaPolicy`), headline and kicker, and the second-newest for the
 * overlapping frame. No redesign required.
 */

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  getWorldPreviews,
  mediaPolicy,
  resolveEntryContent,
  type WorldPreview,
} from '@/lib/journey/content';
import {
  JOURNEY_WORLDS,
  toLocale,
  worldBlurb,
  worldName,
  type JourneyEntry,
  type JourneyWorld,
  type Locale,
} from '@/lib/journey/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  Band,
  BODY,
  CREAM,
  CREAM_RAISED,
  DISPLAY,
  GOLD,
  GOLD_FAINT,
  NAVY,
  NAVY_48,
  NAVY_64,
  Reveal,
  Rise,
  worldPath,
} from './shared';

// ── Copy (all four site languages authored) ───────────────────────
type WorldCopy = {
  mediaType: string;
  facets: readonly string[];
  latestLabel: string;
  emptyLine: string;
};
type Copy = {
  eyebrow: string;
  open: string;
  source: string;
  worlds: Record<JourneyWorld, WorldCopy>;
};

const COPY: Record<Locale, Copy> = {
  uz: {
    eyebrow: 'HAYOTNING UCH TOMONI',
    open: 'Ochish',
    source: 'Manba',
    worlds: {
      'talimoon-life': {
        mediaType: 'SURAT · VIDEO',
        facets: ['YANGILIKLAR', 'VIDEO', 'LAHZALAR'],
        latestLabel: "So‘nggi",
        emptyLine: 'Yangi hikoya uchun joy.',
      },
      parents: {
        mediaType: 'OILA VA BOLA',
        facets: ['BOLA PSIXOLOGIYASI', 'TARBIYA', 'OILA'],
        latestLabel: 'Foydali o‘qish',
        emptyLine: 'Foydali o‘qish uchun joy.',
      },
      'wisdom-science': {
        mediaType: 'YAQIN KADR',
        facets: ['ODATLAR', 'ILM', 'TADQIQOT'],
        latestLabel: 'Tadqiqot',
        emptyLine: 'Keyingi kashfiyot uchun joy.',
      },
    },
  },
  en: {
    eyebrow: 'THREE SIDES OF LIFE',
    open: 'Open',
    source: 'Source',
    worlds: {
      'talimoon-life': {
        mediaType: 'PHOTO · FILM',
        facets: ['NEWS', 'FILM', 'MOMENTS'],
        latestLabel: 'Latest',
        emptyLine: 'Space for the next story.',
      },
      parents: {
        mediaType: 'FAMILY & CHILD',
        facets: ['CHILD PSYCHOLOGY', 'UPBRINGING', 'FAMILY'],
        latestLabel: 'Useful read',
        emptyLine: 'Space for a useful read.',
      },
      'wisdom-science': {
        mediaType: 'CLOSE OBSERVATION',
        facets: ['HABITS', 'SCIENCE', 'RESEARCH'],
        latestLabel: 'Research',
        emptyLine: 'Space for the next discovery.',
      },
    },
  },
  ru: {
    eyebrow: 'ТРИ СТОРОНЫ ЖИЗНИ',
    open: 'Открыть',
    source: 'Источник',
    worlds: {
      'talimoon-life': {
        mediaType: 'ФОТО · ВИДЕО',
        facets: ['НОВОСТИ', 'ВИДЕО', 'МОМЕНТЫ'],
        latestLabel: 'Последнее',
        emptyLine: 'Место для новой истории.',
      },
      parents: {
        mediaType: 'СЕМЬЯ И РЕБЁНОК',
        facets: ['ПСИХОЛОГИЯ', 'ВОСПИТАНИЕ', 'СЕМЬЯ'],
        latestLabel: 'Полезное чтение',
        emptyLine: 'Место для полезного чтения.',
      },
      'wisdom-science': {
        mediaType: 'КРУПНЫЙ ПЛАН',
        facets: ['ПРИВЫЧКИ', 'НАУКА', 'ИССЛЕДОВАНИЕ'],
        latestLabel: 'Исследование',
        emptyLine: 'Место для следующего открытия.',
      },
    },
  },
  ar: {
    eyebrow: 'ثلاثة جوانب من الحياة',
    open: 'افتح',
    source: 'المصدر',
    worlds: {
      'talimoon-life': {
        mediaType: 'صورة · فيديو',
        facets: ['أخبار', 'فيديو', 'لحظات'],
        latestLabel: 'الأحدث',
        emptyLine: 'مكان للقصة القادمة.',
      },
      parents: {
        mediaType: 'الأسرة والطفل',
        facets: ['نفسية الطفل', 'التربية', 'الأسرة'],
        latestLabel: 'قراءة مفيدة',
        emptyLine: 'مكان لقراءة مفيدة.',
      },
      'wisdom-science': {
        mediaType: 'لقطة قريبة',
        facets: ['العادات', 'العلم', 'البحث'],
        latestLabel: 'بحث',
        emptyLine: 'مكان للاكتشاف القادم.',
      },
    },
  },
};

const VARIANT: Record<JourneyWorld, 'wide' | 'tall' | 'compact'> = {
  'talimoon-life': 'wide',
  parents: 'tall',
  'wisdom-science': 'compact',
};

const WORLD_FALLBACK_MEDIA: Record<
  JourneyWorld,
  { primary: string; secondary?: string }
> = {
  'talimoon-life': {
    primary: '/images/journey/journey-talimoon-life-child-book-moment.png',
    secondary: '/images/journey/journey-talimoon-life-book-detail.png',
  },
  parents: {
    primary: '/images/journey/journey-parents-listening-child.png',
  },
  'wisdom-science': {
    primary: '/images/journey/journey-habits-knowledge-research.png',
  },
};

// ── Prepared editorial marks (empty media frame) ──────────────────
const TICK_COLOR = 'rgba(184,147,91,0.5)';

function CornerTicks() {
  return (
    <>
      {(
        [
          'left-2 top-2 border-s border-t',
          'right-2 top-2 border-e border-t',
          'left-2 bottom-2 border-s border-b',
          'right-2 bottom-2 border-e border-b',
        ] as const
      ).map((pos) => (
        <span
          key={pos}
          aria-hidden="true"
          className={`pointer-events-none absolute h-3 w-3 ${pos}`}
          style={{ borderColor: TICK_COLOR }}
        />
      ))}
    </>
  );
}

function EditorialMark({ focal }: { focal?: boolean }) {
  if (focal) {
    // world 03 — an observational focal ring
    return (
      <span
        aria-hidden="true"
        className="relative block h-7 w-7 rounded-full"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(184,147,91,0.4)' }}
      >
        <span
          className="absolute left-1/2 top-1/2 block h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ backgroundColor: 'rgba(184,147,91,0.6)' }}
        />
      </span>
    );
  }
  // worlds 01 / 02 — a quiet crosshair
  return (
    <span aria-hidden="true" className="relative block h-5 w-5">
      <span
        className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2"
        style={{ backgroundColor: 'rgba(184,147,91,0.5)' }}
      />
      <span
        className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2"
        style={{ backgroundColor: 'rgba(184,147,91,0.5)' }}
      />
    </span>
  );
}

function MediaFrame({
  ratio,
  src,
  alt,
  priority,
  markerLabel,
  focal,
  playCue,
  sizes = '(max-width: 1024px) 100vw, 50vw',
  imageClassName,
}: {
  ratio: string;
  src?: string | null;
  alt?: string;
  priority?: boolean;
  markerLabel?: string;
  focal?: boolean;
  playCue?: boolean;
  sizes?: string;
  /** Extra classes appended to the image (e.g. a mobile-only object-position). */
  imageClassName?: string;
}) {
  return (
    <div
      className={`tm-media-float tm-media-float-interactive relative w-full ${ratio}`}
      style={{ backgroundColor: CREAM_RAISED }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt ?? ''}
          fill
          priority={priority}
          sizes={sizes}
          className={`object-cover motion-safe:transition-transform motion-safe:duration-[900ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:scale-[1.03] motion-safe:group-focus-visible:scale-[1.03] ${imageClassName ?? ''}`}
        />
      ) : (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{
            backgroundColor: CREAM_RAISED,
            backgroundImage:
              'repeating-linear-gradient(135deg, rgba(184,147,91,0.05) 0 1px, transparent 1px 9px)',
          }}
        >
          <EditorialMark focal={focal} />
          {markerLabel ? (
            <span
              className="px-6 text-center text-[10px] uppercase"
              style={{
                fontFamily: BODY,
                fontWeight: 600,
                letterSpacing: '0.22em',
                color: NAVY_48,
              }}
            >
              {markerLabel}
            </span>
          ) : null}
          <CornerTicks />
        </div>
      )}

      {/* hairline gold inset on both states — a plate border */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: `inset 0 0 0 1px ${GOLD_FAINT}` }}
      />

      {playCue ? (
        <span
          aria-hidden="true"
          className="absolute bottom-3 start-3 flex h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(253,251,247,0.92)' }}
        >
          <span
            className="ms-0.5 block h-0 w-0"
            style={{
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderInlineStart: `8px solid ${NAVY}`,
            }}
          />
        </span>
      ) : null}
    </div>
  );
}

// ── One world portal ─────────────────────────────────────────────
function WorldPortal({
  preview,
  index,
  language,
}: {
  preview: WorldPreview;
  index: number;
  language: string;
}) {
  const { world } = preview;
  const locale = toLocale(language);
  const c = COPY[locale] ?? COPY.en;
  const wc = c.worlds[world];
  const variant = VARIANT[world];

  const name = worldName(world, locale);
  const blurb = worldBlurb(world, locale);
  const num = String(index + 1).padStart(2, '0');

  const primaryView = mediaView(preview.primary, locale);
  const secondaryView = mediaView(preview.secondary, locale);
  const fallbackMedia = WORLD_FALLBACK_MEDIA[world];
  // Every world keeps its own enduring gateway artwork here. This is
  // the permanent Journey section identity: a newly published or
  // featured piece belongs in the premiere hero, the journal stream
  // and its detail page, never in this visual index where it would
  // overwrite the category's established look. `primaryView` /
  // `secondaryView` are still resolved above so the surrounding copy
  // (facets, latest line) can use them without changing this frame.
  const fixedGatewayArtwork = true;
  const primarySrc = fixedGatewayArtwork
    ? fallbackMedia.primary
    : primaryView?.src ?? fallbackMedia.primary;
  const primaryAlt = fixedGatewayArtwork ? name : primaryView?.alt || name;
  const primaryPlayCue = fixedGatewayArtwork ? false : primaryView?.isVideo;
  const secondarySrc = fixedGatewayArtwork
    ? fallbackMedia.secondary ?? null
    : secondaryView?.src ?? fallbackMedia.secondary ?? null;

  const numEl = (
    <span
      aria-hidden="true"
      className={
        variant === 'wide'
          ? 'block text-[40px] leading-none sm:text-[48px] lg:text-[56px]'
          : 'block text-[30px] leading-none lg:text-[36px]'
      }
      style={{ fontFamily: DISPLAY, fontWeight: 600, color: GOLD, opacity: 0.42 }}
    >
      {num}
    </span>
  );

  const nameEl = (
    <h3
      className={
        variant === 'wide'
          ? 'mt-3 text-[30px] sm:text-[36px] lg:text-[44px]'
          : 'mt-2.5 text-[24px] sm:text-[27px] lg:text-[30px]'
      }
      style={{
        fontFamily: DISPLAY,
        fontWeight: 600,
        color: NAVY,
        lineHeight: 1.12,
        letterSpacing: '-0.015em',
      }}
    >
      {name}
    </h3>
  );

  const blurbEl = (
    <p
      className="mt-3 max-w-[46ch] text-[14px] lg:text-[15px]"
      style={{ fontFamily: BODY, color: NAVY_64, lineHeight: 1.7 }}
    >
      {blurb}
    </p>
  );

  const facetsEl = (
    <ul className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
      {wc.facets.map((f, i) => (
        <li key={f} className="flex items-center gap-2.5">
          {i > 0 ? (
            <span aria-hidden="true" style={{ color: 'rgba(184,147,91,0.55)' }}>
              ·
            </span>
          ) : null}
          <span
            className="text-[10px] uppercase"
            style={{
              fontFamily: BODY,
              fontWeight: 600,
              letterSpacing: '0.18em',
              color: NAVY_48,
            }}
          >
            {f}
          </span>
        </li>
      ))}
    </ul>
  );

  const affordanceEl = (
    <div className="mt-7 flex items-center gap-3.5">
      <span
        aria-hidden="true"
        className="tm-portal-open-line block h-px w-10 origin-left motion-safe:group-hover:scale-x-125 motion-safe:group-focus-visible:scale-x-125"
        style={{ backgroundColor: GOLD }}
      />
      <span
        className="text-[12px] uppercase"
        style={{
          fontFamily: BODY,
          fontWeight: 800,
          letterSpacing: '0.18em',
          color: NAVY,
        }}
      >
        {c.open}
      </span>
      <span
        aria-hidden="true"
        className="tm-portal-open-arrow text-[14px] rtl:-scale-x-100 motion-safe:group-hover:translate-x-1.5 motion-safe:group-focus-visible:translate-x-1.5"
        style={{ color: GOLD }}
      >
        &rarr;
      </span>
    </div>
  );

  const linkClass =
    'group block rounded-[2px] outline-none focus-visible:ring-2 focus-visible:ring-[#B8935B] focus-visible:ring-offset-4 focus-visible:ring-offset-[#FDFBF7]';

  if (variant === 'wide') {
    return (
      <Link href={worldPath(world)} aria-label={name} className={linkClass}>
        <div className="grid gap-7 md:gap-9 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-14">
          <div className="relative min-w-0 pb-12 pe-6 sm:pb-12 sm:pe-12 lg:pb-14 lg:pe-14">
            <MediaFrame
              ratio="aspect-[4/3] sm:aspect-[3/2] lg:aspect-auto lg:h-[430px]"
              src={primarySrc}
              alt={primaryAlt}
              priority
              playCue={primaryPlayCue}
              markerLabel={wc.mediaType}
              sizes="(max-width: 1024px) 92vw, 46vw"
              imageClassName="max-sm:object-[100%_50%] sm:object-center"
            />
            {/* the smaller overlapping frame */}
            <div
              className="absolute -bottom-5 end-0 w-[38%] max-w-[180px] sm:bottom-0 motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:-translate-y-1"
            >
              <div
                className="relative rounded-[20px] p-px"
                style={{
                  background:
                    'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(184,147,91,0.62) 48%, rgba(126,91,40,0.34) 100%)',
                  boxShadow:
                    '0 24px 48px -24px rgba(28,35,50,0.42), 0 10px 24px -16px rgba(28,35,50,0.34), 0 1px 0 rgba(255,255,255,0.88)',
                }}
              >
                <div
                  className="rounded-[19px] p-[5px]"
                  style={{
                    background:
                      'linear-gradient(145deg, rgba(253,251,247,0.99), rgba(247,241,230,0.96))',
                  }}
                >
                  <MediaFrame
                    ratio="aspect-[3/4]"
                    src={secondarySrc}
                    alt={secondaryView?.alt || name}
                    markerLabel={undefined}
                    sizes="180px"
                  />
                </div>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-[2px] rounded-[18px]"
                  style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.6)' }}
                />
              </div>
            </div>
          </div>

          <div className="min-w-0">
            {numEl}
            {nameEl}
            {blurbEl}
            {facetsEl}
            {affordanceEl}
          </div>
        </div>
      </Link>
    );
  }

  // tall (02) + compact (03)
  return (
    <Link href={worldPath(world)} aria-label={name} className={`${linkClass} h-full`}>
      <div className="flex h-full flex-col">
        <MediaFrame
          ratio={
            variant === 'tall'
              ? 'aspect-[3/2] lg:aspect-auto lg:h-[420px]'
              : 'aspect-[4/3] sm:aspect-[3/2] lg:aspect-auto lg:h-[420px]'
          }
          src={primarySrc}
          alt={primaryAlt}
          playCue={primaryPlayCue}
          focal={variant === 'compact'}
          markerLabel={wc.mediaType}
          sizes="(max-width: 1024px) 92vw, 40vw"
          imageClassName={
            variant === 'tall' ? 'max-sm:object-[64%_50%] sm:object-center' : undefined
          }
        />
        <div className="mt-6 flex flex-1 flex-col">
          {numEl}
          {nameEl}
          {blurbEl}
          {facetsEl}
          {affordanceEl}
        </div>
      </div>
    </Link>
  );
}

// ── entry → what the portal shows ────────────────────────────────
function mediaView(entry: JourneyEntry | null, locale: Locale) {
  if (!entry) return null;
  const { content } = resolveEntryContent(entry, locale);
  const policy = mediaPolicy(entry);
  const asset = entry.cover ?? entry.video?.poster ?? null;
  const isFixturePlaceholder = asset?.src.startsWith('/journey/fixtures/');
  const src =
    policy.showMedia && asset && asset.src.trim() !== '' && !isFixturePlaceholder
      ? asset.src
      : null;
  const headline = content.title ?? content.standfirst ?? '';
  const meta = content.kicker
    ? [content.kicker.label, content.kicker.dateLabel].filter(Boolean).join(' · ')
    : '';
  return {
    src,
    alt: content.coverAlt ?? '',
    headline,
    meta,
    isVideo: Boolean(entry.video) && Boolean(src),
  };
}

// ── Section ──────────────────────────────────────────────────────
export function EditorialWorlds() {
  const { language } = useLanguage();
  const locale = toLocale(language);
  const previews = useMemo(() => getWorldPreviews(), []);
  const c = COPY[locale] ?? COPY.en;
  const [w1, w2, w3] = JOURNEY_WORLDS;

  return (
    <Band
      tone="raised"
      labelledBy="journey-worlds-heading"
      dir={locale === 'ar' ? 'rtl' : undefined}
      className="border-t border-[#1c2a3a17] py-16 md:py-24 lg:py-28"
    >
      <Reveal amount={0.1}>
        <Rise>
          <h2
            id="journey-worlds-heading"
            className="text-[13px] uppercase"
            style={{
              fontFamily: BODY,
              fontWeight: 600,
              letterSpacing: '0.26em',
              color: GOLD,
            }}
          >
            {c.eyebrow}
          </h2>
        </Rise>

        <Rise className="mt-10 md:mt-14">
          <WorldPortal preview={previews[w1]} index={0} language={language} />
        </Rise>

        <div className="mt-14 grid gap-12 md:mt-20 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:gap-14">
          <Rise className="min-w-0">
            <WorldPortal preview={previews[w2]} index={1} language={language} />
          </Rise>
          <Rise className="min-w-0">
            <WorldPortal preview={previews[w3]} index={2} language={language} />
          </Rise>
        </div>
      </Reveal>
    </Band>
  );
}

export default EditorialWorlds;
