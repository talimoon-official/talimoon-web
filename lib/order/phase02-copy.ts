/**
 * TALIMOON — ORDER — Phase 02 ("The child's world") copy + helpers.
 * ================================================================
 * IN SCOPE: Uzbek + English (respectful "Siz" throughout).
 *
 * TALIMOON SAVOL BERMAYDI — SUHBAT OCHADI.
 * SAVOL CHUQUR BO‘LISHI MUMKIN — JAVOB BERISH HECH QACHON QIYIN
 * BO‘LMASLIGI KERAK.
 *
 * Every question opens a NEW layer of the child — never the previous
 * one in different words (spec §20):
 *   QIZIQISHLARI     — WHAT interests the child? (≤ 3, preset or the
 *                       adult's own words — SelectableAnswer[], see
 *                       lib/order/types.ts)
 *   BIR OZ ANIQROQ    — WHAT specifically about EACH chosen interest?
 *                       Deterministic per-item mini-questions, never a
 *                       sentence generated from arbitrary custom text
 *                       (context-aware-selection spec §11–14).
 *   SEVIMLI MASHG‘ULOTI — WHAT does the child actually love DOING?
 *                       (an action, in the adult's words)
 *   ORZUSI            — WHAT does the child dream of becoming — asked
 *                       and answered directly, no "does a dream exist?"
 *                       pre-question. "Hali bu haqda o‘ylab ko‘rmagan"
 *                       swaps this for SIZNING TILAGINGIZ, the ADULT's
 *                       own hope — never presented as the child's own.
 * Then a quiet portrait — "FAYZBEKNING DUNYOSI" — and a bridge toward
 * the child's character.
 */

import type { ChildProfile, InterestAnswer } from "./types";

export type Locale = "uz" | "en" | "ru";

// ── Prepared interest categories — all NOUNS/topics, never activities
//    (an activity is Q3's job; mixing the two blurs Q1 and Q3 into the
//    same question in different words). Specific enough to teach the
//    adult the LEVEL of detail expected — the list doesn't need to
//    cover every child (context-aware-selection spec §06). ──────────
export const INTEREST_KEYS = [
  "football",
  "cars",
  "planes",
  "kittens",
  "wildAnimals",
  "books",
  "nature",
  "music",
  "drawings",
] as const;
export type InterestKey = (typeof INTEREST_KEYS)[number];

/** Both preset and custom answers count toward this same cap. */
export const MAX_PRIMARY_INTERESTS = 3;

const INTEREST_LABELS: Record<InterestKey, Record<Locale, string>> = {
  football: { uz: "Futbol", en: "Football", ru: "Футбол" },
  cars: { uz: "Mashinalar", en: "Cars", ru: "Машины" },
  planes: { uz: "Samolyotlar", en: "Planes", ru: "Самолёты" },
  kittens: { uz: "Mushukchalar", en: "Kittens", ru: "Котята" },
  wildAnimals: { uz: "Yovvoyi hayvonlar", en: "Wild animals", ru: "Дикие животные" },
  books: { uz: "Kitoblar", en: "Books", ru: "Книги" },
  nature: { uz: "Tabiat", en: "Nature", ru: "Природа" },
  music: { uz: "Musiqa", en: "Music", ru: "Музыка" },
  drawings: { uz: "Rasm", en: "Drawing", ru: "Рисование" },
};

export function isInterestKey(v: string): v is InterestKey {
  return (INTEREST_KEYS as readonly string[]).includes(v);
}

/** Display label for one stored interest id — a prepared key maps to
 *  its (locale-reactive) label; anything else is the adult's own
 *  words, shown exactly as typed. Works the same for preset and
 *  custom answers, which is the point (context-aware-selection §01). */
export function interestLabel(id: string, locale: Locale): string {
  return isInterestKey(id) ? INTEREST_LABELS[id][locale] : id.trim();
}

export function interestOptions(
  locale: Locale,
): { key: InterestKey; label: string }[] {
  return INTEREST_KEYS.map((key) => ({ key, label: INTEREST_LABELS[key][locale] }));
}

/**
 * A small CURATED per-preset example for the "a closer look" screen
 * (spec §08–09). Only known presets get one — an arbitrary custom
 * interest falls back to the universal placeholder. No AI, no
 * classification of custom text.
 */
