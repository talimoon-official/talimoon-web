'use client';

/**
 * HAYOT — entry detail (the flexible editorial canvas).
 * ----------------------------------------------------------------
 * Not one rigid article template. The entry's `blocks` drive the
 * page: a thought is a text essay, a visit is a photo essay, an
 * interview is a Q&A — one coherent system, no fixed shape.
 *
 * Header adapts: a showable `cover` (per `mediaPolicy`) leads the
 * page; otherwise it opens type-first. Ends with "HAYOT DAVOM
 * ETADI" and 2–3 genuinely related entries (`getRelatedEntries`) —
 * quiet links, not cards. A restrained "Ulashish ↗" uses the native
 * share sheet where available, else copies the link.
 *
 * All copy is real HTML text (nothing baked into images); `dir` is
 * set from the resolved edition for RTL readiness.
 */

import { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  getRelatedEntries,
  mediaPolicy,
  resolveEntryContent,
} from '@/lib/journey/content';
import {
  toLocale,
  type Block,
  type JourneyEntry,
  type Reference,
} from '@/lib/journey/types';
import { useLanguage, useT } from '@/lib/i18n/LanguageContext';
import {
  Band,
  BODY,
  DISPLAY,
  GOLD,
  Kicker,
  NAVY,
  NAVY_48,
  NAVY_64,
  VideoPlayer,
  WorldLabel,
} from './shared';

const EN = {
  back: 'Back',
  share: 'Share',
  copied: 'Link copied',
  more: 'HAYOT continues',
  otherLang: 'Shown in another language for now.',
  transcript: 'Transcript',
  sources: 'Sources',
  link: 'Link',
  play: 'Play',
  pause: 'Pause',
};
const UZ: typeof EN = {
  back: 'Orqaga',
  share: 'Ulashish',
  copied: 'Havola nusxalandi',
  more: 'HAYOT DAVOM ETADI',
  otherLang: "Hozircha boshqa tilda ko'rsatilmoqda.",
  transcript: 'Matn (transkript)',
  sources: 'Manbalar',
  link: 'Havola',
  play: "Ko'rish",
  pause: "To'xtatish",
};
const RU: typeof EN = {
  back: 'Назад',
  share: 'Поделиться',
  copied: 'Ссылка скопирована',
  more: 'HAYOT ПРОДОЛЖАЕТСЯ',
  otherLang: 'Пока показано на другом языке.',
  transcript: 'Расшифровка',
  sources: 'Источники',
  link: 'Ссылка',
  play: 'Смотреть',
  pause: 'Пауза',
};

/** One reference → a quiet bibliographic line (no URL — that is a
 *  separate <a> so it wraps cleanly). Never fabricated. */
function formatReference(ref: Reference): string {
  const parts: string[] = [];
  if (ref.author) parts.push(ref.author);
  if (ref.title) parts.push(`“${ref.title}”`);
  const tail: string[] = [];
  if (ref.edition) tail.push(ref.edition);
  if (ref.pages) tail.push(ref.pages);
  if (ref.publisher) tail.push(ref.publisher);
  if (ref.year) tail.push(String(ref.year));
  if (ref.role) tail.push(ref.role);
  let line = parts.join(', ');
  if (tail.length) line += (line ? ' · ' : '') + tail.join(', ');
  if (ref.note) line += (line ? ' — ' : '') + ref.note;
  return line;
}

/** caption + optional credit, on one figcaption. */
function FigMeta({ caption, credit }: { caption?: string; credit?: string }) {
  if (!caption && !credit) return null;
  return (
    <figcaption
      className="mt-3 text-[13px]"
      style={{ fontFamily: BODY, color: NAVY_48, lineHeight: 1.6 }}
    >
      {caption}
      {caption && credit ? '  ·  ' : null}
      {credit ? <span style={{ letterSpacing: '0.02em' }}>{credit}</span> : null}
    </figcaption>
  );
}

const READING = 'mx-auto w-full max-w-[680px]';

