/**
 * The Personalized Book form's persistent draft — WHAT is kept, and how it
 * is read back safely. Storage + versioning live in lib/order/formDraft.ts.
 *
 * Field audit (FormData + flow position):
 *
 *   SAFE TO PERSIST — ordinary answers / navigation
 *     market, bookType, recipientRelationship, children[] answers (interests,
 *     activity, dream/hope, qualities, growth behaviours, values, ages,
 *     genders, relationships, done flags), keepsake choices
 *     (storyGiverPresentedAs, keepsakeRelationship, storyGiverCustomLabel,
 *     keepsakeWantsVoice), wantsCharacters, bookLanguageCode, copies,
 *     phase / stepIndex / sub-screen position, marketTouched.
 *
 *   SENSITIVE BUT NECESSARY FOR RECOVERY — personal data the customer would
 *   otherwise have to re-enter / re-upload. Kept only on this device, only
 *   until the order is sent (or a new order is started):
 *     answers record, 7 days after the last activity —
 *       orderer name + honorific, phone, delivery address (+ map pin),
 *       child names, storyGiverDisplayName, personalMessage, each child's
 *       private emotional context (emotionalBridge), additional
 *       characters' names/relations, and a MANIFEST of which files existed
 *       (counts / flags only);
 *     media record, 48 hours after the last activity —
 *       child + character photos, the keepsake photo, the voice note
 *       (+ duration). Past 48h the answers still restore, and exactly the
 *       expired files are asked for again (MediaGap).
 *
 *   NEVER PERSISTED
 *     consentAuthority / consentPrivacy / consentTerms and the drawn
 *     signature — consent is given fresh at the moment of sending, never
 *     replayed from storage; giftFrom (unused legacy field). And, not part
 *     of FormData at all but listed for the record: the order capability
 *     token + upload progress (orderSessionRef), the idempotency key, the
 *     Turnstile token, the resume/payment token, the payment code and
 *     anything after a successful submit (the draft is deleted then).
 */

import type { FormData } from "./PersonalizedBookOrderForm";
import type { BookType } from "./orderFormData";
import { MAX_MAIN_CHILDREN } from "@/lib/order/types";
import { clearDraft, readDraft, writeDraft, writeDraftMedia } from "@/lib/order/formDraft";
import type { SubPosition } from "./flowPosition";

export type FormPhase = "intro" | "world" | "character" | "heart" | "steps";
const PHASES: readonly FormPhase[] = ["intro", "world", "character", "heart", "steps"];

/** The fields that are NEVER written (see the audit above). */
export const NEVER_PERSISTED = [
  "consentAuthority",
  "consentPrivacy",
  "consentTerms",
  "consentDrawnSignature",
  "giftFrom",
] as const satisfies readonly (keyof FormData)[];

type NeverPersisted = (typeof NEVER_PERSISTED)[number];
export type PersistedFormData = Omit<FormData, NeverPersisted>;

/** The files, stored in their OWN record (48h retention), keyed by the
 *  stable child / character id — never by array position. */
export interface OrderDraftMedia {
  children: Record<string, File[]>;
  characters: Record<string, File[]>;
  specialPhoto: File | null;
  finalVoice: File | null;
  finalVoiceDurationSec: number | null;
}

/** What files existed, kept WITH the answers (7 days), so that once the media
 *  has expired the form can say exactly which files to add again. Counts and
 *  flags only — never file contents or names. */
export interface MediaManifest {
  children: Record<string, number>;
  characters: Record<string, number>;
  specialPhoto: boolean;
  finalVoice: boolean;
}

/** One file slot that must be added again after the media expired. */
export type MediaGap =
  | { kind: "child"; id: string; name: string; count: number }
  | { kind: "character"; id: string; name: string; count: number }
  | { kind: "special" }
  | { kind: "voice" };

export interface OrderDraft {
  bookType: BookType;
  /** the answers — with every file slot EMPTY (files live in the media record) */
  data: PersistedFormData;
  phase: FormPhase;
  stepIndex: number;
  marketTouched: boolean;
  /** Phase 01 has completed (data.children etc. are real answers). */
  phase01Seeded: boolean;
  /** Phase 01's own in-progress answers (it only hands them to the form
   *  when it completes). Opaque here; Phase01 validates it. */
  phase01?: unknown;
  /** Sub-screen inside the current per-child phase. */
  pos?: SubPosition;
  media?: MediaManifest;
}

const FLOW = "personalized-book" as const;

/** The explicit allowlist: FormData minus NEVER_PERSISTED. */
export function toPersisted(data: FormData): PersistedFormData {
  const copy: Partial<FormData> = { ...data };
  for (const k of NEVER_PERSISTED) delete copy[k];
  return copy as PersistedFormData;
}

