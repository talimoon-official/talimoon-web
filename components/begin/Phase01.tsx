"use client";

/**
 * TALIMOON — ORDER — Phase 01: "Siz bilan tanishamiz".
 * ----------------------------------------------------------------
 * The opening chapter of the conversational ordering experience. Not
 * a form: TALIMOON greets the customer, learns how to address them
 * respectfully, then their relationship to the child, then meets the
 * young protagonists one by one — and gently hands off to the child's
 * world. Never assumes "parent". Always the respectful "Siz".
 *
 * Scenes (spec §9 — one visual language, a different rhythm each):
 *   identity     — atmospheric welcome + honorific + name
 *   relationship — a warm acknowledgement, then a typographic list
 *   count        — a tactile number choice (nothing preselected)
 *   child · N    — "meeting a character": the name becomes the title
 *   completion   — a quiet editorial milestone
 *
 * Emits `Phase01Result`; `onBack` returns to the product picker.
 * Logistics (phone / region / city) are NOT collected here.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { FlowBackButton } from "./FlowBack";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { toLocale, directionFor, type Locale } from "@/lib/journey/types";
import {
  MAX_MAIN_CHILDREN,
  QUICK_AGES,
  AGE_MIN,
  AGE_MAX,
  emptyChild,
  isValidAge,
  type ChildProfile,
  type Phase01Result,
} from "@/lib/order/types";
import {
  honorificOptions,
  relationshipOptions,
  formatRespectfulName,
  type Honorific,
  type RecipientRelationship,
  type RelationshipType,
} from "@/lib/order/relationship";
import { phase01Copy, type Phase01Copy } from "@/lib/order/phase01-copy";
import { useFlowScroll } from "@/lib/order/useFlowScroll";
import { JourneyProgress } from "./JourneyProgress";

type Screen =
  | { kind: "identity" }
  | { kind: "relationship" }
  | { kind: "count" }
  | { kind: "child"; index: number }
  /** Only visited when 2–3 relationship types were chosen (spec §01). */
  | { kind: "child-relationship"; index: number }
  | { kind: "completion" };

