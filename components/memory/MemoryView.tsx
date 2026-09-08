"use client";

/**
 * The private Voice Memory keepsake page — what a child sees years later when
 * they scan the QR printed in their TALIMOON book.
 *
 * Deliberately quiet: the written words, the name they were written by, and —
 * when it exists — the real recorded voice. No navigation, no marketing, no
 * sharing. The audio streams from the same-origin proxy (`/m/<token>/audio`),
 * never the storage URL. When the voice is unavailable the page still shows
 * the words.
 */

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/LanguageContext";
import type { PrivateMemory } from "@/lib/memory/api";

const EN = {
  eyebrow: "A memory kept for you",
  from: "Written for you by",
  listenTitle: "In their own voice",
  play: "Play the recording",
  pause: "Pause",
  unavailable: "The recording for this memory is no longer available, but the words remain.",
  footer: "A private TALIMOON memory. It is kept for you alone.",
  notFoundTitle: "This memory could not be found",
  notFoundBody:
    "The link in your book may be mistyped, or this memory has been removed at the family's request.",
};
const UZ = {
  eyebrow: "Siz uchun saqlangan xotira",
  from: "Ushbu so'zlarni siz uchun yozgan inson",
  listenTitle: "O'z ovozida",
  play: "Yozuvni tinglash",
  pause: "To'xtatish",
  unavailable: "Bu xotiraning ovozli yozuvi endi mavjud emas, ammo so'zlar saqlanib qoldi.",
  footer: "Bu — shaxsiy TALIMOON xotirasi. U faqat siz uchun saqlanadi.",
  notFoundTitle: "Bu xotira topilmadi",
  notFoundBody:
    "Kitobingizdagi havola noto'g'ri kiritilgan bo'lishi mumkin yoki bu xotira oila iltimosiga ko'ra olib tashlangan.",
};
const RU = {
  eyebrow: "Воспоминание, сохранённое для вас",
  from: "Эти слова для вас написал",
  listenTitle: "Своим голосом",
  play: "Прослушать запись",
  pause: "Пауза",
  unavailable: "Аудиозапись этого воспоминания больше недоступна, но слова сохранились.",
  footer: "Это личное воспоминание TALIMOON. Оно хранится только для вас.",
  notFoundTitle: "Это воспоминание не найдено",
  notFoundBody:
    "Возможно, ссылка в книге введена с ошибкой, или это воспоминание было удалено по просьбе семьи.",
};

function fmtDuration(sec: number | null): string | null {
  if (!sec || sec <= 0) return null;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MemoryNotFound() {
  const t = useT(EN, UZ, RU);
  return (
    <main className="min-h-dvh flex items-center justify-center bg-[#f6f1e7] px-6 text-[#2b2118]">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-2xl mb-3">{t.notFoundTitle}</h1>
        <p className="text-sm leading-relaxed text-[#6b5d49]">{t.notFoundBody}</p>
      </div>
    </main>
  );
}

export default function MemoryView({
  memory,
  token,
}: {
  memory: PrivateMemory;
  token: string;
}) {
  const t = useT(EN, UZ, RU);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [audioBroken, setAudioBroken] = useState(false);
  const duration = fmtDuration(memory.audioDurationSec);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnd = () => setPlaying(false);
    const onErr = () => {
      setAudioBroken(true);
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
        () => setAudioBroken(true),
      );
    }
  };

  return (
    <main className="min-h-dvh bg-[#f6f1e7] text-[#2b2118] flex flex-col items-center px-6 py-16 sm:py-24">
      <div className="w-full max-w-xl">
        <p className="text-[0.7rem] tracking-[0.22em] uppercase text-[#a68d63] text-center mb-10">
          {t.eyebrow}
        </p>

        <article className="rounded-2xl bg-[#fdfaf3] shadow-[0_1px_40px_-12px_rgba(60,45,25,0.25)] ring-1 ring-[#e7dcc6] px-7 py-10 sm:px-12 sm:py-14">
          <blockquote className="font-serif text-[1.35rem] sm:text-[1.6rem] leading-[1.7] whitespace-pre-line text-[#3a2e1f]">
            {memory.message}
          </blockquote>

          <div className="mt-10 pt-6 border-t border-[#ece1cb]">
            <p className="text-xs uppercase tracking-[0.16em] text-[#a68d63]">{t.from}</p>
            <p className="mt-1 font-serif text-lg text-[#3a2e1f]">
              {memory.storyGiver.displayName}
            </p>
          </div>

          {memory.hasAudio && (
            <div className="mt-9">
              <p className="text-xs uppercase tracking-[0.16em] text-[#a68d63] mb-3">
                {t.listenTitle}
              </p>
              {audioBroken ? (
                <p className="text-sm text-[#8a7a5f] leading-relaxed">{t.unavailable}</p>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={toggle}
                    aria-label={playing ? t.pause : t.play}
                    className="h-14 w-14 shrink-0 rounded-full bg-[#3a2e1f] text-[#f6f1e7] grid place-items-center transition-transform active:scale-95"
                  >
                    {playing ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                        <rect x="4" y="3" width="4" height="14" rx="1" />
                        <rect x="12" y="3" width="4" height="14" rx="1" />
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                        <path d="M5 3.5v13a1 1 0 0 0 1.54.84l10-6.5a1 1 0 0 0 0-1.68l-10-6.5A1 1 0 0 0 5 3.5Z" />
                      </svg>
                    )}
                  </button>
                  <div className="text-sm text-[#6b5d49]">
                    <span className="block">{playing ? t.pause : t.play}</span>
                    {duration && <span className="text-xs text-[#a68d63]">{duration}</span>}
                  </div>
                  {/* same-origin proxy — never the storage URL */}
                  <audio ref={audioRef} src={`/m/${token}/audio`} preload="none" />
                </div>
              )}
            </div>
          )}
        </article>

        <p className="mt-10 text-center text-xs text-[#a68d63] leading-relaxed">{t.footer}</p>
      </div>
    </main>
  );
}
