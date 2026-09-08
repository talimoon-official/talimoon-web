import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/products/personalized-books/hero/hero";
import Recognition from "@/components/products/personalized-books/acts/Recognition";
import Method from "@/components/products/personalized-books/acts/Method";
import Exclusivity from "@/components/products/personalized-books/acts/Exclusivity";
import VoiceMemory from "@/components/products/personalized-books/acts/VoiceMemory";
import ProcessPrice from "@/components/products/personalized-books/acts/ProcessPrice";
import Close from "@/components/products/personalized-books/acts/Close";
import Footer from "@/components/layout/Footer";

/**
 * Personalized Books — SALES V3.
 * ----------------------------------------------------------------
 * One scrolling story in SIX acts, each with its own visual rhythm.
 * Shorter than V2: repeated benefit grids ("personalized", "beautiful
 * illustration", "child is hero", "premium artwork") are gone; every
 * act now earns its place.
 *
 *   01 Hero .......... WONDER      "this isn't just a book with a name"
 *   02 Recognition ... TENSION     "necha marta?" — familiar phrases,
 *                                   resolving into "boshqacha yetkazish"
 *   03 Method ........ RELEASE     the mechanism, shown not explained
 *                                   (deep-navy beat, #method)
 *   04 Exclusivity ... DESIRE      "do'kondan topolmaysiz" + product
 *   04.5 VoiceMemory . MEANING     the optional preserved-voice
 *                                   differentiator, before price (#voice-memory)
 *   05 ProcessPrice .. CONFIDENCE  3 steps + the PricingSection at
 *                                   `#pricing` (market + plan cards)
 *   06 Close ......... WARMTH      the quiet ask + a compact FAQ
 *
 * On THIS product page the purchase-intent CTAs (navbar, hero, method,
 * process, close) scroll to `#pricing` on the same page — the visitor
 * has already chosen the product, so they stay here to see the plans.
 * From the pricing cards, "Choose …" then enters the shared order form
 * at `/begin/personalized-book/form`. Customers arriving through the
 * GENERAL funnel instead go `/begin` → `/begin/personalized-book/price`
 * → the same form.
 */
export default function PersonalizedBooksPage() {
  return (
    <>
      <Navbar ctaHref="#pricing" />

      <main>
        {/* Act 01 — copy lives in the Hero's own EN/UZ dictionary. */}
        <Hero
          imageSrc="/images/products/personalized-books/hero/hero-v13.webp"
          secondaryCtaHref="#method"
        />

        <Recognition />

        <Method />

        <Exclusivity />

        {/* Act 04.5: the optional Voice Memory differentiator, placed at
            peak desire and right before the how-it-made / price run. */}
        <VoiceMemory />

        <ProcessPrice />

        <Close />
      </main>

      {/* Footer CTA button intentionally omitted here — this page already
          carries the navbar CTA, the pricing-card CTAs and the emotional
          closing CTA; the footer ends quietly. */}
      <Footer showTopCtaButton={false} />
    </>
  );
}
