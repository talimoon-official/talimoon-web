"use client";

/**
 * HAYOT — compact editorial pieces for a world (category) landing.
 * ----------------------------------------------------------------
 * The `/journey/<world>` page is a dense editorial archive, not a
 * stack of full-height feature cards. These are the small, presentational
 * building blocks it composes:
 *
 *   FeaturedCard   — one large lead story (image + title + one line + meta)
 *   CompactCard    — a shorter grid card (image + category + title + meta)
 *   CompactRow     — a mobile / archive list row (title left, small thumb right)
 *   RecentRail     — a desktop text-first "latest" sidebar list
 *
 * All of them are dumb: the page resolves each entry into a `WorldCard`
 * (via `toWorldCard`) once, and passes that down. Type + colour + motion
 * come straight from `./shared`; the rounded media surfaces reuse the
 * existing `.tm-media-float*` classes.
 */

import Image from "next/image";
import Link from "next/link";
import {
  mediaPolicy,
  readingMinutes,
  resolveEntryContent,
} from "@/lib/journey/content";
import {
  toLocale,
  worldName,
  type JourneyEntry,
  type Locale,
} from "@/lib/journey/types";
import {
  BODY,
  CREAM_RAISED,
  DISPLAY,
  GOLD,
  GOLD_FAINT,
  NAVY,
  NAVY_48,
  NAVY_64,
  QuietLink,
  shortDate,
} from "./shared";

// ── Reading-time unit, per content locale ─────────────────────────
const READ_UNIT: Record<Locale, string> = {
  uz: "daqiqa",
  en: "min",
  ru: "мин",
  ar: "دقيقة",
};

// ── Resolved card model ───────────────────────────────────────────
export interface WorldCard {
  id: string;
  href: string;
  title: string;
  /** Small category label above the title (entry kicker, else world). */
  category: string;
  /** "8 SENT, 2026 · 3 daqiqa" — pre-localised. */
  meta: string;
  /** One-line editorial intro (used only by the featured card). */
  standfirst: string;
  image: { src: string; alt: string; blurDataURL?: string } | null;
  isVideo: boolean;
}

/**
 * Resolve one entry into a `WorldCard` for the given site language.
 * Honours `mediaPolicy` (an entry with people but no consent shows no
 * photo). Pure — safe to call inside a `useMemo`.
 */
export function toWorldCard(entry: JourneyEntry, language: string): WorldCard {
  const locale = toLocale(language);
  const { content } = resolveEntryContent(entry, locale);
  const policy = mediaPolicy(entry);

  const asset = policy.showMedia
    ? entry.cover?.src.trim()
      ? entry.cover
      : entry.heroImage?.src.trim()
        ? entry.heroImage
        : entry.video?.poster?.src.trim()
          ? entry.video.poster
          : null
    : null;

  const year = new Date(entry.publishedAtISO).getUTCFullYear();
  const minutes = readingMinutes(content);
  const meta = `${shortDate(entry.publishedAtISO, locale)}, ${year} · ${minutes} ${READ_UNIT[locale] ?? READ_UNIT.en}`;

  return {
    id: entry.id,
    href: `/journey/${entry.slug}`,
    title: content.title ?? worldName(entry.world, locale),
    category: content.kicker?.label ?? worldName(entry.world, locale),
    meta,
    standfirst: content.standfirst ?? "",
    image: asset
      ? {
          src: asset.src,
          alt: content.coverAlt ?? "",
          blurDataURL: asset.blurDataURL,
        }
      : null,
    isVideo: Boolean(entry.video),
  };
}

// ── Small shared bits ────────────────────────────────────────────
function CategoryLabel({ children }: { children: string }) {
  return (
    <span
      className="block text-[10.5px] uppercase"
      style={{
        fontFamily: BODY,
        fontWeight: 600,
        letterSpacing: "0.2em",
        color: GOLD,
      }}
    >
      {children}
    </span>
  );
}

function MetaLine({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <p
      className={`text-[11.5px] uppercase ${className}`}
      style={{
        fontFamily: BODY,
        fontWeight: 600,
        letterSpacing: "0.12em",
        color: NAVY_48,
      }}
    >
      {children}
    </p>
  );
}

function PlayCue() {
  return (
    <span
      aria-hidden="true"
      className="absolute bottom-2.5 start-2.5 flex h-8 w-8 items-center justify-center rounded-full"
      style={{ backgroundColor: "rgba(253,251,247,0.92)" }}
    >
      <span
        className="ms-0.5 block h-0 w-0"
        style={{
          borderTop: "5px solid transparent",
          borderBottom: "5px solid transparent",
          borderInlineStart: `8px solid ${NAVY}`,
        }}
      />
    </span>
  );
}

/** The rounded media surface every card uses. `ratio` is a Tailwind
 *  aspect class; `sizes` tunes the responsive fetch. */
function CardMedia({
  card,
  ratio,
  sizes,
  priority = false,
}: {
  card: WorldCard;
  ratio: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <div
      className={`tm-media-float tm-media-float-interactive relative w-full ${ratio}`}
      style={{ backgroundColor: CREAM_RAISED }}
    >
      {card.image ? (
        <Image
          src={card.image.src}
          alt={card.image.alt}
          fill
          priority={priority}
          loading={priority ? undefined : "lazy"}
          sizes={sizes}
          placeholder={card.image.blurDataURL ? "blur" : undefined}
          blurDataURL={card.image.blurDataURL}
          className="object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundColor: CREAM_RAISED,
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(184,147,91,0.06) 0 1px, transparent 1px 10px)",
          }}
        />
      )}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: `inset 0 0 0 1px ${GOLD_FAINT}` }}
      />
      {card.isVideo ? <PlayCue /> : null}
    </div>
  );
}

