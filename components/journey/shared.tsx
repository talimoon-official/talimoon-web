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
import Image from 'next/image';
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
 * A native <video> in a premium horizontal 16:9 plate. A `landscape`
 * film simply fills it. A `portrait` (9:16) film is NOT stretched: it
 * plays crisp and centred at its true aspect on a soft blurred fill
 * of its own cover (the treatment Shorts / Reels embeds use), so the
 * inline frame reads as intentional, never as a letterboxed strip.
 * Fullscreen is native, so tapping fullscreen on a phone opens the
 * vertical film full-height in portrait.
 *
 * Both open with the cinematic cover artwork as a real UI poster (no
 * Play icon burned into the asset) plus a round centre play/pause
 * cue. Pressing the cue starts the film: the poster fades out, the
 * video is revealed, and the cue fades ~1s later. Any pointer
 * activity brings the cue (and the native controls) back; while
 * paused it stays. Native controls handle scrubbing, volume and
 * fullscreen.
 */
/**
 * A `<video>` with the non-standard fullscreen hooks Safari / iOS add.
 * iOS never implemented `Element.requestFullscreen()` — only a video
 * element can go fullscreen there, via `webkitEnterFullscreen()`.
 */
type FullscreenVideo = HTMLVideoElement & {
  webkitRequestFullscreen?: () => void;
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
};

