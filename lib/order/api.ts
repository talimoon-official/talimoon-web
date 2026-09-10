/**
 * talimoon-intake API client — the order-intake service's real HTTP
 * contract (POST /v1/orders, POST /v1/orders/:code/files, POST
 * /v1/orders/:code/finalize). See talimoon-intake's src/validation/schemas.ts
 * and src/http/routes/orders.ts for the authoritative shapes; this file
 * mirrors them deliberately narrowly rather than guessing.
 *
 * Security:
 *  - The capability token is only ever placed in an Authorization header on
 *    an outgoing request. It is never logged, never put in a query string,
 *    never persisted (caller decides where to hold it in memory).
 *  - The Turnstile token travels in the JSON body (`turnstileToken`), not a
 *    custom header — the API's CORS `allowedHeaders` does not include
 *    `cf-turnstile-response`, so a header would be blocked by the browser's
 *    preflight before it ever reached the server.
 */

import {
  isKeepsakeRelationship,
  type KeepsakeRelationship,
} from "@/lib/order/keepsakeRelationship";

const API_BASE = process.env.NEXT_PUBLIC_INTAKE_API_URL;

export type ArtifactKind =
  | "child_photo"
  | "special_photo"
  | "character_photo"
  | "receipt"
  | "final_voice";

/**
 * The STORY GIVER — the book-facing identity the personalized book is
 * presented FROM, to the child. NOT necessarily the orderer: a parent,
 * grandparent, aunt/uncle, sibling, family friend, etc. Mirrors
 * talimoon-intake's `storyGiverSchema`.
 *
 *  - `relationshipType` reuses the order relationship taxonomy.
 *  - `customLabel` only for `relationshipType: "other"`.
 *  - `displayName` is a GIVEN name only (no surname) — what the child sees.
 *  - `presentedAs`: `self` = the orderer IS the story giver; `other_person` =
 *    the orderer is arranging the book on someone else's behalf.
 */
export interface StoryGiverPayload {
  relationshipType: RelationshipPayload["type"];
  /**
   * The NEW fine-grained, child-relative canonical keepsake relationship
   * ("Esdalik sahifasi"). Optional in the contract for legacy / bot
   * channels; the website always sends it. `relationshipType` above stays
   * the coarse legacy bucket (a deterministic downcast of this), never
   * reinterpreted. See `lib/order/keepsakeRelationship.ts`.
   */
  keepsakeRelationship?: KeepsakeRelationship;
  customLabel?: string;
  displayName: string;
  presentedAs: "self" | "other_person";
  /** the customer's explicit "record it in your own voice?" answer */
  voiceRequested?: boolean;
}

/**
 * The orderer's relationship to a child, sent exactly as collected in
 * Phase 01 — a structured `type` plus, only for `"other"`, the orderer's
 * own words. Never a rendered label: the Story Profile localises it, and
 * the archive keeps the structured value. Mirrors
 * `RecipientRelationship` in lib/order/relationship.ts.
 */
export interface RelationshipPayload {
  type: "parent" | "grandparent" | "aunt-uncle" | "sibling" | "friend-child" | "other";
  customLabel?: string;
}

/**
 * The customer-selected delivery pin. STRUCTURED coordinates are the
 * contract — `formattedAddress` is a bonus label, never a substitute, and
 * lat/lng are never inferred from an address. Mirrors talimoon-intake's
 * `submitOrderSchema.delivery.location`. Complementary to `addressText`.
 */
export interface DeliveryLocationPayload {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: "device" | "map";
  formattedAddress?: string;
  confirmedByCustomer: true;
}

/** Book languages accepted by the TALIMOON order intake. */
export type BackendBookLanguage = "uz" | "ru" | "en" | "kk" | "ky" | "tg" | "ar";

const BACKEND_BOOK_LANGUAGES: readonly BackendBookLanguage[] = [
  "uz",
  "ru",
  "en",
  "kk",
  "ky",
  "tg",
  "ar",
];

export function isBackendBookLanguage(code: string): code is BackendBookLanguage {
  return (BACKEND_BOOK_LANGUAGES as readonly string[]).includes(code);
}

