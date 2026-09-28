import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { memoryStorage, readDraft, setDraftStorage, type DraftStorage } from "@/lib/order/formDraft";
import { emptyForm, type FormData } from "../PersonalizedBookOrderForm";
import { STEPS } from "../orderFormData";
import {
  NEVER_PERSISTED,
  createDraftSaver,
  restoreOrderDraft,
  toPersisted,
  type OrderDraft,
} from "../orderDraft";
import { resolveDraftLoad } from "@/app/begin/personalized-book/form/PersonalizedBookFormRoute";
import Phase01, { type Phase01Snapshot } from "../Phase01";
import EmotionalBridge from "../EmotionalBridge";
import type { SubPosition } from "../flowPosition";
import type { ChildProfile } from "@/lib/order/types";

const photo = (n: string) => new File(["x"], n, { type: "image/jpeg" });

function filledForm(): FormData {
  const f = emptyForm("UZ");
  return {
    ...f,
    orderer: { ...f.orderer, honorific: "mr", name: "Sherzod", phone: "+998901234567" },
    children: [{ id: "c1", name: "Nodira", age: 7, phase02Done: true, photos: [photo("a.jpg"), photo("b.jpg"), photo("c.jpg")] }],
    personalMessage: "Seni yaxshi ko‘ramiz",
    keepsakeRelationship: "father",
    storyGiverDisplayName: "Sherzod",
    keepsakeWantsVoice: true,
    specialPhoto: photo("keepsake.jpg"),
    bookLanguageCode: "uz" as FormData["bookLanguageCode"],
    consentAuthority: true,
    consentPrivacy: true,
    consentTerms: true,
    consentDrawnSignature: '{"strokes":[[1,2,3]]}',
  };
}

function draftOf(data: FormData, extra: Partial<OrderDraft> = {}): OrderDraft {
  return {
    bookType: "single",
    data: toPersisted(data),
    phase: "steps",
    stepIndex: 2,
    marketTouched: false,
    phase01Seeded: true,
    ...extra,
  };
}

let store: DraftStorage;
beforeEach(() => {
  store = memoryStorage();
  setDraftStorage(store);
});
afterEach(() => {
  setDraftStorage(null);
  vi.useRealTimers();
});

describe("what is persisted", () => {
  it("never persists consent ticks or the signature", () => {
    const p = toPersisted(filledForm()) as Record<string, unknown>;
    for (const k of NEVER_PERSISTED) expect(k in p).toBe(false);
    expect(p.orderer).toBeDefined();
    expect((p.children as ChildProfile[])[0]!.photos).toHaveLength(3);
  });

  it("no payment / access / capability token ever reaches storage", async () => {
    vi.useFakeTimers();
    const saver = createDraftSaver(100);
    saver.schedule(draftOf(filledForm()));
    vi.advanceTimersByTime(100);
    await vi.waitFor(async () => expect(await readDraft("personalized-book")).toBeDefined());
    const raw = await store.get("personalized-book");
    const text = JSON.stringify(raw);
    for (const needle of ["token", "capability", "paymentCode", "resume", "idempotency", "consentDrawnSignature", "consentTerms", "turnstile"]) {
      expect(text.toLowerCase()).not.toContain(needle.toLowerCase());
    }
  });

  it("the form never hands tokens / the saved order to the draft", () => {
    const form = readFileSync(resolve(__dirname, "../PersonalizedBookOrderForm.tsx"), "utf8");
    const call = form.slice(form.indexOf("saver.schedule({"), form.indexOf("});", form.indexOf("saver.schedule({")));
    expect(call).not.toMatch(/orderSession|capabilityToken|idempotency|saved|resume|paymentCode|turnstile/i);
  });
});

