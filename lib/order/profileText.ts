/**
 * Serialises the RICH per-child structured answers collected in Phase 02
 * ("the child's world"), Phase 03 ("the child's character") and the
 * emotional bridge into the flat strings the order-intake contract carries
 * (`profile.children[i].{interests,dreams,strengths,growthAreas}`,
 * `profile.traits[]`, `profile.extraInfo`) and that the Story Profile DOCX
 * renders section by section.
 *
 * WHY THIS EXISTS: the /begin form moved this data onto `ChildProfile`
 * (per child) long ago, but `buildSubmitPayload` was never updated to send
 * it — so every structured Story Profile section rendered
 * "— taqdim etilmagan —" even though the customer had answered. This module
 * is the missing bridge. It is PURE (no I/O), deterministic, and only ever
 * re-expresses what the customer actually submitted — it never invents,
 * summarises away, or infers a value. An unanswered section yields
 * `undefined`, so the payload omits the key and the renderer legitimately
 * shows "— taqdim etilmagan —".
 *
 * The Story Profile dossier is Uzbek (all production staff are
 * Uzbek-speaking — see talimoon-intake src/storyprofile/render.ts), and the
 * customer's own words are always kept verbatim. The short orienting
 * prefixes below are taken from the localized Phase 02/03 copy so they
 * follow the book's language.
 */

import type { ChildProfile } from "./types";
import { interestLabel, phase02Copy, type Locale } from "./phase02-copy";
import { growthFull, phase03Copy, qualityLabel, valueLabel } from "./phase03-copy";

function clean(s: string | undefined | null): string {
  return (s ?? "").trim();
}

function joinLines(lines: Array<string | undefined | null>): string | undefined {
  const out = lines.map(clean).filter((l) => l.length > 0);
  return out.length > 0 ? out.join("\n") : undefined;
}

/**
 * §5 "Qiziqishlari va dunyosi" — the child's interests, each with its own
 * optional deepening detail, exactly as chosen. One interest per line.
 */
export function childInterestsText(child: ChildProfile, locale: Locale): string | undefined {
  const list = child.interests ?? [];
  if (list.length === 0) return undefined;
  return joinLines(
    list.map((a) => {
      const label = interestLabel(a.id, locale);
      const detail = clean(a.detail);
      return detail ? `${label} — ${detail}` : label;
    }),
  );
}

/**
 * §6 "Orzulari va sevimli mashg'ulotlari" — the absorbing activity (or the
 * explicit "no single activity") plus the dream: the CHILD's own dream when
 * they have one, otherwise the ADULT's hope, never conflated.
 */
export function childDreamsText(child: ChildProfile, locale: Locale): string | undefined {
  const c = phase02Copy(locale);
  const lines: Array<string | undefined> = [];

  if (clean(child.favoriteActivity)) {
    lines.push(`${c.pAbsorbs}: ${clean(child.favoriteActivity)}`);
  } else if (child.noFavoriteActivity) {
    lines.push(`${c.pAbsorbs}: ${c.q3None}`);
  }

  if (child.dreamStatus === "has-dream" && clean(child.childDream)) {
    lines.push(`${c.pDreams}: ${clean(child.childDream)}`);
  } else if (child.dreamStatus === "not-yet" && clean(child.adultHope)) {
    lines.push(`${c.pHope}: ${clean(child.adultHope)}`);
  }

  return joinLines(lines);
}

/**
 * §7 "Kuchli tomonlari" — the qualities the adult appreciates, each with
 * its own optional "when do you notice this?" example. One per line.
 */
export function childStrengthsText(child: ChildProfile, locale: Locale): string | undefined {
  const list = child.appreciatedQualities ?? [];
  if (list.length === 0) return undefined;
  return joinLines(
    list.map((a) => {
      const label = qualityLabel(a.id, locale);
      const detail = clean(a.detail);
      return detail ? `${label} — ${detail}` : label;
    }),
  );
}

/**
 * §8 "Rivojlantirish kerak bo'lgan jihatlar" — the behaviours the adult
 * would gently like to support, each with its own optional context; or the
 * explicit "nothing in particular right now".
 */
export function childGrowthText(child: ChildProfile, locale: Locale): string | undefined {
  if (child.noGrowthArea) {
    return phase03Copy(locale).q3None;
  }
  const list = child.growthBehaviors ?? [];
  if (list.length === 0) return undefined;
  return joinLines(
    list.map((a) => {
      const label = growthFull(a.id, locale);
      const context = clean(a.context);
      return context ? `${label} — ${context}` : label;
    }),
  );
}