export interface SubmitOrderPayload {
  channel: "W";
  idempotencyKey: string;
  market: "UZ" | "INTERNATIONAL";
  bookType: "single" | "multi";
  copies: number;
  delivery: {
    required: boolean;
    regionCode?: string;
    countryCode?: string;
    location?: DeliveryLocationPayload;
  };
  clientDeclaredTotal?: number;
  declaredArtifacts: Array<{ kind: ArtifactKind; count: number }>;
  consent: {
    schema: "talimoon-order-consent-v1";
    acceptedAt: string;
    locale: "uz" | "en" | "ru";
    /** the orderer's typed full name — the signature of record */
    electronicSignature: string;
    /** the customer's ACTUAL drawn signature (canonical logical stroke JSON),
     *  kept separate from the typed identity (spec §3) */
    drawnSignature: string;
    adultAndChildAuthority: true;
    privacyAccepted: true;
    privacyVersion: string;
    termsAccepted: true;
    termsVersion: string;
    /** which immutable server-side contract template the accepted consent
     *  text corresponds to; the backend fails closed on an unknown value */
    contractTemplateVersion: string;
    marketingConsent: false;
  };
  profile: {
    orderer: { fullName: string; phone: string };
    addressText?: string;
    /** The orderer's relationship to the child(ren) — the single type
     *  chosen in Phase 01 for the whole order. Per-child overrides live
     *  on `children[i].relationship` for mixed families. */
    recipientRelationship?: RelationshipPayload;
    children: Array<{
      name: string;
      age?: number;
      /** THIS child's relationship to the orderer. Equals
       *  `recipientRelationship` for a single-type order; independent
       *  per child when Phase 01 collected 2–3 types. */
      relationship?: RelationshipPayload;
      /** Per-child structured Story Profile text, serialised from the
       *  Phase 02 / Phase 03 answers on `ChildProfile` (see
       *  lib/order/profileText.ts). Omitted when the customer left that
       *  section blank — the renderer then shows "taqdim etilmagan". */
      interests?: string;
      dreams?: string;
      strengths?: string;
      growthAreas?: string;
    }>;
    interests?: string;
    dreams?: string;
    traits?: string[];
    weaknesses?: string;
    extraInfo?: string;
    giftFrom?: string;
    personalMessage?: string;
    extraCharacters?: string;
    bookLanguage: BackendBookLanguage;
    notes?: string;
    /** Present ONLY for a personalized book with a final page. When set, the
     *  backend also requires `personalMessage` (the written words) and a
     *  declared `special_photo` (the child + story giver closing photo). */
    storyGiver?: StoryGiverPayload;
  };
  turnstileToken: string;
}

export interface SubmitOrderResult {
  orderCode: string;
  status: string;
  paymentStatus: string;
  capabilityToken: string;
  capabilityExpiresAt: string;
  childSlots: Array<{ childRef: string }>;
  price: { currency: string; grandTotal: number; text: string };
}

export interface BuildSubmitPayloadArgs {
  idempotencyKey: string;
  turnstileToken: string;
  market: "UZ" | "INTERNATIONAL";
  bookType: "single" | "multi";
  copies: number;
  deliveryRequired: boolean;
  regionCode?: string;
  countryCode?: string;
  /** The customer's confirmed delivery pin, when they set one. */
  deliveryLocation?: DeliveryLocationPayload;
  clientDeclaredTotal?: number;
  declaredArtifacts: {
    childPhotoCount: number;
    wantsSpecialPhoto: boolean;
    characterPhotoCount: number;
    hasReceipt: boolean;
    /** the story giver added a voice note to the final page */
    hasFinalVoice?: boolean;
  };
  /** book-facing identity for the personalized final page (Voice Memory) */
  storyGiver?: StoryGiverPayload;
  orderer: { fullName: string; phone: string };
  addressText?: string;
  recipientRelationship?: RelationshipPayload;
  children: Array<{
    name: string;
    age: number | null;
    relationship?: RelationshipPayload;
    interests?: string;
    dreams?: string;
    strengths?: string;
    growthAreas?: string;
  }>;
  interests?: string;
  dreams?: string;
  traits?: string[];
  weaknesses?: string;
  extraInfo?: string;
  giftFrom?: string;
  personalMessage?: string;
  extraCharacters?: string;
  bookLanguage: BackendBookLanguage;
  consent: SubmitOrderPayload["consent"];
  notes?: string;
}

/** Keep only the structured relationship shape the contract carries —
 *  `type` plus a trimmed `customLabel` (dropped unless non-empty and the
 *  type is "other"). Returns `undefined` for a missing/blank relationship
 *  so the payload omits the key entirely. */
function relationshipForPayload(
  rel: RelationshipPayload | undefined,
): RelationshipPayload | undefined {
  if (!rel?.type) return undefined;
  const customLabel =
    rel.type === "other" ? (rel.customLabel ?? "").trim() || undefined : undefined;
  return customLabel ? { type: rel.type, customLabel } : { type: rel.type };
}

