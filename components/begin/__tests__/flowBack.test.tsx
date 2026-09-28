import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { FlowBackButton, FlowBackProvider, type FlowBackRegistry } from "../FlowBack";
import EmotionalBridge from "../EmotionalBridge";
import Phase02 from "../Phase02";
import type { ChildProfile } from "@/lib/order/types";

const BACK = { name: /Orqaga|Back|Назад/ };
const NEXT = { name: /Davom etish|Continue|Продолжить/ };

describe("FlowBackButton", () => {
  it("has a 44px touch target and an accessible name", () => {
    render(<FlowBackButton onBack={() => {}} label="Orqaga" />);
    const b = screen.getByRole("button", { name: "Orqaga" });
    expect(b.className).toMatch(/min-h-\[44px\]/);
    expect(b.className).toMatch(/min-w-\[44px\]/);
  });

  it("registers the same action for system Back, always the latest one", () => {
    const registry: FlowBackRegistry = { current: null };
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = render(
      <FlowBackProvider registry={registry}>
        <FlowBackButton onBack={first} label="Orqaga" />
      </FlowBackProvider>,
    );
    rerender(
      <FlowBackProvider registry={registry}>
        <FlowBackButton onBack={second} label="Orqaga" />
      </FlowBackProvider>,
    );
    act(() => registry.current?.());
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    unmount();
    expect(registry.current).toBeNull();
  });

  it("while disabled (order being sent) system Back is swallowed", () => {
    const registry: FlowBackRegistry = { current: null };
    const onBack = vi.fn();
    render(
      <FlowBackProvider registry={registry}>
        <FlowBackButton onBack={onBack} label="Orqaga" disabled />
      </FlowBackProvider>,
    );
    act(() => registry.current?.());
    expect(onBack).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Orqaga" })).toBeDisabled();
  });
});

describe("every form screen uses the one Back control", () => {
  const files = ["Phase01", "Phase02", "Phase03", "EmotionalBridge", "PersonalizedBookOrderForm"];
  for (const f of files) {
    it(`${f} renders <FlowBackButton> (visible + system Back)`, () => {
      const src = readFileSync(resolve(__dirname, `../${f}.tsx`), "utf8");
      expect(src).toMatch(/<FlowBackButton /);
    });
  }

  it("the form re-enters each earlier phase at its END when stepping back", () => {
    const src = readFileSync(resolve(__dirname, "../PersonalizedBookOrderForm.tsx"), "utf8");
    expect(src).toMatch(/setWorldEntry\("end"\)/); // Phase 03 → Phase 02
    expect(src).toMatch(/setCharEntry\("end"\)/); // first step → Phase 03
    expect(src).toMatch(/setHeartEntry\("end"\)/); // photos → heart
  });
});

function Bridge({ onBack, kids: initial }: { onBack: () => void; kids: ChildProfile[] }) {
  const [kids, setKids] = useState(initial);
  return (
    <LanguageProvider>
      <EmotionalBridge
        childrenIn={kids}
        onPatchChild={(id, p) => setKids((ks) => ks.map((k) => (k.id === id ? { ...k, ...p } : k)))}
        onComplete={() => {}}
        onBack={onBack}
      />
    </LanguageProvider>
  );
}

describe("Back walks every screen and keeps the answers", () => {
  it("EmotionalBridge: forward to the end, Back all the way out, one Back per screen, text kept", async () => {
    const u = userEvent.setup();
    const onBack = vi.fn();
    render(<Bridge onBack={onBack} kids={[{ id: "c1", name: "Nodira", age: 7 }]} />);
    await u.click(screen.getByRole("button", NEXT)); // → situation
    await new Promise((r) => setTimeout(r, 60)); // let the heading focus land
    await u.type(screen.getByRole("textbox"), "Yangi maktab");
    // situation → experience → feeling → sensitivity → done
    for (let i = 0; i < 4; i++) {
      await u.click(screen.getByRole("button", NEXT));
      expect(screen.getAllByRole("button", BACK)).toHaveLength(1);
    }
    for (let i = 0; i < 4; i++) await u.click(screen.getByRole("button", BACK));
    expect(screen.getByRole("textbox")).toHaveValue("Yangi maktab");
    await u.click(screen.getByRole("button", BACK)); // → intro
    expect(onBack).not.toHaveBeenCalled();
    await u.click(screen.getByRole("button", BACK)); // → out, to the previous step
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("Phase02 entered with entry='end' (Back from Phase 03) opens on the last child's completion", () => {
    const kids: ChildProfile[] = [
      { id: "a", name: "Ali", age: 6, phase02Done: true },
      { id: "b", name: "Vali", age: 8, phase02Done: true },
    ];
    render(
      <LanguageProvider>
        <Phase02 childrenIn={kids} onPatchChild={() => {}} onComplete={() => {}} onBack={() => {}} entry="end" />
      </LanguageProvider>,
    );
    // the last child's completion screen: no "next child" CTA, no question fieldset
    expect(document.querySelector("fieldset")).toBeNull();
    expect(screen.queryByRole("button", { name: /Ali|Vali/ })).toBeNull();
    expect(screen.getAllByRole("button", BACK)).toHaveLength(1);
  });
});
