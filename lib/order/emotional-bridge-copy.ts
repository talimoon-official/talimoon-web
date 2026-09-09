/**
 * TALIMOON — ORDER — "KO‘NGIL SO‘ZLARI" copy.
 * ================================================================
 * A psychologically careful PRIVATE-CONTEXT flow. It is NOT therapy,
 * NOT diagnosis, NOT a child-facing message, and NOT Esdalik Sahifasi.
 *
 * Four psychologically distinct stages:
 *   1. VAZIYAT — what is happening (the adult's own words)
 *   2. BOLANING HIS QILISHI MUMKIN BO‘LGAN HOLAT — the ADULT'S OBSERVATION
 *      of how the child MIGHT be experiencing it (a possibility, never
 *      asserted as the child's inner state)
 *   3. ISTALGAN HISSIY YO‘NALISH — the emotional direction the story should
 *      support (warmth, closeness, reassurance, pride, belonging)
 *   4. NIMAGA EHTIYOTKOR YONDASHAYLIK — themes to avoid stating openly or
 *      handle with extra care
 *
 * Rules honoured in the copy:
 *  - never assume a problem exists; every step is skippable, guilt-free
 *  - never blame the parent or the child; no stigmatising terms
 *  - never diagnose (no trauma / disorder / clinical language)
 *  - never force disclosure or force a negative emotion
 *  - fact vs. interpretation: "Sizningcha…", "menimcha…", "tuyuladi"
 *  - not a secret message to the child; no "unga nima demoqchisiz"
 *  - never promise an outcome (fixing the relationship, healing, etc.)
 *
 * IN SCOPE: Uzbek, English, Russian (respectful register throughout).
 */

export type Locale = "uz" | "en" | "ru";

export interface EmotionalBridgeCopy {
  continue: string;
  back: string;
  /** Section eyebrow — the flow's name. */
  eyebrow: string;

  // ---- intro ----
  introHeading: string;
  introBody: string[];
  /** ONE short reassurance line on the intro (the full explanation is
   *  shown once, at the end — see `privacyExplanation`). */
  trustNote: string;
  /** Lighter lead-in when this is not the first child. */
  nextChildLead: (name: string) => string;

  // ---- Step 1 — VAZIYAT ----
  s1Q: (name: string, multi: boolean) => string;
  s1Help: string;
  s1Placeholder: (name: string) => string;
  s1Skip: string;

  // ---- Step 2 — the child's POSSIBLE experience (parent observation) ----
  s2Q: (name: string, multi: boolean) => string;
  s2Help: string;
  s2Placeholder: string;
  s2Skip: string;

  // ---- Step 3 — desired emotional direction ----
  s3Q: (name: string, multi: boolean) => string;
  s3Help: string;
  s3Placeholder: string;

  // ---- Step 4 — sensitivity / boundaries ----
  s4Q: string;
  s4Help: string;
  s4Placeholder: string;
  s4Skip: string;

  // ---- completion ----
  ackHeading: string;
  /** Section H — shown ONCE, on the final screen, before completion. */
  privacyExplanation: string;
  nextChildCta: (name: string) => string;
}

