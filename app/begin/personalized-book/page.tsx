import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PersonalizedBookEntry from "@/components/begin/PersonalizedBookEntry";

/**
 * `/begin/personalized-book` — the Personalized Books order entry.
 * Reached after choosing the Personalized Books world on `/begin`. The
 * customer chooses their intent here, and only that:
 *
 *   Yangi buyurtma               -> /begin/personalized-book/price (own page)
 *   Mavjud buyurtma uchun to‘lov -> /pay (never the form)
 *
 * Navbar/Footer + top clearance mirror `/begin` so the steps sit under the
 * fixed navbar identically.
 */
export default function PersonalizedBookEntryPage() {
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
