import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductSelect from "@/components/begin/ProductSelect";

export default function BeginPage() {
  return (
    <>
      <Navbar />
      {/* Navbar is `fixed`, so the first section on this route needs its
          own top clearance — 64px below `lg` (mobile bar height), 74px at
          `lg`+ (desktop bar height). The same clearance is applied on
          `/begin/personalized-book/price` and `/begin/personalized-book/form`
          (the next steps of the journey) so all three sit under the navbar
          identically — a component embedded mid-page elsewhere (e.g.
          PricingSection at the product page's `#pricing`) has no such need. */}
      <main className="pt-16 lg:pt-[74px]">
        <ProductSelect />
      </main>
      <Footer />
    </>
  );
}