// ── Uzbek ────────────────────────────────────────────────────────
const uz: EmotionalBridgeCopy = {
  continue: "Davom etish",
  back: "Orqaga",
  eyebrow: "KO‘NGIL SO‘ZLARI",

  introHeading: "Bolangizga kechinmalaringizni tushuntira olmayapsizmi?",
  introBody: [
    "Balki orangizda so‘z bilan tushuntirish qiyin bo‘lgan bir holat bordir. Siz uzoqda yashayotgandirsiz, oilada o‘zgarish bo‘lgandir yoki farzandingiz ayrim vaziyatlarni boshqacha tushunayotgandek tuyular.",
    "Yoki uning ayrim odatlari sizni o‘ylantiradi, lekin bu haqda gaplashish har doim ham oson emas.",
    "Xohlasangiz, vaziyatni bizga o‘z so‘zlaringiz bilan bayon qilishingiz mumkin. Alohida vaziyat bo‘lmasa, bu bo‘limni bemalol o‘tkazib yuborishingiz mumkin.",
  ],
  trustNote:
    "Bu ma’lumotlar hikoyaning hissiy yondashuvini tanlash uchun. Ular kitobga so‘zma-so‘z ko‘chirilmaydi va bolaga ko‘rsatilmaydi.",
  nextChildLead: (name) =>
    `${name.trim()} uchun ham — biz bilishimiz foydali bo‘lgan vaziyat bo‘lsa, shu yerda bayon qilishingiz mumkin.`,

  s1Q: (name, multi) =>
    multi
      ? `Siz bilan ${name.trim()} orasida biz bilishimiz foydali bo‘lgan qanday vaziyat bor?`
      : "Farzandingiz bilan orangizda biz bilishimiz foydali bo‘lgan qanday vaziyat bor?",
  s1Help:
    "Masalan: uzoqda yashashingiz yoki safarda bo‘lishingiz, oiladagi o‘zgarish, farzandingiz ayrim vaziyatlarni boshqacha tushunayotgandek tuyulishi yoki sizni o‘ylantirayotgan biror odat. Xohlaganingizcha yozishingiz mumkin.",
  s1Placeholder: (name) => {
    const n = name.trim() || "farzandim";
    return `Masalan: "Men boshqa davlatda ishlayman. ${n} bilan har kuni gaplashishga harakat qilaman, lekin ba’zan u mening uzoqda ekanimni uni kamroq yaxshi ko‘rishim deb tushunayotgandek tuyuladi. Bu holatni unga qanday tushuntirishni har doim ham bilmayman."`;
  },
  s1Skip: "Alohida vaziyat yo‘q",

  s2Q: (name, multi) =>
    multi
      ? `Sizningcha, bu vaziyatda ${name.trim()} nimalarni his qilayotgan bo‘lishi mumkin?`
      : "Sizningcha, bu vaziyatda farzandingiz nimalarni his qilayotgan bo‘lishi mumkin?",
  s2Help:
    "Masalan, xafa bo‘lishi, sog‘inishi, o‘zini tushunilmayotgandek his qilishi, xavotirlanishi yoki aksincha, buni umuman muammo deb bilmasligi mumkin. Aniq bilmasangiz ham hechqisi yo‘q.",
  s2Placeholder:
    "Masalan: Menimcha, u ba’zan meni sog‘inadi va nima uchun uzoqda ekanimni tushunmay qoladi. Lekin bu haqda ochiq gapirmaydi.",
  s2Skip: "Bilmayman yoki aniq ayta olmayman",

  s3Q: (name, multi) =>
    multi
      ? `Bu hikoya ${name.trim()}ga Sizdan qanday tuyg‘uni ko‘proq his qildirsin?`
      : "Bu hikoya farzandingizga Sizdan qanday tuyg‘uni ko‘proq his qildirsin?",
  s3Help:
    "Bu yerda gap aniq bir jumla yoki nasihat haqida emas. Biz hikoyaning hissiy yo‘nalishini tushunmoqchimiz. Masalan: mehr, doimo yonida ekanlik, faxr, sog‘inch, ishonch, o‘zini qadrli yoki xotirjam his qilish, oilaga tegishlilik.",
  s3Placeholder:
    "Masalan: U men uzoqda bo‘lsam ham mehrim kamaymaganini, uni sog‘inishimni va doimo uning tarafida ekanimni his qilishini istayman.",

  s4Q: "Hikoyada biz ayniqsa nimaga ehtiyotkor yondashishimizni istardingiz?",
  s4Help:
    "Ba’zi mavzularni ochiq tilga olishni istamasligingiz yoki farzandingiz uchun nozik bo‘lgan holatlar bo‘lishi mumkin. Xohlasangiz, bizga nimani ehtiyotkorlik bilan yondashishimiz yoki ochiq tilga olmasligimiz kerakligini ayting.",
  s4Placeholder:
    "Masalan: Ajralish haqida to‘g‘ridan-to‘g‘ri gapirilmasin. Otasi uzoqda ekaniga ortiqcha urg‘u berilmasin. Hikoyada ko‘proq mehr, ishonch va yaqinlik sezilsin.",
  s4Skip: "Alohida cheklov yo‘q",

  ackHeading:
    "Rahmat. Bu ma’lumotlar hikoyaning hissiy yondashuvini farzandingizga mosroq tanlashimizga yordam beradi.",
  privacyExplanation:
    "Siz baham ko‘rgan nozik holatlar hikoyada ochiq aytilmaydi va kitobga aynan ko‘chirilmaydi. Ular bizga farzandingizning holatini yaxshiroq his qilish, hikoyadagi mehr va yaqinlikni unga mos, ehtiyotkor yondashuv bilan ifodalashga yordam beradi.",
  nextChildCta: (name) => `${name.trim()} bilan davom etamiz`,
};

