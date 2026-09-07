'use client';

/**
 * HAYOT (Journey) — shared primitives.
 * ----------------------------------------------------------------
 * Reuses TALIMOON's existing narrative-page language, does not
 * invent a second system: Cormorant Garamond display + Manrope
 * body, cream #F7F3EC / navy #1C2A3A / restrained gold #B8935B, the
 * site's horizontal padding + reading container, and the same
 * reveal motion (opacity + a small rise, reduced-motion aware) that
 * About and Story Library use.
 *
 * This file holds ONLY what a foundation genuinely needs: the
 * type/colour constants, the reveal wrappers, the eyebrow + rule
 * marks, and a plain band shell. HAYOT's editorial rhythm (mixed
 * weights, the pulse, the stream) is deliberately NOT abstracted
 * here — those compositions arrive in later increments and each
 * owns its own layout.
 *
 * i18n: consumers pass `useT(EN, UZ)` copy objects; RU/AR fall back
 * to EN, exactly as the rest of the site does. Layout uses centred
 * measures / logical flow so it never depends on text length, and
 * the band accepts a `dir` for future RTL editions.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  WORLD_NAME_KEYS,
  WORLD_SLUG,
  toLocale,
  worldBlurb,
  worldName,
  type JourneyVideo,
  type JourneyWorld,
} from '@/lib/journey/types';

// ── Design constants (identical to about/shared.tsx) ────────────────
export const DISPLAY =
  "var(--font-cormorant-garamond), 'Cormorant Garamond', Georgia, serif";
export const BODY =
  "var(--font-manrope), 'Manrope', system-ui, -apple-system, sans-serif";

export const CREAM = '#F7F3EC';
export const CREAM_RAISED = '#FDFBF7';
export const NAVY = '#1C2A3A';
export const NAVY_80 = 'rgba(28,42,58,0.80)';
export const NAVY_64 = 'rgba(28,42,58,0.64)';
export const NAVY_48 = 'rgba(28,42,58,0.48)';
export const GOLD = '#B8935B';
export const GOLD_SOFT = 'rgba(184,147,91,0.35)';
export const GOLD_FAINT = 'rgba(184,147,91,0.14)';

// ── Scroll reveal ──────────────────────────────────────────────────
export const revealContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.04 } },
};

export const revealItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Wrap a block so its children rise in once, gently, on scroll. */
export function Reveal({
  children,
  className,
  amount = 0.2,
}: {
  children: React.ReactNode;
  className?: string;
  amount?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={reduced ? undefined : revealContainer}
      initial={reduced ? undefined : 'hidden'}
      whileInView={reduced ? undefined : 'visible'}
      viewport={{ once: true, amount }}
    >
      {children}
    </motion.div>
  );
}

/** A single revealed line/block. Plain element when motion is reduced. */
export function Rise({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduced = useReducedMotion();
  if (reduced) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
  return (
    <motion.div variants={revealItem} className={className} style={style}>
      {children}
    </motion.div>
  );
}

// ── Small shared marks ─────────────────────────────────────────────
/** The gold eyebrow the site uses to open a section (small caps,
 *  wide tracking) — matches Values / Our Products / About. */
export function Eyebrow({
  children,
  className = '',
  align = 'center',
}: {
  children: React.ReactNode;
  className?: string;
  align?: 'center' | 'start';
}) {
  return (
    <span
      className={`block uppercase ${align === 'center' ? 'text-center' : 'text-left'} ${className}`}
      style={{
        fontFamily: BODY,
        fontWeight: 600,
        fontSize: 13,
        letterSpacing: '0.26em',
        color: GOLD,
      }}
    >
      {children}
    </span>
  );
}

/** A short centred gold hairline — the divider mark the site uses
 *  under eyebrows and between movements. */
export function GoldRule({
  width = 44,
  className = '',
}: {
  width?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`mx-auto block ${className}`}
      style={{
        width,
        height: 1,
        background: `linear-gradient(to right, transparent, ${GOLD}, transparent)`,
      }}
    />
  );
}

// ── Band shell ─────────────────────────────────────────────────────
/**
 * A HAYOT band: full-width, its own vertical rhythm (passed via
 * `className`), the site's horizontal padding + reading container.
 * `tone="raised"` uses the slightly lighter paper. `dir` is passed
 * straight through for future RTL editions.
 */
