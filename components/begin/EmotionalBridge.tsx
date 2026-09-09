"use client";

/**
 * TALIMOON — ORDER — "KO‘NGIL SO‘ZLARI" (the private emotional-context flow).
 * ----------------------------------------------------------------------
 * Sits between "a personal touch" and the photo upload. Quiet and
 * intimate: one narrow column, generous whitespace, one question per
 * screen, no portrait card, no icons. Every field is optional and the
 * whole section can be walked straight through.
 *
 * This is NOT therapy, NOT a diagnosis, and NOT a message to the child
 * (that is Esdalik Sahifasi). Four psychologically distinct stages:
 *
 *   1. VAZIYAT — what is happening
 *   2. BOLANING HIS QILISHI MUMKIN BO‘LGAN HOLAT — the ADULT'S OBSERVATION
 *      of how the child might be experiencing it (a possibility, never
 *      stated as fact)
 *   3. ISTALGAN HISSIY YO‘NALISH — the emotional direction the story
 *      should support
 *   4. NIMAGA EHTIYOTKOR YONDASHAYLIK — themes to handle carefully
 *
 * The four answers are kept private, serialised into `profile.extraInfo`
 * (a single free-text field — the backend contract is unchanged) and are
 * never copied into the story or shown to the child. One child's context
 * is never shown against another.
 */

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { toLocale, directionFor } from "@/lib/journey/types";
import type { ChildProfile, EmotionalBridge as Bridge } from "@/lib/order/types";
import type { RecipientRelationship } from "@/lib/order/relationship";
import { emotionalBridgeCopy, type Locale } from "@/lib/order/emotional-bridge-copy";
import { useFlowScroll } from "@/lib/order/useFlowScroll";
import { JourneyProgress } from "./JourneyProgress";

