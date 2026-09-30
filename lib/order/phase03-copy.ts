/**
 * TALIMOON — ORDER — Phase 03 ("The child's character") copy + helpers.
 * ================================================================
 * IN SCOPE: Uzbek + English (respectful "Siz"). RU / AR later.
 *
 * TALIMOON never asks "what is wrong with this child". It gathers,
 * respectfully: what the adult appreciates (preset or the adult's own
 * words) → a real moment it shows, or none → up to 3 behaviours they'd
 * gently like to support, or none → when those usually appear → the
 * values the story should strengthen. No diagnosis, no inference, no
 * personality labels. A behaviour is described — the child is never
 * defined by it.
 *
 * Appreciated qualities and growth behaviours are `SelectableAnswer[]`
 * (see lib/order/types.ts) — preset and custom answers share one
 * array, one selection tray, one deterministic follow-up question.
 * Nothing here builds a sentence out of arbitrary custom text.
 */

import type { ChildProfile, QualityAnswer, SelectableAnswer } from "./types";

export type Locale = "uz" | "en" | "ru";

// ── Appreciated qualities ────────────────────────────────────────
export const QUALITY_KEYS = [
  "kind",
  "curious",
  "hardworking",
  "brave",
  "responsible",
  "sincere",
  "patient",
  "quick-minded",
] as const;
export type QualityKey = (typeof QUALITY_KEYS)[number];
export const MAX_QUALITIES = 3;

const QUALITY_LABELS: Record<QualityKey, Record<Locale, string>> = {
  kind: { uz: "Mehribon", en: "Kind", ru: "Добрый" },
  curious: { uz: "Qiziquvchan", en: "Curious", ru: "Любознательный" },
  hardworking: { uz: "Tirishqoq", en: "Hard-working", ru: "Старательный" },
  brave: { uz: "Jasur", en: "Brave", ru: "Смелый" },
  responsible: { uz: "Mas’uliyatli", en: "Responsible", ru: "Ответственный" },
  sincere: { uz: "Samimiy", en: "Sincere", ru: "Искренний" },
  patient: { uz: "Sabrli", en: "Patient", ru: "Терпеливый" },
  "quick-minded": { uz: "Zehni o‘tkir", en: "Quick-minded", ru: "Сообразительный" },
};

// ── Per-quality detail question (spec §4) ────────────────────────
// Each selected quality gets its OWN "when do you notice this?" prompt
// and a concrete for-instance helper — never one shared textarea for
// every quality. `prompt` takes the child's name; `helper` is a fixed
// "Masalan: …" line. Custom qualities fall back to a universal pair
// (see `qualityDetailPrompt` / `qualityDetailHelper`).
const QUALITY_DETAIL: Record<
  QualityKey,
  { prompt: Record<Locale, (name: string) => string>; helper: Record<Locale, string> }
