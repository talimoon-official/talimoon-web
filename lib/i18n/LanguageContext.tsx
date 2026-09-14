"use client";

/**
 * Site-wide language switch — client-only, no route/URL changes.
 * The Navbar's language dropdown used to hold its own local
 * `useState`, so picking a language did nothing outside that one
 * component; this lifts it to a single Context at the root layout so
 * every component can read the current language and re-render its
 * own text. Persisted to localStorage so it survives navigation
 * between pages (a plain in-memory Context would silently reset to
 * English on every route change, defeating the point).
 *
 * The persisted value is read through `useSyncExternalStore`, not a
 * `useState` + `useEffect(() => setState(...), [])` pair — that
 * pattern (a) trips `react-hooks/set-state-in-effect`, and (b) still
 * has to render the English default for one frame regardless, since
 * `window.localStorage` isn't available during SSR. `useSyncExternalStore`
 * is React's purpose-built API for exactly this "read a value the
 * server can't see, without a hydration mismatch" case: it renders
 * `getServerSnapshot`'s value ("UZ" — the default for every visitor
 * who has not explicitly chosen another language) for the first
 * (SSR-matching) client pass, then immediately re-renders with the
 * real stored value — no manual effect, no extra intermediate render
 * caused by an effect body calling setState.
 *
 * English, Uzbek and Russian have real translated content. Arabic
 * stays selectable in the menu (unchanged) but falls back to English
 * content via `useT` below — the same no-op behavior it already had
 * before this feature existed, not a regression. Russian is no longer
 * a fallback language: `useT` requires a real `ru` argument at every
 * call site, so TypeScript itself fails a build that forgets one
 * (see `useT` below) rather than silently serving English or Uzbek
 * copy to a Russian-language visitor.
 *
 * `hasChosenLanguage`: a second, independent boolean persisted
 * alongside the language value itself. `currentLanguage` always
 * resolves to a real `Language` (defaulting unset storage to "UZ" so
 * every existing consumer keeps rendering something sane before any
 * choice exists) — which means the stored VALUE alone can never
 * distinguish "visitor explicitly chose Uzbek" from "no one has chosen
 * anything yet". The Language Gate (components/intro/LanguageGate.tsx)
 * needs exactly that distinction to decide whether it should appear at
 * all, so `setStoredLanguage` also stamps a `talimoon-language-chosen`
 * flag on every call (Gate selection AND a later Navbar switch both
 * count as an explicit choice). This is metadata about the one
 * language store, not a second competing language source.
 */

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

export type Language = "UZ" | "EN" | "RU" | "AR";

const STORAGE_KEY = "talimoon-language";
const CHOSEN_KEY = "talimoon-language-chosen";
const VALID_LANGUAGES: readonly Language[] = ["UZ", "EN", "RU", "AR"];

type Listener = () => void;
let listeners: Listener[] = [];
let currentLanguage: Language = readStoredLanguage();
let currentHasChosenLanguage: boolean = readHasChosenLanguage();

function readStoredLanguage(): Language {
  if (typeof window === "undefined") return "UZ";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && (VALID_LANGUAGES as string[]).includes(stored) ? (stored as Language) : "UZ";
}

function readHasChosenLanguage(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CHOSEN_KEY) === "1";
}

function subscribe(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): Language {
  return currentLanguage;
}

function getServerSnapshot(): Language {
  return "UZ";
}

function getChosenSnapshot(): boolean {
  return currentHasChosenLanguage;
}

function getChosenServerSnapshot(): boolean {
  return false;
}

function setStoredLanguage(next: Language): void {
  currentLanguage = next;
  currentHasChosenLanguage = true;
  window.localStorage.setItem(STORAGE_KEY, next);
  window.localStorage.setItem(CHOSEN_KEY, "1");
  listeners.forEach((listener) => listener());
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: setStoredLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

/**
 * Whether this browser has ever made an explicit language choice
 * (Language Gate selection or a Navbar switch) — independent of
 * `useLanguage()`'s `language` value, which always defaults to "UZ"
 * for unset storage. Used only to decide whether the Language Gate
 * should appear (components/intro/FirstVisitExperience.tsx).
 */
export function useHasChosenLanguage(): boolean {
  return useSyncExternalStore(subscribe, getChosenSnapshot, getChosenServerSnapshot);
}

/**
 * Per-component translation picker: `const t = useT(EN_COPY, UZ_COPY,
 * RU_COPY)` then read `t.heading`, `t.body`, etc. `ru` is REQUIRED
 * (not optional) so a call site that forgets it fails `tsc`, not a
 * Russian-language visitor silently reading English or Uzbek copy —
 * this is a deliberate design constraint, not an oversight. AR has no
 * real copy yet and reads the English object, same as before.
 */
export function useT<T>(en: T, uz: T, ru: T): T {
  const { language } = useLanguage();
  if (language === "UZ") return uz;
  if (language === "RU") return ru;
  return en;
}
