"use client";

/**
 * TALIMOON — ORDER — Phase 03: "The child's character".
 * ----------------------------------------------------------------
 * Never "what is wrong with this child". Per child: what the adult
 * appreciates → a real moment it shows → ONE behaviour they'd gently
 * like to support (or none) → when it usually appears → the values
 * the story should strengthen. A behaviour is described, the child is
 * never labelled; TALIMOON gathers observations, it does not diagnose.
 *
 * The portrait gains a "FAYZBEKNING XARAKTERI" layer. Child-centric,
 * UZ + EN. Later phases are NOT built here.
 */

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { toLocale, directionFor } from "@/lib/journey/types";
import {
  qualityDetailPending,
  reconcileGrowth,
  setGrowthItemContext,
  setQualityDetail,
  type ChildProfile,
  type GrowthBehaviorAnswer,
  type QualityAnswer,
} from "@/lib/order/types";
import { addCustomAnswer, removeAnswer, togglePreset } from "@/lib/order/selectableAnswers";
import {
  MAX_GROWTH_BEHAVIORS,
  MAX_QUALITIES,
  MAX_VALUES,
  growthFull,
  growthOptions,
  phase03Copy,
  qualityDetailHelper,
  qualityDetailPrompt,
  qualityLabel,
  qualityOptions,
  valueOptions,
  type Locale,
} from "@/lib/order/phase03-copy";
import { useFlowScroll } from "@/lib/order/useFlowScroll";
import { JourneyProgress } from "./JourneyProgress";
import { ChildWorld } from "./ChildWorld";
import { SelectionTray } from "./SelectionTray";
import { CheckRow } from "./CheckRow";