> = {
  kind: {
    prompt: {
      uz: (n) => `${n}ning mehribonligini qaysi paytlarda ko‘proq sezasiz?`,
      en: (n) => `When do you notice ${n}'s kindness most?`,
      ru: (n) => `Когда доброта ${n} заметнее всего?`,
    },
    helper: {
      uz: "Masalan: ukasiga yordam berganda, hayvonlarga g‘amxo‘rlik qilganda yoki kimdir xafa bo‘lsa yoniga borganda.",
      en: "For example: helping a younger sibling, caring for an animal, or going over when someone is upset.",
      ru: "Например: помогает младшему, заботится о животном или подходит к тому, кто расстроен.",
    },
  },
  curious: {
    prompt: {
      uz: (n) => `${n}ning qiziquvchanligi qaysi holatlarda ko‘proq bilinadi?`,
      en: (n) => `When does ${n}'s curiosity show most?`,
      ru: (n) => `Когда любознательность ${n} проявляется сильнее всего?`,
    },
    helper: {
      uz: "Masalan: ko‘p savol berganda, yangi narsalarni sinab ko‘rganda yoki biror narsaning qanday ishlashini bilishga harakat qilganda.",
      en: "For example: asking lots of questions, trying new things, or working out how something works.",
      ru: "Например: задаёт много вопросов, пробует новое или разбирается, как что-то устроено.",
    },
  },
  hardworking: {
    prompt: {
      uz: (n) => `${n}ning tirishqoqligini qaysi paytlarda ko‘proq sezasiz?`,
      en: (n) => `When do you notice ${n}'s effort most?`,
      ru: (n) => `Когда старание ${n} заметнее всего?`,
    },
    helper: {
      uz: "Masalan: qiyin topshiriqdan qochmaganda, mashqni oxirigacha bajarganda yoki bir ishni qayta-qayta urinib ko‘rganda.",
      en: "For example: not shying away from a hard task, finishing a practice, or trying again and again.",
      ru: "Например: не избегает трудного задания, доводит упражнение до конца или пробует снова и снова.",
    },
  },
  brave: {
    prompt: {
      uz: (n) => `${n}ning jasurligini qaysi holatlarda ko‘rgansiz?`,
      en: (n) => `When have you seen ${n}'s courage?`,
      ru: (n) => `Когда Вы видели смелость ${n}?`,
    },
    helper: {
      uz: "Masalan: yangi narsani birinchi bo‘lib sinaganda, qo‘rqqan bo‘lsa ham harakat qilganda yoki haqiqatni ochiq aytganda.",
      en: "For example: being first to try something new, acting despite feeling afraid, or speaking the truth openly.",
      ru: "Например: первым пробует новое, действует, даже когда боится, или открыто говорит правду.",
    },
  },
  responsible: {
    prompt: {
      uz: (n) => `${n}ning mas’uliyatini qaysi paytlarda sezasiz?`,
      en: (n) => `When do you notice ${n}'s sense of responsibility?`,
      ru: (n) => `Когда Вы замечаете ответственность ${n}?`,
    },
    helper: {
      uz: "Masalan: va’dasida turganda, o‘z ishini eslatmasdan bajarganda yoki kichikroq bolaga qaraganda.",
      en: "For example: keeping a promise, doing their part without a reminder, or looking after someone smaller.",
      ru: "Например: держит слово, делает своё дело без напоминаний или присматривает за младшим.",
    },
  },
  sincere: {
    prompt: {
      uz: (n) => `${n}ning samimiyligi qaysi holatlarda bilinadi?`,
      en: (n) => `When does ${n}'s sincerity come through?`,
      ru: (n) => `Когда проявляется искренность ${n}?`,
    },
    helper: {
      uz: "Masalan: xatosini ochiq tan olganda, his-tuyg‘ularini yashirmasdan aytganda yoki chin dildan yordam taklif qilganda.",
      en: "For example: owning a mistake openly, saying how they really feel, or offering help wholeheartedly.",
      ru: "Например: открыто признаёт ошибку, не скрывает своих чувств или от души предлагает помощь.",
    },
  },
  patient: {
    prompt: {
      uz: (n) => `${n}ning sabrini qaysi paytlarda ko‘proq sezasiz?`,
      en: (n) => `When do you notice ${n}'s patience most?`,
      ru: (n) => `Когда терпение ${n} заметнее всего?`,
    },
    helper: {
      uz: "Masalan: navbatini kutganda, biror narsa darrov bo‘lmasa ham xotirjam turganda yoki qiyin ishni shoshmasdan bajarganda.",
      en: "For example: waiting their turn, staying calm when something isn't immediate, or working through a hard task unhurried.",
      ru: "Например: ждёт своей очереди, сохраняет спокойствие, когда что-то не сразу, или без спешки делает трудное дело.",
    },
  },
  "quick-minded": {
    prompt: {
      uz: (n) => `${n}ning zehni o‘tkirligini qaysi holatlarda sezgansiz?`,
      en: (n) => `When have you noticed how sharp ${n}'s mind is?`,
      ru: (n) => `Когда Вы замечали, насколько ${n} сообразителен(льна)?`,
    },
    helper: {
      uz: "Masalan: tez eslab qolganda, masalani tez tushunganda yoki kutilmagan yechim topganda.",
      en: "For example: remembering quickly, grasping a problem fast, or finding an unexpected solution.",
      ru: "Например: быстро запоминает, схватывает задачу на лету или находит неожиданное решение.",
    },
  },
};

