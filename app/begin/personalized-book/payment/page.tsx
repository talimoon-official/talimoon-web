import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PaymentPage from "@/components/payment/PaymentPage";

/**
 * `/begin/personalized-book/payment` — the separate payment stage for an
 * already-SAVED order, reached through the customer's personal link
 * (`#p_<token>` fragment). Never renders the order form. Private per-order
 * page: not indexed, and no Referer leaves it.
 */
export const metadata: Metadata = {
  title: "TALIMOON | To‘lov",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function PersonalizedBookPaymentPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 lg:pt-[74px]">
        <PaymentPage />
      </main>
      <Footer />
    </>
  );
}
