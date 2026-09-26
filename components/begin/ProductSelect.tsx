"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useLanguage, useT } from "@/lib/i18n/LanguageContext";

type ProductId = "personalized-books" | "yusuf-yasmina" | "toys";

interface Product {
  id: ProductId;
  name: string;
  nameUz: string;
  tagline: string;
  taglineUz: string;
  /**
   * Card artwork — the approved editorial images made specifically for
   * this order-entry page (`/public/images/begin`). One warm visual
   * family, each a full-bleed rectangular ~4:3 scene, NOT an arch /
   * doorway silhouette: the image itself is a confident part of the
   * card (SEE → IMAGINE → CHOOSE → BEGIN). Swap the path here if the
   * approved art is re-exported; do not invent replacement artwork.
   *   personalized-books → child unwrapping their own TALIMOON book
   *   yusuf-yasmina      → Yusuf & Yasmina overlooking their world
   *   toys               → child building a world from TALIMOON toys
   */
  image: string;
  active: boolean;
}

const PRODUCTS: Product[] = [
  {
    id: "personalized-books",
    name: "Personalized Books",
    nameUz: "Shaxsiylashtirilgan kitoblar",
    tagline: "Your child becomes the hero of a story created especially for them.",
    taglineUz: "Farzandingiz maxsus u uchun yaratilgan hikoyaning bosh qahramoniga aylanadi.",
    image: "/images/begin/personalized-books.png",
    active: true,
  },
  {
    id: "yusuf-yasmina",
    name: "Yusuf & Yasmina",
    nameUz: "Yusuf va Yasmina",
    tagline: "Faith-filled adventures that inspire kindness, courage, and character.",
    taglineUz: "Mehr-shafqat, jasorat va halollikni ilhomlantiruvchi imonli sarguzashtlar.",
    image: "/images/begin/yusuf-yasmina.png",
    active: false,
  },
  {
    id: "toys",
    name: "Talimoon Toys",
    nameUz: "Talimoon o'yinchoqlari",
    tagline: "Beautiful toys that transform everyday play into joyful learning.",
    taglineUz: "Kundalik o'yinni quvonchli bilim olishga aylantiruvchi go'zal o'yinchoqlar.",
    image: "/images/begin/talimoon-toys.png",
    active: false,
  },
];

const CHROME_EN = {
  eyebrow: "Start your order",
  heading: "Which world are you opening today?",
  stepInside: "Start your order",
  comingSoon: "Coming soon",
};

const CHROME_UZ: typeof CHROME_EN = {
  eyebrow: "Buyurtmani boshlash",
  heading: "Bugun qaysi olamni ochmoqchisiz?",
  stepInside: "Buyurtmani boshlash",
  comingSoon: "Tez orada",
};

const CHROME_RU: typeof CHROME_EN = {
  eyebrow: "Начать заказ",
  heading: "Какой мир Вы открываете сегодня?",
  stepInside: "Начать заказ",
  comingSoon: "Скоро",
};

export default function ProductSelect() {
  const chrome = useT(CHROME_EN, CHROME_UZ, CHROME_RU);
  const { language } = useLanguage();
  const router = useRouter();

  // `/begin` has ONE job: product selection. Picking a product changes
  // the URL to that product's own order journey — the flow is never
  // rendered inline while the address bar still says `/begin`.
  function openProduct(id: ProductId) {
    if (id === "personalized-books") {
      router.push("/begin/personalized-book");
    }
    // Other products are not active yet (see PRODUCTS[].active); their
    // routes (/begin/yusuf-yasmina/…, /begin/toys/…) are added later.
  }

  return (
    <section className="mx-auto w-full max-w-container-content bg-surface-base px-6 py-16 sm:px-8 md:py-20 lg:px-16 lg:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 font-sans text-[13px] font-medium uppercase tracking-[0.16em] text-accent-primary">
          {chrome.eyebrow}
        </p>
        <h1 className="font-display text-[32px] font-medium leading-[1.15] tracking-tight text-text-primary sm:text-[40px]">
          {chrome.heading}
        </h1>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-x-6 gap-y-10 sm:mt-14 sm:grid-cols-3 sm:gap-x-6 lg:gap-x-8">
        {PRODUCTS.map((product) => {
          const name = language === "UZ" ? product.nameUz : product.name;
          const tagline = language === "UZ" ? product.taglineUz : product.tagline;
          return (
            <button
              key={product.id}
              type="button"
              disabled={!product.active}
              onClick={() => product.active && openProduct(product.id)}
              className={[
                "group relative flex h-full flex-col text-left",
                "rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-primary",
                product.active
                  ? "transition-transform duration-300 ease-out motion-safe:hover:-translate-y-1"
                  : "cursor-not-allowed",
              ].join(" ")}
            >
              <span
                className={[
                  "relative block aspect-[4/3] w-full overflow-hidden rounded-lg bg-surface-raised",
                  "ring-1 ring-black/[0.05]",
                  product.active
                    ? "shadow-[0_3px_16px_-8px_rgba(42,36,29,0.18)] transition-shadow duration-300 ease-out motion-safe:group-hover:shadow-[0_16px_40px_-16px_rgba(42,36,29,0.28)]"
                    : "shadow-[0_2px_12px_-8px_rgba(42,36,29,0.12)]",
                ].join(" ")}
              >
                <Image
                  src={product.image}
                  alt={name}
                  fill
                  priority
                  sizes="(min-width: 640px) 19rem, 92vw"
                  className={[
                    "object-cover object-center",
                    product.active
                      ? "transition-transform duration-[600ms] ease-out motion-safe:group-hover:scale-[1.03]"
                      : "opacity-[0.97]",
                  ].join(" ")}
                />
              </span>

              <h3 className="mt-4 font-display text-[19px] font-medium leading-snug text-text-primary lg:text-[20px]">
                {name}
              </h3>
              <p
                className={[
                  "mt-1.5 max-w-[34ch] font-sans text-[13.5px] leading-[1.55]",
                  product.active ? "text-text-secondary" : "text-text-muted",
                ].join(" ")}
              >
                {tagline}
              </p>

              <span
                className={[
                  "mt-auto inline-flex items-center gap-1.5 pt-4 font-sans text-[12px] font-medium uppercase tracking-[0.14em]",
                  product.active ? "text-text-primary" : "text-text-muted",
                ].join(" ")}
              >
                {product.active ? (
                  <>
                    {chrome.stepInside}
                    <ArrowRight
                      size={13}
                      strokeWidth={1.75}
                      className="transition-transform duration-300 ease-out motion-safe:group-hover:translate-x-1"
                    />
                  </>
                ) : (
                  chrome.comingSoon
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