export function Band({
  id,
  children,
  tone = 'cream',
  className = '',
  labelledBy,
  dir,
}: {
  id?: string;
  children: React.ReactNode;
  tone?: 'cream' | 'raised';
  className?: string;
  labelledBy?: string;
  dir?: 'ltr' | 'rtl';
}) {
  const bg = tone === 'raised' ? CREAM_RAISED : CREAM;
  return (
    <section
      id={id}
      dir={dir}
      aria-labelledby={labelledBy}
      className={`relative w-full overflow-hidden px-6 md:px-10 lg:px-16 ${className}`}
      style={{ backgroundColor: bg, color: NAVY }}
    >
      <div className="mx-auto w-full max-w-[1200px]">{children}</div>
    </section>
  );
}

// ── Kicker (label · date) ──────────────────────────────────────────
/** The small gold strand-mark that opens an entry: "TASHRIF · 29 AVGUST"
 *  or just "BIR FIKR". Never a heading — a `<p>`. */
export function Kicker({
  label,
  date,
  className = '',
}: {
  label: string;
  date?: string;
  className?: string;
}) {
  return (
    <p
      className={`text-[12px] uppercase md:text-[13px] ${className}`}
      style={{
        fontFamily: BODY,
        fontWeight: 600,
        letterSpacing: '0.22em',
        color: GOLD,
      }}
    >
      {label}
      {date ? (
        <>
          <span aria-hidden="true" style={{ color: NAVY_48 }}>
            {' · '}
          </span>
          <span style={{ color: NAVY_64 }}>{date}</span>
        </>
      ) : null}
    </p>
  );
}

// ── QuietLink ("label →") ──────────────────────────────────────────
/** The editorial "continue" affordance used across HAYOT — a plain
 *  text link with a gold arrow that nudges on hover. Not a button;
 *  `.tm-cta-gold` is reserved for "purchase". */
export function QuietLink({
  href,
  children,
  external = false,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  className?: string;
}) {
  const cls = `group inline-flex items-center gap-2 text-[15px] transition-opacity duration-300 hover:opacity-70 ${className}`;
  const style = { fontFamily: BODY, fontWeight: 600, color: NAVY } as const;
  const inner = (
    <>
      <span>{children}</span>
      <span
        aria-hidden="true"
        className="transition-transform duration-300 group-hover:translate-x-1"
        style={{ color: GOLD }}
      >
        &rarr;
      </span>
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={style}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls} style={style}>
      {inner}
    </Link>
  );
}

// ── Month labels for compact dates ────────────────────────────────
const MONTHS_UZ = [
  'YANV', 'FEV', 'MART', 'APR', 'MAY', 'IYUN',
  'IYUL', 'AVG', 'SENT', 'OKT', 'NOYA', 'DEK',
];
const MONTHS_EN = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

/** "29 AVG" / "AUG 29" — a short, quiet editorial date. */
export function shortDate(iso: string, locale: string): string {
  const d = new Date(iso);
  const day = d.getUTCDate();
  const mon = (locale === 'uz' ? MONTHS_UZ : MONTHS_EN)[d.getUTCMonth()] ?? '';
  return locale === 'uz' ? `${day} ${mon}` : `${mon} ${day}`;
}

