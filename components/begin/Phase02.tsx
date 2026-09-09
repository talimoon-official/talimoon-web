"use client";

/**
 * TALIMOON — ORDER — Phase 02: "The child's world".
 * ----------------------------------------------------------------
 * A short, warm conversation about each child in turn — every question
 * opens a NEW layer, never the last one in different words:
 *   QIZIQISHLARI (interests) → BIR OZ ANIQROQ (one deepened detail,
 *   optional) → SEVIMLI MASHG‘ULOTI (the activity they actually do)
 *   → ORZUSI (their dream, told directly — or, if there isn't one
 *   yet, the adult's own hope). Alongside it a quiet portrait —
 *   "FAYZBEKNING DUNYOSI" — fills in as the adult answers. Ends with a
 *   bridge toward the child's character.
 *
 * There is no per-child intro screen here any more (spec §02): the
 * merged "Demak, qahramonimiz — N yoshli X... Endi uning dunyosiga
 * yaqinlashamiz" milestone lives once, in Phase 01's completion scene,
 * and for every child after the first, the previous child's
 * "child-done" milestone already carries the same job — so `interests`
 * is this component's true first screen, not a second "let's begin".
 *
 * Child-centric: every answer is written straight onto the child by
 * stable id, so back-navigation and multi-child order never lose a
 * thing. Phase 03 (character) is NOT built here.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { toLocale, directionFor } from "@/lib/journey/types";
import {
  reconcileDream,
  type ChildProfile,
  type InterestAnswer,
} from "@/lib/order/types";
import { addCustomAnswer, removeAnswer, togglePreset } from "@/lib/order/selectableAnswers";
import {
  MAX_PRIMARY_INTERESTS,
  interestDetailPlaceholder,
  interestLabel,
  interestOptions,
  phase02Copy,
  type Locale,
} from "@/lib/order/phase02-copy";
import { useFlowScroll } from "@/lib/order/useFlowScroll";
import { JourneyProgress } from "./JourneyProgress";
import { ChildWorld } from "./ChildWorld";
import { SelectionTray } from "./SelectionTray";
import { CheckRow } from "./CheckRow";

type Screen = "interests" | "deepen" | "activity" | "dream" | "child-done";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Phase02({
  childrenIn,
  onPatchChild,
  onComplete,
  onBack,
}: {
  childrenIn: ChildProfile[];
  onPatchChild: (id: string, patch: Partial<ChildProfile>) => void;
  onComplete: () => void;
  onBack: () => void;
}) {
  const { language } = useLanguage();
  const rawLocale = toLocale(language);
  const locale: Locale = rawLocale === "uz" || rawLocale === "ru" ? rawLocale : "en";
  const dir = directionFor(toLocale(language));
  const c = phase02Copy(locale);
  const reduced = useReducedMotion();

  const [idx, setIdx] = useState(0);
  const [screen, setScreen] = useState<Screen>("interests");
  const [attempted, setAttempted] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  /** Purely a courtesy acknowledgment on the optional "deepen" screen —
   *  it gates nothing, so it isn't persisted onto the child. */
  const [detailsAcknowledged, setDetailsAcknowledged] = useState(false);

  const child = childrenIn[idx];
  const nextChild = childrenIn[idx + 1];
  const isLastChild = idx >= childrenIn.length - 1;

  const patch = (p: Partial<ChildProfile>) => onPatchChild(child.id, p);

  // Reset the scroll position on every scene change (spec §8).
  useFlowScroll(`${idx}-${screen}`);

  // ── focus the new question on every scene ──────────────────────
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const t = window.setTimeout(
      () => headingRef.current?.focus({ preventScroll: true }),
      40,
    );
    return () => window.clearTimeout(t);
    // `child.dreamStatus` re-focuses when the "dream" screen swaps
    // between the direct-dream input and the adult-hope branch.
  }, [screen, idx, child.dreamStatus]);

  // ── interests — preset and custom share one array (spec §01/§04) ─
  const interests = child.interests ?? [];
  const atLimit = interests.length >= MAX_PRIMARY_INTERESTS;
  const resolveInterestLabel = (id: string) => interestLabel(id, locale);

  function toggleInterest(key: string) {
    const next = togglePreset<InterestAnswer>(interests, key, MAX_PRIMARY_INTERESTS, (id) => ({
      id,
      source: "preset",
    }));
    if (next === null) return; // at the cap — the count line already explains why
    patch({ interests: next });
    setAttempted(false);
  }
  function addCustomInterest() {
    const next = addCustomAnswer<InterestAnswer>(
      interests,
      customDraft,
      MAX_PRIMARY_INTERESTS,
      (id) => ({ id, source: "custom" }),
      resolveInterestLabel,
    );
    if (next === null) return;
    patch({ interests: next });
    setCustomDraft("");
    setCustomOpen(false);
    setAttempted(false);
  }
  function removeInterest(id: string) {
    patch({ interests: removeAnswer(interests, id) });
  }
  function setInterestDetail(id: string, detail: string) {
    patch({ interests: interests.map((a) => (a.id === id ? { ...a, detail } : a)) });
  }

  // ── validity per scene ────────────────────────────────────────
  function validity(): { ok: boolean; error?: string } {
    switch (screen) {
      case "interests":
        return interests.length > 0
          ? { ok: true }
          : { ok: false, error: c.errInterests };
      case "activity":
        return child.noFavoriteActivity || (child.favoriteActivity ?? "").trim().length > 0
          ? { ok: true }
          : { ok: false, error: c.errActivity };
      case "dream":
        return child.dreamStatus === "not-yet"
          ? (child.adultHope ?? "").trim().length > 0
            ? { ok: true }
            : { ok: false, error: c.errAdultHope }
          : (child.childDream ?? "").trim().length > 0
            ? { ok: true }
            : { ok: false, error: c.errChildDream };
      default:
        return { ok: true };
    }
  }
  const v = validity();
  const showError = attempted && !v.ok ? v.error : undefined;

  function goNext() {
    if (!v.ok) {
      setAttempted(true);
      return;
    }
    setAttempted(false);
    switch (screen) {
      case "interests":
        setScreen("deepen");
        break;
      case "deepen":
        setScreen("activity");
        break;
      case "activity":
        setScreen("dream");
        break;
      case "dream":
        patch({ phase02Done: true });
        setScreen("child-done");
        break;
      case "child-done":
        if (isLastChild) {
          onComplete();
        } else {
          setIdx((i) => i + 1);
          setScreen("interests");
          setDetailsAcknowledged(false);
        }
        break;
    }
  }

  function goPrev() {
    setAttempted(false);
    switch (screen) {
      case "interests":
        if (idx === 0) onBack();
        else {
          setIdx((i) => i - 1);
          setScreen("child-done");
        }
        break;
      case "deepen":
        setScreen("interests");
        break;
      case "activity":
        setScreen("deepen");
        break;
      case "dream":
        setScreen("activity");
        break;
      case "child-done":
        setScreen("dream");
        break;
    }
  }

  const enter = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.26, ease: EASE },
      };

  const worldOnly = screen === "child-done";
  const ctaLabel =
    screen === "child-done"
      ? isLastChild
        ? c.continue
        : c.nextChildCta(nextChild.name)
      : c.continue;

  return (
    <section
      dir={dir}
      data-order-flow=""
      className="mx-auto w-full max-w-container-content bg-surface-base px-6 pb-16 pt-9 sm:px-8 md:pb-24 md:pt-12 lg:px-16"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={goPrev}
            className="inline-flex items-center gap-1.5 font-sans text-[13px] font-medium text-text-secondary outline-none transition-opacity hover:opacity-70 focus-visible:underline"
          >
            <ArrowLeft size={14} strokeWidth={1.75} className="rtl:-scale-x-100" />
            {c.back}
          </button>
          <JourneyProgress locale={toLocale(language)} current={1} />
        </div>

        <div
          className={
            worldOnly
              ? "mx-auto max-w-lg"
              : "grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-14"
          }
        >
          {/* Conversation */}
          {!worldOnly && (
            <div>
              <motion.div key={`${idx}-${screen}`} {...enter}>
                {screen === "interests" && (
                  <fieldset>
                    <EditorialLabel>{c.q1Label}</EditorialLabel>
                    <legend className="contents">
                      <Heading headingRef={headingRef}>{c.q1(child.name)}</Heading>
                    </legend>
                    <Help>{c.q1Help}</Help>

                    <div className="mt-6 flex flex-wrap gap-2.5">
                      {interestOptions(locale).map((opt) => {
                        const active = interests.some(
                          (a) => a.source === "preset" && a.id === opt.key,
                        );
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggleInterest(opt.key)}
                            className={choiceClass(active)}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4">
                      {!customOpen ? (
                        <button
                          type="button"
                          onClick={() => setCustomOpen(true)}
                          className={customToggleClass}
                        >
                          {c.customToggle}
                        </button>
                      ) : (
                        <div className="flex flex-wrap items-end gap-2">
                          <input
                            type="text"
                            autoFocus
                            value={customDraft}
                            onChange={(e) => setCustomDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addCustomInterest();
                              }
                            }}
                            placeholder={c.customPlaceholder}
                            className={
                              underline + " w-full max-w-[16rem] sm:w-auto sm:flex-1"
                            }
                          />
                          <button
                            type="button"
                            onClick={addCustomInterest}
                            className="rounded-md border border-border-strong px-3.5 py-2 font-sans text-[13.5px] font-medium text-text-primary hover:border-accent-primary"
                          >
                            {c.customAdd}
                          </button>
                        </div>
                      )}
                    </div>

                    <SelectionTray
                      title={c.trayTitle}
                      items={interests.map((a) => ({ id: a.id, label: resolveInterestLabel(a.id) }))}
                      onRemove={removeInterest}
                      removeLabel={c.removeAnswer}
                      reduced={!!reduced}
                    />
                    {interests.length > 0 && (
                      <p className="mt-3 font-sans text-[12.5px] font-medium text-text-secondary">
                        {atLimit
                          ? c.interestLimitNote
                          : c.selectionCount(interests.length, MAX_PRIMARY_INTERESTS)}
                      </p>
                    )}

                    <ErrorLine>{showError}</ErrorLine>
                  </fieldset>
                )}

                {screen === "deepen" && (
                  <div>
                    <EditorialLabel>{c.q2Label}</EditorialLabel>
                    <Heading headingRef={headingRef}>{c.q2(child.name)}</Heading>
                    <Help>{c.q2Help}</Help>
                    <Help>{c.q2Example}</Help>

                    <div className="mt-7 space-y-6">
                      {interests.map((a) => (
                        <div key={a.id}>
                          <p
                            className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted"
                          >
                            {resolveInterestLabel(a.id)}
                          </p>
                          <p className="mt-1.5 font-sans text-[14.5px] font-medium text-text-primary">
                            {c.q2ItemQuestion(child.name)}
                          </p>
                          <div className="mt-2.5">
                            <input
                              type="text"
                              value={a.detail ?? ""}
                              onChange={(e) => setInterestDetail(a.id, e.target.value)}
                              placeholder={interestDetailPlaceholder(a.id, locale, c.q2Placeholder)}
                              className={underline + " w-full"}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-7">
                      <CheckRow
                        id="p2-deepen-ack"
                        checked={detailsAcknowledged}
                        onChange={setDetailsAcknowledged}
                        label={c.q2SkipLabel}
                        support={c.q2SkipSupport}
                      />
                    </div>
                  </div>
                )}

                {screen === "activity" && (
                  <div>
                    <EditorialLabel>{c.q3Label}</EditorialLabel>
                    <Heading headingRef={headingRef}>{c.q3(child.name)}</Heading>
                    <Help>{c.q3Help}</Help>
                    <Help>{c.q3Example}</Help>
                    <div className="mt-6">
                      <textarea
                        rows={2}
                        value={child.favoriteActivity ?? ""}
                        onChange={(e) =>
                          patch({
                            favoriteActivity: e.target.value,
                            noFavoriteActivity: false,
                          })
                        }
                        placeholder={c.q3Placeholder}
                        className={box}
                        aria-invalid={showError ? true : undefined}
                      />
                    </div>
                    <div className="mt-3">
                      <CheckRow
                        id="p2-no-activity"
                        checked={!!child.noFavoriteActivity}
                        onChange={(checked) =>
                          patch({
                            noFavoriteActivity: checked,
                            ...(checked ? { favoriteActivity: "" } : {}),
                          })
                        }
                        label={c.q3None}
                      />
                    </div>
                    <ErrorLine>{showError}</ErrorLine>
                  </div>
                )}

                {screen === "dream" && (
                  <AnimatePresence mode="wait" initial={false}>
                    {child.dreamStatus === "not-yet" ? (
                      <motion.div
                        key="hope"
                        {...(reduced
                          ? {}
                          : {
                              initial: { opacity: 0, height: 0 },
                              animate: { opacity: 1, height: "auto" },
                              exit: { opacity: 0, height: 0 },
                              transition: { duration: 0.22, ease: EASE },
                            })}
                      >
                        {/* This is the ADULT's own hope — never phrased
                            as though the child chose it (spec §09). */}
                        <EditorialLabel>{c.pHope}</EditorialLabel>
                        <p className="mb-4 font-sans text-[15px] text-text-secondary">
                          {c.q4bTransition}
                        </p>
                        <Heading headingRef={headingRef}>{c.q4b(child.name)}</Heading>
                        <Help>{c.q4bHelp(child.name)}</Help>
                        <div className="mt-5">
                          <textarea
                            rows={3}
                            value={child.adultHope ?? ""}
                            onChange={(e) => patch({ adultHope: e.target.value })}
                            placeholder={c.q4bPlaceholder}
                            className={box}
                            aria-invalid={showError ? true : undefined}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            patch(reconcileDream("has-dream"));
                            setAttempted(false);
                          }}
                          className="mt-3 inline-flex items-center gap-1.5 font-sans text-[13.5px] font-medium text-text-secondary hover:text-text-primary"
                        >
                          {c.q4BackToDream}
                        </button>
                        <ErrorLine>{showError}</ErrorLine>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="dream"
                        {...(reduced
                          ? {}
                          : {
                              initial: { opacity: 0, height: 0 },
                              animate: { opacity: 1, height: "auto" },
                              exit: { opacity: 0, height: 0 },
                              transition: { duration: 0.22, ease: EASE },
                            })}
                      >
                        <EditorialLabel>{c.q4Label}</EditorialLabel>
                        <Heading headingRef={headingRef}>{c.q4(child.name)}</Heading>
                        <Help>{c.q4Help}</Help>
                        <div className="mt-6">
                          <textarea
                            rows={2}
                            value={child.childDream ?? ""}
                            onChange={(e) =>
                              patch({ ...reconcileDream("has-dream"), childDream: e.target.value })
                            }
                            placeholder={c.q4Placeholder}
                            className={box}
                            aria-invalid={showError ? true : undefined}
                          />
                        </div>
                        <div className="mt-4">
                          <CheckRow
                            id="p2-no-dream"
                            checked={false}
                            onChange={(checked) => {
                              if (!checked) return;
                              patch(reconcileDream("not-yet"));
                              setAttempted(false);
                            }}
                            label={c.q4NotYet}
                          />
                        </div>
                        <ErrorLine>{showError}</ErrorLine>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </motion.div>
            </div>
          )}

          {/* The portrait */}
          {worldOnly ? (
            // A quiet milestone beat between children / phases — an
            // affirming line and the "Davom etish" action only. The
            // full ChildWorld portrait that used to sit here was removed
            // (2026-09-09): it re-showed the exact profile fields the
            // customer had just entered, lengthening the flow with a
            // review card that adds nothing before the real final review
            // in PersonalizedBookOrderForm. No data or navigation
            // changed — only this presentational card is gone.
            <motion.div key={`done-${idx}`} {...enter}>
              <Heading headingRef={headingRef} size="xl">
                {isLastChild
                  ? c.milestoneHeading(child.name)
                  : c.nextChildLead(child.name)}
              </Heading>
              <Supporting>
                {isLastChild
                  ? c.milestoneBridge(child.name)
                  : c.nextChildBridge(nextChild.name)}
              </Supporting>
            </motion.div>
          ) : (
            <aside className="lg:sticky lg:top-[100px] lg:self-start">
              <ChildWorld
                child={child}
                locale={locale}
                variant={"aside"}
              />
            </aside>
          )}
        </div>

        <div
          className={[
            "mx-auto flex max-w-5xl items-center justify-end",
            worldOnly ? "mt-12" : "mt-10",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={goNext}
            aria-disabled={!v.ok || undefined}
            className={[
              "inline-flex items-center gap-2 rounded-md bg-accent-primary px-6 py-3 font-sans text-[14px] font-medium text-white outline-none transition-opacity duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary",
              v.ok ? "opacity-100 hover:opacity-90" : "opacity-40",
            ].join(" ")}
          >
            {ctaLabel}
            <ArrowRight size={15} strokeWidth={1.75} className="rtl:-scale-x-100" />
          </button>
        </div>

        {/* compact portrait on mobile, under the interaction */}
        {!worldOnly && (
          <div className="mt-8 lg:hidden">
            <ChildWorld child={child} locale={locale} variant="compact" />
          </div>
        )}
      </div>
    </section>
  );
}

// ── shared pieces ────────────────────────────────────────────────

function Heading({
  children,
  headingRef,
  size = "lg",
}: {
  children: React.ReactNode;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  size?: "lg" | "xl";
}) {
  return (
    <h2
      ref={headingRef}
      tabIndex={-1}
      style={{ outline: "none" }}
      className={[
        "font-display font-medium leading-[1.18] tracking-tight text-text-primary",
        size === "xl" ? "text-[27px] sm:text-[32px]" : "text-[23px] sm:text-[27px]",
      ].join(" ")}
    >
      {children}
    </h2>
  );
}

function Supporting({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 max-w-[46ch] font-sans text-[14.5px] leading-[1.65] text-text-secondary">
      {children}
    </p>
  );
}

function Help({
  children,
  tone = "help",
}: {
  children: React.ReactNode;
  tone?: "help" | "hint";
}) {
  return (
    <p
      className={[
        "mt-3 max-w-[52ch] font-sans text-[13px] leading-[1.55]",
        tone === "hint" ? "text-accent-primary" : "text-text-secondary",
      ].join(" ")}
    >
      {children}
    </p>
  );
}

/** The small eyebrow naming exactly what a screen is asking about —
 *  QIZIQISHLARI / BIR OZ ANIQROQ / SEVIMLI MASHG‘ULOTI / ORZUSI / SIZNING
 *  TILAGINGIZ — so the user never has to interpret the question (spec's
 *  Core UX Law). */
function EditorialLabel({ children }: { children: string }) {
  return (
    <p className="mb-3 font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-accent-primary">
      {children}
    </p>
  );
}

function ErrorLine({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-3 font-sans text-[13px] text-state-error">
      {children}
    </p>
  );
}

const underline =
  "border-0 border-b border-border-strong bg-transparent px-0 py-2 font-sans text-[16px] text-text-primary outline-none placeholder:text-text-muted";

const box =
  "w-full resize-none rounded-md border border-border-default bg-transparent px-3.5 py-2.5 font-sans text-[16px] leading-[1.55] text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent-primary";

function choiceClass(active: boolean): string {
  return [
    "min-h-[44px] rounded-md border px-4 font-sans text-[14px] font-medium outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary",
    active
      ? "border-accent-primary bg-accent-primary/[0.08] font-semibold text-text-primary"
      : "border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary",
  ].join(" ");
}

const customToggleClass =
  "inline-flex items-center gap-1.5 font-sans text-[13.5px] font-medium text-text-secondary underline decoration-border-strong underline-offset-4 hover:text-text-primary";