const INTEREST_DETAIL_EXAMPLES: Partial<Record<InterestKey, Record<Locale, string>>> = {
  football: {
    uz: "Masalan: o‘zi o‘ynash, Real Madridni kuzatish, jamoalar...",
    en: "For example: playing it, following Real Madrid, the teams...",
    ru: "Например: играть самому, следить за «Реалом», команды...",
  },
  cars: {
    uz: "Masalan: o‘yinchoq mashinalar, chizish, markalar yoki modellar...",
    en: "For example: toy cars, drawing them, the brands or models...",
    ru: "Например: игрушечные машинки, рисовать их, марки или модели...",
  },
  planes: {
    uz: "Masalan: qanday uchishi, turlari yoki modellarini yig‘ish...",
    en: "For example: how they fly, the types, or building models...",
    ru: "Например: как они летают, виды или сборка моделей...",
  },
  kittens: {
    uz: "Masalan: parvarish qilish, o‘ynash yoki ularning xatti-harakati...",
    en: "For example: caring for them, playing, or how they behave...",
    ru: "Например: заботиться о них, играть или как они себя ведут...",
  },
  wildAnimals: {
    uz: "Masalan: qaysi hayvon, ularning yashashi yoki xatti-harakati...",
    en: "For example: which animal, how they live, or how they behave...",
    ru: "Например: какое животное, как они живут или как себя ведут...",
  },
  books: {
    uz: "Masalan: hikoyalar, rasmlar yoki muayyan mavzular...",
    en: "For example: the stories, the illustrations, or certain topics...",
    ru: "Например: сюжеты, иллюстрации или определённые темы...",
  },
  nature: {
    uz: "Masalan: o‘simliklar, hasharotlar, tosh yig‘ish yoki sayr...",
    en: "For example: plants, insects, collecting stones, or walks...",
    ru: "Например: растения, насекомые, собирать камешки или прогулки...",
  },
  music: {
    uz: "Masalan: tinglash, kuylash yoki biror cholg‘u...",
    en: "For example: listening, singing, or a particular instrument...",
    ru: "Например: слушать, петь или какой-то инструмент...",
  },
  drawings: {
    uz: "Masalan: nima chizadi, ranglar yoki chizib bo‘lib so‘zlab berish...",
    en: "For example: what they draw, the colours, or telling a story about it...",
    ru: "Например: что рисует, цвета или рассказывать историю по рисунку...",
  },
};

/** Placeholder for one interest's detail input — its curated example
 *  when the id is a known preset, otherwise the universal one. */
export function interestDetailPlaceholder(
  id: string,
  locale: Locale,
  fallback: string,
): string {
  return isInterestKey(id) ? INTEREST_DETAIL_EXAMPLES[id]?.[locale] ?? fallback : fallback;
}

function joinList(items: string[], locale: Locale): string {
  const clean = items.map((s) => s.trim()).filter(Boolean);
  if (clean.length <= 1) return clean[0] ?? "";
  const and = locale === "uz" ? " va " : locale === "ru" ? " и " : " and ";
  return clean.slice(0, -1).join(", ") + and + clean[clean.length - 1];
}

/** "Futbol · Mushukchalar" for the portrait row. */
export function interestsDisplay(interests: InterestAnswer[] | undefined, locale: Locale): string {
  return (interests ?? []).map((a) => interestLabel(a.id, locale)).join(" · ");
}

/** All non-empty per-interest details, joined for the portrait's
 *  "AYNIQSA YOQADI" row — never re-worded, shown as written. */
export function interestDetailsDisplay(interests: InterestAnswer[] | undefined): string {
  return (interests ?? [])
    .map((a) => a.detail?.trim())
    .filter((d): d is string => !!d)
    .join(" · ");
}

// ── Copy shape ───────────────────────────────────────────────────
export interface Phase02Copy {
  continue: string;
  back: string;

  /** Portrait title only now — the old per-child "intro" screen that
   *  duplicated this eyebrow is gone (spec §02); Phase 01's completion
   *  screen is the merged introduction into Phase 02. */
  worldLabel: (name: string) => string;

  /** The one selection-tray title reused everywhere a tray appears. */
  trayTitle: string;
  /** "{n} / {max} tanlandi" — shown once at least one is picked. */
  selectionCount: (n: number, max: number) => string;
  removeAnswer: (label: string) => string;

  // Q1 — QIZIQISHLARI: WHAT interests the child?
  q1Label: string;
  q1: (name: string) => string;
  q1Help: string;
  customToggle: string;
  customPlaceholder: string;
  customAdd: string;
  /** Shown once the cap is reached — calm, not an error. */
  interestLimitNote: string;
  errInterests: string;

