/**
 * TALIMOON — ORDER — data model.
 * ================================================================
 * The conceptual separation the order experience is built around
 * (Phase 01 spec §21):
 *
 *   Orderer               — the person placing the order + logistics
 *   RecipientRelationship  — structured type (+ optional custom label)
 *   ChildProfile           — one main character; EVERYTHING specific
 *                            to a child hangs off its stable `id`,
 *                            never an array index
 *   Order                  — orderer + derived bookType + children[]
 *
 * Phase 01 fills `orderer.name`, `recipientRelationship` and each
 * child's `id` / `name` / `age`. The remaining `ChildProfile` fields
 * are declared now but collected in later phases — the type is
 * already child-centric so that work is additive, not a refactor.
 */

import type { BookType, Market } from "@/components/begin/orderFormData";
import type { Honorific, RecipientRelationship } from "./relationship";

export type { BookType, Market };

/**
 * The written delivery address is the PRIMARY address (spec §42–49).
 * `location` is optional extra precision — a pin the courier can use —
 * and never a substitute for the written fields. Stored provider-neutral
 * (plain lat/lng) so the value survives any map layer.
 *
 * `source` records how the customer chose the point:
 *  - `"device"` — browser geolocation ("Hozirgi joylashuvimni yuborish")
 *  - `"map"`    — an explicit pick on the interactive map ("Xaritadan joy tanlash"),
 *                 which may be somewhere other than where the customer is now
 * `formattedAddress` is a human-readable label when the provider returned one;
 * it never replaces the written address. `confirmedByCustomer` is only ever
 * true — an unconfirmed pin is never attached to the order.
 */
export interface DeliveryLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: "device" | "map";
  formattedAddress?: string;
  confirmedByCustomer: true;
}

export interface DeliveryAddress {
  /** The customer's EXPLICIT choice — `undefined` until they answer
   *  "Kitobni Sizga yetkazib beraylikmi?". Delivery is never assumed. */
  choice?: "delivery" | "pickup";
  /** Destination country ISO code. "" until resolved. UZ market ⇒
   *  "UZ"; INTERNATIONAL market ⇒ the chosen country. */
  countryCode: string;

  // ── Uzbekistan address (market = UZ) ──────────────────────────────
  /** Region CODE (see orderFormData `DELIVERY_REGIONS`). This — not any
   *  free-text string — drives the delivery fee. Toshkent shahri
   *  (`tashkent_city`) is free; every other region is the flat fee.
   *  `""` until chosen. */
  regionCode: string;
  /** Shahar / tuman */
  district: string;
  /** Ko‘cha / mahalla */
  street: string;
  /** Uy / bino */
  building: string;
  /** Kvartira / xonadon — optional */
  apartment?: string;
  /** Mo‘ljal — optional */
  landmark?: string;
  /** Optional GPS pin — never a substitute for the written address. */
  location?: DeliveryLocation;

  // ── International postal address (market = INTERNATIONAL) ──────────
  /** State / province / region — used where the country has one. */
  intlState?: string;
  intlCity?: string;
  /** Street / address line. */
  intlLine1?: string;
  /** Building / house. */
  intlBuilding?: string;
  /** Apartment / unit — optional. */
  intlApartment?: string;
  /** Postal / ZIP code — used where the country has one. */
  intlPostalCode?: string;
  /** Additional delivery note — optional. */
  intlNote?: string;
}

export function emptyDeliveryAddress(): DeliveryAddress {
  return { countryCode: "", regionCode: "", district: "", street: "", building: "" };
}

/** True only when the customer actively asked for delivery. */
export function deliveryRequired(a: DeliveryAddress): boolean {
  return a.choice === "delivery";
}

/** Whether the delivery section is answered enough to continue, given
 *  the order's market. Pickup needs nothing. UZ delivery needs a
 *  region + the core written address; INTERNATIONAL delivery needs a
 *  country + city + address line + building (a pin/state/postcode are
 *  never hard-required — some countries have no postcode). */
