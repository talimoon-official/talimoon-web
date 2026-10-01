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
  requiredMediaGaps,
  restoreOrderDraft,
  resumeGaps,
  resumeStepFor,
  stripMedia,
  toPersisted,
  type MediaManifest,
  type OrderDraft,
} from "../orderDraft";
import { resumeTitle, REUPLOAD_COPY } from "../MediaReuploadNotice";
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

/** What the saver stores: the answers (file slots emptied) + a count-only
 *  manifest. Files are never stored. */
function stored(data: FormData, extra: Partial<OrderDraft> = {}) {
  const { text, manifest } = stripMedia(toPersisted(data));
  return { payload: { ...draftOf(data, extra), data: text, media: manifest } };
}
const restore = (s: { payload: unknown }) => restoreOrderDraft(s.payload, emptyForm(), STEPS.length)!;
const PT = STEPS.findIndex((x) => x.id === "personal-touch");
const PH = STEPS.findIndex((x) => x.id === "photos");
const RV = STEPS.findIndex((x) => x.id === "review");
const hasBlob = (v: unknown): boolean =>
  v instanceof Blob ||
  v instanceof ArrayBuffer ||
  ArrayBuffer.isView(v) ||
  (typeof v === "object" && v !== null && Object.values(v).some(hasBlob));

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
  await vi.waitFor(async () => expect(await store.get(FLOW)).toBeDefined());
  return saver;
}

