/**
 * §57 / §58 — the drawn-signature stroke engine (client side).
 *
 * The <SignaturePad> component owns pointer capture, DPR-correct rendering
 * and resize; those need real browser geometry. This file locks the pure
 * model that every one of those paths depends on: normalized logical
 * coordinates, the meaningful-ink gate, bounded serialisation, clear/redraw
 * state, and the quad-smoothing that keeps loops intact.
 */

import { describe, it, expect } from "vitest";
import {
  SignatureModel,
  parseSignaturePayload,
  signatureHasInk,
  forEachQuadSegment,
  strokeStartPoint,
  SIGNATURE_MIN_INK_LENGTH,
  type SigStroke,
} from "@/lib/order/signaturePad";

function draw(model: SignatureModel, pts: Array<[number, number]>) {
  model.begin(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length; i++) model.extend(pts[i]![0], pts[i]![1]);
  model.end();
}

function figureEight(n = 160): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    out.push([0.5 + 0.3 * Math.sin(t), 0.5 + 0.33 * Math.sin(t) * Math.cos(t)]);
  }
  return out;
}

describe("SignatureModel — capture + state", () => {
  it("starts empty and rejects an empty canvas as a signature (§15)", () => {
    const m = new SignatureModel();
    expect(m.isEmpty).toBe(true);
    expect(m.hasMeaningfulInk()).toBe(false);
    expect(m.toJSON()).toContain('"strokes":[]');
    expect(signatureHasInk(m.toJSON())).toBe(false);
  });

  it("a single stray tap is not a signature", () => {
    const m = new SignatureModel();
    m.begin(0.5, 0.5);
    m.end();
    expect(m.strokeCount).toBe(0); // 1-point stroke dropped
    expect(m.hasMeaningfulInk()).toBe(false);
  });

  it("accepts a real signature and a short deliberate mark", () => {
    const m = new SignatureModel();
    draw(m, figureEight());
    expect(m.hasMeaningfulInk()).toBe(true);
    expect(signatureHasInk(m.toJSON())).toBe(true);

    const tick = new SignatureModel();
    draw(tick, [
      [0.4, 0.5],
      [0.47, 0.6],
      [0.62, 0.42],
    ]);
    expect(tick.hasMeaningfulInk()).toBe(true);
  });

  it("preserves multiple strokes", () => {
    const m = new SignatureModel();
    draw(m, [[0.1, 0.5], [0.4, 0.5]]);
    draw(m, [[0.5, 0.2], [0.5, 0.8]]);
    draw(m, [[0.6, 0.5], [0.9, 0.5]]);
    expect(m.strokeCount).toBe(3);
  });

  it("clear() removes all stroke + ink state (§16)", () => {
    const m = new SignatureModel();
    draw(m, figureEight());
    expect(m.hasMeaningfulInk()).toBe(true);
    m.clear();
    expect(m.isEmpty).toBe(true);
    expect(m.strokeCount).toBe(0);
    expect(m.hasMeaningfulInk()).toBe(false);
    expect(signatureHasInk(m.toJSON())).toBe(false);
  });

  it("keeps coordinates normalized to [0,1] regardless of input overshoot (DPR-independent, §6/§9)", () => {
    const m = new SignatureModel();
    m.begin(-0.3, 1.4);
    m.extend(0.5, 0.5);
    m.extend(2.0, -1.0);
    m.end();
    for (const s of m.strokes)
      for (const p of s) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(1);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(1);
      }
  });

  it("drops near-duplicate points but keeps the gesture", () => {
    const m = new SignatureModel();
    m.begin(0.2, 0.2);
    for (let i = 0; i < 50; i++) m.extend(0.2 + 1e-5 * i, 0.2); // sub-threshold jitter
    m.extend(0.8, 0.7);
    m.end();
    expect(m.strokes[0]!.length).toBeLessThan(5);
  });
});

describe("SignatureModel — bounded serialisation", () => {
  it("round-trips through toJSON / loadJSON", () => {
    const a = new SignatureModel();
    draw(a, figureEight());
    draw(a, [[0.1, 0.1], [0.2, 0.2], [0.3, 0.15]]);
    const json = a.toJSON();
    const b = new SignatureModel();
    expect(b.loadJSON(json)).toBe(true);
    expect(b.strokeCount).toBe(a.strokeCount);
    expect(b.hasMeaningfulInk()).toBe(true);
  });

  it("caps a huge stroke so drawnSignature stays well under the 20k-char contract limit", () => {
    const m = new SignatureModel();
    m.begin(0, 0.5);
    for (let i = 1; i <= 6000; i++) m.extend(i / 6000, 0.5 + 0.2 * Math.sin(i / 25));
    m.end();
    const json = m.toJSON();
    expect(json.length).toBeLessThan(20_000);
    const parsed = parseSignaturePayload(json)!;
    const total = parsed.strokes.reduce((n, s) => n + s.length, 0);
    expect(total).toBeLessThanOrEqual(900);
    // extent is retained (endpoints kept)
    expect(parsed.strokes[0]![0]!.x).toBeCloseTo(0, 2);
    expect(parsed.strokes[0]![parsed.strokes[0]!.length - 1]!.x).toBeCloseTo(1, 2);
  });

  it("carries the surface aspect so a wide signature is not squashed later", () => {
    const m = new SignatureModel();
    draw(m, figureEight());
    const parsed = parseSignaturePayload(m.toJSON(3.4))!;
    expect(parsed.aspect).toBeCloseTo(3.4, 2);
  });
});