export function isDeliveryComplete(a: DeliveryAddress, market: Market = "UZ"): boolean {
  if (a.choice === "pickup") return true;
  if (a.choice !== "delivery") return false;
  if (market === "INTERNATIONAL") {
    return (
      a.countryCode.trim().length > 0 &&
      (a.intlCity ?? "").trim().length > 0 &&
      (a.intlLine1 ?? "").trim().length > 0 &&
      (a.intlBuilding ?? "").trim().length > 0
    );
  }
  return (
    a.regionCode.trim().length > 0 &&
    a.district.trim().length > 0 &&
    a.street.trim().length > 0 &&
    a.building.trim().length > 0
  );
}

/** Market switch must be ATOMIC and leave no stale delivery state that
 *  could still affect the total (spec §17, §38). Returns a fresh
 *  address that keeps only the fields valid for the new market and the
 *  customer's delivery/pickup choice. */
export function resetDeliveryForMarket(
  a: DeliveryAddress,
  market: Market,
): DeliveryAddress {
  const base: DeliveryAddress = {
    ...emptyDeliveryAddress(),
    choice: a.choice,
  };
  if (market === "INTERNATIONAL") {
    // Keep a chosen non-UZ country if there was one; drop every UZ field.
    base.countryCode = a.countryCode && a.countryCode !== "UZ" ? a.countryCode : "";
  } else {
    base.countryCode = "UZ";
  }
  return base;
}

export interface Orderer {
  /** Form of address, chosen alongside the name in Phase 01. `null`
   *  until answered; the plain name is used when it stays null. */
  honorific: Honorific | null;
  /** Collected first, in Phase 01. */
  name: string;
  /** Logistics — collected at order finalization, not in Phase 01. */
  phone: string;
  /** Structured delivery address (+ optional pin). See {@link DeliveryAddress}. */
  deliveryAddress: DeliveryAddress;
}

export function emptyOrderer(): Orderer {
  return {
    honorific: null,
    name: "",
    phone: "",
    deliveryAddress: emptyDeliveryAddress(),
  };
}

/** Phase 02 dream routes. `null` until the adult chooses one. */
export type DreamStatus = "has-dream" | "not-yet" | null;

/**
 * The shared answer model behind every multi-select-or-write-your-own
 * question in Phase 02/03 (interests, appreciated qualities, growth
 * behaviours). A preset and a custom answer become the SAME kind of
 * data the moment either is chosen — later screens read this array,
 * never a hardcoded assumption about which preset the adult picked.
 *
 * `id` is the stable identity: a prepared key ("football", "kind") for
 * a preset, or the custom text itself for a custom answer (already
 * de-duplicated against everything else in the list, so this is safe).
 * Display text is resolved from `id` through that category's own
 * locale-aware label lookup (`interestLabel` / `qualityLabel` /
 * `growthFull`) — which already falls through to the raw text for
 * anything that isn't a known key — so a preset's label stays correct
 * if the orderer switches language mid-flow, and nothing needs to
 * freeze a translated string on the object itself.
 */
export interface SelectableAnswer {
  id: string;
  source: "preset" | "custom";
}

/** An interest, plus its own optional deepening detail (spec: detail
 *  lives on the SAME interest, never a separate array keyed by position). */
export interface InterestAnswer extends SelectableAnswer {
  detail?: string;
}

/**
 * An appreciated quality, plus ITS OWN optional "when do you see this?"
 * detail (spec §4). The detail lives on the SAME quality object, keyed
 * by that quality's `id` (a preset key or the custom text) — so it is
 * bound to BOTH the child (this array's owner) AND the trait, removing
 * the quality removes its detail with it, and an unselected quality's
 * detail is never carried forward. `detail` and `noDetail` are mutually
 * exclusive on the same item — the customer answers, or explicitly says
 * no example comes to mind; they are never asked to invent one.
 */
