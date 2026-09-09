"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLanguage, useT } from "@/lib/i18n/LanguageContext";
import { SOCIAL } from "@/lib/site/social";
import { isOrderFunnelPath } from "@/lib/site/order-funnel";

// The personalized-books product page is the one place the CTA reads
// "Create Your Story" instead of the site-wide "Order Now" — see
// NAV_LABELS_EN/UZ's ctaOrderNow/ctaCreateStory below and the
// `ctaLabel` pathname check inside Navbar().
const PERSONALIZED_BOOKS_PATH = "/products/personalized-books";


// Desktop primary nav. "Product" renders as a dropdown trigger (see
// PRODUCT_MENU below) instead of a plain link — everything else is
// a direct link, same as before. Labels are looked up by `key`
// through `useT` below rather than hardcoded here, so this array
// stays language-agnostic (hrefs/structure only).
type NavItem = { key: keyof typeof NAV_LABELS_EN; href: string } | { key: keyof typeof NAV_LABELS_EN; dropdown: "product" };

const NAV_LABELS_EN = {
  home: "Home",
  journey: "Journey",
  storyLibrary: "Story Library",
  about: "About",
  product: "Product",
  personalizedBooks: "Personalized Books",
  yusufYasmina: "Yusuf & Yasmina",
  storySeries: "Story Series",
  talimoonToys: "Talimoon Toys",
  login: "Log in",
  ctaOrderNow: "Order Now",
  ctaCreateStory: "Create Your Story",
  talimoonHome: "Talimoon Home",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  languagePrefix: "Language",
  primaryNav: "Primary",
  mobileNav: "Mobile navigation",
};

const NAV_LABELS_UZ: typeof NAV_LABELS_EN = {
  home: "Bosh sahifa",
  // "Hayot", not a literal translation of "Journey" (Safar/Sayohat) —
  // an intentional brand adaptation: the page is TALIMOON's living
  // memory, not travel. Route stays /journey for locale consistency.
  journey: "Hayot",
  storyLibrary: "Kutubxona",
  about: "Haqimizda",
  product: "Mahsulot",
  personalizedBooks: "Shaxsiylashtirilgan kitoblar",
  yusufYasmina: "Yusuf va Yasmina",
  storySeries: "Hikoyalar turkumi",
  talimoonToys: "Talimoon o'yinchoqlari",
  login: "Kirish",
  ctaOrderNow: "Buyurtma bering",
  ctaCreateStory: "Hikoyangizni yarating",
  talimoonHome: "Talimoon bosh sahifasi",
  openMenu: "Menyuni ochish",
  closeMenu: "Menyuni yopish",
  languagePrefix: "Til",
  primaryNav: "Asosiy",
  mobileNav: "Mobil navigatsiya",
};

// "Жизнь" mirrors the Uzbek brand adaptation ("Hayot" — TALIMOON's
// living memory, not a literal "journey") and matches the world name
// already shipped in lib/journey/types.ts ("ЖИЗНЬ TALIMOON"), so the
// nav item and the world page's own heading use the same word.
const NAV_LABELS_RU: typeof NAV_LABELS_EN = {
  home: "Главная",
  journey: "Жизнь",
  storyLibrary: "Библиотека",
  about: "О нас",
  product: "Продукция",
  personalizedBooks: "Именные книги",
  yusufYasmina: "Юсуф и Ясмина",
  storySeries: "Серия историй",
  talimoonToys: "Игрушки TALIMOON",
  login: "Войти",
  ctaOrderNow: "Оформить заказ",
  ctaCreateStory: "Создать свою историю",
  talimoonHome: "Главная страница TALIMOON",
  openMenu: "Открыть меню",
  closeMenu: "Закрыть меню",
  languagePrefix: "Язык",
  primaryNav: "Основная навигация",
  mobileNav: "Мобильная навигация",
};

const DESKTOP_NAV_ITEMS: NavItem[] = [
  { key: "home", href: "/" },
  { key: "product", dropdown: "product" },
  { key: "journey", href: "/journey" },
  { key: "storyLibrary", href: "/story-library" },
  { key: "about", href: "/about" },
];

// Product dropdown contents — exactly the three entries in the spec,
// no icons/descriptions/badges. "Yusuf & Yasmina" carries a small
// secondary "Story Series" caption directly beneath it (lower
// emphasis, tighter line-height) rather than being its own row.
const PRODUCT_MENU = [
  { key: "personalizedBooks", href: "/products/personalized-books" },
  {
    key: "yusufYasmina",
    href: "/products/yusuf-and-yasmina",
    captionKey: "storySeries",
  },
  { key: "talimoonToys", href: "/products/talimoon-toys" },
] as const satisfies readonly { key: keyof typeof NAV_LABELS_EN; href: string; captionKey?: keyof typeof NAV_LABELS_EN }[];

const LANGUAGES = [
  { code: "UZ", name: "O'zbekcha" },
  { code: "EN", name: "English" },
  { code: "RU", name: "Русский" },
  { code: "AR", name: "العربية" },
] as const;

