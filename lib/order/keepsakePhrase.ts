/**
 * TALIMOON — ORDER — "Esdalik sahifasi" PRESENTATION grammar.
 * ================================================================
 * Sentence composition only. This module never decides or stores meaning
 * — the canonical relationship codes live in `keepsakeRelationship.ts`
 * and are language-independent. Here we turn a code + names into a
 * natural, locale-correct sentence for the keepsake photo instruction and
 * the message example.
 *
 * Rules honoured:
 *  - nothing is inferred; a missing relationship or author name yields a
 *    safe generic instruction, never `undefined` / broken punctuation
 *  - one locale's kinship words never leak into another locale's sentence
 *  - no em dash characters in any string produced here
 */

import type { KeepsakeRelationship } from "@/lib/order/keepsakeRelationship";

export type KeepsakeLocale = "uz" | "en" | "ru";

const asLocale = (l: string): KeepsakeLocale =>
  l === "uz" || l === "ru" ? l : "en";

// ── child-name joining ───────────────────────────────────────────
// 1: "A"   2: "A va B"   3+: "A, B va C"   (locale-specific final joiner)

const FINAL_JOINER: Record<KeepsakeLocale, string> = {
  uz: " va ",
  en: " and ",
  ru: " и ",
};

export function joinNames(names: string[], locale: string): string {
  const clean = names.map((n) => n.trim()).filter((n) => n.length > 0);
  const j = FINAL_JOINER[asLocale(locale)];
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0]!;
  if (clean.length === 2) return `${clean[0]}${j}${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")}${j}${clean[clean.length - 1]}`;
}

// ── presentation kinship phrase (for "…together with their <phrase> <name>") ──
// Deliberately SEPARATE from the canonical codes and their selector labels.

type PhraseTable = Record<KeepsakeRelationship, string>;

const PHRASE_UZ: PhraseTable = {
  father: "dadasi",
  mother: "onasi",
  grandfather: "bobosi",
  grandmother: "buvisi",
  older_brother: "akasi",
  older_sister: "opasi",
  paternal_uncle: "amakisi",
  paternal_aunt: "ammasi",
  maternal_uncle: "tog‘asi",
  maternal_aunt: "xolasi",
  other: "",
};

const PHRASE_EN: PhraseTable = {
  father: "father",
  mother: "mother",
  grandfather: "grandfather",
  grandmother: "grandmother",
  older_brother: "older brother",
  older_sister: "older sister",
  paternal_uncle: "paternal uncle",
  paternal_aunt: "paternal aunt",
  maternal_uncle: "maternal uncle",
  maternal_aunt: "maternal aunt",
  other: "",
};

// Russian instrumental case, for "…вместе с <phrase> <name>".
const PHRASE_RU: PhraseTable = {
  father: "папой",
  mother: "мамой",
  grandfather: "дедушкой",
  grandmother: "бабушкой",
  older_brother: "старшим братом",
  older_sister: "старшей сестрой",
  paternal_uncle: "дядей (по отцу)",
  paternal_aunt: "тётей (по отцу)",
  maternal_uncle: "дядей (по матери)",
  maternal_aunt: "тётей (по матери)",
  other: "",
};

const PHRASE: Record<KeepsakeLocale, PhraseTable> = {
  uz: PHRASE_UZ,
  en: PHRASE_EN,
  ru: PHRASE_RU,
};

/**
 * The kinship phrase for the photo sentence, or `null` when there is
 * nothing usable yet. For `other`, the customer's own custom label is used
 * verbatim (trimmed); with no label there is no phrase.
 */
export function keepsakePossessivePhrase(
  relationship: KeepsakeRelationship | "",
  customLabel: string | undefined,
  locale: string,
): string | null {
  if (relationship === "") return null;
  if (relationship === "other") {
    const label = (customLabel ?? "").trim();
    return label.length > 0 ? label : null;
  }
  const phrase = PHRASE[asLocale(locale)][relationship];
  return phrase.length > 0 ? phrase : null;
}

// ── the photo instruction sentence ───────────────────────────────

export interface KeepsakePhotoInstructionArgs {
  childNames: string[];
  relationship: KeepsakeRelationship | "";
  customLabel?: string;
  authorName?: string;
  locale: string;
}

const GENERIC_INSTRUCTION: Record<KeepsakeLocale, string> = {
  uz: "Bola(lar) bilan esdalik so‘zlari egasi birga tushgan haqiqiy suratni yuklang.",
  en: "Upload a real photo of the child (or children) together with the keepsake author.",
  ru: "Загрузите настоящую фотографию ребёнка (или детей) вместе с автором памяти.",
};

/**
 * "{childNames} bilan {phrase} {authorName} birga tushgan haqiqiy suratni
 * yuklang." — and the natural equivalents in EN / RU. Falls back to a safe
 * generic line until BOTH a relationship phrase and an author name exist,
 * or when no child name is known.
 */
