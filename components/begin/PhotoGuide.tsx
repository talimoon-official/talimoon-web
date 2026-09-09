"use client";

/**
 * TALIMOON — ORDER — photo guidance ("SURAT BO‘YICHA QO‘LLANMA").
 * ----------------------------------------------------------------
 * A calm, editorial block that sits at the very top of the
 * "Farzandingiz suratlarini joylang" step — BEFORE the upload
 * controls — so the customer understands *why* clear reference
 * photos matter before they open their phone's photo library.
 *
 * It is deliberately NOT an alert / FAQ / warning box: left column
 * is short editorial copy, right column is one high-resolution
 * visual plate (the supplied photo-guide image, reused as-is for
 * every language — it carries no baked-in text). The green / red
 * "do / don't" signalling lives inside that image, never in this
 * UI, so the surrounding surface stays warm-neutral and reassuring.
 *
 * All copy is passed in (no LanguageContext here) so the piece stays
 * trivially testable and its strings live with the rest of the
 * order-form dictionary in PersonalizedBookOrderForm (UZ / EN / RU).
 *
 * <PhotoGuideReminder> is the compact, reusable version shown once
 * per additional character — a small thumbnail of the same plate
 * plus a single line — so the form never repeats the full guide.
 */

import Image from "next/image";

/** One asset, reused at every size and for every language — it carries
 *  no baked-in text, so the same file serves UZ / EN / RU. A tall
 *  portrait plate (1024×1536): good angles, additional-character
 *  angles, then the "please don't" row. */
const GUIDE_IMAGE_SRC = "/images/begin/photo-guide/child-photo-reference-guide.webp";
const GUIDE_IMAGE_W = 1024;
const GUIDE_IMAGE_H = 1536;

export interface PhotoGuideCopy {
  eyebrow: string;
  heading: string;
  body: string;
  support: string;
  /** Three very short angle/quality cues shown under the copy. */
  requirements: readonly [string, string, string];
  imageAlt: string;
}

export function PhotoGuidePanel({ copy }: { copy: PhotoGuideCopy }) {
  return (
    <section
      aria-labelledby="photo-guide-heading"
      /* The order form column is a narrow max-w-xl; on large screens the
         guide gently breaks out of it so the copy / plate composition has
         real editorial width (the step's section padding leaves ample
         room). It never breaks out on mobile. */
      className="rounded-2xl border border-border-subtle bg-surface-raised p-5 sm:p-7 lg:-mx-16 lg:p-9 xl:-mx-28"
    >
      {/* The guide plate is a tall portrait, so on desktop the copy is the
          wider column and the plate sits as a contained editorial "page"
          on the right, vertically centred against the text. */}
      <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)] lg:items-center">
        {/* LEFT — editorial copy */}
        <div className="max-w-[46ch]">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-primary">
            {copy.eyebrow}
          </p>
          <h3
            id="photo-guide-heading"
            className="mt-3 font-display text-[20px] font-medium leading-snug text-text-primary sm:text-[22px]"
          >
            {copy.heading}
          </h3>
          <p className="mt-3 font-sans text-[13.5px] leading-[1.6] text-text-secondary">
            {copy.body}
          </p>
          <p className="mt-2.5 font-sans text-[12.5px] leading-[1.55] text-text-muted">
            {copy.support}
          </p>
          <ul className="mt-5 space-y-2">
            {copy.requirements.map((req) => (
              <li
                key={req}
                className="flex items-start gap-2.5 font-sans text-[13px] leading-[1.5] text-text-primary"
              >
                <span
                  aria-hidden
                  className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent-primary"
                />
                {req}
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT — the visual plate. The image keeps its own aspect
            ratio (no object-cover, no crop); the cream surface + hairline
            gold border is the only framing. Centred and width-capped on
            mobile so a tall portrait never dominates the screen. */}
        <figure className="group m-0 mx-auto w-full max-w-[360px] lg:mx-0 lg:max-w-none">
          <div className="overflow-hidden rounded-xl border border-[color:var(--gold-500-a35)] bg-[var(--paper-100)] p-2 shadow-[0_2px_18px_-12px_rgba(33,29,24,0.22)] transition duration-300 ease-out motion-safe:lg:group-hover:-translate-y-0.5 motion-safe:lg:group-hover:shadow-[0_14px_34px_-16px_rgba(33,29,24,0.3)]">
            <Image
              src={GUIDE_IMAGE_SRC}
              alt={copy.imageAlt}
              width={GUIDE_IMAGE_W}
              height={GUIDE_IMAGE_H}
              quality={100}
              sizes="(min-width: 1024px) 300px, (min-width: 640px) 360px, 88vw"
              className="h-auto w-full rounded-lg"
            />
          </div>
        </figure>
      </div>
    </section>
  );
}

/**
 * Compact one-line reminder for each additional character — a small
 * thumbnail of the same guide plate plus a single sentence. Never the
 * full <PhotoGuidePanel>, so a form with several characters does not
 * become visually repetitive.
 */
export function PhotoGuideReminder({ text, thumbAlt }: { text: string; thumbAlt: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2.5">
      <Image
        src={GUIDE_IMAGE_SRC}
        alt={thumbAlt}
        width={GUIDE_IMAGE_W}
        height={GUIDE_IMAGE_H}
        quality={75}
        sizes="48px"
        className="h-12 w-12 shrink-0 rounded-md border border-[color:var(--gold-500-a35)] object-cover object-top"
      />
      <p className="font-sans text-[12.5px] leading-[1.5] text-text-secondary">{text}</p>
    </div>
  );
}
