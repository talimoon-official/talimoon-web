"use client";

/**
 * One published "Words Left for a Child" entry.
 *
 * Renders strictly within the family's consent scope — the API has already
 * nulled every field the family did not opt into, so a null is simply not
 * shown. The voice, when present, streams from a same-origin proxy.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageContext";
import type { PublicMemory } from "@/lib/memory/api";
import { WORDS_CATEGORY_PATH } from "@/lib/story-library/words";

const EN = {
  back: "All shared words",
  from: "Written by",
  for: "For",
  listenTitle: "In their own voice",
  play: "Play the recording",
  pause: "Pause",
  unavailable: "The recording is no longer available.",
  note: "Shared with the family's permission. Families can make this private again at any time.",
};
const UZ: typeof EN = {
  back: "Barcha ulashilgan so'zlar",
  from: "Muallif",
  for: "Kimga",
  listenTitle: "O'z ovozida",
  play: "Yozuvni tinglash",
  pause: "To'xtatish",
  unavailable: "Ovozli yozuv endi mavjud emas.",
  note: "Oila ruxsati bilan ulashilgan. Oilalar istalgan vaqtda buni yana shaxsiy qilishi mumkin.",
};
const RU: typeof EN = {
  back: "Все опубликованные слова",
  from: "Автор",
  for: "Кому",
  listenTitle: "Своим голосом",
  play: "Прослушать запись",
  pause: "Пауза",
  unavailable: "Аудиозапись больше недоступна.",
  note: "Опубликовано с разрешения семьи. Семья может в любой момент снова сделать это личным.",
};

export function WordsStory({ memory }: { memory: PublicMemory }) {
  const t = useT(EN, UZ, RU);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnd = () => setPlaying(false);
    const onErr = () => {
      setBroken(true);
      setPlaying(false);
    };
    el.addEventListener("ended", onEnd);
    el.addEventListener("error", onErr);
    return () => {
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("error", onErr);
    };
  }, []);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play().then(
        () => setPlaying(true),
        () => setBroken(true),
      );
    }
  };

  return (
    <article className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
      <Link
        href={WORDS_CATEGORY_PATH}
        className="text-xs uppercase tracking-[0.16em] text-[#B8935B] hover:underline"
      >
        ← {t.back}
      </Link>

      <div className="mt-10 rounded-2xl bg-[#FDFBF7] ring-1 ring-[rgba(184,147,91,0.25)] px-7 py-10 sm:px-12 sm:py-14">
        {memory.message && (
          <blockquote className="font-serif text-[1.35rem] sm:text-[1.55rem] leading-[1.7] whitespace-pre-line text-[#3a2e1f]">
            {memory.message}
          </blockquote>
        )}

        <div className="mt-9 pt-6 border-t border-[rgba(184,147,91,0.25)] space-y-1 text-sm text-[rgba(28,42,58,0.64)]">
          {memory.storyGiverDisplayName && (
            <p>
              <span className="uppercase text-[11px] tracking-[0.14em] text-[#B8935B]">
                {t.from}
              </span>{" "}
              {memory.storyGiverDisplayName}
            </p>
          )}
          {memory.childFirstName && (
            <p>
              <span className="uppercase text-[11px] tracking-[0.14em] text-[#B8935B]">{t.for}</span>{" "}
              {memory.childFirstName}
            </p>
          )}
        </div>

        {memory.hasAudio && (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-[0.14em] text-[#B8935B] mb-3">
              {t.listenTitle}
            </p>
            {broken ? (
              <p className="text-sm text-[rgba(28,42,58,0.5)]">{t.unavailable}</p>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={toggle}
                  aria-label={playing ? t.pause : t.play}
                  className="h-12 w-12 shrink-0 rounded-full bg-[#1C2A3A] text-[#F7F3EC] grid place-items-center active:scale-95 transition-transform"
                >
                  {playing ? (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <rect x="4" y="3" width="4" height="14" rx="1" />
                      <rect x="12" y="3" width="4" height="14" rx="1" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path d="M5 3.5v13a1 1 0 0 0 1.54.84l10-6.5a1 1 0 0 0 0-1.68l-10-6.5A1 1 0 0 0 5 3.5Z" />
                    </svg>
                  )}
                </button>
                <span className="text-sm text-[rgba(28,42,58,0.64)]">
                  {playing ? t.pause : t.play}
                </span>
                <audio ref={audioRef} src={`${WORDS_CATEGORY_PATH}/${memory.slug}/audio`} preload="none" />
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-[rgba(28,42,58,0.48)] leading-relaxed">{t.note}</p>
    </article>
  );
}

export default WordsStory;
