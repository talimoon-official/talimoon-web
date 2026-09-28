/**
 * The unfinished order, kept on THIS DEVICE until it is sent.
 *
 * TALIMOON's form is long (and carries 3–5 photos per child), so losing it to
 * a reload, a closed PWA or the OS evicting a backgrounded tab is not
 * acceptable. The draft is ONE structured record in IndexedDB — not scattered
 * localStorage keys — because it must hold File objects (photos, the voice
 * note) as-is, and IndexedDB stores them by structured clone without base64
 * blow-up. Where IndexedDB is unavailable (some in-app browsers, private
 * modes) it degrades to tab memory: same API, nothing breaks.
 *
 * WHAT goes in is decided by the caller's explicit allowlist (see
 * components/begin/orderDraft.ts) — never the whole component state. No
 * capability / payment / resume token, payment code or signature is ever
 * written here.
 *
 * Every record carries a schema version and the flow it belongs to. A record
 * from another version, flow, or older than MAX_AGE_MS is DELETED on read and
 * reported as absent — an old draft can never crash a newer form.
 *
 * The record is deleted the moment an order is saved (finalized), so a
 * completed order can never reopen as an editable draft.
 */

/** Bump when the persisted shape changes incompatibly. Old records are then
 *  discarded (or migrated in `readDraft`, if a migration is written). */
export const DRAFT_SCHEMA_VERSION = 1;

/** A draft untouched for this long was abandoned; it is deleted, not restored. */
export const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type DraftFlow = "personalized-book";

export interface DraftEnvelope<T> {
  v: number;
  flow: DraftFlow;
  savedAt: number;
  payload: T;
}

/** The storage seam (IndexedDB in the browser, memory in tests / fallback). */
export interface DraftStorage {
  get(key: string): Promise<unknown>;
  put(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
}

// ── IndexedDB ────────────────────────────────────────────────────────────────

const DB_NAME = "talimoon-order";
const STORE = "drafts";

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function indexedDbStorage(idb: IDBFactory): DraftStorage {
  let dbp: Promise<IDBDatabase> | null = null;
  const open = () => {
    if (!dbp) {
      dbp = new Promise<IDBDatabase>((resolve, reject) => {
        const req = idb.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        req.onblocked = () => reject(new Error("idb blocked"));
      });
      // a failed open must not poison every later call
      dbp.catch(() => {
        dbp = null;
      });
    }
    return dbp;
  };
  const run = async <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) => {
    const db = await open();
    const tx = db.transaction(STORE, mode);
    const result = await promisify(fn(tx.objectStore(STORE)));
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error("idb abort"));
    });
    return result;
  };
  return {
    get: (key) => run("readonly", (s) => s.get(key)),
    put: async (key, value) => {
      await run("readwrite", (s) => s.put(value, key));
    },
    delete: async (key) => {
      await run("readwrite", (s) => s.delete(key));
    },
  };
}

export function memoryStorage(): DraftStorage {
  const m = new Map<string, unknown>();
  return {
    get: async (k) => m.get(k),
    put: async (k, v) => void m.set(k, v),
    delete: async (k) => void m.delete(k),
  };
}

let storage: DraftStorage | null = null;
function defaultStorage(): DraftStorage {
  if (!storage) {
    storage =
      typeof indexedDB !== "undefined" && indexedDB ? indexedDbStorage(indexedDB) : memoryStorage();
  }
  return storage;
}

/** Tests inject a storage; `null` restores the default. */
export function setDraftStorage(s: DraftStorage | null): void {
  storage = s;
}

// ── the versioned record ─────────────────────────────────────────────────────

export async function readDraft<T>(flow: DraftFlow, now = Date.now()): Promise<T | undefined> {
  const s = defaultStorage();
  let raw: unknown;
  try {
    raw = await s.get(flow);
  } catch {
    return undefined;
  }
  if (raw == null) return undefined;
  const env = raw as Partial<DraftEnvelope<T>>;
  const valid =
    typeof env === "object" &&
    env.v === DRAFT_SCHEMA_VERSION &&
    env.flow === flow &&
    typeof env.savedAt === "number" &&
    now - env.savedAt <= MAX_AGE_MS &&
    env.payload != null;
  if (!valid) {
    // incompatible version, foreign shape or expired: discard, never guess
    await s.delete(flow).catch(() => {});
    return undefined;
  }
  return env.payload as T;
}

export async function writeDraft<T>(flow: DraftFlow, payload: T): Promise<void> {
  const env: DraftEnvelope<T> = { v: DRAFT_SCHEMA_VERSION, flow, savedAt: Date.now(), payload };
  await defaultStorage().put(flow, env);
}

export async function clearDraft(flow: DraftFlow): Promise<void> {
  await defaultStorage()
    .delete(flow)
    .catch(() => {});
}