// ── Growth behaviours — up to 3, preset or custom ────────────────
// `full`  — what the adult picks (a behaviour, never a label)
// `soft`  — the dignified word shown in the portrait
export const GROWTH_KEYS = [
  "waiting",
  "temper",
  "upset",
  "finishing",
  "order",
  "sharing",
  "confidence",
] as const;
export type GrowthKey = (typeof GROWTH_KEYS)[number];
export const MAX_GROWTH_BEHAVIORS = 3;

const GROWTH: Record<GrowthKey, { full: Record<Locale, string>; soft: Record<Locale, string> }> = {
  waiting: {
    full: { uz: "Sabr qilishga qiynaladi", en: "Finds it hard to wait", ru: "Трудно даётся ожидание" },
    soft: { uz: "Sabr", en: "Patience", ru: "Терпение" },
  },
  temper: {
    full: { uz: "Xohlagani bo‘lmasa tez jahli chiqadi", en: "Gets frustrated when things don't go their way", ru: "Быстро раздражается, когда всё идёт не так, как хочется" },
    soft: { uz: "Xotirjamlik", en: "Staying calm", ru: "Спокойствие" },
  },
  upset: {
    full: { uz: "Tez xafa bo‘ladi", en: "Gets upset easily", ru: "Легко расстраивается" },
    soft: { uz: "Bardosh", en: "Resilience", ru: "Устойчивость" },
  },
  finishing: {
    full: { uz: "Boshlagan ishini oxiriga yetkazishga qiynaladi", en: "Finds it hard to finish what they start", ru: "Трудно доводить начатое до конца" },
    soft: { uz: "Ishni yakunlash", en: "Following through", ru: "Доводить до конца" },
  },
  order: {
    full: { uz: "Tartibga rioya qilishga qiynaladi", en: "Finds it hard to keep to routines", ru: "Трудно придерживаться распорядка" },
    soft: { uz: "Tartib", en: "Routine", ru: "Распорядок" },
  },
  sharing: {
    full: { uz: "Boshqalar bilan bo‘lishishga qiynaladi", en: "Finds sharing hard", ru: "Трудно делиться с другими" },
    soft: { uz: "Baham ko‘rish", en: "Sharing", ru: "Делиться" },
  },
  confidence: {
    full: { uz: "Ba’zan o‘ziga ishonchi yetmay qoladi", en: "Sometimes lacks self-belief", ru: "Иногда не хватает уверенности в себе" },
    soft: { uz: "O‘ziga ishonch", en: "Self-belief", ru: "Уверенность в себе" },
  },
};

// ── Desired values ──────────────────────────────────────────────
export const VALUE_KEYS = [
  "patience",
  "gratitude",
  "manners",
  "responsibility",
  "courage",
  "compassion",
  "purity",
] as const;
export type ValueKey = (typeof VALUE_KEYS)[number];
export const MAX_VALUES = 3;

const VALUE_LABELS: Record<ValueKey, Record<Locale, string>> = {
  patience: { uz: "Sabr", en: "Patience", ru: "Терпение" },
  gratitude: { uz: "Shukr", en: "Gratitude", ru: "Благодарность" },
  manners: { uz: "Odob", en: "Good manners", ru: "Воспитанность" },
  responsibility: { uz: "Mas’uliyat", en: "Responsibility", ru: "Ответственность" },
  courage: { uz: "Jasorat", en: "Courage", ru: "Смелость" },
  compassion: { uz: "Mehr-shafqat", en: "Compassion", ru: "Сострадание" },
  purity: { uz: "Poklik", en: "Purity", ru: "Чистота" },
};

// ── Lookups ─────────────────────────────────────────────────────
export function isQualityKey(v: string): v is QualityKey {
  return (QUALITY_KEYS as readonly string[]).includes(v);
}
export function isGrowthKey(v: string): v is GrowthKey {
  return (GROWTH_KEYS as readonly string[]).includes(v);
}
export function isValueKey(v: string): v is ValueKey {
  return (VALUE_KEYS as readonly string[]).includes(v);
}
/** Display label for one stored quality id — a prepared key resolves
 *  its (locale-reactive) label; anything else is the adult's own
 *  words, shown exactly as typed. */
