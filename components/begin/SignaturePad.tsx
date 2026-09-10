'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Check, Eraser } from 'lucide-react';
import {
  SignatureModel,
  forEachQuadSegment,
  strokeStartPoint,
  type SigStroke,
} from '@/lib/order/signaturePad';

export type SignaturePadCopy = {
  /** short instruction shown above the surface */
  help: string;
  clear: string;
  confirm: string;
  /** aria label for the drawing surface */
  ariaLabel: string;
};

const INK = '#162338';
const PEN_WIDTH = 2.5; // CSS px; DPR handled by the context transform

export function SignaturePad({
  copy,
  initialPayload,
  onConfirm,
  onClear,
  onDraw,
}: {
  copy: SignaturePadCopy;
  /** re-hydrate the surface from a previously confirmed payload */
  initialPayload?: string;
  onConfirm: (payloadJson: string) => void;
  onClear: () => void;
  /** fired the first time the user adds ink after an empty / confirmed state */
  onDraw?: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<SignatureModel>(new SignatureModel());
  const drawingRef = useRef(false);
  const dprRef = useRef(1);
  const sizeRef = useRef({ w: 1, h: 1 });
  const notifiedDrawRef = useRef(false);

  const [inkOk, setInkOk] = useState(false);

  // --- rendering ----------------------------------------------------------
  const ctx = () => canvasRef.current?.getContext('2d') ?? null;

  const aspect = () => {
    const { w, h } = sizeRef.current;
    return h > 0 ? w / h : 2.6;
  };

  const paintStroke = useCallback((c: CanvasRenderingContext2D, stroke: SigStroke) => {
    const { w, h } = sizeRef.current;
    const start = strokeStartPoint(stroke);
    if (!start) return;
    c.beginPath();
    c.moveTo(start.x * w, start.y * h);
    if (stroke.length === 1) {
      // a deliberate dot: draw a small filled disc
      c.arc(start.x * w, start.y * h, PEN_WIDTH / 2, 0, Math.PI * 2);
      c.fillStyle = INK;
      c.fill();
      return;
    }
    forEachQuadSegment(stroke, ({ cx, cy, ex, ey }) => {
      c.quadraticCurveTo(cx * w, cy * h, ex * w, ey * h);
    });
    c.stroke();
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const c = ctx();
    if (!canvas || !c) return;
    const { w, h } = sizeRef.current;
    c.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
    c.clearRect(0, 0, w, h);
    c.strokeStyle = INK;
    c.lineWidth = PEN_WIDTH;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (const stroke of modelRef.current.strokes) paintStroke(c, stroke);
  }, [paintStroke]);

  const resize = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const rect = wrap.getBoundingClientRect();
    const cssW = Math.max(1, Math.round(rect.width));
    const cssH = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
    sizeRef.current = { w: cssW, h: cssH };
    dprRef.current = dpr;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    // backing store in device pixels; logical drawing stays in CSS px
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    redraw(); // resize/orientation never loses the signature (spec §17)
  }, [redraw]);

  useEffect(() => {
    // hydrate any prior payload before the first paint
    if (initialPayload) {
      modelRef.current.loadJSON(initialPayload);
      setInkOk(modelRef.current.hasMeaningfulInk());
    }
    resize();
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => resize())
        : null;
    if (ro && wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener('resize', resize);
    const mq = window.matchMedia?.(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    mq?.addEventListener?.('change', resize);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', resize);
      mq?.removeEventListener?.('change', resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- pointer input (unified; mouse + touch + stylus) -------------------
  const toLocal = (e: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    return {
      x: r.width > 0 ? (e.clientX - r.left) / r.width : 0,
      y: r.height > 0 ? (e.clientY - r.top) / r.height : 0,
    };
  };

  const noteFirstDraw = () => {
    if (!notifiedDrawRef.current) {
      notifiedDrawRef.current = true;
      onDraw?.();
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.button != null && e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    drawingRef.current = true;
    const p = toLocal(e);
    modelRef.current.begin(p.x, p.y);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* not all environments support capture */
    }
    noteFirstDraw();
    redraw();
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const native = e.nativeEvent as PointerEvent & {
      getCoalescedEvents?: () => PointerEvent[];
    };
    const events =
      typeof native.getCoalescedEvents === 'function'
        ? native.getCoalescedEvents()
        : [native];
    for (const ev of events.length ? events : [native]) {
      const p = toLocal(ev);
      modelRef.current.extend(p.x, p.y);
    }
    redraw();
  };

  const finishStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    modelRef.current.end();
    redraw();
    setInkOk(modelRef.current.hasMeaningfulInk(aspect()));
  };

  const handleClear = () => {
    modelRef.current.clear();
    notifiedDrawRef.current = false;
    setInkOk(false);
    redraw();
    onClear();
  };

  const handleConfirm = () => {
    if (!modelRef.current.hasMeaningfulInk(aspect())) return;
    onConfirm(modelRef.current.toJSON(aspect()));
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3">
      <p className="font-sans text-[13px] leading-5 text-[#6d6860]">{copy.help}</p>
      <div
        ref={wrapRef}
        className="relative min-h-[220px] flex-1 overflow-hidden rounded-2xl border border-[#b8935b]/45 bg-[#fffdf9]"
      >
        {/* baseline guide */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 bottom-[22%] border-b border-dashed border-[#b8935b]/35"
        />
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          onPointerLeave={() => {
            // with pointer capture the stroke keeps flowing; only finish if
            // capture was not established (older engines)
            if (!canvasRef.current?.hasPointerCapture?.(0)) finishStroke();
          }}
          className="absolute inset-0 h-full w-full touch-none"
          style={{ touchAction: 'none' }}
          aria-label={copy.ariaLabel}
          role="img"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[#162338]/25 px-4 font-sans text-[13px] font-bold text-[#162338]"
        >
          <Eraser size={15} />
          {copy.clear}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!inkOk}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#162338] px-4 font-sans text-[13px] font-bold text-white disabled:opacity-40"
        >
          <Check size={16} />
          {copy.confirm}
        </button>
      </div>
    </div>
  );
}

/** Small read-only preview of a confirmed signature payload (spec §45). */
export function SignaturePreview({ payload, className }: { payload: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const c = canvas?.getContext('2d') ?? null;
    if (!canvas || !c) return;
    const model = new SignatureModel();
    if (!model.loadJSON(payload)) return;
    const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);

    // fit the ink bounds into the preview box with a small margin
    let minX = 1;
    let minY = 1;
    let maxX = 0;
    let maxY = 0;
    for (const s of model.strokes)
      for (const p of s) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
    const bw = Math.max(maxX - minX, 1e-3);
    const bh = Math.max(maxY - minY, 1e-3);
    const scale = Math.min(w / bw, h / bh) * 0.82;
    const ox = (w - bw * scale) / 2 - minX * scale;
    const oy = (h - bh * scale) / 2 - minY * scale;

    c.strokeStyle = INK;
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (const stroke of model.strokes) {
      const start = strokeStartPoint(stroke);
      if (!start) continue;
      c.beginPath();
      c.moveTo(start.x * scale + ox, start.y * scale + oy);
      forEachQuadSegment(stroke, ({ cx, cy, ex, ey }) => {
        c.quadraticCurveTo(cx * scale + ox, cy * scale + oy, ex * scale + ox, ey * scale + oy);
      });
      c.stroke();
    }
  }, [payload]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
