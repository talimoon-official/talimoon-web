/**
 * Locked copy for Screens 02-04 of the TALIMOON homepage entrance
 * experience. Screen 01's copy stays inline in IntroScreenOne.tsx
 * (pre-existing, visually locked — not restructured here).
 *
 * `en`/`ru` are explicitly `null`: no approved English/Russian
 * marketing translation exists yet for this exact locked Uzbek copy,
 * and inventing one here would risk shipping a mixed-language intro
 * silently. Each screen component reads `.uz` directly today — same
 * behavior IntroScreenOne already has. Once real EN/RU translations
 * are approved, fill them in here and switch the screen components to
 * `useT(en, uz, ru)` (see lib/i18n/LanguageContext.tsx) — no other
 * architecture change needed.
 */

export interface LocalizedCopy {
  uz: string;
  en: string | null;
  ru: string | null;
}

function uzOnly(uz: string): LocalizedCopy {
  return { uz, en: null, ru: null };
}

export const introScreenTwoCopy = {
  headline: uzOnly("BU YER REELS EMAS."),
  lead: uzOnly("Shunchaki tomosha qilib, o‘tib ketmang."),
  bodyPrimary: uzOnly("Sahifalarni o‘qib, tushunib kuzating."),
  bodySecondary: uzOnly("Siz va farzandingiz uchun albatta manfaat topasiz."),
  cta: uzOnly("Shoshilmay davom etaman"),
};

export const introScreenThreeCopy = {
  headline: uzOnly("TALIMOON FAQAT KITOB EMAS."),
  bodyChild: uzOnly("Bu yerda farzandingiz uchun bilim, tarbiya, hikoyalar va kashfiyotlar bor."),
  bodyParent: uzOnly("Ota-onalar uchun esa foydali bilim va amaliy tavsiyalar bor."),
  anchorPrefix: uzOnly("Barchasining markazida esa"),
  anchorEmphasis: uzOnly("farzandingiz"),
  anchorSuffix: uzOnly("turadi."),
  cta: uzOnly("TALIMOON'ni kashf etaman"),
};

export const introScreenFourCopy = {
  headlineLine1: uzOnly("BU YERDA AYNAN SIZGA"),
  headlineLine2Prefix: uzOnly("KERAKLI NARSA"),
  headlineLine2Emphasis: uzOnly("YASHIRINGAN."),
  bodyLine1: uzOnly("Bo‘limlarni to‘liq ko‘rib chiqing."),
  bodyLine2: uzOnly("U TALIMOON'ning qaysidir sahifasida sizni kutmoqda."),
  bodyLine3: uzOnly("Uni topmasdan chiqib ketmang."),
  cta: uzOnly("Nima ekanini topaman"),
};
