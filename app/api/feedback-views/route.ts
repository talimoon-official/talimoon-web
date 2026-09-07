/**
 * TALIMOON — PARENT FEEDBACK — shared "reads" counter.
 * ================================================================
 * The one piece of this section that needs shared state: a single
 * number, incremented every time a visitor scrolls through the
 * approved comments. No de-duplication by person — a returning
 * reader (there will be new comments to read) counts again. That is
 * the whole model: "how many times were the comments read".
 *
 * Storage is whatever `REDIS_URL` points at (Vercel → Storage →
 * Redis, connected to this project). If the variable is absent the
 * route stays up and simply answers `{ count: null }`, so the UI
 * falls back to showing just the comment count — never a fake number.
 *
 *   GET  → { count }   the current total (0 if never incremented)
 *   POST → { count }   increment, then return the new total
 */

import { NextResponse } from "next/server";
import { createClient, type RedisClientType } from "redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "pf:reads";

let clientPromise: Promise<RedisClientType> | null = null;

function getClient(): Promise<RedisClientType> | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!clientPromise) {
    const client: RedisClientType = createClient({ url });
    client.on("error", () => {
      /* swallow — a failed command below resets the cached promise */
    });
    clientPromise = client
      .connect()
      .then(() => client)
      .catch((err) => {
        clientPromise = null;
        throw err;
      });
  }
  return clientPromise;
}

export async function GET() {
  try {
    const pending = getClient();
    if (!pending) return NextResponse.json({ count: null });
    const client = await pending;
    const raw = await client.get(KEY);
    return NextResponse.json({ count: raw ? Number(raw) : 0 });
  } catch {
    clientPromise = null;
    return NextResponse.json({ count: null });
  }
}

function isSameSiteRequest(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site") return false;

  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser clients and older user agents
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  // This public counter carries no identity, but cross-site requests must not
  // be able to inflate it. The check uses request origin only and stores no IP.
  if (!isSameSiteRequest(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const pending = getClient();
    if (!pending) return NextResponse.json({ count: null });
    const client = await pending;
    const count = await client.incr(KEY);
    return NextResponse.json({ count });
  } catch {
    clientPromise = null;
    return NextResponse.json({ count: null });
  }
}