export function buildKeepsakePhotoInstruction(args: KeepsakePhotoInstructionArgs): string {
  const locale = asLocale(args.locale);
  const names = joinNames(args.childNames, locale);
  const author = (args.authorName ?? "").trim();
  const isOther = args.relationship === "other";
  const phrase = keepsakePossessivePhrase(args.relationship, args.customLabel, locale);

  if (names.length === 0 || author.length === 0 || phrase === null) {
    return GENERIC_INSTRUCTION[locale];
  }

  // For the custom ("other") label we cannot assume grammatical agreement,
  // so the name is parenthesised rather than run into the phrase.
  if (locale === "uz") {
    return isOther
      ? `${names} bilan ${phrase} (${author}) birga tushgan haqiqiy suratni yuklang.`
      : `${names} bilan ${phrase} ${author} birga tushgan haqiqiy suratni yuklang.`;
  }
  if (locale === "ru") {
    return isOther
      ? `Загрузите настоящую фотографию, где ${names} вместе с ${phrase} (${author}).`
      : `Загрузите настоящую фотографию, где ${names} вместе с ${phrase} ${author}.`;
  }
  return isOther
    ? `Upload a real photo of ${names} together with ${phrase} (${author}).`
    : `Upload a real photo of ${names} together with their ${phrase} ${author}.`;
}

// ── keepsake message: heading, helper, example ───────────────────

export function keepsakeWordsHeading(childNames: string[], locale: string): string {
  const l = asLocale(locale);
  const names = joinNames(childNames, l);
  const who = names.length > 0 ? names : l === "uz" ? "Farzandingiz" : l === "ru" ? "Ваш ребёнок" : "Your child";
  if (l === "uz") return `${who} uchun maxsus esdalik so‘zlari`;
  if (l === "ru") return `Особые слова-память для: ${who}`;
  return `Special keepsake words for ${who}`;
}

export function keepsakeWordsHelper(childNames: string[], locale: string): string {
  const l = asLocale(locale);
  const plural = childNames.map((n) => n.trim()).filter(Boolean).length > 1;
  if (l === "uz") {
    return plural
      ? "Ularga qalbingizdan chiqqan tilak, nasihat yoki bir umr eslab qolishlarini istagan so‘zlaringizni yozing."
      : "Unga qalbingizdan chiqqan tilak, nasihat yoki bir umr eslab qolishini istagan so‘zlaringizni yozing.";
  }
  if (l === "ru") {
    return plural
      ? "Напишите пожелание, наставление или слова, которые вы хотели бы, чтобы они запомнили на всю жизнь."
      : "Напишите пожелание, наставление или слова, которые вы хотели бы, чтобы он (она) запомнил(а) на всю жизнь.";
  }
  return plural
    ? "Write a wish, a piece of advice, or words you would like them to remember for a lifetime."
    : "Write a wish, a piece of advice, or words you would like them to remember for a lifetime.";
}

/**
 * A meaningful, name-aware example for the textarea placeholder. Respectful
 * register only (no "sen/seni/sening" in the UZ copy). Never hardcodes a
 * child name — always uses the real one(s).
 */
export function keepsakeMessageExample(childNames: string[], locale: string): string {
  const l = asLocale(locale);
  const clean = childNames.map((n) => n.trim()).filter(Boolean);
  const plural = clean.length > 1;
  const names = joinNames(clean, l) || (l === "uz" ? "Farzandim" : l === "ru" ? "Дорогой(ая)" : "Dear one");

  if (l === "uz") {
    return plural
      ? `Masalan: "${names}, doimo yaxshi inson bo‘lib ulg‘ayinglar. Ilmli, mehribon va jasur bo‘linglar. Qayerda bo‘lsangiz ham, sizlarni yaxshi ko‘rishimizni va doimo yoningizda ekanimizni unutmang."`
      : `Masalan: "${names}, doimo yaxshi inson bo‘lib ulg‘aying. Ilmli, mehribon va jasur bo‘ling. Qayerda bo‘lsangiz ham, sizni yaxshi ko‘rishimizni va doimo yoningizda ekanimizni unutmang."`;
  }
  if (l === "ru") {
    return plural
      ? `Например: "${names}, всегда растите хорошими людьми. Будьте образованными, добрыми и смелыми. Где бы вы ни были, помните, что мы вас любим и всегда рядом."`
      : `Например: "${names}, всегда растите хорошим человеком. Будьте образованным, добрым и смелым. Где бы вы ни были, помните, что мы вас любим и всегда рядом."`;
  }
  return plural
    ? `For example: "${names}, always grow into good people. Be knowledgeable, kind and brave. Wherever you are, never forget that we love you and are always by your side."`
    : `For example: "${names}, always grow into a good person. Be knowledgeable, kind and brave. Wherever you are, never forget that we love you and are always by your side."`;
}
