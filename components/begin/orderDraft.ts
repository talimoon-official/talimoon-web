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
 *   SENSITIVE BUT NECESSARY FOR RECOVERY — personal text the customer
 *   would otherwise have to re-enter. Kept only on this device, only until
 *   the order is sent (or a new order is started), 7 days after the last
 *   activity: orderer name + honorific, phone, delivery address (+ map pin),
 *   child names, storyGiverDisplayName, personalMessage, each child's
 *   private emotional context (emotionalBridge), additional characters'
 *   names/relations, and a MANIFEST of which files existed (counts / flags
 *   only — used to word the "add these again" notice).
 *
 *   NEVER PERSISTED
 *     EVERY FILE: child + character photos, the keepsake photo, the voice
 *     note (+ its duration). Product rule: TEXT + CHOICES + PROGRESS
 *     persist, MEDIA never does. On a later resume the form reopens on the
 *     EARLIEST step whose required files are now missing (`resumeStepFor`),
 *     with every later answer still filled in.
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
import { STEPS, type StepId } from "./orderFormData";
import {
  additionalCharacterNamed,
  MAX_MAIN_CHILDREN,
  MIN_CHARACTER_PHOTOS,
  MIN_CHILD_PHOTOS,
} from "@/lib/order/types";
import { clearDraft, readDraft, writeDraft } from "@/lib/order/formDraft";
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

/** What files existed, kept WITH the answers, so that a resumed form can say
 *  exactly which files to add again. Counts and flags only — never file
 *  contents or names. */
export interface MediaManifest {
  children: Record<string, number>;
  characters: Record<string, number>;
  specialPhoto: boolean;
  finalVoice: boolean;
}

/**
 * A file slot the customer must fill again. `reason` "expired" (the default)
 * = files are never stored, so a resumed draft no longer has it; "unreadable" = the browser could no
 * longer read the selected file at submit time (it was removed from the
 * form). For photos, `expected` is the count the set needs to reach again —
 * absent = the whole set is missing.
 */
export type GapReason = "expired" | "unreadable";
export type MediaGap =
  | { kind: "child"; id: string; name: string; count: number; reason?: GapReason; expected?: number }
  | { kind: "character"; id: string; name: string; count: number; reason?: GapReason; expected?: number }
  | { kind: "special"; reason?: GapReason }
  | { kind: "voice"; reason?: GapReason };

