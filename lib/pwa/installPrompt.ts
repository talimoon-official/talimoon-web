/**
 * Single source of truth for the custom PWA install prompt.
 *
 * The prompt used to own this state inside a component effect: a 1s
 * interval re-ran `setVisible(true)` whenever the deferred
 * `beforeinstallprompt` event existed, and nothing stopped it after the
 * visitor dismissed the banner or installed the app — so the banner came
 * straight back a second later. State now lives here, at module level:
 *
 * - one set of window listeners, attached for the first subscriber and
 *   removed with the last (no duplicates across remounts);
 * - the deferred event survives a remount, and is dropped once used;
 * - dismissal and installation are terminal for this session (memory +
 *   sessionStorage) and persisted in localStorage — dismissal with a
 *   cooldown, installation permanently;
 * - every storage access is guarded: in-app webviews / private modes that
 *   throw on storage still hide the banner, just without persistence.
 *
 * The banner is shown only when ALL hold: the browser fired
 * `beforeinstallprompt` (so install is actually supported), the app is not
 * installed or running standalone, no dismissal cooldown is active, and the
 * visitor has spent ACTIVE_DELAY_MS of focused time on the site.
 */

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const DISMISSED_KEY = 'talimoon-pwa-prompt-dismissed';
export const INSTALLED_KEY = 'talimoon-pwa-installed';
export const SESSION_DISMISSED_KEY = 'talimoon-pwa-prompt-dismissed-session';
export const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
export const ACTIVE_DELAY_MS = 2 * 60 * 1000;

type Listener = () => void;

let listeners: Listener[] = [];
let deferredPrompt: InstallPromptEvent | null = null;
let installed = false;
let dismissedThisSession = false;
let dismissedAt = 0;
let activeMs = 0;
let lastTick = 0;
let tickTimer: number | null = null;
let visible = false;

function storageGet(storage: 'localStorage' | 'sessionStorage', key: string): string | null {
  try {
    return window[storage].getItem(key);
  } catch {
    return null;
  }
}

function storageSet(storage: 'localStorage' | 'sessionStorage', key: string, value: string) {
  try {
    window[storage].setItem(key, value);
  } catch {
    // Storage blocked (in-app browser, private mode, quota) — the in-memory
    // flags still keep the banner hidden for this session.
  }
}

export function isStandalone(): boolean {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  const displayStandalone = typeof window.matchMedia === 'function'
    && window.matchMedia('(display-mode: standalone)').matches;
  return displayStandalone || iosNavigator.standalone === true;
}

function isBlocked(): boolean {
  return installed
    || dismissedThisSession
    || Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
}

function update() {
  const next = !isBlocked() && deferredPrompt !== null && activeMs >= ACTIVE_DELAY_MS;
  if (next !== visible) {
    visible = next;
    listeners.forEach((listener) => listener());
  }
  // Nothing left to wait for — stop counting active time.
  if ((isBlocked() || activeMs >= ACTIVE_DELAY_MS) && tickTimer !== null) {
    window.clearInterval(tickTimer);
    tickTimer = null;
  }
}

function markInstalled() {
  installed = true;
  deferredPrompt = null;
  storageSet('localStorage', INSTALLED_KEY, '1');
  update();
}

function onBeforeInstallPrompt(event: Event) {
  // Always suppress the browser's own mini-infobar: our banner (or its
  // dismissal) is the one install surface.
  event.preventDefault();
  if (installed) return;
  deferredPrompt = event as InstallPromptEvent;
  update();
}

function onVisibilityChange() {
  lastTick = performance.now();
}

function tick() {
  const now = performance.now();
  if (document.visibilityState === 'visible' && document.hasFocus()) {
    activeMs += Math.min(now - lastTick, 1500);
  }
  lastTick = now;
  update();
}

function attach() {
  installed = installed
    || storageGet('localStorage', INSTALLED_KEY) === '1'
    || isStandalone();
  dismissedThisSession = dismissedThisSession
    || storageGet('sessionStorage', SESSION_DISMISSED_KEY) === '1';
  dismissedAt = Math.max(dismissedAt, Number(storageGet('localStorage', DISMISSED_KEY)) || 0);

  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  window.addEventListener('appinstalled', markInstalled);
  document.addEventListener('visibilitychange', onVisibilityChange);
  if (!isBlocked() && activeMs < ACTIVE_DELAY_MS) {
    lastTick = performance.now();
    tickTimer = window.setInterval(tick, 1000);
  }
  update();
}

function detach() {
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  window.removeEventListener('appinstalled', markInstalled);
  document.removeEventListener('visibilitychange', onVisibilityChange);
  if (tickTimer !== null) {
    window.clearInterval(tickTimer);
    tickTimer = null;
  }
}

export function subscribeInstallPrompt(listener: Listener): () => void {
  listeners.push(listener);
  if (listeners.length === 1) attach();
  return () => {
    listeners = listeners.filter((l) => l !== listener);
    if (listeners.length === 0) detach();
  };
}

export function getInstallPromptVisible(): boolean {
  return visible;
}

export function getInstallPromptServerSnapshot(): boolean {
  return false;
}

export function dismissInstallPrompt() {
  dismissedThisSession = true;
  dismissedAt = Date.now();
  storageSet('sessionStorage', SESSION_DISMISSED_KEY, '1');
  storageSet('localStorage', DISMISSED_KEY, String(dismissedAt));
  update();
}

export async function runInstallPrompt() {
  const event = deferredPrompt;
  if (!event) return;
  // The event is single-use; drop it first so the banner hides at once.
  deferredPrompt = null;
  update();
  try {
    await event.prompt();
    const choice = await event.userChoice;
    if (choice.outcome === 'accepted') markInstalled();
    else dismissInstallPrompt();
  } catch {
    dismissInstallPrompt();
  }
}

/** Test-only: return the module to its pristine, detached state. */
export function resetInstallPromptForTests() {
  detach();
  listeners = [];
  deferredPrompt = null;
  installed = false;
  dismissedThisSession = false;
  dismissedAt = 0;
  activeMs = 0;
  lastTick = 0;
  visible = false;
}
