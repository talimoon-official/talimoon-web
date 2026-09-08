"use client";

/**
 * "Words Left for a Child" — the public collection view.
 *
 * Each card shows only what the family's publication consent permits: the
 * written words (or an opening of them), the story giver's given name and
 * relationship, and whether a voice recording is attached. A child's first
 * name and photo are shown only when the family explicitly opted in.
 *
 * With nothing published yet this reads as a calm, intentional invitation,
 * never a "no results" state.
 */

import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageContext";
import type { PublicMemory } from "@/lib/memory/api";
import { WORDS_CATEGORY_PATH } from "@/lib/story-library/words";

const EN = {
  eyebrow: "From the family",
  heading: "Words left for a child",
  body: "On the last page of some TALIMOON books, the person giving the book leaves the child a few words of their own — sometimes in their real voice. These are the ones families have chosen to share.",
  consentNote: "Shared only with the family's explicit permission, and removable at any time.",
  empty: "The first shared messages will appear here soon.",
  listen: "With a voice recording",
  read: "Read the words",
  by: "by",
};
const UZ: typeof EN = {
  eyebrow: "Oiladan",
  heading: "Farzandga qoldirilgan so'zlar",
  body: "Ba'zi TALIMOON kitoblarining so'nggi sahifasida kitobni taqdim etayotgan inson bolaga o'zining bir necha so'zini qoldiradi — ba'zan esa o'z ovozida. Bu yerda oilalar ulashishni tanlagan so'zlar jamlangan.",
  consentNote: "Faqat oilaning aniq ruxsati bilan ulashiladi va istalgan vaqtda olib tashlanishi mumkin.",
  empty: "Ilk ulashilgan so'zlar tez orada shu yerda paydo bo'ladi.",
  listen: "Ovozli yozuv bilan",
  read: "So'zlarni o'qish",
  by: "muallif:",
};
const RU: typeof EN = {
  eyebrow: "От семьи",
  heading: "Слова, оставленные ребёнку",
  body: "На последней странице некоторых книг TALIMOON человек, который дарит книгу, оставляет ребёнку несколько своих слов — иногда своим настоящим голосом. Здесь собраны те, которыми семьи решили поделиться.",
  consentNote: "Публикуется только с явного разрешения семьи и может быть удалено в любой момент.",
  empty: "Первые опубликованные слова скоро появятся здесь.",
  listen: "С аудиозаписью",
  read: "Читать слова",
  by: "автор:",
};

function excerpt(text: string | null, max = 220): string {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : clean.slice(0, max).replace(/[\s,.;:!?-]+\S*$/, "") + "…";
}

export function WordsCollection({ items }: { items: PublicMemory[] }) {
  const t = useT(EN, UZ, RU);

  return (
    <section className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <p className="text-[0.7rem] tracking-[0.22em] uppercase text-[#B8935B]">{t.eyebrow}</p>
      <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-[#1C2A3A]">{t.heading}</h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[rgba(28,42,58,0.64)]">
        {t.body}
      </p>
      <p className="mt-3 text-xs text-[rgba(28,42,58,0.48)]">{t.consentNote}</p>

      {items.length === 0 ? (
        <p className="mt-14 rounded-xl border border-dashed border-[rgba(184,147,91,0.4)] px-6 py-12 text-center text-sm text-[rgba(28,42,58,0.48)]">
          {t.empty}
        </p>
      ) : (
        <ul className="mt-12 space-y-6">
          {items.map((m) => (
            <li key={m.slug}>
              <Link
                href={`${WORDS_CATEGORY_PATH}/${m.slug}`}
                className="block rounded-2xl bg-[#FDFBF7] ring-1 ring-[rgba(184,147,91,0.25)] px-7 py-8 transition-shadow hover:shadow-[0_1px_30px_-10px_rgba(60,45,25,0.25)]"
              >
                {m.message && (
                  <p className="font-serif text-lg leading-relaxed text-[#3a2e1f]">
                    “{excerpt(m.message)}”
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[rgba(28,42,58,0.56)]">
                  {m.storyGiverDisplayName && (
                    <span>
                      {t.by} {m.storyGiverDisplayName}
                    </span>
                  )}
                  {m.hasAudio && (
                    <span className="inline-flex items-center gap-1 text-[#B8935B]">
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                        <path d="M5 3.5v13a1 1 0 0 0 1.54.84l10-6.5a1 1 0 0 0 0-1.68l-10-6.5A1 1 0 0 0 5 3.5Z" />
                      </svg>
                      {t.listen}
                    </span>
                  )}
                  <span className="text-[#B8935B] underline underline-offset-2">{t.read}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default WordsCollection;
