import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { WordsStory } from "@/components/story-library/WordsStory";
import { getPublicMemory } from "@/lib/story-library/words";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let m = null;
  try {
    m = await getPublicMemory(slug);
  } catch {
    m = null;
  }
  if (!m) return { title: "Words Left for a Child — TALIMOON" };
  return {
    title: "Words Left for a Child — TALIMOON Story Library",
    description: m.message ? m.message.replace(/\s+/g, " ").slice(0, 155) : undefined,
  };
}

export default async function WordsStoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let memory = null;
  try {
    memory = await getPublicMemory(slug);
  } catch {
    memory = null;
  }
  if (!memory) notFound();
  return (
    <>
      <Navbar />
      <main>
        <WordsStory memory={memory} />
      </main>
      <Footer />
    </>
  );
}
