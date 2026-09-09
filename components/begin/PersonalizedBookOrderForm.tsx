"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, MapPin, Upload } from "lucide-react";
import { useLanguage, useT } from "@/lib/i18n/LanguageContext";
import { toLocale } from "@/lib/journey/types";
import {
  BOOK_LANGUAGE_OPTIONS,
  BookLanguageCode,
  BookType,
  COUNTRIES,
  DELIVERY_REGIONS,
  PAYMENT_ACCOUNTS,
  STEPS,
  TraitId,
  type StepId,
  calculateOrderTotal,
  countryLabel,
  deliveryRegionLabel,
  formatMoney,
  paymentMethodsForMarket,
  type Market,
} from "./orderFormData";
import {
  buildSubmitPayload,
  finalizeOrder,
  IntakeApiError,
  isBackendBookLanguage,
  planChildPhotoUploads,
  submitOrder,
  uploadFile,
} from "@/lib/order/api";
import { buildAddressText } from "@/lib/order/addressText";
import {
  childDreamsText,
  childGrowthText,
  childInterestsText,
  childStrengthsText,
  orderDesiredValueLabels,
  orderEmotionalText,
} from "@/lib/order/profileText";
import Turnstile, { type TurnstileHandle } from "./Turnstile";
import { PaymentAccount } from "./PaymentAccount";
import { MapLocationPicker } from "./MapLocationPicker";
import { setMarketPreference, useMarketPreference, marketFromLocation } from "@/lib/order/market";
import { useFlowScroll } from "@/lib/order/useFlowScroll";
import {
  additionalCharacterLabel,
  additionalCharacterNamed,
  bookTypeForChildCount,
  deliveryRequired,
  emptyAdditionalCharacter,
  emptyChild,
  emptyOrderer,
  isDeliveryComplete,
  MAX_ADDITIONAL_CHARACTERS,
  MIN_CHARACTER_PHOTOS,
  resetDeliveryForMarket,
  type AdditionalCharacter,
  type ChildProfile,
  type DeliveryAddress,
  type DeliveryLocation,
  type Orderer,
  type Phase01Result,
} from "@/lib/order/types";
import {
  Field,
  inputClass,
  MAX_PHOTO_BYTES,
  PhotoUpload,
  TextArea,
  TextInput,
} from "./formPrimitives";
import {
  AdditionalCharacterCards,
  type AdditionalCharacterCopy,
} from "./AdditionalCharacters";
import Phase02 from "./Phase02";
import Phase03 from "./Phase03";
import EmotionalBridge from "./EmotionalBridge";
import { SwitchRow } from "./Switch";
import VoiceMemory from "./VoiceMemory";
import EsdalikSection, { type EsdalikCopy } from "./EsdalikSection";
import { ChildWorld } from "./ChildWorld";
import { growthFull } from "@/lib/order/phase03-copy";
import {
  formatRespectfulName,
  relationshipLabel,
  type RecipientRelationship,
} from "@/lib/order/relationship";
import {
  coarseFor as coarseKeepsakeRelationship,
  keepsakeRelationshipOptions,
  type KeepsakeRelationship,
} from "@/lib/order/keepsakeRelationship";
import Phase01 from "./Phase01";
import { JourneyProgress } from "./JourneyProgress";
import { CheckRow } from "./CheckRow";
import { OrderConsent, type OrderConsentCopy } from "./OrderConsent";

/** Where "Yuragingizda qolgan gaplar" (its own quiet screen, not a
 *  wizard step) slots in: after "a personal touch", before the photos. */
const PERSONAL_TOUCH_STEP = STEPS.findIndex((s) => s.id === "personal-touch");
const PHOTOS_STEP = STEPS.findIndex((s) => s.id === "photos");
const PRIVACY_POLICY_VERSION = "2026-09-07";
const TERMS_VERSION = "2026-09-07";
const CONSENT_COPY: Record<"uz" | "en" | "ru", OrderConsentCopy> = {
  uz: { heading:"Buyurtma roziligi", summary:"Bitta tasdiq va qo‘lda elektron imzo — ma’lumotlaringiz faqat buyurtmani tayyorlash uchun ishlatiladi.", details:"Batafsil shartnomani o‘qish", documentTitle:"TALIMOON buyurtma va maxfiylik shartnomasi", documentBody:["Men 18 yoshdan kattaman hamda bolaning ota-onasi yoki qonuniy vakiliman yoxud ulardan ushbu buyurtma uchun aniq vakolat olganman.","TALIMOON men bergan aloqa ma’lumotlari, bola haqidagi ma’lumotlar va fotosuratlardan faqat shaxsiylashtirilgan kitobni yaratish, ishlab chiqarish, yetkazish va buyurtmani qo‘llab-quvvatlash uchun foydalanishiga roziman.","Yuborgan fotosuratlarim reklama yoki ommaviy targ‘ibotda alohida roziligimsiz ishlatilmaydi. Ushbu tasdiq meni marketing xabarlariga obuna qilmaydi.","Men Maxfiylik siyosati va Foydalanish shartlarini o‘qidim va qabul qilaman. Elektron imzo, rozilik vaqti, til va hujjat versiyalari buyurtma bilan qayd etiladi; IP-manzil imzoga biriktirilmaydi."], close:"Tushundim", accept:"Shartnomani o‘qidim, tushundim va barcha shartlarga roziman.", sign:"Elektron imzo qo‘yish", signatureTitle:"Elektron imzo", signatureHelp:"Oq maydonga barmoq yoki sichqoncha bilan imzo qo‘ying.", clear:"Tozalash", save:"Imzoni tasdiqlash", signed:"Imzo qo‘yildi — o‘zgartirish", links:"Maxfiylik siyosati · Foydalanish shartlari" },
  en: { heading:"Order consent", summary:"One confirmation and a handwritten electronic signature — your data is used only to fulfil the order.", details:"Read the detailed agreement", documentTitle:"TALIMOON Order and Privacy Agreement", documentBody:["I am at least 18 and I am the child's parent or legal guardian, or I have their clear authority for this order.","I consent to TALIMOON using the contact details, child information, and photographs I provide only to create, produce, deliver, and support the personalized book.","My photographs will not be used in advertising or public promotion without separate permission. This confirmation does not subscribe me to marketing.","I have read and accept the Privacy Policy and Terms of Service. The signature, acceptance time, language, and document versions are recorded with the order; no IP address is attached to the signature."], close:"I understand", accept:"I have read and understood the agreement and accept all its terms.", sign:"Add electronic signature", signatureTitle:"Electronic signature", signatureHelp:"Sign in the white area with your finger or mouse.", clear:"Clear", save:"Confirm signature", signed:"Signed — change", links:"Privacy Policy · Terms of Service" },
  ru: { heading:"Согласие на заказ", summary:"Одно подтверждение и рукописная электронная подпись — данные используются только для выполнения заказа.", details:"Прочитать подробный договор", documentTitle:"Договор заказа и конфиденциальности TALIMOON", documentBody:["Мне исполнилось 18 лет, и я являюсь родителем или законным представителем ребёнка либо имею их явное разрешение на этот заказ.","Я разрешаю TALIMOON использовать предоставленные контактные данные, сведения о ребёнке и фотографии только для создания, производства, доставки и сопровождения именной книги.","Фотографии не используются в рекламе или публичном продвижении без отдельного разрешения. Это подтверждение не оформляет маркетинговую подписку.","Я прочитал(а) и принимаю Политику конфиденциальности и Условия использования. Подпись, время, язык и версии документов записываются с заказом; IP-адрес к подписи не прикрепляется."], close:"Понятно", accept:"Я прочитал(а), понял(а) договор и принимаю все его условия.", sign:"Поставить электронную подпись", signatureTitle:"Электронная подпись", signatureHelp:"Распишитесь в белом поле пальцем или мышью.", clear:"Очистить", save:"Подтвердить подпись", signed:"Подписано — изменить", links:"Политика конфиденциальности · Условия использования" },
};

// ─── Copy ───────────────────────────────────────────────────────────────────

const CHROME_EN = {
  back: "Back",
  continue: "Continue",
  sendOrder: "Send order",
  submittingTitle: "Your information is being uploaded",
  submittingBody: "Please wait a moment and do not leave this page.",

  // Completion — the order is SUBMITTED, not in production. Review →
  // confirmation → 5–7 day preparation → delivery notification.
  doneHeading: "Your order has been received",
  doneBody: [
    "We've received all the information you provided. The TALIMOON team will now review it carefully.",
    "If we need to clarify anything, we'll contact you. If everything is complete, we'll send you a message confirming your order.",
    "Once confirmed, your book is usually prepared within 5–7 days. When it is ready, we'll contact you with the delivery details.",
  ],
  doneNote: "Order updates will be sent to the phone number you provided.",

  heroesLabel: "Heroes of this story",
  years: (age: number | null) => (age == null ? "" : `, ${age}`),

  phone: "Phone number",
  // Delivery
  deliveryQ: "Would you like us to deliver your book?",
  deliveryYes: "Yes, I need delivery",
  deliveryNo: "No, I'll collect it myself",
  deliveryRegionField: "Region / area",
  deliveryRegionPlaceholder: "Select…",
  pickupSummary: "Self-pickup — no delivery fee",
  deliveryFree: "Free",
  rowBook: "Book",
  rowExtraCopies: (n: number) => (n === 1 ? "Extra copy" : `Extra copies × ${n}`),
  rowDelivery: "Delivery",
  payAmount: "Amount to pay",
  addrDistrict: "City / district",
  addrStreet: "Street / mahalla",
  addrBuilding: "House / building",
  addrApartment: "Flat / unit",
  addrLandmark: "Landmark",
  optional: "(optional)",
  locationCta: "Set the delivery location",
  locationHint:
    "If you'd like, you can attach a location so the courier finds the address more easily.",
  locationAttached: "Location attached",
  locationClear: "Remove location",
  locationDenied: "Couldn't get the location. You can carry on with the written address.",
  locationUnsupported:
    "This device can't share a location. The written address is enough.",
  locationLoading: "Getting location…",
  locationCurrentCta: "Send my current location",
  locationMapCta: "Choose a point on the map",
  locationChange: "Change location",
  locationSelected: "Delivery point selected",
  locationPickerTitle: "Choose the delivery point",
  locationSearchPlaceholder: "Search for an address or place",
  locationConfirm: "Confirm this point",
  locationPickerClose: "Cancel",
  locationMapUnavailable:
    "The map isn't available right now. You can send your current location or carry on with the written address.",

  namePlaceholder: "Name",
  agePlaceholder: "Age",
  pagesUnit: "pages",

  interests: "What do they love doing?",
  interestsHint: "Hobbies, favorite games, anything that lights them up.",
  dreams: "What do they dream of becoming?",
  qualities: (max: number) => `Qualities to highlight (choose up to ${max})`,
  weaknesses: "Anything to gently work on?",
  weaknessesHint:
    "Optional — habits or behaviors you'd like the story to address.",
  extraInfo: "Anything else that makes the story more personal?",

  wordsRequiredError: "Please write the keepsake words.",
  storyGiverCustomLabelLabel: "Describe the relationship",
  storyGiverCustomLabelPlaceholder: "e.g. my cousin's child",

  esdalikHeading: "Keepsake page",
  esdalikIntro:
    "We create a dedicated keepsake page in the book for your child. It holds the special words of someone close to them, and a real photo of the two of them together.",
  esdalikExplain:
    "The keepsake can be from you, or from another person close to the child, such as their father, mother, grandfather or grandmother.",
  esdalikFromWhoQ: "Who is the keepsake from?",
  esdalikFromSelf: "From me",
  esdalikFromOther: "From another close person",
  esdalikRelationshipQ: "Their relationship to the child",
  esdalikRelationshipPlaceholder: "Choose…",
  esdalikNameLabel: "Name",
  esdalikNamePlaceholder: "For example: Sherzodbek",
  esdalikNameError: "Please enter the name for the keepsake.",
  esdalikVoiceQ: "Would you like to keep these words in their own voice too?",
  esdalikVoiceYes: "Yes, add a voice keepsake",
  esdalikVoiceNo: "No, text only",
  esdalikPhotoLabel: "Photo for the keepsake",
  esdalikPhotoNotIllustration:
    "This photo is not turned into an illustration. It is placed on the book's keepsake page exactly as it is.",
  esdalikRelationshipError: "Please choose their relationship to the child.",
  esdalikVoiceError: "Please choose whether to add a voice keepsake.",
  esdalikPhotoError: "A real photo of the child with the keepsake author is required.",
  charactersTitle: "Add people who appear in the story",
  charactersExplain1: (multi: boolean): string =>
    multi
      ? "Add close people you'd like to appear in the story alongside your children — for example a father, mother, older brother or sister, grandfather, grandmother, or another loved one."
      : "Add close people you'd like to appear in the story alongside your child — for example a father, mother, older brother or sister, grandfather, grandmother, or another loved one.",
  charactersExplain2:
    "We'll need their relationship, name and photos so they can be drawn as characters in the story.",
  charactersToggle: "I'd like to add people to the story",
  characterRelationLabel: "Relationship",
  characterRelationPlaceholder: "e.g. Father",
  characterNameLabel: "Name",
  characterNamePlaceholder: "e.g. Sherzodbek",
  charactersPhotosLabel: "Their photos",
  charactersPhotoHint:
    "Upload at least 2 clear, good-quality photos so this person can be drawn in the story.",
  addCharacter: "+ Add another person",
  removeCharacter: "Remove",
  characterNeedsBoth: "Add a relationship and a name for each person, or remove the entry.",

  childPhotos: "Child photos",
  childPhotosHint: "3–5 clear, well-lit photos showing the face",
  characterPhotosMoreNeeded: (who: string) => `${who} still needs at least 2 photos`,
  atLeastPhotos: (min: number) => `At least ${min} photos required`,
  photosEnough: (n: number) => `${n} photo${n === 1 ? "" : "s"} — enough`,
  photosMoreNeeded: (n: number) =>
    `Upload ${n} more photo${n === 1 ? "" : "s"} to continue`,
  childPhotosMoreNeeded: (who: string) => `${who} still needs at least 3 photos`,
  removePhoto: "Remove photo",
  photoTooLarge: "That photo is too large. Please choose one under 15 MB.",
  photoNotImage: "Please choose an image file.",
  photoBroken: "This image couldn't be read. Please choose another.",

  bookLanguageQ: "Which language would you like the book in?",
  languageSoon: "Coming soon",
  numberOfCopies: "Number of copies",
  total: "Total",

  payUzHeading: "Payment for Uzbekistan",
  payUzBody: "You can pay by card-to-card transfer to the card number below.",
  payIntlHeading: "International payment",
  payIntlBody:
    "For international orders, you can pay by card-to-card transfer to one of the cards below.",
  cardNumberLabel: "Card number",
  cardHolderLabel: "Cardholder",
  copyAction: "Copy",
  copiedAction: "Copied",
  payNote:
    "For now, payments are made by card transfer. Online automatic payments are coming soon.",
  receiptQ: "Upload payment receipt",
  receiptHint:
    "You can upload the payment receipt or a screenshot from your banking app.",
  receiptDone: "Receipt uploaded",
  receiptReplace: "Replace",
  receiptError: "Please upload the payment receipt to finish.",
  submitError: "We couldn't send your order. Please try again.",
  voiceTooLongError:
    "The voice recording is longer than 2 minutes. Please go back and shorten it, or remove it to continue without a recording.",
  consentHeading: "Consent and electronic signature",
  consentIntro: "Before sending the order, please confirm how we may use the information and photographs you provided.",
  consentAuthority: "I am at least 18 years old and I am the child's parent/legal guardian, or I have clear authority from the parent/legal guardian to provide the child's information and photographs for this order.",
  consentPrivacy: "I have read the Privacy Policy and consent to TALIMOON processing the personal data and photographs provided only to create, produce, deliver, and support this order.",
  consentTerms: "I have read and accept the Terms of Service, including the rules for personalized products, payment, production, delivery, cancellation, and refunds.",
  consentNoMarketing: "This consent does not permit advertising use or public sharing of your photographs and does not subscribe you to marketing.",
  signatureLabel: "Electronic signature — your full name",
  signatureHint: "Type the same full name used for this order. Your typed name and submission time will be recorded as your acceptance.",
  consentError: "Please complete all three confirmations and enter your full name as the electronic signature.",
  privacyLink: "Privacy Policy",
  termsLink: "Terms of Service",

  reviewLanguage: "Book language",
  reviewAddress: "Delivery",
  reviewCharacters: "Other characters",
  reviewPrivateNote: "Private note for TALIMOON",
  reviewPrivateHint: "Only used to understand the situation — not shown in the book.",
  reviewGrowthContext: "Situations",

  // Market / destination
  orderRegion: "Order region",
  marketUz: "Uzbekistan",
  marketIntl: "International",
  change: "Change",
  countryQ: "Which country is this order for?",
  countryField: "Country",
  countrySelect: "Select…",
  addrState: "State / province / region",
  addrCity: "City",
  addrLine: "Street / address",
  addrPostal: "Postal / ZIP code",
  addrNote: "Delivery note",
  intlDelivery: "International postal delivery",
  intlDeliveryHelp: "One flat postal charge for the whole order.",

  errReview:
    "Please add a phone number, choose the book language, choose the destination country, and answer the delivery question (with a full address if you'd like delivery).",
};