/** Highest relationship types a single order may mix (spec §01). */
const MAX_RELATIONSHIP_TYPES = 3;

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Phase01({
  onBack,
  onComplete,
  initialChildCount,
  initial,
}: {
  onBack: () => void;
  onComplete: (result: Phase01Result) => void;
  initialChildCount?: number;
  initial?: {
    ordererHonorific?: Honorific | null;
    ordererName?: string;
    recipientRelationship?: RecipientRelationship;
    children?: ChildProfile[];
  };
}) {
  const { language } = useLanguage();
  const locale = toLocale(language);
  const dir = directionFor(locale);
  const c = phase01Copy(locale);
  const reduced = useReducedMotion();

  const resuming = Boolean(initial?.children && initial.children.length > 0);
  const seededCount = initial?.children?.length ?? initialChildCount ?? null;

  const [screen, setScreen] = useState<Screen>(
    resuming ? { kind: "completion" } : { kind: "identity" },
  );
  const [attempted, setAttempted] = useState(false);

  const [honorific, setHonorific] = useState<Honorific | null>(
    initial?.ordererHonorific ?? null,
  );
  const [ordererName, setOrdererName] = useState(initial?.ordererName ?? "");
  // Real families are often mixed (spec §01): up to 3 relationship types,
  // one per some subset of children. Resuming prefers whatever distinct
  // types the children already carry over the single order-level default.
  const [relTypes, setRelTypes] = useState<RelationshipType[]>(() => {
    const fromChildren = Array.from(
      new Set(
        (initial?.children ?? [])
          .map((ch) => ch.relationship?.type)
          .filter((t): t is RelationshipType => !!t),
      ),
    );
    if (fromChildren.length > 0) return fromChildren.slice(0, MAX_RELATIONSHIP_TYPES);
    return initial?.recipientRelationship?.type ? [initial.recipientRelationship.type] : [];
  });
  const [customLabel, setCustomLabel] = useState(
    initial?.recipientRelationship?.customLabel ?? "",
  );
  const [count, setCount] = useState<number | null>(
    seededCount != null
      ? Math.min(Math.max(seededCount, 1), MAX_MAIN_CHILDREN)
      : null,
  );
  const [pool, setPool] = useState<ChildProfile[]>(() =>
    initial?.children && initial.children.length > 0
      ? initial.children.slice(0, MAX_MAIN_CHILDREN)
      : Array.from(
          { length: Math.max(seededCount ?? 1, 1) },
          emptyChild,
        ),
  );

  const children = useMemo(
    () => pool.slice(0, count ?? 0),
    [pool, count],
  );
  // Used only to phrase the count / child-name-prompt copy. A single
  // chosen type gets its real kinship noun; 2–3 mixed types fall back to
  // "other"'s neutral phrasing — no single noun could fit every child.
  const rel: RecipientRelationship = useMemo(() => {
    if (relTypes.length === 1) {
      const t = relTypes[0];
      return {
        type: t,
        ...(t === "other" && customLabel.trim() ? { customLabel: customLabel.trim() } : {}),
      };
    }
    return { type: "other" };
  }, [relTypes, customLabel]);
  const respectfulName = formatRespectfulName(locale, honorific, ordererName);

  function ensurePool(n: number) {
    setPool((prev) =>
      prev.length >= n
        ? prev
        : [...prev, ...Array.from({ length: n - prev.length }, emptyChild)],
    );
  }
  function patchChild(index: number, patch: Partial<ChildProfile>) {
    setPool((prev) => {
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  // Move focus to the new question on every scene change (SR announce).
  const headingRef = useRef<HTMLHeadingElement>(null);
  const childIdx =
    screen.kind === "child" || screen.kind === "child-relationship" ? screen.index : -1;
  useEffect(() => {
    // `preventScroll` so a scene change never nudges the page scroll
    // (which would flip the site's scroll-driven navbar mid-flow).
    const id = window.setTimeout(
      () => headingRef.current?.focus({ preventScroll: true }),
      40,
    );
    return () => window.clearTimeout(id);
  }, [screen.kind, childIdx]);

  function validity(): { ok: boolean; error?: string } {
    switch (screen.kind) {
      case "identity":
        if (!honorific) return { ok: false, error: c.errHonorific };
        return ordererName.trim().length >= 2
          ? { ok: true }
          : { ok: false, error: c.errName };
      case "relationship":
        if (relTypes.length < 1) return { ok: false, error: c.errRelationship };
        if (relTypes.includes("other") && customLabel.trim().length < 2)
          return { ok: false, error: c.errCustomLabel };
        return { ok: true };
      case "count":
        return count != null && count >= 1 && count <= MAX_MAIN_CHILDREN
          ? { ok: true }
          : { ok: false };
      case "child": {
        const child = children[screen.index];
        if (!child || child.name.trim().length < 1)
          return { ok: false, error: c.errChildName };
        if (child.age == null) return { ok: false, error: c.errAge };
        if (!isValidAge(child.age)) return { ok: false, error: c.errAgeRange };
        return { ok: true };
      }
      case "child-relationship": {
        const t = children[screen.index]?.relationship?.type;
        return t && relTypes.includes(t)
          ? { ok: true }
          : { ok: false, error: c.errRelationship };
      }
      case "completion":
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
    switch (screen.kind) {
      case "identity":
        setScreen({ kind: "relationship" });
        break;
      case "relationship":
        setScreen({ kind: "count" });
        break;
      case "count":
        ensurePool(count ?? 1);
        setScreen({ kind: "child", index: 0 });
        break;
      case "child":
        setScreen(
          screen.index + 1 < (count ?? 1)
            ? { kind: "child", index: screen.index + 1 }
            : relTypes.length > 1
              ? { kind: "child-relationship", index: 0 }
              : { kind: "completion" },
        );
        break;
      case "child-relationship":
        setScreen(
          screen.index + 1 < (count ?? 1)
            ? { kind: "child-relationship", index: screen.index + 1 }
            : { kind: "completion" },
        );
        break;
      case "completion": {
        const primaryType = relTypes[0] ?? "parent";
        const primaryCustom =
          primaryType === "other" && customLabel.trim()
            ? customLabel.trim().replace(/\s+/g, " ")
            : undefined;
        onComplete({
          ordererHonorific: honorific,
          ordererName: ordererName.trim().replace(/\s+/g, " "),
          recipientRelationship: {
            type: primaryType,
            ...(primaryCustom ? { customLabel: primaryCustom } : {}),
          },
          children: children.map((ch) => ({
            ...ch,
            name: ch.name.trim().replace(/\s+/g, " "),
            // A single chosen type always applies to everyone — even if
            // stale per-child data lingers from a since-abandoned mixed
            // selection, so the UI and the stored state never disagree
            // (spec §18). With 2–3 types, each child already carries its
            // own answer from the child-relationship screens.
            relationship:
              relTypes.length <= 1
                ? { type: primaryType, ...(primaryCustom ? { customLabel: primaryCustom } : {}) }
                : ch.relationship,
          })),
        });
        break;
      }
    }
  }

  function goPrev() {
    setAttempted(false);
    switch (screen.kind) {
      case "identity":
        onBack();
        break;
      case "relationship":
        setScreen({ kind: "identity" });
        break;
      case "count":
        setScreen({ kind: "relationship" });
        break;
      case "child":
        setScreen(
          screen.index === 0
            ? { kind: "count" }
            : { kind: "child", index: screen.index - 1 },
        );
        break;
      case "child-relationship":
        setScreen(
          screen.index === 0
            ? { kind: "child", index: (count ?? 1) - 1 }
            : { kind: "child-relationship", index: screen.index - 1 },
        );
        break;
      case "completion":
        setScreen(
          relTypes.length > 1
            ? { kind: "child-relationship", index: (count ?? 1) - 1 }
            : { kind: "child", index: (count ?? 1) - 1 },
        );
        break;
    }
  }

  const enterAnim = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.28, ease: EASE },
      };
  const screenKey =
    screen.kind === "child" || screen.kind === "child-relationship"
      ? `${screen.kind}-${screen.index}`
      : screen.kind;
  // Reset the scroll position on every scene change (spec §8).
  useFlowScroll(screenKey);
  const ctaLabel =
    screen.kind === "completion"
      ? c.transitionCta(children[0]?.name.trim() || "")
      : c.continue;

  return (
    <section
      dir={dir}
      data-order-flow=""
      className="mx-auto w-full max-w-container-content bg-surface-base px-6 pb-16 pt-9 sm:px-8 md:pb-24 md:pt-12 lg:px-16"
    >
      <div className="mx-auto max-w-md">
        <div className="mb-10 flex items-start justify-between gap-4">
          <FlowBackButton onBack={goPrev} label={c.back} />
          <JourneyProgress locale={locale} current={0} />
        </div>

        <motion.div key={screenKey} {...enterAnim}>
          {screen.kind === "identity" && (
            <SceneIdentity
              c={c}
              locale={locale}
              honorific={honorific}
              onHonorific={(h) => {
                setHonorific(h);
                setAttempted(false);
              }}
              name={ordererName}
              onName={setOrdererName}
              onEnter={goNext}
              headingRef={headingRef}
              error={showError}
            />
          )}

          {screen.kind === "relationship" && (
            <SceneRelationship
              c={c}
              locale={locale}
              ackName={respectfulName}
              value={relTypes}
              onToggle={(t) => {
                setRelTypes((prev) =>
                  prev.includes(t)
                    ? prev.filter((v) => v !== t)
                    : prev.length < MAX_RELATIONSHIP_TYPES
                      ? [...prev, t]
                      : prev,
                );
                setAttempted(false);
              }}
              customLabel={customLabel}
              onCustomLabel={setCustomLabel}
              headingRef={headingRef}
              error={showError}
            />
          )}

          {screen.kind === "count" && (
            <SceneCount
              c={c}
              rel={rel}
              value={count}
              onSelect={(n) => {
                setCount(n);
                ensurePool(n);
                setAttempted(false);
              }}
              headingRef={headingRef}
            />
          )}

          {screen.kind === "child" && (
            <SceneChild
              key={screen.index}
              c={c}
              rel={rel}
              index={screen.index}
              total={count ?? 1}
              child={children[screen.index]}
              onName={(nm) => patchChild(screen.index, { name: nm })}
              onAge={(age) => patchChild(screen.index, { age })}
              onEnter={goNext}
              headingRef={headingRef}
              error={showError}
            />
          )}

          {screen.kind === "child-relationship" && (
            <SceneChildRelationship
              key={screen.index}
              c={c}
              locale={locale}
              relTypes={relTypes}
              child={children[screen.index]}
              value={children[screen.index]?.relationship?.type ?? null}
              onSelect={(t) => {
                patchChild(screen.index, {
                  relationship: {
                    type: t,
                    ...(t === "other" && customLabel.trim()
                      ? { customLabel: customLabel.trim() }
                      : {}),
                  },
                });
                setAttempted(false);
              }}
              headingRef={headingRef}
              error={showError}
            />
          )}

          {screen.kind === "completion" && (
            <SceneCompletion c={c} total={count ?? 1} kids={children} headingRef={headingRef} />
          )}
        </motion.div>

        <div
          className={[
            "flex items-center justify-end",
            screen.kind === "completion" ? "mt-12" : "mt-10",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={goNext}
            // Kept clickable even when incomplete so tapping it surfaces
            // the gentle inline reason; it just reads as not-yet-ready.
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
      </div>
    </section>
  );
}

// ── Shared pieces ────────────────────────────────────────────────

/** The scene's focusable heading. Focused programmatically on every
 *  scene change so a screen reader announces the new question; it is
 *  not a tab stop, so its visible focus ring is suppressed. */
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
      // The site-wide `:focus-visible` ring lives outside any cascade
      // layer, so a Tailwind utility can't override it — the inline
      // `outline: none` is what actually removes it here. This heading
      // is focused only so a screen reader reads the new question; it
      // is not a tab stop, so it must not look like a text field.
      style={{ outline: "none" }}
      className={[
        "font-display font-medium leading-[1.18] tracking-tight text-text-primary",
        size === "xl"
          ? "text-[30px] sm:text-[36px]"
          : "text-[25px] sm:text-[29px]",
      ].join(" ")}
    >
      {children}
    </h2>
  );
}

function Supporting({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 max-w-[42ch] font-sans text-[14.5px] leading-[1.65] text-text-secondary">
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

const textInputClass =
  "w-full border-0 border-b border-border-strong bg-transparent px-0 py-2.5 font-sans text-[17px] text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent-primary";

// ── Scene: identity (welcome + honorific + name) ─────────────────

function SceneIdentity({
  c,
  locale,
  honorific,
  onHonorific,
  name,
  onName,
  onEnter,
  headingRef,
  error,
}: {
  c: Phase01Copy;
  locale: Locale;
  honorific: Honorific | null;
  onHonorific: (h: Honorific) => void;
  name: string;
  onName: (v: string) => void;
  onEnter: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  error?: string;
}) {
  return (
    <div>
      <Heading headingRef={headingRef} size="xl">
        {c.greetingPrimary}
      </Heading>
      <p className="mt-3 font-sans text-[15px] text-text-secondary">
        {c.greetingWelcome}
      </p>

      <span
        aria-hidden="true"
        className="mt-7 block h-px w-10 bg-accent-primary/60"
      />
      <p className="mt-5 font-display text-[18px] font-medium text-text-primary">
        {c.greetingLead}
      </p>

      <fieldset className="mt-9">
        <legend className="mb-3 font-sans text-[13px] font-medium text-text-primary">
          {c.addressQuestion}
        </legend>
        <div className="flex gap-2.5">
          {honorificOptions(locale).map((opt) => {
            const active = honorific === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() => onHonorific(opt.value)}
                className={[
                  "min-h-[44px] rounded-md border px-5 font-sans text-[14.5px] font-medium outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary",
                  active
                    ? "border-accent-primary bg-accent-primary/[0.08] text-text-primary"
                    : "border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary",
                ].join(" ")}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <label htmlFor="p1-name" className="sr-only">
            {c.addressQuestion}
          </label>
          <input
            id="p1-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => onName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onEnter();
              }
            }}
            placeholder={c.namePlaceholder}
            className={textInputClass}
            aria-invalid={error === c.errName ? true : undefined}
          />
        </div>
      </fieldset>
      <ErrorLine>{error}</ErrorLine>
    </div>
  );
}

// ── Scene: relationship (acknowledgement is the lead-in) ─────────

function SceneRelationship({
  c,
  locale,
  ackName,
  value,
  onToggle,
  customLabel,
  onCustomLabel,
  headingRef,
  error,
}: {
  c: Phase01Copy;
  locale: Locale;
  ackName: string;
  /** Up to 3 selected types — real families are often mixed (spec §01). */
  value: RelationshipType[];
  onToggle: (t: RelationshipType) => void;
  customLabel: string;
  onCustomLabel: (v: string) => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  error?: string;
}) {
  return (
    <fieldset>
      {ackName && (
        // TALIMOON's first personal sentence — deliberately given real
        // presence (weight 600, the stronger text colour, a comfortable
        // gap before the question) and stepped up in size so it catches
        // the eye, while still sitting clearly below the question.
        <p className="mb-6 font-sans text-[18px] font-semibold leading-[1.45] text-text-primary">
          {c.ackLine(ackName)}
        </p>
      )}
      <legend className="contents">
        <Heading headingRef={headingRef}>{c.relationshipQuestion}</Heading>
      </legend>

      <div className="mt-7 border-t border-border-subtle">
        {relationshipOptions(locale).map((opt) => {
          const active = value.includes(opt.type);
          return (
            <button
              key={opt.type}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(opt.type)}
              className={[
                "flex w-full items-center justify-between gap-3 border-b border-border-subtle px-3 py-[18px] text-start font-sans outline-none transition-colors focus-visible:bg-accent-primary/[0.05]",
                active
                  ? "border-s-2 border-s-accent-primary bg-accent-primary/[0.06] ps-4 text-text-primary"
                  : "text-text-secondary hover:bg-surface-raised/60 hover:text-text-primary",
              ].join(" ")}
            >
              <span className={active ? "text-[16px] font-semibold" : "text-[16px] font-medium"}>
                {opt.label}
              </span>
              <ArrowRight
                size={15}
                strokeWidth={1.75}
                aria-hidden="true"
                className={[
                  "shrink-0 text-accent-primary rtl:-scale-x-100",
                  active ? "opacity-100" : "opacity-0",
                ].join(" ")}
              />
            </button>
          );
        })}
      </div>

      {/* Progressive complexity: this line is the only hint that mixing
       *  relationships is possible — nothing else about the screen
       *  changes for the common single-relationship case. */}
      <p className="mt-3 font-sans text-[13px] text-text-secondary">
        {c.relationshipMultiHelper}
      </p>

      {value.includes("other") && (
        <div className="mt-5">
          <label
            htmlFor="p1-custom"
            className="mb-2 block font-sans text-[13px] font-medium text-text-primary"
          >
            {c.customLabelQuestion}
          </label>
          <input
            id="p1-custom"
            type="text"
            value={customLabel}
            onChange={(e) => onCustomLabel(e.target.value)}
            placeholder={c.customLabelPlaceholder}
            className={textInputClass}
          />
        </div>
      )}
      <ErrorLine>{error}</ErrorLine>
    </fieldset>
  );
}

// ── Scene: child count (nothing preselected) ─────────────────────

function SceneCount({
  c,
  rel,
  value,
  onSelect,
  headingRef,
}: {
  c: Phase01Copy;
  rel: RecipientRelationship;
  value: number | null;
  onSelect: (n: number) => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <fieldset>
      <legend className="contents">
        <Heading headingRef={headingRef}>{c.countQuestion(rel)}</Heading>
      </legend>
      <div className="mt-8 flex flex-wrap gap-3">
        {Array.from({ length: MAX_MAIN_CHILDREN }, (_, i) => i + 1).map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(n)}
              className={[
                "flex min-h-[56px] min-w-[56px] items-center justify-center rounded-md border font-display text-[20px] font-medium outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary",
                active
                  ? "border-accent-primary bg-accent-primary/[0.08] text-text-primary"
                  : "border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary",
              ].join(" ")}
            >
              {n}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

// ── Scene: child — "meeting a character" ─────────────────────────

function SceneChild({
  c,
  rel,
  index,
  total,
  child,
  onName,
  onAge,
  onEnter,
  headingRef,
  error,
}: {
  c: Phase01Copy;
  rel: RecipientRelationship;
  index: number;
  total: number;
  child: ChildProfile | undefined;
  onName: (v: string) => void;
  onAge: (age: number | null) => void;
  onEnter: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  error?: string;
}) {
  const name = child?.name ?? "";
  const age = child?.age ?? null;
  const isCustomAge = age != null && !QUICK_AGES.includes(age);
  const [otherOpen, setOtherOpen] = useState(isCustomAge);

  const nameError = error === c.errChildName ? error : undefined;
  const ageError = error === c.errAge || error === c.errAgeRange ? error : undefined;

  return (
    <div>
      <Heading headingRef={headingRef}>
        {c.childMoment(index, total, name)}
      </Heading>

      <div className="mt-7">
        <label
          htmlFor={`p1-child-name-${index}`}
          className="mb-2 block font-sans text-[13px] font-medium text-text-primary"
        >
          {c.childNamePrompt(index, total, rel)}
        </label>
        <input
          id={`p1-child-name-${index}`}
          type="text"
          value={name}
          onChange={(e) => onName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (
                document
                  .getElementById(`p1-age-group-${index}`)
                  ?.querySelector("button") as HTMLButtonElement | null
              )?.focus();
            }
          }}
          placeholder={c.childNamePlaceholder}
          className={textInputClass}
          aria-invalid={nameError ? true : undefined}
          autoFocus={total > 1 && index > 0}
        />
        <ErrorLine>{nameError}</ErrorLine>
      </div>

      <fieldset className="mt-7">
        <legend className="mb-2 block font-sans text-[13px] font-medium text-text-primary">
          {c.childAgeQuestion(name)}
        </legend>
        <div id={`p1-age-group-${index}`} className="flex flex-wrap gap-2">
          {QUICK_AGES.map((a) => {
            const active = age === a && !otherOpen;
            return (
              <button
                key={a}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  onAge(a);
                  setOtherOpen(false);
                }}
                className={[
                  "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border px-3 font-sans text-[15px] font-medium outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary",
                  active
                    ? "border-accent-primary bg-accent-primary/[0.08] text-text-primary"
                    : "border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary",
                ].join(" ")}
              >
                {a}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={otherOpen}
            onClick={() => {
              setOtherOpen(true);
              if (!isCustomAge) onAge(null);
            }}
            className={[
              "min-h-[44px] rounded-md border px-4 font-sans text-[13.5px] font-medium outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary",
              otherOpen
                ? "border-accent-primary bg-accent-primary/[0.08] text-text-primary"
                : "border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary",
            ].join(" ")}
          >
            {c.otherAge}
          </button>
        </div>

        {otherOpen && (
          <div className="mt-3">
            <input
              type="number"
              inputMode="numeric"
              min={AGE_MIN}
              max={AGE_MAX}
              value={age ?? ""}
              onChange={(e) => {
                const raw = e.target.value.trim();
                onAge(raw === "" ? null : Math.trunc(Number(raw)));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onEnter();
                }
              }}
              placeholder={`${AGE_MIN}–${AGE_MAX}`}
              className={
                textInputClass +
                " max-w-[120px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              }
              aria-invalid={ageError ? true : undefined}
              autoFocus
            />
          </div>
        )}
        <ErrorLine>{ageError}</ErrorLine>
      </fieldset>
    </div>
  );
}

// ── Scene: per-child relationship (only when 2–3 types were chosen) ──

function SceneChildRelationship({
  c,
  locale,
  relTypes,
  child,
  value,
  onSelect,
  headingRef,
  error,
}: {
  c: Phase01Copy;
  locale: Locale;
  /** The types chosen on the relationship scene — never offer one the
   *  orderer didn't pick (spec §01). */
  relTypes: RelationshipType[];
  child: ChildProfile | undefined;
  value: RelationshipType | null;
  onSelect: (t: RelationshipType) => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  error?: string;
}) {
  const name = child?.name.trim() || "";
  const options = relationshipOptions(locale).filter((opt) => relTypes.includes(opt.type));

  return (
    <fieldset>
      <legend className="contents">
        <Heading headingRef={headingRef}>{c.childRelationshipQuestion(name)}</Heading>
      </legend>
      <div className="mt-7 flex flex-wrap gap-2.5">
        {options.map((opt) => {
          const active = value === opt.type;
          return (
            <button
              key={opt.type}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(opt.type)}
              className={[
                "min-h-[44px] rounded-md border px-5 font-sans text-[14.5px] font-medium outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary",
                active
                  ? "border-accent-primary bg-accent-primary/[0.08] text-text-primary"
                  : "border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary",
              ].join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <ErrorLine>{error}</ErrorLine>
    </fieldset>
  );
}

// ── Scene: completion milestone ─────────────────────────────────

function SceneCompletion({
  c,
  total,
  kids,
  headingRef,
}: {
  c: Phase01Copy;
  total: number;
  kids: ChildProfile[];
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  if (total === 1) {
    const ch = kids[0];
    const nm = ch?.name.trim() || "";
    const age = ch?.age ?? 0;
    return (
      <div>
        <Heading headingRef={headingRef} size="xl">
          {c.completionOneChild(nm, age)}
        </Heading>
        <Supporting>{c.completionOneChildSupport(nm)}</Supporting>
      </div>
    );
  }

  return (
    <div>
      <Heading headingRef={headingRef} size="xl">
        {c.completionManyHeading}
      </Heading>

      <span
        aria-hidden="true"
        className="mt-6 block h-px w-10 bg-accent-primary/60"
      />
      <ul className="mt-5">
        {kids.map((ch, i) => (
          <li
            key={ch.id}
            className={[
              "flex items-baseline justify-between gap-4 py-4",
              i > 0 ? "border-t border-border-subtle" : "",
            ].join(" ")}
          >
            <span className="font-display text-[21px] font-medium leading-none text-text-primary">
              {ch.name.trim()}
            </span>
            <span className="font-sans text-[13px] tabular-nums text-text-secondary">
              {ch.age != null ? c.yearsSuffix(ch.age) : ""}
            </span>
          </li>
        ))}
      </ul>

      <Supporting>{c.completionManySupport}</Supporting>
    </div>
  );
}