/** Splits the answers from the files: answers (file slots emptied), the
 *  media record, and the manifest of what existed. */
export function splitMedia(data: PersistedFormData): {
  text: PersistedFormData;
  media: OrderDraftMedia;
  manifest: MediaManifest;
} {
  const media: OrderDraftMedia = {
    children: {},
    characters: {},
    specialPhoto: data.specialPhoto ?? null,
    finalVoice: data.finalVoice ?? null,
    finalVoiceDurationSec: data.finalVoice ? (data.finalVoiceDurationSec ?? null) : null,
  };
  const manifest: MediaManifest = {
    children: {},
    characters: {},
    specialPhoto: media.specialPhoto != null,
    finalVoice: media.finalVoice != null,
  };
  for (const c of data.children) {
    const photos = c.photos ?? [];
    if (photos.length) {
      media.children[c.id] = photos;
      manifest.children[c.id] = photos.length;
    }
  }
  for (const c of data.additionalCharacters) {
    if (c.photos.length) {
      media.characters[c.id] = c.photos;
      manifest.characters[c.id] = c.photos.length;
    }
  }
  const text: PersistedFormData = {
    ...data,
    children: data.children.map((c) => ({ ...c, photos: [] })),
    additionalCharacters: data.additionalCharacters.map((c) => ({ ...c, photos: [] })),
    specialPhoto: null,
    finalVoice: null,
    finalVoiceDurationSec: null,
  };
  return { text, media, manifest };
}

function mediaIsEmpty(m: OrderDraftMedia): boolean {
  return (
    !m.specialPhoto &&
    !m.finalVoice &&
    Object.keys(m.children).length === 0 &&
    Object.keys(m.characters).length === 0
  );
}

/** Identity of the stored files — the same File objects mean no rewrite. */
function mediaRefs(m: OrderDraftMedia): unknown[] {
  const refs: unknown[] = [m.specialPhoto, m.finalVoice, m.finalVoiceDurationSec];
  for (const k of Object.keys(m.children).sort()) refs.push(k, ...m.children[k]!);
  for (const k of Object.keys(m.characters).sort()) refs.push(k, ...m.characters[k]!);
  return refs;
}
const sameRefs = (a: unknown[] | null, b: unknown[]) =>
  a != null && a.length === b.length && a.every((x, i) => x === b[i]);

// ── safe read-back ───────────────────────────────────────────────────────────

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isBlob = (v: unknown): v is File => typeof Blob !== "undefined" && v instanceof Blob;
const blobs = (v: unknown): File[] => (Array.isArray(v) ? v.filter(isBlob) : []);

/** Merge a stored scalar over its default only when the type matches. */
function sameType<T>(stored: unknown, fallback: T): T {
  if (fallback === null) return (stored ?? null) as T;
  return typeof stored === typeof fallback ? (stored as T) : fallback;
}

function readMedia(raw: unknown): OrderDraftMedia {
  const m = isObj(raw) ? raw : {};
  const map = (v: unknown) =>
    Object.fromEntries(Object.entries(isObj(v) ? v : {}).map(([k, files]) => [k, blobs(files)]));
  return {
    children: map(m.children),
    characters: map(m.characters),
    specialPhoto: isBlob(m.specialPhoto) ? m.specialPhoto : null,
    finalVoice: isBlob(m.finalVoice) ? m.finalVoice : null,
    finalVoiceDurationSec: typeof m.finalVoiceDurationSec === "number" ? m.finalVoiceDurationSec : null,
  };
}

function readManifest(raw: unknown): MediaManifest {
  const m = isObj(raw) ? raw : {};
  const counts = (v: unknown) =>
    Object.fromEntries(
      Object.entries(isObj(v) ? v : {}).filter((e): e is [string, number] => typeof e[1] === "number" && e[1] > 0),
    );
  return {
    children: counts(m.children),
    characters: counts(m.characters),
    specialPhoto: m.specialPhoto === true,
    finalVoice: m.finalVoice === true,
  };
}

export type RestoredOrderDraft = Omit<OrderDraft, "data" | "media"> & {
  data: FormData;
  /** files the customer had added that are no longer here (48h retention
   *  passed, or storage refused them) — only these need adding again */
  mediaGaps: MediaGap[];
};

/**
 * Rebuilds FormData from the stored answers (+ the media record, when still
 * within its 48 hours) over a fresh `base`. Anything missing or mistyped
 * falls back to the base value; never-persisted fields always come from the
 * base (unticked, unsigned). Missing media never blocks a restore: the
 * answers and position come back, and `mediaGaps` lists what to re-add.
 * Returns null when the answers record cannot be trusted at all.
 */