const CHROME_UZ: typeof CHROME_EN = {
  back: "Orqaga",
  continue: "Davom etish",
  sendOrder: "Buyurtma yuborish",
  submittingTitle: "Ma’lumotlaringiz yuklanmoqda",
  submittingBody: "Iltimos, biroz kuting va sahifadan chiqib ketmang.",

  doneHeading: "Buyurtmangiz qabul qilindi",
  doneBody: [
    "Barcha ma’lumotlaringiz bizga yetib keldi. Endi TALIMOON jamoasi ularni diqqat bilan ko‘rib chiqadi.",
    "Agar biror ma’lumotga aniqlik kiritish kerak bo‘lsa, Siz bilan bog‘lanamiz. Hammasi joyida bo‘lsa, buyurtmangiz tasdiqlangani haqida xabar yuboramiz.",
    "Tasdiqlangandan so‘ng kitobingiz odatda 7–10 kun ichida tayyorlanadi. Tayyor bo‘lgach, yetkazib berish bo‘yicha Sizga alohida xabar beramiz.",
  ],
  doneNote: "Buyurtma holati bo‘yicha xabarlar Siz ko‘rsatgan telefon raqamiga yuboriladi.",

  heroesLabel: "Hikoya qahramonlari",
  years: (age: number | null) => (age == null ? "" : `, ${age} yosh`),

  phone: "Telefon raqami",
  deliveryQ: "Kitobni Sizga yetkazib beraylikmi?",
  deliveryYes: "Ha, yetkazib berish kerak",
  deliveryNo: "Yo‘q, o‘zim olib ketaman",
  deliveryRegionField: "Viloyat / hudud",
  deliveryRegionPlaceholder: "Tanlang…",
  pickupSummary: "O‘zim olib ketaman — yetkazib berish to‘lovi yo‘q",
  deliveryFree: "Bepul",
  rowBook: "Kitob",
  rowExtraCopies: (n: number) => (n === 1 ? "Qo‘shimcha nusxa" : `Qo‘shimcha nusxa × ${n}`),
  rowDelivery: "Yetkazib berish",
  payAmount: "To‘lov summasi",
  addrDistrict: "Shahar / tuman",
  addrStreet: "Ko‘cha / mahalla",
  addrBuilding: "Uy / bino",
  addrApartment: "Kvartira / xonadon",
  addrLandmark: "Mo‘ljal",
  optional: "(ixtiyoriy)",
  locationCta: "Yetkazib berish joyini belgilash",
  locationHint:
    "Istasangiz, kuryer manzilni osonroq topishi uchun lokatsiyani ham biriktirishingiz mumkin.",
  locationAttached: "Lokatsiya biriktirilgan",
  locationClear: "Lokatsiyani olib tashlash",
  locationDenied: "Lokatsiya olinmadi. Manzilni yozib davom etishingiz mumkin.",
  locationUnsupported:
    "Bu qurilma lokatsiyani ulasholmaydi. Yozilgan manzil yetarli.",
  locationLoading: "Lokatsiya olinmoqda…",
  locationCurrentCta: "Hozirgi joylashuvimni yuborish",
  locationMapCta: "Xaritadan joy tanlash",
  locationChange: "Lokatsiyani o'zgartirish",
  locationSelected: "Yetkazib berish joyi tanlandi",
  locationPickerTitle: "Yetkazib berish joyini tanlang",
  locationSearchPlaceholder: "Manzil yoki joy nomini qidiring",
  locationConfirm: "Shu joyni tasdiqlash",
  locationPickerClose: "Bekor qilish",
  locationMapUnavailable:
    "Xarita hozircha ishlamayapti. Hozirgi joylashuvingizni yuborishingiz yoki yozilgan manzil bilan davom etishingiz mumkin.",

  namePlaceholder: "Ismi",
  agePlaceholder: "Yoshi",
  pagesUnit: "bet",

  interests: "Ular nimani yaxshi ko'radi?",
  interestsHint:
    "Sevimli mashg'ulotlari, o'yinlari — ularni quvontiradigan narsalar.",
  dreams: "Kim bo'lishni orzu qilishadi?",
  qualities: (max: number) => `Ta'kidlanadigan fazilatlar (${max} tagacha tanlang)`,
  weaknesses: "Astoydil ishlov berish kerak bo'lgan narsa bormi?",
  weaknessesHint:
    "Ixtiyoriy — hikoya orqali yumshoq ishora qilinishini istagan odat yoki xatti-harakat.",
  extraInfo: "Hikoyani yanada shaxsiy qiladigan boshqa narsa bormi?",

  wordsRequiredError: "Iltimos, esdalik so‘zlarini yozing.",
  storyGiverCustomLabelLabel: "Qarindoshlikni yozing",
  storyGiverCustomLabelPlaceholder: "masalan: amakivachchamning farzandi",

  esdalikHeading: "Esdalik sahifasi",
  esdalikIntro:
    "Farzandingiz uchun kitobda alohida esdalik sahifasi yaratamiz. Bu sahifada unga yaqin insonning maxsus so‘zlari va ular birga tushgan haqiqiy surat joy oladi.",
  esdalikExplain:
    "Esdalik sizning nomingizdan yoki bolaning boshqa yaqin insoni, masalan, otasi, onasi, bobosi yoki buvisi nomidan bo‘lishi mumkin.",
  esdalikFromWhoQ: "Esdalik kimning nomidan?",
  esdalikFromSelf: "O‘zimning nomimdan",
  esdalikFromOther: "Boshqa yaqin inson nomidan",
  esdalikRelationshipQ: "Bolaga kim bo‘ladi?",
  esdalikRelationshipPlaceholder: "Tanlang…",
  esdalikNameLabel: "Ismi",
  esdalikNamePlaceholder: "Masalan: Sherzodbek",
  esdalikNameError: "Iltimos, esdalik uchun ismni kiriting.",
  esdalikVoiceQ: "Bu so‘zlarni o‘z ovozida ham saqlab qolishni xohlaysizmi?",
  esdalikVoiceYes: "Ha, ovozli esdalik qoldiramiz",
  esdalikVoiceNo: "Yo‘q, faqat matn",
  esdalikPhotoLabel: "Esdalik uchun surat",
  esdalikPhotoNotIllustration:
    "Bu surat illyustratsiyaga aylantirilmaydi. U kitobning esdalik sahifasida asl holatida joylashtiriladi.",
  esdalikRelationshipError: "Iltimos, bolaga kim bo‘lishini tanlang.",
  esdalikVoiceError: "Iltimos, ovozli esdalik qoldirish yoki qoldirmaslikni tanlang.",
  esdalikPhotoError: "Bola va esdalik so‘zlari egasi birga tushgan haqiqiy surat majburiy.",
  charactersTitle: "Hikoyaga qo‘shimcha qahramonlar qo‘shish",
  charactersExplain1: (multi: boolean): string =>
    multi
      ? "Bu yerda hikoyada farzandlaringiz bilan birga qatnashishini istagan yaqin insonlarni qo‘shishingiz mumkin. Masalan: ota, ona, aka, opa, bobo, buvi yoki boshqa yaqin insonlar."
      : "Bu yerda hikoyada farzandingiz bilan birga qatnashishini istagan yaqin insonlarni qo‘shishingiz mumkin. Masalan: ota, ona, aka, opa, bobo, buvi yoki boshqa yaqin insonlar.",
  charactersExplain2:
    "Ular hikoyada qahramon sifatida tasvirlanishi uchun kimligi, ismi va suratlari kerak bo‘ladi.",
  charactersToggle: "Qo‘shimcha qahramonlar qo‘shmoqchiman",
  characterRelationLabel: "Kimligi",
  characterRelationPlaceholder: "Masalan: Otasi",
  characterNameLabel: "Ismi",
  characterNamePlaceholder: "Masalan: Sherzodbek",
  charactersPhotosLabel: "Suratlari",
  charactersPhotoHint:
    "Ushbu inson hikoyada tasvirlanishi uchun kamida 2 ta aniq va sifatli surat yuklang.",
  addCharacter: "+ Qo‘shimcha qahramon qo‘shish",
  removeCharacter: "O‘chirish",
  characterNeedsBoth:
    "Har bir inson uchun kimligi va ismini yozing yoki qatorni o‘chiring.",

  childPhotos: "Farzand suratlari",
  childPhotosHint: "Yuzi aniq ko'rinadigan, yaxshi yoritilgan 3–5 ta surat",
  characterPhotosMoreNeeded: (who: string) => `${who} uchun kamida 2 ta surat kerak`,
  atLeastPhotos: (min: number) => `Kamida ${min} ta surat kerak`,
  photosEnough: (n: number) => `${n} ta surat — yetarli`,
  photosMoreNeeded: (n: number) => `Davom etish uchun yana ${n} ta rasm yuklang`,
  childPhotosMoreNeeded: (who: string) => `${who} uchun kamida 3 ta surat kerak`,
  removePhoto: "Suratni o'chirish",
  photoTooLarge: "Bu surat juda katta. Iltimos, 15 MB dan kichigini tanlang.",
  photoNotImage: "Iltimos, rasm faylini tanlang.",
  photoBroken: "Bu suratni o'qib bo'lmadi. Iltimos, boshqasini tanlang.",

  bookLanguageQ: "Kitob qaysi tilda bo'lishini xohlaysiz?",
  languageSoon: "Tez orada",
  numberOfCopies: "Nusxalar soni",
  total: "Jami",

  payUzHeading: "O‘zbekiston bo‘yicha to‘lov",
  payUzBody:
    "To‘lovni quyidagi karta raqamiga kartadan kartaga amalga oshirishingiz mumkin.",
  payIntlHeading: "Xalqaro to‘lov",
  payIntlBody:
    "Xalqaro buyurtmalar uchun to‘lovni quyidagi kartalardan biriga kartadan kartaga amalga oshirishingiz mumkin.",
  cardNumberLabel: "Karta raqami",
  cardHolderLabel: "Karta egasi",
  copyAction: "Nusxalash",
  copiedAction: "Nusxalandi",
  payNote:
    "Hozircha to‘lov kartadan kartaga amalga oshiriladi. Onlayn avtomatik to‘lov tizimi tez orada ishga tushadi.",
  receiptQ: "To‘lov chekini yuklang",
  receiptHint:
    "Bank ilovasidagi to‘lov cheki yoki screenshotni yuklashingiz mumkin.",
  receiptDone: "Chek yuklandi",
  receiptReplace: "Almashtirish",
  receiptError: "Yakunlash uchun to‘lov chekini yuklang.",
  submitError: "Buyurtmangizni yuborishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
  voiceTooLongError:
    "Ovozli yozuv 2 daqiqadan uzun. Orqaga qaytib uni qisqartiring yoki yozuvsiz davom etish uchun olib tashlang.",
  consentHeading: "Rozilik va elektron imzo",
  consentIntro: "Buyurtmani yuborishdan oldin taqdim etgan ma’lumot va fotosuratlaringizdan qanday foydalanishimiz mumkinligini tasdiqlang.",
  consentAuthority: "Men 18 yoshdan kattaman va bolaning ota-onasi/qonuniy vakiliman yoki ushbu buyurtma uchun bolaning ma’lumotlari va fotosuratlarini taqdim etishga ota-ona/qonuniy vakildan aniq vakolat olganman.",
  consentPrivacy: "Men Maxfiylik siyosatini o‘qidim va TALIMOON taqdim etilgan shaxsiy ma’lumotlar hamda fotosuratlarni faqat ushbu buyurtmani yaratish, ishlab chiqarish, yetkazish va qo‘llab-quvvatlash uchun qayta ishlashiga roziman.",
  consentTerms: "Men Foydalanish shartlarini, jumladan shaxsiylashtirilgan mahsulot, to‘lov, ishlab chiqarish, yetkazib berish, bekor qilish va pulni qaytarish qoidalarini o‘qidim va qabul qilaman.",
  consentNoMarketing: "Bu rozilik fotosuratlaringizdan reklamada foydalanishga yoki ularni ommaga tarqatishga ruxsat bermaydi va sizni marketing xabarlariga obuna qilmaydi.",
  signatureLabel: "Elektron imzo — to‘liq ism-familiyangiz",
  signatureHint: "Buyurtmada ko‘rsatilgan to‘liq ismni kiriting. Kiritilgan ism va yuborish vaqti roziligingiz tasdig‘i sifatida qayd etiladi.",
  consentError: "Uchala tasdiqni belgilang va elektron imzo sifatida to‘liq ism-familiyangizni kiriting.",
  privacyLink: "Maxfiylik siyosati",
  termsLink: "Foydalanish shartlari",

  reviewLanguage: "Kitob tili",
  reviewAddress: "Yetkazib berish",
  reviewCharacters: "Boshqa qahramonlar",
  reviewPrivateNote: "TALIMOON uchun shaxsiy izoh",
  reviewPrivateHint: "Faqat vaziyatni tushunish uchun — kitobda ko'rsatilmaydi.",
  reviewGrowthContext: "Vaziyatlar",

  // Market / destination
  orderRegion: "Buyurtma hududi",
  marketUz: "O‘zbekiston",
  marketIntl: "Xalqaro",
  change: "O‘zgartirish",
  countryQ: "Buyurtmangiz qaysi davlat uchun?",
  countryField: "Davlat",
  countrySelect: "Tanlang…",
  addrState: "Shtat / viloyat / hudud",
  addrCity: "Shahar",
  addrLine: "Ko‘cha / manzil",
  addrPostal: "Pochta indeksi",
  addrNote: "Yetkazib berish izohi",
  intlDelivery: "Xalqaro pochta orqali yetkazib berish",
  intlDeliveryHelp: "Butun buyurtma uchun bir martalik pochta to‘lovi.",

  errReview:
    "Iltimos, telefon raqamini kiriting, kitob tilini tanlang, yetkazib beriladigan davlatni tanlang va yetkazib berish savoliga javob bering (yetkazib berish kerak bo‘lsa, to‘liq manzil bilan).",
};

