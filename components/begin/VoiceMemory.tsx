"use client";

/**
 * Optional voice note for the private Voice Memory — the STORY GIVER's own
 * real recorded words for the child, kept forever behind the QR in the book.
 *
 * Rules (from the feature spec):
 *  - Entirely optional. Max 2 minutes.
 *  - Two ways to provide it: record here in the browser, or upload a file.
 *  - Browser recording has three controls: Listen · Record again · Confirm.
 *  - Recording again DISCARDS the previous take completely — its Blob URL is
 *    revoked, its bytes are dropped, and nothing unconfirmed is ever handed
 *    up to the parent (so nothing unconfirmed can be uploaded).
 *  - Only the take the story giver Confirms is passed to `onChange`.
 *  - The real human voice is preserved as-is: no processing, no AI, no
 *    normalisation. This component only records/holds bytes.
 *
 * The parent form uploads the confirmed File as `kind=final_voice` after the
 * order is submitted, passing the measured `durationSec`.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/LanguageContext";

const MAX_SECONDS = 120;
const MAX_BYTES = 60 * 1024 * 1024;
const ACCEPT = "audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/x-wav,audio/ogg,audio/webm";

const EN = {
  title: "Their voice (optional)",
  help: "You can add a short recording of these words in your own voice — up to 2 minutes. Your child will hear it exactly as you record it.",
  record: "Record",
  stop: "Stop",
  recording: "Recording…",
  listen: "Listen",
  pause: "Pause",
  again: "Record again",
  replace: "Choose another file",
  confirm: "Use this recording",
  confirmed: "Recording added",
  remove: "Remove",
  or: "or",
  upload: "Upload an audio file",
  tooLong: "That recording is longer than 2 minutes. Please shorten it.",
  tooBig: "That file is too large (max 60 MB).",
  badFile: "That doesn't look like an audio file we can use.",
  micDenied: "Microphone access was blocked. You can upload a file instead.",
  noRecorder: "Recording isn't supported in this browser — you can upload a file instead.",
};
const UZ: typeof EN = {
  title: "Uning ovozi (ixtiyoriy)",
  help: "Ushbu so'zlarni o'z ovozingizda qisqa yozib qo'yishingiz mumkin — 2 daqiqagacha. Farzandingiz uni siz yozgan holicha eshitadi.",
  record: "Yozib olish",
  stop: "To'xtatish",
  recording: "Yozilmoqda…",
  listen: "Tinglash",
  pause: "To'xtatish",
  again: "Qayta yozib olish",
  replace: "Boshqa fayl tanlash",
  confirm: "Shu yozuvdan foydalanish",
  confirmed: "Yozuv qo'shildi",
  remove: "Olib tashlash",
  or: "yoki",
  upload: "Audio fayl yuklash",
  tooLong: "Bu yozuv 2 daqiqadan uzun. Iltimos, qisqartiring.",
  tooBig: "Bu fayl juda katta (eng ko'pi 60 MB).",
  badFile: "Bu biz foydalana oladigan audio faylga o'xshamaydi.",
  micDenied: "Mikrofonga ruxsat berilmadi. Buning o'rniga fayl yuklashingiz mumkin.",
  noRecorder: "Bu brauzerda yozib olish qo'llab-quvvatlanmaydi — fayl yuklashingiz mumkin.",
};
const RU: typeof EN = {
  title: "Их голос (по желанию)",
  help: "Вы можете добавить короткую запись этих слов своим голосом — до 2 минут. Ваш ребёнок услышит её ровно так, как вы её запишете.",
  record: "Записать",
  stop: "Стоп",
  recording: "Идёт запись…",
  listen: "Прослушать",
  pause: "Пауза",
  again: "Записать заново",
  replace: "Выбрать другой файл",
  confirm: "Использовать эту запись",
  confirmed: "Запись добавлена",
  remove: "Удалить",
  or: "или",
  upload: "Загрузить аудиофайл",
  tooLong: "Эта запись длиннее 2 минут. Пожалуйста, сократите её.",
  tooBig: "Этот файл слишком большой (макс. 60 МБ).",
  badFile: "Это не похоже на аудиофайл, который мы можем использовать.",
  micDenied: "Доступ к микрофону заблокирован. Вы можете загрузить файл.",
  noRecorder: "Запись не поддерживается в этом браузере — вы можете загрузить файл.",
};

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus", "audio/ogg"];
  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c)) return c;
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

function extFor(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mpeg")) return "mp3";
  if (mime.includes("wav")) return "wav";
  return "webm";
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Measure an audio file's duration off-DOM. Resolves null if unreadable. */
function measureDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("audio");
    el.preload = "metadata";
    const done = (v: number | null) => {
      URL.revokeObjectURL(url);
      el.src = "";
      resolve(v);
    };
    el.onloadedmetadata = () =>
      done(Number.isFinite(el.duration) && el.duration > 0 ? el.duration : null);
    el.onerror = () => done(null);
    el.src = url;
  });
}

type Take = { file: File; url: string; durationSec: number | null };

export interface VoiceMemoryProps {
  /** confirmed file, lifted so the parent survives re-render */
  value: File | null;
  onChange: (file: File | null, durationSec: number | null) => void;
}