/**
 * "Ko'ngil so'zlari" — this child's private emotional context, as four
 * psychologically distinct pieces: the situation, the ADULT'S OBSERVATION
 * of how the child may be experiencing it, the emotional direction the
 * adult hopes the story supports, and the themes to handle with care. All
 * are the adult's own words, kept verbatim, and archive-only. Prefixed
 * with the child's name only in a multi-child order so one child's context
 * is never read against another. Nothing here is a message to the child.
 */
export function childEmotionalText(
  child: ChildProfile,
  locale: Locale,
  withName: boolean,
): string | undefined {
  const eb = child.emotionalBridge;
  if (!eb) return undefined;
  const c = emotionalLabels(locale);
  const body = joinLines([
    clean(eb.privateContext) ? `1. ${c.situation}: ${clean(eb.privateContext)}` : undefined,
    clean(eb.childExperience) ? `2. ${c.observation}: ${clean(eb.childExperience)}` : undefined,
    clean(eb.intendedFeeling) ? `3. ${c.direction}: ${clean(eb.intendedFeeling)}` : undefined,
    clean(eb.sensitivities) ? `4. ${c.sensitivity}: ${clean(eb.sensitivities)}` : undefined,
  ]);
  if (!body) return undefined;
  return withName && clean(child.name) ? `${clean(child.name)}:\n${body}` : body;
}

/**
 * Order-level "Ko'ngil so'zlari" — every child's private context, in child
 * order, under one clear production-facing header + a standing note that
 * this text is context only and is never copied into the book verbatim.
 * `undefined` when no child filled any of the four fields.
 */
export function orderEmotionalText(
  children: ChildProfile[],
  locale: Locale,
): string | undefined {
  const multi = children.length > 1;
  const parts = children
    .map((ch) => childEmotionalText(ch, locale, multi))
    .filter((p): p is string => !!p);
  if (parts.length === 0) return undefined;
  const c = emotionalLabels(locale);
  return `${c.header}\n(${c.note})\n\n${parts.join("\n\n")}`;
}

/**
 * "Tarbiyaviy yo'nalish" — the values the story should strengthen, taken
 * from every child's `desiredValues`, de-duplicated, order preserved.
 * Returns `undefined` (not `[]`) when no child chose any, so the payload
 * omits `profile.traits` entirely.
 */
export function orderDesiredValueLabels(
  children: ChildProfile[],
  locale: Locale,
): string[] | undefined {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ch of children) {
    for (const v of ch.desiredValues ?? []) {
      const label = valueLabel(v, locale);
      const key = label.toLocaleLowerCase();
      if (label && !seen.has(key)) {
        seen.add(key);
        out.push(label);
      }
    }
  }
  return out.length > 0 ? out : undefined;
}

interface EmotionalLabels {
  header: string;
  note: string;
  situation: string;
  /** Step 2 label — a PARENT OBSERVATION, deliberately not "the child's
   *  emotional state" / anything clinical. */
  observation: string;
  direction: string;
  sensitivity: string;
}

function emotionalLabels(locale: Locale): EmotionalLabels {
  if (locale === "uz") {
    return {
      header: "NOZIK VAZIYAT / HISSIY KONTEKST",
      note:
        "Bu ma'lumotlar kitobga so'zma-so'z ko'chirilmaydi. Hikoyaning hissiy " +
        "yondashuvini tanlash uchun kontekst. Ota-ona kuzatuvi klinik xulosa emas.",
      situation: "Vaziyat",
      observation: "Bolaning holati haqidagi ota-ona / buyurtmachi kuzatuvi",
      direction: "Istalgan hissiy yo'nalish",
      sensitivity: "Ehtiyotkor yondashiladigan mavzular",
    };
  }
  if (locale === "ru") {
    return {
      header: "ДЕЛИКАТНАЯ СИТУАЦИЯ / ЭМОЦИОНАЛЬНЫЙ КОНТЕКСТ",
      note:
        "Эта информация не переносится в книгу дословно. Это контекст для выбора " +
        "эмоционального подхода истории. Наблюдение родителя — не клинический вывод.",
      situation: "Ситуация",
      observation: "Наблюдение родителя / заказчика о состоянии ребёнка",
      direction: "Желаемое эмоциональное направление",
      sensitivity: "Темы, требующие бережного подхода",
    };
  }
  return {
    header: "SENSITIVE SITUATION / EMOTIONAL CONTEXT",
    note:
      "This information is not copied into the book word for word. It is context " +
      "for choosing the story's emotional approach. The parent's observation is not a clinical assessment.",
    situation: "Situation",
    observation: "Parent's / buyer's observation about the child",
    direction: "Desired emotional direction",
    sensitivity: "Themes to approach with care",
  };
}