export function restoreOrderDraft(
  raw: unknown,
  base: FormData,
  stepCount: number,
  rawMedia?: unknown,
): RestoredOrderDraft | null {
  try {
    if (!isObj(raw) || !isObj(raw.data)) return null;
    const d = raw.data;
    if (!Array.isArray(d.children) || d.children.length === 0) return null;
    const phase01Seeded = raw.phase01Seeded === true;
    const media = readMedia(rawMedia);
    const manifest = readManifest(raw.media);

    const children = d.children
      .slice(0, MAX_MAIN_CHILDREN)
      .filter((c): c is Record<string, unknown> => isObj(c) && typeof c.id === "string" && typeof c.name === "string")
      .map((c) => ({ ...c, photos: media.children[c.id as string] ?? [] }) as unknown as FormData["children"][number]);
    if (children.length === 0) return null;

    const characters = Array.isArray(d.additionalCharacters)
      ? d.additionalCharacters
          .filter((c): c is Record<string, unknown> => isObj(c) && typeof c.id === "string")
          .map((c) => ({
            id: c.id as string,
            relation: typeof c.relation === "string" ? c.relation : "",
            name: typeof c.name === "string" ? c.name : "",
            photos: media.characters[c.id as string] ?? [],
          }))
      : [];

    const o = isObj(d.orderer) ? d.orderer : {};
    const addr = isObj(o.deliveryAddress) ? o.deliveryAddress : {};
    const data: FormData = {
      ...base,
      orderer: {
        ...base.orderer,
        honorific: typeof o.honorific === "string" ? (o.honorific as FormData["orderer"]["honorific"]) : null,
        name: sameType(o.name, base.orderer.name),
        phone: sameType(o.phone, base.orderer.phone),
        deliveryAddress: { ...base.orderer.deliveryAddress, ...(addr as object) },
      },
      recipientRelationship: isObj(d.recipientRelationship) && typeof d.recipientRelationship.type === "string"
        ? (d.recipientRelationship as unknown as FormData["recipientRelationship"])
        : base.recipientRelationship,
      market: d.market === "UZ" || d.market === "INTERNATIONAL" ? d.market : base.market,
      bookType: d.bookType === "single" || d.bookType === "multi" ? d.bookType : base.bookType,
      children,
      interests: sameType(d.interests, base.interests),
      dreams: sameType(d.dreams, base.dreams),
      traits: Array.isArray(d.traits) ? (d.traits as FormData["traits"]) : base.traits,
      weaknesses: sameType(d.weaknesses, base.weaknesses),
      extraInfo: sameType(d.extraInfo, base.extraInfo),
      personalMessage: sameType(d.personalMessage, base.personalMessage),
      storyGiverPresentedAs: d.storyGiverPresentedAs === "other_person" ? "other_person" : "self",
      keepsakeRelationship: sameType(d.keepsakeRelationship, base.keepsakeRelationship) as FormData["keepsakeRelationship"],
      storyGiverCustomLabel: sameType(d.storyGiverCustomLabel, base.storyGiverCustomLabel),
      storyGiverDisplayName: sameType(d.storyGiverDisplayName, base.storyGiverDisplayName),
      keepsakeWantsVoice: typeof d.keepsakeWantsVoice === "boolean" ? d.keepsakeWantsVoice : null,
      finalVoice: media.finalVoice,
      finalVoiceDurationSec: media.finalVoice ? media.finalVoiceDurationSec : null,
      wantsCharacters: d.wantsCharacters === true,
      additionalCharacters: characters,
      specialPhoto: media.specialPhoto,
      bookLanguageCode: sameType(d.bookLanguageCode, base.bookLanguageCode) as FormData["bookLanguageCode"],
      copies: typeof d.copies === "number" && d.copies >= 1 ? d.copies : base.copies,
      // consent + signature: ALWAYS fresh
      consentAuthority: false,
      consentPrivacy: false,
      consentTerms: false,
      consentDrawnSignature: "",
      giftFrom: base.giftFrom,
    };

    // Which files the customer had, that are no longer here.
    const mediaGaps: MediaGap[] = [];
    for (const c of children) {
      const had = manifest.children[c.id] ?? 0;
      if (had > (c.photos?.length ?? 0)) mediaGaps.push({ kind: "child", id: c.id, name: c.name, count: had });
    }
    if (data.wantsCharacters) {
      for (const c of characters) {
        const had = manifest.characters[c.id] ?? 0;
        if (had > c.photos.length) mediaGaps.push({ kind: "character", id: c.id, name: c.name, count: had });
      }
    }
    if (manifest.specialPhoto && !data.specialPhoto) mediaGaps.push({ kind: "special" });
    if (manifest.finalVoice && !data.finalVoice && data.keepsakeWantsVoice === true) mediaGaps.push({ kind: "voice" });

    // a draft that never completed Phase 01 can only live in Phase 01
    const phase =
      phase01Seeded && PHASES.includes(raw.phase as FormPhase) ? (raw.phase as FormPhase) : "intro";
    const stepIndex =
      typeof raw.stepIndex === "number" && Number.isInteger(raw.stepIndex)
        ? Math.min(Math.max(raw.stepIndex, 0), stepCount - 1)
        : 0;
    const pos =
      isObj(raw.pos) && typeof raw.pos.idx === "number" && typeof raw.pos.screen === "string"
        ? { idx: Math.min(Math.max(Math.trunc(raw.pos.idx), 0), children.length - 1), screen: raw.pos.screen }
        : undefined;
    const bookType = raw.bookType === "multi" ? "multi" : "single";
    return {
      bookType,
      data,
      phase,
      stepIndex,
      marketTouched: raw.marketTouched === true,
      phase01Seeded,
      phase01: raw.phase01,
      pos,
      mediaGaps,
    };
  } catch {
    return null;
  }
}

