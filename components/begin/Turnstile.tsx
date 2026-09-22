"use client";

// Minimal Cloudflare Turnstile integration — the OFFICIAL script directly,
// no npm wrapper package. Renders NO visible UI (invisible/managed mode):
// Cloudflare only shows an interactive challenge itself when its own risk
// signals require it, so this never changes the order flow's layout.
//
// One widget is created per `execute()` call and torn down immediately
// after resolving, so a token is never reused across submission attempts —
// bypassing/weakening the real backend Turnstile check is not possible from
// here; this only produces the token the backend independently verifies.

import Script from "next/script";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

type TurnstileWidgetId = string;

interface TurnstileRenderOptions {
  sitekey: string;
  size?: "flexible" | "normal" | "compact";
  appearance?: "always" | "execute" | "interaction-only";
  execution?: "render" | "execute";
  retry?: "auto" | "never";
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
}

interface TurnstileWindowApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => TurnstileWidgetId;
  execute: (widgetId: TurnstileWidgetId) => void;
  remove: (widgetId: TurnstileWidgetId) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileWindowApi;
  }
}

export interface TurnstileHandle {
  /** Runs one challenge and resolves a fresh, single-use token, or rejects
   *  on failure/timeout. Callers must treat a rejection as retry-safe. */
  execute: () => Promise<string>;
}

const EXECUTE_TIMEOUT_MS = 30_000;

const Turnstile = forwardRef<TurnstileHandle, { siteKey: string | undefined }>(function Turnstile(
  { siteKey },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useImperativeHandle(ref, () => ({
    execute: () =>
      new Promise<string>((resolve, reject) => {
        if (!siteKey) {
          reject(new Error("Turnstile is not configured"));
          return;
        }
        const api = window.turnstile;
        const container = containerRef.current;
        if (!scriptReady || !api || !container) {
          reject(new Error("Turnstile is not ready yet"));
          return;
        }

        let widgetId: TurnstileWidgetId | null = null;
        const timeout = setTimeout(() => {
          if (widgetId) api.remove(widgetId);
          reject(new Error("Turnstile challenge timed out"));
        }, EXECUTE_TIMEOUT_MS);

        try {
          widgetId = api.render(container, {
            sitekey: siteKey,
            // `invisible` is a widget mode configured in Cloudflare, not a
            // valid value for the client-side `size` option. Explicit
            // execution also prevents render() and execute() from starting
            // the same challenge twice.
            size: "flexible",
            appearance: "interaction-only",
            execution: "execute",
            retry: "never",
            callback: (token) => {
              clearTimeout(timeout);
              if (widgetId) api.remove(widgetId);
              resolve(token);
            },
            "error-callback": () => {
              clearTimeout(timeout);
              if (widgetId) api.remove(widgetId);
              reject(new Error("Turnstile challenge failed"));
            },
            "expired-callback": () => {
              clearTimeout(timeout);
              if (widgetId) api.remove(widgetId);
              reject(new Error("Turnstile challenge expired"));
            },
          });
          api.execute(widgetId);
        } catch (err) {
          clearTimeout(timeout);
          reject(err instanceof Error ? err : new Error("Turnstile render failed"));
        }
      }),
  }));

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      {/* Normally this has no visual footprint. If Cloudflare requires an
          interaction, keep the challenge reachable instead of hiding it
          with display:none (which can make checkout impossible). */}
      <div
        ref={containerRef}
        className="fixed bottom-4 left-1/2 z-[100] w-[min(300px,calc(100vw-2rem))] -translate-x-1/2"
      />
    </>
  );
});

export default Turnstile;