  // Q2 — BIR OZ ANIQROQ: WHAT specifically about EACH chosen interest?
  //      Deterministic per-item questions — never a sentence generated
  //      from arbitrary custom text (spec §11–14).
  q2Label: string;
  q2: (name: string) => string;
  q2Help: string;
  /** The one universal example — works for ANY interest, preset or
   *  custom, because it never names the interest itself (spec §13). */
  q2Example: string;
  /** The neutral per-item heading question, under each interest's own
   *  label (spec §12: "Bunda aynan nima X ga ko‘proq yoqadi?"). */
  q2ItemQuestion: (name: string) => string;
  q2Placeholder: string;
  q2SkipLabel: string;
  q2SkipSupport: string;

  // Q3 — SEVIMLI MASHG‘ULOTI: WHAT does the child actually love DOING?
  //      Deliberately NOT "what about the interest attracts them" (that
  //      is Q2) — this is the thing they choose to do again and again
  //      (spec §10–11).
  q3Label: string;
  q3: (name: string) => string;
  q3Help: string;
  q3Example: string;
  q3Placeholder: string;
  q3None: string;
  errActivity: string;

  // Q4 — ORZUSI: WHAT does the child dream of becoming? Answered
  //      directly — no "does a dream exist?" pre-question (spec §07).
  q4Label: string;
  q4: (name: string) => string;
  q4Help: string;
  q4Placeholder: string;
  q4NotYet: string;
  errChildDream: string;

  // The adult's hope — swaps in when "Hali bu haqda o‘ylab ko‘rmagan"
  // is chosen. NEVER the child's own words (spec §09).
  q4bTransition: string;
  q4b: (name: string) => string;
  q4bHelp: (name: string) => string;
  q4bPlaceholder: string;
  /** The quiet way back to the dream input, if the adult changes their mind. */
  q4BackToDream: string;
  errAdultHope: string;

  // Portrait section labels
  pLoves: string;
  pDetail: string;
  pAbsorbs: string;
  pDreams: string;
  pHope: string;
  portraitEmpty: string;

  // Between two children (the last child goes straight on to Phase 03)
  nextChildLead: (doneName: string) => string;
  nextChildBridge: (nextName: string) => string;
  nextChildCta: (nextName: string) => string;
}

