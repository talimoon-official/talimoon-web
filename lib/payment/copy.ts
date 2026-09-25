/**
 * Customer copy for the post-submit stage: the "order saved" decision screen,
 * the "pay later" confirmation, and the separate payment page.
 *
 * The rule every string obeys: SAVED ≠ PAID ≠ IN PRODUCTION. Nothing here may
 * say (or imply) that preparation/production has started — that only becomes
 * true at IN_PRODUCTION, whose label lives in ./status.ts. The Uzbek strings
 * are the approved canonical wording.
 */

import type { PaymentLocale } from "./status";

export interface PaymentCopy {
  brand: string;
  orderCodeLabel: string;
  statusLabel: string;
  productionNotice: string;

  // ── "order saved" decision screen ───────────────────────────────────
  savedTitle: string;
  savedBody: string;
  payNow: string;
  payLater: string;
  /** shown only when the backend returned no payment link (older backend) */
  savedNoLink: string;

  // ── pay later ───────────────────────────────────────────────────────
  laterTitle: string;
  laterBody: string;
  laterNotice: string;
  linkHeading: string;
  linkBody: string;
  linkValidUntil: (date: string) => string;
  copyLink: string;
  linkCopied: string;
  lostLink: string;
  contactTelegram: string;

  // ── payment page ────────────────────────────────────────────────────
  loading: string;
  awaitingTitle: string;
  amountLabel: string;
  currencyLabel: string;
  howToPayHeading: string;
  howToPaySteps: (amount: string) => string[];
  cardNumberLabel: string;
  cardHolderLabel: string;
  copyAction: string;
  copiedAction: string;
  receiptLabel: string;
  receiptHint: string;
  receiptChoose: string;
  receiptReplace: string;
  receiptNotAllowed: string;
  receiptTooLarge: string;
  submitPayment: string;
  submittingPayment: string;
  submitFailed: string;
  submittedTitle: string;
  submittedBody: string;
  paidBody: string;
  cancelledBody: string;

  // ── safe states ─────────────────────────────────────────────────────
  invalidTitle: string;
  invalidBody: string;
  notPayableTitle: string;
  notPayableBody: string;
  networkTitle: string;
  networkBody: string;
  retry: string;
  savedReassurance: string;
  /** invalid/expired link: we cannot know an order exists, so conditional */
  invalidReassurance: string;
  // ── payment code (short credential, e.g. K7M4P2) ─────────────────────
  paymentCodeLabel: string;
  /** under the code block on the saved screen */
  paymentCodeHelper: string;
  /** under the code block on the pay-later screen */
  laterCodeHelper: string;
  /** small hint inside the code block */
  codeKeepHint: string;
  copyCode: string;
  codeCopied: string;
  /** "talimoon.com/pay" row label */
  payAccessLabel: string;
  /** automated delivery confirmed by the provider — only then */
  deliveredSms: string;
  deliveredWhatsapp: string;
  /** shown when automated delivery did NOT confirm */
  saveCodeNotice: string;

  // ── /pay ────────────────────────────────────────────────────────────
  payTitle: string;
  payDescription: string;
  payInputLabel: string;
  payOpen: string;
  payOpening: string;
  payInvalid: string;
  payRateLimited: string;
  payNetwork: string;
  paySupport: string;

  // ── order entry: two paths ──────────────────────────────────────────
  entryEyebrow: string;
  newOrderTitle: string;
  newOrderBody: string;
  newOrderCta: string;
  existingTitle: string;
  existingBody: string;
  existingCta: string;
}

