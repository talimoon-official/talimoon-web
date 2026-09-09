"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  getFeaturedEntry,
  getStreamEntries,
  mediaPolicy,
  resolveEntryContent,
} from "@/lib/journey/content";
import {
  JOURNEY_WORLDS,
  toLocale,
  worldBlurb,
  worldName,
  type JourneyWorld,
} from "@/lib/journey/types";
import { useLanguage, useT } from "@/lib/i18n/LanguageContext";
import { BODY, DISPLAY, worldPath } from "./shared";

const EN = {
  eyebrow: "NEW IN JOURNEY",
  read: "Explore the story",
  watch: "Watch the premiere",
  enter: "Enter this world",
  slide: "Premiere",
  pause: "Pause premieres",
  play: "Play premieres",
};

const UZ: typeof EN = {
  eyebrow: "JOURNEY'DA YANGI",
  read: "Batafsil ko‘rish",
  watch: "Premyerani ko‘rish",
  enter: "Bo‘limga kirish",
  slide: "Premyera",
  pause: "Premyeralarni to‘xtatish",
  play: "Premyeralarni davom ettirish",
};

const RU: typeof EN = {
  eyebrow: "НОВОЕ В JOURNEY",
  read: "Открыть историю",
  watch: "Смотреть премьеру",
  enter: "Войти в этот мир",
  slide: "Премьера",
  pause: "Остановить премьеры",
  play: "Продолжить премьеры",
};

const FALLBACK_ART: Record<JourneyWorld, string> = {
  "talimoon-life": "/images/journey/journey-talimoon-life-child-book-moment.png",
  parents: "/images/journey/journey-parents-listening-child.png",
  "wisdom-science": "/images/journey/journey-habits-knowledge-research.png",
};

/**
 * Mobile `object-position` for a slide's wide art when it is shown in
 * the taller phone hero box. Entry covers carry their own `focus`
 * (see JourneyImage); this is the per-world default for the permanent
 * fallback art and for covers that set none. Desktop stays centred.
 */
const FALLBACK_FOCUS_MOBILE: Record<JourneyWorld, string> = {
  "talimoon-life": "50% 40%",
  parents: "62% 42%",
  "wisdom-science": "50% 44%",
};
const DEFAULT_FOCUS_MOBILE = "50% 42%";

