import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { PwaInstallPrompt } from "../PwaInstallPrompt";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import {
  ACTIVE_DELAY_MS,
  DISMISSED_KEY,
  DISMISS_COOLDOWN_MS,
  INSTALLED_KEY,
  resetInstallPromptForTests,
} from "@/lib/pwa/installPrompt";

const TITLE = /qurilmangizga saqlang|Save TALIMOON|Сохраните TALIMOON/;
const originalMatchMedia = window.matchMedia;

function mountPrompt() {
  return render(
    <LanguageProvider>
      <PwaInstallPrompt />
    </LanguageProvider>,
  );
}

function fireBeforeInstallPrompt(outcome: "accepted" | "dismissed" = "accepted") {
  const event = new Event("beforeinstallprompt", { cancelable: true }) as Event & {
    prompt: ReturnType<typeof vi.fn>;
    userChoice: Promise<{ outcome: string }>;
  };
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

function passActiveTime() {
  act(() => {
    vi.advanceTimersByTime(ACTIVE_DELAY_MS + 2000);
  });
}

function banner() {
  return screen.queryByText(TITLE);
}

function setStandalone(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: matches && query.includes("standalone"),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout", "Date", "performance"],
  });
  vi.spyOn(document, "hasFocus").mockReturnValue(true);
  resetInstallPromptForTests();
  localStorage.clear();
  sessionStorage.clear();
  window.matchMedia = originalMatchMedia;
});

afterEach(() => {
  resetInstallPromptForTests();
  vi.useRealTimers();
  vi.restoreAllMocks();
  window.matchMedia = originalMatchMedia;
});

describe("PwaInstallPrompt", () => {
  it("shows only after beforeinstallprompt fired and the active-use delay passed", () => {
    mountPrompt();
    const event = fireBeforeInstallPrompt();
    expect(event.defaultPrevented).toBe(true);
    expect(banner()).toBeNull();
    passActiveTime();
    expect(banner()).toBeInTheDocument();
  });

  it("never shows without beforeinstallprompt, however long the visit", () => {
    mountPrompt();
    passActiveTime();
    act(() => {
      vi.advanceTimersByTime(30 * 60 * 1000);
    });
    expect(banner()).toBeNull();
  });

  it("dismiss hides immediately and the banner does not come back in-session", () => {
    mountPrompt();
    fireBeforeInstallPrompt();
    passActiveTime();
    fireEvent.click(screen.getByRole("button", { name: /Yopish|Close|Закрыть/ }));
    expect(banner()).toBeNull();
    expect(Number(localStorage.getItem(DISMISSED_KEY))).toBeGreaterThan(0);

    // The old bug: a 1s interval re-revealed it; a fresh browser event too.
    act(() => {
      vi.advanceTimersByTime(10 * 60 * 1000);
    });
    fireBeforeInstallPrompt();
    passActiveTime();
    expect(banner()).toBeNull();
  });

  it("dismissal persists across remount and a fresh page load", () => {
    const first = mountPrompt();
    fireBeforeInstallPrompt();
    passActiveTime();
    fireEvent.click(screen.getByRole("button", { name: /Yopish|Close|Закрыть/ }));
    first.unmount();

    // Simulate a full reload: module memory gone, storage kept.
    resetInstallPromptForTests();
    sessionStorage.clear();
    mountPrompt();
    fireBeforeInstallPrompt();
    passActiveTime();
    expect(banner()).toBeNull();
  });

  it("shows again only once the dismissal cooldown has expired", () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now() - DISMISS_COOLDOWN_MS - 1000));
    mountPrompt();
    fireBeforeInstallPrompt();
    passActiveTime();
    expect(banner()).toBeInTheDocument();
  });

  it("dismiss still hides when storage throws (in-app browsers, private mode)", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    mountPrompt();
    fireBeforeInstallPrompt();
    passActiveTime();
    fireEvent.click(screen.getByRole("button", { name: /Yopish|Close|Закрыть/ }));
    expect(banner()).toBeNull();
    fireBeforeInstallPrompt();
    passActiveTime();
    expect(banner()).toBeNull();
  });

  it("never shows in standalone (installed) display mode", () => {
    setStandalone(true);
    mountPrompt();
    fireBeforeInstallPrompt();
    passActiveTime();
    expect(banner()).toBeNull();
  });

  it("never shows when iOS navigator.standalone is true", () => {
    Object.defineProperty(navigator, "standalone", { value: true, configurable: true });
    try {
      mountPrompt();
      fireBeforeInstallPrompt();
      passActiveTime();
      expect(banner()).toBeNull();
    } finally {
      delete (navigator as Navigator & { standalone?: boolean }).standalone;
    }
  });

  it("appinstalled hides the banner and permanently suppresses it", () => {
    const first = mountPrompt();
    fireBeforeInstallPrompt();
    passActiveTime();
    expect(banner()).toBeInTheDocument();
    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });
    expect(banner()).toBeNull();
    expect(localStorage.getItem(INSTALLED_KEY)).toBe("1");
    first.unmount();

    // Even far beyond any dismissal cooldown, after a reload.
    resetInstallPromptForTests();
    vi.setSystemTime(Date.now() + 365 * 24 * 60 * 60 * 1000);
    mountPrompt();
    fireBeforeInstallPrompt();
    passActiveTime();
    expect(banner()).toBeNull();
  });

  it("accepting the native install dialog hides and marks installed", async () => {
    mountPrompt();
    const event = fireBeforeInstallPrompt("accepted");
    passActiveTime();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Ilovani o‘rnatish|Install app|Установить/ }));
    });
    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(banner()).toBeNull();
    expect(localStorage.getItem(INSTALLED_KEY)).toBe("1");
  });

  it("declining the native install dialog hides it and starts the cooldown", async () => {
    mountPrompt();
    fireBeforeInstallPrompt("dismissed");
    passActiveTime();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Ilovani o‘rnatish|Install app|Установить/ }));
    });
    expect(banner()).toBeNull();
    expect(Number(localStorage.getItem(DISMISSED_KEY))).toBeGreaterThan(0);
    passActiveTime();
    expect(banner()).toBeNull();
  });

  it("route navigation: one banner, one listener, no reappearance after dismiss", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const { rerender, unmount } = render(
      <LanguageProvider>
        <main>route A</main>
        <PwaInstallPrompt />
      </LanguageProvider>,
    );
    // A second mounted instance (e.g. a nested layout) must not add listeners.
    const second = mountPrompt();
    const bipListeners = addSpy.mock.calls.filter(([type]) => type === "beforeinstallprompt");
    expect(bipListeners).toHaveLength(1);
    second.unmount();

    fireBeforeInstallPrompt();
    passActiveTime();
    rerender(
      <LanguageProvider>
        <main>route B</main>
        <PwaInstallPrompt />
      </LanguageProvider>,
    );
    expect(screen.getAllByText(TITLE)).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /Yopish|Close|Закрыть/ }));
    unmount();
    // Remount as a route change that re-creates the tree would.
    mountPrompt();
    fireBeforeInstallPrompt();
    passActiveTime();
    expect(banner()).toBeNull();
  });

  it("removes its window listeners when the last instance unmounts", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const view = mountPrompt();
    view.unmount();
    const removed = removeSpy.mock.calls.map(([type]) => type);
    expect(removed).toContain("beforeinstallprompt");
    expect(removed).toContain("appinstalled");
  });
});
