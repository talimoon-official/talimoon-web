"use client";

/**
 * TALIMOON Publication Consent v1 — the customer-facing review + grant form.
 *
 * Reached ONLY after the book is delivered, via a unique link TALIMOON sends
 * the customer. This is a SEPARATE, explicitly-scoped consent — it is not the
 * order/privacy consent and is never bundled into it. Defaults are
 * privacy-minimising: the child's first name and photo are off unless the
 * customer turns them on. No selection is submitted, and nothing is
 * published, until the customer both ticks "I agree" and presses the button.
 */

import { useState, useTransition } from "react";
import { useT } from "@/lib/i18n/LanguageContext";
import type { ConsentReview } from "@/lib/memory/api";
import { grantConsent, type GrantResult } from "@/app/publish/[consentToken]/actions";

const EN = {
  eyebrow: "TALIMOON Publication Consent",
  heading: "Share this memory in the Story Library?",
  intro:
    "The book has been delivered. If you'd like, the words left on its final page can appear publicly in the TALIMOON Story Library. This is entirely optional, and you can make it private again at any time — the QR code in the book keeps working either way.",
  previewTitle: "What was written",
  writtenBy: "Written by",
  chooseTitle: "Choose what may be shown publicly",
  opt: {
    message: "The written words",
    audio: "The voice recording",
    speakerDisplayName: "The name it was written by",
    relationship: "The relationship (e.g. grandparent)",
    childFirstName: "The child's first name",
    childPhoto: "The child's photograph",
  },
  privacyHint: "The surname, phone number, address, and order details are never shared.",
  agree: "I confirm I have the authority to share this, and I consent to it being shown publicly with the options selected above.",
  submit: "Publish to the Story Library",
  working: "Publishing…",
  successTitle: "Published",
  successBody: "It's now visible in the Story Library. You can make it private again whenever you like by contacting TALIMOON.",
  viewPublic: "View the public page",
  alreadyTitle: "Already shared",
  alreadyBody: "This memory is already public in the Story Library.",
  notReadyTitle: "Not available yet",
  notReadyBody: "This link isn't ready. If the book has just been delivered, please try again shortly or contact TALIMOON.",
  notFoundTitle: "Link not found",
  notFoundBody: "This consent link is invalid or has expired. Please contact TALIMOON for a new one.",
  errorBody: "Something went wrong. Please try again, or contact TALIMOON.",
};
const UZ: typeof EN = {
  eyebrow: "TALIMOON ommaviy qilish roziligi",
  heading: "Bu xotirani Hikoyalar kutubxonasida ulashamizmi?",
  intro:
    "Kitob yetkazib berildi. Agar xohlasangiz, uning so'nggi sahifasiga qoldirilgan so'zlar TALIMOON Hikoyalar kutubxonasida ommaviy ko'rinishi mumkin. Bu butunlay ixtiyoriy va istalgan vaqtda yana shaxsiy qilishingiz mumkin — kitobdagi QR kod har holatda ishlashda davom etadi.",
  previewTitle: "Nima yozilgan",
  writtenBy: "Muallif",
  chooseTitle: "Ommaviy ko'rsatilishi mumkin bo'lganini tanlang",
  opt: {
    message: "Yozilgan so'zlar",
    audio: "Ovozli yozuv",
    speakerDisplayName: "Muallifning ismi",
    relationship: "Qarindoshlik (masalan, buvi/bobo)",
    childFirstName: "Bolaning ismi",
    childPhoto: "Bolaning surati",
  },
  privacyHint: "Familiya, telefon raqami, manzil va buyurtma tafsilotlari hech qachon ulashilmaydi.",
  agree: "Buni ulashishga vakolatim borligini tasdiqlayman va yuqorida tanlangan variantlar bilan ommaviy ko'rsatilishiga roziman.",
  submit: "Hikoyalar kutubxonasida e'lon qilish",
  working: "E'lon qilinmoqda…",
  successTitle: "E'lon qilindi",
  successBody: "U endi Hikoyalar kutubxonasida ko'rinadi. TALIMOON bilan bog'lanib, istalgan vaqtda yana shaxsiy qilishingiz mumkin.",
  viewPublic: "Ommaviy sahifani ko'rish",
  alreadyTitle: "Allaqachon ulashilgan",
  alreadyBody: "Bu xotira Hikoyalar kutubxonasida allaqachon ommaviy.",
  notReadyTitle: "Hali mavjud emas",
  notReadyBody: "Bu havola hali tayyor emas. Agar kitob endigina yetkazilgan bo'lsa, birozdan so'ng qayta urinib ko'ring yoki TALIMOON bilan bog'laning.",
  notFoundTitle: "Havola topilmadi",
  notFoundBody: "Bu rozilik havolasi yaroqsiz yoki muddati o'tgan. Yangisini olish uchun TALIMOON bilan bog'laning.",
  errorBody: "Xatolik yuz berdi. Qayta urinib ko'ring yoki TALIMOON bilan bog'laning.",
};
const RU: typeof EN = {
  eyebrow: "Согласие на публикацию TALIMOON",
  heading: "Поделиться этим воспоминанием в Библиотеке историй?",
  intro:
    "Книга доставлена. При желании слова, оставленные на её последней странице, могут появиться публично в Библиотеке историй TALIMOON. Это полностью по желанию, и вы можете в любой момент снова сделать это личным — QR-код в книге продолжит работать в любом случае.",
  previewTitle: "Что было написано",
  writtenBy: "Автор",
  chooseTitle: "Выберите, что можно показывать публично",
  opt: {
    message: "Написанные слова",
    audio: "Аудиозапись",
    speakerDisplayName: "Имя автора",
    relationship: "Родство (например, бабушка/дедушка)",
    childFirstName: "Имя ребёнка",
    childPhoto: "Фотография ребёнка",
  },
  privacyHint: "Фамилия, номер телефона, адрес и детали заказа никогда не публикуются.",
  agree: "Я подтверждаю, что имею право поделиться этим, и согласен(на) на публичный показ с выбранными выше параметрами.",
  submit: "Опубликовать в Библиотеке историй",
  working: "Публикуется…",
  successTitle: "Опубликовано",
  successBody: "Теперь это видно в Библиотеке историй. Вы можете снова сделать это личным в любой момент, связавшись с TALIMOON.",
  viewPublic: "Открыть публичную страницу",
  alreadyTitle: "Уже опубликовано",
  alreadyBody: "Это воспоминание уже публично в Библиотеке историй.",
  notReadyTitle: "Пока недоступно",
  notReadyBody: "Эта ссылка ещё не готова. Если книгу только что доставили, попробуйте позже или свяжитесь с TALIMOON.",
  notFoundTitle: "Ссылка не найдена",
  notFoundBody: "Эта ссылка согласия недействительна или устарела. Свяжитесь с TALIMOON для новой.",
  errorBody: "Что-то пошло не так. Попробуйте снова или свяжитесь с TALIMOON.",
};

