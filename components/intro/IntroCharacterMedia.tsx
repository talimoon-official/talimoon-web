"use client";

/**
 * Media boundary for the TALIMOON guide character.
 *
 * Renders the approved transparent guide-character asset
 * (`public/intro/talimoon-guide.png`, 1024x1536, real alpha channel —
 * confirmed via `sharp`, not a flat/opaque PNG) directly on the intro
 * canvas: no box, background, gradient, border, radius or shadow.
 * The wrapping element in IntroScreenOne.tsx is sized to the asset's
 * exact 2:3 aspect ratio (via `aspect-[2/3]`) so `object-contain`
 * never letterboxes — there is no invisible padding inside this
 * wrapper for positioning to fight against.
 *
 * If CHARACTER_SRC is ever cleared again (asset pulled, swapped),
 * this renders nothing rather than a placeholder — never a visible
 * stand-in box.
 */

import Image from "next/image";

const CHARACTER_SRC: string | null = "/intro/talimoon-guide.png";
const CHARACTER_ALT = "";

export function IntroCharacterMedia({ className = "" }: { className?: string }) {
  if (CHARACTER_SRC) {
    return (
      <div data-intro-character-media className={`relative h-full w-full ${className}`}>
        <Image
          src={CHARACTER_SRC}
          alt={CHARACTER_ALT}
          fill
          priority
          sizes="400px"
          className="object-contain"
        />
      </div>
    );
  }

  return <div data-intro-character-media className={`relative h-full w-full ${className}`} />;
}