describe("restore", () => {
  it("restores the exact step, answers and files — consent always fresh", () => {
    const stored = draftOf(filledForm(), { stepIndex: 2, pos: undefined });
    const r = restoreOrderDraft(stored, emptyForm(), STEPS.length)!;
    expect(r.phase).toBe("steps");
    expect(r.stepIndex).toBe(2);
    expect(r.data.orderer.name).toBe("Sherzod");
    expect(r.data.orderer.phone).toBe("+998901234567");
    expect(r.data.children[0]!.name).toBe("Nodira");
    expect(r.data.children[0]!.photos).toHaveLength(3);
    expect(r.data.specialPhoto).toBeInstanceOf(Blob);
    expect(r.data.personalMessage).toBe("Seni yaxshi ko‘ramiz");
    expect(r.data.consentTerms).toBe(false);
    expect(r.data.consentDrawnSignature).toBe("");
  });

  it("clamps a stale step index and a stale child index", () => {
    const r = restoreOrderDraft(
      draftOf(filledForm(), { phase: "world", stepIndex: 99, pos: { idx: 7, screen: "dream" } }),
      emptyForm(),
      STEPS.length,
    )!;
    expect(r.stepIndex).toBe(STEPS.length - 1);
    expect(r.pos).toEqual({ idx: 0, screen: "dream" });
  });

  it("a draft that never finished Phase 01 always reopens in Phase 01", () => {
    const r = restoreOrderDraft(
      draftOf(filledForm(), { phase: "steps", phase01Seeded: false }),
      emptyForm(),
      STEPS.length,
    )!;
    expect(r.phase).toBe("intro");
  });

  it("garbage / foreign shapes return null instead of throwing", () => {
    for (const bad of [null, 1, "x", {}, { data: {} }, { data: { children: [] } }, { data: { children: [{ nope: 1 }] } }]) {
      expect(restoreOrderDraft(bad, emptyForm(), STEPS.length)).toBeNull();
    }
  });

  it("mistyped fields fall back to defaults", () => {
    const stored = draftOf(filledForm()) as unknown as { data: Record<string, unknown> };
    stored.data.copies = "many";
    stored.data.market = "MARS";
    stored.data.personalMessage = 42;
    const r = restoreOrderDraft(stored, emptyForm(), STEPS.length)!;
    expect(r.data.copies).toBe(1);
    expect(r.data.market).toBe("UZ");
    expect(r.data.personalMessage).toBe("");
  });
});

describe("book-type scoping (route)", () => {
  const single = draftOf(filledForm(), { bookType: "single" });
  it("same (or no) chosen type → restore without asking", () => {
    expect(resolveDraftLoad(single, "single")).toMatchObject({ ask: false, discard: false });
    expect(resolveDraftLoad(single, undefined).restored?.data.orderer.name).toBe("Sherzod");
  });
  it("a DIFFERENT chosen type never silently reuses the draft — the customer is asked", () => {
    const r = resolveDraftLoad(single, "multi");
    expect(r.ask).toBe(true);
  });
  it("an unreadable draft is discarded", () => {
    expect(resolveDraftLoad({ junk: true }, "single")).toEqual({ restored: null, ask: false, discard: true });
    expect(resolveDraftLoad(undefined, "single")).toEqual({ restored: null, ask: false, discard: false });
  });
});

describe("debounced saver", () => {
  it("many edits → one write after the quiet period", async () => {
    vi.useFakeTimers();
    const put = vi.spyOn(store, "put");
    const saver = createDraftSaver(800);
    for (let i = 0; i < 20; i++) saver.schedule(draftOf(filledForm(), { stepIndex: i % 3 }));
    expect(put).not.toHaveBeenCalled();
    vi.advanceTimersByTime(799);
    expect(put).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    await vi.waitFor(() => expect(put).toHaveBeenCalledTimes(1));
  });

  it("flush writes the pending edit now (page hidden / PWA backgrounded)", async () => {
    const put = vi.spyOn(store, "put");
    const saver = createDraftSaver(10_000);
    saver.schedule(draftOf(filledForm()));
    saver.flush();
    await vi.waitFor(() => expect(put).toHaveBeenCalledTimes(1));
  });

  it("seal (order saved) deletes the draft and blocks any later write", async () => {
    vi.useFakeTimers();
    const saver = createDraftSaver(500);
    saver.schedule(draftOf(filledForm()));
    vi.advanceTimersByTime(500);
    await vi.waitFor(async () => expect(await store.get("personalized-book")).toBeDefined());
    saver.schedule(draftOf(filledForm(), { stepIndex: 3 })); // a late edit pending
    await saver.seal();
    vi.advanceTimersByTime(5000);
    saver.schedule(draftOf(filledForm()));
    saver.flush();
    vi.advanceTimersByTime(5000);
    await Promise.resolve();
    expect(await store.get("personalized-book")).toBeUndefined();
  });

  it("when storage is full, the answers are still kept without the media", async () => {
    let calls = 0;
    const kept: unknown[] = [];
    setDraftStorage({
      get: async () => kept.at(-1),
      put: async (_k, v) => {
        calls++;
        if (calls === 1) throw new DOMException("full", "QuotaExceededError");
        kept.push(v);
      },
      delete: async () => {},
    });
    const saver = createDraftSaver(0);
    saver.schedule(draftOf(filledForm()));
    saver.flush();
    await vi.waitFor(() => expect(kept).toHaveLength(1));
    const payload = (kept[0] as { payload: OrderDraft }).payload;
    expect(payload.data.orderer.name).toBe("Sherzod");
    expect(payload.data.children[0]!.photos).toEqual([]);
    expect(payload.data.specialPhoto).toBeNull();
  });

  it("the form seals the draft right after finalize, before the saved screen", () => {
    const form = readFileSync(resolve(__dirname, "../PersonalizedBookOrderForm.tsx"), "utf8");
    const fin = form.indexOf("await finalizeOrder(");
    const seal = form.indexOf("await saver.seal();", fin);
    expect(fin).toBeGreaterThan(0);
    expect(seal).toBeGreaterThan(fin);
    expect(seal).toBeLessThan(form.indexOf("setSaved({", fin));
  });
});