export function qualityLabel(id: string, locale: Locale): string {
  return isQualityKey(id) ? QUALITY_LABELS[id][locale] : id.trim();
}
/** The "when do you notice this?" question for ONE selected quality —
 *  a tailored prompt for a preset, a neutral one for the adult's own
 *  words (spec §4). */
export function qualityDetailPrompt(id: string, name: string, locale: Locale): string {
  const nm = name.trim();
  if (isQualityKey(id)) return QUALITY_DETAIL[id].prompt[locale](nm);
  if (locale === "uz")
    return `Bu jihat ${nm}da qaysi vaziyatlarda ko‘proq namoyon bo‘ladi?`;
  if (locale === "ru")
    return `В каких ситуациях эта черта заметнее всего у ${nm}?`;
  return `When do you notice this quality most in ${nm}?`;
}
/** The concrete for-instance helper under one quality's detail field. */
export function qualityDetailHelper(id: string, locale: Locale): string {
  if (isQualityKey(id)) return QUALITY_DETAIL[id].helper[locale];
  if (locale === "uz")
    return "Xayolingizga biror kichik voqea yoki odati kelsa yozishingiz mumkin.";
  if (locale === "ru")
    return "Можно рассказать о небольшом случае или привычке, которые приходят на ум.";
  return "You can share a small moment or habit that comes to mind.";
}
export function valueLabel(v: string, locale: Locale): string {
  return isValueKey(v) ? VALUE_LABELS[v][locale] : v.trim();
}
/** Full text the adult chose (preset id or the adult's own words). */
export function growthFull(id: string, locale: Locale): string {
  return isGrowthKey(id) ? GROWTH[id].full[locale] : id.trim();
}
/** Dignified word for the portrait. Custom text is shown as written. */
export function growthSoft(id: string, locale: Locale): string {
  return isGrowthKey(id) ? GROWTH[id].soft[locale] : id.trim();
}

export function qualityOptions(locale: Locale) {
  return QUALITY_KEYS.map((key) => ({ key, label: QUALITY_LABELS[key][locale] }));
}
export function growthOptions(locale: Locale) {
  return GROWTH_KEYS.map((key) => ({ key, label: GROWTH[key].full[locale] }));
}
export function valueOptions(locale: Locale) {
  return VALUE_KEYS.map((key) => ({ key, label: VALUE_LABELS[key][locale] }));
}

function joinList(items: string[], locale: Locale): string {
  const clean = items.map((s) => s.trim()).filter(Boolean);
  if (clean.length <= 1) return clean[0] ?? "";
  const and = locale === "uz" ? " va " : locale === "ru" ? " и " : " and ";
  return clean.slice(0, -1).join(", ") + and + clean[clean.length - 1];
}
export function qualitiesDisplay(list: SelectableAnswer[] | undefined, locale: Locale): string {
  return (list ?? []).map((a) => qualityLabel(a.id, locale)).join(" · ");
}
export function growthDisplay(list: SelectableAnswer[] | undefined, locale: Locale): string {
  return (list ?? []).map((a) => growthSoft(a.id, locale)).join(" · ");
}
export function valuesDisplay(list: string[] | undefined, locale: Locale): string {
  return (list ?? []).map((v) => valueLabel(v, locale)).join(" · ");
}

// ── Copy ─────────────────────────────────────────────────────────
export interface Phase03Copy {
  continue: string;
  back: string;

  charLabel: (name: string) => string;
  introLead: (name: string) => string;
  introSupport: string;

  /** The one selection-tray title reused everywhere a tray appears. */
  trayTitle: string;
  /** "{n} / {max} tanlandi" — shown once at least one is picked. */
  selectionCount: (n: number, max: number) => string;
  removeAnswer: (label: string) => string;

