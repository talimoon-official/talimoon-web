import { buildServiceWorker } from "@/lib/pwa/swSource";

/**
 * `/sw.js` — the service worker, generated at BUILD time with this build's
 * version inside (lib/pwa/swSource.ts). Different bytes on every deployment
 * is what makes the browser install the new worker and drop the old
 * deployment's caches. Replaces the former static public/sw.js.
 */
export const dynamic = "force-static";

export function GET() {
  return new Response(buildServiceWorker(process.env.NEXT_PUBLIC_APP_BUILD ?? "dev"), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, max-age=0, must-revalidate",
    },
  });
}
