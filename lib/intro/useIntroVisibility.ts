"use client";

/**
 * First-visit gate for the homepage entrance experience. Reuses the
 * same "localStorage flag, checked once" pattern already shipped in
 * components/pwa/PwaInstallPrompt.tsx rather than inventing a new
 * persistence strategy. `?intro=1` forces the experience open
 * regardless of the stored flag — the dev/QA reset path: clearing the
 * flag (or just appending the query param) reopens it, no debug UI
 * needed.
 *
 * Built on `useSyncExternalStore`, not `useState` + `useEffect(() =>
 * setState(...), [])` — that pattern trips `react-hooks/set-state-in-effect`
 * and still renders the wrong (server) value for one extra frame
 * regardless, since `window` isn't available during SSR. Same
 * rationale, same shape, as `lib/i18n/LanguageContext.tsx`'s
 * `LanguageProvider`: `getServerSnapshot` renders `false` (closed) for
 * the SSR-matching first client pass, then the real value immediately
 * follows with no manual effect.
 */

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "talimoon-intro-seen";
const FORCE_PARAM = "intro";

type Listener = () => void;
let listeners: Listener[] = [];
let currentVisible = false;
let initialized = false;

function computeInitialVisibility(): boolean {
  const forced = new URLSearchParams(window.location.search).get(FORCE_PARAM) === "1";
  const seen = window.localStorage.getItem(STORAGE_KEY) === "1";
  return forced || !seen;
}

function subscribe(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): boolean {
  if (!initialized) {
    currentVisible = computeInitialVisibility();
    initialized = true;
  }
  return currentVisible;
}

function getServerSnapshot(): boolean {
  return false;
}

function markComplete(): void {
  window.localStorage.setItem(STORAGE_KEY, "1");
  currentVisible = false;
  listeners.forEach((listener) => listener());
}

export function useIntroVisibility() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { visible, complete: markComplete };
}