export default function VoiceMemory({ value, onChange }: VoiceMemoryProps) {
  const t = useT(EN, UZ, RU);

  const [take, setTake] = useState<Take | null>(null);
  const [confirmed, setConfirmed] = useState<boolean>(Boolean(value));
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const takeRef = useRef<Take | null>(null);

  const canRecord = typeof window !== "undefined" && Boolean(pickMime()) && Boolean(navigator.mediaDevices);

  /** Drop the current temporary take completely — bytes gone, URL revoked. */
  const discardTake = useCallback(() => {
    if (takeRef.current) URL.revokeObjectURL(takeRef.current.url);
    takeRef.current = null;
    setTake(null);
    setPlaying(false);
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }, []);

  const clearTick = () => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTick();
      stopStream();
      if (takeRef.current) URL.revokeObjectURL(takeRef.current.url);
    };
  }, [stopStream]);

  const stopRecording = useCallback(() => {
    clearTick();
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    setRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    // starting a new take always discards any unconfirmed previous one
    discardTake();
    setConfirmed(false);
    onChange(null, null);

    const mime = pickMime();
    if (!mime) {
      setError(t.noRecorder);
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError(t.micDenied);
      return;
    }
    streamRef.current = stream;
    chunksRef.current = [];
    const rec = new MediaRecorder(stream, { mimeType: mime });
    recorderRef.current = rec;
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      stopStream();
      const blob = new Blob(chunksRef.current, { type: mime });
      chunksRef.current = [];
      const durationSec = Math.min(MAX_SECONDS, (Date.now() - startedAtRef.current) / 1000);
      const file = new File([blob], `voice-memory.${extFor(mime)}`, { type: mime });
      const url = URL.createObjectURL(file);
      const next: Take = { file, url, durationSec };
      takeRef.current = next;
      setTake(next);
      setElapsed(0);
    };

    startedAtRef.current = Date.now();
    setElapsed(0);
    rec.start();
    setRecording(true);
    tickRef.current = window.setInterval(() => {
      const s = (Date.now() - startedAtRef.current) / 1000;
      setElapsed(s);
      if (s >= MAX_SECONDS) stopRecording();
    }, 250);
  }, [discardTake, onChange, stopRecording, stopStream, t.micDenied, t.noRecorder]);

  const onPickFile = useCallback(
    async (file: File | undefined) => {
      setError(null);
      if (!file) return;
      if (file.size > MAX_BYTES) {
        setError(t.tooBig);
        return;
      }
      if (!file.type.startsWith("audio/")) {
        setError(t.badFile);
        return;
      }
      const durationSec = await measureDuration(file);
      if (durationSec !== null && durationSec > MAX_SECONDS + 2) {
        setError(t.tooLong);
        return;
      }
      discardTake();
      setConfirmed(false);
      onChange(null, null);
      const url = URL.createObjectURL(file);
      const next: Take = { file, url, durationSec };
      takeRef.current = next;
      setTake(next);
    },
    [discardTake, onChange, t.badFile, t.tooBig, t.tooLong],
  );

  const togglePlay = () => {
    const el = audioElRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    }
  };

  const confirmTake = () => {
    if (!take) return;
    setConfirmed(true);
    onChange(take.file, take.durationSec);
  };

  const removeAll = () => {
    discardTake();
    setConfirmed(false);
    onChange(null, null);
    setError(null);
  };

  // ---- confirmed state ----
  if (confirmed && value) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-emerald-800">✓ {t.confirmed}</span>
          <button type="button" onClick={removeAll} className="text-xs text-emerald-700 underline">
            {t.remove}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-black/10 bg-white/60 px-4 py-4">
      <p className="text-sm font-medium">{t.title}</p>
      <p className="mt-1 text-xs text-black/55 leading-relaxed">{t.help}</p>

      {/* ---- preview of the current (unconfirmed) take ---- */}
      {take ? (
        <div className="mt-3">
          <audio
            ref={audioElRef}
            src={take.url}
            onEnded={() => setPlaying(false)}
            preload="metadata"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="rounded-md bg-black/80 px-3 py-1.5 text-xs font-medium text-white"
            >
              {playing ? t.pause : t.listen}
              {take.durationSec ? ` · ${fmt(take.durationSec)}` : ""}
            </button>
            {canRecord && (
              <button
                type="button"
                onClick={startRecording}
                className="rounded-md border border-black/15 px-3 py-1.5 text-xs"
              >
                {t.again}
              </button>
            )}
            <label className="cursor-pointer rounded-md border border-black/15 px-3 py-1.5 text-xs">
              {t.replace}
              <input
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0])}
              />
            </label>
            <button
              type="button"
              onClick={confirmTake}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
            >
              {t.confirm}
            </button>
          </div>
        </div>
      ) : (
        /* ---- idle: record and/or upload ---- */
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {canRecord &&
            (recording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white"
              >
                ● {t.stop} · {fmt(elapsed)}
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="rounded-md bg-black/80 px-3 py-1.5 text-xs font-medium text-white"
              >
                {t.record}
              </button>
            ))}
          {canRecord && !recording && <span className="text-xs text-black/40">{t.or}</span>}
          {!recording && (
            <label className="cursor-pointer rounded-md border border-black/15 px-3 py-1.5 text-xs">
              {t.upload}
              <input
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0])}
              />
            </label>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