// ── FeaturedCard — the one large lead story ───────────────────────
export function FeaturedCard({ card }: { card: WorldCard }) {
  return (
    <article>
      <Link href={card.href} className="group block">
        <CardMedia
          card={card}
          ratio="aspect-[16/10] sm:aspect-[16/9]"
          sizes="(min-width:1024px) 660px, (min-width:640px) 92vw, 100vw"
          priority
        />
        <div className="mt-5 md:mt-6">
          <CategoryLabel>{card.category}</CategoryLabel>
          <h2
            className="mt-2.5 text-[25px] sm:text-[28px] md:text-[32px] lg:text-[34px]"
            style={{
              fontFamily: DISPLAY,
              fontWeight: 600,
              color: NAVY,
              lineHeight: 1.14,
              letterSpacing: "-0.015em",
              textWrap: "balance",
            }}
          >
            <span className="transition-opacity duration-300 group-hover:opacity-70">
              {card.title}
            </span>
          </h2>
          {card.standfirst ? (
            <p
              className="mt-3 line-clamp-2 max-w-[60ch] text-[15px] md:line-clamp-1 md:text-[16px]"
              style={{ fontFamily: BODY, color: NAVY_64, lineHeight: 1.65 }}
            >
              {card.standfirst}
            </p>
          ) : null}
          <MetaLine className="mt-3.5">{card.meta}</MetaLine>
        </div>
      </Link>
    </article>
  );
}

// ── CompactCard — a shorter grid card ────────────────────────────
export function CompactCard({
  card,
  sizes = "(min-width:1024px) 300px, (min-width:640px) 44vw, 90vw",
}: {
  card: WorldCard;
  sizes?: string;
}) {
  return (
    <article>
      <Link href={card.href} className="group block">
        <CardMedia card={card} ratio="aspect-[16/10]" sizes={sizes} />
        <div className="mt-3.5">
          <CategoryLabel>{card.category}</CategoryLabel>
          <h3
            className="mt-2 line-clamp-3 text-[17px] md:text-[18.5px]"
            style={{
              fontFamily: DISPLAY,
              fontWeight: 600,
              color: NAVY,
              lineHeight: 1.24,
              letterSpacing: "-0.01em",
            }}
          >
            <span className="transition-opacity duration-300 group-hover:opacity-70">
              {card.title}
            </span>
          </h3>
          <MetaLine className="mt-2.5">{card.meta}</MetaLine>
        </div>
      </Link>
    </article>
  );
}

// ── CompactRow — mobile / archive list row ───────────────────────
export function CompactRow({
  card,
  first = false,
}: {
  card: WorldCard;
  first?: boolean;
}) {
  return (
    <article
      className={first ? "" : "border-t pt-4"}
      style={first ? undefined : { borderColor: "rgba(28,42,58,0.10)" }}
    >
      <Link href={card.href} className="group flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <CategoryLabel>{card.category}</CategoryLabel>
          <h3
            className="mt-1.5 line-clamp-3 text-[16px]"
            style={{
              fontFamily: DISPLAY,
              fontWeight: 600,
              color: NAVY,
              lineHeight: 1.26,
              letterSpacing: "-0.01em",
            }}
          >
            <span className="transition-opacity duration-300 group-hover:opacity-70">
              {card.title}
            </span>
          </h3>
          <MetaLine className="mt-1.5">{card.meta}</MetaLine>
        </div>
        <div
          className="relative aspect-[4/3] w-[104px] shrink-0 overflow-hidden rounded-[10px] sm:w-[124px]"
          style={{
            border: `1px solid ${GOLD_FAINT}`,
            backgroundColor: CREAM_RAISED,
          }}
        >
          {card.image ? (
            <Image
              src={card.image.src}
              alt=""
              fill
              loading="lazy"
              sizes="124px"
              placeholder={card.image.blurDataURL ? "blur" : undefined}
              blurDataURL={card.image.blurDataURL}
              className="object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, rgba(184,147,91,0.06) 0 1px, transparent 1px 10px)",
              }}
            />
          )}
          {card.isVideo ? <PlayCue /> : null}
        </div>
      </Link>
    </article>
  );
}

// ── RecentRail — desktop text-first "latest" sidebar ─────────────
export function RecentRail({
  cards,
  title,
  moreLabel,
  moreHref,
}: {
  cards: WorldCard[];
  title: string;
  moreLabel: string;
  /** Omitted when everything already fits on the page (no archive). */
  moreHref?: string;
}) {
  if (cards.length === 0) return null;
  return (
    <section aria-label={title}>
      <h2
        className="text-[12px] uppercase"
        style={{
          fontFamily: BODY,
          fontWeight: 600,
          letterSpacing: "0.24em",
          color: GOLD,
        }}
      >
        {title}
      </h2>
      <ol className="mt-5">
        {cards.map((card, i) => (
          <li
            key={card.id}
            className={i === 0 ? "pt-0" : "mt-4 border-t pt-4"}
            style={i === 0 ? undefined : { borderColor: "rgba(28,42,58,0.10)" }}
          >
            <Link href={card.href} className="group block">
              <p
                className="line-clamp-2 text-[15px]"
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 600,
                  color: NAVY,
                  lineHeight: 1.28,
                  letterSpacing: "-0.005em",
                }}
              >
                <span className="transition-opacity duration-300 group-hover:opacity-70">
                  {card.title}
                </span>
              </p>
              <MetaLine className="mt-1.5">{card.meta}</MetaLine>
            </Link>
          </li>
        ))}
      </ol>
      {moreHref ? (
        <div className="mt-6">
          <QuietLink href={moreHref}>{moreLabel}</QuietLink>
        </div>
      ) : null}
    </section>
  );
}
