import { describe, it, expect, vi, afterEach } from "vitest";
import { clearFormDraft, peekFormDraft, saveFormDraft } from "../formDraft";
import { consumeReturnedToMenu, markReturnedToMenu } from "../menuReturn";

afterEach(() => {
  clearFormDraft();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("form draft (memory only)", () => {
  it("keeps the latest progress until cleared", () => {
    saveFormDraft({ step: 1 });
    saveFormDraft({ step: 2 });
    expect(peekFormDraft()).toEqual({ step: 2 });
    expect(peekFormDraft()).toEqual({ step: 2 }); // peek does not consume
    clearFormDraft();
    expect(peekFormDraft()).toBeUndefined();
  });

  it("never touches browser storage", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    saveFormDraft({ phone: "+998901234567" });
    expect(setItem).not.toHaveBeenCalled();
  });

  it("expires an abandoned draft", () => {
    vi.useFakeTimers();
    saveFormDraft({ step: 3 });
    vi.advanceTimersByTime(2 * 60 * 60 * 1000 + 1);
    expect(peekFormDraft()).toBeUndefined();
  });
});

describe("menu-return signal", () => {
  it("is one-shot", () => {
    expect(consumeReturnedToMenu()).toBe(false);
    markReturnedToMenu();
    expect(consumeReturnedToMenu()).toBe(true);
    expect(consumeReturnedToMenu()).toBe(false);
  });
});