// ── English ──────────────────────────────────────────────────────
const en: EmotionalBridgeCopy = {
  continue: "Continue",
  back: "Back",
  eyebrow: "HEARTFELT WORDS",

  introHeading: "Finding it hard to explain what you feel to your child?",
  introBody: [
    "Perhaps there is a situation between you that is hard to put into words. You may live far away, something in the family may have changed, or your child may be making sense of certain things in their own way.",
    "Or perhaps one of their habits is on your mind, and it isn't always easy to talk about.",
    "If you would like to, you can describe the situation to us in your own words. If there is nothing in particular, you can skip this section.",
  ],
  trustNote:
    "This is only so we can choose the story's emotional approach. It is not copied into the book word for word and is not shown to the child.",
  nextChildLead: (name) =>
    `And for ${name.trim()} — if there is something it would help us to understand, you can describe it here too.`,

  s1Q: (name, multi) =>
    multi
      ? `Is there a situation between you and ${name.trim()} that it would help us to understand?`
      : "Is there a situation between you and your child that it would help us to understand?",
  s1Help:
    "For example: living far away or being away travelling, a change in the family, your child making sense of things in their own way, or a habit that is on your mind. Write as much as you like.",
  s1Placeholder: (name) => {
    const n = name.trim() || "my child";
    return `For example: "I work in another country. I try to talk to ${n} every day, but sometimes it seems like they take my being far away to mean I love them less. I don't always know how to explain it to them."`;
  },
  s1Skip: "Nothing in particular",

  s2Q: (name, multi) =>
    multi
      ? `In your view, what might ${name.trim()} be feeling in this situation?`
      : "In your view, what might your child be feeling in this situation?",
  s2Help:
    "For example: sadness, missing you, feeling misunderstood, worry, or, on the contrary, not seeing it as a problem at all. It is completely fine if you are not sure.",
  s2Placeholder:
    "For example: I think they miss me sometimes and don't quite understand why I am far away. But they don't talk about it openly.",
  s2Skip: "I don't know, or can't say for sure",

  s3Q: (name, multi) =>
    multi
      ? `What feeling from you would you most like this story to give ${name.trim()}?`
      : "What feeling from you would you most like this story to give your child?",
  s3Help:
    "This is not about a specific sentence or a piece of advice. We want to understand the story's emotional direction. For example: warmth, always being there for them, pride, longing, trust, feeling valued or calm, a sense of belonging in the family.",
  s3Placeholder:
    "For example: I want them to feel that my love hasn't faded even though I'm far away, that I miss them, and that I'm always on their side.",

  s4Q: "Is there anything you would especially like us to handle with care in the story?",
  s4Help:
    "There may be topics you would rather we did not name openly, or situations that are delicate for your child. If you like, tell us what to approach carefully or leave unstated.",
  s4Placeholder:
    "For example: please don't talk about the separation directly. Don't over-emphasise the father being far away. Let the story carry more warmth, trust and closeness.",
  s4Skip: "No particular limits",

  ackHeading:
    "Thank you. This helps us choose the story's emotional approach so it fits your child better.",
  privacyExplanation:
    "The delicate matters you shared are not stated openly in the story and are not copied into the book verbatim. They help us sense your child's situation better and express the warmth and closeness in the story with a fitting, careful approach.",
  nextChildCta: (name) => `Carry on with ${name.trim()}`,
};