type ToggleKey = "message" | "audio" | "speakerDisplayName" | "relationship" | "childFirstName" | "childPhoto";

const SITE = "https://www.talimoon.com";

export default function PublishConsentForm({
  token,
  review,
}: {
  token: string;
  review: ConsentReview | null;
}) {
  const t = useT(EN, UZ, RU);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<GrantResult | null>(null);

  const s = review?.suggestedScope;
  const [scope, setScope] = useState<Record<ToggleKey, boolean>>({
    message: s?.message ?? true,
    audio: s?.audio ?? false,
    speakerDisplayName: s?.speakerDisplayName ?? true,
    relationship: s?.relationship ?? true,
    childFirstName: s?.childFirstName ?? false,
    childPhoto: s?.childPhoto ?? false,
  });
  const [agree, setAgree] = useState(false);

  if (!review) {
    return <Notice title={t.notFoundTitle} body={t.notFoundBody} />;
  }
  if (review.alreadyPublic || result?.reason === "already_public") {
    return <Notice title={t.alreadyTitle} body={t.alreadyBody} />;
  }
  if (!review.orderDelivered) {
    return <Notice title={t.notReadyTitle} body={t.notReadyBody} />;
  }
  if (result?.ok) {
    const url = result.slug ? `${SITE}/story-library/words/${result.slug}` : null;
    return (
      <Notice title={t.successTitle} body={t.successBody}>
        {url && (
          <a href={url} className="mt-4 inline-block text-sm text-[#B8935B] underline underline-offset-4">
            {t.viewPublic}
          </a>
        )}
      </Notice>
    );
  }

  const toggles: ToggleKey[] = [
    "message",
    ...(review.preview.hasAudio ? (["audio"] as ToggleKey[]) : []),
    "speakerDisplayName",
    "relationship",
    "childFirstName",
    "childPhoto",
  ];

  const submit = () => {
    if (!agree || pending) return;
    startTransition(async () => {
      const r = await grantConsent(token, {
        finalPage: false,
        audio: scope.audio,
        message: scope.message,
        speakerDisplayName: scope.speakerDisplayName,
        relationship: scope.relationship,
        childFirstName: scope.childFirstName,
        childPhoto: scope.childPhoto,
      });
      setResult(r);
    });
  };

  return (
    <div className="mx-auto max-w-xl px-6 py-14 sm:py-20 text-[#2b2118]">
      <p className="text-[0.7rem] tracking-[0.22em] uppercase text-[#a68d63]">{t.eyebrow}</p>
      <h1 className="mt-3 font-serif text-2xl sm:text-3xl">{t.heading}</h1>
      <p className="mt-4 text-sm leading-relaxed text-[#6b5d49]">{t.intro}</p>

      <section className="mt-8 rounded-xl bg-[#fdfaf3] ring-1 ring-[#e7dcc6] px-6 py-6">
        <p className="text-xs uppercase tracking-[0.14em] text-[#a68d63]">{t.previewTitle}</p>
        <blockquote className="mt-2 font-serif text-[1.05rem] leading-relaxed whitespace-pre-line text-[#3a2e1f]">
          {review.preview.message}
        </blockquote>
        <p className="mt-3 text-xs text-[#8a7a5f]">
          {t.writtenBy}: {review.preview.storyGiverDisplayName}
        </p>
      </section>

      <fieldset className="mt-8">
        <legend className="text-sm font-medium">{t.chooseTitle}</legend>
        <div className="mt-3 space-y-2.5">
          {toggles.map((k) => (
            <label key={k} className="flex items-start gap-3 text-sm text-[#3a2e1f]">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[#3a2e1f]"
                checked={scope[k]}
                onChange={(e) => setScope((p) => ({ ...p, [k]: e.target.checked }))}
              />
              <span>{t.opt[k]}</span>
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-[#a68d63]">{t.privacyHint}</p>
      </fieldset>

      <label className="mt-8 flex items-start gap-3 text-sm text-[#3a2e1f]">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-[#3a2e1f]"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
        />
        <span>{t.agree}</span>
      </label>

      {result && !result.ok && (
        <p className="mt-4 text-sm text-[#b4462f]">{t.errorBody}</p>
      )}

      <button
        type="button"
        disabled={!agree || pending}
        onClick={submit}
        className="mt-6 w-full rounded-lg bg-[#3a2e1f] px-5 py-3 text-sm font-medium text-[#f6f1e7] disabled:opacity-40"
      >
        {pending ? t.working : t.submit}
      </button>
    </div>
  );
}

function Notice({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center text-[#2b2118]">
      <h1 className="font-serif text-2xl">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#6b5d49]">{body}</p>
      {children}
    </div>
  );
}