// ── One block ──────────────────────────────────────────────────────
function BlockView({
  block,
  transcriptLabel,
  posterAlt,
  playLabel,
  pauseLabel,
}: {
  block: Block;
  transcriptLabel: string;
  posterAlt: string;
  playLabel: string;
  pauseLabel: string;
}) {
  switch (block.t) {
    case 'paragraph':
      return (
        <p
          className={`${READING} text-[17px] md:text-[19px]`}
          style={{ fontFamily: BODY, color: 'rgba(28,42,58,0.82)', lineHeight: 1.7 }}
        >
          {block.text}
        </p>
      );
    case 'heading':
      return block.level === 3 ? (
        <h3
          className={`${READING} pt-2 text-[20px] md:text-[24px]`}
          style={{ fontFamily: DISPLAY, fontWeight: 600, color: NAVY, lineHeight: 1.3 }}
        >
          {block.text}
        </h3>
      ) : (
        <h2
          className={`${READING} pt-3 text-[24px] md:text-[30px]`}
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            color: NAVY,
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
          }}
        >
          {block.text}
        </h2>
      );
    case 'image':
      return (
        <figure className={block.full ? 'mx-auto w-full max-w-[1000px]' : READING}>
          <div className="tm-media-float relative aspect-[3/2] w-full">
            <Image
              src={block.asset.src}
              alt={block.alt}
              fill
              sizes="(min-width:1000px) 1000px, 100vw"
              loading="lazy"
              placeholder={block.asset.blurDataURL ? 'blur' : undefined}
              blurDataURL={block.asset.blurDataURL}
              className="object-cover"
            />
          </div>
          <FigMeta caption={block.caption} credit={block.asset.credit} />
        </figure>
      );
    case 'imagePair':
      return (
        <figure className="mx-auto w-full max-w-[1000px]">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { a: block.a, alt: block.altA },
              { a: block.b, alt: block.altB },
            ].map((it, i) => (
              <div key={i} className="tm-media-float-soft relative aspect-[3/4] w-full">
                <Image
                  src={it.a.src}
                  alt={it.alt}
                  fill
                  sizes="(min-width:640px) 50vw, 100vw"
                  loading="lazy"
                  placeholder={it.a.blurDataURL ? 'blur' : undefined}
                  blurDataURL={it.a.blurDataURL}
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          <FigMeta caption={block.caption} />
        </figure>
      );
    case 'gallery':
      return (
        <div className="mx-auto grid w-full max-w-[1000px] gap-3 sm:grid-cols-2">
          {block.items.map((it, i) => (
            <div key={i} className="tm-media-float-soft relative aspect-[4/3] w-full">
              <Image
                src={it.asset.src}
                alt={it.alt}
                fill
                sizes="(min-width:640px) 50vw, 100vw"
                loading="lazy"
                placeholder={it.asset.blurDataURL ? 'blur' : undefined}
                blurDataURL={it.asset.blurDataURL}
                className="object-cover"
              />
            </div>
          ))}
        </div>
      );
    case 'video':
      return (
        <VideoPlayer
          video={block.video}
          className="mx-auto w-full max-w-[1000px]"
          transcriptLabel={transcriptLabel}
          posterAlt={posterAlt}
          playLabel={playLabel}
          pauseLabel={pauseLabel}
        />
      );
    case 'videoPlaceholder':
      return (
        <div className="mx-auto w-full max-w-[430px] px-2 sm:px-0">
          <div
            className="relative flex aspect-[9/16] w-full items-center justify-center overflow-hidden rounded-[22px] border px-7 text-center shadow-[0_28px_80px_rgba(17,29,44,0.22)] sm:rounded-[28px]"
            style={{
              borderColor: 'rgba(184,147,91,0.32)',
              background:
                'radial-gradient(circle at 50% 46%, rgba(184,147,91,0.15), transparent 34%), linear-gradient(145deg, #243449 0%, #111d2c 68%, #0c1623 100%)',
            }}
          >
            <div
              aria-hidden="true"
              className="absolute inset-3 rounded-[17px] border sm:inset-4 sm:rounded-[21px]"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            />
            <div className="relative z-10 max-w-[330px]">
              <span
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border text-[17px] sm:h-16 sm:w-16"
                style={{ borderColor: 'rgba(211,177,104,0.72)', color: '#D3B168' }}
              >
                &#9654;
              </span>
              <p
                className="mt-6 text-[10px] uppercase sm:text-[11px]"
                style={{ fontFamily: BODY, fontWeight: 700, letterSpacing: '0.24em', color: '#D3B168' }}
              >
                {block.label}
              </p>
              <p
                className="mt-3 text-[25px] text-white sm:text-[31px]"
                style={{ fontFamily: DISPLAY, fontWeight: 600, lineHeight: 1.2 }}
              >
                {block.title}
              </p>
              <p
                className="mx-auto mt-3 max-w-[30ch] text-[13px] sm:text-[14px]"
                style={{ fontFamily: BODY, lineHeight: 1.65, color: 'rgba(255,255,255,0.62)' }}
              >
                {block.note}
              </p>
            </div>
          </div>
        </div>
      );
    case 'quote':
      return (
        <blockquote className={`${READING} border-s py-1 ps-6`} style={{ borderColor: 'rgba(184,147,91,0.4)' }}>
          <p
            className="text-[21px] md:text-[25px]"
            style={{
              fontFamily: DISPLAY,
              fontWeight: 600,
              color: NAVY,
              lineHeight: 1.35,
            }}
          >
            “{block.text}”
          </p>
          {block.attribution ? (
            <footer
              className="mt-3 text-[13px] uppercase"
              style={{
                fontFamily: BODY,
                fontWeight: 600,
                letterSpacing: '0.14em',
                color: NAVY_48,
              }}
            >
              {block.attribution}
              {block.role ? ` · ${block.role}` : ''}
            </footer>
          ) : null}
        </blockquote>
      );
    case 'fact':
      return (
        <aside className={`${READING} overflow-hidden border border-[#b8935b4d] bg-[#17263A] px-6 py-7 text-[#F7F1E7] shadow-[0_22px_60px_rgba(23,38,58,0.12)] md:px-9 md:py-9`}>
          <div className="flex items-start gap-5 md:gap-8">
            <p
              className="shrink-0 whitespace-nowrap text-[30px] leading-none tracking-[-0.035em] text-[#D3B168] tabular-nums md:text-[38px]"
              style={{ fontFamily: BODY, fontWeight: 700 }}
            >
              {block.value}
            </p>
            <div className="border-s border-[#d3b16866] ps-5 md:ps-7">
              <p
                className="text-[18px] leading-[1.35] md:text-[22px]"
                style={{ fontFamily: DISPLAY, fontWeight: 600 }}
              >
                {block.label}
              </p>
              {block.note ? (
                <p
                  className="mt-2 text-[13px] leading-[1.65] text-[#F7F1E7]/65 md:text-[14px]"
                  style={{ fontFamily: BODY }}
                >
                  {block.note}
                </p>
              ) : null}
            </div>
          </div>
        </aside>
      );
    case 'steps':
      return (
        <section className="mx-auto w-full max-w-[900px] py-3">
          {block.label ? (
            <p
              className="mb-5 text-center text-[11px] uppercase text-[#B8935B]"
              style={{ fontFamily: BODY, fontWeight: 700, letterSpacing: '0.22em' }}
            >
              {block.label}
            </p>
          ) : null}
          <ol className="grid overflow-hidden border border-[#b8935b3d] bg-[#FBF8F2] md:grid-cols-3">
            {block.items.map((item, index) => (
              <li
                key={`${item.title}-${index}`}
                className="relative border-b border-[#b8935b33] px-6 py-6 last:border-b-0 md:border-b-0 md:border-e md:last:border-e-0 md:px-7 md:py-8"
              >
                <span
                  className="text-[12px] text-[#B8935B]"
                  style={{ fontFamily: BODY, fontWeight: 700, letterSpacing: '0.14em' }}
                >
                  0{index + 1}
                </span>
                <h3
                  className="mt-3 text-[22px] text-[#1C2A3A] md:text-[24px]"
                  style={{ fontFamily: DISPLAY, fontWeight: 600, lineHeight: 1.2 }}
                >
                  {item.title}
                </h3>
                <p
                  className="mt-2 text-[14px] text-[#1C2A3AB8] md:text-[15px]"
                  style={{ fontFamily: BODY, lineHeight: 1.65 }}
                >
                  {item.text}
                </p>
              </li>
            ))}
          </ol>
        </section>
      );
    case 'note':
      return (
        <p
          className={`${READING} text-[14px] md:text-[15px]`}
          style={{
            fontFamily: BODY,
            color: NAVY_48,
            lineHeight: 1.7,
            fontStyle: 'italic',
          }}
        >
          {block.text}
        </p>
      );
    case 'cta':
      return (
        <div className={READING}>
          <Link
            href={block.href}
            className="group inline-flex items-center gap-2 text-[15px] transition-opacity duration-300 hover:opacity-70"
            style={{ fontFamily: BODY, fontWeight: 600, color: NAVY }}
          >
            <span>{block.label}</span>
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-1"
              style={{ color: GOLD }}
            >
              &rarr;
            </span>
          </Link>
        </div>
      );
    case 'embed':
      return (
        <div className={READING}>
          <a
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[15px] underline"
            style={{ fontFamily: BODY, color: NAVY_64 }}
          >
            {block.url}
          </a>
        </div>
      );
    case 'spacer':
      return (
        <div
          aria-hidden="true"
          className={
            block.size === 'lg' ? 'h-16' : block.size === 'sm' ? 'h-4' : 'h-9'
          }
        />
      );
  }
}

