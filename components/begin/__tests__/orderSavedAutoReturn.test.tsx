import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { OrderSaved, AUTO_RETURN_SECONDS } from "../OrderSaved";
import { FlowBackProvider, type FlowBackRegistry } from "../FlowBack";
import { PAYMENT_COPY } from "@/lib/payment/copy";
import { ENTRY_PATH } from "@/lib/order/paths";

const c = PAYMENT_COPY.uz;
const RESUME = { token: "t".repeat(43), expiresAt: "2026-10-24T10:00:00.000Z" };
const CODE = { code: "K7M4P2", expiresAt: "2026-10-24T10:00:00.000Z" };

let fetchSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.useFakeTimers();
  fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mount(props: Partial<Parameters<typeof OrderSaved>[0]> = {}) {
  const navigate = vi.fn();
  const onReturnToMenu = vi.fn();
  const utils = render(
    <OrderSaved
      orderCode="TAL-2026-0142"
      resume={RESUME}
      paymentCode={CODE}
      copy={c}
      locale="uz"
      navigate={navigate}
      onReturnToMenu={onReturnToMenu}
      {...props}
    />,
  );
  return { navigate, onReturnToMenu, ...utils };
}

/** one second at a time, letting React re-render between ticks */
function tick(seconds: number) {
  for (let i = 0; i < seconds; i++) act(() => void vi.advanceTimersByTime(1000));
}

const line = (n: number) => `${n} soniyadan so‘ng buyurtmalar menyusiga qaytasiz.`;

describe("OrderSaved — 10-second return to the order menu", () => {
  it("shows the saved screen with codes, both actions and a quiet 10-second countdown", () => {
    mount();
    expect(screen.getByRole("heading", { name: "Buyurtmangiz saqlandi" })).toBeInTheDocument();
    expect(screen.getByText("TAL-2026-0142")).toBeInTheDocument();
    expect(screen.getByTestId("payment-code-card").textContent?.replace(/\s/g, "")).toContain("K7M4P2");
    expect(screen.getByRole("button", { name: "Hozir to‘lash" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keyinroq to‘lash" })).toBeInTheDocument();
    const countdown = screen.getByText(line(10));
    // not announced on every tick, no alarming progress bar
    expect(countdown.closest("[aria-live]")).toBeNull();
    expect(document.querySelector("[role=progressbar]")).toBeNull();
    expect(AUTO_RETURN_SECONDS).toBe(10);
  });

  it("counts 10 → 1 and then returns to the menu exactly once", () => {
    const { onReturnToMenu } = mount();
    tick(1);
    expect(screen.getByText(line(9))).toBeInTheDocument();
    tick(8);
    expect(screen.getByText(line(1))).toBeInTheDocument();
    expect(onReturnToMenu).not.toHaveBeenCalled();
    tick(1);
    expect(onReturnToMenu).toHaveBeenCalledTimes(1);
    tick(30);
    expect(onReturnToMenu).toHaveBeenCalledTimes(1);
  });

  it("defaults to the canonical order-entry route", () => {
    const { navigate } = mount({ onReturnToMenu: undefined });
    tick(10);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(ENTRY_PATH);
    expect(ENTRY_PATH).toBe("/begin/personalized-book");
  });

  it("'Hozir to‘lash' cancels the timer and continues into payment", () => {
    const { navigate, onReturnToMenu } = mount();
    tick(3);
    fireEvent.click(screen.getByRole("button", { name: "Hozir to‘lash" }));
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0]![0]).toMatch(/#p_/);
    tick(20);
    expect(onReturnToMenu).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("'Keyinroq to‘lash' cancels the timer, keeps pay-later, and offers the way back", () => {
    const { onReturnToMenu } = mount();
    tick(4);
    fireEvent.click(screen.getByRole("button", { name: "Keyinroq to‘lash" }));
    expect(screen.getByRole("heading", { name: "To‘lov kutilmoqda" })).toBeInTheDocument();
    tick(20);
    expect(onReturnToMenu).not.toHaveBeenCalled();
    expect(screen.queryByText(/soniyadan so‘ng/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Buyurtmalar menyusiga qaytish" }));
    expect(onReturnToMenu).toHaveBeenCalledTimes(1);
  });

  it("copying the payment code also counts as an action", () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    const { onReturnToMenu } = mount();
    fireEvent.click(screen.getByRole("button", { name: c.copyCode }));
    tick(15);
    expect(onReturnToMenu).not.toHaveBeenCalled();
  });

  it("unmount cancels the timer — no redirect fires later", () => {
    const { onReturnToMenu, unmount } = mount();
    tick(5);
    unmount();
    tick(30);
    expect(onReturnToMenu).not.toHaveBeenCalled();
  });

  it("pauses while the app is in the background, resumes when it is back", () => {
    const { onReturnToMenu } = mount();
    tick(6);
    const vis = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    tick(60);
    expect(onReturnToMenu).not.toHaveBeenCalled();
    vis.mockReturnValue("visible");
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    expect(screen.getByText(line(4))).toBeInTheDocument();
    tick(4);
    expect(onReturnToMenu).toHaveBeenCalledTimes(1);
  });

  it("system Back on the saved screen returns to the menu (never the form), once", () => {
    const registry: FlowBackRegistry = { current: null };
    const onReturnToMenu = vi.fn();
    render(
      <FlowBackProvider registry={registry}>
        <OrderSaved
          orderCode="TAL-1"
          resume={RESUME}
          copy={c}
          locale="uz"
          navigate={vi.fn()}
          onReturnToMenu={onReturnToMenu}
        />
      </FlowBackProvider>,
    );
    act(() => registry.current?.());
    tick(20);
    expect(onReturnToMenu).toHaveBeenCalledTimes(1);
  });

  it("the no-link state is not a dead end either", () => {
    const { onReturnToMenu } = mount({ resume: null, paymentCode: null });
    expect(screen.getByText(c.savedNoLink)).toBeInTheDocument();
    tick(10);
    expect(onReturnToMenu).toHaveBeenCalledTimes(1);
  });

  it("returning to the menu creates / resubmits nothing", () => {
    mount();
    tick(10);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("all three locales have the countdown and menu copy", () => {
    expect(PAYMENT_COPY.en.autoReturn(1)).toBe("You’ll return to the order menu in 1 second.");
    expect(PAYMENT_COPY.en.autoReturn(5)).toMatch(/5 seconds/);
    expect(PAYMENT_COPY.ru.autoReturn(3)).toMatch(/3 сек/);
    for (const l of ["uz", "en", "ru"] as const) expect(PAYMENT_COPY[l].returnToMenu).toBeTruthy();
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
