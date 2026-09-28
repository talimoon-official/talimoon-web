import { describe, it, expect, afterEach } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import {
  DRAFT_SCHEMA_VERSION,
  MAX_AGE_MS,
  MEDIA_MAX_AGE_MS,
  clearDraft,
  indexedDbStorage,
  memoryStorage,
  readDraft,
  setDraftStorage,
  sweepExpiredDrafts,
  writeDraft,
  writeDraftMedia,
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

describe("retention windows", () => {
  it("are 7 days for answers and 48 hours for media", () => {
    expect(MAX_AGE_MS).toBe(7 * DAY);
    expect(MEDIA_MAX_AGE_MS).toBe(48 * HOUR);
  });
});

describe("persistent draft store (IndexedDB)", () => {
  it("round-trips the answers record and the separate media record", async () => {
    withIdb();
    await writeDraft(FLOW, { phase: "world" });
    await writeDraftMedia(FLOW, { photos: ["p1"] });
    expect(await readDraft(FLOW)).toEqual({ payload: { phase: "world" }, media: { photos: ["p1"] }, mediaExpired: false });
  });

  it("media survives a restart within 48 hours (new connection, 47h later)", async () => {
    const idb = new IDBFactory();
    withIdb(idb);
    await writeDraft(FLOW, { step: 4 });
    await writeDraftMedia(FLOW, { photos: ["p1", "p2"] });
    withIdb(idb); // app killed + reopened
    const r = await readDraft(FLOW, Date.now() + 47 * HOUR);
    expect(r?.payload).toEqual({ step: 4 });
    expect(r?.media).toEqual({ photos: ["p1", "p2"] });
    expect(r?.mediaExpired).toBe(false);
  });

  it("after 48h the media is deleted while the answers survive (up to 7 days)", async () => {
    const s = withIdb();
    await writeDraft(FLOW, { step: 4 });
    await writeDraftMedia(FLOW, { photos: ["p1"] });
    const r = await readDraft(FLOW, Date.now() + 49 * HOUR);
    expect(r?.payload).toEqual({ step: 4 });
    expect(r?.media).toBeUndefined();
    expect(r?.mediaExpired).toBe(true);
    expect(await s.get(`${FLOW}:media`)).toBeUndefined(); // really gone
    // the answers are still there on day 6 …
    expect((await readDraft(FLOW, Date.now() + 6 * DAY))?.payload).toEqual({ step: 4 });
    // … and gone after day 7
    expect(await readDraft(FLOW, Date.now() + 7 * DAY + HOUR)).toBeUndefined();
    expect(await s.get(FLOW)).toBeUndefined();
  });

  it("both clocks run from the last activity: working on the order keeps its photos", async () => {
    const s = withIdb();
    await writeDraftMedia(FLOW, { photos: ["p1"] });
    // media written 3 days ago, but the customer saved answers just now
    const env = (await s.get(`${FLOW}:media`)) as { savedAt: number };
    await s.put(`${FLOW}:media`, { ...env, savedAt: Date.now() - 3 * DAY });
    await writeDraft(FLOW, { step: 5 });
    expect((await readDraft(FLOW))?.media).toEqual({ photos: ["p1"] });
  });

  it("the app-start sweep enforces retention without the form being opened", async () => {
    const s = withIdb();
    await writeDraft(FLOW, { step: 1 });
    await writeDraftMedia(FLOW, { photos: ["p1"] });
    await sweepExpiredDrafts(Date.now() + 49 * HOUR);
    expect(await s.get(`${FLOW}:media`)).toBeUndefined();
    expect(await s.get(FLOW)).toBeDefined();
    await sweepExpiredDrafts(Date.now() + 8 * DAY);
    expect(await s.get(FLOW)).toBeUndefined();
  });

  it("orphan media (no answers record) is deleted", async () => {
    const s = withIdb();
    await writeDraftMedia(FLOW, { photos: ["p1"] });
    expect(await readDraft(FLOW)).toBeUndefined();
    expect(await s.get(`${FLOW}:media`)).toBeUndefined();
  });

  it("an incompatible schema version fails safely: absent + everything deleted", async () => {
    const s = withIdb();
    await s.put(FLOW, { v: DRAFT_SCHEMA_VERSION + 1, flow: FLOW, savedAt: Date.now(), payload: { x: 1 } });
    await writeDraftMedia(FLOW, { photos: ["p1"] });
    await expect(readDraft(FLOW)).resolves.toBeUndefined();
    expect(await s.get(FLOW)).toBeUndefined();
    expect(await s.get(`${FLOW}:media`)).toBeUndefined();
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

  it("clear removes the answers AND the media", async () => {
    const s = withIdb();
    await writeDraft(FLOW, { step: 1 });
    await writeDraftMedia(FLOW, { photos: ["p1"] });
    await clearDraft(FLOW);
    expect(await s.get(FLOW)).toBeUndefined();
    expect(await s.get(`${FLOW}:media`)).toBeUndefined();
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
    expect((await readDraft(FLOW))?.payload).toEqual({ step: 2 });
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