export function JourneyPremiere() {
  const { language } = useLanguage();
  const locale = toLocale(language);
  const t = useT(EN, UZ, RU);
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const paused = manuallyPaused || interacting;

  const slides = useMemo(() => {
    // The hero is a dynamic featured slot. The current editorial pin
    // (`getFeaturedEntry`) owns its world's slide, so a newer, unpinned
    // entry can't quietly take the hero; other worlds show their newest
    // entry, and with nothing published a world falls back to its own
    // permanent art + name. Publishing featured content only ever
    // changes this hero, never the fixed world gateway artwork.
    const featured = getFeaturedEntry()?.entry ?? null;

    return JOURNEY_WORLDS.map((world) => {
      const newest =
        getStreamEntries({ world, limit: 1, excludePromoted: false }).entries[0] ??
        null;
      const entry = featured && featured.world === world ? featured : newest;

      const resolved = entry ? resolveEntryContent(entry, locale) : null;
      const policy = entry ? mediaPolicy(entry) : null;
      // A featured entry leads with its language-neutral hero artwork;
      // everything else keeps the existing cover / poster behaviour.
      const asset = entry?.heroImage ?? entry?.cover ?? entry?.video?.poster;
      const usingAsset = Boolean(policy?.showMedia && asset?.src.trim());
      const image = usingAsset ? asset!.src : FALLBACK_ART[world];
      // Wide editorial art in a tall phone box would otherwise zoom
      // into the centre. The asset's own focus wins; otherwise a
      // per-world default keeps the meaningful subject in frame.
      const focusMobile = usingAsset
        ? asset!.focus?.mobile ?? DEFAULT_FOCUS_MOBILE
        : FALLBACK_FOCUS_MOBILE[world];
      const focusDesktop =
        (usingAsset ? asset!.focus?.desktop : undefined) ?? "50% 50%";
      return {
        world,
        entry,
        image,
        focusMobile,
        focusDesktop,
        alt: resolved?.content.coverAlt ?? worldName(world, locale),
        title: resolved?.content.title ?? worldName(world, locale),
        description: resolved?.content.standfirst ?? worldBlurb(world, locale),
        href: entry ? `/journey/${entry.slug}` : worldPath(world),
        isVideo: Boolean(entry?.video),
        kicker: resolved?.content.kicker,
      };
    });
  }, [locale]);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % slides.length),
      7500,
    );
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, slides.length]);

  const slide = slides[active];

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t.slide}
      className="relative overflow-hidden bg-[var(--surface-contrast)]"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={() => setInteracting(false)}
    >
      <div className="relative mx-auto min-h-[clamp(308px,79vw,362px)] max-w-[1600px] overflow-hidden sm:min-h-[680px] lg:min-h-[720px]">
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={slide.world}
            className="absolute inset-0"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="absolute inset-0"
              initial={reducedMotion ? false : { scale: 1.04 }}
              animate={{ scale: 1 }}
              transition={{ duration: reducedMotion ? 0 : 7.5, ease: "linear" }}
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                loading="eager"
                sizes="(min-width: 1600px) 1600px, 100vw"
                className="object-cover [object-position:var(--hero-focus-m)] sm:[object-position:var(--hero-focus-d)]"
                style={
                  {
                    "--hero-focus-m": slide.focusMobile,
                    "--hero-focus-d": slide.focusDesktop,
                  } as CSSProperties
                }
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 sm:hidden"
          style={{
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
            WebkitMaskImage:
              "linear-gradient(to top, black 0%, rgba(0,0,0,.78) 24%, rgba(0,0,0,.18) 42%, transparent 58%)",
            maskImage:
              "linear-gradient(to top, black 0%, rgba(0,0,0,.78) 24%, rgba(0,0,0,.18) 42%, transparent 58%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 sm:hidden"
          style={{
            background:
              "linear-gradient(to top, rgba(14,23,33,0.94) 0%, rgba(14,23,33,0.76) 20%, rgba(14,23,33,0.48) 37%, rgba(14,23,33,0.16) 52%, transparent 68%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden sm:block lg:hidden"
          style={{
            background:
              "linear-gradient(to top, rgba(14,23,33,0.96) 0%, rgba(14,23,33,0.82) 24%, rgba(14,23,33,0.48) 43%, rgba(14,23,33,0.12) 65%, transparent 82%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(14,23,33,0.94)_0%,rgba(14,23,33,0.76)_40%,rgba(14,23,33,0.22)_76%,rgba(14,23,33,0.10)_100%)] lg:block"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--surface-contrast)]/55 to-transparent"
        />

        <div className="relative z-10 flex min-h-[clamp(308px,79vw,362px)] flex-col justify-end px-6 pb-[4.25rem] pt-14 sm:min-h-[680px] sm:px-10 sm:pb-32 sm:pt-36 lg:min-h-[720px] lg:justify-center lg:px-16 lg:pb-24 lg:pt-28 xl:px-24">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${slide.world}-copy`}
              className="max-w-[690px]"
              initial={reducedMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: reducedMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent-primary)] sm:text-[12px] sm:tracking-[0.22em]"
                style={{ fontFamily: BODY }}
              >
                {t.eyebrow}
                <span className="mx-2 text-white/35">·</span>
                {worldName(slide.world, locale)}
              </p>

              {slide.kicker ? (
                <p
                  className="mt-4 hidden text-[13px] uppercase tracking-[0.18em] text-white/65 sm:block"
                  style={{ fontFamily: BODY }}
                >
                  {slide.kicker.label}
                  {slide.kicker.dateLabel ? ` · ${slide.kicker.dateLabel}` : ""}
                </p>
              ) : null}

              <h1
                className="mt-2 max-w-[19ch] text-balance text-[22px] font-semibold leading-[1.15] tracking-[-0.02em] text-white sm:mt-5 sm:max-w-[16ch] sm:text-[3rem] sm:leading-[1.03] lg:text-[4.15rem]"
                style={{ fontFamily: DISPLAY }}
              >
                {slide.title}
              </h1>

              <p
                className="mt-5 hidden max-w-[55ch] text-[1rem] leading-[1.65] text-white/76 sm:block lg:text-[1.025rem]"
                style={{ fontFamily: BODY }}
              >
                {slide.description}
              </p>

              <Link
                href={slide.href}
                className="group mt-2.5 inline-flex min-h-9 items-center gap-2 text-[12px] font-bold tracking-[0.01em] text-white transition-colors hover:text-[var(--accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--surface-contrast)] sm:mt-7 sm:min-h-11 sm:text-[14px]"
              >
                {slide.entry ? (slide.isVideo ? t.watch : t.read) : t.enter}
                <span
                  aria-hidden="true"
                  className="text-[var(--accent-primary)] transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute inset-x-6 bottom-4 z-20 flex items-end justify-between gap-5 sm:inset-x-10 sm:bottom-7 sm:gap-6 lg:inset-x-16 xl:inset-x-24">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label={t.slide}>
            {slides.map((item, index) => (
              <button
                key={item.world}
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-label={`${index + 1}. ${worldName(item.world, locale)}`}
                onClick={() => setActive(index)}
                className={`group flex h-9 min-w-9 items-center justify-center gap-2 rounded-full border px-3 text-[10px] font-semibold uppercase tracking-[0.12em] shadow-[0_5px_18px_rgba(0,0,0,0.12)] backdrop-blur-md transition-all sm:min-h-11 sm:px-4 sm:text-[11px] ${
                  index === active
                    ? "border-[var(--accent-primary)] bg-[rgba(184,147,91,0.2)] text-[var(--accent-primary)]"
                    : "border-white/20 bg-black/10 text-white/72 hover:border-white/45 hover:bg-black/20 hover:text-white"
                }`}
                style={{ fontFamily: BODY }}
              >
                <span aria-hidden="true">0{index + 1}</span>
                <span className="hidden md:inline">{worldName(item.world, locale)}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setManuallyPaused((value) => !value)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/10 text-white/72 shadow-[0_5px_18px_rgba(0,0,0,0.12)] backdrop-blur-md transition-colors hover:border-white/45 hover:bg-black/20 hover:text-white sm:h-11 sm:w-11"
            aria-label={manuallyPaused ? t.play : t.pause}
          >
            {manuallyPaused ? (
              <span
                aria-hidden="true"
                className="ms-0.5 block h-0 w-0 border-y-[5px] border-y-transparent border-s-[8px] border-s-current sm:border-y-[6px] sm:border-s-[10px]"
              />
            ) : (
              <span aria-hidden="true" className="flex gap-1">
                <span className="block h-3 w-px rounded-full bg-current sm:h-3.5 sm:w-0.5" />
                <span className="block h-3 w-px rounded-full bg-current sm:h-3.5 sm:w-0.5" />
              </span>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

export default JourneyPremiere;
