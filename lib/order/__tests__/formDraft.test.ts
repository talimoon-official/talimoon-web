import { describe, it, expect, afterEach } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import {
  DRAFT_SCHEMA_VERSION,
  MAX_AGE_MS,
  clearDraft,
  indexedDbStorage,
  memoryStorage,
  readDraft,
  setDraftStorage,
  writeDraft,
  type DraftStorage,
} from "../formDraft";
import { consumeReturnedToMenu, markReturnedToMenu } from "../menuReturn";

afterEach(() => setDraftStorage(null));

function withIdb(): DraftStorage {
  const s = indexedDbStorage(new IDBFactory());
  setDraftStorage(s);
  return s;
}

describe("persistent draft store (IndexedDB)", () => {
  it("round-trips one structured record per flow", async () => {
    withIdb();
    await writeDraft("personalized-book", { phase: "world", data: { a: 1 } });
    expect(await readDraft("personalized-book")).toEqual({ phase: "world", data: { a: 1 } });
  });

  it("survives a 'restart': a NEW storage handle on the same database sees the draft", async () => {
    const idb = new IDBFactory();
    setDraftStorage(indexedDbStorage(idb));
    await writeDraft("personalized-book", { step: 4 });
    // app killed + reopened = a brand-new connection to the same origin DB
    setDraftStorage(indexedDbStorage(idb));
    expect(await readDraft("personalized-book")).toEqual({ step: 4 });
  });

  it("an incompatible schema version fails safely: absent + deleted, never thrown", async () => {
    const s = withIdb();
    await s.put("personalized-book", { v: DRAFT_SCHEMA_VERSION + 1, flow: "personalized-book", savedAt: Date.now(), payload: { x: 1 } });
    await expect(readDraft("personalized-book")).resolves.toBeUndefined();
    expect(await s.get("personalized-book")).toBeUndefined();
  });

  it("garbage in the slot is discarded", async () => {
    const s = withIdb();
    await s.put("personalized-book", "not a draft");
    expect(await readDraft("personalized-book")).toBeUndefined();
    expect(await s.get("personalized-book")).toBeUndefined();
  });

  it("an expired draft is deleted, not restored", async () => {
    withIdb();
    await writeDraft("personalized-book", { step: 1 });
    expect(await readDraft("personalized-book", Date.now() + MAX_AGE_MS + 1)).toBeUndefined();
    expect(await readDraft("personalized-book")).toBeUndefined();
  });

  it("clear removes it", async () => {
    withIdb();
    await writeDraft("personalized-book", { step: 1 });
    await clearDraft("personalized-book");
    expect(await readDraft("personalized-book")).toBeUndefined();
  });

  it("a failing storage reads as 'no draft' instead of throwing", async () => {
    setDraftStorage({
      get: () => Promise.reject(new Error("blocked")),
      put: () => Promise.reject(new Error("blocked")),
      delete: () => Promise.reject(new Error("blocked")),
    });
    await expect(readDraft("personalized-book")).resolves.toBeUndefined();
    await expect(clearDraft("personalized-book")).resolves.toBeUndefined();
  });

  it("memory fallback has the same behaviour", async () => {
    setDraftStorage(memoryStorage());
    await writeDraft("personalized-book", { step: 2 });
    expect(await readDraft("personalized-book")).toEqual({ step: 2 });
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
