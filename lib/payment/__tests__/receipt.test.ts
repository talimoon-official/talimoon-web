import { describe, it, expect, vi } from "vitest";
import {
  RECEIPT_SITE,
  drawReceipt,
  isInAppBrowser,
  isIOS,
  receiptFileName,
  renderReceiptPng,
  startReceiptSave,
  type ReceiptContent,
  type ReceiptCtx,
  type SaveEnv,
} from "../receipt";
import { PAYMENT_COPY } from "../copy";

const content: ReceiptContent = {
  orderCode: "TAL-2026-0018",
  paymentCode: "K7M4P2",
  labels: {
    order: PAYMENT_COPY.uz.receiptOrderLabel,
    code: PAYMENT_COPY.uz.receiptCodeLabel,
    status: "To‘lov kutilmoqda",
    instruction: PAYMENT_COPY.uz.receiptInstruction,
  },
};

/** A recording 2D context: every text that reaches the card. */
function recordingCtx() {
  const texts: string[] = [];
  const ctx = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textAlign: "center",
    textBaseline: "alphabetic",
    fillRect: vi.fn(),
    fillText: (t: string) => void texts.push(t),
    measureText: (t: string) => ({ width: t.length * 18 }) as TextMetrics,
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arcTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
  };
  return { ctx: ctx as unknown as ReceiptCtx, texts };
}

describe("the payment-code card", () => {
  it("shows exactly: TALIMOON, order, code, status, instruction, talimoon.com/pay — nothing else", () => {
    const { ctx, texts } = recordingCtx();
    drawReceipt(ctx, content);
    const drawn = texts.join("").replace(/\s/g, "");
    const expected = [
      "TALIMOON",
      "BUYURTMA",
      "TAL-2026-0018",
      "TO‘LOV KODI",
      "K7M4P2",
      "To‘lov kutilmoqda",
      "Ushbu kod orqali to‘lovni istalgan vaqtda amalga oshirishingiz mumkin.",
      RECEIPT_SITE,
    ]
      .join("")
      .replace(/\s/g, "");
    expect(drawn).toBe(expected);
  });

  it("carries no private data: its content type has no field for any", () => {
    const { ctx, texts } = recordingCtx();
    const leaky = {
      ...content,
      customerName: "Sherzod",
      childName: "Nodira",
      phone: "+998901234567",
      address: "Toshkent",
      resumeToken: "t".repeat(43),
    } as unknown as ReceiptContent;
    drawReceipt(ctx, leaky);
    const all = texts.join("");
    for (const needle of ["Sherzod", "Nodira", "+998", "Toshkent", "ttttt"]) expect(all).not.toContain(needle);
  });

  it("filename uses the real order code; anything odd is neutralised", () => {
    expect(receiptFileName("TAL-2026-0018")).toBe("TALIMOON-TAL-2026-0018-payment.png");
    expect(receiptFileName("../../etc/passwd")).toBe("TALIMOON-order-payment.png");
    expect(receiptFileName("K7M4P2")).toBe("TALIMOON-order-payment.png");
  });

  it("where the browser cannot draw, rendering throws (the screen then stays with 'Chekni saqlash')", () => {
    // jsdom has no canvas 2D context
    const spy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(() => renderReceiptPng(content)).toThrow();
    spy.mockRestore();
  });
});

describe("starting the save", () => {
  const png = new File(["png"], "TALIMOON-TAL-2026-0018-payment.png", { type: "image/png" });
  const ANDROID = "Mozilla/5.0 (Linux; Android 14; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";
  const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
  const IPAD = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
  const TELEGRAM = `${ANDROID} Telegram-Android/11.0`;

  function env(over: Partial<SaveEnv> = {}): SaveEnv & { share: ReturnType<typeof vi.fn>; download: ReturnType<typeof vi.fn> } {
    return {
      userAgent: ANDROID,
      maxTouchPoints: 5,
      canShareFiles: () => true,
      share: vi.fn(() => Promise.resolve()),
      download: vi.fn(),
      ...over,
    } as never;
  }

  it("Android Chrome: a direct download, started synchronously inside the tap", async () => {
    const e = env();
    const p = startReceiptSave(png, e);
    expect(e.download).toHaveBeenCalledWith(png); // before any await
    expect(e.share).not.toHaveBeenCalled();
    expect(await p).toBe("download");
  });

  it("iPhone / iPad: the native share sheet (Save Image / Save to Files), started inside the tap", async () => {
    for (const ua of [IPHONE, IPAD]) {
      const e = env({ userAgent: ua });
      const p = startReceiptSave(png, e);
      expect(e.share).toHaveBeenCalledWith(png); // before any await
      expect(await p).toBe("shared");
      expect(e.download).not.toHaveBeenCalled();
    }
  });

  it("iPhone: closing the share sheet is 'cancelled' (stay); another share error falls back to a download", async () => {
    const abort = env({ userAgent: IPHONE, share: vi.fn(() => Promise.reject(new DOMException("x", "AbortError"))) });
    expect(await startReceiptSave(png, abort)).toBe("cancelled");
    expect(abort.download).not.toHaveBeenCalled();
    const denied = env({ userAgent: IPHONE, share: vi.fn(() => Promise.reject(new DOMException("x", "NotAllowedError"))) });
    expect(await startReceiptSave(png, denied)).toBe("download");
    expect(denied.download).toHaveBeenCalledTimes(1);
  });

  it("an iPhone without file sharing downloads", async () => {
    const e = env({ userAgent: IPHONE, canShareFiles: () => false });
    expect(await startReceiptSave(png, e)).toBe("download");
  });

  it("in-app browsers (Telegram, Instagram, Facebook, Android WebView) → shown inline, no download attempted", async () => {
    for (const ua of [TELEGRAM, `${IPHONE} Instagram 300.0`, `${ANDROID} [FBAN/FB4A]`, ANDROID.replace("SM-A546B", "SM-A546B; wv")]) {
      const e = env({ userAgent: ua });
      expect(await startReceiptSave(png, e)).toBe("inline");
      expect(e.download).not.toHaveBeenCalled();
      expect(e.share).not.toHaveBeenCalled();
    }
    expect(isInAppBrowser(ANDROID)).toBe(false);
    expect(isIOS(IPAD, 5)).toBe(true);
    expect(isIOS(IPAD, 0)).toBe(false); // a real Mac
  });
});
