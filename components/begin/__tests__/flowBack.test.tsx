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

  it("Phase02 entered with entry='end' (Back from Phase 03) opens on the last child's LAST QUESTION", async () => {
    const u = userEvent.setup();
    const kids: ChildProfile[] = [
      { id: "a", name: "Ali", age: 6, phase02Done: true, childDream: "Uchuvchi" },
      { id: "b", name: "Vali", age: 8, phase02Done: true, childDream: "Shifokor" },
    ];
    render(
      <LanguageProvider>
        <Phase02 childrenIn={kids} onPatchChild={() => {}} onComplete={() => {}} onBack={() => {}} entry="end" />
      </LanguageProvider>,
    );
    // Vali's dream question — never the removed "dunyosiga ancha yaqinlashdik" bridge
    expect(screen.getByRole("heading", { level: 2 }).textContent).toMatch(/Vali.*kim bo‘lmoqchi/);
    expect(screen.getByDisplayValue("Shifokor")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Vali[a-z]*ning dunyosiga ancha yaqinlashdik/);
    expect(screen.getAllByRole("button", BACK)).toHaveLength(1);
    await u.click(screen.getByRole("button", BACK)); // → Vali's activity question
    expect(screen.getByRole("heading", { level: 2 }).textContent).toMatch(/Vali/);
    expect(screen.queryByDisplayValue("Shifokor")).toBeNull();
  });
});

describe("Phase02 → Phase03: no bridge screen after the last child", () => {
  const BRIDGE = /dunyosiga ancha yaqinlashdik|xarakterini yaxshiroq bilib olamiz/;

  function mountP2(kids: ChildProfile[], extra: Partial<React.ComponentProps<typeof Phase02>> = {}) {
    const onComplete = vi.fn();
    const onPosition = vi.fn();
    render(
      <LanguageProvider>
        <Phase02 childrenIn={kids} onPatchChild={() => {}} onComplete={onComplete} onBack={() => {}} onPosition={onPosition} {...extra} />
      </LanguageProvider>,
    );
    return { onComplete, onPosition };
  }

  it("the last child's dream question continues straight into Character (one click, no bridge)", async () => {
    const u = userEvent.setup();
    const { onComplete, onPosition } = mountP2(
      [{ id: "f", name: "Fayzbek", age: 6, childDream: "Uchuvchi" }],
      { resume: { idx: 0, screen: "dream" } },
    );
    await u.click(screen.getByRole("button", NEXT));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).not.toMatch(BRIDGE);
    // no position was ever reported on the removed screen
    expect(onPosition.mock.calls.map(([p]) => p.screen)).not.toContain("child-done");
  });

  it("between two children the short 'next child' beat stays", async () => {
    const u = userEvent.setup();
    const { onComplete } = mountP2(
      [
        { id: "a", name: "Ali", age: 6, childDream: "Uchuvchi" },
        { id: "b", name: "Vali", age: 8 },
      ],
      { resume: { idx: 0, screen: "dream" } },
    );
    await u.click(screen.getByRole("button", NEXT));
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Vali bilan tanishamiz/ })).toBeInTheDocument();
  });

  it("a stored position on the removed screen reopens on the last real question", () => {
    const { onPosition } = mountP2(
      [{ id: "f", name: "Fayzbek", age: 6, childDream: "Uchuvchi" }],
      { resume: { idx: 0, screen: "child-done" } },
    );
    expect(screen.getByRole("heading", { level: 2 }).textContent).toMatch(/Fayzbek.*kim bo‘lmoqchi/);
    expect(document.body.textContent).not.toMatch(BRIDGE);
    expect(onPosition).toHaveBeenLastCalledWith({ idx: 0, screen: "dream" });
  });
});
