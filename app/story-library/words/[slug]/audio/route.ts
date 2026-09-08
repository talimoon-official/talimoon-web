/**
 * Same-origin proxy for a PUBLISHED memory's voice recording. Served only
 * when the family's publication consent scope included audio (the intake
 * endpoint enforces that and returns 404 otherwise). Range passthrough for
 * seeking; never cached; never the storage URL.
 */

import { PUBLIC_SLUG_RE } from "@/lib/memory/api";

export const dynamic = "force-dynamic";

function intakeBase(): string {
  const base = process.env.INTAKE_API_URL ?? process.env.NEXT_PUBLIC_INTAKE_API_URL ?? "";
  return base.replace(/\/+$/, "");
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await ctx.params;
  const base = intakeBase();
  if (!base || !PUBLIC_SLUG_RE.test(slug)) return new Response(null, { status: 404 });

  const range = req.headers.get("range");
  let upstream: Response;
  try {
    upstream = await fetch(`${base}/v1/m/public/${encodeURIComponent(slug)}/audio`, {
      headers: range ? { range } : undefined,
      cache: "no-store",
    });
  } catch {
    return new Response(null, { status: 502 });
  }
  if (upstream.status === 404) return new Response(null, { status: 404 });
  if (!upstream.ok && upstream.status !== 206) return new Response(null, { status: 502 });

  const headers = new Headers();
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set("Cache-Control", "public, max-age=300");
  return new Response(upstream.body, { status: upstream.status, headers });
}
