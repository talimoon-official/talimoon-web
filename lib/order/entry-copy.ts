/**
 * Copy for the Personalized Books order entry — two separate screens:
 *   `/begin/personalized-book`        the two order intents (ENTRY_COPY)
 *   `/begin/personalized-book/price`  the book-type choice  (PLAN_COPY)
 * UZ is the canonical wording.
 */

export interface EntryCopy {
  eyebrow: string;
  heading: string;
  subheading: string;

  newTitle: string;
  newBody: string;
  newCta: string;

  existingTitle: string;
  existingBody: string;
  existingCta: string;
  /** the one reassurance that matters for a returning customer */
  existingNote: string;
}

const UZ: EntryCopy = {
  eyebrow: "Shaxsiylashtirilgan kitoblar",
  heading: "Buyurtmani qanday davom ettirmoqchisiz?",
  subheading:
    "Yangi kitob buyurtmasini boshlang yoki avval yuborgan buyurtmangiz uchun to‘lovni davom ettiring.",

  newTitle: "Yangi buyurtma",
  newBody: "Farzandingiz uchun yangi shaxsiylashtirilgan kitob buyurtmasini boshlang.",
  newCta: "Yangi buyurtma berish",

  existingTitle: "Mavjud buyurtma uchun to‘lov",
  existingBody:
    "Avval formani yuborgan bo‘lsangiz, to‘lov kodini kiriting va saqlangan buyurtmangiz uchun to‘lovni davom ettiring.",
  existingCta: "To‘lovga o‘tish",
  existingNote: "Formani qayta to‘ldirish shart emas",
};

const EN: EntryCopy = {
  eyebrow: "Personalized books",
  heading: "How would you like to continue?",
  subheading: "Start a new book order, or continue payment for an order you’ve already submitted.",

  newTitle: "New order",
  newBody: "Start a new personalized book order for your child.",
  newCta: "Start a new order",

  existingTitle: "Pay for an existing order",
  existingBody:
    "Already submitted the form? Enter your payment code and continue payment for your saved order.",
  existingCta: "Go to payment",
  existingNote: "No need to fill in the form again",
};

const RU: EntryCopy = {
  eyebrow: "Персональные книги",
  heading: "Как Вы хотите продолжить?",
  subheading: "Оформите новый заказ книги или продолжите оплату уже отправленного заказа.",

  newTitle: "Новый заказ",
  newBody: "Оформите новый заказ персональной книги для Вашего ребёнка.",
  newCta: "Оформить новый заказ",

  existingTitle: "Оплата существующего заказа",
  existingBody:
    "Уже отправили форму? Введите код оплаты и продолжите оплату сохранённого заказа.",
  existingCta: "Перейти к оплате",
  existingNote: "Заполнять форму заново не нужно",
};

export const ENTRY_COPY: Record<"uz" | "en" | "ru", EntryCopy> = { uz: UZ, en: EN, ru: RU };

export interface PlanCopy {
  eyebrow: string;
  heading: string;
  subheading: string;
  /** small label above each card title */
  cardEyebrow: string;
  singleTitle: string;
  singleBody: string;
  multiTitle: string;
  multiBody: string;
  choose: string;
  back: string;
  marketAria: string;
  marketUz: string;
  marketIntl: string;
}

const PLAN_UZ: PlanCopy = {
  eyebrow: "Buyurtmani boshlash",
  heading: "Kitob turini tanlang",
  subheading: "Farzandlaringiz soniga mos variantni tanlang.",
  cardEyebrow: "Shaxsiylashtirilgan kitob",
  singleTitle: "1 farzand uchun",
  singleBody: "Farzandingiz hikoyaning bosh qahramoni bo‘ladi.",
  multiTitle: "Bir nechta farzand uchun",
  multiBody: "Farzandlaringiz bitta hikoyada birga qahramon bo‘ladi.",
  choose: "Shuni tanlash",
  back: "Orqaga",
  marketAria: "Buyurtma hududi",
  marketUz: "O‘zbekiston",
  marketIntl: "Xalqaro",
};

const PLAN_EN: PlanCopy = {
  eyebrow: "Start your order",
  heading: "Choose your book",
  subheading: "Choose the option that fits how many children you have.",
  cardEyebrow: "Personalized book",
  singleTitle: "For one child",
  singleBody: "Your child becomes the hero of the story.",
  multiTitle: "For several children",
  multiBody: "Your children share one story as its heroes.",
  choose: "Choose this",
  back: "Back",
  marketAria: "Order region",
  marketUz: "Uzbekistan",
  marketIntl: "International",
};

const PLAN_RU: PlanCopy = {
  eyebrow: "Начало заказа",
  heading: "Выберите книгу",
  subheading: "Выберите вариант по количеству Ваших детей.",
  cardEyebrow: "Персональная книга",
  singleTitle: "Для одного ребёнка",
  singleBody: "Ваш ребёнок станет главным героем истории.",
  multiTitle: "Для нескольких детей",
  multiBody: "Ваши дети станут героями одной общей истории.",
  choose: "Выбрать",
  back: "Назад",
  marketAria: "Регион заказа",
  marketUz: "Узбекистан",
  marketIntl: "Международный",
};

export const PLAN_COPY: Record<"uz" | "en" | "ru", PlanCopy> = { uz: PLAN_UZ, en: PLAN_EN, ru: PLAN_RU };
