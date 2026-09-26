import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PersonalizedBookPlans from "@/components/begin/PersonalizedBookPlans";

/**
 * `/begin/personalized-book/price` — the book-type choice, on its own page.
 * Reached from "Yangi buyurtma" on `/begin/personalized-book`; each card
 * continues into `/begin/personalized-book/form` with the chosen type.
 * Prices come only from MARKET_PRICING (see PersonalizedBookPlans).
 *
 * Navbar/Footer + top clearance mirror `/begin` so the steps sit under the
 * fixed navbar identically.
 */
export default function PersonalizedBookPricePage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 lg:pt-[74px]">
        <PersonalizedBookPlans />
      </main>
      <Footer />
    </>
  );
}
