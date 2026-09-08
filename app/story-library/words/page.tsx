import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { WordsCollection } from "@/components/story-library/WordsCollection";
import { listPublicMemories } from "@/lib/story-library/words";

export const metadata: Metadata = {
  title: "Words Left for a Child — TALIMOON Story Library",
  description:
    "Personal messages that families have chosen to share from the final page of their personalized TALIMOON books.",
};

// Published / revoked by customer consent — always render against fresh data
// so a since-revoked memory never lingers.
export const dynamic = "force-dynamic";

export default async function WordsCategoryPage() {
  let items = [] as Awaited<ReturnType<typeof listPublicMemories>>;
  try {
    items = await listPublicMemories();
  } catch {
    items = [];
  }
  return (
    <>
      <Navbar />
      <main>
        <WordsCollection items={items} />
      </main>
      <Footer />
    </>
  );
}