// Social links with brand-colored icon paths. URLs come from the single
// source of truth in lib/site/social.ts so navbar and footer stay in sync.
const SOCIAL_LINKS = [
  {
    name: "instagram" as const,
    label: "Instagram",
    href: SOCIAL.instagram.url,
    aria: "TALIMOON Instagram",
  },
  {
    name: "telegram" as const,
    label: "Telegram",
    href: SOCIAL.telegram.url,
    aria: "TALIMOON Telegram",
  },
  {
    name: "youtube" as const,
    label: "YouTube",
    href: SOCIAL.youtube.url,
    aria: "TALIMOON YouTube",
  },
] as const;
const SOCIAL_ICON_PATHS = {
  instagram: "/icons/instagram.webp",
  telegram: "/icons/telegram.webp",
  youtube: "/icons/youtube.webp",
} as const;
// Drawer now mirrors the desktop information architecture exactly
// (Home / Product / Journey / Story Library / About). "Product" opens
// as an inline accordion using PRODUCT_MENU's existing content
// rather than a separate hardcoded list, so desktop and mobile can
// never drift out of sync.
type MobileNavItem = { key: keyof typeof NAV_LABELS_EN; href: string } | { key: keyof typeof NAV_LABELS_EN; accordion: "product" };

const MOBILE_NAV_LINKS: MobileNavItem[] = [
  { key: "home", href: "/" },
  { key: "product", accordion: "product" },
  { key: "journey", href: "/journey" },
  { key: "storyLibrary", href: "/story-library" },
  { key: "about", href: "/about" },
];

// Temporarily hidden until the auth / account flow is finished — flip
// back to `true` to restore the "Log in" ("Kirish") link in the
// desktop nav. Nothing else references it, so this is the only switch.
const SHOW_LOGIN = false;

const SCROLL_THRESHOLD = 24;

// How long the drawer + backdrop's exit transition runs, in ms.
const MOBILE_MENU_EXIT_MS = 300;

// Premium "expo-out" easing — decelerates smoothly with no bounce,
// the same easing family used in Apple's own sheet/drawer motion.
const DRAWER_EASING = "ease-[cubic-bezier(0.16,1,0.3,1)]";

/**
 * ---------------------------------------------------------------
 * COLOR CONTROLS — edit these to restyle the navbar by hand.
 * ---------------------------------------------------------------
 */
const REST_BG = "#1C2A3A";
const REST_BORDER = "rgba(255,255,255,0.10)";

const SCROLLED_BG = "rgba(247,242,234,0.55)";
const SCROLLED_BORDER = "rgba(42,36,29,0.10)";

export interface NavbarProps {
  /**
   * Where the gold CTA goes (desktop + mobile drawer). Defaults to
   * `/begin` (the product-picker route). The personalized-books
   * product page overrides this to `#pricing` — same reasoning as its
   * Footer's `ctaHref` prop: that page already has its own real
   * pricing section, so the CTA scrolls there instead of detouring
   * through `/begin`'s picker for a product the visitor already
   * committed to.
   */
  ctaHref?: string;
}

