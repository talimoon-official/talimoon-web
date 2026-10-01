import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ResumeChoiceRoute from "./ResumeChoiceRoute";

/**
 * `/begin/personalized-book/resume` — "Yangi buyurtma" lands here (instead
 * of the pricing page) when this device holds a valid unfinished order:
 * continue it, or (after one confirmation) delete it and start fresh.
 * Without such a draft it forwards to the pricing page, so a reload after
 * the draft is gone — or a stale link — never shows an empty choice.
 *
 * Navbar/Footer + top clearance mirror the other order steps.
 */
export default function PersonalizedBookResumePage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 lg:pt-[74px]">
        <ResumeChoiceRoute />
      </main>
      <Footer />
    </>
  );
}