const UZ: PaymentCopy = {
  brand: "TALIMOON",
  orderCodeLabel: "Buyurtma raqami",
  statusLabel: "Holati",
  productionNotice:
    "Buyurtmangizni tayyorlash jarayoni to‘lov tasdiqlangandan keyin boshlanadi.",

  savedTitle: "Buyurtmangiz saqlandi",
  savedBody:
    "Ma’lumotlaringiz va buyurtma raqamingiz saqlandi. Formani qayta to‘ldirishingiz shart emas.",
  payNow: "Hozir to‘lash",
  payLater: "Keyinroq to‘lash",
  savedNoLink:
    "To‘lov havolasini jamoamiz Siz ko‘rsatgan telefon raqamiga yuboradi.",

  laterTitle: "To‘lov kutilmoqda",
  laterBody: "Buyurtmangiz saqlangan. Uni qayta to‘ldirishingiz shart emas.",
  laterNotice: "Tayyorlash jarayoni to‘lov tasdiqlangandan keyin boshlanadi.",
  linkHeading: "Shaxsiy to‘lov havolangiz",
  linkBody:
    "Keyinroq to‘lash uchun ushbu havolani saqlab qo‘ying. U faqat Sizning buyurtmangizni ochadi va faqat to‘lov uchun ishlaydi.",
  linkValidUntil: (date) => `Havola ${date} gacha amal qiladi.`,
  copyLink: "Havolani nusxalash",
  linkCopied: "Nusxalandi",
  lostLink:
    "To‘lov kodini yoki havolani yo‘qotsangiz, Telegram orqali buyurtma raqamingizni yozing — Sizga yangisini yuboramiz.",
  contactTelegram: "Telegram orqali yozish",

  loading: "Buyurtmangiz ochilmoqda…",
  awaitingTitle: "To‘lov kutilmoqda",
  amountLabel: "To‘lov miqdori",
  currencyLabel: "Valyuta",
  howToPayHeading: "Qanday to‘lanadi",
  howToPaySteps: (amount) => [
    `Quyidagi kartaga aynan ${amount} o‘tkazing.`,
    "To‘lov chekini yoki bank ilovasidagi skrinshotni yuklang.",
    "Jamoamiz to‘lovni tekshirib, tasdiqlaydi.",
  ],
  cardNumberLabel: "Karta raqami",
  cardHolderLabel: "Karta egasi",
  copyAction: "Nusxalash",
  copiedAction: "Nusxalandi",
  receiptLabel: "To‘lov cheki",
  receiptHint: "Rasm (JPG, PNG, HEIC) yoki PDF, 25 MB gacha.",
  receiptChoose: "Chekni tanlash",
  receiptReplace: "Boshqa fayl tanlash",
  receiptNotAllowed: "Iltimos, rasm yoki PDF faylni tanlang.",
  receiptTooLarge: "Fayl juda katta. 25 MB gacha bo‘lgan faylni tanlang.",
  submitPayment: "To‘lovni yuborish",
  submittingPayment: "Yuborilmoqda…",
  submitFailed:
    "Chekni yuborib bo‘lmadi. Iltimos, qayta urinib ko‘ring — buyurtmangiz saqlangan.",
  submittedTitle: "To‘lov tekshirilmoqda",
  submittedBody:
    "To‘lov ma’lumotingiz qabul qilindi. Tasdiqlangach, buyurtmangiz keyingi bosqichga o‘tadi.",
  paidBody:
    "To‘lovingiz tasdiqlandi. Tayyorlash boshlanganda Sizga alohida xabar beramiz.",
  cancelledBody: "Savollaringiz bo‘lsa, biz bilan bog‘laning.",

  invalidTitle: "Havola faol emas",
  invalidBody:
    "Bu to‘lov havolasi endi ishlamaydi: muddati tugagan, yangisi bilan almashtirilgan yoki to‘lov allaqachon tasdiqlangan.",
  notPayableTitle: "To‘lov hozir qabul qilinmaydi",
  notPayableBody:
    "Bu buyurtma uchun to‘lov bosqichi yakunlangan. Buyurtma holati bo‘yicha biz bilan bog‘laning.",
  networkTitle: "Ulanishda xatolik",
  networkBody: "Internet aloqasini tekshirib, qayta urinib ko‘ring.",
  retry: "Qayta urinish",
  savedReassurance:
    "Buyurtmangiz saqlangan — formani qayta to‘ldirishingiz shart emas.",
  invalidReassurance:
    "Agar buyurtma bergan bo‘lsangiz, u saqlangan — formani qayta to‘ldirishingiz shart emas. Yangi havola uchun Telegram orqali buyurtma raqamingizni yozing.",

  paymentCodeLabel: "To‘lov kodi",
  paymentCodeHelper:
    "To‘lov kodini saqlab qo‘ying. Keyinroq shu kod orqali buyurtmangizni ochib, to‘lovni davom ettirishingiz mumkin.",
  laterCodeHelper:
    "To‘lov kodini saqlab qo‘ying. Keyinroq shu kod orqali saqlangan buyurtmangizni ochib, to‘lovni davom ettirasiz.",
  codeKeepHint: "Keyinroq to‘lov qilish uchun shu kod kerak bo‘ladi.",
  copyCode: "Nusxalash",
  codeCopied: "Nusxalandi",
  payAccessLabel: "To‘lov sahifasi",
  deliveredSms: "To‘lov kodi SMS orqali ham yuborildi.",
  deliveredWhatsapp: "To‘lov kodi WhatsApp orqali ham yuborildi.",
  saveCodeNotice: "To‘lov kodini saqlab qo‘ying",

  payTitle: "To‘lov kodini kiriting",
  payDescription:
    "Avval buyurtma formasini yuborgan bo‘lsangiz, SMS yoki WhatsApp orqali olgan to‘lov kodingizni kiriting. Shu kod orqali saqlangan buyurtmangiz ochiladi va to‘lovni davom ettirasiz.",
  payInputLabel: "To‘lov kodi",
  payOpen: "Buyurtmani ochish",
  payOpening: "Ochilmoqda…",
  payInvalid:
    "To‘lov kodi topilmadi yoki amal qilish muddati tugagan. Kodni tekshirib, qayta urinib ko‘ring.",
  payRateLimited: "Juda ko‘p urinish bo‘ldi. Birozdan so‘ng qayta urinib ko‘ring.",
  payNetwork: "Ulanishda xatolik. Internet aloqasini tekshirib, qayta urinib ko‘ring.",
  paySupport: "Kodni topa olmayapsizmi? Telegram orqali buyurtma raqamingizni yozing.",

  entryEyebrow: "Buyurtma",
  newOrderTitle: "Yangi buyurtma",
  newOrderBody: "Farzandingiz uchun yangi shaxsiylashtirilgan kitob buyurtmasini boshlang.",
  newOrderCta: "Yangi buyurtma berish",
  existingTitle: "Oldingi buyurtma uchun to‘lov",
  existingBody:
    "Avval formani yuborgan bo‘lsangiz, to‘lov kodini kiriting va saqlangan buyurtmangiz uchun to‘lovni davom ettiring.",
  existingCta: "To‘lovga o‘tish",
};

