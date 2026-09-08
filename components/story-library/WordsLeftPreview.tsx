/**
 * Hall band: a quiet doorway into "Words Left for a Child".
 *
 * Server component. Self-hiding until at least one memory is published, so
 * the Hall never shows an empty band (same posture as MostLovedStrip).
 */

import Link from "next/link";
import { Band } from "./shared";
import { WORDS_CATEGORY_PATH } from "@/lib/story-library/words";

/** Cached count so the Hall stays mostly-static; refreshes every 5 min. */
async function publishedCount(): Promise<number> {
  const base =
    process.env.INTAKE_API_URL ?? process.env.NEXT_PUBLIC_INTAKE_API_URL ?? "";
  if (!base) return 0;
  try {
    const res = await fetch(`${base.replace(/\/+$/, "")}/v1/m/public`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return 0;
    const body = (await res.json()) as { items?: unknown[] };
    return body.items?.length ?? 0;
  } catch {
    return 0;
  }
}

export async function WordsLeftPreview() {
  const count = await publishedCount();
  if (count === 0) return null;

  return (
    <Band className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p className="text-[0.7rem] tracking-[0.22em] uppercase text-[#B8935B]">From the family</p>
        <h2 className="mt-3 font-serif text-3xl text-[#1C2A3A]">Words left for a child</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-[rgba(28,42,58,0.64)]">
          On the last page of some TALIMOON books, the person giving the book leaves a few words of
          their own — sometimes in their real voice.
        </p>
        <Link
          href={WORDS_CATEGORY_PATH}
          className="mt-6 inline-block text-sm text-[#B8935B] underline underline-offset-4"
        >
          Read what families have shared →
        </Link>
      </div>
    </Band>
  );
}

export default WordsLeftPreview;
