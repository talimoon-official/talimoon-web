/**
 * The saved-order screen: the customer CHOOSES — no timer, no auto-return.
 *   "Hozir to‘lash"    → this order's payment page (resume link), once
 *   "Keyinroq to‘lash" → ONE tap: the payment-code card is drawn from the
 *                        ORIGINAL code, its save starts inside that tap, a
 *                        short confirmation, then the order menu — and only
 *                        after the save started. Failures stay here.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { OrderSaved, LEAVE_AFTER_SAVE_MS } from "../OrderSaved";
import { FlowBackProvider, type FlowBackRegistry } from "../FlowBack";
import { PAYMENT_COPY } from "@/lib/payment/copy";
import { paymentPath } from "@/lib/payment/link";
import type { ReceiptContent, ReceiptSaveOutcome } from "@/lib/payment/receipt";

const c = PAYMENT_COPY.uz;
const RESUME = { token: "t".repeat(43), expiresAt: "2026-10-24T10:00:00.000Z" };
const CODE = { code: "K7M4P2", expiresAt: "2026-10-24T10:00:00.000Z" };
const LATER = { name: "Keyinroq to‘lash" };
const NOW = { name: "Hozir to‘lash" };

let fetchSpy: ReturnType<typeof vi.fn>;
let setItem: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.useFakeTimers();
  fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  setItem = vi.spyOn(Storage.prototype, "setItem");
  URL.createObjectURL = vi.fn(() => "blob:receipt");
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function mount(props: Partial<Parameters<typeof OrderSaved>[0]> = {}) {
  const navigate = vi.fn();
  const onReturnToMenu = vi.fn();
  const file = new File(["png"], "TALIMOON-TAL-2026-0142-payment.png", { type: "image/png" });
  const renderReceipt = vi.fn<(c: ReceiptContent) => File>(() => file);
  const save = deferred<ReceiptSaveOutcome>();
  const saveReceipt = vi.fn<(f: File) => Promise<ReceiptSaveOutcome>>(() => save.promise);
  const utils = render(
    <OrderSaved
      orderCode="TAL-2026-0142"
      resume={RESUME}
      paymentCode={CODE}
      copy={c}
      locale="uz"
      navigate={navigate}
      onReturnToMenu={onReturnToMenu}
      renderReceipt={renderReceipt}
      saveReceipt={saveReceipt}
      {...props}
    />,
  );
  return { navigate, onReturnToMenu, renderReceipt, saveReceipt, save, file, ...utils };
}

const flush = () => act(async () => void (await Promise.resolve()));

describe("A. the saved screen waits for the customer", () => {
  it("no countdown, no auto-return — even after 10 minutes; the code stays visible", () => {
    const { onReturnToMenu, navigate } = mount();
    act(() => void vi.advanceTimersByTime(10 * 60_000));
    expect(onReturnToMenu).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByTestId("payment-code-card").textContent?.replace(/\s/g, "")).toContain("K7M4P2");
    expect(screen.getByRole("button", NOW)).toBeEnabled();
    expect(screen.getByRole("button", LATER)).toBeEnabled();
    expect(document.body.textContent).not.toMatch(/soniyadan so‘ng/);
  });

  it("the source has no auto-return timer any more", () => {
    const src = readFileSync(resolve(__dirname, "../OrderSaved.tsx"), "utf8");
    expect(src).not.toMatch(/AUTO_RETURN_SECONDS|secondsLeft|autoReturn/);
  });

  it("system Back still returns to the menu (never the form), once", () => {
    const registry: FlowBackRegistry = { current: null };
    const onReturnToMenu = vi.fn();
    render(
      <FlowBackProvider registry={registry}>
        <OrderSaved orderCode="TAL-1" resume={RESUME} paymentCode={CODE} copy={c} locale="uz" navigate={vi.fn()} onReturnToMenu={onReturnToMenu} />
      </FlowBackProvider>,
    );
    act(() => registry.current?.());
    act(() => registry.current?.());
    expect(onReturnToMenu).toHaveBeenCalledTimes(1);
  });
});

describe("B. Hozir to‘lash", () => {
  it("opens THIS order's payment page through the resume link — no code re-entry, no backend call, once", () => {
    const { navigate, saveReceipt } = mount();
    fireEvent.click(screen.getByRole("button", NOW));
    fireEvent.click(screen.getByRole("button", NOW)); // double tap
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(paymentPath(RESUME.token));
    expect(navigate.mock.calls[0]![0]).not.toMatch(/\?|K7M4P2|\/pay$/);
    expect(screen.getByRole("button", LATER)).toBeDisabled();
    fireEvent.click(screen.getByRole("button", LATER));
    expect(saveReceipt).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("C. Keyinroq to‘lash — one tap", () => {
  it("draws the card from the ORIGINAL code, starts the save INSIDE the tap, confirms, then returns to the menu", async () => {
    const { renderReceipt, saveReceipt, save, onReturnToMenu, navigate, file } = mount();
    fireEvent.click(screen.getByRole("button", LATER));

    // synchronously, within the same tap
    expect(renderReceipt).toHaveBeenCalledTimes(1);
    expect(renderReceipt.mock.calls[0]![0]).toEqual({
      orderCode: "TAL-2026-0142",
      paymentCode: "K7M4P2",
      labels: {
        order: "Buyurtma",
        code: "To‘lov kodi",
        status: "To‘lov kutilmoqda",
        instruction: "Ushbu kod orqali to‘lovni istalgan vaqtda amalga oshirishingiz mumkin.",
      },
    });
    expect(saveReceipt).toHaveBeenCalledTimes(1);
    expect(saveReceipt).toHaveBeenCalledWith(file);

    // nothing leaves before the save has started
    act(() => void vi.advanceTimersByTime(5000));
    expect(onReturnToMenu).not.toHaveBeenCalled();

    save.resolve("download");
    await flush();
    expect(screen.getByRole("status").textContent).toBe(c.laterConfirm);
    expect(c.laterConfirm).toMatch(/tayyorlandi\.$/); // truthful: never claims "saqlandi"
    expect(onReturnToMenu).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(LEAVE_AFTER_SAVE_MS));
    expect(onReturnToMenu).toHaveBeenCalledTimes(1);
    expect(LEAVE_AFTER_SAVE_MS).toBeGreaterThanOrEqual(500);
    expect(LEAVE_AFTER_SAVE_MS).toBeLessThanOrEqual(1500);

    expect(navigate).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled(); // no finalize, no code, no order
    for (const call of setItem.mock.calls) {
      expect(String(call[1])).not.toContain("K7M4P2");
      expect(String(call[1])).not.toContain(RESUME.token);
    }
  });

  it("the iPhone share sheet completing counts as started too", async () => {
    const { save, onReturnToMenu } = mount();
    fireEvent.click(screen.getByRole("button", LATER));
    save.resolve("shared");
    await flush();
    act(() => void vi.advanceTimersByTime(LEAVE_AFTER_SAVE_MS));
    expect(onReturnToMenu).toHaveBeenCalledTimes(1);
  });

  it("in an in-app browser the card is shown inline — no auto-return", async () => {
    const { save, onReturnToMenu } = mount();
    fireEvent.click(screen.getByRole("button", LATER));
    save.resolve("inline");
    await flush();
    const img = screen.getByRole("img", { name: c.receiptAlt });
    expect(img).toHaveAttribute("src", "blob:receipt");
    expect(screen.getByText(new RegExp(c.receiptInAppHint.slice(0, 20)))).toBeInTheDocument();
    act(() => void vi.advanceTimersByTime(10 * 60_000));
    expect(onReturnToMenu).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: c.returnToMenu }));
    expect(onReturnToMenu).toHaveBeenCalledTimes(1);
  });

  it("the default leave goes to the canonical order menu", async () => {
    const navigate = vi.fn();
    const save = deferred<ReceiptSaveOutcome>();
    render(
      <OrderSaved
        orderCode="TAL-2026-0142"
        resume={RESUME}
        paymentCode={CODE}
        copy={c}
        locale="uz"
        navigate={navigate}
        renderReceipt={() => new File(["x"], "r.png", { type: "image/png" })}
        saveReceipt={() => save.promise}
      />,
    );
    fireEvent.click(screen.getByRole("button", LATER));
    save.resolve("download");
    await flush();
    act(() => void vi.advanceTimersByTime(LEAVE_AFTER_SAVE_MS));
    expect(navigate).toHaveBeenCalledWith("/begin/personalized-book");
  });
});

describe("E. failure never leaves the screen", () => {
  it("the card cannot be drawn: stay, code visible, 'Chekni saqlash' offered, Hozir to‘lash still works", () => {
    const { onReturnToMenu, navigate } = mount({
      renderReceipt: () => {
        throw new Error("canvas unavailable");
      },
    });
    fireEvent.click(screen.getByRole("button", LATER));
    act(() => void vi.advanceTimersByTime(60_000));
    expect(onReturnToMenu).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe(c.receiptFailed);
    expect(screen.getByRole("button", { name: c.saveReceipt })).toBeEnabled();
    expect(screen.getByTestId("payment-code-card").textContent?.replace(/\s/g, "")).toContain("K7M4P2");
    fireEvent.click(screen.getByRole("button", NOW));
    expect(navigate).toHaveBeenCalledWith(paymentPath(RESUME.token));
  });

  it("the save could not start (or the share sheet was closed): stay; 'Chekni saqlash' retries with the SAME card", async () => {
    const { save, saveReceipt, renderReceipt, onReturnToMenu, file } = mount();
    fireEvent.click(screen.getByRole("button", LATER));
    save.resolve("cancelled");
    await flush();
    act(() => void vi.advanceTimersByTime(60_000));
    expect(onReturnToMenu).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();

    saveReceipt.mockImplementationOnce(() => Promise.resolve("download"));
    fireEvent.click(screen.getByRole("button", { name: c.saveReceipt }));
    expect(saveReceipt).toHaveBeenCalledTimes(2);
    expect(saveReceipt.mock.calls[1]![0]).toBe(file); // same card, never a new code
    expect(renderReceipt).toHaveBeenCalledTimes(1);
    await flush();
    act(() => void vi.advanceTimersByTime(LEAVE_AFTER_SAVE_MS));
    expect(onReturnToMenu).toHaveBeenCalledTimes(1);
  });

  it("a save that throws / rejects stays too", async () => {
    const { save, onReturnToMenu } = mount();
    fireEvent.click(screen.getByRole("button", LATER));
    save.reject(new Error("blocked"));
    await flush();
    act(() => void vi.advanceTimersByTime(60_000));
    expect(onReturnToMenu).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: c.saveReceipt })).toBeInTheDocument();
  });
});

describe("F. double taps", () => {
  it("Keyinroq to‘lash twice: one card, one save, one return; Hozir to‘lash locked meanwhile", async () => {
    const { renderReceipt, saveReceipt, save, onReturnToMenu, navigate } = mount();
    fireEvent.click(screen.getByRole("button", LATER));
    fireEvent.click(screen.getByRole("button", { name: c.receiptWorking }));
    expect(screen.getByRole("button", NOW)).toBeDisabled();
    fireEvent.click(screen.getByRole("button", NOW));
    expect(renderReceipt).toHaveBeenCalledTimes(1);
    expect(saveReceipt).toHaveBeenCalledTimes(1);
    save.resolve("download");
    await flush();
    act(() => void vi.advanceTimersByTime(LEAVE_AFTER_SAVE_MS * 3));
    expect(onReturnToMenu).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("leaving the screen cancels the pending return", async () => {
    const { save, onReturnToMenu, unmount } = mount();
    fireEvent.click(screen.getByRole("button", LATER));
    save.resolve("download");
    await flush();
    unmount();
    act(() => void vi.advanceTimersByTime(LEAVE_AFTER_SAVE_MS * 2));
    expect(onReturnToMenu).not.toHaveBeenCalled();
  });
});

describe("G. localization", () => {
  it("every new text exists in UZ / RU / EN — no raw keys", () => {
    const keys = [
      "receiptOrderLabel",
      "receiptCodeLabel",
      "receiptInstruction",
      "receiptAlt",
      "receiptWorking",
      "laterConfirm",
      "saveReceipt",
      "receiptFailed",
      "receiptInAppHint",
      "returnToMenu",
    ] as const;
    for (const l of ["uz", "en", "ru"] as const) {
      for (const k of keys) {
        const v = PAYMENT_COPY[l][k];
        expect(typeof v === "string" && v.length > 2, `${l}.${k}`).toBe(true);
        expect(v).not.toMatch(/^[a-z]+[A-Z][a-zA-Z]+$/); // not a key name
      }
      expect("autoReturn" in PAYMENT_COPY[l]).toBe(false);
    }
    expect(PAYMENT_COPY.uz.saveReceipt).toBe("Chekni saqlash");
    expect(PAYMENT_COPY.ru.saveReceipt).toBe("Сохранить чек");
    expect(PAYMENT_COPY.en.saveReceipt).toBe("Save the receipt");
  });
});

describe("saved order state is protected", () => {
  const form = readFileSync(resolve(__dirname, "../PersonalizedBookOrderForm.tsx"), "utf8");
  it("the draft is dropped the moment the order is finalized, before the saved screen", () => {
    const fin = form.indexOf("() => finalizeOrder(");
    const clear = form.indexOf("await saver.seal();", fin);
    const setSaved = form.indexOf("setSaved({", fin);
    expect(fin).toBeGreaterThan(0);
    expect(clear).toBeGreaterThan(fin);
    expect(clear).toBeLessThan(setSaved);
  });
});
