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
 *   until the order is sent, max 7 days:
 *     orderer name + honorific, phone, delivery address (+ map pin),
 *     child names, storyGiverDisplayName, personalMessage, each child's
 *     private emotional context (emotionalBridge), additional characters'
 *     names/relations, child + character photos, the keepsake photo, the
 *     voice note (+ duration).
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

export interface OrderDraft {
  bookType: BookType;
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
}

const FLOW = "personalized-book" as const;

/** The explicit allowlist: FormData minus NEVER_PERSISTED. */
export function toPersisted(data: FormData): PersistedFormData {
  const copy: Partial<FormData> = { ...data };
  for (const k of NEVER_PERSISTED) delete copy[k];
  return copy as PersistedFormData;
}

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

/**
 * Rebuilds FormData from a stored draft over a fresh `base`. Anything
 * missing or mistyped falls back to the base value; never-persisted fields
 * always come from the base (unticked, unsigned). Returns null when the
 * record cannot be trusted at all.
 */
export type RestoredOrderDraft = Omit<OrderDraft, "data"> & { data: FormData };

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
    const children = d.children
      .slice(0, MAX_MAIN_CHILDREN)
      .filter((c): c is Record<string, unknown> => isObj(c) && typeof c.id === "string" && typeof c.name === "string")
      .map((c) => ({ ...c, photos: blobs(c.photos) }) as unknown as FormData["children"][number]);
    if (children.length === 0) return null;

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
      finalVoice: isBlob(d.finalVoice) ? d.finalVoice : null,
      finalVoiceDurationSec: typeof d.finalVoiceDurationSec === "number" ? d.finalVoiceDurationSec : null,
      wantsCharacters: d.wantsCharacters === true,
      additionalCharacters: Array.isArray(d.additionalCharacters)
        ? d.additionalCharacters
            .filter((c): c is Record<string, unknown> => isObj(c) && typeof c.id === "string")
            .map((c) => ({
              id: c.id as string,
              relation: typeof c.relation === "string" ? c.relation : "",
              name: typeof c.name === "string" ? c.name : "",
              photos: blobs(c.photos),
            }))
        : [],
      specialPhoto: isBlob(d.specialPhoto) ? d.specialPhoto : null,
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
    };
  } catch {
    return null;
  }
}

// ── read / write / clear ─────────────────────────────────────────────────────

export function loadOrderDraft(): Promise<unknown> {
  return readDraft<unknown>(FLOW).catch(() => undefined);
}

export function clearOrderDraft(): Promise<void> {
  return clearDraft(FLOW);
}

/**
 * Debounced writer. Many edits → one write after `delayMs` of quiet; `flush`
 * writes the pending one now (page hidden / leaving). `seal` cancels anything
 * pending and blocks every later write — used the moment the order is saved,
 * so a late debounce can never resurrect the draft.
 */
export function createDraftSaver(delayMs = 800) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: OrderDraft | null = null;
  let sealed = false;

  async function write(d: OrderDraft) {
    const payload: OrderDraft = { ...d, data: toPersisted(d.data as FormData) };
    try {
      await writeDraft(FLOW, payload);
    } catch {
      // Quota exceeded (many large photos): keep at least the answers —
      // unless the order was saved meanwhile (never write after seal).
      if (sealed) return;
      try {
        await writeDraft(FLOW, {
          ...payload,
          data: {
            ...payload.data,
            children: payload.data.children.map((c) => ({ ...c, photos: [] })),
            additionalCharacters: payload.data.additionalCharacters.map((c) => ({ ...c, photos: [] })),
            specialPhoto: null,
            finalVoice: null,
            finalVoiceDurationSec: null,
          },
        });
      } catch {
        /* storage unavailable — the form keeps working in memory */
      }
    }
  }

  return {
    schedule(d: OrderDraft) {
      if (sealed) return;
      pending = d;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const p = pending;
        pending = null;
        if (p && !sealed) void write(p);
      }, delayMs);
    },
    flush() {
      clearTimeout(timer);
      const p = pending;
      pending = null;
      if (p && !sealed) void write(p);
    },
    /** order saved: stop for good and delete the stored draft */
    seal(): Promise<void> {
      sealed = true;
      clearTimeout(timer);
      pending = null;
      return clearOrderDraft();
    },
    /** unmount without saving state changes (pending edits are flushed) */
    dispose() {
      this.flush();
    },
  };
}