/** Pure — no I/O. Builds the exact `POST /v1/orders` body from wizard state. */
export function buildSubmitPayload(args: BuildSubmitPayloadArgs): SubmitOrderPayload {
  const declaredArtifacts: SubmitOrderPayload["declaredArtifacts"] = [];
  if (args.declaredArtifacts.childPhotoCount > 0) {
    declaredArtifacts.push({ kind: "child_photo", count: args.declaredArtifacts.childPhotoCount });
  }
  if (args.declaredArtifacts.wantsSpecialPhoto) {
    declaredArtifacts.push({ kind: "special_photo", count: 1 });
  }
  if (args.declaredArtifacts.characterPhotoCount > 0) {
    declaredArtifacts.push({ kind: "character_photo", count: args.declaredArtifacts.characterPhotoCount });
  }
  if (args.declaredArtifacts.hasReceipt) {
    declaredArtifacts.push({ kind: "receipt", count: 1 });
  }
  if (args.declaredArtifacts.hasFinalVoice) {
    declaredArtifacts.push({ kind: "final_voice", count: 1 });
  }

  return {
    channel: "W",
    idempotencyKey: args.idempotencyKey,
    market: args.market,
    bookType: args.bookType,
    copies: args.copies,
    delivery: {
      required: args.deliveryRequired,
      regionCode: args.regionCode,
      countryCode: args.countryCode,
      // The pin, exactly as the customer confirmed it. Only ever attached
      // for a delivery order; a written address is still required and is
      // never replaced by this.
      location:
        args.deliveryRequired && args.deliveryLocation
          ? args.deliveryLocation
          : undefined,
    },
    clientDeclaredTotal: args.clientDeclaredTotal,
    declaredArtifacts,
    consent: args.consent,
    profile: {
      orderer: args.orderer,
      addressText: args.addressText,
      recipientRelationship: relationshipForPayload(args.recipientRelationship),
      children: args.children.map((c) => ({
        name: c.name,
        age: c.age ?? undefined,
        relationship: relationshipForPayload(c.relationship),
        interests: c.interests || undefined,
        dreams: c.dreams || undefined,
        strengths: c.strengths || undefined,
        growthAreas: c.growthAreas || undefined,
      })),
      interests: args.interests,
      dreams: args.dreams,
      traits: args.traits,
      weaknesses: args.weaknesses,
      extraInfo: args.extraInfo,
      giftFrom: args.giftFrom,
      personalMessage: args.personalMessage,
      extraCharacters: args.extraCharacters,
      bookLanguage: args.bookLanguage,
      notes: args.notes,
      storyGiver: storyGiverForPayload(args.storyGiver),
    },
    turnstileToken: args.turnstileToken,
  };
}

/** Keep only the structured story-giver shape the contract carries. Drops a
 *  `customLabel` unless the relationship is "other" and it is non-empty.
 *  Returns `undefined` (payload omits the key) when there is no usable
 *  displayName. The fine-grained `keepsakeRelationship` is passed through
 *  when valid; `voiceRequested` only when it is an explicit boolean. */
function storyGiverForPayload(sg: StoryGiverPayload | undefined): StoryGiverPayload | undefined {
  const displayName = (sg?.displayName ?? "").trim();
  if (!sg || displayName.length === 0) return undefined;
  const isOther =
    sg.relationshipType === "other" || sg.keepsakeRelationship === "other";
  const customLabel = isOther ? (sg.customLabel ?? "").trim() || undefined : undefined;
  return {
    relationshipType: sg.relationshipType,
    displayName,
    presentedAs: sg.presentedAs,
    ...(isKeepsakeRelationship(sg.keepsakeRelationship)
      ? { keepsakeRelationship: sg.keepsakeRelationship }
      : {}),
    ...(customLabel ? { customLabel } : {}),
    ...(typeof sg.voiceRequested === "boolean" ? { voiceRequested: sg.voiceRequested } : {}),
  };
}

export interface ChildPhotoUploadTask {
  childIndex: number;
  photoIndex: number;
  childRef: string;
  file: File;
}

