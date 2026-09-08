"use client";

/**
 * HAYOT — one editorial world's landing (V3, dense archive).
 * ----------------------------------------------------------------
 * `/journey/talimoon`, `/journey/parents`, `/journey/wisdom`.
 *
 * A compact editorial publication, not a stack of full-height feature
 * cards. The composition, in the TALIMOON visual language (cream, gold,
 * Cormorant display, Manrope metadata, restrained spacing, hairline
 * dividers):
 *
 *   TOP        back-to-HAYOT · world name · blurb · story count
 *   FEATURED   md+: one large lead story + up to 4 medium cards in the
 *              left 8 columns; lg: a text-first LATEST rail in the
 *              right 4 columns
 *   ARCHIVE    md+: the older stories as a dense 2-col (md) / 3-col (lg)
 *              grid, an initial ~9 with "Show more"
 *   MOBILE     the lead story, then compact rows (title left, small
 *              thumbnail right), an initial ~9 with "Show more"
 *
 * Everything is data-driven: `getWorldEntries(world)` (published +
 * archived, newest first) resolved once into `WorldCard`s.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { getWorldEntries } from "@/lib/journey/content";
import {
  toLocale,
  worldBlurb,
  worldName,
  type JourneyWorld,
} from "@/lib/journey/types";
import { useLanguage, useT } from "@/lib/i18n/LanguageContext";
import { Band, BODY, DISPLAY, GOLD, NAVY, NAVY_64 } from "./shared";
import {
  CompactCard,
  CompactRow,
  FeaturedCard,
  RecentRail,
  toWorldCard,
} from "./worldEditorial";

const EN = {
  back: "HAYOT",
  latest: "Latest",
  allArticles: "All articles",
  more: "Show more",
  empty: "The first pieces for this world are on the way.",
};
const UZ: typeof EN = {
  back: "HAYOT",
  latest: "So'nggi",
  allArticles: "Barcha maqolalar",
  more: "Ko'proq ko'rsatish",
  empty: "Bu olam uchun ilk yozuvlar tez orada.",
};
const RU: typeof EN = {
  back: "HAYOT",
  latest: "Последнее",
  allArticles: "Все статьи",
  more: "Показать ещё",
  empty: "Первые материалы для этого мира уже в пути.",
};

const DIVIDER = "rgba(28,42,58,0.10)";

// left column = featured + up to this many medium cards
const MEDIUM_MAX = 4;
// desktop right rail = up to this many text-first "latest" rows
const RAIL_MAX = 6;
// how many archive cards / mobile rows to reveal at a time
const STEP = 9;

function countLabel(n: number, locale: string): string {
  if (locale === "uz") return `${n} ta maqola`;
  if (locale === "ru") return `Материалов: ${n}`;
  return `${n} ${n === 1 ? "article" : "articles"}`;
}

function MoreButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="mt-12 flex justify-center md:mt-14">
      <button
        type="button"
        onClick={onClick}
        className="group inline-flex min-h-11 items-center gap-2 text-[13px] uppercase transition-opacity duration-300 hover:opacity-70"
        style={{
          fontFamily: BODY,
          fontWeight: 600,
          letterSpacing: "0.2em",
          color: NAVY,
        }}
      >
        <span>{label}</span>
        <span
          aria-hidden="true"
          className="transition-transform duration-300 group-hover:translate-y-0.5"
          style={{ color: GOLD }}
        >
          &darr;
        </span>
      </button>
    </div>
  );
}

export function WorldLanding({ world }: { world: JourneyWorld }) {
  const { language } = useLanguage();
  const t = useT(EN, UZ, RU);
  const locale = toLocale(language);

  const entries = useMemo(() => getWorldEntries(world), [world]);
  const cards = useMemo(
    () => entries.map((entry) => toWorldCard(entry, language)),
    [entries, language],
  );

  const [listVisible, setListVisible] = useState(STEP);
  const [gridVisible, setGridVisible] = useState(STEP);

  const name = worldName(world, locale);
  const blurb = worldBlurb(world, locale);

  // Partition (newest first). `rest` is the phone feed; `mediums` +
  // `archive` together cover it on sm+ with nothing dropped; the lg
  // `rail` is a text-first quick-scan of the archive's head (an
  // intentional "Latest" preview, standard editorial), shown only
  // when there is enough beyond the medium cards to warrant it.
  const featured = cards[0] ?? null;
  const rest = cards.slice(1);
  const mediums = cards.slice(1, 1 + MEDIUM_MAX);
  const archive = cards.slice(1 + MEDIUM_MAX);
  const railItems = archive.slice(0, RAIL_MAX);
  const hasArchive = archive.length > 0;
  const showRail = archive.length >= 3;

  return (
    <Band
      labelledBy="journey-world-heading"
      className="pt-24 pb-24 md:pt-32 md:pb-28"
    >
      {/* No scroll-reveal here: this archive sits directly under the
          navbar, so it must paint immediately rather than wait for an
          in-view trigger. */}
      <div>
        {/* ── TOP ─────────────────────────────────────────── */}
        <Link
          href="/journey"
          className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.16em] transition-opacity duration-300 hover:opacity-60"
          style={{
            fontFamily: BODY,
            fontWeight: 600,
            color: "rgba(28,42,58,0.64)",
          }}
        >
          <span aria-hidden="true">&larr;</span>
          <span>{t.back}</span>
        </Link>

        <h1
          id="journey-world-heading"
          className="mt-8 text-[30px] sm:text-[36px] md:text-[42px] lg:text-[46px]"
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            color: NAVY,
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
          }}
        >
          {name}
        </h1>
        <div className="mt-3.5 flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
          <p
            className="max-w-[56ch] text-[15px] md:text-[17px]"
            style={{ fontFamily: BODY, color: NAVY_64, lineHeight: 1.65 }}
          >
            {blurb}
          </p>
          {cards.length > 0 ? (
            <span
              className="shrink-0 text-[11px] uppercase"
              style={{
                fontFamily: BODY,
                fontWeight: 600,
                letterSpacing: "0.16em",
                color: "rgba(28,42,58,0.48)",
              }}
            >
              {countLabel(cards.length, locale)}
            </span>
          ) : null}
        </div>

        {/* ── EMPTY ─────────────────────────────────────────── */}
        {cards.length === 0 || !featured ? (
          <p
            className="mt-12 max-w-[46ch] text-[15px] md:text-[16px]"
            style={{ fontFamily: BODY, color: NAVY_64, lineHeight: 1.75 }}
          >
            {t.empty}
          </p>
        ) : (
          <>
            <div
              className="mt-10 border-t pt-10 md:mt-12 md:pt-12"
              style={{ borderColor: DIVIDER }}
            >
              {/* ── FEATURED + (lg) LATEST RAIL ─────────────── */}
              <div
                className={
                  showRail ? "lg:grid lg:grid-cols-12 lg:gap-x-10" : ""
                }
              >
                <div className={showRail ? "lg:col-span-8" : ""}>
                  <FeaturedCard card={featured} />

                  {/* md+: medium cards beside/under the lead. Mobile
                        uses the compact-row feed below instead. */}
                  {mediums.length > 0 ? (
                    <div
                      className={`mt-9 hidden gap-x-6 gap-y-9 sm:grid sm:grid-cols-2 lg:mt-10 ${
                        showRail ? "" : "lg:grid-cols-3"
                      }`}
                    >
                      {mediums.map((card) => (
                        <CompactCard
                          key={card.id}
                          card={card}
                          sizes={
                            showRail
                              ? "(min-width:1024px) 300px, 44vw"
                              : "(min-width:1024px) 360px, 44vw"
                          }
                        />
                      ))}
                    </div>
                  ) : null}
                </div>

                {showRail ? (
                  <aside
                    className="mt-12 hidden lg:col-span-4 lg:mt-0 lg:block lg:border-s lg:ps-9"
                    style={{ borderColor: DIVIDER }}
                  >
                    <RecentRail
                      cards={railItems}
                      title={t.latest}
                      moreLabel={t.allArticles}
                      moreHref="#journey-archive"
                    />
                  </aside>
                ) : null}
              </div>

              {/* ── MOBILE: compact rows for everything after the lead ── */}
              <div className="mt-9 sm:hidden">
                <ol className="space-y-4">
                  {rest.slice(0, listVisible).map((card, i) => (
                    <li key={card.id}>
                      <CompactRow card={card} first={i === 0} />
                    </li>
                  ))}
                </ol>
                {rest.length > listVisible ? (
                  <MoreButton
                    label={t.more}
                    onClick={() => setListVisible((n) => n + STEP)}
                  />
                ) : null}
              </div>
            </div>

            {/* ── ARCHIVE GRID (sm+ only) ─────────────────────── */}
            {hasArchive ? (
              <section
                id="journey-archive"
                className="mt-14 hidden scroll-mt-24 border-t pt-12 sm:block md:mt-16"
                style={{ borderColor: DIVIDER }}
              >
                <h2
                  className="text-[13px] uppercase"
                  style={{
                    fontFamily: BODY,
                    fontWeight: 600,
                    letterSpacing: "0.26em",
                    color: GOLD,
                  }}
                >
                  {t.allArticles}
                </h2>
                <div className="mt-8 grid gap-x-7 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
                  {archive.slice(0, gridVisible).map((card) => (
                    <CompactCard
                      key={card.id}
                      card={card}
                      sizes="(min-width:1024px) 340px, (min-width:640px) 44vw, 90vw"
                    />
                  ))}
                </div>
                {archive.length > gridVisible ? (
                  <MoreButton
                    label={t.more}
                    onClick={() => setGridVisible((n) => n + STEP)}
                  />
                ) : null}
              </section>
            ) : null}
          </>
        )}
      </div>
    </Band>
  );
}

export default WorldLanding;