describe("parseSignaturePayload — tolerant reader, strict shape", () => {
  it("accepts the object form and the legacy bare array", () => {
    expect(parseSignaturePayload('{"v":2,"aspect":2.6,"strokes":[[[0.1,0.2],[0.3,0.4]]]}')).not.toBeNull();
    expect(parseSignaturePayload("[[[0.1,0.2],[0.3,0.4]]]")).not.toBeNull();
  });

  it("returns null for empty / malformed / oversized payloads", () => {
    expect(parseSignaturePayload("")).toBeNull();
    expect(parseSignaturePayload("not json")).toBeNull();
    expect(parseSignaturePayload("{}")).toBeNull();
    expect(parseSignaturePayload("[]")).toBeNull();
    expect(parseSignaturePayload('{"strokes":[]}')).toBeNull();
    expect(parseSignaturePayload('{"strokes":[[["a","b"]]]}')).toBeNull();
    expect(parseSignaturePayload('{"strokes":[[[0,0,Infinity]]]}')).toBeNull();
  });

  it("signatureHasInk mirrors the server gate for an empty vs real canvas", () => {
    expect(signatureHasInk('{"v":2,"aspect":2.6,"strokes":[]}')).toBe(false);
    expect(signatureHasInk('{"v":2,"aspect":2.6,"strokes":[[[0.5,0.5]]]}')).toBe(false);
    const m = new SignatureModel();
    draw(m, figureEight());
    expect(signatureHasInk(m.toJSON())).toBe(true);
    expect(SIGNATURE_MIN_INK_LENGTH).toBe(0.03);
  });
});

describe("forEachQuadSegment — loop-preserving smoothing (§10/§11)", () => {
  const asStroke = (pts: Array<[number, number]>): SigStroke =>
    pts.map(([x, y]) => ({ x, y }));

  it("emits a curve through midpoints, not the raw polyline", () => {
    const stroke = asStroke([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]);
    const segs: Array<{ cx: number; cy: number; ex: number; ey: number }> = [];
    forEachQuadSegment(stroke, (s) => segs.push(s));
    expect(segs.length).toBeGreaterThanOrEqual(2);
    // first control point is the raw vertex; first end point is a midpoint
    expect(segs[0]!.cx).toBe(1);
    expect(segs[0]!.ex).toBeCloseTo(1); // midpoint of (1,0)-(1,1)
    expect(segs[0]!.ey).toBeCloseTo(0.5);
  });

  it("figure-eight: control points trace both lobes (no straight chord across the crossing)", () => {
    const stroke = asStroke(figureEight(64));
    const xs: number[] = [];
    const ys: number[] = [];
    forEachQuadSegment(stroke, ({ cx, cy }) => {
      xs.push(cx);
      ys.push(cy);
    });
    // the smoothed control path spans the full bounding box of the "8"
    expect(Math.min(...xs)).toBeLessThan(0.25);
    expect(Math.max(...xs)).toBeGreaterThan(0.75);
    expect(Math.min(...ys)).toBeLessThan(0.35);
    expect(Math.max(...ys)).toBeGreaterThan(0.65);
    // it revisits the centre (the crossing) rather than cutting a chord
    const nearCentre = xs.filter((x, i) => Math.abs(x - 0.5) < 0.06 && Math.abs(ys[i]! - 0.5) < 0.06);
    expect(nearCentre.length).toBeGreaterThanOrEqual(2);
  });

  it("a 2-point stroke is a single straight segment; start point is p0", () => {
    const stroke = asStroke([
      [0.2, 0.3],
      [0.7, 0.6],
    ]);
    const segs: Array<{ ex: number; ey: number }> = [];
    forEachQuadSegment(stroke, (s) => segs.push(s));
    expect(segs).toHaveLength(1);
    expect(strokeStartPoint(stroke)).toEqual({ x: 0.2, y: 0.3 });
  });
});