// ── Uzbek ────────────────────────────────────────────────────────
const uz: Phase02Copy = {
  continue: "Davom etish",
  back: "Orqaga",

  worldLabel: (name) => `${name.trim()}ning dunyosi`,

  trayTitle: "Tanladingiz",
  selectionCount: (n, max) => `${n} / ${max} tanlandi`,
  removeAnswer: (label) => `“${label}” ni olib tashlash`,

  q1Label: "QIZIQISHLARI",
  q1: (name) => `${name.trim()}ni nimalar qiziqtiradi?`,
  q1Help: "3 tagacha tanlang yoki o‘zingiz yozib qo‘shing.",
  customToggle: "＋ Boshqa qiziqishini yozish",
  customPlaceholder: "Masalan: dinozavrlar, poyezdlar, kosmos...",
  customAdd: "Qo‘shish",
  interestLimitNote: "3 ta asosiy qiziqishni tanladingiz. Birini olib tashlab, o‘rniga boshqasini qo‘shsangiz bo‘ladi.",
  errInterests: "Iltimos, kamida bittasini belgilang yoki yozing.",

  q2Label: "BIR OZ ANIQROQ",
  q2: (name) => `Tanlaganlaringizning aynan nimasi ${name.trim()}ga ko‘proq yoqadi?`,
  q2Help: "Har biriga bir necha so‘z bilan aniqlik kiritsangiz yetarli.",
  q2Example:
    "Masalan: qaysi turi, qanday xususiyati yoki undagi nima uning e’tiborini tortadi. (Futbol — o‘zi o‘ynash, futbolchilar yoki jamoalar; mashinalar — o‘ynash, chizish, markalari yoki modellari.)",
  q2ItemQuestion: (name) => `Bunda aynan nima ${name.trim()}ga ko‘proq yoqadi?`,
  q2Placeholder: "Bir necha so‘z bilan yozing...",
  q2SkipLabel: "Asosiylarini esladik",
  q2SkipSupport: "Boshqa muhim detal bo‘lmasa, shuni belgilang va davom eting.",

  q3Label: "SEVIMLI MASHG‘ULOTI",
  q3: (name) => `${name.trim()} nima qilayotganda vaqtni ham unutib qo‘yadi?`,
  q3Help:
    "Bo‘sh vaqti bo‘lsa, hech kim eslatmasdan o‘zi qayta-qayta tanlaydigan mashg‘ulotini eslang.",
  q3Example:
    "Masalan: hovliga chiqib to‘p tepadi, konstruktor bilan uzoq o‘tiradi, rasm chizadi yoki bir narsani qayta-qayta yasab ko‘radi.",
  q3Placeholder: "Masalan: hovlida futbol o‘ynasa, vaqtni unutib qo‘yadi...",
  q3None: "Aniq bir mashg‘uloti yo‘q",
  errActivity: "Iltimos, yozing yoki “Aniq bir mashg‘uloti yo‘q”ni tanlang.",

  q4Label: "ORZUSI",
  q4: (name) => `${name.trim()} katta bo‘lganda kim bo‘lmoqchi?`,
  q4Help: "Masalan: futbolchi, uchuvchi, shifokor, muhandis, rassom...",
  q4Placeholder: "Masalan: uchuvchi...",
  q4NotYet: "Hali bu haqda o‘ylab ko‘rmagan",
  errChildDream: "Iltimos, orzusini yozing.",

  q4bTransition: "Mayli, hali oldinda vaqt ko‘p. 😊",
  q4b: (name) => `Siz ${name.trim()}ning kelajagini qanday tasavvur qilasiz?`,
  q4bHelp: (name) =>
    `${name.trim()} kelajakda qaysi kasb egasi bo‘lishini istashingizni yozishingiz mumkin. Yoki uning mehribon, halol, o‘ziga ishongan va o‘zi sevgan yo‘lini topgan inson bo‘lib ulg‘ayishini istashingizni yozing. Istasangiz, qalbingizdagi boshqa tilakni ham o‘z so‘zlaringiz bilan erkin yozishingiz mumkin.`,
  q4bPlaceholder:
    "Masalan: Shifokor bo‘lishini istardim. Eng muhimi, yaxshi inson bo‘lib, o‘zi sevgan yo‘lini topishini xohlayman...",
  q4BackToDream: "Aslida, orzusi bor",
  errAdultHope: "Iltimos, tilagingizni yozing.",

  pLoves: "QIZIQADI",
  pDetail: "AYNIQSA YOQADI",
  pAbsorbs: "BERILIB QILADI",
  pDreams: "ORZU QILADI",
  pHope: "SIZNING TILAGINGIZ",
  portraitEmpty: "Uni birga kashf etamiz.",

  nextChildLead: (doneName) => `${doneName.trim()}ning dunyosiga ancha yaqinlashdik.`,
  nextChildBridge: (nextName) => `Endi ${nextName.trim()} bilan davom etamiz.`,
  nextChildCta: (nextName) => `${nextName.trim()} bilan tanishamiz`,
};

