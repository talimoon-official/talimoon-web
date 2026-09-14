/**
 * Approved copy for all four screens of the TALIMOON homepage entrance
 * experience, in the three languages LanguageContext's `useT` supports
 * (see lib/i18n/LanguageContext.tsx). Each screen exports one `{ en,
 * uz, ru }` object — the exact shape `useT(en, uz, ru)` expects — so a
 * screen component just does:
 *
 *   const t = useT(introScreenOneCopy.en, introScreenOneCopy.uz, introScreenOneCopy.ru);
 *
 * UZ wording is the original locked/approved copy and must not be
 * reworded. EN and RU are polished, natural translations (not literal
 * word-for-word), approved for this task. Russian punctuation is
 * normalized to avoid the long em dash character per TALIMOON's
 * customer-facing copy rule — two lines in the approved RU draft used
 * "—" and were rephrased without changing meaning (see Screen 3).
 *
 * Screen 4's headline is structured as `headlineBefore` / `headlineEmphasis`
 * / `headlineAfter` (rather than the two hard-coded lines the original
 * UZ-only draft used) so the same restrained typographic emphasis
 * applies regardless of where each language's sentence naturally
 * places its "hidden" concept, without forcing a translation to fit an
 * arbitrary line break.
 */

export interface IntroScreenOneCopy {
  headlineLine1: string;
  headlineLine2: string;
  questionLine1: string;
  questionLine2: string;
  cta: string;
}

export interface IntroScreenTwoCopy {
  headline: string;
  lead: string;
  bodyPrimary: string;
  bodySecondary: string;
  cta: string;
}

export interface IntroScreenThreeCopy {
  headline: string;
  bodyChild: string;
  bodyParent: string;
  anchorPrefix: string;
  anchorEmphasis: string;
  anchorSuffix: string;
  cta: string;
}

export interface IntroScreenFourCopy {
  headlineBefore: string;
  headlineEmphasis: string;
  headlineAfter: string;
  bodyLine1: string;
  bodyLine2: string;
  bodyLine3: string;
  cta: string;
}

export const introScreenOneCopy: { en: IntroScreenOneCopy; uz: IntroScreenOneCopy; ru: IntroScreenOneCopy } = {
  uz: {
    headlineLine1: "BIR LAHZA",
    headlineLine2: "TO‘XTANG.",
    questionLine1: "Farzandingizni qanchalik",
    questionLine2: "yaxshi bilasiz?",
    cta: "Birga bilib olamiz",
  },
  en: {
    headlineLine1: "PAUSE",
    headlineLine2: "FOR A MOMENT.",
    questionLine1: "How well do you really",
    questionLine2: "know your child?",
    cta: "Let's find out together",
  },
  ru: {
    headlineLine1: "НА МГНОВЕНИЕ",
    headlineLine2: "ОСТАНОВИТЕСЬ.",
    questionLine1: "Насколько хорошо вы",
    questionLine2: "знаете своего ребёнка?",
    cta: "Давайте узнаем вместе",
  },
};

export const introScreenTwoCopy: { en: IntroScreenTwoCopy; uz: IntroScreenTwoCopy; ru: IntroScreenTwoCopy } = {
  uz: {
    headline: "BU YER REELS EMAS.",
    lead: "Shunchaki tomosha qilib, o‘tib ketmang.",
    bodyPrimary: "Sahifalarni o‘qib, tushunib kuzating.",
    bodySecondary: "Siz va farzandingiz uchun albatta manfaat topasiz.",
    cta: "Shoshilmay davom etaman",
  },
  en: {
    headline: "THIS ISN'T REELS.",
    lead: "Don't just watch and move on.",
    bodyPrimary: "Read the pages. Take them in.",
    bodySecondary: "You'll find something valuable for you and your child.",
    cta: "I'll take my time",
  },
  ru: {
    headline: "ЭТО НЕ REELS.",
    lead: "Не просто смотрите и листайте дальше.",
    bodyPrimary: "Читайте страницы внимательно и вдумчиво.",
    bodySecondary: "Здесь вы обязательно найдёте пользу для себя и своего ребёнка.",
    cta: "Продолжу не спеша",
  },
};

export const introScreenThreeCopy: { en: IntroScreenThreeCopy; uz: IntroScreenThreeCopy; ru: IntroScreenThreeCopy } = {
  uz: {
    headline: "TALIMOON FAQAT KITOB EMAS.",
    bodyChild: "Bu yerda farzandingiz uchun bilim, tarbiya, hikoyalar va kashfiyotlar bor.",
    bodyParent: "Ota-onalar uchun esa foydali bilim va amaliy tavsiyalar bor.",
    anchorPrefix: "Barchasining markazida esa",
    anchorEmphasis: "farzandingiz",
    anchorSuffix: " turadi.",
    cta: "TALIMOON'ni kashf etaman",
  },
  en: {
    headline: "TALIMOON IS MORE THAN BOOKS.",
    bodyChild: "Here you'll find knowledge, character-building, stories and discoveries for your child.",
    bodyParent: "For parents, there is practical knowledge and guidance you can use.",
    anchorPrefix: "At the heart of it all is",
    anchorEmphasis: "your child",
    anchorSuffix: ".",
    cta: "Discover TALIMOON",
  },
  ru: {
    // Approved draft used "TALIMOON — НЕ ТОЛЬКО КНИГИ." and "И в
    // центре всего этого — ваш ребёнок."; both rephrased below without
    // an em dash, meaning unchanged.
    headline: "TALIMOON НЕ ТОЛЬКО КНИГИ.",
    bodyChild: "Здесь вашего ребёнка ждут знания, воспитание, истории и открытия.",
    bodyParent: "А для родителей здесь есть полезные знания и практические рекомендации.",
    anchorPrefix: "В центре всего этого находится",
    anchorEmphasis: "ваш ребёнок",
    anchorSuffix: ".",
    cta: "Открыть для себя TALIMOON",
  },
};

export const introScreenFourCopy: { en: IntroScreenFourCopy; uz: IntroScreenFourCopy; ru: IntroScreenFourCopy } = {
  uz: {
    headlineBefore: "BU YERDA AYNAN SIZGA KERAKLI NARSA ",
    headlineEmphasis: "YASHIRINGAN.",
    headlineAfter: "",
    bodyLine1: "Bo‘limlarni to‘liq ko‘rib chiqing.",
    bodyLine2: "U TALIMOON'ning qaysidir sahifasida sizni kutmoqda.",
    bodyLine3: "Uni topmasdan chiqib ketmang.",
    cta: "Nima ekanini topaman",
  },
  en: {
    headlineBefore: "SOMETHING YOU NEED ",
    headlineEmphasis: "IS HIDDEN",
    headlineAfter: " HERE.",
    bodyLine1: "Explore the sections fully.",
    bodyLine2: "It's waiting for you somewhere inside TALIMOON.",
    bodyLine3: "Don't leave without finding it.",
    cta: "I'll find it",
  },
  ru: {
    headlineBefore: "ЗДЕСЬ ",
    headlineEmphasis: "СКРЫТО",
    headlineAfter: " ИМЕННО ТО, ЧТО ВАМ НУЖНО.",
    bodyLine1: "Изучите разделы внимательно.",
    bodyLine2: "Это ждёт вас на одной из страниц TALIMOON.",
    bodyLine3: "Не уходите, пока не найдёте.",
    cta: "Я найду это",
  },
};
