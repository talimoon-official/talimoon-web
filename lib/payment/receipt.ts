/**
 * The "Keyinroq to‘lash" payment-code card — a TALIMOON payment REMINDER,
 * not a fiscal or bank receipt.
 *
 * Format: PNG, drawn on a <canvas> in the browser — no dependency, opens in
 * any gallery / Files app, easy to share later, no PDF viewer involved.
 *
 * Content (and nothing else — see `receiptLines`): TALIMOON, the order code,
 * the ORIGINAL payment code returned by finalize, "To‘lov kutilmoqda", one
 * instruction line and talimoon.com/pay. Never a name, a phone, an address,
 * a child detail, a token or an internal id.
 *
 * Everything here runs SYNCHRONOUSLY inside the customer's tap (render →
 * PNG bytes → File), so the save / share that follows still counts as
 * started by that tap.
 */

export interface ReceiptContent {
  orderCode: string;
  paymentCode: string;
  labels: {
    order: string;
    code: string;
    status: string;
    instruction: string;
  };
}

export const RECEIPT_SITE = "talimoon.com/pay";
export const RECEIPT_WIDTH = 1080;
export const RECEIPT_HEIGHT = 1350;

const IVORY = "#F7F3EC";
const PAPER = "#FDFBF7";
const NAVY = "#1C2A3A";
const NAVY_SOFT = "rgba(28, 42, 58, 0.62)";
const GOLD = "#B8935B";
const GOLD_DEEP = "#9C7A47";
const GOLD_WASH = "rgba(184, 147, 91, 0.09)";

/** TAL-2026-0018 → TALIMOON-TAL-2026-0018-payment.png (anything odd → "order"). */
export function receiptFileName(orderCode: string): string {
  const safe = /^[A-Z]{2,5}-\d{4}-\d{3,6}$/.test(orderCode) ? orderCode : "order";
  return `TALIMOON-${safe}-payment.png`;
}

/** Every text the card shows — the whole content, in drawing order. */
export function receiptLines(c: ReceiptContent): string[] {
  return ["TALIMOON", c.labels.order, c.orderCode, c.labels.code, c.paymentCode, c.labels.status, c.labels.instruction, RECEIPT_SITE];
}

/** The page's own fonts (next/font variables), with safe fallbacks. */
function pageFonts(): { display: string; sans: string } {
  let display = "";
  let sans = "";
  try {
    const cs = getComputedStyle(document.body);
    display = cs.getPropertyValue("--font-fraunces").trim();
    sans = cs.getPropertyValue("--font-plus-jakarta-sans").trim();
  } catch {
    /* no DOM styles: fallbacks below */
  }
  return {
    display: display ? `${display}, Georgia, serif` : "Georgia, serif",
    sans: sans ? `${sans}, Arial, Helvetica, sans-serif` : "Arial, Helvetica, sans-serif",
  };
}

/** Canvas 2D subset used here (lets tests draw on a recording fake). */
export type ReceiptCtx = Pick<
  CanvasRenderingContext2D,
  | "fillStyle"
  | "strokeStyle"
  | "lineWidth"
  | "font"
  | "textAlign"
  | "textBaseline"
  | "fillRect"
  | "fillText"
  | "measureText"
  | "beginPath"
  | "moveTo"
  | "lineTo"
  | "arcTo"
  | "closePath"
  | "fill"
  | "stroke"
>;

function roundRect(ctx: ReceiptCtx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/** Centered text with manual letter-spacing (canvas letterSpacing is not
 *  supported everywhere). */
function spaced(ctx: ReceiptCtx, text: string, cx: number, y: number, tracking: number) {
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1);
  let x = cx - total / 2;
  const align = ctx.textAlign;
  ctx.textAlign = "left";
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x, y);
    x += widths[i]! + tracking;
  });
  ctx.textAlign = align;
}

