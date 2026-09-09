/**
 * TALIMOON — ORDER — "Esdalik sahifasi" keepsake relationship.
 * ================================================================
 * A NEW fine-grained, child-relative canonical relationship for whose
 * words appear on the keepsake page. This is deliberately SEPARATE from
 * the coarse order taxonomy in `lib/order/relationship.ts`
 * (`RelationshipType`) — it is never reinterpreted from it.
 *
 * The canonical codes below ARE the meaning; the UZ / EN / RU strings
 * are localization only and must never be stored as the source of truth.
 *
 * The intake contract still carries the coarse `storyGiver.relationshipType`
 * for legacy readers — `coarseFor()` is a deterministic fine → coarse
 * downcast (always safe: it only widens the bucket), not an inference.
 */

import type { Locale } from "@/lib/journey/types";
import type { RelationshipType } from "@/lib/order/relationship";

export type KeepsakeRelationship =
  | "father"
  | "mother"
  | "grandfather"
  | "grandmother"
  | "older_brother"
  | "older_sister"
  | "paternal_uncle"
  | "paternal_aunt"
  | "maternal_uncle"
  | "maternal_aunt"
  | "other";

export const KEEPSAKE_RELATIONSHIPS: readonly KeepsakeRelationship[] = [
  "father",
  "mother",
  "grandfather",
  "grandmother",
  "older_brother",
  "older_sister",
  "paternal_uncle",
  "paternal_aunt",
  "maternal_uncle",
  "maternal_aunt",
  "other",
] as const;

export function isKeepsakeRelationship(v: unknown): v is KeepsakeRelationship {
  return (
    typeof v === "string" &&
    (KEEPSAKE_RELATIONSHIPS as readonly string[]).includes(v)
  );
}

// ── Localised labels (display only) ──────────────────────────────
const UZ: Record<KeepsakeRelationship, string> = {
  father: "Otasi",
  mother: "Onasi",
  grandfather: "Bobosi",
  grandmother: "Buvisi",
  older_brother: "Akasi",
  older_sister: "Opasi",
  paternal_uncle: "Amakisi",
  paternal_aunt: "Ammasi",
  maternal_uncle: "Tog‘asi",
  maternal_aunt: "Xolasi",
  other: "Boshqa",
};

const EN: Record<KeepsakeRelationship, string> = {
  father: "Father",
  mother: "Mother",
  grandfather: "Grandfather",
  grandmother: "Grandmother",
  older_brother: "Older brother",
  older_sister: "Older sister",
  paternal_uncle: "Paternal uncle",
  paternal_aunt: "Paternal aunt",
  maternal_uncle: "Maternal uncle",
  maternal_aunt: "Maternal aunt",
  other: "Someone else",
};

const RU: Record<KeepsakeRelationship, string> = {
  father: "Отец",
  mother: "Мать",
  grandfather: "Дедушка",
  grandmother: "Бабушка",
  older_brother: "Старший брат",
  older_sister: "Старшая сестра",
  paternal_uncle: "Дядя (по отцу)",
  paternal_aunt: "Тётя (по отцу)",
  maternal_uncle: "Дядя (по матери)",
  maternal_aunt: "Тётя (по матери)",
  other: "Другой человек",
};

const AR: Record<KeepsakeRelationship, string> = {
  father: "الأب",
  mother: "الأم",
  grandfather: "الجَد",
  grandmother: "الجَدة",
  older_brother: "الأخ الأكبر",
  older_sister: "الأخت الكبرى",
  paternal_uncle: "العم",
  paternal_aunt: "العمة",
  maternal_uncle: "الخال",
  maternal_aunt: "الخالة",
  other: "شخص آخر",
};

const TABLES: Record<Locale, Record<KeepsakeRelationship, string>> = {
  uz: UZ,
  en: EN,
  ru: RU,
  ar: AR,
};

export function keepsakeRelationshipLabel(
  code: KeepsakeRelationship,
  locale: Locale,
): string {
  return (TABLES[locale] ?? UZ)[code];
}

/** All options, in canonical order, for the "Bolaga kim bo'ladi?" select. */
export function keepsakeRelationshipOptions(
  locale: Locale,
): { code: KeepsakeRelationship; label: string }[] {
  return KEEPSAKE_RELATIONSHIPS.map((code) => ({
    code,
    label: keepsakeRelationshipLabel(code, locale),
  }));
}

/**
 * Deterministic fine → coarse downcast, so the intake contract's legacy
 * `storyGiver.relationshipType` stays populated and readable. This only
 * ever WIDENS the bucket — it never guesses a narrower value — so it is a
 * safe projection, not an inference.
 */
export function coarseFor(code: KeepsakeRelationship): RelationshipType {
  switch (code) {
    case "father":
    case "mother":
      return "parent";
    case "grandfather":
    case "grandmother":
      return "grandparent";
    case "older_brother":
    case "older_sister":
      return "sibling";
    case "paternal_uncle":
    case "paternal_aunt":
    case "maternal_uncle":
    case "maternal_aunt":
      return "aunt-uncle";
    case "other":
      return "other";
  }
}