// ── remount recovery (reload / PWA restart = the component tree starts over)

function Phase01Harness({ resume, onSnap }: { resume?: unknown; onSnap: (s: Phase01Snapshot) => void }) {
  return (
    <LanguageProvider>
      <Phase01 onBack={() => {}} onComplete={() => {}} resume={resume} onSnapshot={onSnap} />
    </LanguageProvider>
  );
}

describe("remount recovery", () => {
  it("Phase 01: reopens on the same question with the same answers", async () => {
    const u = userEvent.setup();
    let snap: Phase01Snapshot | null = null;
    const first = render(<Phase01Harness onSnap={(s) => (snap = s)} />);
    await u.click(screen.getByRole("button", { name: "Janob" }));
    await u.type(screen.getByRole("textbox"), "Sherzod");
    await u.click(screen.getByRole("button", { name: /Davom etish/ }));
    expect(screen.getByRole("heading", { name: /kim uchun tayyorlayapsiz/ })).toBeInTheDocument();
    first.unmount();

    // the stored snapshot goes through storage and back
    const stored = JSON.parse(JSON.stringify(snap));
    render(<Phase01Harness resume={stored} onSnap={() => {}} />);
    expect(screen.getByRole("heading", { name: /kim uchun tayyorlayapsiz/ })).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: /Orqaga/ }));
    expect(screen.getByRole("textbox")).toHaveValue("Sherzod");
  });

  it("a corrupt Phase 01 snapshot starts at the first question, no crash", () => {
    render(<Phase01Harness resume={{ screen: { kind: "nope" }, pool: "x" }} onSnap={() => {}} />);
    expect(screen.getByRole("heading", { name: /Assalomu alaykum/ })).toBeInTheDocument();
  });

  function BridgeHarness({ kids, resume, onPos }: { kids: ChildProfile[]; resume?: SubPosition; onPos: (p: SubPosition) => void }) {
    const [k, setK] = useState(kids);
    return (
      <LanguageProvider>
        <EmotionalBridge
          childrenIn={k}
          resume={resume}
          onPosition={onPos}
          onPatchChild={(id, p) => setK((ks) => ks.map((c) => (c.id === id ? { ...c, ...p } : c)))}
          onComplete={() => {}}
          onBack={() => {}}
        />
      </LanguageProvider>
    );
  }

  it("a per-child phase reopens the exact screen with the typed answer", async () => {
    const u = userEvent.setup();
    let pos: SubPosition | null = null;
    let kidsNow: ChildProfile[] = [{ id: "c1", name: "Nodira", age: 7 }];
    const first = render(<BridgeHarness kids={kidsNow} onPos={(p) => (pos = p)} />);
    await u.click(screen.getByRole("button", { name: /Davom etish/ }));
    await new Promise((r) => setTimeout(r, 60)); // let the heading focus land
    await u.type(screen.getByRole("textbox"), "Yangi maktab");
    const heading = screen.getByRole("heading").textContent;
    // capture the patched child the form would have persisted
    kidsNow = [{ id: "c1", name: "Nodira", age: 7, emotionalBridge: { privateContext: "Yangi maktab" } }];
    first.unmount();

    render(<BridgeHarness kids={kidsNow} resume={JSON.parse(JSON.stringify(pos))} onPos={() => {}} />);
    expect(screen.getByRole("heading").textContent).toBe(heading);
    expect(screen.getByRole("textbox")).toHaveValue("Yangi maktab");
  });
});