// ── The page ───────────────────────────────────────────────────────
export function EntryDetail({ entry }: { entry: JourneyEntry }) {
  const { language } = useLanguage();
  const t = useT(EN, UZ, RU);
  const { content, direction, isFallback } = useMemo(
    () => resolveEntryContent(entry, toLocale(language)),
    [entry, language],
  );
  const related = useMemo(() => getRelatedEntries(entry, 3), [entry]);
  const relatedResolved = useMemo(
    () =>
      related.map((r) => ({
        entry: r,
        content: resolveEntryContent(r, toLocale(language)).content,
      })),
    [related, language],
  );

  const policy = mediaPolicy(entry);
  const photo =
    policy.showMedia && entry.cover && entry.cover.src.trim() !== ''
      ? entry.cover
      : null;
  // A video entry leads with the player (poster-first), not a still.
  const leadVideo =
    entry.format === 'video' && policy.showMedia && entry.video
      ? entry.video
      : null;
  const coverCredit = content.credit ?? entry.cover?.credit;

  const [shared, setShared] = useState(false);
  const onShare = useCallback(async () => {
    const url =
      typeof window !== 'undefined' ? window.location.href : `/journey/${entry.slug}`;
    const title = content.title ?? 'HAYOT — TALIMOON';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShared(true);
        window.setTimeout(() => setShared(false), 2400);
      }
    } catch {
      /* user dismissed the share sheet — nothing to do */
    }
  }, [content.title, entry.slug]);

  return (
    <article dir={direction}>
      <Band className="pt-20 pb-8 md:pt-28 md:pb-10">
        <div className={READING}>
          <Link
            href="/journey"
            className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.16em] transition-opacity duration-300 hover:opacity-60"
            style={{ fontFamily: BODY, fontWeight: 600, color: NAVY_64 }}
          >
            <span aria-hidden="true">&larr;</span>
            <span>{t.back}</span>
          </Link>
        </div>

        <div className={`${READING} mt-7 md:mt-8`}>
          <WorldLabel
            world={entry.world}
            language={language}
            as="link"
            className="block"
          />
          {content.kicker ? (
            <Kicker
              label={content.kicker.label}
              date={content.kicker.dateLabel}
              className="mt-2.5"
            />
          ) : null}
          {content.title ? (
            <h1
              className="mt-3 text-[30px] sm:text-[36px] md:text-[44px] lg:text-[50px]"
              style={{
                fontFamily: DISPLAY,
                fontWeight: 600,
                color: NAVY,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                textWrap: 'balance',
              }}
            >
              {content.title}
            </h1>
          ) : null}
          {content.standfirst ? (
            <p
              className="mt-4 max-w-[46ch] text-[17px] md:text-[19px]"
              style={{ fontFamily: BODY, color: NAVY_64, lineHeight: 1.7 }}
            >
              {content.standfirst}
            </p>
          ) : null}
          {content.keyIdea ? (
            <div
              className="mt-5 border-s ps-5"
              style={{ borderColor: 'rgba(184,147,91,0.4)' }}
            >
              <p
                className="text-[16px] md:text-[18px]"
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 600,
                  color: NAVY,
                  lineHeight: 1.4,
                }}
              >
                {content.keyIdea}
              </p>
            </div>
          ) : null}
          {content.author ? (
            <p
              className="mt-5 text-[12px] uppercase"
              style={{
                fontFamily: BODY,
                fontWeight: 600,
                letterSpacing: '0.14em',
                color: NAVY_48,
              }}
            >
              {content.author}
            </p>
          ) : null}
          {isFallback ? (
            <p
              className="mt-4 text-[12px]"
              style={{ fontFamily: BODY, color: GOLD }}
            >
              {t.otherLang}
            </p>
          ) : null}
        </div>
      </Band>

      {leadVideo ? (
        <div className="w-full bg-surface-base">
          <div className="mx-auto w-full max-w-[1000px] px-4 sm:px-6">
            <VideoPlayer
              video={leadVideo}
              transcriptLabel={t.transcript}
              posterAlt={content.coverAlt ?? ''}
              playLabel={t.play}
              pauseLabel={t.pause}
            />
          </div>
        </div>
      ) : photo ? (
        <div className="w-full overflow-hidden bg-surface-base">
          <figure className="mx-auto w-full max-w-[680px] px-4 sm:px-0">
            <div
              className="tm-media-float relative w-full"
              style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
            >
              <Image
                src={photo.src}
                alt={content.coverAlt ?? ''}
                fill
                priority
                sizes="(min-width:1200px) 1200px, 100vw"
                placeholder={photo.blurDataURL ? 'blur' : undefined}
                blurDataURL={photo.blurDataURL}
                className="object-cover"
              />
            </div>
            {coverCredit ? (
              <figcaption
                className="mt-2 text-[12px]"
                style={{
                  fontFamily: BODY,
                  color: NAVY_48,
                  letterSpacing: '0.02em',
                }}
              >
                {coverCredit}
              </figcaption>
            ) : null}
          </figure>
        </div>
      ) : coverCredit ? (
        <div className={`${READING} pb-2`}>
          <p
            className="text-[12px]"
            style={{ fontFamily: BODY, color: NAVY_48, letterSpacing: '0.02em' }}
          >
            {coverCredit}
          </p>
        </div>
      ) : null}

      <Band className="py-10 md:py-14">
        <div className="space-y-5 md:space-y-6">
          {content.blocks.map((block, i) => (
            <BlockView
              key={i}
              block={block}
              transcriptLabel={t.transcript}
              posterAlt={content.coverAlt ?? ''}
              playLabel={t.play}
              pauseLabel={t.pause}
            />
          ))}
        </div>

        {entry.references && entry.references.length > 0 ? (
          <div className={`${READING} mt-10 border-t border-[#1c2a3a17] pt-7`}>
            <h2
              className="text-[12px] uppercase"
              style={{
                fontFamily: BODY,
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: NAVY_48,
              }}
            >
              {t.sources}
            </h2>
            <ul className="mt-4 space-y-3">
              {entry.references.map((ref, i) => (
                <li
                  key={i}
                  className="text-[14px]"
                  style={{
                    fontFamily: BODY,
                    color: 'rgba(28,42,58,0.7)',
                    lineHeight: 1.7,
                  }}
                >
                  {formatReference(ref)}
                  {ref.url || ref.doi ? (
                    <>
                      {'  '}
                      <a
                        href={ref.url ?? `https://doi.org/${ref.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                        style={{ color: NAVY_64 }}
                      >
                        {ref.doi ? `doi:${ref.doi}` : t.link}
                      </a>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className={`${READING} mt-10 border-t border-[#1c2a3a17] pt-5`}>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.16em] transition-opacity duration-300 hover:opacity-60"
            style={{ fontFamily: BODY, fontWeight: 600, color: NAVY_64 }}
          >
            <span>{shared ? t.copied : t.share}</span>
            <span aria-hidden="true" style={{ color: GOLD }}>
              &#8599;
            </span>
          </button>
        </div>
      </Band>

      {relatedResolved.length > 0 ? (
        <Band className="border-t border-[#1c2a3a17] py-16 md:py-24">
          <div className={READING}>
            <h2
              className="text-[13px] uppercase"
              style={{
                fontFamily: BODY,
                fontWeight: 600,
                letterSpacing: '0.26em',
                color: GOLD,
              }}
            >
              {t.more}
            </h2>
            <ul className="mt-10 space-y-8 md:space-y-10">
              {relatedResolved.map(({ entry: r, content: rc }) => (
                <li key={r.id}>
                  <Link
                    href={`/journey/${r.slug}`}
                    className="group block transition-opacity duration-300 hover:opacity-70"
                  >
                  {rc.kicker ? (
                    <Kicker label={rc.kicker.label} date={rc.kicker.dateLabel} />
                  ) : null}
                    <p
                      className="mt-2 text-[21px] md:text-[25px]"
                      style={{
                        fontFamily: DISPLAY,
                        fontWeight: 600,
                        color: NAVY,
                        lineHeight: 1.2,
                      }}
                    >
                      {rc.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Band>
      ) : null}
    </article>
  );
}

export default EntryDetail;
