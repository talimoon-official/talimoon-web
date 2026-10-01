/**
 * The unfinished order, kept on THIS DEVICE until it is sent.
 *
 * TALIMOON's form is long, so losing the typed answers to a reload, a closed
 * PWA or the OS evicting a backgrounded tab is not acceptable. The draft
 * lives in IndexedDB (one structured record per flow; tab memory where
 * IndexedDB is unavailable — some in-app browsers, private modes).
 *
 * TEXT + CHOICES + PROGRESS ONLY. Photos, voice notes and any other file are
 * NEVER written here (product decision, 2026-10-01): after a later resume
 * the form asks for the required files again (components/begin/orderDraft
 * `resumeStepFor`). The record is kept 7 days from the LAST TIME THE
 * CUSTOMER WORKED ON THE ORDER (`savedAt`, refreshed on every debounced
 * save); `sweepExpiredDrafts()` enforces that on every app start.
 *
 * Earlier builds kept a separate "<flow>:media" record (photos + voice, 48h).
 * It is no longer written; any such record still on a device is deleted on
 * the next read / sweep / clear.
 *
 * No encryption: any key this same-origin app could read back would sit
 * next to the data and guard nothing against the only realistic attacker
 * (script running in our origin). IndexedDB is origin-scoped — no other
 * site can read it; the protection that matters is the CSP / XSS posture.
 *
 * WHAT goes in is decided by the caller's explicit allowlist
 * (components/begin/orderDraft.ts) — never the whole component state. No
 * capability / payment / resume token, payment code, signature, consent or
 * file is ever written here.
 *
 * A record of another schema version / flow, or past its age, is DELETED on
 * read and treated as absent — an old draft can never crash a newer form.
 */

/** Bump when the persisted shape changes incompatibly. Old records are then
 *  discarded (or migrated in `readDraft`, if a migration is written).
 *  v2: answers record carries a count-only media manifest. (Unchanged when
 *  media stopped being persisted: v2 answers records stay valid.) */
export const DRAFT_SCHEMA_VERSION = 2;

/** Answers + position: deleted 7 days after the last activity. */
export const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type DraftFlow = "personalized-book";
const FLOWS: readonly DraftFlow[] = ["personalized-book"];
/** Written by builds before 2026-10-01 only; now just deleted. */
export const legacyMediaKey = (flow: DraftFlow) => `${flow}:media`;

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

export const DB_NAME = "talimoon-order";
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

// ── the versioned records ────────────────────────────────────────────────────

function validEnvelope(raw: unknown, flow: DraftFlow): raw is DraftEnvelope<unknown> {
  const env = raw as Partial<DraftEnvelope<unknown>> | null;
  return (
    typeof env === "object" &&
    env !== null &&
    env.v === DRAFT_SCHEMA_VERSION &&
    env.flow === flow &&
    typeof env.savedAt === "number" &&
    env.payload != null
  );
}

/**
 * Reads the answers record. Expired / foreign records are deleted. A legacy
 * media record (older builds) is always deleted — media is never restored.
 */
export async function readDraft<T>(flow: DraftFlow, now = Date.now()): Promise<T | undefined> {
  const s = defaultStorage();
  let raw: unknown;
  try {
    raw = await s.get(flow);
    if ((await s.get(legacyMediaKey(flow))) != null) await s.delete(legacyMediaKey(flow)).catch(() => {});
  } catch {
    return undefined;
  }
  if (raw == null) return undefined;
  if (!validEnvelope(raw, flow) || now - raw.savedAt > MAX_AGE_MS) {
    // incompatible version, foreign shape or expired: discard all, never guess
    await clearDraft(flow);
    return undefined;
  }
  return raw.payload as T;
}

/** Writes the answers record (refreshing the activity clock). */
export async function writeDraft<T>(flow: DraftFlow, payload: T): Promise<void> {
  const env: DraftEnvelope<T> = { v: DRAFT_SCHEMA_VERSION, flow, savedAt: Date.now(), payload };
  await defaultStorage().put(flow, env);
}

/** Deletes the draft of a flow (and any legacy media record). */
export async function clearDraft(flow: DraftFlow): Promise<void> {
  const s = defaultStorage();
  await Promise.all([s.delete(flow).catch(() => {}), s.delete(legacyMediaKey(flow)).catch(() => {})]);
}

/**
 * Enforces the retention window without the form being opened: run once per
 * app start. Reading applies every rule (expired → deleted; legacy media
 * record → deleted).
 */
export async function sweepExpiredDrafts(now = Date.now()): Promise<void> {
  for (const flow of FLOWS) await readDraft(flow, now).catch(() => {});
}

// ── flushing before a controlled reload ──────────────────────────────────────
//
// An app update or stale-build recovery may reload the page. Before it does,
// every mounted form's pending (debounced) draft save is written and every
// in-flight IndexedDB write is awaited, so nothing typed is lost. This only
// WRITES the draft — reloads never clear or delete it.

type Flusher = () => Promise<void> | void;
const flushers = new Set<Flusher>();

/** A mounted draft saver registers its `flush`; returns the unregister. */
export function registerDraftFlusher(fn: Flusher): () => void {
  flushers.add(fn);
  return () => {
    flushers.delete(fn);
  };
}

/** Writes every pending draft now; resolves when done or after `timeoutMs`. */
export async function flushDraftWrites(timeoutMs = 2500): Promise<void> {
  const all = Promise.allSettled([...flushers].map((f) => Promise.resolve().then(f)));
  await Promise.race([all, new Promise((r) => setTimeout(r, timeoutMs))]);
}