const EN: PaymentCopy = {
  brand: "TALIMOON",
  orderCodeLabel: "Order number",
  statusLabel: "Status",
  productionNotice: "We begin preparing your order once your payment is confirmed.",

  savedTitle: "Your order is saved",
  savedBody:
    "Your details and your order number are saved. You don’t need to fill in the form again.",
  payNow: "Pay now",
  payLater: "Pay later",
  savedNoLink: "Our team will send the payment link to the phone number you provided.",

  laterTitle: "Awaiting payment",
  laterBody: "Your order is saved. You don’t need to fill it in again.",
  laterNotice: "Preparation begins once your payment is confirmed.",
  linkHeading: "Your personal payment link",
  linkBody:
    "Keep this link to pay later. It opens only your order and works only for payment.",
  linkValidUntil: (date) => `The link is valid until ${date}.`,
  copyLink: "Copy link",
  linkCopied: "Copied",
  lostLink:
    "If you lose your payment code or link, message us your order number on Telegram and we’ll send you a new one.",
  contactTelegram: "Message us on Telegram",

  loading: "Opening your order…",
  awaitingTitle: "Awaiting payment",
  amountLabel: "Amount to pay",
  currencyLabel: "Currency",
  howToPayHeading: "How to pay",
  howToPaySteps: (amount) => [
    `Transfer exactly ${amount} to the card below.`,
    "Upload the receipt or a screenshot from your banking app.",
    "Our team checks and confirms the payment.",
  ],
  cardNumberLabel: "Card number",
  cardHolderLabel: "Cardholder",
  copyAction: "Copy",
  copiedAction: "Copied",
  receiptLabel: "Payment receipt",
  receiptHint: "An image (JPG, PNG, HEIC) or a PDF, up to 25 MB.",
  receiptChoose: "Choose receipt",
  receiptReplace: "Choose another file",
  receiptNotAllowed: "Please choose an image or a PDF.",
  receiptTooLarge: "That file is too large. Please choose one up to 25 MB.",
  submitPayment: "Submit payment",
  submittingPayment: "Sending…",
  submitFailed: "We couldn’t send the receipt. Please try again — your order is saved.",
  submittedTitle: "Payment being verified",
  submittedBody:
    "We’ve received your payment details. Once confirmed, your order moves to the next stage.",
  paidBody: "Your payment is confirmed. We’ll let you know separately when preparation begins.",
  cancelledBody: "If you have any questions, please get in touch.",

  invalidTitle: "This link is no longer active",
  invalidBody:
    "This payment link no longer works: it has expired, been replaced by a new one, or the payment has already been confirmed.",
  notPayableTitle: "Payment isn’t being accepted right now",
  notPayableBody:
    "The payment stage for this order is complete. Please contact us about your order status.",
  networkTitle: "Connection problem",
  networkBody: "Please check your internet connection and try again.",
  retry: "Try again",
  savedReassurance: "Your order is saved — you don’t need to fill in the form again.",
  invalidReassurance:
    "If you have placed an order, it is saved — you don’t need to fill in the form again. For a new link, message us your order number on Telegram.",

  paymentCodeLabel: "Payment code",
  paymentCodeHelper:
    "Keep this payment code. You can use it later to open your order and continue payment.",
  laterCodeHelper:
    "Keep this payment code. Later, it opens your saved order so you can continue payment.",
  codeKeepHint: "You’ll need this code to pay later.",
  copyCode: "Copy",
  codeCopied: "Copied",
  payAccessLabel: "Payment page",
  deliveredSms: "We’ve also sent the payment code by SMS.",
  deliveredWhatsapp: "We’ve also sent the payment code on WhatsApp.",
  saveCodeNotice: "Please keep this payment code",

  payTitle: "Enter your payment code",
  payDescription:
    "If you’ve already submitted the order form, enter the payment code you received by SMS or WhatsApp. It opens your saved order so you can continue payment.",
  payInputLabel: "Payment code",
  payOpen: "Open my order",
  payOpening: "Opening…",
  payInvalid:
    "We couldn’t find this payment code, or it has expired. Please check the code and try again.",
  payRateLimited: "Too many attempts. Please wait a little and try again.",
  payNetwork: "Connection problem. Please check your internet connection and try again.",
  paySupport: "Can’t find your code? Message us your order number on Telegram.",

  entryEyebrow: "Order",
  newOrderTitle: "New order",
  newOrderBody: "Start a new personalized book order for your child.",
  newOrderCta: "Start a new order",
  existingTitle: "Pay for an existing order",
  existingBody:
    "Already submitted the form? Enter your payment code and continue payment for your saved order.",
  existingCta: "Go to payment",
};