type Screen = "intro" | "situation" | "experience" | "feeling" | "sensitivity" | "done";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function EmotionalBridge({
  childrenIn,
  entry = "start",
  onPatchChild,
  onComplete,
  onBack,
}: {
  childrenIn: ChildProfile[];
  /** kept for call-site compatibility — no longer used for copy */
  recipientRelationship?: RecipientRelationship;
  ordererHonorific?: unknown;
  /** "start" for the normal forward entry; "end" when the customer
   *  steps back into the section from the photo upload, so they land
   *  on the last child's acknowledgement and can walk back to edit. */
  entry?: "start" | "end";
  onPatchChild: (id: string, patch: Partial<ChildProfile>) => void;
  onComplete: () => void;
  onBack: () => void;
}) {
  const { language } = useLanguage();
  const raw = toLocale(language);
  const locale: Locale = raw === "uz" ? "uz" : raw === "ru" ? "ru" : "en";
  const dir = directionFor(raw);
  const c = emotionalBridgeCopy(locale);
  const reduced = useReducedMotion();

  const [idx, setIdx] = useState(entry === "end" ? childrenIn.length - 1 : 0);
  const [screen, setScreen] = useState<Screen>(entry === "end" ? "done" : "intro");

  const child = childrenIn[idx];
  const nextChild = childrenIn[idx + 1];
  const isLastChild = idx >= childrenIn.length - 1;
  const multi = childrenIn.length > 1;

  const bridge: Bridge = child.emotionalBridge ?? {};
  const setBridge = (p: Partial<Bridge>) =>
    onPatchChild(child.id, { emotionalBridge: { ...bridge, ...p } });

  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const t = window.setTimeout(
      () => headingRef.current?.focus({ preventScroll: true }),
      40,
    );
    return () => window.clearTimeout(t);
  }, [screen, idx]);

  // Reset the scroll position on every screen / child change (spec §8).
  useFlowScroll(`${idx}-${screen}`);

  function goNext() {
    switch (screen) {
      case "intro":
        setScreen("situation");
        break;
      case "situation":
        setScreen("experience");
        break;
      case "experience":
        setScreen("feeling");
        break;
      case "feeling":
        setScreen("sensitivity");
        break;
      case "sensitivity":
        setBridge({ done: true });
        setScreen("done");
        break;
      case "done":
        if (isLastChild) onComplete();
        else {
          setIdx((i) => i + 1);
          setScreen("intro");
        }
        break;
    }
  }
  function goPrev() {
    switch (screen) {
      case "intro":
        if (idx === 0) onBack();
        else {
          setIdx((i) => i - 1);
          setScreen("done");
        }
        break;
      case "situation":
        setScreen("intro");
        break;
      case "experience":
        setScreen("situation");
        break;
      case "feeling":
        setScreen("experience");
        break;
      case "sensitivity":
        setScreen("feeling");
        break;
      case "done":
        setScreen("sensitivity");
        break;
    }
  }

  const enter = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.28, ease: EASE },
      };

  const ctaLabel =
    screen === "done" && !isLastChild ? c.nextChildCta(nextChild.name) : c.continue;
  const name = child.name;

  return (
    <section
      dir={dir}
      data-order-flow=""
      className="mx-auto w-full max-w-container-content bg-surface-base px-6 pb-20 pt-9 sm:px-8 md:pb-28 md:pt-12 lg:px-16"
    >
      <div className="mx-auto max-w-xl">
        <div className="mb-14 flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={goPrev}
            className="inline-flex items-center gap-1.5 font-sans text-[13px] font-medium text-text-secondary outline-none transition-opacity hover:opacity-70 focus-visible:underline"
          >
            <ArrowLeft size={14} strokeWidth={1.75} className="rtl:-scale-x-100" />
            {c.back}
          </button>
          <JourneyProgress locale={raw} current={3} />
        </div>

        <p className="mb-5 font-sans text-[11.5px] font-semibold uppercase tracking-[0.18em] text-accent-primary">
          {c.eyebrow}
        </p>

        <motion.div key={`${idx}-${screen}`} {...enter}>
          {screen === "intro" &&
            (idx === 0 ? (
              <div>
                <Heading headingRef={headingRef}>{c.introHeading}</Heading>
                <div className="mt-5 space-y-4">
                  {c.introBody.map((p, i) => (
                    <p
                      key={i}
                      className="max-w-[56ch] font-sans text-[15px] leading-[1.72] text-text-secondary"
                    >
                      {p}
                    </p>
                  ))}
                </div>
                <div className="mt-9 border-t border-border-subtle pt-6">
                  <p className="max-w-[54ch] font-sans text-[12.5px] leading-[1.7] text-text-muted">
                    {c.trustNote}
                  </p>
                </div>
              </div>
            ) : (
              <Heading headingRef={headingRef}>{c.nextChildLead(name)}</Heading>
            ))}

          {/* Step 1 — VAZIYAT */}
          {screen === "situation" && (
            <div>
              <Heading headingRef={headingRef}>{c.s1Q(name, multi)}</Heading>
              <Help>{c.s1Help}</Help>
              <div className="mt-6">
                <textarea
                  rows={4}
                  value={bridge.privateContext ?? ""}
                  onChange={(e) => setBridge({ privateContext: e.target.value })}
                  placeholder={c.s1Placeholder(name)}
                  className={box}
                />
              </div>
              <SkipButton onClick={goNext}>{c.s1Skip}</SkipButton>
            </div>
          )}

          {/* Step 2 — the child's POSSIBLE experience (parent observation) */}
          {screen === "experience" && (
            <div>
              <Heading headingRef={headingRef}>{c.s2Q(name, multi)}</Heading>
              <Help>{c.s2Help}</Help>
              <div className="mt-6">
                <textarea
                  rows={4}
                  value={bridge.childExperience ?? ""}
                  onChange={(e) => setBridge({ childExperience: e.target.value })}
                  placeholder={c.s2Placeholder}
                  className={box}
                />
              </div>
              <SkipButton onClick={goNext}>{c.s2Skip}</SkipButton>
            </div>
          )}

          {/* Step 3 — desired emotional direction */}
          {screen === "feeling" && (
            <div>
              <Heading headingRef={headingRef}>{c.s3Q(name, multi)}</Heading>
              <Help>{c.s3Help}</Help>
              <div className="mt-6">
                <textarea
                  rows={4}
                  value={bridge.intendedFeeling ?? ""}
                  onChange={(e) => setBridge({ intendedFeeling: e.target.value })}
                  placeholder={c.s3Placeholder}
                  className={box}
                />
              </div>
            </div>
          )}

          {/* Step 4 — sensitivity / boundaries */}
          {screen === "sensitivity" && (
            <div>
              <Heading headingRef={headingRef}>{c.s4Q}</Heading>
              <Help>{c.s4Help}</Help>
              <div className="mt-6">
                <textarea
                  rows={4}
                  value={bridge.sensitivities ?? ""}
                  onChange={(e) => setBridge({ sensitivities: e.target.value })}
                  placeholder={c.s4Placeholder}
                  className={box}
                />
              </div>
              <SkipButton onClick={goNext}>{c.s4Skip}</SkipButton>
            </div>
          )}

          {screen === "done" && (
            <div>
              <Heading headingRef={headingRef}>{c.ackHeading}</Heading>
              <p className="mt-6 max-w-[52ch] border-t border-border-subtle pt-6 font-sans text-[13px] leading-[1.72] text-text-muted">
                {c.privacyExplanation}
              </p>
            </div>
          )}
        </motion.div>

        <div className="mt-12 flex items-center justify-end">
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-2 rounded-md bg-accent-primary px-6 py-3 font-sans text-[14px] font-medium text-white outline-none transition-opacity duration-150 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
          >
            {ctaLabel}
            <ArrowRight size={15} strokeWidth={1.75} className="rtl:-scale-x-100" />
          </button>
        </div>
      </div>
    </section>
  );
}

// ── shared pieces ────────────────────────────────────────────────

function Heading({
  children,
  headingRef,
}: {
  children: React.ReactNode;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <h2
      ref={headingRef}
      tabIndex={-1}
      style={{ outline: "none" }}
      className="font-display text-[22px] font-medium leading-[1.25] tracking-tight text-text-primary sm:text-[26px]"
    >
      {children}
    </h2>
  );
}

function Help({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 max-w-[54ch] font-sans text-[13px] leading-[1.6] text-text-secondary">
      {children}
    </p>
  );
}

function SkipButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={skipClass}>
      {children}
      <ArrowRight size={13} strokeWidth={1.75} className="rtl:-scale-x-100" />
    </button>
  );
}

const box =
  "w-full resize-none rounded-md border border-border-default bg-transparent px-4 py-3 font-sans text-[16px] leading-[1.6] text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent-primary";
const skipClass =
  "mt-3 inline-flex items-center gap-1.5 font-sans text-[13.5px] font-medium text-text-secondary outline-none transition-colors hover:text-text-primary focus-visible:underline";
