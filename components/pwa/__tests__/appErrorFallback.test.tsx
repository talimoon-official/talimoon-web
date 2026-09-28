import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppErrorFallback } from "../AppErrorFallback";
import { resetLifecycleForTests, setReloadForTests } from "@/lib/pwa/lifecycle";

let reload: ReturnType<typeof vi.fn<() => void>>;
beforeEach(() => {
  resetLifecycleForTests();
  sessionStorage.clear();
  reload = vi.fn<() => void>();
  setReloadForTests(reload);
});
afterEach(() => setReloadForTests(null));

const chunk = () => Object.assign(new Error("Loading chunk 42 failed."), { name: "ChunkLoadError" });

describe("AppErrorFallback — no bare white 'Application error' screen", () => {
  it("a stale-build chunk failure recovers automatically, once", async () => {
    render(<AppErrorFallback error={chunk()} />);
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("a second chunk failure right after the recovery shows the manual screen (no loop)", async () => {
    render(<AppErrorFallback error={chunk()} />);
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    resetLifecycleForTests(); // the page reloaded; sessionStorage remembers the attempt
    render(<AppErrorFallback error={chunk()} />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("any other error shows a calm screen with reload + retry, never an auto reload", async () => {
    const retry = vi.fn();
    render(<AppErrorFallback error={new TypeError("x is undefined")} reset={retry} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Sahifani ochib bo‘lmadi");
    expect(screen.getByText(/buyurtmangiz shu qurilmada saqlangan/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Yana urinish" }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalled();
  });
});
