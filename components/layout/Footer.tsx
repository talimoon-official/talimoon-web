"use client";

/**
 * Footer — TALIMOON
 * ----------------------------------------------------------------
 * No local state/effects of its own, but now needs `useT`/`useLanguage`
 * (a Context hook) for translated copy, so it must be a Client
 * Component — was previously a plain server component, upgraded
 * specifically for this. Container and spacing are untouched from the
 * original light-surface version — only color tokens changed.
 *
 * 2026-08-08: the Final CTA section (EmotionalBanner, dark navy
 * `--surface-contrast`) was removed from the home page entirely, and
 * the Footer took over that exact same background token so the page
 * still ends on a dark note instead of cutting straight from cream
 * to cream-again. Every text/border color below is the existing
 * "inverse" (light-on-dark) tier already established by
 * EmotionalBanner (`--text-inverse`, `--text-inverse-muted`) and the
 * design system's own `--border-inverse` token — nothing new was
 * introduced.
 *
 * 2026-08-08 (same day, follow-up): the text wordmark and the old
 * "Create Your Story" button were replaced with the exact Navbar
 * logo (gold variant + `.tm-logo-shine`) and the exact Navbar CTA
 * (`.tm-cta-gold`, "Begin the Story", `#begin`) — both classes now
 * live in globals.css (§27/§28), extracted from Navbar's own local
 * `<style jsx>` specifically so Footer could reuse them verbatim
 * instead of duplicating ~70 lines of CSS.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/LanguageContext";
import { SOCIAL, CONTACT } from "@/lib/site/social";
import { isOrderFunnelPath } from "@/lib/site/order-funnel";

// Mirrors Navbar's PERSONALIZED_BOOKS_PATH check — that page's CTA
// reads "Create Your Story" instead of the site-wide "Order Now".
const PERSONALIZED_BOOKS_PATH = "/products/personalized-books";

const FOOTER_EN = {
  tagline: "Stories they'll remember forever.",
  ctaOrderNow: "Order Now",
  ctaCreateStory: "Create Your Story",
  talimoonHome: "Talimoon Home",
  exploreHeading: "Explore",
  resourcesHeading: "Resources",
  socialHeading: "Social",
  contactHeading: "Contact",
  about: "About",
  howItWorks: "How it Works",
  pricing: "Pricing",
  faq: "FAQ",
  privacyPolicy: "Privacy Policy",
  terms: "Terms",
  contact: "Contact",
  email: "Email",
  qatar: "Qatar",
  uzbekistan: "Uzbekistan",
  copyright: "© 2026 TALIMOON.",
  craftedWithCare: "Crafted with care for families.",
};

const FOOTER_UZ: typeof FOOTER_EN = {
  tagline: "Ular umrbod eslab qoladigan hikoyalar.",
  ctaOrderNow: "Buyurtma bering",
  ctaCreateStory: "Hikoyangizni yarating",
  talimoonHome: "Talimoon bosh sahifasi",
  exploreHeading: "Sahifalar",
  resourcesHeading: "Resurslar",
  socialHeading: "Ijtimoiy tarmoqlar",
  contactHeading: "Aloqa",
  about: "Biz haqimizda",
  howItWorks: "Qanday ishlaydi",
  pricing: "Narxlar",
  faq: "Savol-javob",
  privacyPolicy: "Maxfiylik siyosati",
  terms: "Foydalanish shartlari",
  contact: "Aloqa",
  email: "Email",
  qatar: "Qatar",
  uzbekistan: "O‘zbekiston",
  copyright: "© 2026 TALIMOON.",
  craftedWithCare: "Oilalar uchun mehr bilan yaratilgan.",
};

const FOOTER_RU: typeof FOOTER_EN = {
  tagline: "Истории, которые останутся с ними на всю жизнь.",
  ctaOrderNow: "Оформить заказ",
  ctaCreateStory: "Создать свою историю",
  talimoonHome: "Главная страница TALIMOON",
  exploreHeading: "Разделы",
  resourcesHeading: "Ресурсы",
  socialHeading: "Соцсети",
  contactHeading: "Контакты",
  about: "О нас",
  howItWorks: "Как это работает",
  pricing: "Цены",
  faq: "Вопросы и ответы",
  privacyPolicy: "Политика конфиденциальности",
  terms: "Условия использования",
  contact: "Контакты",
  email: "Email",
  qatar: "Катар",
  uzbekistan: "Узбекистан",
  copyright: "© 2026 TALIMOON.",
  craftedWithCare: "Создано с любовью для семей.",
};

const EXPLORE_LINKS = [
  { key: "about", href: "/about" },
  { key: "howItWorks", href: "/products/personalized-books#how-it-works" },
  { key: "pricing", href: "/products/personalized-books#pricing" },
  { key: "faq", href: "/products/personalized-books#faq" },
] as const satisfies readonly { key: keyof typeof FOOTER_EN; href: string }[];

const RESOURCES_LINKS = [
  { key: "privacyPolicy", href: "/privacy" },
  { key: "terms", href: "/terms" },
  { key: "contact", href: "/contact" },
] as const satisfies readonly { key: keyof typeof FOOTER_EN; href: string }[];

// Public profile pages — the "Ijtimoiy tarmoqlar" column. Same source of
// truth as the navbar icons (lib/site/social.ts).
const SOCIAL_LINKS = [
  { label: "Instagram", href: SOCIAL.instagram.url },
  { label: "Telegram", href: SOCIAL.telegram.url },
  { label: "YouTube", href: SOCIAL.youtube.url },
];

// The "Aloqa" column — reachable channels. Instagram here is the DM
// deep-link, not the public profile (see lib/site/social.ts).
const CONTACT_LINKS = [
  { key: "email", value: CONTACT.email.value, href: CONTACT.email.href },
  { label: "Telegram", value: CONTACT.telegram.value, href: CONTACT.telegram.href },
  { label: "Instagram", value: CONTACT.instagramDM.value, href: CONTACT.instagramDM.href },
  { key: "qatar", value: CONTACT.qatarPhone.value, href: CONTACT.qatarPhone.href },
  { key: "uzbekistan", value: CONTACT.uzbekistanPhone.value, href: CONTACT.uzbekistanPhone.href },
] as const;

const columnHeadingClass =
  "font-sans text-[13px] font-medium uppercase tracking-[0.14em] text-[var(--text-inverse-muted,rgba(247,243,236,0.7))]";

const linkClass =
  "block font-sans text-[0.9375rem] leading-[1.6] text-[var(--text-inverse,#F7F3EC)] hover:text-[var(--accent-primary,#B8935B)]";

export interface FooterProps {
  /** Whether the Explore column links to the #how-it-works anchor. Set
   * false on pages that don't render a HowItWorks section, so Footer
   * never renders a link to an anchor that doesn't exist. */
  showHowItWorksLink?: boolean;
  /**
   * Where the gold CTA goes. Defaults to `/begin` (the product-picker
   * route) for pages with no on-page conversion point of their own.
   * The personalized-books product page overrides this to `#pricing`
   * — same reasoning as its navbar/hero CTAs: that page already has
   * its own real pricing section, so the CTA scrolls there instead of
   * detouring through `/begin`'s picker for a product the visitor
   * already committed to. (The CTA's label text is separate — see
   * `ctaLabel` below, derived from the current pathname rather than a
   * prop, so it can't drift out of sync with Navbar's own logic.)
   */
  ctaHref?: string;
  /**
   * The Footer's top area — the wordmark, the "Stories they'll
   * remember forever." tagline and the gold "Order Now" CTA. On by
   * default. HAYOT (Journey) sets this `false`: it is an editorial /
   * knowledge environment for parents, not a sales funnel, so the
   * landing ends quietly on "Hayot davom etadi." and then goes
   * straight into the Footer's navigation columns with no commercial
   * call to action. Nothing else about the Footer changes.
   */
  showTopCta?: boolean;
  /**
   * Keep the Footer's top area (wordmark + tagline) but drop ONLY the
   * gold CTA button. The personalized-books product page sets this
   * `false`: that page already carries the navbar CTA, the pricing-card
   * CTAs and one emotional closing CTA, so a fourth gold button in the
   * footer only competes — the footer should end quietly there.
   */
  showTopCtaButton?: boolean;
}

