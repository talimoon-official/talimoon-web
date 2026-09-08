/**
 * Same-origin proxy for a private Voice Memory's original voice note.
 *
 * The page's <audio> element points here (`/m/<token>/audio`), NOT at the
 * intake service — CSP `media-src 'self'` would block a cross-origin source,
 * and the storage/backend URL must never reach the browser. Range requests
 * are passed straight through so the player can seek. Nothing is cached.
 *
 * A missing / deleted master returns 404 and the page renders its
 * "voice unavailable" state — the printed QR is never reassigned.
 */

import { MEMORY_TOKEN_RE } from "@/lib/memory/api";

export const dynamic = "force-dynamic";

function intakeBase(): string {
  const base = process.env.INTAKE_API_URL ?? process.env.NEXT_PUBLIC_INTAKE_API_URL ?? "";
  return base.replace(/\/+$/, "");
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await ctx.params;
  const base = intakeBase();
  if (!base || !MEMORY_TOKEN_RE.test(token)) {
    return new Response(null, { status: 404 });
  }

  const range = req.headers.get("range");
  let upstream: Response;
  try {
    upstream = await fetch(`${base}/v1/m/${encodeURIComponent(token)}/audio`, {
      headers: range ? { range } : undefined,
      cache: "no-store",
    });
  } catch {
    return new Response(null, { status: 502 });
  }

  if (upstream.status === 404) return new Response(null, { status: 404 });
  if (!upstream.ok && upstream.status !== 206) {
    return new Response(null, { status: 502 });
  }

  const headers = new Headers();
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");

  return new Response(upstream.body, { status: upstream.status, headers });
}