  // Q1 — appreciated qualities
  q1: (name: string) => string;
  q1Help: string;
  customToggle: string;
  customPlaceholder: string;
  customAdd: string;
  limitNote: (max: number) => string;
  errQualities: string;

  // Q2 — a concrete detail PER appreciated quality (spec §4). Each
  //      selected quality has its own prompt (`qualityDetailPrompt`) and
  //      helper (`qualityDetailHelper`); the fields below are only the
  //      screen chrome around those per-quality blocks.
  q2SectionLabel: string;
  q2Intro: string;
  q2Placeholder: string;
  /** The explicit alternative on each quality — the customer is never
   *  made to invent an example. */
  q2ItemNone: string;
  errExample: string;

  // Q3 — up to 3 growth behaviours
  q3: (name: string) => string;
  q3Help: string;
  q3CustomToggle: string;
  q3CustomPlaceholder: string;
  q3CustomHint: string;
  /** ARCHIVE wording — printed into the order payload by `profileText`.
   *  Never reword it for UI reasons; the card uses `q3NoneAnswer`. */
  q3None: string;
  /** The alternative-answer card, in the parent's own voice. */
  q3NoneAnswer: string;
  /** Shown under the card while behaviours are selected (spec §20). */
  q3NoneHelp: string;
  errGrowth: string;

  // Q4 — PER-BEHAVIOUR context (spec §22–26). Each chosen behaviour
  //      gets its own optional "when does this show up?" — one
  //      behaviour's context can never land on another.
  q4SectionLabel: string;
  q4Intro: string;
  q4ItemQuestion: string;
  /** One universal placeholder — works for any behaviour, preset or
   *  custom, because it never names the behaviour. */
  q4ItemPlaceholder: string;
  q4ItemNone: string;

  // Q5 — desired values
  q5: (name: string) => string;
  q5Help: string;
  errValues: string;

  // Portrait labels
  pQualities: string;
  pGrowth: string;
  pValues: string;

  // Milestone
  milestoneHeading: (name: string) => string;
  milestoneBridge: string;
  nextChildLead: (doneName: string) => string;
  nextChildBridge: (nextName: string) => string;
  nextChildCta: (nextName: string) => string;
}