/** "2:34" from seconds. */
export function clock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.abs(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── Editorial worlds ──────────────────────────────────────────────
/** Re-exported from the model so components have one import site. */
export const WORLD_NAME = WORLD_NAME_KEYS;
export { worldName, worldBlurb };

/** `/journey/talimoon` etc. */
export function worldPath(world: JourneyWorld): string {
  return `/journey/${WORLD_SLUG[world]}`;
}

/** The restrained world tag carried by stream entries and the
 *  detail header. Small caps, gold, never a colour-coded chip. */
export function WorldLabel({
  world,
  language,
  className = '',
  as = 'span',
}: {
  world: JourneyWorld;
  language: string;
  className?: string;
  as?: 'span' | 'link';
}) {
  const name = worldName(world, toLocale(language));
  const cls = `text-[11px] uppercase ${className}`;
  const style = {
    fontFamily: BODY,
    fontWeight: 600,
    letterSpacing: '0.2em',
    color: GOLD,
  } as const;
  if (as === 'link') {
    return (
      <Link
        href={worldPath(world)}
        className={`${cls} transition-opacity duration-300 hover:opacity-60`}
        style={style}
      >
        {name}
      </Link>
    );
  }
  return (
    <span className={cls} style={style}>
      {name}
    </span>
  );
}

// ── Film surface (self-hosted file) ────────────────────────────────
/**
 * A native <video> on a dark 16:9 mat with one extra affordance: a
 * round centre play/pause cue. It sits over the poster at rest;
 * pressing it starts the film and it fades out ~1s later. Any pointer
 * activity over the surface brings it (and the native controls) back,
 * and it fades again 1s after the pointer goes quiet. While the film
 * is paused it always stays. Native controls remain for scrubbing,
 * volume and fullscreen.
 */
function FilmSurface({ video }: { video: JourneyVideo }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [cueVisible, setCueVisible] = useState(true);

  const clearHide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const armHide = useCallback(() => {
    clearHide();
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setCueVisible(false);
    }, 1000);
  }, [clearHide]);

  const reveal = useCallback(() => {
    setCueVisible(true);
    armHide();
  }, [armHide]);

  const toggle = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  }, []);

  useEffect(() => clearHide, [clearHide]);

  return (
    <div
      className="tm-media-float relative aspect-video w-full overflow-hidden"
      style={{ background: '#0c1116' }}
      onMouseEnter={reveal}
      onMouseMove={reveal}
      onTouchStart={reveal}
    >
      <video
        ref={videoRef}
        controls
        preload="none"
        playsInline
        poster={video.poster.src}
        className="absolute inset-0 h-full w-full object-contain"
        onPlay={() => {
          setPlaying(true);
          armHide();
        }}
        onPause={() => {
          setPlaying(false);
          clearHide();
          setCueVisible(true);
        }}
        onEnded={() => {
          setPlaying(false);
          clearHide();
          setCueVisible(true);
        }}
      >
        <source src={video.src} />
        {video.captionsSrc ? (
          <track kind="captions" src={video.captionsSrc} srcLang="uz" default />
        ) : null}
      </video>

      <button
        type="button"
        aria-label={playing ? 'Pause' : 'Play'}
        onClick={toggle}
        onFocus={reveal}
        className={`absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none transition-opacity duration-300 focus-visible:ring-2 focus-visible:ring-[#B8935B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1116] ${
          cueVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{
          backgroundColor: 'rgba(247,243,236,0.94)',
          boxShadow: '0 6px 24px rgba(12,17,22,0.28)',
        }}
      >
        {playing ? (
          <span aria-hidden="true" className="flex gap-[5px]">
            <span
              className="block h-[18px] w-[4px] rounded-[1px]"
              style={{ backgroundColor: NAVY }}
            />
            <span
              className="block h-[18px] w-[4px] rounded-[1px]"
              style={{ backgroundColor: NAVY }}
            />
          </span>
        ) : (
          <span
            aria-hidden="true"
            className="ms-1 block h-0 w-0"
            style={{
              borderTop: '11px solid transparent',
              borderBottom: '11px solid transparent',
              borderInlineStart: `18px solid ${NAVY}`,
            }}
          />
        )}
      </button>
    </div>
  );
}

// ── VideoPlayer ────────────────────────────────────────────────────
/**
 * Poster-first video. Nothing loads until the visitor presses play
 * (`preload="none"`), never autoplays, always has controls, and
 * carries a captions track + a collapsible transcript when supplied.
 * Self-hosted files use a native <video>; YouTube uses the
 * privacy-preserving nocookie embed (real TALIMOON films should be
 * `provider: 'file'` for the cleanest, un-branded experience).
 */
export function VideoPlayer({
  video,
  className = '',
  transcriptLabel = 'Transcript',
}: {
  video: JourneyVideo;
  className?: string;
  transcriptLabel?: string;
}) {
  // The inline slot stays horizontal (a 16:9 plate) whatever the
  // source shape — a vertical film simply sits centred inside it on a
  // dark mat. Fullscreen is native, so a portrait film still fills the
  // screen edge to edge when the visitor expands it.
  return (
    <div className={className}>
      {video.provider === 'file' ? (
        <FilmSurface video={video} />
      ) : (
        <div className="tm-media-float relative aspect-video w-full bg-[#0c1116]">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.src}?rel=0`}
            title="Video"
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      )}

      {video.credit || video.transcript ? (
        <div className="mt-3 space-y-2">
          {video.credit ? (
            <p
              className="text-[12px]"
              style={{ fontFamily: BODY, color: NAVY_48, letterSpacing: '0.02em' }}
            >
              {video.credit}
            </p>
          ) : null}
          {video.transcript ? (
            <details>
              <summary
                className="cursor-pointer text-[12px] uppercase"
                style={{
                  fontFamily: BODY,
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  color: NAVY_48,
                }}
              >
                {transcriptLabel}
              </summary>
              <p
                className="mt-3 text-[15px]"
                style={{ fontFamily: BODY, color: NAVY_64, lineHeight: 1.75 }}
              >
                {video.transcript}
              </p>
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