// ── English ──────────────────────────────────────────────────────
const en: Phase02Copy = {
  continue: "Continue",
  back: "Back",

  worldLabel: (name) => `${name.trim()}'s world`,

  trayTitle: "You've selected",
  selectionCount: (n, max) => `${n} / ${max} selected`,
  removeAnswer: (label) => `Remove “${label}”`,

  q1Label: "INTERESTS",
  q1: (name) => `What interests ${name.trim()}?`,
  q1Help: "Choose up to 3, or write your own.",
  customToggle: "＋ Write another interest",
  customPlaceholder: "For example: dinosaurs, trains, space...",
  customAdd: "Add",
  interestLimitNote: "You've chosen 3 main interests. Remove one to make room for another.",
  errInterests: "Please choose at least one, or write your own.",

  q2Label: "A CLOSER LOOK",
  q2: (name) => `What exactly about the ones you picked does ${name.trim()} enjoy most?`,
  q2Help: "A few words for each is enough.",
  q2Example:
    "For example: which kind, what particular trait, or exactly what catches their attention. (Football — playing it, the players, or the teams; cars — playing, drawing, the brands or models.)",
  q2ItemQuestion: (name) => `What exactly about this does ${name.trim()} enjoy most?`,
  q2Placeholder: "A few words is enough...",
  q2SkipLabel: "We've got the main ones",
  q2SkipSupport: "If there's nothing else important, check this and continue.",

  q3Label: "FAVOURITE ACTIVITY",
  q3: (name) => `What does ${name.trim()} do that makes them lose all track of time?`,
  q3Help:
    "Think of what they choose to do again and again in their free time, without anyone prompting them.",
  q3Example:
    "For example: goes out to kick a ball, sits for ages with building blocks, draws, or makes the same thing over and over.",
  q3Placeholder: "For example: playing football in the yard, they lose all track of time...",
  q3None: "No single activity like that",
  errActivity: "Please write something, or choose “No single activity like that”.",

  q4Label: "DREAM",
  q4: (name) => `What does ${name.trim()} want to be when they grow up?`,
  q4Help: "For example: a footballer, a pilot, a doctor, an engineer, an artist...",
  q4Placeholder: "For example: a pilot...",
  q4NotYet: "They haven't thought about it yet",
  errChildDream: "Please write their dream.",

  q4bTransition: "That's alright — there's plenty of time ahead. 😊",
  q4b: (name) => `How do you picture ${name.trim()}'s future?`,
  q4bHelp: (name) =>
    `You're welcome to write which profession you'd hope ${name.trim()} might have. Or that you hope they grow up kind, honest, self-assured, and doing what they love. Feel free to write any other hope from the heart, in your own words too.`,
  q4bPlaceholder:
    "For example: I'd love for them to become a doctor. But most of all, I hope they grow into a good person who finds what they love...",
  q4BackToDream: "Actually, they do have a dream",
  errAdultHope: "Please write your hope.",

  pLoves: "INTERESTED IN",
  pDetail: "ESPECIALLY LIKES",
  pAbsorbs: "LOSES TIME IN",
  pDreams: "DREAMS OF",
  pHope: "YOUR HOPE",
  portraitEmpty: "We'll discover it together.",

  nextChildLead: (doneName) => `We've come a long way into ${doneName.trim()}'s world.`,
  nextChildBridge: (nextName) => `Now let's carry on with ${nextName.trim()}.`,
  nextChildCta: (nextName) => `Meet ${nextName.trim()}`,
};

// ── Russian (respectful "Вы") ────────────────────────────────────
const ru: Phase02Copy = {
  continue: "Продолжить",
  back: "Назад",

  worldLabel: (name) => `Мир ${name.trim()}`,

  trayTitle: "Вы выбрали",
  selectionCount: (n, max) => `${n} / ${max} выбрано`,
  removeAnswer: (label) => `Убрать «${label}»`,

  q1Label: "ИНТЕРЕСЫ",
  q1: (name) => `Что интересно ${name.trim()}?`,
  q1Help: "Выберите до 3 или напишите свой вариант.",
  customToggle: "＋ Добавить другой интерес",
  customPlaceholder: "Например: динозавры, поезда, космос...",
  customAdd: "Добавить",
  interestLimitNote:
    "Вы выбрали 3 основных интереса. Уберите один, чтобы добавить другой.",
  errInterests: "Пожалуйста, выберите хотя бы один или напишите свой.",

  q2Label: "ЧУТЬ ПОДРОБНЕЕ",
  q2: (name) => `Что именно в выбранном нравится ${name.trim()} больше всего?`,
  q2Help: "По несколько слов на каждый пункт — этого достаточно.",
  q2Example:
    "Например: какой именно вид, какая черта или что конкретно привлекает внимание. (Футбол — играть самому, футболисты или команды; машины — играть, рисовать, марки или модели.)",
  q2ItemQuestion: (name) => `Что именно в этом нравится ${name.trim()} больше всего?`,
  q2Placeholder: "Несколько слов...",
  q2SkipLabel: "Главное мы отметили",
  q2SkipSupport: "Если больше нет важных деталей, отметьте это и продолжайте.",

  q3Label: "ЛЮБИМОЕ ЗАНЯТИЕ",
  q3: (name) => `За каким занятием ${name.trim()} забывает о времени?`,
  q3Help:
    "Вспомните занятие, которое в свободное время он выбирает сам, снова и снова, без напоминаний.",
  q3Example:
    "Например: выбегает во двор погонять мяч, подолгу сидит с конструктором, рисует или снова и снова мастерит одно и то же.",
  q3Placeholder: "Например: играя в футбол во дворе, забывает о времени...",
  q3None: "Нет одного такого занятия",
  errActivity: "Пожалуйста, напишите или выберите «Нет одного такого занятия».",

  q4Label: "МЕЧТА",
  q4: (name) => `Кем ${name.trim()} хочет стать, когда вырастет?`,
  q4Help: "Например: футболист, лётчик, врач, инженер, художник...",
  q4Placeholder: "Например: лётчик...",
  q4NotYet: "Ещё не думал(а) об этом",
  errChildDream: "Пожалуйста, напишите его(её) мечту.",

  q4bTransition: "Ничего страшного — впереди ещё много времени. 😊",
  q4b: (name) => `Каким Вы представляете будущее ${name.trim()}?`,
  q4bHelp: (name) =>
    `Вы можете написать, какую профессию хотели бы для ${name.trim()}. Или что желаете, чтобы он(а) вырос(ла) добрым, честным, уверенным в себе человеком, нашедшим свой путь. А ещё — любое другое пожелание от сердца, своими словами.`,
  q4bPlaceholder:
    "Например: хотел(а) бы, чтобы стал(а) врачом. Но главное — чтобы вырос(ла) хорошим человеком и нашёл(нашла) своё дело...",
  q4BackToDream: "Вообще-то мечта есть",
  errAdultHope: "Пожалуйста, напишите Ваше пожелание.",

  pLoves: "ИНТЕРЕСУЕТСЯ",
  pDetail: "ОСОБЕННО НРАВИТСЯ",
  pAbsorbs: "УХОДИТ С ГОЛОВОЙ",
  pDreams: "МЕЧТАЕТ",
  pHope: "ВАШЕ ПОЖЕЛАНИЕ",
  portraitEmpty: "Откроем это вместе.",

  nextChildLead: (doneName) => `Мы заметно ближе к миру ${doneName.trim()}.`,
  nextChildBridge: (nextName) => `Теперь продолжим с ${nextName.trim()}.`,
  nextChildCta: (nextName) => `Познакомиться с ${nextName.trim()}`,
};

