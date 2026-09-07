'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n/LanguageContext';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'talimoon-pwa-prompt-dismissed';
const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;
const ACTIVE_DELAY_MS = 2 * 60 * 1000;

const EN = {
  aria: 'Install the TALIMOON app', close: 'Close', eyebrow: 'TALIMOON APP',
  title: 'Save TALIMOON on your device', step1: 'Step 1', step2: 'Step 2',
  share: 'Tap the Share ⎋ button below', add: 'Choose Add to Home Screen ＋',
  iosHelp: 'Copy the link, open it in Safari, then choose Share → Add to Home Screen.',
  copied: 'Copied — open in Safari', copy: 'Copy link', install: 'Install app',
  fallback: 'Copy the link and open it in Safari:',
};
const UZ: typeof EN = {
  aria: 'TALIMOON ilovasini o‘rnatish', close: 'Yopish', eyebrow: 'TALIMOON ILOVASI',
  title: 'TALIMOON’ni qurilmangizga saqlang', step1: '1-qadam', step2: '2-qadam',
  share: 'Pastdagi Ulashish ⎋ tugmasini bosing', add: 'Bosh ekranga qo‘shish ＋ni tanlang',
  iosHelp: 'Havolani nusxalang, Safari’da oching va Ulashish → Bosh ekranga qo‘shish’ni tanlang.',
  copied: 'Nusxalandi — Safari’da oching', copy: 'Havolani nusxalash', install: 'Ilovani o‘rnatish',
  fallback: 'Havolani nusxalang va Safari’da oching:',
};
const RU: typeof EN = {
  aria: 'Установить приложение TALIMOON', close: 'Закрыть', eyebrow: 'ПРИЛОЖЕНИЕ TALIMOON',
  title: 'Сохраните TALIMOON на устройстве', step1: 'Шаг 1', step2: 'Шаг 2',
  share: 'Нажмите кнопку «Поделиться» ⎋ внизу', add: 'Выберите «На экран Домой» ＋',
  iosHelp: 'Скопируйте ссылку, откройте её в Safari и выберите «Поделиться» → «На экран Домой».',
  copied: 'Скопировано — откройте в Safari', copy: 'Скопировать ссылку', install: 'Установить приложение',
  fallback: 'Скопируйте ссылку и откройте её в Safari:',
};

function isStandalone() {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || iosNavigator.standalone === true;
}

export function PwaInstallPrompt() {
  const t = useT(EN, UZ, RU);
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isIOSSafari = isIOS
    && /safari/i.test(navigator.userAgent)
    && !/crios|fxios|edgios|opios|yabrowser/i.test(navigator.userAgent);

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    if (isStandalone()) return;

    const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) || 0);
    if (Date.now() - dismissedAt < TWO_WEEKS) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    let deferredPrompt: InstallPromptEvent | null = null;
    let activeMs = 0;
    let lastTick = performance.now();

    const revealWhenEligible = () => {
      if (activeMs >= ACTIVE_DELAY_MS && (ios || deferredPrompt)) setVisible(true);
    };
    const trackActiveUse = window.setInterval(() => {
      const now = performance.now();
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        activeMs += Math.min(now - lastTick, 1500);
        revealWhenEligible();
      }
      lastTick = now;
    }, 1000);
    const onVisibilityChange = () => { lastTick = performance.now(); };
    const onPrompt = (event: Event) => {
      event.preventDefault();
      deferredPrompt = event as InstallPromptEvent;
      setInstallEvent(deferredPrompt);
      revealWhenEligible();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => {
      window.clearInterval(trackActiveUse);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeinstallprompt', onPrompt);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') setVisible(false);
    setInstallEvent(null);
  };

  const copyForSafari = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt(t.fallback, window.location.href);
    }
  };

  if (!visible) return null;

  return (
    <aside className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-[1000] mx-auto max-w-md overflow-hidden rounded-[24px] border border-[#D6B770]/45 bg-[#101A29]/95 p-4 text-[#F7F3EC] shadow-[0_24px_80px_rgba(5,13,25,.42)] backdrop-blur-xl" aria-label={t.aria}>
      <button type="button" onClick={dismiss} aria-label={t.close} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-xl text-white/55 hover:bg-white/10 hover:text-white">×</button>
      <div className="flex gap-3 pr-8">
        <img src="/pwa/prompt-logo-v4.png" alt="TALIMOON" width={56} height={56} className="h-14 w-14 object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,.55)]" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D6B770]">{t.eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold">{t.title}</h2>
        </div>
      </div>
      {isIOSSafari ? (
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-2xl bg-white/[.07] px-3 py-3 text-white/75">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[.18em] text-[#D6B770]">{t.step1}</span>
            {t.share}
          </div>
          <div className="rounded-2xl bg-white/[.07] px-3 py-3 text-white/75">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[.18em] text-[#D6B770]">{t.step2}</span>
            {t.add}
          </div>
        </div>
      ) : isIOS ? (
        <div className="mt-3">
          <p className="text-sm leading-6 text-white/70">{t.iosHelp}</p>
          <button type="button" onClick={copyForSafari} className="mt-3 w-full rounded-full bg-[#D6B770] px-5 py-3 text-sm font-bold text-[#101A29] shadow-lg">
            {copied ? t.copied : t.copy}
          </button>
        </div>
      ) : (
        <button type="button" onClick={install} className="mt-4 w-full rounded-full bg-[#D6B770] px-5 py-3 text-sm font-bold text-[#101A29] shadow-lg">{t.install}</button>
      )}
    </aside>
  );
}