export interface QualityAnswer extends SelectableAnswer {
  detail?: string;
  noDetail?: boolean;
}

/**
 * A growth behaviour, plus ITS OWN optional context (spec §22–26):
 * every selected behaviour carries when/where it tends to show up.
 * There is no single global "growth context" any more — one behaviour's
 * context can never be attributed to another. `context` and
 * `noSpecificContext` are mutually exclusive on the same item.
 */
export interface GrowthBehaviorAnswer extends SelectableAnswer {
  context?: string;
  noSpecificContext?: boolean;
}

/** Set one growth behaviour's context, or its "no particular situation"
 *  flag — the two are mutually exclusive on that single item (spec §25). */
export function setGrowthItemContext(
  list: GrowthBehaviorAnswer[],
  id: string,
  patch: { context?: string; noSpecificContext?: boolean },
): GrowthBehaviorAnswer[] {
  return list.map((a) => {
    if (a.id !== id) return a;
    if (patch.noSpecificContext === true) {
      return { ...a, noSpecificContext: true, context: "" };
    }
    if (patch.noSpecificContext === false && patch.context === undefined) {
      return { ...a, noSpecificContext: false };
    }
    if (patch.context !== undefined) {
      return { ...a, context: patch.context, noSpecificContext: false };
    }
    return a;
  });
}

/**
 * "Ko'ngil so'zlari" — the private emotional-context bridge. FOUR
 * psychologically distinct pieces, gathered per child, every one
 * optional. This is NOT therapy, NOT a diagnosis, and NOT a message to
 * the child (that is Esdalik Sahifasi).
 *
 * Everything here stays PRIVATE: it is never shown to the child in the
 * form and never copied into the story. It is used only to choose the
 * story's emotional tone with care — never to blame a caregiver, take a
 * side, assert what the child "definitely" thinks, or press the child to
 * forgive or love someone. The four fields serialise into
 * `profile.extraInfo` (a single free-text field) via
 * `orderEmotionalText` — the backend contract is unchanged.
 */
export interface EmotionalBridge {
  /** Step 1 — the real situation, in the adult's own words. */
  privateContext?: string;
  /** Step 2 — the ADULT'S OBSERVATION of how the child might be
   *  experiencing the situation. A possibility ("Sizningcha…", "menimcha…"),
   *  never asserted as the child's inner state. */
  childExperience?: string;
  /** Step 3 — the emotional direction the adult hopes the story supports
   *  (warmth, closeness, reassurance, pride, belonging…). Not a sentence
   *  or a message addressed to the child. */
  intendedFeeling?: string;
  /** Step 4 — themes TALIMOON should avoid stating openly or handle with
   *  extra care. */
  sensitivities?: string;
  /** True once this child's section has been seen through to the end.
   *  The section is optional, so this can be true with every field
   *  left blank. */
  done?: boolean;
}

export interface ChildProfile {
  /** Stable identity — assigned once, on creation. Future child data
   *  attaches to this, so it must never be derived from position. */
  id: string;
  name: string;
  /** Numeric, or null until answered. */
  age: number | null;
  /**
   * THIS child's relationship to the orderer. Families are often mixed
   * (a own child and a nephew growing up together as the two main
   * characters) — never assume every child shares the order-level
   * `recipientRelationship`. Set directly from Phase 01 when the
   * orderer chose a single relationship type for everyone; asked per
   * child, right after names/ages, when 2–3 types were chosen.
   */
  relationship?: RecipientRelationship;

  // ── Phase 02 — "the child's world" (per child) ─────────────────
  /** Up to 3 primary interests — preset and custom answers side by
   *  side in one array (spec: they must have equal status). */
  interests?: InterestAnswer[];
  /** The absorbing activity, in the adult's words (question 03). */
  favoriteActivity?: string;
  /** Set when the adult says there is no single absorbing activity. */
  noFavoriteActivity?: boolean;
  /** Which dream route is active. */
  dreamStatus?: DreamStatus;
  /** The CHILD's own stated dream (only when dreamStatus === "has-dream"). */
  childDream?: string;
  /** What the ADULT hopes for the child (only when dreamStatus === "not-yet").
   *  Never attributed to the child. */
  adultHope?: string;
  /** True once this child's Phase 02 conversation is finished. */
  phase02Done?: boolean;