export const PHASE02_COPY: Record<Locale, Phase02Copy> = { uz, en, ru };

export function phase02Copy(locale: string): Phase02Copy {
  return locale === "uz" ? uz : locale === "ru" ? ru : en;
}

// ── Natural summary — only from what the adult actually told us ───
export function composeSummary(child: ChildProfile, locale: Locale): string {
  const parts: string[] = [];
  const interests = (child.interests ?? []).map((a) => {
    const l = interestLabel(a.id, locale);
    return locale === "uz" ? l.toLocaleLowerCase("uz") : l.toLowerCase();
  });
  const details = interestDetailsDisplay(child.interests);

  if (locale === "uz") {
    if (interests.length) parts.push(`${joinList(interests, "uz")}ni yaxshi ko‘radi`);
    if (details) parts.push(details);
    if (child.favoriteActivity?.trim() && !child.noFavoriteActivity) {
      parts.push(`ko‘proq berilib ketadigan mashg‘uloti — ${child.favoriteActivity.trim()}`);
    }
    if (child.dreamStatus === "has-dream" && child.childDream?.trim()) {
      parts.push(`bir kuni ${child.childDream.trim()} orzusida`);
    }
  } else if (locale === "ru") {
    if (interests.length) parts.push(`любит ${joinList(interests, "ru")}`);
    if (details) parts.push(details);
    if (child.favoriteActivity?.trim() && !child.noFavoriteActivity) {
      parts.push(`с головой уходит в ${child.favoriteActivity.trim()}`);
    }
    if (child.dreamStatus === "has-dream" && child.childDream?.trim()) {
      parts.push(`мечтает стать — ${child.childDream.trim()}`);
    }
  } else {
    if (interests.length) parts.push(`loves ${joinList(interests, "en")}`);
    if (details) parts.push(details);
    if (child.favoriteActivity?.trim() && !child.noFavoriteActivity) {
      parts.push(`gets absorbed in ${child.favoriteActivity.trim()}`);
    }
    if (child.dreamStatus === "has-dream" && child.childDream?.trim()) {
      parts.push(`dreams of ${child.childDream.trim()}`);
    }
  }

  if (!parts.length) return "";
  const conj = locale === "uz" ? " va " : locale === "ru" ? " и " : " and ";
  const joined =
    parts.length === 1
      ? parts[0]
      : parts.slice(0, -1).join(", ") + conj + parts[parts.length - 1];
  const sentence = joined.charAt(0).toLocaleUpperCase() + joined.slice(1) + ".";
  return sentence;
}