// ── Russian ──────────────────────────────────────────────────────
const ru: EmotionalBridgeCopy = {
  continue: "Продолжить",
  back: "Назад",
  eyebrow: "СЛОВА ОТ СЕРДЦА",

  introHeading: "Трудно объяснить ребёнку то, что вы чувствуете?",
  introBody: [
    "Возможно, между вами есть ситуация, которую сложно выразить словами. Вы можете жить далеко, в семье что-то могло измениться, или ребёнок понимает некоторые вещи по-своему.",
    "Или вас беспокоит какая-то его привычка, а говорить об этом не всегда легко.",
    "Если хотите, опишите ситуацию своими словами. Если ничего особенного нет, этот раздел можно пропустить.",
  ],
  trustNote:
    "Это нужно только для того, чтобы выбрать эмоциональный подход истории. Текст не переносится в книгу дословно и не показывается ребёнку.",
  nextChildLead: (name) =>
    `И для ${name.trim()} — если есть что-то, что поможет нам понять, вы можете описать это здесь.`,

  s1Q: (name, multi) =>
    multi
      ? `Есть ли между вами и ${name.trim()} ситуация, которую нам было бы полезно понять?`
      : "Есть ли между вами и ребёнком ситуация, которую нам было бы полезно понять?",
  s1Help:
    "Например: жизнь вдали или поездки, изменения в семье, ребёнок понимает какие-то вещи по-своему, или привычка, которая вас беспокоит. Пишите столько, сколько хотите.",
  s1Placeholder: (name) => {
    const n = name.trim() || "мой ребёнок";
    return `Например: «Я работаю в другой стране. Я стараюсь разговаривать с ${n} каждый день, но иногда кажется, что он воспринимает мою удалённость как то, что я люблю его меньше. Я не всегда знаю, как ему это объяснить».`;
  },
  s1Skip: "Ничего особенного",

  s2Q: (name, multi) =>
    multi
      ? `Как вам кажется, что ${name.trim()} может чувствовать в этой ситуации?`
      : "Как вам кажется, что ваш ребёнок может чувствовать в этой ситуации?",
  s2Help:
    "Например: грусть, тоску по вам, чувство, что его не понимают, тревогу — или, наоборот, он может вовсе не считать это проблемой. Если вы не уверены — это совершенно нормально.",
  s2Placeholder:
    "Например: мне кажется, он иногда скучает по мне и не совсем понимает, почему я далеко. Но открыто об этом не говорит.",
  s2Skip: "Не знаю или не могу сказать точно",

  s3Q: (name, multi) =>
    multi
      ? `Какое чувство от вас вы больше всего хотели бы, чтобы эта история подарила ${name.trim()}?`
      : "Какое чувство от вас вы больше всего хотели бы, чтобы эта история подарила вашему ребёнку?",
  s3Help:
    "Речь не о конкретной фразе или наставлении. Мы хотим понять эмоциональное направление истории. Например: тепло, ощущение, что вы всегда рядом, гордость, тоску, доверие, чувство собственной ценности или спокойствия, принадлежность к семье.",
  s3Placeholder:
    "Например: я хочу, чтобы он чувствовал, что моя любовь не стала меньше, даже если я далеко, что я скучаю по нему и всегда на его стороне.",

  s4Q: "Есть ли что-то, к чему нам стоит отнестись особенно бережно в истории?",
  s4Help:
    "Могут быть темы, которые вы не хотели бы называть открыто, или ситуации, деликатные для вашего ребёнка. Если хотите, скажите, к чему подойти осторожно или что оставить без прямого упоминания.",
  s4Placeholder:
    "Например: пожалуйста, не говорите о расставании напрямую. Не делайте лишнего акцента на том, что отец далеко. Пусть в истории будет больше тепла, доверия и близости.",
  s4Skip: "Без особых ограничений",

  ackHeading:
    "Спасибо. Это поможет нам выбрать эмоциональный подход истории так, чтобы он лучше подошёл вашему ребёнку.",
  privacyExplanation:
    "Деликатные обстоятельства, которыми вы поделились, не проговариваются в истории открыто и не переносятся в книгу дословно. Они помогают нам лучше почувствовать ситуацию ребёнка и выразить тепло и близость в истории подходящим, бережным образом.",
  nextChildCta: (name) => `Продолжить с ${name.trim()}`,
};

export const EMOTIONAL_BRIDGE_COPY: Record<Locale, EmotionalBridgeCopy> = { uz, en, ru };

export function emotionalBridgeCopy(locale: string): EmotionalBridgeCopy {
  return locale === "uz" ? uz : locale === "ru" ? ru : en;
}