describe("what is persisted, and where", () => {
  it("never persists consent ticks or the signature", () => {
    const p = toPersisted(filledForm()) as Record<string, unknown>;
    for (const k of NEVER_PERSISTED) expect(k in p).toBe(false);
  });

  it("A · no file is ever written: no Blob / File / audio / photo anywhere in storage", async () => {
    await saveNow(filledForm());
    const answers = (await store.get(FLOW)) as { payload: OrderDraft };
    const d = answers.payload.data;
    expect(d.children[0]!.photos).toEqual([]);
    expect(d.additionalCharacters[0]!.photos).toEqual([]);
    expect(d.specialPhoto).toBeNull();
    expect(d.finalVoice).toBeNull();
    expect(d.finalVoiceDurationSec).toBeNull();
    // only counts / flags of what existed
    expect(answers.payload.media).toEqual({ children: { c1: 3 }, characters: { k1: 2 }, specialPhoto: true, finalVoice: true });
    expect(hasBlob(answers)).toBe(false);
    expect(await store.get(`${FLOW}:media`)).toBeUndefined();
    const keys: string[] = [];
    const put = store.put.bind(store);
    vi.spyOn(store, "put").mockImplementation((k, v) => (keys.push(k), put(k, v)));
    const saver = createDraftSaver(0);
    saver.schedule(draftOf(filledForm()));
    await saver.flush();
    expect(keys).toEqual([FLOW]);
    const raw = JSON.stringify(await store.get(FLOW));
    expect(raw).not.toMatch(/PIXELDATA|VOICEDATA|keepsake\.jpg|voice\.webm/);
  });

  it("B · text, choices, optional-answer cards and progress ARE persisted", async () => {
    const f = filledForm();
    f.children[0] = {
      ...f.children[0]!,
      noInterestDetails: true,
      noFavoriteActivity: true,
      emotionalBridge: { noSituation: true, sensitivities: "Ehtiyot", done: true },
    };
    await saveNow(f, { phase: "world", pos: { idx: 0, screen: "dream" }, marketTouched: true });
    const r = restoreOrderDraft(await readDraft(FLOW), emptyForm(), STEPS.length)!;
    expect(r.phase).toBe("world");
    expect(r.pos).toEqual({ idx: 0, screen: "dream" });
    expect(r.marketTouched).toBe(true);
    expect(r.data.children[0]).toMatchObject({
      name: "Nodira",
      phase02Done: true,
      noInterestDetails: true,
      noFavoriteActivity: true,
      emotionalBridge: { noSituation: true, sensitivities: "Ehtiyot", done: true },
    });
    expect(r.data).toMatchObject({ personalMessage: "Seni yaxshi ko‘ramiz", keepsakeWantsVoice: true, wantsCharacters: true });
    expect(r.data.additionalCharacters[0]).toMatchObject({ relation: "Bobo", name: "Karim", photos: [] });
  });

  it("no payment / access / capability token ever reaches storage", async () => {
    await saveNow(filledForm());
    const text = JSON.stringify([await store.get(FLOW), await store.get(`${FLOW}:media`)]).toLowerCase();
    for (const needle of ["token", "capability", "paymentcode", "resume", "idempotency", "consent", "signature", "strokes", "turnstile"]) {
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
    restoreOrderDraft(await readDraft(FLOW), emptyForm(), STEPS.length);

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
  it("consent + signature always come back fresh; every file slot empty", () => {
    const r = restore(stored(filledForm(), { stepIndex: PT }));
    expect(r.data.consentTerms || r.data.consentPrivacy || r.data.consentAuthority).toBe(false);
    expect(r.data.consentDrawnSignature).toBe("");
    expect(r.data.children[0]!.photos).toEqual([]);
    expect(r.data.specialPhoto).toBeNull();
    expect(r.data.finalVoice).toBeNull();
    expect(r.data.orderer.phone).toBe("+998901234567");
  });

  it("a gap closes as soon as the file is added again (or the voice is switched off)", () => {
    const r = restore(stored(filledForm(), { stepIndex: RV }));
    const d = r.data;
    const child = r.mediaGaps.find((g) => g.kind === "child")!;
    expect(gapIsOpen(child, d)).toBe(true);
    expect(gapIsOpen(child, { ...d, children: [{ ...d.children[0]!, photos: [photo("1"), photo("2")] }] })).toBe(true);
    expect(gapIsOpen(child, { ...d, children: [{ ...d.children[0]!, photos: [photo("1"), photo("2"), photo("3")] }] })).toBe(false);
    const voice = r.mediaGaps.find((g) => g.kind === "voice")!;
    expect(gapIsOpen(voice, { ...d, keepsakeWantsVoice: false })).toBe(false);
  });

  it("clamps a stale step index and a stale child index", () => {
    const s = stored(filledForm(), { phase: "world", stepIndex: 99, pos: { idx: 7, screen: "dream" } });
    const r = restoreOrderDraft(s.payload, emptyForm(), STEPS.length)!;
    expect(r.stepIndex).toBe(STEPS.length - 1);
    expect(r.pos).toEqual({ idx: 0, screen: "dream" });
  });

  it("a draft that never finished Phase 01 always reopens in Phase 01", () => {
    const s = stored(filledForm(), { phase: "steps", phase01Seeded: false });
    expect(restoreOrderDraft(s.payload, emptyForm(), STEPS.length)!.phase).toBe("intro");
  });

  it("garbage / foreign shapes return null instead of throwing", () => {
    for (const bad of [null, 1, "x", {}, { data: {} }, { data: { children: [] } }, { data: { children: [{ nope: 1 }] } }]) {
      expect(restoreOrderDraft(bad, emptyForm(), STEPS.length)).toBeNull();
    }
  });

  it("mistyped fields fall back to defaults", () => {
    const s = stored(filledForm());
    const d = s.payload.data as unknown as Record<string, unknown>;
    d.copies = "many";
    d.market = "MARS";
    d.personalMessage = 42;
    const r = restoreOrderDraft(s.payload, emptyForm(), STEPS.length)!;
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
    expect(resolveDraftLoad({ payload: { junk: true } }, "single")).toEqual({ restored: null, ask: false, discard: true });
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
    await vi.waitFor(() => expect(put).toHaveBeenCalledTimes(1)); // one text-only record
  });

  it("I · submission: seal deletes the draft and blocks any later write", async () => {
    vi.useFakeTimers();
    const saver = createDraftSaver(500);
    saver.schedule(draftOf(filledForm()));
    vi.advanceTimersByTime(500);
    vi.useRealTimers();
    await vi.waitFor(async () => expect(await store.get(FLOW)).toBeDefined());
    saver.schedule(draftOf(filledForm(), { stepIndex: 3 })); // a late edit pending
    await saver.seal();
    saver.schedule(draftOf(filledForm()));
    saver.flush();
    await new Promise((r) => setTimeout(r, 30));
    expect(await store.get(FLOW)).toBeUndefined();
    expect(await store.get(`${FLOW}:media`)).toBeUndefined();
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

describe("resume step: earliest REQUIRED missing media, else the saved step", () => {
  const manifestOf = (d: FormData): MediaManifest => stripMedia(toPersisted(d)).manifest;

  it("C · saved past the required photo steps → reopens at the EARLIEST one (Esdalik: keepsake photo)", () => {
    const r = restore(stored(filledForm(), { stepIndex: RV }));
    expect(r.phase).toBe("steps");
    expect(r.stepIndex).toBe(PT);
    expect(r.savedStepIndex).toBe(RV);
    // everything the customer typed is still there — nothing restarted
    expect(r.data.orderer.name).toBe("Sherzod");
    expect(r.data.personalMessage).toBe("Seni yaxshi ko‘ramiz");
    expect(r.data.additionalCharacters[0]!.name).toBe("Karim");
    expect(r.mediaGaps).toEqual([
      { kind: "special" },
      { kind: "voice" },
      { kind: "child", id: "c1", name: "Nodira", count: 3, expected: 3 },
      { kind: "character", id: "k1", name: "Karim", count: 2, expected: 2 },
    ]);
  });

  it("D/E · after re-adding one step's files the NEXT missing step wins; later answers stay filled", () => {
    const r = restore(stored(filledForm(), { stepIndex: RV }));
    const m = (stored(filledForm()).payload as { media: MediaManifest }).media;
    // re-add the Esdalik files → the photos step is next
    const afterEsdalik = { ...r.data, specialPhoto: photo("k.jpg"), finalVoice: new File(["v"], "v.webm") };
    expect(resumeStepFor(afterEsdalik, m, RV)).toBe(PH);
    // re-add the child + character photos → straight on to the saved step
    const afterPhotos: FormData = {
      ...afterEsdalik,
      children: [{ ...afterEsdalik.children[0]!, photos: [photo("1"), photo("2"), photo("3")] }],
      additionalCharacters: [{ ...afterEsdalik.additionalCharacters[0]!, photos: [photo("x"), photo("y")] }],
    };
    expect(resumeStepFor(afterPhotos, m, RV)).toBe(RV);
    expect(afterPhotos.personalMessage).toBe("Seni yaxshi ko‘ramiz");
    expect(afterPhotos.orderer.phone).toBe("+998901234567");
    expect(afterPhotos.bookLanguageCode).toBe("uz");
  });

  it("no missing required media before the saved step → the saved step itself", () => {
    const r = restore(stored(filledForm(), { stepIndex: PT }));
    expect(r.stepIndex).toBe(PT);
    expect(r.savedStepIndex).toBeUndefined();
  });

  it("steps not yet reached never pull backward; per-child phases hold no files", () => {
    const r = restore(stored(filledForm(), { phase: "character", pos: { idx: 0, screen: "growth" } }));
    expect(r.phase).toBe("character");
    expect(r.pos).toEqual({ idx: 0, screen: "growth" });
    expect(r.mediaGaps).toEqual([]);
  });

  it("on the step the customer was ON, only files they had added count as re-uploads", () => {
    // at Esdalik, keepsake photo never added yet, voice recorded
    const f = { ...filledForm(), specialPhoto: null };
    const r = restore(stored(f, { stepIndex: PT }));
    expect(r.mediaGaps).toEqual([{ kind: "voice" }]);
    expect(resumeTitle(r.mediaGaps, "uz")).toBe("Javoblaringiz saqlangan. Davom etish uchun ovozli faylni qayta qo‘shing.");
  });

  it("F · optional media never pulls back: voice 'Yo‘q', a voice never recorded, extra photos above the minimum", () => {
    const base = { ...filledForm(), specialPhoto: photo("k.jpg") };
    // voice declined
    const noVoice = { ...base, keepsakeWantsVoice: false, finalVoice: null };
    expect(requiredMediaGaps("personal-touch", noVoice, manifestOf(noVoice))).toEqual([]);
    // "Ha" but nothing was ever recorded
    const neverRecorded = { ...base, finalVoice: null };
    expect(requiredMediaGaps("personal-touch", neverRecorded, manifestOf(neverRecorded))).toEqual([]);
    // 5 photos had, only the minimum (3) is asked for
    const many = { ...base, children: [{ ...base.children[0]!, photos: [1, 2, 3, 4, 5].map((n) => photo(`${n}`)) }] };
    const m = manifestOf(many);
    expect(m.children.c1).toBe(5);
    const gap = requiredMediaGaps("photos", { ...many, children: [{ ...many.children[0]!, photos: [] }] }, m)[0];
    expect(gap).toMatchObject({ kind: "child", count: 3, expected: 3 });
    // additional characters switched off → their photos are not required
    const noChars = { ...base, wantsCharacters: false };
    const stripped = { ...noChars, children: [{ ...noChars.children[0]!, photos: [] }] };
    expect(requiredMediaGaps("photos", stripped, manifestOf(noChars)).map((g) => g.kind)).toEqual(["child"]);
  });

  it("G · a recorded voice the customer chose ('Ha') is required: resumes at the Esdalik (voice) step", () => {
    const f = filledForm();
    const r = restore(stored(f, { stepIndex: PH }));
    expect(STEPS[r.stepIndex]!.id).toBe("personal-touch");
    expect(r.mediaGaps.map((g) => g.kind)).toContain("voice");
    // only the voice left open → the voice-only message
    const esdalik = r.mediaGaps.filter((g) => g.kind === "special" || g.kind === "voice");
    const onlyVoice = esdalik.filter((g) => gapIsOpen(g, { ...r.data, specialPhoto: photo("k") }));
    expect(onlyVoice.map((g) => g.kind)).toEqual(["voice"]);
    expect(resumeTitle(onlyVoice, "uz")).toBe(REUPLOAD_COPY.uz.titleVoice);
  });

  it("messages: photos / voice / both", () => {
    const c = REUPLOAD_COPY.uz;
    expect(resumeTitle([{ kind: "special" }], "uz")).toBe("Javoblaringiz saqlangan. Davom etish uchun rasmlarni qayta yuklang.");
    expect(resumeTitle([{ kind: "voice" }], "uz")).toBe(c.titleVoice);
    expect(resumeTitle([{ kind: "special" }, { kind: "voice" }], "uz")).toBe("Javoblaringiz saqlangan. Faqat kerakli fayllarni qayta yuklang.");
    for (const loc of ["en", "ru"] as const) {
      const l = REUPLOAD_COPY[loc];
      for (const t of [l.titlePhotos, l.titleVoice, l.titleMixed, l.body]) expect(t.trim()).not.toBe("");
      expect(l.body).not.toMatch(/48/);
    }
    expect(c.body).not.toMatch(/48/);
  });

  it("H · multi-child: earliest missing child photos chosen in child order; every child's answers kept", () => {
    const f = filledForm();
    const two: FormData = {
      ...f,
      bookType: "multi",
      specialPhoto: photo("k"),
      keepsakeWantsVoice: false,
      finalVoice: null,
      wantsCharacters: false,
      additionalCharacters: [],
      children: [
        { id: "c1", name: "Nodira", age: 7, phase02Done: true, phase03Done: true, photos: [photo("a"), photo("b"), photo("c")], favoriteActivity: "Rasm chizish" },
        { id: "c2", name: "Bobur", age: 5, phase02Done: true, phase03Done: true, photos: [photo("d"), photo("e"), photo("f")], favoriteActivity: "Futbol", emotionalBridge: { privateContext: "Yangi maktab", done: true } },
      ],
    };
    const r = restore(stored(two, { bookType: "multi", stepIndex: RV }));
    // Esdalik had its photo in the session, but files are never stored → it is first
    expect(r.stepIndex).toBe(PT);
    const afterKeepsake = { ...r.data, specialPhoto: photo("k2") };
    const m = (stored(two).payload as { media: MediaManifest }).media;
    expect(resumeStepFor(afterKeepsake, m, RV)).toBe(PH);
    const gaps = resumeGaps(afterKeepsake, m, RV).filter((g) => gapIsOpen(g, afterKeepsake));
    expect(gaps.map((g) => ("id" in g ? g.id : g.kind))).toEqual(["c1", "c2"]);
    // child 1 re-added: child 2 is still asked for, its text untouched
    const afterC1 = { ...afterKeepsake, children: [{ ...afterKeepsake.children[0]!, photos: [photo("1"), photo("2"), photo("3")] }, afterKeepsake.children[1]!] };
    expect(resumeStepFor(afterC1, m, RV)).toBe(PH);
    expect(gaps.filter((g) => gapIsOpen(g, afterC1)).map((g) => ("id" in g ? g.id : g.kind))).toEqual(["c2"]);
    expect(afterC1.children[1]).toMatchObject({ name: "Bobur", favoriteActivity: "Futbol", emotionalBridge: { privateContext: "Yangi maktab" } });
    expect(afterC1.children[0]!.favoriteActivity).toBe("Rasm chizish");
  });

  it("H · multi-child inside a per-child phase: the exact child + screen, later child's text intact", () => {
    const f = filledForm();
    const two: FormData = {
      ...f,
      children: [
        { id: "c1", name: "Nodira", age: 7, phase02Done: true, photos: [] },
        { id: "c2", name: "Bobur", age: 5, favoriteActivity: "Futbol", photos: [] },
      ],
    };
    const r = restore(stored(two, { bookType: "multi", phase: "world", pos: { idx: 1, screen: "activity" } }));
    expect(r.phase).toBe("world");
    expect(r.pos).toEqual({ idx: 1, screen: "activity" });
    expect(r.data.children[1]!.favoriteActivity).toBe("Futbol");
    expect(r.mediaGaps).toEqual([]);
  });
});