/** Is this gap still open against the CURRENT answers? (Re-adding the
 *  files — or switching the voice off — closes it.) */
export function gapIsOpen(g: MediaGap, data: FormData): boolean {
  switch (g.kind) {
    case "child":
      return (data.children.find((c) => c.id === g.id)?.photos?.length ?? 0) === 0;
    case "character":
      return (
        data.wantsCharacters &&
        (data.additionalCharacters.find((c) => c.id === g.id)?.photos.length ?? -1) === 0
      );
    case "special":
      return data.specialPhoto == null;
    case "voice":
      return data.keepsakeWantsVoice === true && data.finalVoice == null;
  }
}

// ── read / write / clear ─────────────────────────────────────────────────────

export interface LoadedOrderDraft {
  payload: unknown;
  media: unknown;
}

export async function loadOrderDraft(): Promise<LoadedOrderDraft | undefined> {
  const r = await readDraft<unknown, unknown>(FLOW).catch(() => undefined);
  return r ? { payload: r.payload, media: r.media } : undefined;
}

/** Deletes the answers AND all stored media. */
export function clearOrderDraft(): Promise<void> {
  return clearDraft(FLOW);
}

/**
 * Debounced writer. Many edits → one write after `delayMs` of quiet; `flush`
 * writes the pending one now (page hidden / leaving). The answers are
 * rewritten each time (refreshing the retention clock); the media record
 * only when the files actually changed. Writes run one at a time, in order.
 * `seal` cancels anything pending, blocks every later write and deletes
 * answers + media — used the moment the order is saved (and when the
 * customer starts a new order), so a late debounce can never resurrect it.
 */
export function createDraftSaver(delayMs = 800) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: OrderDraft | null = null;
  let sealed = false;
  let lastMedia: unknown[] | null = null;
  let queue: Promise<void> = Promise.resolve();

  async function write(d: OrderDraft) {
    if (sealed) return;
    const { text, media, manifest } = splitMedia(toPersisted(d.data as FormData));
    try {
      await writeDraft(FLOW, { ...d, data: text, media: manifest } satisfies OrderDraft);
    } catch {
      return; // storage unavailable — the form keeps working in memory
    }
    if (sealed) return;
    const refs = mediaRefs(media);
    if (sameRefs(lastMedia, refs)) return;
    try {
      await writeDraftMedia(FLOW, mediaIsEmpty(media) ? null : media);
      lastMedia = refs;
    } catch {
      // Quota exceeded (many large photos): keep the answers, drop the
      // media record. The manifest still says what existed, so a restore
      // asks for exactly those files again.
      await writeDraftMedia(FLOW, null).catch(() => {});
      lastMedia = null;
    }
  }
  const enqueue = (d: OrderDraft) => {
    queue = queue.then(() => write(d)).catch(() => {});
    return queue;
  };

  return {
    /** the files a restored draft already has on disk — no rewrite needed */
    seedMedia(data: FormData) {
      lastMedia = mediaRefs(splitMedia(toPersisted(data)).media);
    },
    schedule(d: OrderDraft) {
      if (sealed) return;
      pending = d;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const p = pending;
        pending = null;
        if (p && !sealed) void enqueue(p);
      }, delayMs);
    },
    flush() {
      clearTimeout(timer);
      const p = pending;
      pending = null;
      if (p && !sealed) void enqueue(p);
    },
    /** order saved: stop for good and delete answers + media */
    async seal(): Promise<void> {
      sealed = true;
      clearTimeout(timer);
      pending = null;
      await queue; // let an in-flight write land first, then delete it
      await clearOrderDraft();
    },
  };
}
