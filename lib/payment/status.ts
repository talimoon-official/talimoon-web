/**
 * The order lifecycle as the customer sees it. Mirrors talimoon-intake's
 * `LifecycleStatus` (src/orders/lifecycle.ts, docs/STATE_MACHINE.md):
 *
 *   DRAFT → AWAITING_PAYMENT → PAYMENT_SUBMITTED → PAID → IN_PRODUCTION
 *         → READY → DELIVERED        (CANCELLED from any non-terminal state)
 *
 * Form submission = order SAVED, not production. Payment confirmation (PAID)
 * never starts production either — only the admin's explicit
 * "🏭 Ishlab chiqarishga" moves an order to IN_PRODUCTION. The customer copy
 * below therefore keeps PAID and IN_PRODUCTION strictly apart, and nothing
 * before IN_PRODUCTION may say the book is being prepared.
 */

export const LIFECYCLE_STATUSES = [
  "DRAFT",
  "AWAITING_PAYMENT",
  "PAYMENT_SUBMITTED",
  "PAID",
  "IN_PRODUCTION",
  "READY",
  "DELIVERED",
  "CANCELLED",
] as const;

export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];

export type PaymentLocale = "uz" | "en" | "ru";

export function isLifecycleStatus(value: unknown): value is LifecycleStatus {
  return typeof value === "string" && (LIFECYCLE_STATUSES as readonly string[]).includes(value);
}

/** Canonical customer-facing status labels. UZ is the approved wording. */
export const LIFECYCLE_STATUS_COPY: Record<PaymentLocale, Record<LifecycleStatus, string>> = {
  uz: {
    DRAFT: "Ma’lumotlar saqlanmoqda",
    AWAITING_PAYMENT: "To‘lov kutilmoqda",
    PAYMENT_SUBMITTED: "To‘lov tekshirilmoqda",
    PAID: "To‘lov tasdiqlandi",
    IN_PRODUCTION: "Tayyorlanmoqda",
    READY: "Buyurtma tayyor",
    DELIVERED: "Yetkazildi",
    CANCELLED: "Buyurtma bekor qilindi",
  },
  en: {
    DRAFT: "Saving your details",
    AWAITING_PAYMENT: "Awaiting payment",
    PAYMENT_SUBMITTED: "Payment being verified",
    PAID: "Payment confirmed",
    IN_PRODUCTION: "Being prepared",
    READY: "Order ready",
    DELIVERED: "Delivered",
    CANCELLED: "Order cancelled",
  },
  ru: {
    DRAFT: "Данные сохраняются",
    AWAITING_PAYMENT: "Ожидается оплата",
    PAYMENT_SUBMITTED: "Оплата проверяется",
    PAID: "Оплата подтверждена",
    IN_PRODUCTION: "Готовится",
    READY: "Заказ готов",
    DELIVERED: "Доставлен",
    CANCELLED: "Заказ отменён",
  },
};

export function lifecycleStatusLabel(status: LifecycleStatus, locale: PaymentLocale): string {
  return LIFECYCLE_STATUS_COPY[locale][status];
}

/** Production has actually started — the only states where "being prepared"
 *  style copy is allowed. */
export function productionStarted(status: LifecycleStatus): boolean {
  return status === "IN_PRODUCTION" || status === "READY" || status === "DELIVERED";
}
