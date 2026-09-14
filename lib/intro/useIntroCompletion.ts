"use client";

/**
 * Tracks ONLY whether the four-screen first-visit journey has been
 * completed — gates on the `talimoon-intro-seen` localStorage flag,
 * the same pattern already used by the PWA install prompt. Whether the
 * Language Gate or the intro should currently be showing is a separate
 * decision made one level up (components/intro/FirstVisitExperience.tsx)
 * by combining `introSeen` here with `useHasChosenLanguage()` from
 * lib/i18n/LanguageContext.tsx — this hook doesn't know anything about
 * language.
 *
 * `forced` reports the `?intro=1` query param as its own signal
 * (rather than folding it into a single "visible" boolean) so the
 * orchestrator can force-preview the experience even when `introSeen`
 * is already true, without that forcing also being confused for "not
 * completed".
 *
 * Built on `useSyncExternalStore`, not `useState` + `useEffect(() =>
 * setState(...), [])` — see lib/i18n/LanguageContext.tsx's
 * `LanguageProvider` for the full rationale (same SSR-safe pattern).
 */

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "talimoon-intro-seen";
const FORCE_PARAM = "intro";

type Listener = () => void;
let listeners: Listener[] = [];
let currentIntroSeen = false;
let initialized = false;

function computeInitialIntroSeen(): boolean {
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

function subscribe(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): boolean {
  if (!initialized) {
    currentIntroSeen = computeInitialIntroSeen();
    initialized = true;
  }
  return currentIntroSeen;
}

function getServerSnapshot(): boolean {
  return false;
}

function markComplete(): void {
  window.localStorage.setItem(STORAGE_KEY, "1");
  currentIntroSeen = true;
  listeners.forEach((listener) => listener());
}

let currentForced = false;
let forcedInitialized = false;

function computeForced(): boolean {
  return new URLSearchParams(window.location.search).get(FORCE_PARAM) === "1";
}

function getForcedSnapshot(): boolean {
  if (!forcedInitialized) {
    currentForced = computeForced();
    forcedInitialized = true;
  }
  return currentForced;
}

function getForcedServerSnapshot(): boolean {
  return false;
}

export function useIntroCompletion() {
  const introSeen = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // `forced` goes through the same SSR-matching two-pass snapshot
  // shape as `introSeen` above — reading `location.search` directly
  // during render would mismatch the server's always-closed markup
  // the instant the URL carries `?intro=1`.
  const forced = useSyncExternalStore(subscribe, getForcedSnapshot, getForcedServerSnapshot);
  return { introSeen, forced, complete: markComplete };
}
