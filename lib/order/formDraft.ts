/**
 * The unfinished order, kept on THIS DEVICE until it is sent.
 *
 * TALIMOON's form is long (and carries 3–5 photos per child), so losing it to
 * a reload, a closed PWA or the OS evicting a backgrounded tab is not
 * acceptable. The draft lives in IndexedDB — not scattered localStorage keys
 * — because it must hold File objects (photos, the voice note) as-is, by
 * structured clone, without base64 blow-up. Where IndexedDB is unavailable
 * (some in-app browsers, private modes) it degrades to tab memory.
 *
 * TWO records per flow, with different retention:
 *
 *   "<flow>"        the answers + form position        kept 7 days
 *   "<flow>:media"  photos + the voice note (Blobs)    kept 48 hours
 *
 * Both clocks run from the LAST TIME THE CUSTOMER WORKED ON THE ORDER (the
 * answers record's `savedAt`, refreshed on every debounced save). So an
 * order in progress never loses its photos mid-way, while photos of an
 * abandoned order leave the device 48 hours after it was abandoned — the
 * answers 7 days after. `sweepExpiredDrafts()` enforces this on every app
 * start, not only when the form is reopened.
 *
 * No encryption: any key this same-origin app could read back would sit
 * next to the data and guard nothing against the only realistic attacker
 * (script running in our origin). IndexedDB is origin-scoped — no other
 * site can read it; the protection that matters is the CSP / XSS posture.
 *
 * WHAT goes in is decided by the caller's explicit allowlist
 * (components/begin/orderDraft.ts) — never the whole component state. No
 * capability / payment / resume token, payment code or signature is ever
 * written here. Media Blobs are never logged, never put in URLs, in
 * localStorage/sessionStorage or in any report — only in the media record.
 *
 * A record of another schema version / flow, or past its age, is DELETED on
 * read and treated as absent — an old draft can never crash a newer form.
 */

/** Bump when the persisted shape changes incompatibly. Old records are then
 *  discarded (or migrated in `readDraft`, if a migration is written).
 *  v2: media split into its own record with a 48h retention. */
export const DRAFT_SCHEMA_VERSION = 2;

/** Answers + position: deleted 7 days after the last activity. */
export const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** Photos + voice note: deleted 48 hours after the last activity. */
export const MEDIA_MAX_AGE_MS = 48 * 60 * 60 * 1000;

export type DraftFlow = "personalized-book";
const FLOWS: readonly DraftFlow[] = ["personalized-book"];
const mediaKey = (flow: DraftFlow) => `${flow}:media`;

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

export interface DraftRead<T, M> {
  payload: T;
  /** undefined when there is no media record, or it has expired (and was
   *  deleted) — the caller compares with what the answers say existed */
  media: M | undefined;
  /** the media record existed but was past MEDIA_MAX_AGE_MS */
  mediaExpired: boolean;
}

export async function readDraft<T, M = unknown>(
  flow: DraftFlow,
  now = Date.now(),
): Promise<DraftRead<T, M> | undefined> {
  const s = defaultStorage();
  let raw: unknown;
  let rawMedia: unknown;
  try {
    raw = await s.get(flow);
    rawMedia = await s.get(mediaKey(flow));
  } catch {
    return undefined;
  }
  if (raw == null) {
    // media without answers is an orphan: never keep it
    if (rawMedia != null) await s.delete(mediaKey(flow)).catch(() => {});
    return undefined;
  }
  if (!validEnvelope(raw, flow) || now - raw.savedAt > MAX_AGE_MS) {
    // incompatible version, foreign shape or expired: discard all, never guess
    await clearDraft(flow);
    return undefined;
  }
  let media: M | undefined;
  let mediaExpired = false;
  if (rawMedia != null) {
    if (!validEnvelope(rawMedia, flow)) {
      await s.delete(mediaKey(flow)).catch(() => {});
    } else if (now - raw.savedAt > MEDIA_MAX_AGE_MS) {
      mediaExpired = true;
      await s.delete(mediaKey(flow)).catch(() => {});
    } else {
      media = rawMedia.payload as M;
    }
  }
  return { payload: raw.payload as T, media, mediaExpired };
}

/** Writes the answers record (refreshing the activity clock). */
export async function writeDraft<T>(flow: DraftFlow, payload: T): Promise<void> {
  const env: DraftEnvelope<T> = { v: DRAFT_SCHEMA_VERSION, flow, savedAt: Date.now(), payload };
  await defaultStorage().put(flow, env);
}

/** Writes (or, with null, deletes) the media record. */
export async function writeDraftMedia<M>(flow: DraftFlow, media: M | null): Promise<void> {
  if (media == null) {
    await defaultStorage().delete(mediaKey(flow));
    return;
  }
  const env: DraftEnvelope<M> = { v: DRAFT_SCHEMA_VERSION, flow, savedAt: Date.now(), payload: media };
  await defaultStorage().put(mediaKey(flow), env);
}

/** Deletes the answers AND the media of a flow. */
export async function clearDraft(flow: DraftFlow): Promise<void> {
  const s = defaultStorage();
  await Promise.all([s.delete(flow).catch(() => {}), s.delete(mediaKey(flow)).catch(() => {})]);
}

/**
 * Enforces both retention windows without the form being opened: run once
 * per app start. Reading applies every rule (expired answers → everything
 * deleted; expired media → media deleted; orphan media → deleted).
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
