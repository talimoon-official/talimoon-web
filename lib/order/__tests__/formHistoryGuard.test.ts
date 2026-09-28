import { describe, it, expect, vi } from "vitest";
import { createFormHistoryGuard, GUARD_MARKER } from "../formHistoryGuard";

/** A tiny browser-history model: a stack, a cursor, popstate on back/go. */
function fakeBrowser(initial: unknown[] = ["prev", { page: "form" }]) {
  const entries: unknown[] = [...initial];
  let index = entries.length - 1;
  const listeners = new Set<(e: PopStateEvent) => void>();
  const pop = () => {
    for (const l of [...listeners]) l({ state: entries[index] } as PopStateEvent);
  };
  const history = {
    get state() {
      return entries[index];
    },
    pushState(data: unknown) {
      entries.splice(index + 1);
      entries.push(data);
      index = entries.length - 1;
    },
    back() {
      history.go(-1);
    },
    go(delta: number) {
      index = Math.max(0, Math.min(entries.length - 1, index + delta));
      pop();
    },
  };
  const target = {
    addEventListener: (_: "popstate", fn: (e: PopStateEvent) => void) => void listeners.add(fn),
    removeEventListener: (_: "popstate", fn: (e: PopStateEvent) => void) => void listeners.delete(fn),
  };
  return { history, target, entries, current: () => index, listeners };
}

const isGuard = (s: unknown) => typeof s === "object" && s !== null && GUARD_MARKER in s;
const noop = () => {};

describe("form history guard — browser / system Back inside the form", () => {
  it("adds exactly one guard entry on mount", () => {
    const b = fakeBrowser();
    createFormHistoryGuard({ history: b.history, target: b.target, onSystemBack: noop, fallbackLeave: null });
    expect(b.entries).toHaveLength(3);
    expect(isGuard(b.entries[2])).toBe(true);
  });

  it("never stacks a second guard entry (reload on it / StrictMode remount)", () => {
    const b = fakeBrowser();
    const g1 = createFormHistoryGuard({ history: b.history, target: b.target, onSystemBack: noop, fallbackLeave: null });
    g1.dispose();
    createFormHistoryGuard({ history: b.history, target: b.target, onSystemBack: noop, fallbackLeave: null });
    expect(b.entries).toHaveLength(3);
  });

  it("system Back runs the screen's Back action and re-arms — the stack never grows", () => {
    const b = fakeBrowser();
    const onSystemBack = vi.fn();
    createFormHistoryGuard({ history: b.history, target: b.target, onSystemBack, fallbackLeave: null });
    for (let i = 0; i < 5; i++) b.history.back();
    expect(onSystemBack).toHaveBeenCalledTimes(5);
    expect(b.entries).toHaveLength(3);
    expect(b.current()).toBe(2);
  });

  it("system Back at the form root leaves to the previous page in ONE step", () => {
    const b = fakeBrowser();
    const g = createFormHistoryGuard({
      history: b.history,
      target: b.target,
      onSystemBack: () => g.leave(),
      fallbackLeave: null,
    });
    b.history.back();
    expect(b.entries[b.current()]).toBe("prev");
  });

  it("the visible root Back steps over the form + guard when pricing is behind it", () => {
    const b = fakeBrowser();
    const g = createFormHistoryGuard({ history: b.history, target: b.target, onSystemBack: noop, fallbackLeave: null });
    g.leave();
    expect(b.entries[b.current()]).toBe("prev");
  });

  it("the visible root Back uses the fallback (replace) after a direct landing — once", () => {
    const b = fakeBrowser();
    const fallback = vi.fn();
    const g = createFormHistoryGuard({ history: b.history, target: b.target, onSystemBack: noop, fallbackLeave: fallback });
    g.leave();
    g.leave();
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it("after release (leaving for the menu) popstate does nothing and nothing is re-pushed", () => {
    const b = fakeBrowser();
    const onSystemBack = vi.fn();
    const g = createFormHistoryGuard({ history: b.history, target: b.target, onSystemBack, fallbackLeave: null });
    g.release();
    b.history.back();
    expect(onSystemBack).not.toHaveBeenCalled();
    expect(b.entries).toHaveLength(3);
  });

  it("dispose removes the listener (no handler survives the route)", () => {
    const b = fakeBrowser();
    const g = createFormHistoryGuard({ history: b.history, target: b.target, onSystemBack: noop, fallbackLeave: null });
    expect(b.listeners.size).toBe(1);
    g.dispose();
    expect(b.listeners.size).toBe(0);
  });

  it("moving Forward onto the guard entry is ignored", () => {
    const b = fakeBrowser();
    const onSystemBack = vi.fn();
    const g = createFormHistoryGuard({ history: b.history, target: b.target, onSystemBack, fallbackLeave: null });
    g.release(); // step onto the plain entry without the guard reacting
    b.history.go(-1);
    const g2 = createFormHistoryGuard({ history: b.history, target: b.target, onSystemBack, fallbackLeave: null });
    g.dispose();
    b.history.go(1);
    expect(onSystemBack).not.toHaveBeenCalled();
    g2.dispose();
  });
});
