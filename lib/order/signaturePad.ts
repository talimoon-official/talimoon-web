/**
 * Signature stroke engine — framework-agnostic core for the premium drawn
 * signature on the order consent step.
 *
 * The canonical representation is a LOGICAL stroke record in normalized
 * [0,1] coordinates (spec §18) — never a canvas screenshot, never
 * device-pixel values. The <SignaturePad> component owns pointer capture,
 * DPR-correct rendering and resize; this module owns the model, the
 * meaningful-ink test, and the bounded serialisation that becomes
 * `consent.drawnSignature`.
 *
 * The serialised shape is `{ v, aspect, strokes }` where `strokes` is
 * `number[][][]` (stroke -> point -> [x, y]). The talimoon-intake contract
 * (`src/contract/signatureStrokes.ts`) reads exactly this — plus the legacy
 * bare `[[[x,y],...]]` array — and applies the SAME `MIN_INK_LENGTH` gate.
 */

export interface SigPoint {
  x: number;
  y: number;
}
export type SigStroke = SigPoint[];

export const SIGNATURE_FORMAT_VERSION = 2;
/** must stay in lockstep with talimoon-intake `MIN_INK_LENGTH` */
export const SIGNATURE_MIN_INK_LENGTH = 0.03;
/** default width/height ratio of the signing surface, used when a payload
 *  carries no explicit aspect */
export const SIGNATURE_DEFAULT_ASPECT = 2.6;
/** hard cap on serialised points so `drawnSignature` stays well under the
 *  intake contract's 20k-char ceiling (~16 chars/point) with headroom */
const MAX_TOTAL_POINTS = 900;
/** points closer than this (normalized) are dropped while drawing */
const MIN_POINT_GAP = 0.0015;

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function pathLength(strokes: SigStroke[], aspect: number): number {
  let total = 0;
  for (const stroke of strokes) {
    for (let i = 1; i < stroke.length; i++) {
      const a = stroke[i]!;
      const b = stroke[i - 1]!;
      total += Math.hypot((a.x - b.x) * aspect, a.y - b.y);
    }
  }
  return total;
}

/** Uniformly thin a stroke to at most `budget` points, always keeping the
 *  first and last so the shape's extent is preserved. */
function decimate(stroke: SigStroke, budget: number): SigStroke {
  if (stroke.length <= budget || budget < 2) return stroke.slice(0, Math.max(budget, 1));
  const out: SigStroke = [];
  const step = (stroke.length - 1) / (budget - 1);
  for (let i = 0; i < budget; i++) out.push(stroke[Math.round(i * step)]!);
  out[out.length - 1] = stroke[stroke.length - 1]!;
  return out;
}

export class SignatureModel {
  strokes: SigStroke[] = [];
  private active: SigStroke | null = null;

  /** number of pen-down..pen-up strokes that carry at least one point */
  get strokeCount(): number {
    return this.strokes.filter((s) => s.length > 0).length;
  }

  get isEmpty(): boolean {
    return this.strokes.every((s) => s.length === 0);
  }

  begin(x: number, y: number): void {
    this.active = [{ x: clamp01(x), y: clamp01(y) }];
    this.strokes.push(this.active);
  }

  extend(x: number, y: number): void {
    if (!this.active) return;
    const p = { x: clamp01(x), y: clamp01(y) };
    const last = this.active[this.active.length - 1];
    if (last && Math.hypot(p.x - last.x, p.y - last.y) < MIN_POINT_GAP) return;
    this.active.push(p);
  }

  end(): void {
    // drop a stroke that never moved (a stray tap leaves 1 point)
    if (this.active && this.active.length < 2) {
      const idx = this.strokes.indexOf(this.active);
      if (idx >= 0 && this.active.length <= 1) this.strokes.splice(idx, 1);
    }
    this.active = null;
  }

  clear(): void {
    this.strokes = [];
    this.active = null;
  }

  inkLength(aspect: number = SIGNATURE_DEFAULT_ASPECT): number {
    return pathLength(this.strokes, aspect);
  }

  /** true when the strokes carry a real mark, not a stray tap (spec §15) */
  hasMeaningfulInk(aspect: number = SIGNATURE_DEFAULT_ASPECT): boolean {
    return this.inkLength(aspect) >= SIGNATURE_MIN_INK_LENGTH;
  }

