import { describe, it, expect, afterEach } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import {
  DRAFT_SCHEMA_VERSION,
  MAX_AGE_MS,
  clearDraft,
  legacyMediaKey,
  indexedDbStorage,
  memoryStorage,
  readDraft,
  setDraftStorage,
  sweepExpiredDrafts,
  writeDraft,
  type DraftStorage,
} from "../formDraft";
import { consumeReturnedToMenu, markReturnedToMenu } from "../menuReturn";

afterEach(() => setDraftStorage(null));

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const FLOW = "personalized-book" as const;

function withIdb(idb = new IDBFactory()): DraftStorage {
  const s = indexedDbStorage(idb);
  setDraftStorage(s);
  return s;
}

describe("retention window", () => {
  it("is 7 days for the (text-only) draft", () => {
    expect(MAX_AGE_MS).toBe(7 * DAY);
  });
});

/** what builds before 2026-10-01 left on devices: a separate media record */
async function putLegacyMedia(s: DraftStorage) {
  await s.put(legacyMediaKey(FLOW), { v: DRAFT_SCHEMA_VERSION, flow: FLOW, savedAt: Date.now(), payload: { photos: ["p1"] } });
}

describe("persistent draft store (IndexedDB)", () => {
  it("round-trips the answers record across a restart", async () => {
    const idb = new IDBFactory();
    withIdb(idb);
    await writeDraft(FLOW, { step: 4 });
    withIdb(idb); // app killed + reopened
    expect(await readDraft(FLOW, Date.now() + 6 * DAY)).toEqual({ step: 4 });
  });

  it("answers are deleted after 7 days of inactivity", async () => {
    const s = withIdb();
    await writeDraft(FLOW, { step: 4 });
    expect(await readDraft(FLOW, Date.now() + 7 * DAY + HOUR)).toBeUndefined();
    expect(await s.get(FLOW)).toBeUndefined();
  });

  it("a legacy media record (older builds) is deleted on read; the answers survive", async () => {
    const s = withIdb();
    await writeDraft(FLOW, { step: 4 });
    await putLegacyMedia(s);
    expect(await readDraft(FLOW)).toEqual({ step: 4 });
    expect(await s.get(legacyMediaKey(FLOW))).toBeUndefined();
  });

  it("the app-start sweep enforces retention and removes legacy media", async () => {
    const s = withIdb();
    await writeDraft(FLOW, { step: 1 });
    await putLegacyMedia(s);
    await sweepExpiredDrafts();
    expect(await s.get(legacyMediaKey(FLOW))).toBeUndefined();
    expect(await s.get(FLOW)).toBeDefined();
    await sweepExpiredDrafts(Date.now() + 8 * DAY);
    expect(await s.get(FLOW)).toBeUndefined();
  });

  it("orphan legacy media (no answers record) is deleted", async () => {
    const s = withIdb();
    await putLegacyMedia(s);
    expect(await readDraft(FLOW)).toBeUndefined();
    expect(await s.get(legacyMediaKey(FLOW))).toBeUndefined();
  });

  it("an incompatible schema version fails safely: absent + everything deleted", async () => {
    const s = withIdb();
    await s.put(FLOW, { v: DRAFT_SCHEMA_VERSION + 1, flow: FLOW, savedAt: Date.now(), payload: { x: 1 } });
    await putLegacyMedia(s);
    await expect(readDraft(FLOW)).resolves.toBeUndefined();
    expect(await s.get(FLOW)).toBeUndefined();
    expect(await s.get(legacyMediaKey(FLOW))).toBeUndefined();
  });

  it("the previous (v1) single-record format is discarded, never half-read", async () => {
    const s = withIdb();
    await s.put(FLOW, { v: 1, flow: FLOW, savedAt: Date.now(), payload: { data: { children: [] } } });
    await expect(readDraft(FLOW)).resolves.toBeUndefined();
    expect(await s.get(FLOW)).toBeUndefined();
  });

  it("garbage in the slot is discarded", async () => {
    const s = withIdb();
    await s.put(FLOW, "not a draft");
    expect(await readDraft(FLOW)).toBeUndefined();
    expect(await s.get(FLOW)).toBeUndefined();
  });

  it("clear removes the draft (and any legacy media)", async () => {
    const s = withIdb();
    await writeDraft(FLOW, { step: 1 });
    await putLegacyMedia(s);
    await clearDraft(FLOW);
    expect(await s.get(FLOW)).toBeUndefined();
    expect(await s.get(legacyMediaKey(FLOW))).toBeUndefined();
  });

  it("a failing storage reads as 'no draft' instead of throwing", async () => {
    setDraftStorage({
      get: () => Promise.reject(new Error("blocked")),
      put: () => Promise.reject(new Error("blocked")),
      delete: () => Promise.reject(new Error("blocked")),
    });
    await expect(readDraft(FLOW)).resolves.toBeUndefined();
    await expect(clearDraft(FLOW)).resolves.toBeUndefined();
  });

  it("memory fallback has the same behaviour", async () => {
    setDraftStorage(memoryStorage());
    await writeDraft(FLOW, { step: 2 });
    expect(await readDraft(FLOW)).toEqual({ step: 2 });
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
