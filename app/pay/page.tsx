import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PayCodeEntry from "@/components/payment/PayCodeEntry";

/**
 * `/pay` — talimoon.com/pay, the address printed in the payment-code SMS /
 * WhatsApp message. The customer enters their payment code (e.g. K7M4P2) and
 * lands on `/begin/personalized-book/payment` for their saved order. No Referer
 * leaves this page.
 */
export const metadata: Metadata = {
  title: "TALIMOON | To‘lov kodi",
  description: "Saqlangan buyurtmangiz uchun to‘lovni davom ettirish.",
  referrer: "no-referrer",
};

export default function PayPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 lg:pt-[74px]">
        <PayCodeEntry />
      </main>
      <Footer />
    </>
  );
}
