import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PersonalizedBookEntry from "@/components/begin/PersonalizedBookEntry";

/**
 * `/begin/personalized-book/price` — the Personalized Books order entry.
 * Reached after choosing the Personalized Books world on `/begin`. The
 * customer chooses their intent here: a NEW order (book choice, then the
 * form) or payment for an EXISTING saved order (/pay — never the form).
 * Prices come only from MARKET_PRICING (see PersonalizedBookEntry).
 *
 * Navbar/Footer + top clearance mirror `/begin` so the steps sit under the
 * fixed navbar identically.
 */
export default function PersonalizedBookPricePage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 lg:pt-[74px]">
        <PersonalizedBookEntry />
      </main>
      <Footer />
    </>
  );
}