function wrap(ctx: ReceiptCtx, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Draw the card. Pure: only `c` reaches the canvas. */
export function drawReceipt(ctx: ReceiptCtx, c: ReceiptContent, fonts = { display: "Georgia, serif", sans: "Arial, sans-serif" }) {
  const W = RECEIPT_WIDTH;
  const H = RECEIPT_HEIGHT;
  const cx = W / 2;

  // warm ivory ground, a paper card with a gold hairline
  ctx.fillStyle = IVORY;
  ctx.fillRect(0, 0, W, H);
  roundRect(ctx, 56, 56, W - 112, H - 112, 36);
  ctx.fillStyle = PAPER;
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // TALIMOON + a short gold rule
  ctx.fillStyle = NAVY;
  ctx.font = `500 62px ${fonts.display}`;
  spaced(ctx, "TALIMOON", cx, 206, 14);
  ctx.fillStyle = GOLD;
  ctx.fillRect(cx - 44, 244, 88, 3);

  // order
  ctx.fillStyle = NAVY_SOFT;
  ctx.font = `600 26px ${fonts.sans}`;
  spaced(ctx, c.labels.order.toUpperCase(), cx, 338, 6);
  ctx.fillStyle = NAVY;
  ctx.font = `500 54px ${fonts.display}`;
  ctx.fillText(c.orderCode, cx, 408);

  // the payment code — the focus
  roundRect(ctx, 150, 470, W - 300, 330, 28);
  ctx.fillStyle = GOLD_WASH;
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = GOLD_DEEP;
  ctx.font = `600 26px ${fonts.sans}`;
  spaced(ctx, c.labels.code.toUpperCase(), cx, 548, 6);
  ctx.fillStyle = NAVY;
  ctx.font = `700 142px ${fonts.sans}`;
  spaced(ctx, c.paymentCode, cx, 718, 20);

  // status
  ctx.fillStyle = GOLD_DEEP;
  ctx.font = `600 32px ${fonts.sans}`;
  ctx.fillText(c.labels.status, cx, 880);

  // instruction
  ctx.fillStyle = NAVY_SOFT;
  ctx.font = `400 34px ${fonts.sans}`;
  const lines = wrap(ctx, c.labels.instruction, 800);
  lines.forEach((l, i) => ctx.fillText(l, cx, 980 + i * 50));

  // talimoon.com/pay
  ctx.fillStyle = GOLD;
  ctx.fillRect(cx - 170, 1152, 340, 2);
  ctx.fillStyle = NAVY;
  ctx.font = `600 42px ${fonts.sans}`;
  ctx.fillText(RECEIPT_SITE, cx, 1222);
}

function dataUrlToBytes(dataUrl: string): Uint8Array<ArrayBuffer> {
  const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const bin = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Render the PNG — SYNCHRONOUS (no await), so a save started right after
 *  still belongs to the tap. Throws if the browser cannot draw. */
export function renderReceiptPng(c: ReceiptContent): File {
  const canvas = document.createElement("canvas");
  canvas.width = RECEIPT_WIDTH;
  canvas.height = RECEIPT_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  drawReceipt(ctx, c, pageFonts());
  const url = canvas.toDataURL("image/png");
  if (!url.startsWith("data:image/png")) throw new Error("png unavailable");
  return new File([dataUrlToBytes(url)], receiptFileName(c.orderCode), { type: "image/png" });
}

// ---------------------------------------------------------------------------
// saving
// ---------------------------------------------------------------------------

/**
 *  download  — a download was started (Android Chrome, desktop, Safari ≥13)
 *  shared    — the iOS share sheet completed (Save Image / Save to Files / …)
 *  inline    — in-app browser (Telegram, Instagram, Facebook…): downloads are
 *              often dropped there, so the card is shown for press-and-hold
 *  cancelled — the customer closed the share sheet without saving
 */
export type ReceiptSaveOutcome = "download" | "shared" | "inline" | "cancelled";

export interface SaveEnv {
  userAgent: string;
  maxTouchPoints: number;
  canShareFiles: (file: File) => boolean;
  share: (file: File) => Promise<void>;
  download: (file: File) => void;
}

export function isInAppBrowser(ua: string): boolean {
  return /Telegram|Instagram|FBAN|FBAV|FB_IAB|Line\/|; wv\)/i.test(ua);
}

export function isIOS(ua: string, maxTouchPoints: number): boolean {
  // iPadOS reports a Mac user agent — told apart by touch support
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1);
}

export function browserSaveEnv(): SaveEnv {
  return {
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    canShareFiles: (file) => {
      try {
        return typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
      } catch {
        return false;
      }
    },
    share: (file) => navigator.share({ files: [file] }),
    download: (file) => {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.rel = "noopener";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      // late enough never to cancel the download; the page may be gone anyway
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
  };
}

/**
 * Start saving the card. MUST be called synchronously from the tap: the
 * share / download call itself happens before the first await.
 * Throws only if the browser refused outright (→ show "Chekni saqlash").
 */
export async function startReceiptSave(file: File, env: SaveEnv = browserSaveEnv()): Promise<ReceiptSaveOutcome> {
  if (isInAppBrowser(env.userAgent)) return "inline";
  if (isIOS(env.userAgent, env.maxTouchPoints) && env.canShareFiles(file)) {
    try {
      await env.share(file);
      return "shared";
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return "cancelled";
      // share refused for another reason: try a plain download instead
    }
  }
  env.download(file);
  return "download";
}