type Screen =
  | "intro"
  | "qualities"
  | "example"
  | "growth"
  | "context"
  | "values"
  | "child-done";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Phase03({
  childrenIn,
  onPatchChild,
  onComplete,
  onBack,
  entry = "start",
}: {
  childrenIn: ChildProfile[];
  onPatchChild: (id: string, patch: Partial<ChildProfile>) => void;
  onComplete: () => void;
  onBack: () => void;
  /** "end" when the customer steps BACK into Phase 03 from the first
   *  wizard step — land on the last child's completion screen so Back
   *  really is one screen (spec §03), not a jump to the phase start. */
  entry?: "start" | "end";
}) {
  const { language } = useLanguage();
  const rawLocale = toLocale(language);
  const locale: Locale = rawLocale === "uz" || rawLocale === "ru" ? rawLocale : "en";
  const dir = directionFor(toLocale(language));
  const c = phase03Copy(locale);
  const reduced = useReducedMotion();

  const [idx, setIdx] = useState(entry === "end" ? childrenIn.length - 1 : 0);
  const [screen, setScreen] = useState<Screen>(entry === "end" ? "child-done" : "intro");
  const [attempted, setAttempted] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  const [growthCustomOpen, setGrowthCustomOpen] = useState(false);
  const [growthCustomDraft, setGrowthCustomDraft] = useState("");

  const child = childrenIn[idx];
  const nextChild = childrenIn[idx + 1];
  const isLastChild = idx >= childrenIn.length - 1;
  const patch = (p: Partial<ChildProfile>) => onPatchChild(child.id, p);

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

  // ── qualities — preset and custom share one array (spec §01/§20) ─
  const qualities = child.appreciatedQualities ?? [];
  const atQualityLimit = qualities.length >= MAX_QUALITIES;
  const resolveQualityLabel = (id: string) => qualityLabel(id, locale);

  function toggleQuality(key: string) {
    const next = togglePreset<QualityAnswer>(qualities, key, MAX_QUALITIES, (id) => ({
      id,
      source: "preset",
    }));
    if (next === null) return;
    patch({ appreciatedQualities: next });
    setAttempted(false);
  }
  function addCustomQuality() {
    const next = addCustomAnswer<QualityAnswer>(
      qualities,
      customDraft,
      MAX_QUALITIES,
      (id) => ({ id, source: "custom" }),
      resolveQualityLabel,
    );
    if (next === null) return;
    patch({ appreciatedQualities: next });
    setCustomDraft("");
    setCustomOpen(false);
    setAttempted(false);
  }
  function removeQuality(id: string) {
    patch({ appreciatedQualities: removeAnswer(qualities, id) });
  }
  /** Per-quality detail edits (spec §4) — detail ↔ "no example" are
   *  exclusive on that single quality, never applied across the set. */
  function setQualityItemDetail(id: string, detail: string) {
    patch({ appreciatedQualities: setQualityDetail(qualities, id, { detail }) });
  }
  function setQualityItemNoDetail(id: string, noDetail: boolean) {
    patch({ appreciatedQualities: setQualityDetail(qualities, id, { noDetail }) });
  }

  // ── values ────────────────────────────────────────────────────
  const values = child.desiredValues ?? [];
  const atValueLimit = values.length >= MAX_VALUES;
  function toggleValue(key: string) {
    if (values.includes(key)) {
      patch({ desiredValues: values.filter((v) => v !== key) });
      return;
    }
    if (atValueLimit) return;
    patch({ desiredValues: [...values, key] });
    setAttempted(false);
  }

  // ── growth behaviours — up to 3, preset and custom share one array;
  //    each carries its OWN optional context (spec §22–26) ──────────
  const growthBehaviors: GrowthBehaviorAnswer[] = child.growthBehaviors ?? [];
  const atGrowthLimit = growthBehaviors.length >= MAX_GROWTH_BEHAVIORS;
  const resolveGrowthLabel = (id: string) => growthFull(id, locale);

  function toggleGrowth(key: string) {
    const next = togglePreset<GrowthBehaviorAnswer>(
      growthBehaviors,
      key,
      MAX_GROWTH_BEHAVIORS,
      (id) => ({ id, source: "preset" }),
    );
    if (next === null) return;
    patch({ growthBehaviors: next, noGrowthArea: false });
    setAttempted(false);
  }
  function addCustomGrowth() {
    const next = addCustomAnswer<GrowthBehaviorAnswer>(
      growthBehaviors,
      growthCustomDraft,
      MAX_GROWTH_BEHAVIORS,
      (id) => ({ id, source: "custom" }),
      resolveGrowthLabel,
    );
    if (next === null) return;
    patch({ growthBehaviors: next, noGrowthArea: false });
    setGrowthCustomDraft("");
    setGrowthCustomOpen(false);
    setAttempted(false);
  }
  function removeGrowth(id: string) {
    patch({ growthBehaviors: removeAnswer(growthBehaviors, id) });
  }
  /** Per-behaviour context edits (spec §25) — context ↔ "no situation"
   *  are exclusive on that single item, never applied globally. */
  function setBehaviorContext(id: string, context: string) {
    patch({ growthBehaviors: setGrowthItemContext(growthBehaviors, id, { context }) });
  }
  function setBehaviorNoContext(id: string, noSpecificContext: boolean) {
    patch({
      growthBehaviors: setGrowthItemContext(growthBehaviors, id, { noSpecificContext }),
    });
  }
  const hasGrowth = !child.noGrowthArea && growthBehaviors.length > 0;

  function validity(): { ok: boolean; error?: string } {
    switch (screen) {
      case "qualities":
        return qualities.length > 0
          ? { ok: true }
          : { ok: false, error: c.errQualities };
      case "example":
        // Every selected quality needs either a written detail or the
        // explicit "no example" alternative — never a forced answer.
        return qualities.some(qualityDetailPending)
          ? { ok: false, error: c.errExample }
          : { ok: true };
      case "growth":
        return child.noGrowthArea || growthBehaviors.length > 0
          ? { ok: true }
          : { ok: false, error: c.errGrowth };
      case "values":
        return values.length > 0 ? { ok: true } : { ok: false, error: c.errValues };
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
      case "intro":
        setScreen("qualities");
        break;
      case "qualities":
        setScreen("example");
        break;
      case "example":
        setScreen("growth");
        break;
      case "growth":
        setScreen(hasGrowth ? "context" : "values");
        break;
      case "context":
        setScreen("values");
        break;
      case "values":
        patch({ phase03Done: true });
        setScreen("child-done");
        break;
      case "child-done":
        if (isLastChild) onComplete();
        else {
          setIdx((i) => i + 1);
          setScreen("intro");
        }
        break;
    }
  }
  function goPrev() {
    setAttempted(false);
    switch (screen) {
      case "intro":
        if (idx === 0) onBack();
        else {
          setIdx((i) => i - 1);
          setScreen("child-done");
        }
        break;
      case "qualities":
        setScreen("intro");
        break;
      case "example":
        setScreen("qualities");
        break;
      case "growth":
        setScreen("example");
        break;
      case "context":
        setScreen("growth");
        break;
      case "values":
        setScreen(hasGrowth ? "context" : "growth");
        break;
      case "child-done":
        setScreen("values");
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
          <JourneyProgress locale={toLocale(language)} current={2} />
        </div>

        <div
          className={
            worldOnly
              ? "mx-auto max-w-lg"
              : "grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-14"
          }
        >
          {!worldOnly && (
            <div>
              <motion.div key={`${idx}-${screen}`} {...enter}>
                {screen === "intro" && (
                  <div>
                    <p className="mb-3 font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-accent-primary">
                      {c.charLabel(child.name)}
                    </p>
                    <Heading headingRef={headingRef}>{c.introLead(child.name)}</Heading>
                    <Supporting>{c.introSupport}</Supporting>
                  </div>
                )}

                {screen === "qualities" && (
                  <fieldset>
                    <legend className="contents">
                      <Heading headingRef={headingRef}>{c.q1(child.name)}</Heading>
                    </legend>
                    <Help>{c.q1Help}</Help>
                    <div className="mt-6 flex flex-wrap gap-2.5">
                      {qualityOptions(locale).map((opt) => {
                        const active = qualities.some(
                          (a) => a.source === "preset" && a.id === opt.key,
                        );
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggleQuality(opt.key)}
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
                                addCustomQuality();
                              }
                            }}
                            placeholder={c.customPlaceholder}
                            className={underline + " w-full max-w-[16rem] sm:w-auto sm:flex-1"}
                          />
                          <button
                            type="button"
                            onClick={addCustomQuality}
                            className="rounded-md border border-border-strong px-3.5 py-2 font-sans text-[13.5px] font-medium text-text-primary hover:border-accent-primary"
                          >
                            {c.customAdd}
                          </button>
                        </div>
                      )}
                    </div>

                    <SelectionTray
                      title={c.trayTitle}
                      items={qualities.map((a) => ({ id: a.id, label: resolveQualityLabel(a.id) }))}
                      onRemove={removeQuality}
                      removeLabel={c.removeAnswer}
                      reduced={!!reduced}
                    />
                    {qualities.length > 0 && (
                      <p className="mt-3 font-sans text-[12.5px] font-medium text-text-secondary">
                        {atQualityLimit
                          ? c.limitNote(MAX_QUALITIES)
                          : c.selectionCount(qualities.length, MAX_QUALITIES)}
                      </p>
                    )}

                    <ErrorLine>{showError}</ErrorLine>
                  </fieldset>
                )}

                {screen === "example" && (
                  <div>
                    <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-accent-primary">
                      {c.q2SectionLabel}
                    </p>
                    <Heading headingRef={headingRef}>{c.q2Intro}</Heading>

                    {/* One block PER chosen quality — its own tailored
                        question, its own helper, its own textarea and its
                        own "no example" alternative. A detail typed here
                        can only ever attach to THIS quality (spec §4). */}
                    <div className="mt-7 space-y-7">
                      {qualities.map((a) => (
                        <div
                          key={a.id}
                          className="rounded-md border border-border-subtle bg-surface-raised/40 px-4 py-4"
                        >
                          <p className="font-display text-[16px] leading-[1.35] text-text-primary">
                            {resolveQualityLabel(a.id)}
                          </p>
                          <p className="mt-2.5 font-sans text-[13.5px] font-medium text-text-secondary">
                            {qualityDetailPrompt(a.id, child.name, locale)}
                          </p>
                          <p className="mt-1 font-sans text-[12px] leading-[1.5] text-text-muted">
                            {qualityDetailHelper(a.id, locale)}
                          </p>
                          <div className="mt-2.5">
                            <textarea
                              rows={2}
                              value={a.detail ?? ""}
                              onChange={(e) => setQualityItemDetail(a.id, e.target.value)}
                              placeholder={c.q2Placeholder}
                              className={box}
                            />
                          </div>
                          <div className="mt-3">
                            <CheckRow
                              id={`p3-quality-none-${a.id}`}
                              checked={!!a.noDetail}
                              onChange={(checked) => setQualityItemNoDetail(a.id, checked)}
                              label={c.q2ItemNone}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <ErrorLine>{showError}</ErrorLine>
                  </div>
                )}

                {screen === "growth" && (
                  <fieldset>
                    <legend className="contents">
                      <Heading headingRef={headingRef}>{c.q3(child.name)}</Heading>
                    </legend>
                    <Help>{c.q3Help}</Help>
                    <div className="mt-6 flex flex-col gap-2">
                      {growthOptions(locale).map((opt) => {
                        const active = growthBehaviors.some(
                          (a) => a.source === "preset" && a.id === opt.key,
                        );
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggleGrowth(opt.key)}
                            className={rowChoiceClass(active)}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4">
                      {!growthCustomOpen ? (
                        <button
                          type="button"
                          onClick={() => setGrowthCustomOpen(true)}
                          className={customToggleClass}
                        >
                          {c.q3CustomToggle}
                        </button>
                      ) : (
                        <div className="flex flex-wrap items-end gap-2">
                          <input
                            type="text"
                            autoFocus
                            value={growthCustomDraft}
                            onChange={(e) => setGrowthCustomDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addCustomGrowth();
                              }
                            }}
                            placeholder={c.q3CustomPlaceholder}
                            className={underline + " w-full max-w-[18rem] sm:w-auto sm:flex-1"}
                          />
                          <button
                            type="button"
                            onClick={addCustomGrowth}
                            className="rounded-md border border-border-strong px-3.5 py-2 font-sans text-[13.5px] font-medium text-text-primary hover:border-accent-primary"
                          >
                            {c.customAdd}
                          </button>
                        </div>
                      )}
                      <p className="mt-1.5 font-sans text-[12px] text-text-muted">{c.q3CustomHint}</p>
                    </div>

                    <SelectionTray
                      title={c.trayTitle}
                      items={growthBehaviors.map((a) => ({ id: a.id, label: resolveGrowthLabel(a.id) }))}
                      onRemove={removeGrowth}
                      removeLabel={c.removeAnswer}
                      reduced={!!reduced}
                    />
                    {growthBehaviors.length > 0 && !child.noGrowthArea && (
                      <p className="mt-3 font-sans text-[12.5px] font-medium text-text-secondary">
                        {atGrowthLimit
                          ? c.limitNote(MAX_GROWTH_BEHAVIORS)
                          : c.selectionCount(growthBehaviors.length, MAX_GROWTH_BEHAVIORS)}
                      </p>
                    )}

                    {/* The exclusive alternative — set apart from the
                        behaviour list so it never reads as one more of
                        them (spec §19–20). */}
                    <div className="mt-6 border-t border-border-subtle pt-5">
                      <CheckRow
                        id="p3-no-growth"
                        checked={!!child.noGrowthArea}
                        onChange={(checked) => patch(reconcileGrowth(!checked))}
                        label={c.q3None}
                        support={c.q3NoneHelp}
                      />
                    </div>
                    <ErrorLine>{showError}</ErrorLine>
                  </fieldset>
                )}

                {screen === "context" && (
                  <div>
                    <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-accent-primary">
                      {c.q4SectionLabel}
                    </p>
                    <Heading headingRef={headingRef}>{c.q4Intro}</Heading>

                    {/* One block PER chosen behaviour — its own textarea
                        and its own "no situation" toggle. A context
                        typed here can only ever attach to THIS behaviour
                        (spec §22–26). */}
                    <div className="mt-7 space-y-7">
                      {growthBehaviors.map((a) => (
                        <div
                          key={a.id}
                          className="rounded-md border border-border-subtle bg-surface-raised/40 px-4 py-4"
                        >
                          <p className="font-display text-[16px] leading-[1.35] text-text-primary">
                            {resolveGrowthLabel(a.id)}
                          </p>
                          <p className="mt-2.5 font-sans text-[13.5px] font-medium text-text-secondary">
                            {c.q4ItemQuestion}
                          </p>
                          <div className="mt-2.5">
                            <textarea
                              rows={2}
                              value={a.context ?? ""}
                              onChange={(e) => setBehaviorContext(a.id, e.target.value)}
                              placeholder={c.q4ItemPlaceholder}
                              className={box}
                            />
                          </div>
                          <div className="mt-3">
                            <CheckRow
                              id={`p3-no-context-${a.id}`}
                              checked={!!a.noSpecificContext}
                              onChange={(checked) => setBehaviorNoContext(a.id, checked)}
                              label={c.q4ItemNone}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {screen === "values" && (
                  <fieldset>
                    <legend className="contents">
                      <Heading headingRef={headingRef}>{c.q5(child.name)}</Heading>
                    </legend>
                    <Help>{c.q5Help}</Help>
                    <div className="mt-6 flex flex-wrap gap-2.5">
                      {valueOptions(locale).map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          aria-pressed={values.includes(opt.key)}
                          onClick={() => toggleValue(opt.key)}
                          className={choiceClass(values.includes(opt.key))}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {values.length > 0 && (
                      <p className="mt-3 font-sans text-[12.5px] font-medium text-text-secondary">
                        {atValueLimit
                          ? c.limitNote(MAX_VALUES)
                          : c.selectionCount(values.length, MAX_VALUES)}
                      </p>
                    )}
                    <ErrorLine>{showError}</ErrorLine>
                  </fieldset>
                )}
              </motion.div>
            </div>
          )}

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
                {isLastChild ? c.milestoneHeading(child.name) : c.nextChildLead(child.name)}
              </Heading>
              <Supporting>
                {isLastChild ? c.milestoneBridge : c.nextChildBridge(nextChild.name)}
              </Supporting>
            </motion.div>
          ) : (
            <aside className="lg:sticky lg:top-[100px] lg:self-start">
              <ChildWorld child={child} locale={locale} variant="aside" phase="character" />
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

        {!worldOnly && (
          <div className="mt-8 lg:hidden">
            <ChildWorld child={child} locale={locale} variant="compact" phase="character" />
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
function Help({ children, tone = "help" }: { children: React.ReactNode; tone?: "help" | "hint" }) {
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
const customToggleClass =
  "inline-flex items-center gap-1.5 font-sans text-[13.5px] font-medium text-text-secondary underline decoration-border-strong underline-offset-4 hover:text-text-primary";

function choiceClass(active: boolean): string {
  return [
    "min-h-[44px] rounded-md border px-4 font-sans text-[14px] font-medium outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary",
    active
      ? "border-accent-primary bg-accent-primary/[0.08] font-semibold text-text-primary"
      : "border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary",
  ].join(" ");
}
function rowChoiceClass(active: boolean): string {
  return [
    "flex w-full items-center rounded-md border px-4 py-3 text-start font-sans text-[15px] outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary",
    active
      ? "border-accent-primary bg-accent-primary/[0.08] font-semibold text-text-primary"
      : "border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary",
  ].join(" ");
}