const uz: Phase03Copy = {
  continue: "Davom etish",
  back: "Orqaga",

  charLabel: (name) => `${name.trim()}ning xarakteri`,
  introLead: (name) =>
    `Endi ${name.trim()}ning o‘ziga xos jihatlarini yaxshiroq bilib olamiz.`,
  introSupport:
    "Undagi Siz qadrlaydigan fazilatlar, biroz rivojlantirishni istagan odatlar va hikoyada qo‘llab-quvvatlashimiz kerak bo‘lgan qadriyatlarni birga aniqlaymiz.",

  trayTitle: "Tanladingiz",
  selectionCount: (n, max) => `${n} / ${max} tanlandi`,
  removeAnswer: (label) => `“${label}” ni olib tashlash`,

  q1: (name) => `${name.trim()}ning qaysi jihatlari Sizni quvontiradi?`,
  q1Help: "3 tagacha tanlang yoki o‘zingiz yozib qo‘shing.",
  customToggle: "＋ Boshqa jihatini yozish",
  customPlaceholder: "Masalan: xushmuomala, adolatli, tashabbuskor...",
  customAdd: "Qo‘shish",
  limitNote: (max) => `${max} ta jihatni tanladingiz. Birini olib tashlab, o‘rniga boshqasini qo‘shsangiz bo‘ladi.`,
  errQualities: "Davom etishdan oldin uni ifodalaydigan kamida bitta jihatni tanlang.",

  q2SectionLabel: "SIZ TANLAGAN JIHATLAR",
  q2Intro: "Endi har bir jihatni bir og‘iz aniqlashtiramiz — u qachon ko‘proq seziladi?",
  q2Placeholder: "Bir-ikki jumla yetarli…",
  q2ItemNone: "Hozircha misol esimga kelmadi",
  errExample:
    "Har bir jihat uchun bir misol yozing yoki “Misol hozir xayolimga kelmadi”ni belgilang.",

  q3: (name) => `${name.trim()}ning qaysi odati yoki xatti-harakatlarini biroz yaxshilashni istardingiz?`,
  q3Help:
    "Hikoyada ularga tanbeh bilan emas, voqealar orqali muloyim yo‘l ko‘rsatamiz. 3 tagacha tanlang yoki o‘zingiz yozib qo‘shing.",
  q3CustomToggle: "＋ Boshqa odat yoki vaziyatni yozish",
  q3CustomPlaceholder: "Masalan: yutqazsa tez xafa bo‘ladi, ertalab turishga erinadi...",
  q3CustomHint: "Bolaning o‘zini emas, odat yoki vaziyatni yozing.",
  q3None: "Alohida yaxshilashni istagan odat hozircha yo‘q",
  q3NoneAnswer: "Hozircha bunday odati yo‘q",
  q3NoneHelp: "Buni tanlasangiz, yuqoridagi tanlovlar bekor qilinadi.",
  errGrowth: "Iltimos, birini tanlang yoki “Alohida yaxshilashni istagan odat hozircha yo‘q”ni belgilang.",

  q4SectionLabel: "SIZ BELGILAGAN HOLATLAR",
  q4Intro: "Har biriga, xohlasangiz, bu holat ko‘proq qachon sezilishini yozing.",
  q4ItemQuestion: "Bu holat ko‘proq qachon seziladi?",
  q4ItemPlaceholder:
    "Masalan: o‘yinda yutqazganda yoki xohlagan narsasi darrov bo‘lmaganda...",
  q4ItemNone: "Har xil paytda bo‘ladi",

  q5: (name) => `Hikoya orqali ${name.trim()}da qaysi qadriyatlarni yanada qo‘llab-quvvatlashni istardingiz?`,
  q5Help:
    "Bu fazilatlar unda allaqachon bo‘lishi mumkin — hikoya ularni yanada mustahkamlashga xizmat qiladi. 3 tagacha.",
  errValues: "Iltimos, kamida bitta qadriyatni tanlang.",

  pQualities: "SIZNI QUVONTIRADIGAN JIHATLARI",
  pGrowth: "RIVOJLANTIRAMIZ",
  pValues: "HIKOYADA QO‘LLAB-QUVVATLAYMIZ",

  milestoneHeading: (name) => `${name.trim()}ni endi yanada yaxshiroq taniyapmiz.`,
  milestoneBridge: "Endi hikoyaga bir necha shaxsiy jozibalar qo‘shamiz.",
  nextChildLead: (doneName) => `${doneName.trim()}ni endi yanada yaxshiroq taniyapmiz.`,
  nextChildBridge: (nextName) => `Endi ${nextName.trim()} bilan davom etamiz.`,
  nextChildCta: (nextName) => `${nextName.trim()} bilan davom etamiz`,
};