export function Footer({
  showHowItWorksLink = true,
  ctaHref = "/begin",
  showTopCta = true,
  showTopCtaButton = true,
}: FooterProps) {
  const t = useT(FOOTER_EN, FOOTER_UZ, FOOTER_RU);
  const pathname = usePathname();
  const ctaLabel = pathname === PERSONALIZED_BOOKS_PATH ? t.ctaCreateStory : t.ctaOrderNow;
  // Inside the order funnel (`/begin`, `/begin/*`) the visitor is already
  // ordering, so the redundant gold "Buyurtma bering" CTA is dropped —
  // the wordmark, tagline and every informational column stay. Every
  // other page keeps the CTA.
  const showOrderCta = !isOrderFunnelPath(pathname);
  const exploreLinks = showHowItWorksLink
    ? EXPLORE_LINKS
    : EXPLORE_LINKS.filter((link) => link.key !== "howItWorks");

  return (
    <footer className="w-full bg-[var(--surface-contrast,#1C2A3A)]">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10 lg:px-16">
        {/* Top area — wordmark, tagline and the commercial CTA. Omitted
            on HAYOT (Journey), which is not a sales funnel. */}
        {showTopCta ? (
          <div className="flex flex-col gap-8 py-16 md:flex-row md:items-center md:justify-between md:py-20">
            <div>
              <Link href="/" aria-label={t.talimoonHome} className="relative flex h-9 w-auto items-center">
                <img
                  src="/logo/talimoon-logo-gold.svg"
                  alt="Talimoon"
                  draggable={false}
                  className="h-9 w-auto"
                />
                <span aria-hidden="true" className="tm-logo-shine pointer-events-none absolute inset-0 h-9 w-auto" />
              </Link>
              <p className="mt-3 font-sans text-[0.9375rem] leading-[1.6] text-[var(--text-inverse-muted,rgba(247,243,236,0.7))]">
                {t.tagline}
              </p>
            </div>

            {showTopCtaButton && showOrderCta && (
              <Link
                href={ctaHref}
                className="tm-cta-gold inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap px-4 text-[13px] font-medium tracking-[0.015em]"
              >
                {ctaLabel}
              </Link>
            )}
          </div>
        ) : null}

        {/* Middle: four columns */}
        <div
          className={`grid grid-cols-1 gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8${
            showTopCta ? " border-t border-[var(--border-inverse,rgba(247,243,236,0.18))]" : ""
          }`}
        >
          <div>
            <h3 className={columnHeadingClass}>{t.exploreHeading}</h3>
            <ul className="mt-5 space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.key}>
                  <a href={link.href} className={linkClass}>
                    {t[link.key]}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={columnHeadingClass}>{t.resourcesHeading}</h3>
            <ul className="mt-5 space-y-3">
              {RESOURCES_LINKS.map((link) => (
                <li key={link.key}>
                  <a href={link.href} className={linkClass}>
                    {t[link.key]}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={columnHeadingClass}>{t.socialHeading}</h3>
            <ul className="mt-5 space-y-3">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`TALIMOON ${link.label}`}
                    className={linkClass}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={columnHeadingClass}>{t.contactHeading}</h3>
            <ul className="mt-5 space-y-3">
              {CONTACT_LINKS.map((contact) => {
                const external = contact.href.startsWith("https://");
                return (
                  <li key={"key" in contact ? contact.key : contact.label}>
                    <a
                      href={contact.href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      className={linkClass}
                    >
                      <span className="text-[var(--text-inverse-muted,rgba(247,243,236,0.7))]">
                        {"key" in contact ? t[contact.key] : contact.label}:{" "}
                      </span>
                      <span className="whitespace-nowrap">{contact.value}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Bottom area */}
        <div className="flex flex-col gap-3 border-t border-[var(--border-inverse,rgba(247,243,236,0.18))] py-8 font-sans text-[0.8125rem] text-[var(--text-inverse-muted,rgba(247,243,236,0.7))] sm:flex-row sm:items-center sm:justify-between">
          <p>{t.copyright}</p>
          <p>{t.craftedWithCare}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