const RU: PaymentCopy = {
  brand: "TALIMOON",
  orderCodeLabel: "Номер заказа",
  statusLabel: "Статус",
  productionNotice: "Мы начнём готовить Ваш заказ после подтверждения оплаты.",

  savedTitle: "Ваш заказ сохранён",
  savedBody:
    "Ваши данные и номер заказа сохранены. Заполнять форму заново не нужно.",
  payNow: "Оплатить сейчас",
  payLater: "Оплатить позже",
  savedNoLink: "Наша команда отправит ссылку на оплату на указанный Вами номер телефона.",

  laterTitle: "Ожидается оплата",
  laterBody: "Ваш заказ сохранён. Заполнять его заново не нужно.",
  laterNotice: "Подготовка начнётся после подтверждения оплаты.",
  linkHeading: "Ваша личная ссылка на оплату",
  linkBody:
    "Сохраните эту ссылку, чтобы оплатить позже. Она открывает только Ваш заказ и работает только для оплаты.",
  linkValidUntil: (date) => `Ссылка действует до ${date}.`,
  copyLink: "Скопировать ссылку",
  linkCopied: "Скопировано",
  lostLink:
    "Если код оплаты или ссылка потеряется, напишите нам номер заказа в Telegram — мы пришлём новый.",
  contactTelegram: "Написать в Telegram",

  loading: "Открываем Ваш заказ…",
  awaitingTitle: "Ожидается оплата",
  amountLabel: "Сумма к оплате",
  currencyLabel: "Валюта",
  howToPayHeading: "Как оплатить",
  howToPaySteps: (amount) => [
    `Переведите ровно ${amount} на карту ниже.`,
    "Загрузите чек или скриншот из банковского приложения.",
    "Наша команда проверит и подтвердит оплату.",
  ],
  cardNumberLabel: "Номер карты",
  cardHolderLabel: "Владелец карты",
  copyAction: "Скопировать",
  copiedAction: "Скопировано",
  receiptLabel: "Чек об оплате",
  receiptHint: "Изображение (JPG, PNG, HEIC) или PDF, до 25 МБ.",
  receiptChoose: "Выбрать чек",
  receiptReplace: "Выбрать другой файл",
  receiptNotAllowed: "Пожалуйста, выберите изображение или PDF.",
  receiptTooLarge: "Файл слишком большой. Выберите файл до 25 МБ.",
  submitPayment: "Отправить оплату",
  submittingPayment: "Отправляем…",
  submitFailed: "Не удалось отправить чек. Попробуйте ещё раз — Ваш заказ сохранён.",
  submittedTitle: "Оплата проверяется",
  submittedBody:
    "Мы получили данные об оплате. После подтверждения заказ перейдёт на следующий этап.",
  paidBody: "Оплата подтверждена. Мы отдельно сообщим, когда начнётся подготовка.",
  cancelledBody: "Если у Вас есть вопросы, свяжитесь с нами.",

  invalidTitle: "Ссылка больше не активна",
  invalidBody:
    "Эта ссылка на оплату больше не работает: срок истёк, её заменили новой или оплата уже подтверждена.",
  notPayableTitle: "Оплата сейчас не принимается",
  notPayableBody:
    "Этап оплаты по этому заказу завершён. Свяжитесь с нами, чтобы узнать статус заказа.",
  networkTitle: "Ошибка соединения",
  networkBody: "Проверьте подключение к интернету и попробуйте ещё раз.",
  retry: "Повторить",
  savedReassurance: "Ваш заказ сохранён — заполнять форму заново не нужно.",
  invalidReassurance:
    "Если Вы оформили заказ, он сохранён — заполнять форму заново не нужно. Для новой ссылки напишите нам номер заказа в Telegram.",

  paymentCodeLabel: "Код оплаты",
  paymentCodeHelper:
    "Сохраните код оплаты. Позже с его помощью Вы откроете заказ и продолжите оплату.",
  laterCodeHelper:
    "Сохраните код оплаты. Позже он откроет Ваш сохранённый заказ, и Вы продолжите оплату.",
  codeKeepHint: "Этот код понадобится, чтобы оплатить позже.",
  copyCode: "Скопировать",
  codeCopied: "Скопировано",
  payAccessLabel: "Страница оплаты",
  deliveredSms: "Код оплаты также отправлен по SMS.",
  deliveredWhatsapp: "Код оплаты также отправлен в WhatsApp.",
  saveCodeNotice: "Сохраните код оплаты",

  payTitle: "Введите код оплаты",
  payDescription:
    "Если Вы уже отправили форму заказа, введите код оплаты из SMS или WhatsApp. Он откроет Ваш сохранённый заказ, и Вы продолжите оплату.",
  payInputLabel: "Код оплаты",
  payOpen: "Открыть заказ",
  payOpening: "Открываем…",
  payInvalid:
    "Код оплаты не найден или срок его действия истёк. Проверьте код и попробуйте ещё раз.",
  payRateLimited: "Слишком много попыток. Подождите немного и попробуйте снова.",
  payNetwork: "Ошибка соединения. Проверьте подключение к интернету и попробуйте ещё раз.",
  paySupport: "Не можете найти код? Напишите нам номер заказа в Telegram.",

  entryEyebrow: "Заказ",
  newOrderTitle: "Новый заказ",
  newOrderBody: "Оформите новый заказ персональной книги для Вашего ребёнка.",
  newOrderCta: "Оформить новый заказ",
  existingTitle: "Оплата существующего заказа",
  existingBody:
    "Уже отправили форму? Введите код оплаты и продолжите оплату сохранённого заказа.",
  existingCta: "Перейти к оплате",
};

export const PAYMENT_COPY: Record<PaymentLocale, PaymentCopy> = { uz: UZ, en: EN, ru: RU };
