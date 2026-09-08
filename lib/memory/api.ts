/**
 * Server-only client for the talimoon-intake private Voice Memory endpoints.
 *
 * Every function here runs on the server (React Server Components / route
 * handlers). The permanent Memory token in `/m/<token>` is the capability —
 * it is forwarded to the intake service over the server-to-server call and
 * never exposed to any third party. Nothing here is cached.
 *
 * See talimoon-intake src/http/routes/memories.ts for the authoritative
 * response shapes.
 *
 * This module must only be imported from server components / route handlers.
 * (`server-only` is not a dependency here, so the boundary is by convention +
 * review, not a build-time guard.)
 */

export const MEMORY_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
export const PUBLIC_SLUG_RE = /^[a-z0-9]{1,16}$/;

function intakeBase(): string {
  const base =
    process.env.INTAKE_API_URL ?? process.env.NEXT_PUBLIC_INTAKE_API_URL ?? "";
  if (!base) throw new Error("INTAKE_API_URL / NEXT_PUBLIC_INTAKE_API_URL is not configured");
  return base.replace(/\/+$/, "");
}

export interface PrivateMemory {
  storyGiver: {
    displayName: string;
    relationshipType: string;
    customLabel: string | null;
    presentedAs: string;
  };
  childFirstName: string;
  message: string;
  hasAudio: boolean;
  audioDurationSec: number | null;
  createdAtISO: string;
  publicationState: "private" | "consent-pending" | "public" | "revoked";
}

export interface PublicMemory {
  slug: string;
  storyGiverDisplayName: string | null;
  relationshipType: string | null;
  childFirstName: string | null;
  message: string | null;
  hasAudio: boolean;
  audioDurationSec: number | null;
  publishedAtISO: string | null;
}

export interface ConsentReview {
  orderDelivered: boolean;
  alreadyPublic: boolean;
  policyVersion: string;
  preview: {
    storyGiverDisplayName: string;
    relationshipType: string;
    childFirstName: string;
    message: string;
    hasAudio: boolean;
    audioDurationSec: number | null;
  };
  suggestedScope: PublicationScope;
}

export interface PublicationScope {
  finalPage: boolean;
  audio: boolean;
  message: boolean;
  speakerDisplayName: boolean;
  relationship: boolean;
  childFirstName: boolean;
  childPhoto: boolean;
}

async function getJson<T>(path: string): Promise<T | null> {
  const res = await fetch(`${intakeBase()}${path}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`intake ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

export function getPrivateMemory(token: string): Promise<PrivateMemory | null> {
  if (!MEMORY_TOKEN_RE.test(token)) return Promise.resolve(null);
  return getJson<PrivateMemory>(`/v1/m/${token}`);
}

export function listPublicMemories(): Promise<PublicMemory[]> {
  return getJson<{ items: PublicMemory[] }>(`/v1/m/public`).then((r) => r?.items ?? []);
}

export function getPublicMemory(slug: string): Promise<PublicMemory | null> {
  if (!PUBLIC_SLUG_RE.test(slug)) return Promise.resolve(null);
  return getJson<PublicMemory>(`/v1/m/public/${slug}`);
}

export function getConsentReview(token: string): Promise<ConsentReview | null> {
  if (!MEMORY_TOKEN_RE.test(token)) return Promise.resolve(null);
  return getJson<ConsentReview>(`/v1/m/consent/${token}`);
}

export async function submitPublicationConsent(
  token: string,
  scope: PublicationScope,
): Promise<{ ok: boolean; status: number; slug?: string }> {
  const res = await fetch(`${intakeBase()}/v1/m/consent/${token}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ agree: true, scope }),
  });
  if (!res.ok) return { ok: false, status: res.status };
  const body = (await res.json()) as { slug?: string };
  return { ok: true, status: res.status, slug: body.slug };
}
