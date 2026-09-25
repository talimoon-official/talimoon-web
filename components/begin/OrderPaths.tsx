"use client";

/**
 * TALIMOON — `/begin` — the two ways into "Buyurtma", kept visually and
 * conceptually apart:
 *
 *   A · Yangi buyurtma                → a NEW personalized-book order
 *                                       (price step, then the long form)
 *   B · Oldingi buyurtma uchun to‘lov → /pay: the payment code re-opens a
 *                                       SAVED order's payment page. The long
 *                                       form is never reopened for it.
 */

import Link from "next/link";
import { ArrowRight, BookOpen, KeyRound } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { PAYMENT_COPY } from "@/lib/payment/copy";
import type { PaymentLocale } from "@/lib/payment/status";

export const NEW_ORDER_PATH = "/begin/personalized-book/price";
export const PAY_EXISTING_PATH = "/pay";

export function OrderPaths() {
  const { language } = useLanguage();
  const locale: PaymentLocale = language === "UZ" ? "uz" : language === "RU" ? "ru" : "en";
  const c = PAYMENT_COPY[locale];

  const paths = [
    {
      key: "new",
      href: NEW_ORDER_PATH,
      icon: BookOpen,
      title: c.newOrderTitle,
      body: c.newOrderBody,
      cta: c.newOrderCta,
      primary: true,
    },
    {
      key: "existing",
      href: PAY_EXISTING_PATH,
      icon: KeyRound,
      title: c.existingTitle,
      body: c.existingBody,
      cta: c.existingCta,
      primary: false,
    },
  ] as const;

  return (
    <section
      aria-label={c.entryEyebrow}
      className="mx-auto w-full max-w-container-content bg-surface-base px-6 pt-12 sm:px-8 md:pt-16 lg:px-16 lg:pt-20"
    >
      <p className="mb-5 text-center font-sans text-[13px] font-medium uppercase tracking-[0.16em] text-accent-primary">
        {c.entryEyebrow}
      </p>
      <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 sm:gap-6">
        {paths.map(({ key, href, icon: Icon, title, body, cta, primary }) => (
          <Link
            key={key}
            href={href}
            data-path={key}
            className={[
              "group flex h-full flex-col rounded-lg border p-6 text-left outline-none transition-[transform,box-shadow,border-color] duration-300 ease-out motion-safe:hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-primary",
              primary
                ? "border-accent-primary/40 bg-accent-primary/[0.06] shadow-[0_3px_16px_-8px_rgba(42,36,29,0.18)]"
                : "border-border-default bg-surface-base",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-11 w-11 items-center justify-center rounded-full",
                primary ? "bg-accent-primary/[0.16]" : "bg-text-primary/[0.06]",
              ].join(" ")}
            >
              <Icon size={20} strokeWidth={1.75} className={primary ? "text-accent-primary" : "text-text-primary"} />
            </span>
            <h2 className="mt-4 font-display text-[21px] font-medium leading-snug text-text-primary">{title}</h2>
            <p className="mt-2 font-sans text-[13.5px] leading-[1.6] text-text-secondary">{body}</p>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-5 font-sans text-[12px] font-medium uppercase tracking-[0.14em] text-text-primary">
              {cta}
              <ArrowRight
                size={13}
                strokeWidth={1.75}
                className="transition-transform duration-300 ease-out motion-safe:group-hover:translate-x-1 rtl:-scale-x-100"
              />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default OrderPaths;