export interface OrderDraft {
  bookType: BookType;
  /** the answers — with every file slot EMPTY (files are never stored) */
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

/** The answers with every file slot EMPTIED, plus the manifest of what
 *  existed. The files themselves are dropped — never stored. */
export function stripMedia(data: PersistedFormData): { text: PersistedFormData; manifest: MediaManifest } {
  const manifest: MediaManifest = {
    children: {},
    characters: {},
    specialPhoto: data.specialPhoto != null,
    finalVoice: data.finalVoice != null,
  };
  for (const c of data.children) {
    const n = c.photos?.length ?? 0;
    if (n) manifest.children[c.id] = n;
  }
  for (const c of data.additionalCharacters) {
    if (c.photos.length) manifest.characters[c.id] = c.photos.length;
  }
  const text: PersistedFormData = {
    ...data,
    children: data.children.map((c) => ({ ...c, photos: [] })),
    additionalCharacters: data.additionalCharacters.map((c) => ({ ...c, photos: [] })),
    specialPhoto: null,
    finalVoice: null,
    finalVoiceDurationSec: null,
  };
  return { text, manifest };
}

// ── safe read-back ───────────────────────────────────────────────────────────

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Merge a stored scalar over its default only when the type matches. */
function sameType<T>(stored: unknown, fallback: T): T {
  if (fallback === null) return (stored ?? null) as T;
  return typeof stored === typeof fallback ? (stored as T) : fallback;
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
  /** files the resumed form must ask for again (files are never stored) —
   *  only these, never a restart */
  mediaGaps: MediaGap[];
  /** the step the customer had reached, when `stepIndex` was moved EARLIER
   *  to a step whose required files are missing; undefined otherwise */
  savedStepIndex?: number;
};

/**
 * Rebuilds FormData from the stored answers over a fresh `base`. Anything missing or mistyped
 * falls back to the base value; never-persisted fields always come from the
 * base (unticked, unsigned). Every file slot comes back EMPTY (files are
 * never stored): the answers come back whole, the position is moved back to
 * the earliest step whose REQUIRED files are now missing (`resumeStepFor`),
 * and `mediaGaps` lists what to add again.
 * Returns null when the answers record cannot be trusted at all.
 */
export function restoreOrderDraft(
  raw: unknown,
  base: FormData,
  stepCount: number,
): RestoredOrderDraft | null {
  try {
    if (!isObj(raw) || !isObj(raw.data)) return null;
    const d = raw.data;
    if (!Array.isArray(d.children) || d.children.length === 0) return null;
    const phase01Seeded = raw.phase01Seeded === true;
    const manifest = readManifest(raw.media);

    const children = d.children
      .slice(0, MAX_MAIN_CHILDREN)
      .filter((c): c is Record<string, unknown> => isObj(c) && typeof c.id === "string" && typeof c.name === "string")
      .map((c) => ({ ...c, photos: [] }) as unknown as FormData["children"][number]);
    if (children.length === 0) return null;

    const characters = Array.isArray(d.additionalCharacters)
      ? d.additionalCharacters
          .filter((c): c is Record<string, unknown> => isObj(c) && typeof c.id === "string")
          .map((c) => ({
            id: c.id as string,
            relation: typeof c.relation === "string" ? c.relation : "",
            name: typeof c.name === "string" ? c.name : "",
            photos: [],
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
      finalVoice: null,
      finalVoiceDurationSec: null,
      wantsCharacters: d.wantsCharacters === true,
      additionalCharacters: characters,
      specialPhoto: null,
      bookLanguageCode: sameType(d.bookLanguageCode, base.bookLanguageCode) as FormData["bookLanguageCode"],
      copies: typeof d.copies === "number" && d.copies >= 1 ? d.copies : base.copies,
      // consent + signature: ALWAYS fresh
      consentAuthority: false,
      consentPrivacy: false,
      consentTerms: false,
      consentDrawnSignature: "",
      giftFrom: base.giftFrom,
    };

    // a draft that never completed Phase 01 can only live in Phase 01
    const phase =
      phase01Seeded && PHASES.includes(raw.phase as FormPhase) ? (raw.phase as FormPhase) : "intro";
    const stepIndex =
      typeof raw.stepIndex === "number" && Number.isInteger(raw.stepIndex)
        ? Math.min(Math.max(raw.stepIndex, 0), stepCount - 1)
        : 0;
    let pos =
      isObj(raw.pos) && typeof raw.pos.idx === "number" && typeof raw.pos.screen === "string"
        ? { idx: Math.min(Math.max(Math.trunc(raw.pos.idx), 0), children.length - 1), screen: raw.pos.screen }
        : undefined;
    // The last child's world→character bridge was removed; an older draft
    // parked on it reopens on that child's last real question.
    if (phase === "world" && pos?.screen === "child-done" && pos.idx === children.length - 1) {
      pos = { idx: pos.idx, screen: "dream" };
    }
    const bookType = raw.bookType === "multi" ? "multi" : "single";
    const resumeStep = phase === "steps" ? resumeStepFor(data, manifest, stepIndex) : stepIndex;
    return {
      bookType,
      data,
      phase,
      stepIndex: resumeStep,
      savedStepIndex: resumeStep < stepIndex ? stepIndex : undefined,
      marketTouched: raw.marketTouched === true,
      phase01Seeded,
      phase01: raw.phase01,
      pos,
      mediaGaps: phase === "steps" ? resumeGaps(data, manifest, stepIndex) : [],
    };
  } catch {
    return null;
  }
}

// ── required media + the resume step ─────────────────────────────────────────

/**
 * The files `stepId` REQUIRES that `data` does not hold — the same rules
 * that gate the step's "Davom etish" (isStepComplete), plus the voice note
 * when the customer chose one ("Ha") and had recorded it (manifest). Only
 * the required MINIMUM is asked for — never the extra photos above it, nor a
 * voice never recorded: optional media never pulls the customer back.
 */
export function requiredMediaGaps(stepId: StepId, data: FormData, manifest: MediaManifest): MediaGap[] {
  const gaps: MediaGap[] = [];
  if (stepId === "personal-touch") {
    if (data.specialPhoto == null) gaps.push({ kind: "special" });
    if (data.keepsakeWantsVoice === true && manifest.finalVoice && data.finalVoice == null) {
      gaps.push({ kind: "voice" });
    }
  } else if (stepId === "photos") {
    for (const c of data.children) {
      const have = c.photos?.length ?? 0;
      if (have < MIN_CHILD_PHOTOS) {
        gaps.push({ kind: "child", id: c.id, name: c.name, count: MIN_CHILD_PHOTOS - have, expected: MIN_CHILD_PHOTOS });
      }
    }
    if (data.wantsCharacters) {
      for (const c of data.additionalCharacters.filter(additionalCharacterNamed)) {
        if (c.photos.length < MIN_CHARACTER_PHOTOS) {
          const count = MIN_CHARACTER_PHOTOS - c.photos.length;
          gaps.push({ kind: "character", id: c.id, name: c.name, count, expected: MIN_CHARACTER_PHOTOS });
        }
      }
    }
  }
  return gaps;
}

/**
 * Where a resumed draft reopens inside the wizard steps: the EARLIEST step
 * BEFORE the saved one whose required files are missing (the customer passed
 * it, so they had added them — and files are never stored); otherwise the
 * saved step itself. Steps not yet reached never pull backward, and the
 * per-child phases hold no files. Every later answer stays in `data`, so
 * stepping forward again finds it all filled in; the next missing-media
 * step is then gated by its own "Davom etish" rule and inline notice.
 */
export function resumeStepFor(data: FormData, manifest: MediaManifest, savedStepIndex: number): number {
  for (let i = 0; i < savedStepIndex && i < STEPS.length; i++) {
    if (requiredMediaGaps(STEPS[i]!.id, data, manifest).length > 0) return i;
  }
  return savedStepIndex;
}

/**
 * What the resumed form asks for again: every required file of the steps
 * the customer had passed, plus, on the step they were on, only the files
 * the manifest says they had already added (an untouched upload slot is not
 * a "re-upload").
 */
export function resumeGaps(data: FormData, manifest: MediaManifest, savedStepIndex: number): MediaGap[] {
  const gaps: MediaGap[] = [];
  for (let i = 0; i <= savedStepIndex && i < STEPS.length; i++) {
    const step = requiredMediaGaps(STEPS[i]!.id, data, manifest);
    if (i < savedStepIndex) {
      gaps.push(...step);
      continue;
    }
    for (const g of step) {
      const had =
        g.kind === "child" ? (manifest.children[g.id] ?? 0) > 0
          : g.kind === "character" ? (manifest.characters[g.id] ?? 0) > 0
            : g.kind === "special" ? manifest.specialPhoto
              : manifest.finalVoice;
      if (had) gaps.push(g);
    }
  }
  return gaps;
}

/** Is this gap still open against the CURRENT answers? (Re-adding the
 *  files — or switching the voice off — closes it.) */
export function gapIsOpen(g: MediaGap, data: FormData): boolean {
  switch (g.kind) {
    case "child": {
      const child = data.children.find((c) => c.id === g.id);
      if (!child) return false;
      const n = child.photos?.length ?? 0;
      return g.expected != null ? n < g.expected : n === 0;
    }
    case "character": {
      const character = data.additionalCharacters.find((c) => c.id === g.id);
      if (!data.wantsCharacters || !character) return false;
      return g.expected != null ? character.photos.length < g.expected : character.photos.length === 0;
    }
    case "special":
      return data.specialPhoto == null;
    case "voice":
      return data.keepsakeWantsVoice === true && data.finalVoice == null;
  }
}

// ── read / write / clear ─────────────────────────────────────────────────────

export interface LoadedOrderDraft {
  payload: unknown;
}

export async function loadOrderDraft(): Promise<LoadedOrderDraft | undefined> {
  const payload = await readDraft<unknown>(FLOW).catch(() => undefined);
  return payload != null ? { payload } : undefined;
}

/**
 * Is there an unfinished order on this device worth offering to continue?
 * Cheap enough for the order menu (no form code): the same minimum
 * `restoreOrderDraft` demands — answers with at least one identified child.
 * Expired / foreign-version records are already deleted by `readDraft`; a
 * record failing this check is deleted here too, so it is never offered.
 * The resume screen still runs the full restore before showing the choice.
 */
export async function hasResumableOrderDraft(): Promise<boolean> {
  const loaded = await loadOrderDraft();
  if (!loaded) return false;
  const raw = loaded.payload;
  const ok =
    isObj(raw) &&
    isObj(raw.data) &&
    Array.isArray(raw.data.children) &&
    raw.data.children.some((c) => isObj(c) && typeof c.id === "string" && typeof c.name === "string");
  if (!ok) await clearOrderDraft().catch(() => {});
  return ok;
}

/** Deletes the draft. */
export function clearOrderDraft(): Promise<void> {
  return clearDraft(FLOW);
}

/**
 * Debounced writer. Many edits → one write after `delayMs` of quiet; `flush`
 * writes the pending one now (page hidden / leaving). Each write stores the
 * allowlisted answers with every file slot emptied (refreshing the retention
 * clock). Writes run one at a time, in order. `seal` cancels anything
 * pending, blocks every later write and deletes the draft — used the moment
 * the order is saved, so a late debounce can never resurrect it.
 */
export function createDraftSaver(delayMs = 800) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: OrderDraft | null = null;
  let sealed = false;
  let queue: Promise<void> = Promise.resolve();

  async function write(d: OrderDraft) {
    if (sealed) return;
    const { text, manifest } = stripMedia(toPersisted(d.data as FormData));
    try {
      await writeDraft(FLOW, { ...d, data: text, media: manifest } satisfies OrderDraft);
    } catch {
      // storage unavailable — the form keeps working in memory
    }
  }
  const enqueue = (d: OrderDraft) => {
    queue = queue.then(() => write(d)).catch(() => {});
    return queue;
  };

  return {
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
    /** writes the pending edit now; resolves once every queued write landed */
    flush(): Promise<void> {
      clearTimeout(timer);
      const p = pending;
      pending = null;
      if (p && !sealed) return enqueue(p);
      return queue;
    },
    /** order saved: stop for good and delete the draft */
    async seal(): Promise<void> {
      sealed = true;
      clearTimeout(timer);
      pending = null;
      await queue; // let an in-flight write land first, then delete it
      await clearOrderDraft();
    },
  };
}