export default function Navbar({ ctaHref = "/begin" }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const { language, setLanguage } = useLanguage();
  const t = useT(NAV_LABELS_EN, NAV_LABELS_UZ, NAV_LABELS_RU);
  const pathname = usePathname();
  // "Order Now" everywhere except the personalized-books product page,
  // which gets its own "Create Your Story" copy — that page already
  // has one committed product in view, so the general "could be any of
  // the three products" phrasing doesn't fit.
  const ctaLabel = pathname === PERSONALIZED_BOOKS_PATH ? t.ctaCreateStory : t.ctaOrderNow;
  // Inside the order funnel (`/begin`, `/begin/*`) the visitor is already
  // ordering, so the redundant gold "Buyurtma bering" CTA is dropped from
  // both the desktop bar and the mobile drawer. Every other page keeps it.
  const showOrderCta = !isOrderFunnelPath(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * ---------------------------------------------------------------
   * DESKTOP DROPDOWNS (Product, Language) — only one open at a time.
   * ---------------------------------------------------------------
   */
  const [openDropdown, setOpenDropdown] = useState<"product" | "language" | null>(null);

  const productContainerRef = useRef<HTMLLIElement>(null);
  const languageContainerRef = useRef<HTMLDivElement>(null);
  const productTriggerRef = useRef<HTMLButtonElement>(null);
  const languageTriggerRef = useRef<HTMLButtonElement>(null);
  const productFirstItemRef = useRef<HTMLAnchorElement>(null);

  const toggleDropdown = (name: "product" | "language") =>
    setOpenDropdown((current) => (current === name ? null : name));

  const closeDropdowns = () => setOpenDropdown(null);

  // Focus the first menu item once the Product dropdown opens
  useEffect(() => {
    if (openDropdown === "product") {
      productFirstItemRef.current?.focus();
    }
  }, [openDropdown]);

  // Click outside either dropdown closes whichever is open
  useEffect(() => {
    if (!openDropdown) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const withinProduct = productContainerRef.current?.contains(target);
      const withinLanguage = languageContainerRef.current?.contains(target);
      if (!withinProduct && !withinLanguage) closeDropdowns();
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [openDropdown]);

  // Escape closes the open dropdown and returns focus to its trigger
  useEffect(() => {
    if (!openDropdown) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const trigger = openDropdown === "product" ? productTriggerRef : languageTriggerRef;
      closeDropdowns();
      trigger.current?.focus();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openDropdown]);

  /**
   * ---------------------------------------------------------------
   * MOBILE NAVIGATION (< lg only)
   * ---------------------------------------------------------------
   */
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [mobileProductOpen, setMobileProductOpen] = useState(false);
  const [mobileLanguageOpen, setMobileLanguageOpen] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  // Mobile top-bar language dropdown — lives next to the hamburger now,
  // not inside the drawer. Own refs (can't share the desktop language
  // trigger/container refs: both nav variants stay mounted at once via
  // CSS `hidden`, so a shared ref would just get overwritten by
  // whichever one rendered second).
  const mobileLanguageContainerRef = useRef<HTMLDivElement>(null);
  const mobileLanguageTriggerRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => setMobileOpen(false);

  // Click outside the mobile top-bar language dropdown closes it
  useEffect(() => {
    if (!mobileLanguageOpen) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (!mobileLanguageContainerRef.current?.contains(target)) {
        setMobileLanguageOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [mobileLanguageOpen]);

  // Escape closes the mobile top-bar language dropdown and returns focus to its trigger
  useEffect(() => {
    if (!mobileLanguageOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMobileLanguageOpen(false);
      mobileLanguageTriggerRef.current?.focus();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileLanguageOpen]);

  // Collapse the Product accordion (drawer-internal) and the top-bar
  // language dropdown whenever the drawer itself closes
  useEffect(() => {
    if (!mobileOpen) {
      setMobileProductOpen(false);
      setMobileLanguageOpen(false);
    }
  }, [mobileOpen]);

  // Mount/animate the drawer in, or animate it out then unmount
  useEffect(() => {
    if (mobileOpen) {
      setMenuMounted(true);
      const raf = requestAnimationFrame(() => setMenuVisible(true));
      return () => cancelAnimationFrame(raf);
    }

    setMenuVisible(false);
    const timeout = setTimeout(() => setMenuMounted(false), MOBILE_MENU_EXIT_MS);
    return () => clearTimeout(timeout);
  }, [mobileOpen]);

  // Focus management: move focus into the drawer on open, back to hamburger on close
  useEffect(() => {
    if (mobileOpen) {
      wasOpenRef.current = true;
      closeButtonRef.current?.focus();
    } else if (wasOpenRef.current) {
      toggleButtonRef.current?.focus();
    }
  }, [mobileOpen]);

  // Lock body scroll while the drawer is open
  useEffect(() => {
    if (!mobileOpen) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.setAttribute("data-tm-menu-open", "true");

    return () => {
      document.body.style.overflow = original;
      document.body.removeAttribute("data-tm-menu-open");
    };
  }, [mobileOpen]);

  // ESC closes the drawer; Tab/Shift+Tab is trapped inside it while open
  useEffect(() => {
    if (!mobileOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const linkClass = [
    "group relative inline-flex items-center py-2",
    "whitespace-nowrap font-sans text-[14px] font-medium tracking-[0.01em]",
    "transition-colors duration-200",
    "focus-visible:outline focus-visible:outline-2",
    "focus-visible:outline-offset-2",
    "focus-visible:outline-[var(--accent-primary,#B5764B)]",
    scrolled
      ? "text-[var(--text-secondary,#49433C)] hover:text-[var(--text-primary,#2A241D)]"
      : "text-white/85 hover:text-white",
  ].join(" ");

  const underlineClass = [
    "pointer-events-none absolute bottom-0 left-0",
    "h-px w-0",
    "transition-all duration-300 ease-out",
    "group-hover:w-full",
    scrolled ? "bg-[var(--text-primary,#2A241D)]" : "bg-white",
  ].join(" ");

  // Dropdown trigger (Product / Language)
  const dropdownTriggerClass = (isOpen: boolean) =>
    [
      "group relative inline-flex items-center gap-1.5 py-2",
      "whitespace-nowrap font-sans text-[14px] font-medium tracking-[0.01em]",
      "transition-colors duration-200",
      "focus-visible:outline focus-visible:outline-2",
      "focus-visible:outline-offset-2",
      "focus-visible:outline-[var(--accent-primary,#B5764B)]",
      scrolled
        ? "text-[var(--text-secondary,#49433C)] hover:text-[var(--text-primary,#2A241D)]"
        : "text-white/85 hover:text-white",
      isOpen ? (scrolled ? "text-[var(--text-primary,#2A241D)]" : "text-white") : "",
    ].join(" ");

  const dropdownPanelClass = (isOpen: boolean, align: "left" | "right" = "left") =>
    [
      "absolute top-full z-[60] mt-2",
      align === "left" ? "left-0 origin-top-left" : "right-0 origin-top-right",
      "rounded-[3px] backdrop-blur-[8px]",
      scrolled
        ? "bg-[var(--nav-scrolled-bg)] border border-[var(--nav-scrolled-border)]"
        : "bg-[var(--nav-rest-bg)]/[0.92] border border-[var(--nav-rest-border)]",
      "shadow-[0_10px_24px_-10px_rgba(0,0,0,0.28)]",
      "p-1.5",
      "transition-[opacity,transform] duration-[160ms] ease-out",
      isOpen
        ? "pointer-events-auto translate-y-0 opacity-100"
        : "pointer-events-none -translate-y-1 opacity-0",
    ].join(" ");

  const dropdownItemClass =
    [
      "block whitespace-nowrap rounded-[2px] px-4 py-2.5 font-sans text-[14px] font-medium leading-[1.3]",
      "transition-colors duration-150",
      scrolled
        ? "text-[var(--text-primary,#2A241D)] hover:bg-black/[0.05]"
        : "text-white/90 hover:bg-white/[0.08]",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent-primary,#B5764B)]",
    ].join(" ");

  const dropdownCaptionClass = scrolled
    ? "text-[var(--text-tertiary,#726C65)]"
    : "text-white/50";

  const languageTriggerClass = (isOpen: boolean) =>
  [
    "group relative inline-flex h-10 shrink-0 items-center gap-1",
    "px-1.5",
    "whitespace-nowrap font-sans text-[12px] font-medium tracking-[0.01em]",
    "transition-colors duration-200",
    "focus-visible:outline focus-visible:outline-2",
    "focus-visible:outline-offset-2",
    "focus-visible:outline-[var(--accent-primary,#B5764B)]",
    scrolled
      ? "text-[var(--text-secondary,#49433C)] hover:text-[var(--text-primary,#2A241D)]"
      : "text-white/85 hover:text-white",
    isOpen
      ? scrolled
        ? "text-[var(--text-primary,#2A241D)]"
        : "text-white"
      : "",
  ].join(" ");

  // Mobile top-bar language trigger — same color/open-state logic as
  // the desktop languageTriggerClass above, just recompacted to sit
  // comfortably in the h-16 mobile bar (h-8 matches the mobile logo's
  // own height, so both sit on the same visual line). No background
  // chip, matching the hamburger button right next to it — icon and
  // text sit directly on the navbar, nothing boxed.
  const mobileLanguageTriggerClass = (isOpen: boolean) =>
    [
      "group relative inline-flex h-8 shrink-0 items-center gap-1",
      "whitespace-nowrap font-sans text-[13px] font-medium tracking-[0.01em]",
      "transition-colors duration-200",
      "focus-visible:outline focus-visible:outline-2",
      "focus-visible:outline-offset-2",
      "focus-visible:outline-[var(--accent-primary,#B5764B)]",
      scrolled
        ? "text-[var(--text-secondary,#49433C)] hover:text-[var(--text-primary,#2A241D)]"
        : "text-white/85 hover:text-white",
      isOpen
        ? scrolled
          ? "text-[var(--text-primary,#2A241D)]"
          : "text-white"
        : "",
    ].join(" ");

  const chevronClass = (isOpen: boolean) =>
    [
      "h-3 w-3 shrink-0 transition-transform duration-200 ease-out",
      isOpen ? "rotate-180" : "rotate-0",
    ].join(" ");

  const ChevronIcon = () => (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-full w-full"
    >
      <path d="M2.5 4.5 6 8l3.5-3.5" />
    </svg>
  );

  // Flag icon component
  const FlagIcon = ({ code }: { code: (typeof LANGUAGES)[number]["code"] }) => (
    <svg
      viewBox="0 0 20 20"
      width={18}
      height={18}
      aria-hidden="true"
      className="shrink-0 overflow-hidden rounded-[4px] ring-1 ring-inset ring-black/10"
    >
      {code === "UZ" && (
        <>
          <rect width="20" height="20" fill="#0099B5" />
          <rect y="7.4" width="20" height="1" fill="#CE1126" />
          <rect y="8.4" width="20" height="3.2" fill="#FFFFFF" />
          <rect y="11.6" width="20" height="1" fill="#CE1126" />
          <rect y="12.6" width="20" height="7.4" fill="#1EB53A" />
          <circle cx="4.3" cy="3.7" r="2" fill="#FFFFFF" />
          <circle cx="5.1" cy="3.7" r="1.7" fill="#0099B5" />
        </>
      )}
      {code === "EN" && (
        <>
          <rect width="20" height="20" fill="#00247D" />
          <path d="M0 0 20 20M20 0 0 20" stroke="#FFFFFF" strokeWidth="3.6" />
          <path d="M0 0 20 20M20 0 0 20" stroke="#CF142B" strokeWidth="1.4" />
          <path d="M10 0V20M0 10H20" stroke="#FFFFFF" strokeWidth="5.6" />
          <path d="M10 0V20M0 10H20" stroke="#CF142B" strokeWidth="2.6" />
        </>
      )}
      {code === "RU" && (
        <>
          <rect width="20" height="6.67" fill="#FFFFFF" />
          <rect y="6.67" width="20" height="6.67" fill="#0039A6" />
          <rect y="13.33" width="20" height="6.67" fill="#D52B1E" />
        </>
      )}
      {code === "AR" && (
        <>
          <rect width="20" height="20" fill="#006C35" />
          <rect x="3.5" y="8.1" width="13" height="1.5" rx="0.75" fill="#FFFFFF" />
          <rect x="3.5" y="10.8" width="13" height="1.1" rx="0.55" fill="#FFFFFF" />
        </>
      )}
    </svg>
  );

  // Globe icon for language trigger
  const GlobeIcon = () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      aria-hidden="true"
      className="h-[15px] w-[15px] shrink-0"
    >
      <circle cx="8" cy="8" r="6.25" />
      <ellipse cx="8" cy="8" rx="2.5" ry="6.25" />
      <path d="M1.9 5.8h12.2M1.9 10.2h12.2" />
    </svg>
  );

  // Social icon component — outline when not scrolled, brand-colored when scrolled
  const SocialIcon = ({ 
    name, 
    scrolled 
  }: { 
    name: (typeof SOCIAL_LINKS)[number]["name"];
    scrolled: boolean;
  }) => {
    if (scrolled) {
      const iconPath = SOCIAL_ICON_PATHS[name];
      
      return (
       <img
  src={iconPath}
  alt=""
  aria-hidden
  draggable={false}
  className="h-full  w-full object-contain"
/>
      );
    }

    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-full w-full"
      >
        {name === "instagram" && (
          <>
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4.2" />
            <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
          </>
        )}
        {name === "telegram" && (
          <path d="M21 3 3 10.5l6 2 2 6 3-4.5 4.5 3L21 3ZM9 12.5 18 6" />
        )}
        {name === "youtube" && (
          <>
            <rect x="3" y="6" width="18" height="12" rx="4" />
            <path d="M10.5 9.7 15 12l-4.5 2.3V9.7Z" fill="currentColor" stroke="none" />
          </>
        )}
      </svg>
    );
  };

  const hamburgerBarColor = scrolled
    ? "bg-[var(--nav-rest-bg,#1C2A3A)]"
    : "bg-white";

  // Full display name of the currently selected language (for the mobile accordion trigger)
  const currentLanguageName =
    LANGUAGES.find((lang) => lang.code === language)?.name ?? language;

  return (
    <header
      style={
        {
          "--nav-rest-bg": REST_BG,
          "--nav-rest-border": REST_BORDER,
          "--nav-scrolled-bg": SCROLLED_BG,
          "--nav-scrolled-border": SCROLLED_BORDER,
        } as React.CSSProperties
      }
      className={[
        "tm-navbar-safe fixed inset-x-0 top-0 z-50",
        "transition-[background-color,backdrop-filter,border-color,box-shadow]",
        "duration-300",
        scrolled
          ? "border-b border-[var(--nav-scrolled-border)] bg-[var(--nav-scrolled-bg)] backdrop-blur-md shadow-elevated"
          : "border-b border-[var(--nav-rest-border)] bg-[var(--nav-rest-bg)]",
      ].join(" ")}
    >
      {/* Logo shine (.tm-logo-shine) and gold CTA (.tm-cta-gold) both live
          globally in globals.css (§27/§28) so they can be reused outside
          Navbar — Footer reuses both for its own logo + CTA. */}

      {/* ============================================================
          DESKTOP NAV (lg and above)
      ============================================================ */}
      <nav
        aria-label={t.primaryNav}
        className="relative mx-auto hidden h-[74px] max-w-[1440px] grid-cols-[minmax(200px,1fr)_auto_1fr] items-center gap-8 px-5 md:px-10 lg:grid lg:px-16"
      >
        <Link
          href="/"
          aria-label={t.talimoonHome}
          className="relative flex h-[45px] w-auto shrink-0 items-center"
        >
          <img
            src="/logo/talimoon-logo-color.svg"
            alt="Talimoon"
            draggable={false}
            className="h-[45px] w-auto shrink-0 transition-opacity duration-300"
            style={{ opacity: scrolled ? 1 : 0 }}
          />
          <img
            src="/logo/talimoon-logo-gold.svg"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute inset-0 h-[45px] w-auto shrink-0 transition-opacity duration-300"
            style={{ opacity: scrolled ? 0 : 1 }}
          />
          <span
            aria-hidden="true"
            className="tm-logo-shine pointer-events-none absolute inset-0 h-[45px] w-auto transition-opacity duration-300"
            style={{ opacity: scrolled ? 0 : 1 }}
          />
        </Link>

        <ul className="flex shrink-0 items-center gap-11">
          {DESKTOP_NAV_ITEMS.map((item) => {
            if ("dropdown" in item) {
              const isOpen = openDropdown === "product";
              return (
                <li key={item.key} ref={productContainerRef} className="relative">
                  <button
                    ref={productTriggerRef}
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    aria-controls="tm-product-menu"
                    onClick={() => toggleDropdown("product")}
                    className={dropdownTriggerClass(isOpen)}
                  >
                    {t[item.key]}
                    <span aria-hidden="true" className={underlineClass} />
                  </button>

                  <div
                    id="tm-product-menu"
                    role="menu"
                    aria-label={t.product}
                    className={dropdownPanelClass(isOpen)}
                  >
                    {PRODUCT_MENU.map((product, index) => (
                      <a
                        key={product.href}
                        ref={index === 0 ? productFirstItemRef : undefined}
                        href={product.href}
                        role="menuitem"
                        tabIndex={isOpen ? 0 : -1}
                        onClick={closeDropdowns}
                        className={dropdownItemClass}
                      >
                        {t[product.key]}
                        {"captionKey" in product && (
                          <span
                            className={[
                              "mt-0.5 block font-sans text-[11px] font-normal uppercase tracking-[0.08em]",
                              dropdownCaptionClass,
                            ].join(" ")}
                          >
                            {t[product.captionKey]}
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                </li>
              );
            }

            const isHashAnchor = item.href.startsWith("#");
            return (
              <li key={item.key}>
                {isHashAnchor ? (
                  <a href={item.href} className={linkClass}>
                    {t[item.key]}
                    <span aria-hidden="true" className={underlineClass} />
                  </a>
                ) : (
                  <Link href={item.href} className={linkClass}>
                    {t[item.key]}
                    <span aria-hidden="true" className={underlineClass} />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex shrink-0 items-center justify-end gap-6 ">
          <span aria-hidden="true" className="w-1 shrink-0" />

          {SHOW_LOGIN && (
            <Link href="/login" className={`${linkClass} ml-8`}>
              {t.login}
              <span aria-hidden="true" className={underlineClass} />
            </Link>
          )}

          {showOrderCta &&
            (ctaHref.startsWith("#") ? (
              <a
                href={ctaHref}
                className={[
                  "tm-cta-gold",
                  "inline-flex h-11 shrink-0 items-center justify-center",
                  "whitespace-nowrap px-4",
                  "text-[13px] font-medium tracking-[0.015em]",
                ].join(" ")}
              >
                {ctaLabel}
              </a>
            ) : (
              <Link
                href={ctaHref}
                className={[
                  "tm-cta-gold",
                  "inline-flex h-11 shrink-0 items-center justify-center",
                  "whitespace-nowrap px-4",
                  "text-[13px] font-medium tracking-[0.015em]",
                ].join(" ")}
              >
                {ctaLabel}
              </Link>
            ))}

          <div ref={languageContainerRef} className="relative -ml-2">
            <button
              ref={languageTriggerRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={openDropdown === "language"}
              aria-controls="tm-language-menu"
              aria-label={`${t.languagePrefix}: ${LANGUAGES.find((l) => l.code === language)?.name ?? language}`}
              onClick={() => toggleDropdown("language")}
              className={languageTriggerClass(openDropdown === "language")}
            >
              <GlobeIcon />
              <span>{language}</span>
              <span className={chevronClass(openDropdown === "language")}>
                <ChevronIcon />
              </span>
            </button>

            <div
              id="tm-language-menu"
              role="menu"
              aria-label={t.languagePrefix}
              className={[
                dropdownPanelClass(openDropdown === "language", "left"),
                "flex w-max flex-col gap-0.5",
              ].join(" ")}
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={language === lang.code}
                  aria-label={lang.name}
                  tabIndex={openDropdown === "language" ? 0 : -1}
                  onClick={() => {
                    setLanguage(lang.code);
                    closeDropdowns();
                    languageTriggerRef.current?.focus();
                  }}
                  className={[
                    "flex items-center gap-2 rounded px-2.5 py-2",
                    "font-sans text-[14px] font-medium",
                    "transition-colors duration-150",
                    "focus-visible:outline focus-visible:outline-2",
                    "focus-visible:outline-offset-[-2px]",
                    "focus-visible:outline-[var(--accent-primary,#B5764B)]",
                    scrolled ? "text-[var(--text-primary,#2A241D)]" : "text-white/90",
                    language === lang.code
                      ? scrolled
                        ? "bg-black/[0.05]"
                        : "bg-white/[0.08]"
                      : scrolled
                        ? "hover:bg-black/[0.05]"
                        : "hover:bg-white/[0.08]",
                  ].join(" ")}
                >
                  <FlagIcon code={lang.code} />
                  <span>{lang.code}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Social links — updated to pass scrolled prop */}
          <div className="ml-0 flex shrink-0 items-center gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.aria}
                className={[
                  social.name === "youtube"
                    ? "flex h-[30px] w-[30px] shrink-0 items-center justify-center"
                    : "flex h-[26px] w-[26px] shrink-0 items-center justify-center",
                  "transition-colors duration-200 ease-out",
                  scrolled
                    ? "text-[var(--text-tertiary,#726C65)] hover:text-[var(--text-primary,#2A241D)]"
                    : "text-white/70 hover:text-white",
                  "focus-visible:outline focus-visible:outline-2",
                  "focus-visible:outline-offset-2",
                  "focus-visible:outline-[var(--accent-primary,#B5764B)]",
                ].join(" ")}
              >
                <SocialIcon name={social.name} scrolled={scrolled} />
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* ============================================================
          MOBILE NAV (< lg only)
      ============================================================ */}
      <div className="tm-navbar-mobile mx-auto flex h-16 max-w-[1440px] items-center justify-between lg:hidden">
        <Link
          href="/"
          aria-label={t.talimoonHome}
          className="relative flex h-8 w-auto shrink-0 items-center"
        >
          <img
            src="/logo/talimoon-logo-color.svg"
            alt="Talimoon"
            draggable={false}
            className="h-8 w-auto shrink-0 transition-opacity duration-300"
            style={{ opacity: scrolled ? 1 : 0 }}
          />
          <img
            src="/logo/talimoon-logo-gold.svg"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute inset-0 h-8 w-auto shrink-0 transition-opacity duration-300"
            style={{ opacity: scrolled ? 0 : 1 }}
          />
          <span
            aria-hidden="true"
            className="tm-logo-shine pointer-events-none absolute inset-0 h-8 w-auto transition-opacity duration-300"
            style={{ opacity: scrolled ? 0 : 1 }}
          />
        </Link>

        <div className="flex shrink-0 items-center gap-3.5">
          <div ref={mobileLanguageContainerRef} className="relative shrink-0">
            <button
              ref={mobileLanguageTriggerRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={mobileLanguageOpen}
              aria-controls="tm-mobile-topbar-language-menu"
              aria-label={`${t.languagePrefix}: ${currentLanguageName}`}
              onClick={() => setMobileLanguageOpen((open) => !open)}
              className={mobileLanguageTriggerClass(mobileLanguageOpen)}
            >
              <GlobeIcon />
              <span>{language}</span>
              <span className={chevronClass(mobileLanguageOpen)}>
                <ChevronIcon />
              </span>
            </button>

            <div
              id="tm-mobile-topbar-language-menu"
              role="menu"
              aria-label={t.languagePrefix}
              className={[
                dropdownPanelClass(mobileLanguageOpen, "right"),
                "flex w-max flex-col gap-0.5",
              ].join(" ")}
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={language === lang.code}
                  aria-label={lang.name}
                  tabIndex={mobileLanguageOpen ? 0 : -1}
                  onClick={() => {
                    setLanguage(lang.code);
                    setMobileLanguageOpen(false);
                    mobileLanguageTriggerRef.current?.focus();
                  }}
                  className={[
                    "flex items-center gap-2 rounded px-2.5 py-2",
                    "font-sans text-[14px] font-medium",
                    "transition-colors duration-150",
                    "focus-visible:outline focus-visible:outline-2",
                    "focus-visible:outline-offset-[-2px]",
                    "focus-visible:outline-[var(--accent-primary,#B5764B)]",
                    scrolled ? "text-[var(--text-primary,#2A241D)]" : "text-white/90",
                    language === lang.code
                      ? scrolled
                        ? "bg-black/[0.05]"
                        : "bg-white/[0.08]"
                      : scrolled
                        ? "hover:bg-black/[0.05]"
                        : "hover:bg-white/[0.08]",
                  ].join(" ")}
                >
                  <FlagIcon code={lang.code} />
                  <span>{lang.code}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            ref={toggleButtonRef}
            type="button"
            aria-label={mobileOpen ? t.closeMenu : t.openMenu}
            aria-expanded={mobileOpen}
            aria-controls="tm-mobile-drawer"
            onClick={() => setMobileOpen((open) => !open)}
            className={[
              "relative flex h-6 w-6 shrink-0 items-center justify-center",
              "focus-visible:outline focus-visible:outline-2",
              "focus-visible:outline-offset-2",
              "focus-visible:outline-[var(--accent-primary,#B5764B)]",
            ].join(" ")}
          >
            <span aria-hidden="true" className="relative flex h-4 w-6 flex-col justify-between">
              <span
                className={[
                  "h-[1.5px] w-6 rounded-full transition-transform duration-300 ease-out",
                  hamburgerBarColor,
                  mobileOpen ? "translate-y-[7px] rotate-45" : "",
                ].join(" ")}
              />
              <span
                className={[
                  "h-[1.5px] w-6 rounded-full transition-opacity duration-200 ease-out",
                  hamburgerBarColor,
                  mobileOpen ? "opacity-0" : "opacity-100",
                ].join(" ")}
              />
              <span
                className={[
                  "h-[1.5px] w-6 rounded-full transition-transform duration-300 ease-out",
                  hamburgerBarColor,
                  mobileOpen ? "-translate-y-[7px] -rotate-45" : "",
                ].join(" ")}
              />
            </span>
          </button>
        </div>
      </div>

      {/* ============================================================
          MOBILE DRAWER
      ============================================================ */}
      {menuMounted && (
        <>
          <div
            aria-hidden="true"
            onClick={closeMenu}
            className={[
              "fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm lg:hidden",
              `transition-opacity duration-300 ${DRAWER_EASING}`,
              menuVisible ? "opacity-100" : "opacity-0",
            ].join(" ")}
          />

          <div
            id="tm-mobile-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t.mobileNav}
            className={[
              "tm-navbar-drawer fixed top-[calc(72px+env(safe-area-inset-top))] z-[60] lg:hidden",
              "flex max-h-[60vh] flex-col overflow-hidden rounded-3xl",
              "bg-[var(--surface-warm-100,#F7F2EA)]",
              "shadow-[0_24px_60px_-12px_rgba(42,36,29,0.35)]",
              "ring-1 ring-[var(--border-subtle,rgba(42,36,29,0.12))]",
              `origin-top transition-[opacity,transform] duration-300 ${DRAWER_EASING}`,
              menuVisible
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 -translate-y-2 scale-[0.98]",
            ].join(" ")}
          >
            {/* Header: logo, then social icons right after it, then close button */}
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-subtle,rgba(42,36,29,0.12))] px-5 py-3">
              <Link
                href="/"
                aria-label={t.talimoonHome}
                onClick={closeMenu}
                className="flex h-7 w-auto items-center"
              >
                <img
                  src="/logo/talimoon-logo-color.svg"
                  alt="Talimoon"
                  draggable={false}
                  className="h-7 w-auto shrink-0"
                />
              </Link>

              <div className="flex shrink-0 items-center gap-4">
                <div className="flex shrink-0 items-center gap-3">
                  {SOCIAL_LINKS.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.aria}
                      className={[
                        "flex h-5 w-5 shrink-0 items-center justify-center",
                        "text-[var(--text-tertiary,#726C65)]",
                        "transition-colors duration-200 ease-out",
                        "hover:text-[var(--text-primary,#2A241D)]",
                        "focus-visible:outline focus-visible:outline-2",
                        "focus-visible:outline-offset-2",
                        "focus-visible:outline-[var(--accent-primary,#B5764B)]",
                      ].join(" ")}
                    >
                      <SocialIcon name={social.name} scrolled={true} />
                    </a>
                  ))}
                </div>

                <span
                  aria-hidden="true"
                  className="h-4 w-px shrink-0 bg-[var(--border-subtle,rgba(42,36,29,0.14))]"
                />

                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label={t.closeMenu}
                  onClick={closeMenu}
                  className={[
                    "flex h-6 w-6 shrink-0 items-center justify-center",
                    "text-[var(--text-primary,#2A241D)]",
                    "focus-visible:outline focus-visible:outline-2",
                    "focus-visible:outline-offset-2",
                    "focus-visible:outline-[var(--accent-primary,#B5764B)]",
                  ].join(" ")}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    aria-hidden="true"
                    className="h-5 w-5"
                  >
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>
            </div>

            <nav aria-label={t.mobileNav} className="min-h-0 flex-1 overflow-y-auto px-5">
              <ul className="flex flex-col divide-y divide-[var(--border-subtle,rgba(42,36,29,0.12))]">
                {MOBILE_NAV_LINKS.map((item) => {
                  if ("accordion" in item) {
                    return (
                      <li key={item.key}>
                        <button
                          type="button"
                          aria-expanded={mobileProductOpen}
                          aria-controls="tm-mobile-product-panel"
                          onClick={() => setMobileProductOpen((open) => !open)}
                          className={[
                            "flex min-h-[52px] w-full items-center justify-between",
                            "py-4 text-left font-serif text-[1.0625rem] font-medium leading-[1.3]",
                            "text-[var(--text-primary,#2A241D)]",
                            "transition-colors duration-200 ease-out active:text-[var(--accent-primary,#B5764B)]",
                            "focus-visible:outline focus-visible:outline-2",
                            "focus-visible:outline-offset-2",
                            "focus-visible:outline-[var(--accent-primary,#B5764B)]",
                          ].join(" ")}
                        >
                          {t[item.key]}
                          <span
                            className={[
                              "h-3 w-3 shrink-0 text-[var(--text-tertiary,#726C65)]",
                              "transition-transform duration-300 ease-out",
                              mobileProductOpen ? "rotate-180" : "rotate-0",
                            ].join(" ")}
                          >
                            <ChevronIcon />
                          </span>
                        </button>

                        <div
                          id="tm-mobile-product-panel"
                          className={[
                            "grid overflow-hidden",
                            `transition-[grid-template-rows] duration-300 ${DRAWER_EASING}`,
                            mobileProductOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                          ].join(" ")}
                        >
                          <ul className="min-h-0 flex flex-col gap-1 pb-4 pl-4">
                            {PRODUCT_MENU.map((product) => (
                              <li key={product.href}>
                                <a
                                  href={product.href}
                                  onClick={closeMenu}
                                  tabIndex={mobileProductOpen ? 0 : -1}
                                  className={[
                                    "flex min-h-[44px] flex-col justify-center rounded-lg px-2",
                                    "font-sans text-[15px] font-medium leading-[1.3]",
                                    "text-[var(--text-secondary,#49433C)]",
                                    "transition-colors duration-200 ease-out",
                                    "active:text-[var(--text-primary,#2A241D)]",
                                    "focus-visible:outline focus-visible:outline-2",
                                    "focus-visible:outline-offset-2",
                                    "focus-visible:outline-[var(--accent-primary,#B5764B)]",
                                  ].join(" ")}
                                >
                                  {t[product.key]}
                                  {"captionKey" in product && (
                                    <span className="mt-0.5 font-sans text-[11px] font-normal uppercase tracking-[0.08em] text-[var(--text-tertiary,#726C65)]">
                                      {t[product.captionKey]}
                                    </span>
                                  )}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </li>
                    );
                  }

                  return (
                    <li key={item.key}>
                      <a
                        href={item.href}
                        onClick={closeMenu}
                        className={[
                          "flex min-h-[52px] items-center py-4",
                          "font-serif text-[1.0625rem] font-medium leading-[1.3]",
                          "text-[var(--text-primary,#2A241D)]",
                          "transition-colors duration-200 ease-out active:text-[var(--accent-primary,#B5764B)]",
                          "focus-visible:outline focus-visible:outline-2",
                          "focus-visible:outline-offset-2",
                          "focus-visible:outline-[var(--accent-primary,#B5764B)]",
                        ].join(" ")}
                      >
                        {t[item.key]}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {showOrderCta && (
              <div className="shrink-0 border-t border-[var(--border-subtle,rgba(42,36,29,0.12))] px-5 py-4">
                {ctaHref.startsWith("#") ? (
                  <a
                    href={ctaHref}
                    onClick={closeMenu}
                    className={[
                      "tm-cta-gold",
                      "flex h-12 w-full items-center justify-center",
                      "text-[14px] font-medium tracking-[0.02em]",
                    ].join(" ")}
                  >
                    {ctaLabel}
                  </a>
                ) : (
                  <Link
                    href={ctaHref}
                    onClick={closeMenu}
                    className={[
                      "tm-cta-gold",
                      "flex h-12 w-full items-center justify-center",
                      "text-[14px] font-medium tracking-[0.02em]",
                    ].join(" ")}
                  >
                    {ctaLabel}
                  </Link>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
}