const en: Phase03Copy = {
  continue: "Continue",
  back: "Back",

  charLabel: (name) => `${name.trim()}'s character`,
  introLead: (name) => `Now let's get to know what makes ${name.trim()} who they are.`,
  introSupport:
    "Together we'll name the qualities you treasure, the habits you'd like to nurture a little, and the values the story should stand behind.",

  trayTitle: "You've selected",
  selectionCount: (n, max) => `${n} / ${max} selected`,
  removeAnswer: (label) => `Remove “${label}”`,

  q1: (name) => `What do you love about ${name.trim()}?`,
  q1Help: "Choose up to 3, or write your own.",
  customToggle: "＋ Write another quality",
  customPlaceholder: "For example: thoughtful, fair, full of initiative...",
  customAdd: "Add",
  limitNote: (max) => `You've chosen ${max} qualities. Remove one to make room for another.`,
  errQualities: "Please choose at least one thing that describes them before continuing.",

  q2SectionLabel: "THE QUALITIES YOU CHOSE",
  q2Intro: "Now a line on each one — when does it show up most?",
  q2Placeholder: "A sentence or two is enough…",
  q2ItemNone: "No example comes to mind yet",
  errExample:
    "For each quality, add an example or check “No example comes to mind right now”.",

  q3: (name) => `Is there a habit or behaviour of ${name.trim()}'s you'd gently like to support?`,
  q3Help:
    "In the story we won't scold — we'll show a gentle way through events. Choose up to 3, or write your own.",
  q3CustomToggle: "＋ Write another habit or situation",
  q3CustomPlaceholder: "For example: gets upset when they lose, is reluctant to get up in the morning...",
  q3CustomHint: "Describe the habit or the situation, not the child.",
  q3None: "Nothing I'd like to work on in particular",
  q3NoneAnswer: "Nothing I'd change right now",
  q3NoneHelp: "Choosing this clears the selections above.",
  errGrowth: "Please choose one, or select “Nothing I'd like to work on in particular”.",

  q4SectionLabel: "THE SITUATIONS YOU CHOSE",
  q4Intro: "For each, if you'd like, add when it tends to show up.",
  q4ItemQuestion: "When does this tend to show up?",
  q4ItemPlaceholder:
    "For example: when they lose a game, or when something isn't available right away...",
  q4ItemNone: "It happens at different times",

  q5: (name) => `Which values would you like the story to strengthen in ${name.trim()}?`,
  q5Help:
    "They may already have these — the story simply helps make them stronger. Up to 3.",
  errValues: "Please choose at least one value.",

  pQualities: "WHAT YOU LOVE IN THEM",
  pGrowth: "GROWING TOWARD",
  pValues: "THE STORY WILL STRENGTHEN",

  milestoneHeading: (name) => `We know ${name.trim()} a little better now.`,
  milestoneBridge: "Now let's add a few personal touches to the story.",
  nextChildLead: (doneName) => `We know ${doneName.trim()} a little better now.`,
  nextChildBridge: (nextName) => `Now let's carry on with ${nextName.trim()}.`,
  nextChildCta: (nextName) => `Carry on with ${nextName.trim()}`,
};

const ru: Phase03Copy = {
  continue: "Продолжить",
  back: "Назад",

  charLabel: (name) => `Характер ${name.trim()}`,
  introLead: (name) =>
    `Теперь узнаем чуть лучше то, что делает ${name.trim()} собой.`,
  introSupport:
    "Вместе назовём качества, которые Вы цените, привычки, которые хотелось бы мягко поддержать, и ценности, за которыми должна стоять история.",

  trayTitle: "Вы выбрали",
  selectionCount: (n, max) => `${n} / ${max} выбрано`,
  removeAnswer: (label) => `Убрать «${label}»`,

  q1: (name) => `Что Вас радует в ${name.trim()}?`,
  q1Help: "Выберите до 3 или напишите свой вариант.",
  customToggle: "＋ Добавить другое качество",
  customPlaceholder: "Например: обходительный, справедливый, с инициативой...",
  customAdd: "Добавить",
  limitNote: (max) =>
    `Вы выбрали ${max} качества. Уберите одно, чтобы добавить другое.`,
  errQualities: "Пожалуйста, выберите хотя бы одно качество, прежде чем продолжить.",

  q2SectionLabel: "ВЫБРАННЫЕ ВАМИ КАЧЕСТВА",
  q2Intro: "Теперь по строчке о каждом — когда оно проявляется чаще всего?",
  q2Placeholder: "Одного-двух предложений достаточно…",
  q2ItemNone: "Пока пример не вспоминается",
  errExample:
    "Для каждого качества добавьте пример или отметьте «Пример сейчас не приходит на ум».",

  q3: (name) =>
    `Есть ли привычка или поведение ${name.trim()}, которые Вы хотели бы мягко поддержать?`,
  q3Help:
    "В истории мы не поучаем — мы бережно показываем путь через события. Выберите до 3 или напишите свой вариант.",
  q3CustomToggle: "＋ Добавить другую привычку или ситуацию",
  q3CustomPlaceholder: "Например: расстраивается, когда проигрывает; неохотно встаёт по утрам...",
  q3CustomHint: "Опишите привычку или ситуацию, а не самого ребёнка.",
  q3None: "Нет ничего, над чем хотелось бы поработать особо",
  q3NoneAnswer: "Сейчас ничего такого нет",
  q3NoneHelp: "Если выбрать это, отметки выше снимутся.",
  errGrowth:
    "Пожалуйста, выберите один пункт или отметьте «Нет ничего, над чем хотелось бы поработать особо».",

  q4SectionLabel: "ВЫБРАННЫЕ ВАМИ СИТУАЦИИ",
  q4Intro: "Для каждой, если хотите, добавьте, когда это обычно проявляется.",
  q4ItemQuestion: "Когда это обычно проявляется?",
  q4ItemPlaceholder:
    "Например: когда проигрывает в игре или когда что-то нельзя получить сразу...",
  q4ItemNone: "Бывает в разное время",

  q5: (name) =>
    `Какие ценности Вы хотели бы, чтобы история укрепила в ${name.trim()}?`,
  q5Help:
    "Возможно, они уже есть — история просто помогает им окрепнуть. До 3.",
  errValues: "Пожалуйста, выберите хотя бы одну ценность.",

  pQualities: "ЧТО ВЫ В НЁМ ЦЕНИТЕ",
  pGrowth: "РАЗВИВАЕМ",
  pValues: "ИСТОРИЯ УКРЕПИТ",

  milestoneHeading: (name) => `Теперь мы знаем ${name.trim()} немного лучше.`,
  milestoneBridge: "Теперь добавим в историю несколько личных штрихов.",
  nextChildLead: (doneName) => `Теперь мы знаем ${doneName.trim()} немного лучше.`,
  nextChildBridge: (nextName) => `Теперь продолжим с ${nextName.trim()}.`,
  nextChildCta: (nextName) => `Продолжить с ${nextName.trim()}`,
};