  // ── Phase 03 — "the child's character" (per child) ─────────────
  /** Up to 3 qualities the adult appreciates — preset and custom side
   *  by side. Never a judgement, always something valued. Each carries
   *  its OWN optional "when do you notice this?" detail (spec §4). */
  appreciatedQualities?: QualityAnswer[];
  /** Up to 3 behaviours the adult would gently like to support —
   *  preset and custom side by side. Each describes a behaviour or
   *  situation, never labels the child, and carries its OWN optional
   *  context (spec §22–26). */
  growthBehaviors?: GrowthBehaviorAnswer[];
  /** Set when the adult says there is nothing in particular right now —
   *  exclusive with `growthBehaviors` (spec §19–21). */
  noGrowthArea?: boolean;
  /** Up to 3 values the story should strengthen. */
  desiredValues?: string[];
  /** True once this child's Phase 03 conversation is finished. */
  phase03Done?: boolean;

  // ── "Yuragingizda qolgan gaplar" — the emotional bridge (per child) ──
  /** Private context + the feeling to carry across + one heartfelt
   *  line. Kept per child; one child's private context is never shown
   *  against another. See {@link EmotionalBridge}. */
  emotionalBridge?: EmotionalBridge;

  // ── Later phases (declared, not collected yet) ─────────────────
  specialDetails?: string;
  photos?: File[];
}

/**
 * When the adult switches dream routes, the other route's answer is
 * stale and must not leak into the portrait or the summary. Returns a
 * patch that clears whatever no longer belongs to the active path.
 */
export function reconcileDream(status: DreamStatus): Partial<ChildProfile> {
  if (status === "has-dream") return { dreamStatus: status, adultHope: "" };
  if (status === "not-yet") return { dreamStatus: status, childDream: "" };
  return { dreamStatus: null, childDream: "", adultHope: "" };
}

/**
 * When the adult switches to "nothing in particular" (spec §19–21), the
 * growth behaviours — and the per-item contexts that live on them — are
 * stale and must not reach the portrait or the summary. Clearing the
 * array clears every attached context with it.
 */
export function reconcileGrowth(hasBehavior: boolean): Partial<ChildProfile> {
  return hasBehavior
    ? { noGrowthArea: false }
    : { noGrowthArea: true, growthBehaviors: [] };
}

/** Set one appreciated quality's detail, or its "no example comes to
 *  mind" flag — the two are mutually exclusive on that single item
 *  (spec §4). One quality's detail can never land on another. */
export function setQualityDetail(
  list: QualityAnswer[],
  id: string,
  patch: { detail?: string; noDetail?: boolean },
): QualityAnswer[] {
  return list.map((a) => {
    if (a.id !== id) return a;
    if (patch.noDetail === true) {
      return { ...a, noDetail: true, detail: "" };
    }
    if (patch.noDetail === false && patch.detail === undefined) {
      return { ...a, noDetail: false };
    }
    if (patch.detail !== undefined) {
      return { ...a, detail: patch.detail, noDetail: false };
    }
    return a;
  });
}

/** True when a selected quality still needs an answer — neither a
 *  written detail nor the explicit "no example" alternative (spec §4). */
export function qualityDetailPending(a: QualityAnswer): boolean {
  return !a.noDetail && (a.detail ?? "").trim().length === 0;
}

/** A stable id for a CUSTOM selectable answer — the normalized text
 *  itself, so duplicate detection and identity are the same check.
 *  Presets use their prepared key directly as `id` instead. */