/**
 * Pure — decides exactly which child photos still need uploading, and to
 * which backend `childRef`. Matches `children[i]` to `childSlots[i]` by
 * array index only.
 *
 * That index correspondence is a PROVEN backend contract, not an
 * assumption: talimoon-intake's src/orders/service.ts builds `childSlots`
 * by mapping straight over the SAME `profile.children` array the caller
 * submitted — `childFolderNamesFor()` is `input.profile.children.map((c,
 * i) => ...)`, `dedupeNames()` is a same-length, order-preserving
 * `Array.prototype.map`, and the subfolder-creation loop that mints each
 * `childRef` walks that same ordered list with a plain `for...of`, pushing
 * to the result array in that exact order. `SubmitResult.childSlots` is
 * then `skeleton.childRefs.map((childRef) => ({ childRef }))` — index i in
 * equals index i out, at every step, with no sort/filter/reorder anywhere
 * in that path. So caller `children[i]` and response `childSlots[i]`
 * always describe the same submitted child, as long as the caller sends
 * `profile.children` in the same order as `children` here (buildSubmitPayload
 * does — it's a plain positional `.map()` too).
 *
 * A child with no matching slot (should never happen given that contract,
 * but never assumed here) is skipped rather than guessed at — no child
 * photo is ever uploaded without a real, matching childRef.
 */
export function planChildPhotoUploads(
  children: Array<{ photos: File[] }>,
  childSlots: Array<{ childRef: string }>,
  done: boolean[][],
): ChildPhotoUploadTask[] {
  const tasks: ChildPhotoUploadTask[] = [];
  for (let ci = 0; ci < children.length; ci++) {
    const childRef = childSlots[ci]?.childRef;
    if (!childRef) continue;
    const photos = children[ci].photos;
    for (let pi = 0; pi < photos.length; pi++) {
      if (done[ci]?.[pi]) continue;
      tasks.push({ childIndex: ci, photoIndex: pi, childRef, file: photos[pi] });
    }
  }
  return tasks;
}

export class IntakeApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "IntakeApiError";
  }
}

function apiUrl(path: string): string {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_INTAKE_API_URL is not configured");
  }
  return `${API_BASE}${path}`;
}

async function throwApiError(res: Response): Promise<never> {
  let code: string | undefined;
  try {
    const body = (await res.json()) as { error?: { code?: string } } | undefined;
    code = body?.error?.code;
  } catch {
    // non-JSON error body — fall through with just the status
  }
  throw new IntakeApiError(`talimoon-intake API responded ${res.status}`, res.status, code);
}

export async function submitOrder(payload: SubmitOrderPayload): Promise<SubmitOrderResult> {
  const res = await fetch(apiUrl("/v1/orders"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return throwApiError(res);
  return (await res.json()) as SubmitOrderResult;
}

export async function uploadFile(args: {
  orderCode: string;
  capabilityToken: string;
  kind: ArtifactKind;
  file: File;
  childRef?: string;
  /** kind=character_photo only — lets the backend name the stored file
   *  after this character instead of a generic number (e.g.
   *  "Singlisi_Madina_01.png"). Purely cosmetic metadata. */
  characterRole?: string;
  characterName?: string;
  /** kind=final_voice only — the client-measured recording length in seconds.
   *  UX hint only: the intake service reads the real duration from the bytes
   *  and enforces the 120s limit itself. */
  durationSec?: number;
}): Promise<void> {
  const qs = new URLSearchParams({ kind: args.kind });
  if (args.childRef) qs.set("childRef", args.childRef);
  if (args.characterRole) qs.set("characterRole", args.characterRole);
  if (args.characterName) qs.set("characterName", args.characterName);
  if (typeof args.durationSec === "number" && Number.isFinite(args.durationSec)) {
    qs.set("durationSec", String(Math.max(1, Math.round(args.durationSec))));
  }
  const form = new FormData();
  form.append("file", args.file);
  const res = await fetch(apiUrl(`/v1/orders/${args.orderCode}/files?${qs.toString()}`), {
    method: "POST",
    headers: { authorization: `Bearer ${args.capabilityToken}` },
    body: form,
  });
  if (!res.ok) await throwApiError(res);
}

export async function finalizeOrder(args: {
  orderCode: string;
  capabilityToken: string;
  notify?: { customerName?: string; phone?: string };
}): Promise<{ orderCode: string; status: string; paymentStatus: string }> {
  const res = await fetch(apiUrl(`/v1/orders/${args.orderCode}/finalize`), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${args.capabilityToken}`,
    },
    body: JSON.stringify({ notify: args.notify }),
  });
  if (!res.ok) return throwApiError(res);
  return (await res.json()) as { orderCode: string; status: string; paymentStatus: string };
}
