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
  gapIsOpen,
  restoreOrderDraft,
  splitMedia,
  toPersisted,
  type OrderDraft,
  type OrderDraftMedia,
} from "../orderDraft";
import { resolveDraftLoad } from "../draftLoad";
import Phase01, { type Phase01Snapshot } from "../Phase01";
import EmotionalBridge from "../EmotionalBridge";
import type { SubPosition } from "../flowPosition";
import type { ChildProfile } from "@/lib/order/types";

const FLOW = "personalized-book";
const photo = (n: string) => new File(["PIXELDATA-" + n], n, { type: "image/jpeg" });

function filledForm(): FormData {
  const f = emptyForm("UZ");
  return {
    ...f,
    orderer: { ...f.orderer, honorific: "mr", name: "Sherzod", phone: "+998901234567" },
    children: [{ id: "c1", name: "Nodira", age: 7, phase02Done: true, photos: [photo("a.jpg"), photo("b.jpg"), photo("c.jpg")] }],
    wantsCharacters: true,
    additionalCharacters: [{ id: "k1", relation: "Bobo", name: "Karim", photos: [photo("k1.jpg"), photo("k2.jpg")] }],
    personalMessage: "Seni yaxshi ko‘ramiz",
    keepsakeRelationship: "father",
    storyGiverDisplayName: "Sherzod",
    keepsakeWantsVoice: true,
    finalVoice: new File(["VOICEDATA"], "voice.webm", { type: "audio/webm" }),
    finalVoiceDurationSec: 12,
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

/** What the saver stores: the answers record (file slots emptied + a
 *  manifest) and the separate media record. */
function stored(data: FormData, extra: Partial<OrderDraft> = {}) {
  const { text, media, manifest } = splitMedia(toPersisted(data));
  return { payload: { ...draftOf(data, extra), data: text, media: manifest }, media };
}

let store: DraftStorage;
beforeEach(() => {
  store = memoryStorage();
  setDraftStorage(store);
});
afterEach(() => {
  setDraftStorage(null);
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function saveNow(data: FormData, extra: Partial<OrderDraft> = {}) {
  const saver = createDraftSaver(0);
  saver.schedule(draftOf(data, extra));
  saver.flush();
  await vi.waitFor(async () => expect(await store.get(`${FLOW}:media`)).toBeDefined());
  return saver;
}

describe("what is persisted, and where", () => {
  it("never persists consent ticks or the signature", () => {
    const p = toPersisted(filledForm()) as Record<string, unknown>;
    for (const k of NEVER_PERSISTED) expect(k in p).toBe(false);
  });

  it("files live ONLY in the media record; the answers record holds counts, never contents", async () => {
    await saveNow(filledForm());
    const answers = (await store.get(FLOW)) as { payload: OrderDraft };
    const media = (await store.get(`${FLOW}:media`)) as { payload: OrderDraftMedia };
    const d = answers.payload.data;
    expect(d.children[0]!.photos).toEqual([]);
    expect(d.additionalCharacters[0]!.photos).toEqual([]);
    expect(d.specialPhoto).toBeNull();
    expect(d.finalVoice).toBeNull();
    expect(answers.payload.media).toEqual({ children: { c1: 3 }, characters: { k1: 2 }, specialPhoto: true, finalVoice: true });
    // no Blob anywhere in the answers record
    const hasBlob = (v: unknown): boolean =>
      v instanceof Blob || (typeof v === "object" && v !== null && Object.values(v).some(hasBlob));
    expect(hasBlob(answers)).toBe(false);
    expect(media.payload.children.c1).toHaveLength(3);
    expect(media.payload.specialPhoto).toBeInstanceOf(Blob);
    expect(media.payload.finalVoiceDurationSec).toBe(12);
  });

  it("no payment / access / capability token ever reaches storage", async () => {
    await saveNow(filledForm());
    const text = JSON.stringify([await store.get(FLOW), await store.get(`${FLOW}:media`)]).toLowerCase();
    for (const needle of ["token", "capability", "paymentcode", "resume", "idempotency", "consentdrawnsignature", "consentterms", "turnstile"]) {
      expect(text).not.toContain(needle);
    }
  });

  it("the form never hands tokens / the saved order to the draft", () => {
    const form = readFileSync(resolve(__dirname, "../PersonalizedBookOrderForm.tsx"), "utf8");
    const call = form.slice(form.indexOf("saver.schedule({"), form.indexOf("});", form.indexOf("saver.schedule({")));
    expect(call).not.toMatch(/orderSession|capabilityToken|idempotency|saved|resume|paymentCode|turnstile/i);
  });

  it("no media content leaks to logs, web storage, network or the URL during save + restore", async () => {
    const spies = [
      vi.spyOn(console, "log"),
      vi.spyOn(console, "info"),
      vi.spyOn(console, "warn"),
      vi.spyOn(console, "error"),
      vi.spyOn(console, "debug"),
    ];
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const beacon = vi.fn();
    Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true });
    const href = window.location.href;

    await saveNow(filledForm());
    const loaded = await readDraft(FLOW);
    restoreOrderDraft(loaded!.payload, emptyForm(), STEPS.length, loaded!.media);

    for (const s of spies) expect(s).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(beacon).not.toHaveBeenCalled();
    expect(window.location.href).toBe(href);
    vi.unstubAllGlobals();
  });

  it("the draft modules contain no logging, analytics or web-storage calls at all", () => {
    for (const f of ["../orderDraft.ts", "../../../lib/order/formDraft.ts", "../MediaReuploadNotice.tsx"]) {
      const src = readFileSync(resolve(__dirname, f), "utf8");
      expect(src).not.toMatch(/console\.|sendBeacon|fetch\(|localStorage\.|sessionStorage\.|createObjectURL/);
    }
  });
});

describe("restore", () => {
  it("within 48h: exact step, answers AND files come back; consent always fresh", () => {
    const s = stored(filledForm(), { stepIndex: 2 });
    const r = restoreOrderDraft(s.payload, emptyForm(), STEPS.length, s.media)!;
    expect(r.phase).toBe("steps");
    expect(r.stepIndex).toBe(2);
    expect(r.data.orderer.phone).toBe("+998901234567");
    expect(r.data.children[0]!.photos).toHaveLength(3);
    expect(r.data.additionalCharacters[0]!.photos).toHaveLength(2);
    expect(r.data.specialPhoto).toBeInstanceOf(Blob);
    expect(r.data.finalVoice).toBeInstanceOf(Blob);
    expect(r.data.finalVoiceDurationSec).toBe(12);
    expect(r.mediaGaps).toEqual([]);
    expect(r.data.consentTerms).toBe(false);
    expect(r.data.consentDrawnSignature).toBe("");
  });

  it("media expired: every answer + the position survive, and ONLY the files are listed to re-add", () => {
    const s = stored(filledForm(), { stepIndex: 1 });
    const r = restoreOrderDraft(s.payload, emptyForm(), STEPS.length, undefined)!;
    expect(r.phase).toBe("steps");
    expect(r.stepIndex).toBe(1);
    expect(r.data.orderer.name).toBe("Sherzod");
    expect(r.data.personalMessage).toBe("Seni yaxshi ko‘ramiz");
    expect(r.data.additionalCharacters[0]!.name).toBe("Karim");
    expect(r.data.children[0]!.photos).toEqual([]);
    expect(r.data.finalVoice).toBeNull();
    expect(r.mediaGaps).toEqual([
      { kind: "child", id: "c1", name: "Nodira", count: 3 },
      { kind: "character", id: "k1", name: "Karim", count: 2 },
      { kind: "special" },
      { kind: "voice" },
    ]);
  });

  it("a gap closes as soon as the file is added again (or the voice is switched off)", () => {
    const s = stored(filledForm());
    const r = restoreOrderDraft(s.payload, emptyForm(), STEPS.length, undefined)!;
    const d = r.data;
    const child = r.mediaGaps.find((g) => g.kind === "child")!;
    expect(gapIsOpen(child, d)).toBe(true);
    expect(gapIsOpen(child, { ...d, children: [{ ...d.children[0]!, photos: [photo("new.jpg")] }] })).toBe(false);
    const voice = r.mediaGaps.find((g) => g.kind === "voice")!;
    expect(gapIsOpen(voice, { ...d, keepsakeWantsVoice: false })).toBe(false);
  });

  it("files are matched by stable id, never by position", () => {
    const f = filledForm();
    const s = stored(f);
    // the stored answers list the child under its id; media keyed the same
    const r = restoreOrderDraft(s.payload, emptyForm(), STEPS.length, { ...s.media, children: { other: s.media.children.c1 } })!;
    expect(r.data.children[0]!.photos).toEqual([]);
    expect(r.mediaGaps[0]).toMatchObject({ kind: "child", id: "c1" });
  });

  it("clamps a stale step index and a stale child index", () => {
    const s = stored(filledForm(), { phase: "world", stepIndex: 99, pos: { idx: 7, screen: "dream" } });
    const r = restoreOrderDraft(s.payload, emptyForm(), STEPS.length, s.media)!;
    expect(r.stepIndex).toBe(STEPS.length - 1);
    expect(r.pos).toEqual({ idx: 0, screen: "dream" });
  });

  it("a draft that never finished Phase 01 always reopens in Phase 01", () => {
    const s = stored(filledForm(), { phase: "steps", phase01Seeded: false });
    expect(restoreOrderDraft(s.payload, emptyForm(), STEPS.length, s.media)!.phase).toBe("intro");
  });

  it("garbage / foreign shapes return null instead of throwing (media garbage is ignored)", () => {
    for (const bad of [null, 1, "x", {}, { data: {} }, { data: { children: [] } }, { data: { children: [{ nope: 1 }] } }]) {
      expect(restoreOrderDraft(bad, emptyForm(), STEPS.length, "junk")).toBeNull();
    }
    const s = stored(filledForm());
    expect(restoreOrderDraft(s.payload, emptyForm(), STEPS.length, { children: "x", specialPhoto: 5 })).not.toBeNull();
  });

  it("mistyped fields fall back to defaults", () => {
    const s = stored(filledForm());
    const d = s.payload.data as unknown as Record<string, unknown>;
    d.copies = "many";
    d.market = "MARS";
    d.personalMessage = 42;
    const r = restoreOrderDraft(s.payload, emptyForm(), STEPS.length, s.media)!;
    expect(r.data.copies).toBe(1);
    expect(r.data.market).toBe("UZ");
    expect(r.data.personalMessage).toBe("");
  });
});

describe("resume decision (route)", () => {
  const single = stored(filledForm(), { bookType: "single" });
  it("no fresh plan choice (reload / Continue / PWA reopen) → restore without asking", () => {
    expect(resolveDraftLoad(single, undefined)).toMatchObject({ ask: false, discard: false });
    expect(resolveDraftLoad(single, undefined).restored?.data.orderer.name).toBe("Sherzod");
  });
  it("a fresh plan choice never silently reuses the draft — same type or not, the customer is asked", () => {
    expect(resolveDraftLoad(single, "single").ask).toBe(true);
    expect(resolveDraftLoad(single, "multi").ask).toBe(true);
  });
  it("an unreadable draft is discarded", () => {
    expect(resolveDraftLoad({ payload: { junk: true }, media: undefined }, "single")).toEqual({ restored: null, ask: false, discard: true });
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
    vi.useRealTimers();
    await vi.waitFor(() => expect(put).toHaveBeenCalledTimes(2)); // answers + media, once each
  });

  it("text edits do not rewrite unchanged files", async () => {
    const f = filledForm();
    const saver = await saveNow(f);
    const put = vi.spyOn(store, "put");
    saver.schedule(draftOf({ ...f, personalMessage: "yangi" }));
    saver.flush();
    await vi.waitFor(() => expect(put).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(put.mock.calls.map((c) => c[0])).toEqual([FLOW]);
  });

  it("submission: seal deletes answers AND media and blocks any later write", async () => {
    vi.useFakeTimers();
    const saver = createDraftSaver(500);
    saver.schedule(draftOf(filledForm()));
    vi.advanceTimersByTime(500);
    vi.useRealTimers();
    await vi.waitFor(async () => expect(await store.get(`${FLOW}:media`)).toBeDefined());
    saver.schedule(draftOf(filledForm(), { stepIndex: 3 })); // a late edit pending
    await saver.seal();
    saver.schedule(draftOf(filledForm()));
    saver.flush();
    await new Promise((r) => setTimeout(r, 30));
    expect(await store.get(FLOW)).toBeUndefined();
    expect(await store.get(`${FLOW}:media`)).toBeUndefined();
  });

  it("when storage refuses the files, the answers are kept and those files become gaps", async () => {
    const kept = new Map<string, unknown>();
    setDraftStorage({
      get: async (k) => kept.get(k),
      put: async (k, v) => {
        if (k.endsWith(":media")) throw new DOMException("full", "QuotaExceededError");
        kept.set(k, v);
      },
      delete: async (k) => void kept.delete(k),
    });
    const saver = createDraftSaver(0);
    saver.schedule(draftOf(filledForm()));
    saver.flush();
    await vi.waitFor(() => expect(kept.has(FLOW)).toBe(true));
    await new Promise((r) => setTimeout(r, 20));
    expect(kept.has(`${FLOW}:media`)).toBe(false);
    const loaded = await readDraft(FLOW);
    const r = restoreOrderDraft(loaded!.payload, emptyForm(), STEPS.length, loaded!.media)!;
    expect(r.data.orderer.name).toBe("Sherzod");
    expect(r.mediaGaps.map((g) => g.kind)).toEqual(["child", "character", "special", "voice"]);
  });

  it("the form seals the draft right after finalize, before the saved screen", () => {
    const form = readFileSync(resolve(__dirname, "../PersonalizedBookOrderForm.tsx"), "utf8");
    const fin = form.indexOf("() => finalizeOrder(");
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

    const storedSnap = JSON.parse(JSON.stringify(snap));
    render(<Phase01Harness resume={storedSnap} onSnap={() => {}} />);
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
    kidsNow = [{ id: "c1", name: "Nodira", age: 7, emotionalBridge: { privateContext: "Yangi maktab" } }];
    first.unmount();

    render(<BridgeHarness kids={kidsNow} resume={JSON.parse(JSON.stringify(pos))} onPos={() => {}} />);
    expect(screen.getByRole("heading").textContent).toBe(heading);
    expect(screen.getByRole("textbox")).toHaveValue("Yangi maktab");
  });
});