  /** bounded, rounded `{ v, aspect, strokes }` JSON for `consent.drawnSignature` */
  toJSON(aspect: number = SIGNATURE_DEFAULT_ASPECT): string {
    const drawn = this.strokes.filter((s) => s.length > 0);
    const totalPoints = drawn.reduce((n, s) => n + s.length, 0);
    let budgeted = drawn;
    if (totalPoints > MAX_TOTAL_POINTS && totalPoints > 0) {
      const ratio = MAX_TOTAL_POINTS / totalPoints;
      budgeted = drawn.map((s) => decimate(s, Math.max(2, Math.floor(s.length * ratio))));
    }
    const strokes = budgeted.map((s) => s.map((p) => [round3(p.x), round3(p.y)]));
    return JSON.stringify({ v: SIGNATURE_FORMAT_VERSION, aspect: round3(aspect), strokes });
  }

  /** replace the model's strokes from a previously serialised payload */
  loadJSON(payload: string): boolean {
    const parsed = parseSignaturePayload(payload);
    if (!parsed) return false;
    this.strokes = parsed.strokes.map((s) => s.map((p) => ({ ...p })));
    this.active = null;
    return true;
  }
}

export interface ParsedSignaturePayload {
  strokes: SigStroke[];
  aspect: number;
}

/** Parse `{ v, aspect, strokes }` or the legacy bare `[[[x,y],...]]`. Returns
 *  null for anything malformed — callers treat that as "no signature". */
export function parseSignaturePayload(payload: string): ParsedSignaturePayload | null {
  if (typeof payload !== "string" || payload.length === 0 || payload.length > 200_000) {
    return null;
  }
  let json: unknown;
  try {
    json = JSON.parse(payload);
  } catch {
    return null;
  }
  let rawStrokes: unknown;
  let aspect = SIGNATURE_DEFAULT_ASPECT;
  if (Array.isArray(json)) {
    rawStrokes = json;
  } else if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    rawStrokes = obj.strokes;
    if (typeof obj.aspect === "number" && Number.isFinite(obj.aspect)) {
      aspect = Math.min(6, Math.max(0.5, obj.aspect));
    }
  }
  if (!Array.isArray(rawStrokes)) return null;

  const strokes: SigStroke[] = [];
  for (const s of rawStrokes) {
    if (!Array.isArray(s)) return null;
    const pts: SigStroke = [];
    for (const p of s) {
      if (
        !Array.isArray(p) ||
        p.length < 2 ||
        typeof p[0] !== "number" ||
        typeof p[1] !== "number" ||
        !p.every((n) => typeof n === "number" && Number.isFinite(n))
      ) {
        return null;
      }
      pts.push({ x: clamp01(p[0]), y: clamp01(p[1]) });
    }
    if (pts.length > 0) strokes.push(pts);
  }
  if (strokes.length === 0) return null;
  return { strokes, aspect };
}

/**
 * True when a serialised `drawnSignature` payload carries a real signature —
 * the check the order form's step-completion and pre-submit guards use so an
 * empty/near-empty canvas can never be "confirmed" (spec §15). Mirrors the
 * server's own gate.
 */
export function signatureHasInk(payload: string): boolean {
  const parsed = parseSignaturePayload(payload);
  if (!parsed) return false;
  return pathLength(parsed.strokes, parsed.aspect) >= SIGNATURE_MIN_INK_LENGTH;
}

/**
 * Walk a stroke as smooth quadratic segments (midpoint method): the curve
 * passes through the midpoint of each pair of raw points, with the raw point
 * as the control handle. Loops ("8", "S", "O", "∞") keep their shape instead
 * of collapsing into straight chords (spec §10/§11). `cb` receives, per
 * segment, the control point and the end point — feed straight into
 * `ctx.quadraticCurveTo(cx, cy, ex, ey)` after an initial `moveTo`.
 */
export function forEachQuadSegment(
  points: SigStroke,
  cb: (seg: { cx: number; cy: number; ex: number; ey: number }, index: number) => void,
): void {
  if (points.length < 2) return;
  if (points.length === 2) {
    cb({ cx: points[0]!.x, cy: points[0]!.y, ex: points[1]!.x, ey: points[1]!.y }, 0);
    return;
  }
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i]!;
    const next = points[i + 1]!;
    cb({ cx: p.x, cy: p.y, ex: (p.x + next.x) / 2, ey: (p.y + next.y) / 2 }, i - 1);
  }
  // final short segment to the true last point
  const last = points[points.length - 1]!;
  const prev = points[points.length - 2]!;
  cb({ cx: prev.x, cy: prev.y, ex: last.x, ey: last.y }, points.length - 2);
}

/** The point a stroke's smoothed path should `moveTo` before the first
 *  quad segment (the midpoint of p0..p1, matching `forEachQuadSegment`). */
export function strokeStartPoint(points: SigStroke): SigPoint | null {
  if (points.length === 0) return null;
  if (points.length < 3) return points[0]!;
  return { x: (points[0]!.x + points[1]!.x) / 2, y: (points[0]!.y + points[1]!.y) / 2 };
}