const CHROME_RU: typeof CHROME_EN = {
  back: "Назад",
  continue: "Продолжить",
  sendOrder: "Отправить заказ",
  submittingTitle: "Загружаем Ваши данные",
  submittingBody: "Пожалуйста, подождите немного и не покидайте эту страницу.",

  doneHeading: "Ваш заказ принят",
  doneBody: [
    "Мы получили всю предоставленную Вами информацию. Теперь команда TALIMOON внимательно её изучит.",
    "Если понадобится что-то уточнить, мы свяжемся с Вами. Если всё в порядке, мы пришлём сообщение с подтверждением заказа.",
    "После подтверждения книга обычно готовится в течение 5–7 дней. Когда она будет готова, мы сообщим Вам о деталях доставки.",
  ],
  doneNote: "Уведомления о статусе заказа будут приходить на указанный Вами номер телефона.",

  heroesLabel: "Герои этой истории",
  years: (age: number | null) => (age == null ? "" : `, ${age} лет`),

  phone: "Номер телефона",
  deliveryQ: "Нужна ли Вам доставка книги?",
  deliveryYes: "Да, нужна доставка",
  deliveryNo: "Нет, заберу самостоятельно",
  deliveryRegionField: "Область / регион",
  deliveryRegionPlaceholder: "Выберите…",
  pickupSummary: "Самовывоз: без платы за доставку",
  deliveryFree: "Бесплатно",
  rowBook: "Книга",
  rowExtraCopies: (n: number) => (n === 1 ? "Дополнительный экземпляр" : `Дополнительные экземпляры × ${n}`),
  rowDelivery: "Доставка",
  payAmount: "Сумма к оплате",
  addrDistrict: "Город / район",
  addrStreet: "Улица / махалля",
  addrBuilding: "Дом / строение",
  addrApartment: "Квартира",
  addrLandmark: "Ориентир",
  optional: "(необязательно)",
  locationCta: "Указать место доставки",
  locationHint:
    "Если хотите, можно прикрепить геолокацию, чтобы курьеру было проще найти адрес.",
  locationAttached: "Геолокация прикреплена",
  locationClear: "Убрать геолокацию",
  locationDenied: "Не удалось получить геолокацию. Вы можете продолжить с указанным адресом.",
  locationUnsupported:
    "Это устройство не поддерживает передачу геолокации. Указанного адреса достаточно.",
  locationLoading: "Определяем местоположение…",
  locationCurrentCta: "Отправить моё текущее местоположение",
  locationMapCta: "Выбрать точку на карте",
  locationChange: "Изменить местоположение",
  locationSelected: "Точка доставки выбрана",
  locationPickerTitle: "Выберите точку доставки",
  locationSearchPlaceholder: "Поиск адреса или места",
  locationConfirm: "Подтвердить эту точку",
  locationPickerClose: "Отмена",
  locationMapUnavailable:
    "Карта сейчас недоступна. Можно отправить текущее местоположение или продолжить с указанным адресом.",

  namePlaceholder: "Имя",
  agePlaceholder: "Возраст",
  pagesUnit: "стр.",

  interests: "Чем он(а) любит заниматься?",
  interestsHint: "Увлечения, любимые игры, всё, что вызывает у него(неё) восторг.",
  dreams: "Кем он(а) мечтает стать?",
  qualities: (max: number) => `Качества, которые нужно подчеркнуть (выберите до ${max})`,
  weaknesses: "Есть что-то, над чем стоит мягко поработать?",
  weaknessesHint:
    "Необязательно: привычки или поведение, на которые хотелось бы деликатно обратить внимание в истории.",
  extraInfo: "Что ещё сделает историю более личной?",

  wordsRequiredError: "Пожалуйста, напишите слова-память.",
  storyGiverCustomLabelLabel: "Опишите родство",
  storyGiverCustomLabelPlaceholder: "например: ребёнок моего двоюродного брата",

  esdalikHeading: "Страница-память",
  esdalikIntro:
    "Мы создаём в книге отдельную страницу-память для вашего ребёнка. На ней — особые слова близкого человека и настоящая фотография, где они вместе.",
  esdalikExplain:
    "Память может быть от вас или от другого близкого ребёнку человека, например: отца, матери, дедушки или бабушки.",
  esdalikFromWhoQ: "От кого эта память?",
  esdalikFromSelf: "От меня",
  esdalikFromOther: "От другого близкого человека",
  esdalikRelationshipQ: "Кем он (она) приходится ребёнку?",
  esdalikRelationshipPlaceholder: "Выберите…",
  esdalikNameLabel: "Имя",
  esdalikNamePlaceholder: "Например: Шерзодбек",
  esdalikNameError: "Пожалуйста, укажите имя для страницы-памяти.",
  esdalikVoiceQ: "Хотите сохранить эти слова ещё и своим голосом?",
  esdalikVoiceYes: "Да, оставим голосовую память",
  esdalikVoiceNo: "Нет, только текст",
  esdalikPhotoLabel: "Фотография для страницы-памяти",
  esdalikPhotoNotIllustration:
    "Эта фотография не превращается в иллюстрацию. Она размещается на странице-памяти книги в неизменном виде.",
  esdalikRelationshipError: "Пожалуйста, выберите, кем он (она) приходится ребёнку.",
  esdalikVoiceError: "Пожалуйста, выберите, оставлять ли голосовую память.",
  esdalikPhotoError: "Настоящая фотография ребёнка с автором памяти обязательна.",
  charactersTitle: "Добавить людей, которые появятся в истории",
  charactersExplain1: (multi: boolean): string =>
    multi
      ? "Здесь вы можете добавить близких людей, которых хотите видеть в истории рядом с вашими детьми — например, отца, мать, старшего брата или сестру, дедушку, бабушку или другого близкого человека."
      : "Здесь вы можете добавить близких людей, которых хотите видеть в истории рядом с вашим ребёнком — например, отца, мать, старшего брата или сестру, дедушку, бабушку или другого близкого человека.",
  charactersExplain2:
    "Нам понадобятся их роль, имя и фотографии, чтобы они были нарисованы как персонажи истории.",
  charactersToggle: "Хочу добавить людей в историю",
  characterRelationLabel: "Кем приходится",
  characterRelationPlaceholder: "Например: отец",
  characterNameLabel: "Имя",
  characterNamePlaceholder: "Например: Шерзодбек",
  charactersPhotosLabel: "Их фотографии",
  charactersPhotoHint:
    "Загрузите минимум 2 чётких, качественных фотографии, чтобы этого человека можно было нарисовать в истории.",
  addCharacter: "+ Добавить ещё человека",
  removeCharacter: "Удалить",
  characterNeedsBoth: "Укажите, кем приходится каждый человек, и его имя, либо удалите запись.",

  childPhotos: "Фотографии ребёнка",
  childPhotosHint: "3–5 чётких, хорошо освещённых фотографий с видимым лицом",
  characterPhotosMoreNeeded: (who: string) => `Для «${who}» ещё нужно минимум 2 фотографии`,
  atLeastPhotos: (min: number) => `Требуется минимум ${min} фотографии`,
  photosEnough: (n: number) => `${n} фото — достаточно`,
  photosMoreNeeded: (n: number) =>
    `Загрузите ещё ${n} фото, чтобы продолжить`,
  childPhotosMoreNeeded: (who: string) => `Для «${who}» ещё нужно минимум 3 фотографии`,
  removePhoto: "Удалить фотографию",
  photoTooLarge: "Эта фотография слишком большая. Пожалуйста, выберите файл до 15 МБ.",
  photoNotImage: "Пожалуйста, выберите файл изображения.",
  photoBroken: "Не удалось прочитать это изображение. Пожалуйста, выберите другое.",

  bookLanguageQ: "На каком языке Вы хотите получить книгу?",
  languageSoon: "Скоро будет доступно",
  numberOfCopies: "Количество экземпляров",
  total: "Итого",

  payUzHeading: "Оплата для Узбекистана",
  payUzBody: "Вы можете оплатить переводом с карты на карту, указанную ниже.",
  payIntlHeading: "Международная оплата",
  payIntlBody:
    "Для международных заказов Вы можете оплатить переводом с карты на одну из карт ниже.",
  cardNumberLabel: "Номер карты",
  cardHolderLabel: "Владелец карты",
  copyAction: "Копировать",
  copiedAction: "Скопировано",
  payNote:
    "Пока оплата принимается только переводом с карты на карту. Автоматическая онлайн-оплата появится совсем скоро.",
  receiptQ: "Загрузите чек об оплате",
  receiptHint:
    "Вы можете загрузить чек об оплате или скриншот из банковского приложения.",
  receiptDone: "Чек загружен",
  receiptReplace: "Заменить",
  receiptError: "Пожалуйста, загрузите чек об оплате, чтобы завершить заказ.",
  submitError: "Не удалось отправить Ваш заказ. Пожалуйста, попробуйте ещё раз.",
  voiceTooLongError:
    "Аудиозапись длиннее 2 минут. Вернитесь назад и сократите её или удалите, чтобы продолжить без записи.",
  consentHeading: "Согласие и электронная подпись",
  consentIntro: "Перед отправкой заказа подтвердите, как мы можем использовать предоставленные Вами сведения и фотографии.",
  consentAuthority: "Мне исполнилось 18 лет, и я являюсь родителем/законным представителем ребёнка либо имею явное разрешение родителя/законного представителя предоставить сведения и фотографии ребёнка для этого заказа.",
  consentPrivacy: "Я прочитал(а) Политику конфиденциальности и соглашаюсь на обработку TALIMOON предоставленных персональных данных и фотографий исключительно для создания, производства, доставки и сопровождения этого заказа.",
  consentTerms: "Я прочитал(а) и принимаю Условия использования, включая правила для персонализированных товаров, оплаты, производства, доставки, отмены и возврата средств.",
  consentNoMarketing: "Это согласие не разрешает использовать Ваши фотографии в рекламе или публиковать их и не подписывает Вас на маркетинговые сообщения.",
  signatureLabel: "Электронная подпись — Ваши имя и фамилия",
  signatureHint: "Введите то же полное имя, которое указано в заказе. Введённое имя и время отправки будут записаны как подтверждение принятия условий.",
  consentError: "Пожалуйста, отметьте все три подтверждения и введите полное имя в качестве электронной подписи.",
  privacyLink: "Политика конфиденциальности",
  termsLink: "Условия использования",

  reviewLanguage: "Язык книги",
  reviewAddress: "Доставка",
  reviewCharacters: "Другие персонажи",
  reviewPrivateNote: "Личная заметка для TALIMOON",
  reviewPrivateHint: "Используется только для понимания ситуации: в книге не отображается.",
  reviewGrowthContext: "Ситуации",

  // Market / destination
  orderRegion: "Регион заказа",
  marketUz: "Узбекистан",
  marketIntl: "Международный",
  change: "Изменить",
  countryQ: "Для какой страны оформляется заказ?",
  countryField: "Страна",
  countrySelect: "Выберите…",
  addrState: "Штат / область / регион",
  addrCity: "Город",
  addrLine: "Улица / адрес",
  addrPostal: "Почтовый индекс",
  addrNote: "Примечание к доставке",
  intlDelivery: "Международная почтовая доставка",
  intlDeliveryHelp: "Единая почтовая плата за весь заказ.",

  errReview:
    "Пожалуйста, укажите номер телефона, выберите язык книги, выберите страну назначения и ответьте на вопрос о доставке (с полным адресом, если нужна доставка).",
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface FormData {
  orderer: Orderer;
  recipientRelationship: RecipientRelationship;
  /** Commercial market for this order — decides the currency and the
   *  whole price list. Set from the "Order Now" that started the
   *  checkout, then editable via the "Buyurtma hududi" control on the
   *  review step. UZ ⇒ UZS, INTERNATIONAL ⇒ USD; the two never mix. */
  market: Market;
  /** Derived from `children.length` (see bookTypeForChildCount); kept
   *  on the model because pricing keys off it. The customer never
   *  sees "single" / "multi". */
  bookType: BookType;
  children: ChildProfile[];

  // ── Later chapters (still order-level for now; migrating to
  //    per-ChildProfile fields is Phase 02 work) ────────────────────
  interests: string;
  dreams: string;
  traits: TraitId[];
  weaknesses: string;
  extraInfo: string;
  /** "Who is presenting the BOOK" — a DISTINCT concept from the Esdalik
   *  author (whose words are on the keepsake page). No longer collected in
   *  the web form; kept so the intake `giftFrom` contract stays intact and
   *  is simply omitted (never fabricated, never copied from the author). */
  giftFrom: string;
  personalMessage: string;
  /** ── The STORY GIVER — the book-facing identity the personalized final
   *     page is presented FROM, to the child. Not necessarily the orderer.
   *     Established here, before the closing photo / written words / voice.
   *     `presentedAs`: "self" = the orderer is the story giver;
   *     "other_person" = the orderer is arranging it on someone's behalf. */
  storyGiverPresentedAs: "self" | "other_person";
  /** The NEW fine-grained "Bolaga kim bo'ladi?" answer for the keepsake
   *  page. "" until the customer picks one — it is ALWAYS asked (never
   *  inferred from honorific / gender / name / the coarse Phase-01 value).
   *  The coarse `storyGiver.relationshipType` sent to intake is a
   *  deterministic downcast of this (see keepsakeRelationship.coarseFor). */
  keepsakeRelationship: KeepsakeRelationship | "";
  /** only meaningful when keepsakeRelationship === "other" */
  storyGiverCustomLabel: string;
  /** a GIVEN name only (no surname) — what the child sees */
  storyGiverDisplayName: string;
  /** the explicit "Bu so'zlarni o'z ovozida ham saqlab qolishni
   *  xohlaysizmi?" answer. null = not yet answered; only `true` reveals the
   *  audio controls. Flipping to `false` clears any recorded take. */
  keepsakeWantsVoice: boolean | null;
  /** optional real voice recording of the written words (max 2 min) */
  finalVoice: File | null;
  finalVoiceDurationSec: number | null;
  /** Toggle for the additional-characters section. When on, the customer
   *  fills one {@link AdditionalCharacter} entry per person, and the
   *  photos step then generates one upload block per named entry. */
  wantsCharacters: boolean;
  additionalCharacters: AdditionalCharacter[];
  // Child photos live on each ChildProfile (`children[i].photos`) — one
  // upload block per child on the photos step, not a shared pool.
  /** the REAL keepsake photo (child + keepsake author), collected in the
   *  Esdalik section; uploaded as `kind=special_photo`. */
  specialPhoto: File | null;
  /** Stable machine code (spec §41) — "" until chosen. */
  bookLanguageCode: BookLanguageCode | "";
  copies: number;
  paymentMethod: string;
  receipt: File | null;
  consentAuthority: boolean;
  consentPrivacy: boolean;
  consentTerms: boolean;
  consentSignature: string;
}

function emptyForm(market: Market = "UZ"): FormData {
  const orderer = emptyOrderer();
  if (market === "UZ") orderer.deliveryAddress.countryCode = "UZ";
  return {
    orderer,
    recipientRelationship: { type: "parent" },
    market,
    paymentMethod: paymentMethodsForMarket(market)[0]?.id ?? "bank_transfer",
    bookType: "single",
    children: [emptyChild()],
    interests: "",
    dreams: "",
    traits: [],
    weaknesses: "",
    extraInfo: "",
    giftFrom: "",
    personalMessage: "",
    storyGiverPresentedAs: "self",
    keepsakeRelationship: "",
    storyGiverCustomLabel: "",
    storyGiverDisplayName: "",
    keepsakeWantsVoice: null,
    finalVoice: null,
    finalVoiceDurationSec: null,
    wantsCharacters: false,
    additionalCharacters: [],
    specialPhoto: null,
    bookLanguageCode: "",
    copies: 1,
    receipt: null,
    consentAuthority: false,
    consentPrivacy: false,
    consentTerms: false,
    consentSignature: "",
  };
}

/** Minimum child photos before the photos step can advance (spec §7). */
const MIN_CHILD_PHOTOS = 3;
const MAX_CHILD_PHOTOS = 5;

/**
 * THE single completion check for a wizard step (spec §6). Every
 * "can we advance?" decision routes through here — no step re-derives
 * its own rule inline. Completion is either a real required answer or,
 * where the spec allows it, an explicit alternative; there is no bare
 * "skip" for contact details, the required photos, or the payment
 * receipt.
 */
function isStepComplete(stepId: StepId, data: FormData): boolean {
  switch (stepId) {
    case "personal-touch": {
      // "Esdalik sahifasi" only. Additional characters moved to the photo
      // step — `giftFrom` is no longer collected on the web.
      const wordsOk = data.personalMessage.trim().length > 0;
      const keepsakeAuthorOk =
        data.keepsakeRelationship !== "" &&
        (data.keepsakeRelationship !== "other" ||
          data.storyGiverCustomLabel.trim().length > 0) &&
        data.storyGiverDisplayName.trim().length > 0;
      const voiceAnswered = data.keepsakeWantsVoice !== null;
      const keepsakePhotoOk = data.specialPhoto != null;
      return wordsOk && keepsakeAuthorOk && voiceAnswered && keepsakePhotoOk;
    }
    case "photos": {
      // Only photos actually accepted into state count (a rejected file
      // never reaches state). EVERY child needs its OWN at least
      // MIN_CHILD_PHOTOS. Additional characters ("Qo'shimcha qahramonlar")
      // now live here, directly after the child photos: every started
      // entry must be fully named AND carry at least MIN_CHARACTER_PHOTOS.
      // (The real keepsake photo lives on the Esdalik step, not here.)
      const childPhotosOk = data.children.every(
        (c) => (c.photos?.length ?? 0) >= MIN_CHILD_PHOTOS,
      );
      const charactersNamedOk =
        !data.wantsCharacters ||
        (data.additionalCharacters.length > 0 &&
          data.additionalCharacters.every(additionalCharacterNamed));
      const characterPhotosOk =
        !data.wantsCharacters ||
        data.additionalCharacters
          .filter(additionalCharacterNamed)
          .every((c) => c.photos.length >= MIN_CHARACTER_PHOTOS);
      return childPhotosOk && charactersNamedOk && characterPhotosOk;
    }
    case "review": {
      // Phone + book language + an answered delivery question. If the
      // customer wants INTERNATIONAL delivery, a destination country
      // and the postal address are required; UZ delivery needs a
      // region + written address; pickup needs nothing further.
      const wantsDel = deliveryRequired(data.orderer.deliveryAddress);
      const countryOk =
        !wantsDel ||
        data.market === "UZ" ||
        data.orderer.deliveryAddress.countryCode.trim().length > 0;
      return (
        data.bookLanguageCode.length > 0 &&
        data.orderer.phone.trim().length > 5 &&
        countryOk &&
        isDeliveryComplete(data.orderer.deliveryAddress, data.market)
      );
    }
    case "payment":
      // A receipt must be attached before the order can be sent
      // (spec §13). This is NOT payment verification — that stays a
      // later admin action.
      return (
        data.receipt != null &&
        data.consentAuthority &&
        data.consentPrivacy &&
        data.consentTerms &&
        data.consentSignature.length > 20
      );
    default:
      return true;
  }
}

// ─── Field / upload primitives live in ./formPrimitives ────────────────────
//    (Field, inputClass, TextInput, TextArea, PhotoUpload, MAX_PHOTO_BYTES)
//    so ./AdditionalCharacters can reuse PhotoUpload without a cycle.

// ─── Main component ─────────────────────────────────────────────────────────

export default function PersonalizedBookOrderForm({
  onBack,
  initialBookType,
  initialMarket,
}: {
  onBack: () => void;
  /**
   * Pre-selects the child count when the form is entered from a
   * pricing card that already committed to a book type (e.g.
   * PricingSection on the product page). Omitted for the /begin flow.
   */
  initialBookType?: BookType;
  /**
   * The commercial market the customer had selected when they pressed
   * "Order Now" (spec §9–10). When present it ALWAYS wins over any
   * saved preference (spec §12) and is what the whole order inherits.
   * Omitted for a generic /begin entry — the flow then resolves the
   * market from a `?market=` hint, the saved preference, or the review
   * step's "Buyurtma hududi" control.
   */
  initialMarket?: Market;
}) {
  const { language } = useLanguage();
  const locale = toLocale(language);
  /** The order sub-components (ChildWorld, phase copy helpers) now speak
   *  uz / en / ru; anything else (currently just "ar") falls back to en. */
  const bookLoc: "uz" | "en" | "ru" = locale === "uz" || locale === "ru" ? locale : "en";
  const t = useT(CHROME_EN, CHROME_UZ, CHROME_RU);

  /** Localised copy for the additional-characters sub-components (kept
   *  out of LanguageContext so they stay trivially testable). */
  const characterCopy: AdditionalCharacterCopy = {
    relationLabel: t.characterRelationLabel,
    relationPlaceholder: t.characterRelationPlaceholder,
    nameLabel: t.characterNameLabel,
    namePlaceholder: t.characterNamePlaceholder,
    photosLabel: t.charactersPhotosLabel,
    photoHint: t.charactersPhotoHint,
    addLabel: t.addCharacter,
    removeLabel: t.removeCharacter,
    removePhotoLabel: t.removePhoto,
    atLeastPhotos: t.atLeastPhotos,
    photosEnough: t.photosEnough,
    photosMoreNeeded: t.photosMoreNeeded,
    photoTooLarge: t.photoTooLarge,
    photoNotImage: t.photoNotImage,
    photoBroken: t.photoBroken,
  };

  /** Localised static copy for <EsdalikSection> (dynamic sentences come
   *  from lib/order/keepsakePhrase). Display language drives it, coerced
   *  to the uz|en|ru the phrase helpers understand. */
  const keepsakePhraseLocale: "uz" | "en" | "ru" =
    locale === "uz" || locale === "ru" ? locale : "en";
  const esdalikCopy: EsdalikCopy = {
    heading: t.esdalikHeading,
    intro: t.esdalikIntro,
    explain: t.esdalikExplain,
    fromWhoQ: t.esdalikFromWhoQ,
    fromSelf: t.esdalikFromSelf,
    fromOther: t.esdalikFromOther,
    relationshipQ: t.esdalikRelationshipQ,
    relationshipPlaceholder: t.esdalikRelationshipPlaceholder,
    customLabelLabel: t.storyGiverCustomLabelLabel,
    customLabelPlaceholder: t.storyGiverCustomLabelPlaceholder,
    nameLabel: t.esdalikNameLabel,
    namePlaceholder: t.esdalikNamePlaceholder,
    voiceQ: t.esdalikVoiceQ,
    voiceYes: t.esdalikVoiceYes,
    voiceNo: t.esdalikVoiceNo,
    photoLabel: t.esdalikPhotoLabel,
    photoNotIllustration: t.esdalikPhotoNotIllustration,
    removePhoto: t.removePhoto,
    atLeastPhotos: t.atLeastPhotos,
    photoTooLarge: t.photoTooLarge,
    photoNotImage: t.photoNotImage,
    photoBroken: t.photoBroken,
    relationshipOptions: keepsakeRelationshipOptions(locale),
  };

  // ── Market resolution (spec §11–12). Priority: the explicit market
  //    from the Order Now that started this checkout (prop) > a
  //    `?market=` URL hint > the saved preference > UZ. Once the
  //    customer touches the region control, seeding stops — an explicit
  //    action always beats stale saved state (spec §12).
  const { preference: savedMarket } = useMarketPreference();
  const [marketTouched, setMarketTouched] = useState(false);
  const resolvedInitialMarket: Market =
    initialMarket ?? marketFromLocation() ?? savedMarket ?? "UZ";

  const [phase, setPhase] = useState<
    "intro" | "world" | "character" | "heart" | "steps"
  >("intro");
  const [stepIndex, setStepIndex] = useState(0);
  /** Where the customer lands when the "Yuragingizda qolgan gaplar"
   *  screen opens: "start" going forward, "end" stepping back from
   *  the photos so edits are quick. */
  const [heartEntry, setHeartEntry] = useState<"start" | "end">("start");
  /** "end" when the customer steps BACK from the first wizard step into
   *  Phase 03, so it opens on its completion screen (spec §03). */
  const [charEntry, setCharEntry] = useState<"start" | "end">("start");
  const [data, setData] = useState<FormData>(() => emptyForm(resolvedInitialMarket));
  const [phase01Seeded, setPhase01Seeded] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  /** Latched the moment the final submit fires, so a second click /
   *  an Enter race can't send the order twice (spec §6). */
  const [submitting, setSubmitting] = useState(false);
  const [showStepError, setShowStepError] = useState(false);
  /** Set only on a failed submit attempt; cleared at the start of the next
   *  one. Never carries the raw error — see submitOrderFlow(). */
  const [submitError, setSubmitError] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);
  /** Generated once for the whole submission attempt and reused on every
   *  retry, so a network retry never creates a second order (spec: the
   *  backend dedupes POST /v1/orders by this key). */
  const idempotencyKeyRef = useRef<string | null>(null);
  /** Immutable consent receipt for this submission. It is created only
   * when the customer presses Send and reused verbatim on a retry. */
  const consentAcceptedAtRef = useRef<string | null>(null);
  /** The capability token lives ONLY here — component memory for the
   *  active flow. Never written to localStorage/sessionStorage/cookies,
   *  never logged. Per-item `*Done` flags let a retry (after e.g. an
   *  upload fails) resume without re-sending artifacts that already
   *  landed — resending an already-stored photo would get a NEW sequential
   *  filename server-side and create a duplicate, not a harmless no-op. */
  const orderSessionRef = useRef<{
    orderCode: string;
    capabilityToken: string;
    childSlots: Array<{ childRef: string }>;
    /** [childIndex][photoIndex] — one done-flag per child's own photo, not
     *  a single flat pool (see planChildPhotoUploads). */
    childPhotoDone: boolean[][];
    specialPhotoDone: boolean;
    finalVoiceDone: boolean;
    characterPhotoDone: boolean[];
    receiptDone: boolean;
  } | null>(null);

  // Switching market is ONE atomic transition (spec §17): currency,
  // every price, the delivery rules AND any stale delivery/address
  // state for the other market change together. Nothing is left that
  // could still feed the total.
  function changeMarket(next: Market) {
    setMarketTouched(true);
    setMarketPreference(next);
    setData((prev) => {
      if (prev.market === next) return prev;
      return {
        ...prev,
        market: next,
        orderer: {
          ...prev.orderer,
          deliveryAddress: resetDeliveryForMarket(prev.orderer.deliveryAddress, next),
        },
        paymentMethod: paymentMethodsForMarket(next)[0]?.id ?? prev.paymentMethod,
        receipt: null,
      };
    });
    setShowStepError(false);
  }

  // Seed the market from a `?market=` hint or the saved preference for a
  // plain /begin entry. The saved value is invisible to the `useState`
  // initializer (it only lands after hydration), so this reconciles it
  // in during render — React's supported "adjust state while rendering"
  // pattern, no effect, no cascading-render lint. It stops the moment
  // the customer has an explicit market: a prop, a URL hint, or a tap
  // on the region control (spec §12 — an explicit action always wins).
  const seedMarket = !initialMarket && !marketTouched
    ? marketFromLocation() ?? savedMarket
    : null;
  if (seedMarket && seedMarket !== data.market) {
    setData((prev) =>
      prev.market === seedMarket
        ? prev
        : {
            ...prev,
            market: seedMarket,
            orderer: {
              ...prev.orderer,
              deliveryAddress: resetDeliveryForMarket(
                prev.orderer.deliveryAddress,
                seedMarket,
              ),
            },
            paymentMethod:
              paymentMethodsForMarket(seedMarket)[0]?.id ?? prev.paymentMethod,
          },
    );
  }

  const step = STEPS[stepIndex];
  const stepTitle = language === "UZ" ? step.titleUz : step.title;
  const isLastStep = stepIndex === STEPS.length - 1;

  // Bring each new wizard step to a consistent entry position (spec §8).
  // The conversational phases (intro/world/character/heart) run their
  // own useFlowScroll; keep this key stable across them so it fires only
  // on a real step change here.
  useFlowScroll(phase === "steps" ? `step-${step.id}` : "flow");

  // THE order total — one deterministic, market-aware derivation the
  // review breakdown AND the payment amount both read (spec §26). The
  // whole result is in ONE currency (UZS or USD, from `data.market`);
  // delivery is only ever billed when the customer actively chose it.
  const wantsDelivery = deliveryRequired(data.orderer.deliveryAddress);
  const totals = useMemo(
    () =>
      calculateOrderTotal({
        market: data.market,
        bookType: data.bookType,
        copies: data.copies,
        deliveryRequired: wantsDelivery,
        regionCode: data.orderer.deliveryAddress.regionCode,
      }),
    [
      data.market,
      data.bookType,
      data.copies,
      wantsDelivery,
      data.orderer.deliveryAddress.regionCode,
    ],
  );
  /** Every money figure in this flow prints through here, so one order
   *  is always shown in one currency. */
  const money = (n: number) => formatMoney(n, totals.currency);
  const deliveryRowLabel =
    data.market === "INTERNATIONAL" ? t.intlDelivery : t.rowDelivery;

  function update<K extends keyof FormData>(
    key: K,
    value: FormData[K] | ((prev: FormData[K]) => FormData[K]),
  ) {
    setData((prev) => ({
      ...prev,
      [key]:
        typeof value === "function"
          ? (value as (p: FormData[K]) => FormData[K])(prev[key])
          : value,
    }));
    setShowStepError(false);
  }

  /** The explicit "Ovozli esdalik?" answer. Choosing "Yo'q" also DISCARDS
   *  any take already recorded under an earlier "Ha", so a stale recording
   *  can never be submitted or declared as an active voice keepsake. */
  function setKeepsakeWantsVoice(v: boolean) {
    setData((prev) => ({
      ...prev,
      keepsakeWantsVoice: v,
      ...(v ? {} : { finalVoice: null, finalVoiceDurationSec: null }),
    }));
    setShowStepError(false);
  }

  /** Merge one or more Esdalik-section fields into FormData. Never touches
   *  `giftFrom` — the keepsake author is a distinct concept. */
  function patchEsdalik(patch: {
    storyGiverPresentedAs?: "self" | "other_person";
    keepsakeRelationship?: KeepsakeRelationship | "";
    storyGiverCustomLabel?: string;
    storyGiverDisplayName?: string;
    personalMessage?: string;
  }) {
    setData((prev) => ({ ...prev, ...patch }));
    setShowStepError(false);
  }

  function updateOrderer<K extends keyof Orderer>(key: K, value: Orderer[K]) {
    setData((prev) => ({ ...prev, orderer: { ...prev.orderer, [key]: value } }));
    setShowStepError(false);
  }

  function updateAddress<K extends keyof DeliveryAddress>(
    key: K,
    value: DeliveryAddress[K],
  ) {
    setData((prev) => ({
      ...prev,
      orderer: {
        ...prev.orderer,
        deliveryAddress: { ...prev.orderer.deliveryAddress, [key]: value },
      },
    }));
    setShowStepError(false);
  }

  // ── Optional delivery location (spec §44–49). Two explicit choices:
  //    "Hozirgi joylashuvimni yuborish" (browser geolocation) and
  //    "Xaritadan joy tanlash" (an interactive Google map pick, which may
  //    be somewhere other than where the customer is now). Both produce the
  //    same normalized `DeliveryLocation`. Nothing is requested on load; a
  //    denial / no support / no map key never blocks checkout — the written
  //    address is always enough.
  const [locState, setLocState] = useState<
    "idle" | "loading" | "denied" | "unsupported"
  >("idle");
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  function requestLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocState("unsupported");
      return;
    }
    setLocState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: DeliveryLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Number.isFinite(pos.coords.accuracy)
            ? pos.coords.accuracy
            : undefined,
          source: "device",
          confirmedByCustomer: true,
        };
        updateAddress("location", loc);
        setLocState("idle");
      },
      () => setLocState("denied"),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  function handleMapConfirm(loc: DeliveryLocation) {
    updateAddress("location", loc);
    setLocState("idle");
    setMapPickerOpen(false);
  }

  function clearLocation() {
    updateAddress("location", undefined);
    setLocState("idle");
  }

  const mapsKeyPresent = Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY,
  );

  function handlePhase01(result: Phase01Result) {
    setData((prev) => ({
      ...prev,
      orderer: {
        ...prev.orderer,
        honorific: result.ordererHonorific,
        name: result.ordererName,
      },
      recipientRelationship: result.recipientRelationship,
      children: result.children,
      bookType: bookTypeForChildCount(result.children.length),
      // Seed only what Phase 01 genuinely establishes: by default the
      // orderer IS the keepsake author, and their given name is a safe
      // prefill for "Ismi" (editable). The fine-grained "Bolaga kim
      // bo'ladi?" relationship is NEVER seeded here — Phase 01 only holds
      // the coarse orderer→child value, and inferring the exact
      // (gendered) keepsake relationship from it is forbidden. The Esdalik
      // step always asks it.
      storyGiverPresentedAs: "self",
      keepsakeRelationship: "",
      storyGiverCustomLabel: "",
      storyGiverDisplayName:
        prev.storyGiverDisplayName.trim() ||
        result.ordererName.trim().split(/\s+/)[0] ||
        "",
    }));
    setPhase01Seeded(true);
    setPhase("world");
    setStepIndex(0);
    setShowStepError(false);
  }

  function patchChild(id: string, p: Partial<ChildProfile>) {
    setData((prev) => ({
      ...prev,
      children: prev.children.map((ch) => (ch.id === id ? { ...ch, ...p } : ch)),
    }));
  }

  // ── Additional characters — structured, repeatable entries. The photo
  //    step derives its upload blocks one-per-named-entry from this list,
  //    so keeping it clean here is what keeps that step in sync.
  function toggleWantsCharacters(v: boolean) {
    setData((prev) => ({
      ...prev,
      wantsCharacters: v,
      additionalCharacters: v
        ? prev.additionalCharacters.length > 0
          ? prev.additionalCharacters
          : [emptyAdditionalCharacter()]
        : [],
    }));
    setShowStepError(false);
  }

  function addAdditionalCharacter() {
    setData((prev) =>
      prev.additionalCharacters.length >= MAX_ADDITIONAL_CHARACTERS
        ? prev
        : {
            ...prev,
            additionalCharacters: [
              ...prev.additionalCharacters,
              emptyAdditionalCharacter(),
            ],
          },
    );
    setShowStepError(false);
  }

  function patchAdditionalCharacter(id: string, p: Partial<AdditionalCharacter>) {
    setData((prev) => ({
      ...prev,
      additionalCharacters: prev.additionalCharacters.map((c) =>
        c.id === id ? { ...c, ...p } : c,
      ),
    }));
    setShowStepError(false);
  }

  function removeAdditionalCharacter(id: string) {
    setData((prev) => ({
      ...prev,
      additionalCharacters: prev.additionalCharacters.filter((c) => c.id !== id),
    }));
    setShowStepError(false);
  }

  /**
   * The real submit path: Turnstile → create order → upload every
   * declared artifact → finalize → the existing success screen. Safe to
   * call again after a failure — it resumes from whatever already
   * succeeded (same idempotencyKey, same order, only not-yet-uploaded
   * artifacts, finalize is backend-idempotent on retry).
   */
  async function submitOrderFlow(): Promise<void> {
    try {
      if (!consentAcceptedAtRef.current) {
        consentAcceptedAtRef.current = new Date().toISOString();
      }
      if (!idempotencyKeyRef.current) {
        if (typeof crypto === "undefined" || !crypto.randomUUID) {
          throw new Error(t.submitError);
        }
        idempotencyKeyRef.current = crypto.randomUUID();
      }

      const namedCharacters = data.additionalCharacters.filter(additionalCharacterNamed);

      let session = orderSessionRef.current;
      if (!session) {
        if (!isBackendBookLanguage(data.bookLanguageCode)) {
          throw new Error(t.submitError);
        }
        const token = await turnstileRef.current?.execute();
        if (!token) throw new Error(t.submitError);

        const addressText = buildAddressText(data.orderer.deliveryAddress, data.market, bookLoc);
        const characterPhotoCount = namedCharacters.reduce((n, c) => n + c.photos.length, 0);
        const extraCharactersText =
          namedCharacters.length > 0
            ? namedCharacters.map((c) => additionalCharacterLabel(c)).join("; ")
            : undefined;
        // "Tarbiyaviy yo'nalish" — the values the story should strengthen,
        // taken from every child's Phase 03 `desiredValues` (deduped).
        const desiredValues = orderDesiredValueLabels(data.children, bookLoc);

        const payload = buildSubmitPayload({
          idempotencyKey: idempotencyKeyRef.current,
          turnstileToken: token,
          market: data.market,
          bookType: data.bookType,
          copies: data.copies,
          deliveryRequired: wantsDelivery,
          regionCode: data.orderer.deliveryAddress.regionCode || undefined,
          countryCode: data.orderer.deliveryAddress.countryCode || undefined,
          // The customer-confirmed delivery pin, when they set one. A
          // written address is still required; this never replaces it.
          deliveryLocation: data.orderer.deliveryAddress.location ?? undefined,
          clientDeclaredTotal: totals.grandTotal,
          declaredArtifacts: {
            childPhotoCount: data.children.reduce((n, c) => n + (c.photos?.length ?? 0), 0),
            // The real keepsake photo (child + keepsake author) is always
            // required for the Esdalik page.
            wantsSpecialPhoto: true,
            characterPhotoCount,
            hasReceipt: data.receipt != null,
            // ONLY declare a voice memory when the customer explicitly chose
            // "Ha" AND a take is actually held — a stale recording from an
            // earlier "Ha" that was switched back to "Yo'q" is never sent.
            hasFinalVoice: data.keepsakeWantsVoice === true && data.finalVoice != null,
          },
          orderer: { fullName: data.orderer.name, phone: data.orderer.phone },
          addressText,
          // Structured relationship of the orderer to the child(ren) —
          // collected in Phase 01, sent as-is (type + optional custom
          // words), never a rendered label.
          recipientRelationship: data.recipientRelationship,
          // Per-child Story Profile text, serialised from the Phase 02 /
          // Phase 03 answers held on each ChildProfile. Left undefined when
          // the customer skipped that section — the renderer then shows
          // "taqdim etilmagan" rather than a fabricated value.
          children: data.children.map((c) => ({
            name: c.name,
            age: c.age,
            relationship: c.relationship,
            interests: childInterestsText(c, bookLoc),
            dreams: childDreamsText(c, bookLoc),
            strengths: childStrengthsText(c, bookLoc),
            growthAreas: childGrowthText(c, bookLoc),
          })),
          interests: data.interests || undefined,
          dreams: data.dreams || undefined,
          traits: desiredValues,
          weaknesses: data.weaknesses || undefined,
          extraInfo: orderEmotionalText(data.children, bookLoc),
          giftFrom: data.giftFrom || undefined,
          // The keepsake words — required whenever a keepsake author is set
          // (which is always, for a personalized book).
          personalMessage: data.personalMessage.trim() || undefined,
          // The keepsake author ("Esdalik sahifasi"). `keepsakeRelationship`
          // is the NEW fine-grained canonical value the customer picked;
          // `relationshipType` is its deterministic coarse downcast, kept
          // for the legacy intake contract (never reinterpreted).
          storyGiver: {
            relationshipType: coarseKeepsakeRelationship(
              (data.keepsakeRelationship || "other") as KeepsakeRelationship,
            ),
            keepsakeRelationship:
              (data.keepsakeRelationship || undefined) as KeepsakeRelationship | undefined,
            customLabel:
              data.keepsakeRelationship === "other"
                ? data.storyGiverCustomLabel.trim() || undefined
                : undefined,
            displayName: data.storyGiverDisplayName.trim(),
            presentedAs: data.storyGiverPresentedAs,
            voiceRequested: data.keepsakeWantsVoice === true,
          },
          extraCharacters: extraCharactersText,
          bookLanguage: data.bookLanguageCode,
        consent: {
              schema: "talimoon-order-consent-v1",
              acceptedAt: consentAcceptedAtRef.current,
              locale: bookLoc,
              electronicSignature: data.orderer.name.trim(),
              drawnSignature: data.consentSignature,
              adultAndChildAuthority: true,
              privacyAccepted: true,
              privacyVersion: PRIVACY_POLICY_VERSION,
              termsAccepted: true,
              termsVersion: TERMS_VERSION,
              marketingConsent: false,
        },
        });

        const result = await submitOrder(payload);
        session = {
          orderCode: result.orderCode,
          capabilityToken: result.capabilityToken,
          childSlots: result.childSlots,
          childPhotoDone: data.children.map((c) => (c.photos ?? []).map(() => false)),
          specialPhotoDone: false,
          finalVoiceDone: false,
          characterPhotoDone: namedCharacters.flatMap((c) => c.photos.map(() => false)),
          receiptDone: false,
        };
        orderSessionRef.current = session;
      }

      const { orderCode, capabilityToken, childSlots } = session;

      // Each child has its own photos and its own backend childRef (see
      // planChildPhotoUploads for the proven childSlots[i] <-> children[i]
      // ordering contract). Only not-yet-uploaded photos are included, so a
      // retry never re-sends (and duplicates) a photo that already landed.
      const childPhotoTasks = planChildPhotoUploads(
        data.children.map((c) => ({ photos: c.photos ?? [] })),
        childSlots,
        session.childPhotoDone,
      );
      for (const task of childPhotoTasks) {
        await uploadFile({
          orderCode,
          capabilityToken,
          kind: "child_photo",
          file: task.file,
          childRef: task.childRef,
        });
        session.childPhotoDone[task.childIndex][task.photoIndex] = true;
      }

      if (data.specialPhoto && !session.specialPhotoDone) {
        await uploadFile({ orderCode, capabilityToken, kind: "special_photo", file: data.specialPhoto });
        session.specialPhotoDone = true;
      }

      // The keepsake author's optional voice recording — uploaded ONLY when
      // the customer explicitly chose "Ha" and a take is held. A recording
      // left over from a "Ha" that was later switched to "Yo'q" is never
      // uploaded (and was never declared, so finalize does not expect it).
      if (
        data.keepsakeWantsVoice === true &&
        data.finalVoice &&
        !session.finalVoiceDone
      ) {
        await uploadFile({
          orderCode,
          capabilityToken,
          kind: "final_voice",
          file: data.finalVoice,
          durationSec: data.finalVoiceDurationSec ?? undefined,
        });
        session.finalVoiceDone = true;
      }

      let charIdx = 0;
      for (const character of namedCharacters) {
        for (const photo of character.photos) {
          const k = charIdx++;
          if (session.characterPhotoDone[k]) continue;
          await uploadFile({
            orderCode,
            capabilityToken,
            kind: "character_photo",
            file: photo,
            // Lets the backend name the stored file after this character
            // (e.g. "Singlisi_Madina_01.png") instead of a generic number.
            characterRole: character.relation.trim(),
            characterName: character.name.trim(),
          });
          session.characterPhotoDone[k] = true;
        }
      }

      if (data.receipt && !session.receiptDone) {
        await uploadFile({ orderCode, capabilityToken, kind: "receipt", file: data.receipt });
        session.receiptDone = true;
      }

      await finalizeOrder({
        orderCode,
        capabilityToken,
        notify: { customerName: data.orderer.name, phone: data.orderer.phone },
      });

      setSubmitted(true);
    } catch (err) {
      // Never surface the raw error (status text, validation detail) to the
      // customer — same "never leak internals" posture as the backend. The
      // ONE exception: an over-length voice note, where a specific hint
      // ("shorten or remove it") is actionable and not sensitive.
      const voiceTooLong =
        err instanceof IntakeApiError && err.code === "audio_too_long";
      setSubmitError(voiceTooLong ? t.voiceTooLongError : t.submitError);
      setSubmitting(false);
    }
  }

  /** This step's gate — one call into the centralized rule (spec §6). */
  const canContinue = () => isStepComplete(step.id, data);
  /** Whether the primary button should read as ready (also false while a
   *  submit is in flight). */
  const stepReady = !submitting && canContinue();

  function goNext() {
    // Guard against a double-fire (double click / Enter + click / a
    // stale re-render): once a submit is in flight, or the step isn't
    // complete, nothing advances.
    if (submitting) return;
    if (!canContinue()) {
      setShowStepError(true);
      return;
    }
    // "Yuragingizda qolgan gaplar" lives between "a personal touch" and
    // the photos — its own quiet screen, not a wizard step.
    if (step.id === "personal-touch") {
      setHeartEntry("start");
      setPhase("heart");
      setShowStepError(false);
      return;
    }
    if (isLastStep) {
      setSubmitting(true);
      setSubmitError(null);
      void submitOrderFlow();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    setShowStepError(false);
  }

  function goBack() {
    // Back from the photos returns through "Yuragingizda qolgan gaplar",
    // landing on its acknowledgement so an edit is one step away.
    if (step.id === "photos") {
      setHeartEntry("end");
      setPhase("heart");
      setShowStepError(false);
      return;
    }
    // Back from the FIRST wizard step goes to the immediately previous
    // screen — the end of Phase 03 ("the child's character") — NOT all
    // the way back to Phase 01 (spec §03).
    if (stepIndex === 0) {
      setCharEntry("end");
      setPhase("character");
      setShowStepError(false);
      return;
    }
    setStepIndex((i) => Math.max(i - 1, 0));
    setShowStepError(false);
  }

  // ── Phase 01: the conversational opening ──────────────────────────────────
  if (phase === "intro") {
    return (
      <Phase01
        onBack={onBack}
        onComplete={handlePhase01}
        initialChildCount={
          initialBookType ? (initialBookType === "multi" ? 2 : 1) : undefined
        }
        initial={
          phase01Seeded
            ? {
                ordererHonorific: data.orderer.honorific,
                ordererName: data.orderer.name,
                recipientRelationship: data.recipientRelationship,
                children: data.children,
              }
            : undefined
        }
      />
    );
  }

  // ── Phase 02: the child's world ──────────────────────────────────────────
  if (phase === "world") {
    return (
      <Phase02
        childrenIn={data.children}
        onPatchChild={patchChild}
        onBack={() => setPhase("intro")}
        onComplete={() => {
          setCharEntry("start");
          setPhase("character");
        }}
      />
    );
  }

  // ── Phase 03: the child's character ─────────────────────────────────────
  if (phase === "character") {
    return (
      <Phase03
        childrenIn={data.children}
        onPatchChild={patchChild}
        entry={charEntry}
        onBack={() => {
          setCharEntry("start");
          setPhase("world");
        }}
        onComplete={() => {
          setPhase("steps");
          setStepIndex(0);
          setShowStepError(false);
        }}
      />
    );
  }

  // ── "Yuragingizda qolgan gaplar" — the emotional bridge ─────────────────
  //    A quiet screen between "a personal touch" and the photo upload.
  if (phase === "heart") {
    return (
      <EmotionalBridge
        childrenIn={data.children}
        entry={heartEntry}
        onPatchChild={patchChild}
        onBack={() => {
          setPhase("steps");
          setStepIndex(PERSONAL_TOUCH_STEP);
          setShowStepError(false);
        }}
        onComplete={() => {
          setPhase("steps");
          setStepIndex(PHOTOS_STEP);
          setShowStepError(false);
        }}
      />
    );
  }

  if (submitted) {
    // The order is SUBMITTED — not in production. It goes SUBMITTED →
    // REVIEW → CONFIRMED → PREPARATION (5–7 days) → READY → DELIVERY.
    return (
      <section
        data-order-flow=""
        className="mx-auto flex min-h-[560px] w-full max-w-container-content flex-col items-center bg-surface-base px-6 py-16 md:py-20 lg:py-28"
      >
        <div className="mx-auto max-w-md text-center">
          <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent-primary/[0.14]">
            <Check size={24} strokeWidth={2} className="text-accent-primary" />
          </span>
          <h2 className="font-display text-[26px] font-medium leading-tight text-text-primary">
            {t.doneHeading}
          </h2>
          <div className="mt-4 space-y-3 font-sans text-[14px] leading-[1.65] text-text-secondary">
            {t.doneBody.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <p className="mt-6 font-sans text-[12.5px] leading-[1.6] text-text-muted">
            {t.doneNote}
          </p>
        </div>
      </section>
    );
  }

  const StepIcon = step.icon;
  const heroLine = data.children
    .map((ch) => `${ch.name.trim()}${t.years(ch.age)}`)
    .filter((s) => s.trim().length > 0)
    .join(" · ");
  const respectfulName = formatRespectfulName(
    locale,
    data.orderer.honorific,
    data.orderer.name,
  );
  /** Trimmed, non-empty child first names, in order — for the Esdalik
   *  section's name-aware message + photo copy. */
  const esdalikChildNames = data.children
    .map((c) => c.name.trim())
    .filter((n) => n.length > 0);

  return (
    <section
      data-order-flow=""
      className="mx-auto w-full max-w-container-content bg-surface-base px-6 py-16 sm:px-8 md:py-20 lg:px-16 lg:py-28"
    >
      {/* Invisible/managed — renders no visible UI. See Turnstile.tsx. */}
      <Turnstile ref={turnstileRef} siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
      {submitting && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1C2A3A]/35 px-6 backdrop-blur-[3px]"
          role="status"
          aria-live="assertive"
          aria-busy="true"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/70 bg-surface-base px-7 py-8 text-center shadow-[0_24px_70px_rgba(28,42,58,0.28)]">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-accent-primary/25 bg-accent-primary/[0.1]">
              <LoaderCircle
                size={27}
                strokeWidth={1.8}
                className="animate-spin text-accent-primary"
                aria-hidden="true"
              />
            </span>
            <h3 className="mt-5 font-display text-[23px] font-medium leading-tight text-text-primary">
              {t.submittingTitle}
            </h3>
            <p className="mt-2 font-sans text-[13.5px] leading-[1.65] text-text-secondary">
              {t.submittingBody}
            </p>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-xl">
        {/* Chapter header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 font-sans text-[13px] font-medium text-text-secondary transition-opacity hover:opacity-70"
          >
            <ArrowLeft size={14} strokeWidth={1.75} className="rtl:-scale-x-100" />
            {t.back}
          </button>
          <JourneyProgress locale={locale} current={step.chapter} />
        </div>

        {/* Who this story is for — a quiet reminder from Phase 01 */}
        {heroLine && (
          <p className="mb-6 font-sans text-[12.5px] text-text-secondary">
            <span className="font-medium uppercase tracking-[0.12em] text-text-muted">
              {t.heroesLabel}
            </span>
            <span className="mx-2 text-border-strong">·</span>
            {heroLine}
          </p>
        )}

        <span
          className="mx-auto mb-3.5 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-accent-primary/[0.12]"
          aria-hidden="true"
        >
          <StepIcon size={22} strokeWidth={1.5} className="text-accent-primary" />
        </span>
        <h2 className="mb-8 text-center font-display text-[26px] font-medium leading-tight text-text-primary">
          {stepTitle}
        </h2>

        {/* Step content */}
        <div className="space-y-5">
          {/* "personalize" step removed — qualities, growth behaviour and
              desired values are now collected per child in Phase 03
              ("the child's character"). */}

          {step.id === "personal-touch" && (
            <>
              {/* "Bu sovg'a kimdan?" (giftFrom) is no longer collected here —
                  it duplicated the Esdalik author question. The backend
                  `giftFrom` contract is untouched (it stays optional and
                  simply unset for web orders); it is never fabricated or
                  copied from the Esdalik author. */}

              {/* ── ESDALIK SAHIFASI — the keepsake page, in one calm
                     top-to-bottom flow. Extracted into <EsdalikSection> so
                     the dynamic photo instruction + message example live in
                     one tested place and the section is compact on mobile. */}
              <EsdalikSection
                copy={esdalikCopy}
                locale={keepsakePhraseLocale}
                childNames={esdalikChildNames}
                presentedAs={data.storyGiverPresentedAs}
                keepsakeRelationship={data.keepsakeRelationship}
                customLabel={data.storyGiverCustomLabel}
                displayName={data.storyGiverDisplayName}
                personalMessage={data.personalMessage}
                wantsVoice={data.keepsakeWantsVoice}
                specialPhoto={data.specialPhoto}
                onPatch={patchEsdalik}
                onSetWantsVoice={setKeepsakeWantsVoice}
                onSpecialPhotoChange={(file) => update("specialPhoto", file)}
                renderVoice={() => (
                  <VoiceMemory
                    value={data.finalVoice}
                    onChange={(file, durationSec) => {
                      update("finalVoice", file);
                      update("finalVoiceDurationSec", durationSec);
                    }}
                  />
                )}
              />

              {/* "Qo'shimcha qahramonlar" now lives on the photo step,
                  directly after "Farzandingiz suratlari" — not here in
                  the Esdalik section. */}

              {showStepError && !canContinue() && (
                <p role="alert" className="font-sans text-[13px] text-state-error">
                  {data.keepsakeRelationship === "" ||
                  (data.keepsakeRelationship === "other" &&
                    data.storyGiverCustomLabel.trim().length === 0)
                    ? t.esdalikRelationshipError
                    : data.storyGiverDisplayName.trim().length === 0
                      ? t.esdalikNameError
                      : data.personalMessage.trim().length === 0
                        ? t.wordsRequiredError
                        : data.keepsakeWantsVoice === null
                          ? t.esdalikVoiceError
                          : data.specialPhoto == null
                            ? t.esdalikPhotoError
                            : ""}
                </p>
              )}
            </>
          )}

          {step.id === "photos" && (
            <>
              {/* One child ⇒ exactly the same single block as before (spec:
                  single-child UX unchanged). 2+ children ⇒ one block PER
                  CHILD, named, so it's unambiguous which photos belong to
                  whom — same PhotoUpload primitive, same visual language as
                  the additional-characters photo blocks below. */}
              {data.children.length <= 1 ? (
                <PhotoUpload
                  label={t.childPhotos}
                  hint={t.childPhotosHint}
                  removeLabel={t.removePhoto}
                  atLeastLabel={t.atLeastPhotos}
                  enoughLabel={t.photosEnough}
                  moreNeededLabel={t.photosMoreNeeded}
                  tooLargeLabel={t.photoTooLarge}
                  notImageLabel={t.photoNotImage}
                  brokenLabel={t.photoBroken}
                  files={data.children[0]?.photos ?? []}
                  min={MIN_CHILD_PHOTOS}
                  max={MAX_CHILD_PHOTOS}
                  onChange={(files) =>
                    data.children[0] && patchChild(data.children[0].id, { photos: files })
                  }
                />
              ) : (
                <div className="space-y-5" data-testid="per-child-photos">
                  <p className="font-sans text-[13px] font-medium text-text-primary">
                    {t.childPhotos}
                  </p>
                  {data.children.map((child) => (
                    <PhotoUpload
                      key={child.id}
                      label={child.name.trim() || t.childPhotos}
                      hint={t.childPhotosHint}
                      removeLabel={t.removePhoto}
                      atLeastLabel={t.atLeastPhotos}
                      enoughLabel={t.photosEnough}
                      moreNeededLabel={t.photosMoreNeeded}
                      tooLargeLabel={t.photoTooLarge}
                      notImageLabel={t.photoNotImage}
                      brokenLabel={t.photoBroken}
                      files={child.photos ?? []}
                      min={MIN_CHILD_PHOTOS}
                      max={MAX_CHILD_PHOTOS}
                      onChange={(files) => patchChild(child.id, { photos: files })}
                    />
                  ))}
                </div>
              )}

              {/* The real keepsake photo ("Esdalik surati") is collected in
                  the Esdalik section on the personal-touch step, not here. */}

              {/* ── QO'SHIMCHA QAHRAMONLAR — real people to appear INSIDE
                     the story, directly after "Farzandingiz suratlari".
                     Relocated here from the Esdalik section; the only
                     additional-characters block in the form. Each person is
                     one card: Kimligi + Ismi + that person's own photos. */}
              <div className="space-y-3 border-t border-border-subtle pt-6">
                <div className="space-y-1.5">
                  <p className="font-sans text-[13px] font-semibold text-text-primary">
                    {t.charactersTitle}
                  </p>
                  <p className="font-sans text-[12px] leading-[1.5] text-text-secondary">
                    {t.charactersExplain1(data.children.length > 1)}
                  </p>
                  <p className="font-sans text-[12px] leading-[1.5] text-text-secondary">
                    {t.charactersExplain2}
                  </p>
                </div>
                <SwitchRow
                  label={t.charactersToggle}
                  checked={data.wantsCharacters}
                  onChange={toggleWantsCharacters}
                />
                {data.wantsCharacters && (
                  <AdditionalCharacterCards
                    characters={data.additionalCharacters}
                    copy={characterCopy}
                    onPatch={patchAdditionalCharacter}
                    onAdd={addAdditionalCharacter}
                    onRemove={removeAdditionalCharacter}
                  />
                )}
              </div>

              {showStepError && !canContinue() && (
                <p role="alert" className="font-sans text-[13px] text-state-error">
                  {(() => {
                    const shortChild = data.children.find(
                      (c) => (c.photos?.length ?? 0) < MIN_CHILD_PHOTOS,
                    );
                    if (shortChild) {
                      const have = shortChild.photos?.length ?? 0;
                      return data.children.length <= 1
                        ? t.photosMoreNeeded(MIN_CHILD_PHOTOS - have)
                        : t.childPhotosMoreNeeded(shortChild.name.trim() || t.childPhotos);
                    }
                    // a started additional-character entry left half-filled
                    if (
                      data.wantsCharacters &&
                      (data.additionalCharacters.length === 0 ||
                        !data.additionalCharacters.every(additionalCharacterNamed))
                    ) {
                      return t.characterNeedsBoth;
                    }
                    const shortCharacter = data.additionalCharacters
                      .filter(additionalCharacterNamed)
                      .find((c) => c.photos.length < MIN_CHARACTER_PHOTOS);
                    if (shortCharacter) {
                      return t.characterPhotosMoreNeeded(
                        additionalCharacterLabel(shortCharacter),
                      );
                    }
                    return t.photosMoreNeeded(0);
                  })()}
                </p>
              )}
            </>
          )}

          {step.id === "review" && (
            <>
              <div className="rounded-lg border border-border-default p-4">
                <p className="mb-3 font-sans text-[12px] font-medium uppercase tracking-[0.12em] text-text-muted">
                  {t.heroesLabel}
                  <span className="mx-2 text-border-strong">·</span>
                  <span className="text-text-secondary">
                    {relationshipLabel(data.recipientRelationship, locale)}
                  </span>
                </p>
                <p className="font-display text-[16px] font-medium text-text-primary">
                  {heroLine}
                </p>
                {respectfulName && (
                  <p className="mt-2 font-sans text-[12.5px] text-text-secondary">
                    {respectfulName}
                  </p>
                )}
              </div>

              {/* What we gathered per child — the full portrait, plus the
                  per-behaviour situations and (collapsed, never exposed)
                  the private note (spec §50). */}
              {data.children.map((ch) => {
                const contexts = (ch.growthBehaviors ?? [])
                  .filter((b) => (b.context ?? "").trim().length > 0)
                  .map((b) => ({
                    label: growthFull(b.id, bookLoc),
                    context: (b.context ?? "").trim(),
                  }));
                const eb = ch.emotionalBridge;
                const hasPrivate =
                  !!eb &&
                  [
                    eb.privateContext,
                    eb.childExperience,
                    eb.intendedFeeling,
                    eb.sensitivities,
                  ].some((s) => (s ?? "").trim().length > 0);
                return (
                  <div key={ch.id} className="space-y-3">
                    <ChildWorld
                      child={ch}
                      locale={bookLoc}
                      variant="full"
                      phase="character"
                    />
                    {contexts.length > 0 && (
                      <div className="rounded-md border border-border-subtle px-4 py-3">
                        <p className="mb-1.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                          {t.reviewGrowthContext}
                        </p>
                        <ul className="space-y-1">
                          {contexts.map((c2, i) => (
                            <li
                              key={i}
                              className="font-sans text-[13px] leading-[1.5] text-text-secondary"
                            >
                              <span className="text-text-primary">{c2.label}</span> —{" "}
                              {c2.context}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {hasPrivate && (
                      <details className="rounded-md border border-border-subtle px-4 py-3">
                        <summary className="cursor-pointer font-sans text-[12px] font-medium text-text-secondary">
                          {t.reviewPrivateNote}
                        </summary>
                        <p className="mt-2 font-sans text-[12px] text-text-muted">
                          {t.reviewPrivateHint}
                        </p>
                        <div className="mt-2 space-y-1.5 font-sans text-[13px] leading-[1.55] text-text-secondary">
                          {(eb?.privateContext ?? "").trim() && (
                            <p>{eb!.privateContext!.trim()}</p>
                          )}
                          {(eb?.childExperience ?? "").trim() && (
                            <p>{eb!.childExperience!.trim()}</p>
                          )}
                          {(eb?.intendedFeeling ?? "").trim() && (
                            <p>{eb!.intendedFeeling!.trim()}</p>
                          )}
                          {(eb?.sensitivities ?? "").trim() && (
                            <p>{eb!.sensitivities!.trim()}</p>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}

              {data.wantsCharacters &&
                data.additionalCharacters.some(additionalCharacterNamed) && (
                  <div className="rounded-md border border-border-subtle px-4 py-3">
                    <p className="mb-1.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                      {t.reviewCharacters}
                    </p>
                    <ol className="space-y-1">
                      {data.additionalCharacters
                        .filter(additionalCharacterNamed)
                        .map((c, i) => (
                          <li
                            key={c.id}
                            className="font-sans text-[13.5px] leading-[1.5] text-text-secondary"
                          >
                            {i + 1}. {additionalCharacterLabel(c)}
                            <span className="mx-2 text-border-strong">·</span>
                            {t.photosEnough(c.photos.length)}
                          </li>
                        ))}
                    </ol>
                  </div>
                )}

              {/* Book language — a human question, stable codes (spec §39–41) */}
              <Field label={t.bookLanguageQ}>
                <div className="grid grid-cols-2 gap-2.5">
                  {BOOK_LANGUAGE_OPTIONS.map((opt) => {
                    const soon = opt.status === "soon";
                    const active = data.bookLanguageCode === opt.code;
                    return (
                      <button
                        key={opt.code}
                        type="button"
                        disabled={soon}
                        aria-pressed={active}
                        onClick={() => !soon && update("bookLanguageCode", opt.code)}
                        className={[
                          "flex items-center justify-between rounded-md border px-3.5 py-2.5 text-left font-sans text-[13.5px] font-medium transition-colors disabled:cursor-not-allowed",
                          active
                            ? "border-accent-primary bg-accent-primary/[0.08] text-text-primary"
                            : "border-border-default bg-transparent text-text-primary",
                          soon ? "opacity-45" : "",
                        ].join(" ")}
                      >
                        <span>{opt.label}</span>
                        {soon && (
                          <span className="ms-2 shrink-0 font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                            {t.languageSoon}
                          </span>
                        )}
                        {active && !soon && (
                          <Check size={14} strokeWidth={2.5} className="text-accent-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </Field>

              {/* Contact number — the order's point of contact, needed
                  whether or not there is delivery. */}
              <Field label={t.phone}>
                <TextInput
                  type="tel"
                  autoComplete="tel"
                  value={data.orderer.phone}
                  onChange={(e) => updateOrderer("phone", e.target.value)}
                  placeholder="+998 90 123 45 67"
                />
              </Field>

              {/* Order region — the commercial market (spec §13, §16,
                  §44). Doubles as the destination question for a direct
                  /begin entry and the "change it without restarting"
                  control. Quiet, one row, not a dashboard. */}
              <Field label={t.orderRegion}>
                <div
                  role="radiogroup"
                  aria-label={t.orderRegion}
                  className="grid grid-cols-2 gap-2.5"
                >
                  {(["UZ", "INTERNATIONAL"] as const).map((m) => {
                    const on = data.market === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => changeMarket(m)}
                        className={[
                          "rounded-md border px-3.5 py-2.5 text-left font-sans text-[13.5px] font-medium transition-colors",
                          on
                            ? "border-accent-primary bg-accent-primary/[0.08] font-semibold text-text-primary"
                            : "border-border-default text-text-primary",
                        ].join(" ")}
                      >
                        {m === "UZ" ? t.marketUz : t.marketIntl}
                      </button>
                    );
                  })}
                </div>
              </Field>

              {data.market === "INTERNATIONAL" && (
                <Field label={t.countryField}>
                  <select
                    className={inputClass}
                    value={data.orderer.deliveryAddress.countryCode}
                    onChange={(e) => updateAddress("countryCode", e.target.value)}
                  >
                    <option value="">{t.countrySelect}</option>
                    {COUNTRIES.filter((c) => c.code !== "UZ").map((c) => (
                      <option key={c.code} value={c.code}>
                        {bookLoc === "uz" ? c.labelUz : c.label}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {/* Delivery — an explicit choice, never assumed (spec C1). */}
              <Field label={t.deliveryQ}>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {(["delivery", "pickup"] as const).map((choice) => {
                    const on = data.orderer.deliveryAddress.choice === choice;
                    return (
                      <button
                        key={choice}
                        type="button"
                        aria-pressed={on}
                        onClick={() => updateAddress("choice", choice)}
                        className={[
                          "rounded-md border px-3.5 py-2.5 text-left font-sans text-[13.5px] font-medium transition-colors",
                          on
                            ? "border-accent-primary bg-accent-primary/[0.08] text-text-primary"
                            : "border-border-default text-text-primary",
                        ].join(" ")}
                      >
                        {choice === "delivery" ? t.deliveryYes : t.deliveryNo}
                      </button>
                    );
                  })}
                </div>
              </Field>

              {data.orderer.deliveryAddress.choice === "pickup" && (
                <p className="font-sans text-[13px] text-text-secondary">
                  {t.pickupSummary}
                </p>
              )}

              {wantsDelivery && data.market === "UZ" && (
                <>
                  {/* Region CODE drives the fee — never a free-text string.
                      Toshkent shahri is free; every other region is 40 000. */}
                  <Field label={t.deliveryRegionField}>
                    <select
                      className={inputClass}
                      value={data.orderer.deliveryAddress.regionCode}
                      onChange={(e) => updateAddress("regionCode", e.target.value)}
                    >
                      <option value="">{t.deliveryRegionPlaceholder}</option>
                      {DELIVERY_REGIONS.map((r) => (
                        <option key={r.code} value={r.code}>
                          {bookLoc === "uz" ? r.labelUz : r.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label={t.addrDistrict}>
                    <TextInput
                      autoComplete="address-level2"
                      value={data.orderer.deliveryAddress.district}
                      onChange={(e) => updateAddress("district", e.target.value)}
                    />
                  </Field>
                  <Field label={t.addrStreet}>
                    <TextInput
                      autoComplete="address-line1"
                      value={data.orderer.deliveryAddress.street}
                      onChange={(e) => updateAddress("street", e.target.value)}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label={t.addrBuilding}>
                      <TextInput
                        value={data.orderer.deliveryAddress.building}
                        onChange={(e) => updateAddress("building", e.target.value)}
                      />
                    </Field>
                    <Field label={`${t.addrApartment} ${t.optional}`}>
                      <TextInput
                        value={data.orderer.deliveryAddress.apartment ?? ""}
                        onChange={(e) => updateAddress("apartment", e.target.value)}
                      />
                    </Field>
                  </div>
                  <Field label={`${t.addrLandmark} ${t.optional}`}>
                    <TextInput
                      value={data.orderer.deliveryAddress.landmark ?? ""}
                      onChange={(e) => updateAddress("landmark", e.target.value)}
                    />
                  </Field>

                  <div className="rounded-md border border-border-default p-4">
                    {data.orderer.deliveryAddress.location ? (
                      <div className="flex flex-col gap-2">
                        <span className="inline-flex items-center gap-2 font-sans text-[13px] font-medium text-text-primary">
                          <MapPin size={15} strokeWidth={1.75} className="text-accent-primary" />
                          {t.locationSelected}
                        </span>
                        {data.orderer.deliveryAddress.location.formattedAddress ? (
                          <p className="font-sans text-[12.5px] leading-[1.5] text-text-secondary">
                            {data.orderer.deliveryAddress.location.formattedAddress}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {mapsKeyPresent ? (
                            <button
                              type="button"
                              onClick={() => setMapPickerOpen(true)}
                              className="font-sans text-[12.5px] font-medium text-text-secondary underline underline-offset-4 hover:text-text-primary"
                            >
                              {t.locationChange}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={clearLocation}
                            className="font-sans text-[12.5px] font-medium text-text-secondary underline underline-offset-4 hover:text-text-primary"
                          >
                            {t.locationClear}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={requestLocation}
                            disabled={locState === "loading"}
                            className="inline-flex items-center gap-2 rounded-md border border-border-strong px-3.5 py-2 font-sans text-[13px] font-medium text-text-primary transition-colors hover:border-accent-primary disabled:opacity-60"
                          >
                            <MapPin size={15} strokeWidth={1.75} className="text-accent-primary" />
                            {locState === "loading" ? t.locationLoading : t.locationCurrentCta}
                          </button>
                          {mapsKeyPresent ? (
                            <button
                              type="button"
                              onClick={() => setMapPickerOpen(true)}
                              className="inline-flex items-center gap-2 rounded-md border border-border-strong px-3.5 py-2 font-sans text-[13px] font-medium text-text-primary transition-colors hover:border-accent-primary"
                            >
                              <MapPin size={15} strokeWidth={1.75} className="text-accent-primary" />
                              {t.locationMapCta}
                            </button>
                          ) : null}
                        </div>
                        <p className="mt-2 font-sans text-[12px] leading-[1.5] text-text-secondary">
                          {locState === "denied"
                            ? t.locationDenied
                            : locState === "unsupported"
                              ? t.locationUnsupported
                              : t.locationHint}
                        </p>
                      </>
                    )}
                  </div>
                  {mapPickerOpen && mapsKeyPresent ? (
                    <MapLocationPicker
                      initial={data.orderer.deliveryAddress.location ?? null}
                      labels={{
                        title: t.locationPickerTitle,
                        search: t.locationSearchPlaceholder,
                        confirm: t.locationConfirm,
                        close: t.locationPickerClose,
                        unavailable: t.locationMapUnavailable,
                      }}
                      onConfirm={handleMapConfirm}
                      onClose={() => setMapPickerOpen(false)}
                    />
                  ) : null}

                  {/* The fee, shown immediately here — updates the moment
                      the region changes (spec C7). */}
                  <div className="flex items-center justify-between rounded-md border border-border-subtle px-4 py-3 font-sans text-[13px]">
                    <span className="text-text-secondary">{t.rowDelivery}</span>
                    <span className="font-medium text-text-primary">
                      {totals.deliveryFee === 0
                        ? t.deliveryFree
                        : money(totals.deliveryFee)}
                    </span>
                  </div>
                </>
              )}

              {/* International postal address (spec §23) — a general
                  structure, not the Uzbek viloyat/tuman/mahalla shape. */}
              {wantsDelivery && data.market === "INTERNATIONAL" && (
                <>
                  <Field label={t.addrCity}>
                    <TextInput
                      autoComplete="address-level2"
                      value={data.orderer.deliveryAddress.intlCity ?? ""}
                      onChange={(e) => updateAddress("intlCity", e.target.value)}
                    />
                  </Field>
                  <Field label={`${t.addrState} ${t.optional}`}>
                    <TextInput
                      autoComplete="address-level1"
                      value={data.orderer.deliveryAddress.intlState ?? ""}
                      onChange={(e) => updateAddress("intlState", e.target.value)}
                    />
                  </Field>
                  <Field label={t.addrLine}>
                    <TextInput
                      autoComplete="address-line1"
                      value={data.orderer.deliveryAddress.intlLine1 ?? ""}
                      onChange={(e) => updateAddress("intlLine1", e.target.value)}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label={t.addrBuilding}>
                      <TextInput
                        value={data.orderer.deliveryAddress.intlBuilding ?? ""}
                        onChange={(e) => updateAddress("intlBuilding", e.target.value)}
                      />
                    </Field>
                    <Field label={`${t.addrApartment} ${t.optional}`}>
                      <TextInput
                        value={data.orderer.deliveryAddress.intlApartment ?? ""}
                        onChange={(e) => updateAddress("intlApartment", e.target.value)}
                      />
                    </Field>
                  </div>
                  <Field label={`${t.addrPostal} ${t.optional}`}>
                    <TextInput
                      autoComplete="postal-code"
                      value={data.orderer.deliveryAddress.intlPostalCode ?? ""}
                      onChange={(e) => updateAddress("intlPostalCode", e.target.value)}
                    />
                  </Field>
                  <Field label={`${t.addrNote} ${t.optional}`}>
                    <TextArea
                      value={data.orderer.deliveryAddress.intlNote ?? ""}
                      onChange={(e) => updateAddress("intlNote", e.target.value)}
                    />
                  </Field>

                  <div className="flex items-center justify-between rounded-md border border-border-subtle px-4 py-3 font-sans text-[13px]">
                    <span className="text-text-secondary">{t.intlDelivery}</span>
                    <span className="font-medium text-text-primary">
                      {money(totals.deliveryFee)}
                    </span>
                  </div>
                  <p className="font-sans text-[12px] text-text-secondary">
                    {t.intlDeliveryHelp}
                  </p>
                </>
              )}

              <Field label={t.numberOfCopies}>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => update("copies", Math.max(1, data.copies - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border-default font-sans text-[16px] text-text-primary"
                    aria-label="−"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-sans text-[15px] font-medium text-text-primary">
                    {data.copies}
                  </span>
                  <button
                    type="button"
                    onClick={() => update("copies", Math.min(5, data.copies + 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border-default font-sans text-[16px] text-text-primary"
                    aria-label="+"
                  >
                    +
                  </button>
                </div>
              </Field>

              {/* Price breakdown — the customer must see WHY the total is
                  what it is; the delivery fee is never hidden (spec D/E). */}
              <div className="rounded-lg border border-border-default p-5">
                <div className="space-y-2 font-sans text-[13.5px]">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">{t.rowBook}</span>
                    <span className="text-text-primary">
                      {money(totals.bookSubtotal)}
                    </span>
                  </div>
                  {data.copies > 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">
                        {t.rowExtraCopies(data.copies - 1)}
                      </span>
                      <span className="text-text-primary">
                        {money(totals.extraCopiesSubtotal)}
                      </span>
                    </div>
                  )}
                  {wantsDelivery && (
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">{deliveryRowLabel}</span>
                      <span className="text-text-primary">
                        {totals.deliveryFee === 0
                          ? t.deliveryFree
                          : money(totals.deliveryFee)}
                      </span>
                    </div>
                  )}
                  <div className="mt-1 flex items-center justify-between border-t border-border-subtle pt-2">
                    <span className="text-text-secondary">{t.total}</span>
                    <span className="font-display text-[20px] font-medium text-text-primary">
                      {money(totals.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {showStepError && !canContinue() && (
                <p role="alert" className="font-sans text-[13px] text-state-error">
                  {t.errReview}
                </p>
              )}
            </>
          )}

          {step.id === "payment" && (
            <>
              {/* A quiet reminder of which market's prices these are —
                  the full control lives one step back on Review. */}
              <p className="font-sans text-[12px] text-text-secondary">
                <span className="font-medium uppercase tracking-[0.12em] text-text-muted">
                  {t.orderRegion}
                </span>
                <span className="mx-2 text-border-strong">·</span>
                {data.market === "UZ" ? t.marketUz : t.marketIntl}
              </p>

              {/* The amount to pay IS the order grand total — same
                  deterministic figure as the review breakdown (spec F). */}
              <div className="rounded-lg border border-border-default p-5">
                <div className="space-y-1.5 font-sans text-[13px]">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">{t.rowBook}</span>
                    <span className="text-text-primary">
                      {money(totals.bookSubtotal)}
                    </span>
                  </div>
                  {data.copies > 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">
                        {t.rowExtraCopies(data.copies - 1)}
                      </span>
                      <span className="text-text-primary">
                        {money(totals.extraCopiesSubtotal)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">
                      {deliveryRowLabel}
                      {wantsDelivery &&
                        data.market === "UZ" &&
                        data.orderer.deliveryAddress.regionCode &&
                        ` · ${deliveryRegionLabel(
                          data.orderer.deliveryAddress.regionCode,
                          bookLoc,
                        )}`}
                      {wantsDelivery &&
                        data.market === "INTERNATIONAL" &&
                        data.orderer.deliveryAddress.countryCode &&
                        ` · ${countryLabel(
                          data.orderer.deliveryAddress.countryCode,
                          bookLoc,
                        )}`}
                    </span>
                    <span className="text-text-primary">
                      {wantsDelivery
                        ? totals.deliveryFee === 0
                          ? t.deliveryFree
                          : money(totals.deliveryFee)
                        : t.pickupSummary}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between border-t border-border-subtle pt-2">
                    <span className="font-medium text-text-secondary">
                      {t.payAmount}
                    </span>
                    <span className="font-display text-[20px] font-medium text-text-primary">
                      {money(totals.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card-to-card transfer — market-based (spec §9–13). One
                  order is one market: a UZ order sees only the local
                  card, an INTERNATIONAL order only the Visa / Mastercard
                  cards. No currency picker, no mixed payment screens. */}
              <div className="space-y-3">
                <div>
                  <p className="font-sans text-[14px] font-medium text-text-primary">
                    {data.market === "UZ" ? t.payUzHeading : t.payIntlHeading}
                  </p>
                  <p className="mt-1 font-sans text-[12.5px] leading-[1.6] text-text-secondary">
                    {data.market === "UZ" ? t.payUzBody : t.payIntlBody}
                  </p>
                </div>

                {PAYMENT_ACCOUNTS[data.market].map((account) => (
                  <PaymentAccount
                    key={account.id}
                    account={account}
                    numberLabel={t.cardNumberLabel}
                    holderLabel={t.cardHolderLabel}
                    copyLabel={t.copyAction}
                    copiedLabel={t.copiedAction}
                  />
                ))}

                {/* Secondary — must never imply automatic online payment
                    works today (spec §12). */}
                <p className="font-sans text-[12px] leading-[1.6] text-text-muted">
                  {t.payNote}
                </p>
              </div>

              {/* Payment receipt (spec §13). A receipt on file is NOT a
                  verified payment — verification stays a later admin
                  action; this only records that a receipt was attached,
                  and submission cannot complete without it. */}
              <ReceiptUpload
                label={t.receiptQ}
                hint={t.receiptHint}
                doneLabel={t.receiptDone}
                replaceLabel={t.receiptReplace}
                tooLargeLabel={t.photoTooLarge}
                notImageLabel={t.photoNotImage}
                file={data.receipt}
                onChange={(f) => update("receipt", f)}
              />

              {showStepError && data.receipt == null && (
                <p role="alert" className="font-sans text-[13px] text-state-error">
                  {t.receiptError}
                </p>
              )}

              <div className="hidden" aria-hidden="true"><CheckRow id="unused-consent" checked={false} onChange={()=>undefined} label="" /></div>
              <OrderConsent
                copy={CONSENT_COPY[bookLoc]}
                accepted={data.consentAuthority && data.consentPrivacy && data.consentTerms}
                signature={data.consentSignature}
                onAccepted={(checked) => setData(prev => ({...prev, consentAuthority:checked, consentPrivacy:checked, consentTerms:checked}))}
                onSignature={(value) => update("consentSignature", value)}
              />

              <section
                aria-labelledby="order-consent-heading"
                className="hidden"
              >
                <div className="border-b border-border-subtle pb-4">
                  <h3
                    id="order-consent-heading"
                    className="font-display text-[24px] leading-tight text-text-primary"
                  >
                    {t.consentHeading}
                  </h3>
                  <p className="mt-2 font-sans text-[13.5px] leading-[1.65] text-text-secondary">
                    {t.consentIntro}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-sans text-[13px] font-semibold">
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-accent-primary underline underline-offset-4">
                      {t.privacyLink}
                    </a>
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-accent-primary underline underline-offset-4">
                      {t.termsLink}
                    </a>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <CheckRow
                    id="consent-authority"
                    checked={data.consentAuthority}
                    onChange={(checked) => update("consentAuthority", checked)}
                    label={t.consentAuthority}
                  />
                  <CheckRow
                    id="consent-privacy"
                    checked={data.consentPrivacy}
                    onChange={(checked) => update("consentPrivacy", checked)}
                    label={t.consentPrivacy}
                  />
                  <CheckRow
                    id="consent-terms"
                    checked={data.consentTerms}
                    onChange={(checked) => update("consentTerms", checked)}
                    label={t.consentTerms}
                  />
                </div>

                <div className="mt-5">
                  <label htmlFor="consent-signature" className="font-sans text-[14px] font-semibold text-text-primary">
                    {t.signatureLabel}
                  </label>
                  <input
                    id="consent-signature"
                    type="text"
                    autoComplete="name"
                    value={data.consentSignature}
                    onChange={(event) => update("consentSignature", event.target.value)}
                    className={`${inputClass} mt-2`}
                  />
                  <p className="mt-2 font-sans text-[12.5px] leading-[1.6] text-text-secondary">
                    {t.signatureHint}
                  </p>
                </div>

                <p className="mt-4 border-t border-border-subtle pt-4 font-sans text-[12.5px] leading-[1.6] text-text-muted">
                  {t.consentNoMarketing}
                </p>

                {showStepError && data.receipt != null && !canContinue() && (
                  <p role="alert" className="mt-4 font-sans text-[13px] text-state-error">
                    {t.consentError}
                  </p>
                )}
              </section>
            </>
          )}

          {isLastStep && submitError && (
            <p role="alert" className="font-sans text-[13px] text-state-error">
              {submitError}
            </p>
          )}
        </div>

        {/* Footer nav. Kept clickable while the step is incomplete so a
            tap surfaces the gentle inline reason (it just reads as
            not-yet-ready); a submit in flight is a hard block. */}
        <div className="mt-9 flex items-center justify-end">
          <button
            type="button"
            onClick={goNext}
            aria-disabled={!stepReady || undefined}
            className={[
              "inline-flex items-center gap-2 rounded-md bg-accent-primary px-5 py-2.5 font-sans text-[13.5px] font-medium text-white outline-none transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary",
              stepReady ? "opacity-100 hover:opacity-90" : "opacity-40",
            ].join(" ")}
          >
            {isLastStep ? t.sendOrder : t.continue}
            {submitting ? (
              <LoaderCircle size={15} strokeWidth={2} className="animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight size={14} strokeWidth={1.75} className="rtl:-scale-x-100" />
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Small shared components ────────────────────────────────────────────────
//    The switch/toggle lives in ./Switch (SwitchRow) — one deterministic
//    geometry for every true on/off control in the flow. MAX_PHOTO_BYTES
//    and PhotoUpload live in ./formPrimitives.

/**
 * The payment receipt (spec §13) — a single-file upload with a clear
 * two-state affordance: an "upload" button before, and "✓ receipt
 * uploaded / Replace" after. Same client-side guards as PhotoUpload
 * (image type + a size ceiling). A file here means "a receipt is
 * attached", nothing more — it is never treated as a verified payment.
 */
function ReceiptUpload({
  label,
  hint,
  doneLabel,
  replaceLabel,
  tooLargeLabel,
  notImageLabel,
  file,
  onChange,
}: {
  label: string;
  hint?: string;
  doneLabel: string;
  replaceLabel: string;
  tooLargeLabel: string;
  notImageLabel: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const [notice, setNotice] = useState<string | null>(null);

  function accept(incoming: File | undefined) {
    setNotice(null);
    if (!incoming) return;
    if (!incoming.type.startsWith("image/")) {
      setNotice(notImageLabel);
      return;
    }
    if (incoming.size > MAX_PHOTO_BYTES) {
      setNotice(tooLargeLabel);
      return;
    }
    onChange(incoming);
  }

  return (
    <Field label={label} hint={file ? undefined : hint}>
      {file ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border-default px-3.5 py-2.5">
          <span className="inline-flex min-w-0 items-center gap-2 font-sans text-[13px] font-medium text-text-primary">
            <Check size={15} strokeWidth={2.25} className="shrink-0 text-accent-primary" />
            <span className="truncate">{doneLabel}</span>
          </span>
          <label className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center font-sans text-[12.5px] font-medium text-text-secondary underline underline-offset-4 hover:text-text-primary">
            {replaceLabel}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                accept(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      ) : (
        <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md border border-dashed border-border-strong px-4 py-2.5 font-sans text-[13px] font-medium text-text-primary transition-colors hover:border-solid hover:border-accent-primary">
          <Upload size={15} strokeWidth={1.5} className="text-text-secondary" />
          {label}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              accept(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {notice && (
        <span role="alert" className="mt-1.5 block font-sans text-[12px] text-state-error">
          {notice}
        </span>
      )}
    </Field>
  );
}