export function makeCustomAnswerId(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/** A crypto-random id with a safe fallback for older browsers / SSR. */
function randomId(prefix: string): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return `${prefix}_${crypto.randomUUID()}`;
    }
  } catch {
    /* fall through */
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function makeChildId(): string {
  return randomId("child");
}

export function emptyChild(): ChildProfile {
  return { id: makeChildId(), name: "", age: null };
}

/**
 * An ADDITIONAL character — a relative or friend the customer wants drawn
 * into the story alongside the main child(ren). A separate concept from
 * {@link ChildProfile}: additional characters are never main characters,
 * never priced, and never routed as child slots.
 *
 * Everything about one character — its identity AND its reference photos —
 * hangs off the stable `id`, never an array index. So the photo-upload
 * blocks on the photos step are generated one-per-entry directly from this
 * list, and a photo can never be reattributed to a different person by a
 * reorder or a removal earlier in the list.
 */
export interface AdditionalCharacter {
  /** Stable identity — assigned once, on creation. */
  id: string;
  /** "Kimligi" — role / relationship, e.g. "Ona", "Bobo", "Opa". */
  relation: string;
  /** "Ismi" — the character's name, e.g. "Dilnoza". */
  name: string;
  /** This character's own reference photos. At least
   *  {@link MIN_CHARACTER_PHOTOS} are required before the photos step can
   *  advance. */
  photos: File[];
}

export function makeCharacterId(): string {
  return randomId("char");
}

export function emptyAdditionalCharacter(): AdditionalCharacter {
  return { id: makeCharacterId(), relation: "", name: "", photos: [] };
}

/** Minimum reference photos per additional character (mirrors the
 *  main-child photo minimum). */
export const MIN_CHARACTER_PHOTOS = 2;
/** Per-character upper bound — keeps the existing global upload ceiling
 *  intact while still allowing more than the minimum. */
export const MAX_CHARACTER_PHOTOS = 5;
/** How many additional characters one order can hold. */
export const MAX_ADDITIONAL_CHARACTERS = 10;

/** True once both identifying fields are filled — the entry is real
 *  enough to generate its own photo-upload block. */
export function additionalCharacterNamed(c: AdditionalCharacter): boolean {
  return c.relation.trim().length > 0 && c.name.trim().length > 0;
}

/** True when the entry is complete enough to submit — identified AND
 *  carrying the minimum number of reference photos. */
export function additionalCharacterComplete(c: AdditionalCharacter): boolean {
  return additionalCharacterNamed(c) && c.photos.length >= MIN_CHARACTER_PHOTOS;
}

/** "Ona — Dilnoza" — the human label for a character's photo-upload
 *  block and the review list. Never an id. */
export function additionalCharacterLabel(c: AdditionalCharacter): string {
  return `${c.relation.trim()} — ${c.name.trim()}`;
}

/** How many main children a single order can hold. Preserves the
 *  existing wizard's cap — change here if the product rule changes. */
export const MIN_MAIN_CHILDREN = 1;
export const MAX_MAIN_CHILDREN = 6;

/** Common ages offered as one-tap choices; anything outside is entered
 *  through "another age". Not a hard product limit — the existing
 *  product enforces none — just the fast path. */
export const QUICK_AGES: readonly number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const AGE_MIN = 1;
export const AGE_MAX = 17;

export function isValidAge(age: number | null): age is number {
  return (
    typeof age === "number" &&
    Number.isInteger(age) &&
    age >= AGE_MIN &&
    age <= AGE_MAX
  );
}

/**
 * Customer-facing child count → internal book type. The customer
 * never sees "single" / "multi"; this is the only place the mapping
 * lives. Pricing (`calculatePrice`) still keys off the result.
 */
export function bookTypeForChildCount(count: number): BookType {
  return count <= 1 ? "single" : "multi";
}

/** What Phase 01 hands to the rest of the experience. */
export interface Phase01Result {
  ordererHonorific: Honorific | null;
  ordererName: string;
  recipientRelationship: RecipientRelationship;
  children: ChildProfile[];
}