export const PHASE03_COPY: Record<Locale, Phase03Copy> = { uz, en, ru };
export function phase03Copy(locale: string): Phase03Copy {
  return locale === "uz" ? uz : locale === "ru" ? ru : en;
}

/** The first written per-quality detail (spec §4) — used as the one
 *  illustrative line in a portrait summary. "No example" items and
 *  blank ones are skipped. */
export function firstQualityDetail(list: QualityAnswer[] | undefined): string {
  for (const a of list ?? []) {
    const d = (a.detail ?? "").trim();
    if (d) return d;
  }
  return "";
}

// ── Natural summary — ONLY from supplied answers, no psychology ───
export function composeCharSummary(child: ChildProfile, name: string, locale: Locale): string {
  const q = (child.appreciatedQualities ?? []).map((a) => {
    const l = qualityLabel(a.id, locale);
    return locale === "uz" ? l.toLocaleLowerCase("uz") : l.toLowerCase();
  });
  const vals = (child.desiredValues ?? []).map((v) => {
    const l = valueLabel(v, locale);
    return locale === "uz" ? l.toLocaleLowerCase("uz") : l.toLowerCase();
  });
  const nm = name.trim();
  const example = firstQualityDetail(child.appreciatedQualities);
  const parts: string[] = [];

  if (locale === "uz") {
    if (q.length) parts.push(`${nm}ning ${joinList(q, "uz")} tomonlarini bildik.`);
    if (example) parts.push(example.replace(/\.?$/, "."));
    if (vals.length)
      parts.push(
        `Hikoyada esa ${joinList(vals, "uz")}ni tabiiy voqealar orqali yanada qo‘llab-quvvatlaymiz.`,
      );
  } else if (locale === "ru") {
    if (q.length) parts.push(`Мы увидели, какой ${nm}: ${joinList(q, "ru")}.`);
    if (example) parts.push(example.replace(/\.?$/, "."));
    if (vals.length)
      parts.push(
        `А в истории через естественные события мягко укрепим ${joinList(vals, "ru")}.`,
      );
  } else {
    if (q.length) parts.push(`We've seen ${nm}'s ${joinList(q, "en")} side.`);
    if (example) parts.push(example.replace(/\.?$/, "."));
    if (vals.length)
      parts.push(`In the story we'll gently strengthen ${joinList(vals, "en")}.`);
  }
  return parts.join(" ");
}
