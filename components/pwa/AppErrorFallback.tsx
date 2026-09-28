"use client";

/**
 * What the app shows when a screen fails to render — instead of Next.js's
 * bare "Application error" white screen, which in an installed PWA looks
 * like a frozen app.
 *
 * A chunk-load failure (an old build asking for files the server no longer
 * has) first gets ONE automatic recovery reload (lib/pwa/lifecycle.ts);
 * everything else — or a second failure inside the recovery window — shows
 * this calm screen with a manual reload. An unfinished order is safe either
 * way: it lives on the device (IndexedDB) and is flushed before any reload.
 */

import { useEffect, useState } from "react";
import { recoverFromChunkError } from "@/lib/pwa/lifecycle";
import { recordDiag } from "@/lib/pwa/diagnostics";
import { flushDraftWrites } from "@/lib/order/formDraft";

const COPY = {
  uz: {
    title: "Sahifani ochib bo‘lmadi",
    body: "Ilovani qayta yuklab ko‘ring. Boshlagan buyurtmangiz shu qurilmada saqlangan.",
    reload: "Qayta yuklash",
    retry: "Yana urinish",
  },
  en: {
    title: "This screen could not open",
    body: "Please reload the app. Your started order is saved on this device.",
    reload: "Reload",
    retry: "Try again",
  },
  ru: {
    title: "Не удалось открыть экран",
    body: "Перезагрузите приложение. Начатый заказ сохранён на этом устройстве.",
    reload: "Перезагрузить",
    retry: "Повторить",
  },
};

function pickLocale(): keyof typeof COPY {
  try {
    const l = (localStorage.getItem("talimoon-language") ?? "").toLowerCase();
    if (l === "en" || l === "ru") return l;
  } catch {
    /* ignore */
  }
  return "uz";
}

export function AppErrorFallback({ error, reset }: { error: Error; reset?: () => void }) {
  const [recovering, setRecovering] = useState(true);
  const [loc] = useState(pickLocale);
  const c = COPY[loc];

  useEffect(() => {
    let live = true;
    void recoverFromChunkError(error).then((reloading) => {
      if (!reloading) {
        if (!/chunk/i.test(error?.name ?? "")) recordDiag("runtime_error", error?.name || "Error");
        if (live) setRecovering(false);
      }
    });
    return () => {
      live = false;
    };
  }, [error]);

  if (recovering) return <div aria-busy="true" style={{ minHeight: "60vh" }} />;

  return (
    <div
      role="alert"
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      <div style={{ maxWidth: 360 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>{c.title}</h2>
        <p style={{ margin: "0 0 20px", opacity: 0.75, lineHeight: 1.6 }}>{c.body}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={async () => {
              await flushDraftWrites();
              window.location.reload();
            }}
            style={{
              minHeight: 48,
              padding: "0 24px",
              border: 0,
              borderRadius: 999,
              background: "#D6B770",
              color: "#101A29",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {c.reload}
          </button>
          {reset && (
            <button
              type="button"
              onClick={reset}
              style={{
                minHeight: 48,
                padding: "0 24px",
                borderRadius: 999,
                border: "1px solid currentColor",
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              {c.retry}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