function FilmSurface({
  video,
  posterAlt = '',
  playLabel = 'Play',
  pauseLabel = 'Pause',
  enterFullscreenLabel = 'Enter fullscreen',
  exitFullscreenLabel = 'Exit fullscreen',
}: {
  video: JourneyVideo;
  posterAlt?: string;
  playLabel?: string;
  pauseLabel?: string;
  enterFullscreenLabel?: string;
  exitFullscreenLabel?: string;
}) {
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [cueVisible, setCueVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // ── Fullscreen — a custom control on the OUTER frame, targeting the
  //    <video> element so the portrait frame is shown whole, centred and
  //    letterboxed (never a giant article canvas), and iOS hands off to
  //    its native portrait player. Synced via events so Esc / the OS UI
  //    also keep the button's label + icon correct.
  useEffect(() => {
    const el = videoRef.current as FullscreenVideo | null;
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    const onIOSBegin = () => setIsFullscreen(true);
    const onIOSEnd = () => setIsFullscreen(false);
    document.addEventListener('fullscreenchange', onFsChange);
    el?.addEventListener('webkitbeginfullscreen', onIOSBegin);
    el?.addEventListener('webkitendfullscreen', onIOSEnd);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      el?.removeEventListener('webkitbeginfullscreen', onIOSBegin);
      el?.removeEventListener('webkitendfullscreen', onIOSEnd);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = videoRef.current as FullscreenVideo | null;
    if (!el) return;
    reveal();

    const doc = document as Document & { webkitExitFullscreen?: () => void };
    if (doc.fullscreenElement) {
      void doc.exitFullscreen();
      return;
    }
    if (el.webkitDisplayingFullscreen) {
      el.webkitExitFullscreen?.();
      return;
    }
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => el.webkitEnterFullscreen?.());
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else {
      el.webkitEnterFullscreen?.();
    }
  }, [reveal]);

  const portrait = video.orientation === 'portrait';

  const videoEl = (
    <video
      ref={videoRef}
      controls
      preload="none"
      playsInline
      className={`tm-film-video absolute inset-0 h-full w-full ${
        portrait ? 'object-contain' : 'object-cover'
      }`}
      style={portrait ? { background: '#0c1116' } : undefined}
      onPlay={() => {
        setPlaying(true);
        armHide();
      }}
      onPlaying={() => setStarted(true)}
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
  );

  // The cinematic cover artwork is its own 16:9 banner — shown IN FULL
  // across the whole plate (not cropped into the portrait stage) until
  // playback actually begins, then it fades to reveal the film.
  const posterEl = (
    <div
      aria-hidden={started}
      className={`absolute inset-0 transition-opacity duration-500 ease-out ${
        started ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <Image
        src={video.poster.src}
        alt={posterAlt}
        fill
        sizes="(min-width: 1024px) 1000px, 100vw"
        className="object-cover object-center"
      />
    </div>
  );

  const cueEl = (
    <button
      type="button"
      aria-label={playing ? pauseLabel : playLabel}
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
  );

  // Anchored to the OUTER frame's lower-right (this button is a direct
  // child of `.tm-media-float`, not of the inner portrait stage), so the
  // whole dark plate reads and behaves as the video player.
  const fullscreenBtn = (
    <button
      type="button"
      aria-label={isFullscreen ? exitFullscreenLabel : enterFullscreenLabel}
      onClick={toggleFullscreen}
      onFocus={reveal}
      className={`absolute bottom-4 right-4 z-20 flex h-11 w-11 items-center justify-center rounded-xl text-[#F7F3EC] outline-none backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-[#B8935B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1116] ${
        reduced ? '' : 'transition-opacity duration-300'
      } ${cueVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      style={{
        backgroundColor: 'rgba(12,17,22,0.55)',
        boxShadow: 'inset 0 0 0 1px rgba(247,243,236,0.16)',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="17"
        height="17"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {isFullscreen ? (
          <>
            <path d="M9 4v5H4" />
            <path d="M15 4v5h5" />
            <path d="M9 20v-5H4" />
            <path d="M15 20v-5h5" />
          </>
        ) : (
          <>
            <path d="M4 9V4h5" />
            <path d="M20 9V4h-5" />
            <path d="M4 15v5h5" />
            <path d="M20 15v5h-5" />
          </>
        )}
      </svg>
    </button>
  );

  return (
    <div
      className="tm-media-float relative aspect-video w-full overflow-hidden"
      style={{ background: '#0c1116' }}
      onMouseEnter={reveal}
      onMouseMove={reveal}
      onTouchStart={reveal}
    >
      {portrait ? (
        <>
          {/* Once playing: the vertical film sits crisp + centred at its
              true 9:16 on a soft blurred fill of the cover, so the
              horizontal plate stays full without stretching the clip. */}
          <div aria-hidden="true" className="absolute inset-0">
            <Image
              src={video.poster.src}
              alt=""
              fill
              sizes="100vw"
              className="scale-110 object-cover blur-2xl"
            />
            <span
              className="absolute inset-0"
              style={{ background: 'rgba(12,17,22,0.5)' }}
            />
          </div>
          <div
            className="absolute left-1/2 top-1/2 aspect-[9/16] h-full -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2px]"
            style={{ boxShadow: '0 12px 44px rgba(0,0,0,0.45)' }}
          >
            {videoEl}
          </div>
          {/* Full-bleed 16:9 banner on top until play. */}
          {posterEl}
          {cueEl}
          {fullscreenBtn}
        </>
      ) : (
        <>
          {videoEl}
          {posterEl}
          {cueEl}
          {fullscreenBtn}
        </>
      )}
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
  posterAlt = '',
  playLabel = 'Play',
  pauseLabel = 'Pause',
  enterFullscreenLabel = 'Enter fullscreen',
  exitFullscreenLabel = 'Exit fullscreen',
}: {
  video: JourneyVideo;
  className?: string;
  transcriptLabel?: string;
  posterAlt?: string;
  playLabel?: string;
  pauseLabel?: string;
  enterFullscreenLabel?: string;
  exitFullscreenLabel?: string;
}) {
  // Self-hosted files render through FilmSurface: a horizontal 16:9
  // plate, with a 9:16 film shown crisp + centred on a blurred fill
  // (never stretched), and a custom fullscreen control on the outer
  // frame (targeting the <video>, so the portrait frame stays whole).
  return (
    <div className={className}>
      {video.provider === 'file' ? (
        <FilmSurface
          video={video}
          posterAlt={posterAlt}
          playLabel={playLabel}
          pauseLabel={pauseLabel}
          enterFullscreenLabel={enterFullscreenLabel}
          exitFullscreenLabel={exitFullscreenLabel}
        />
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
