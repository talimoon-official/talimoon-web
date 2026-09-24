'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useT } from '@/lib/i18n/LanguageContext';
import {
  dismissInstallPrompt,
  getInstallPromptServerSnapshot,
  getInstallPromptVisible,
  runInstallPrompt,
  subscribeInstallPrompt,
} from '@/lib/pwa/installPrompt';

const EN = {
  aria: 'Install the TALIMOON app', close: 'Close', eyebrow: 'TALIMOON APP',
  title: 'Save TALIMOON on your device', install: 'Install app',
};
const UZ: typeof EN = {
  aria: 'TALIMOON ilovasini o‘rnatish', close: 'Yopish', eyebrow: 'TALIMOON ILOVASI',
  title: 'TALIMOON’ni qurilmangizga saqlang', install: 'Ilovani o‘rnatish',
};
const RU: typeof EN = {
  aria: 'Установить приложение TALIMOON', close: 'Закрыть', eyebrow: 'ПРИЛОЖЕНИЕ TALIMOON',
  title: 'Сохраните TALIMOON на устройстве', install: 'Установить приложение',
};

export function PwaInstallPrompt() {
  const t = useT(EN, UZ, RU);
  const visible = useSyncExternalStore(
    subscribeInstallPrompt,
    getInstallPromptVisible,
    getInstallPromptServerSnapshot,
  );

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((registration) => registration.update())
        .catch(() => undefined);
    }
  }, []);

  if (!visible) return null;

  return (
    <aside className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-[1000] mx-auto max-w-md overflow-hidden rounded-[24px] border border-[#D6B770]/45 bg-[#101A29]/95 p-4 text-[#F7F3EC] shadow-[0_24px_80px_rgba(5,13,25,.42)] backdrop-blur-xl" aria-label={t.aria}>
      <button type="button" onClick={dismissInstallPrompt} aria-label={t.close} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-xl text-white/55 hover:bg-white/10 hover:text-white">×</button>
      <div className="flex gap-3 pr-8">
        <img src="/pwa/prompt-logo-v4.png" alt="TALIMOON" width={56} height={56} className="h-14 w-14 object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,.55)]" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D6B770]">{t.eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold">{t.title}</h2>
        </div>
      </div>
      <button type="button" onClick={() => void runInstallPrompt()} className="mt-4 w-full rounded-full bg-[#D6B770] px-5 py-3 text-sm font-bold text-[#101A29] shadow-lg">{t.install}</button>
    </aside>
  );
}
