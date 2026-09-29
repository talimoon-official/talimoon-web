/**
 * Is a selected photo / voice file still readable — and a copy that no
 * longer depends on the original.
 *
 * On Android a File from the gallery (and especially a Google Photos item,
 * which is a temporary copy behind a content URI) is read LAZILY: the
 * browser only opens it when the upload body is streamed. If the grant was
 * revoked (app backgrounded for a long time, the temp copy cleaned up) or the
 * file changed after it was picked, the read fails mid-request — the browser
 * drops the upload after the CORS preflight and the server never sees it
 * (production incident 2026-09-29, TAL-2026-0018). Every retry then re-sends
 * the same dead File and fails the same way.
 *
 * So, before any network:
 *  - `probeReadable` reads the first bytes of every pending file (cheap), so
 *    an unreadable one is found BEFORE the order is even created;
 *  - `materializeFile` reads the whole file into memory right before its
 *    upload and returns an in-memory File: the upload body can no longer be
 *    pulled out from under the request.
 */

export class FileUnreadableError extends Error {
  constructor(readonly errorName: string) {
    super("file unreadable");
    this.name = "FileUnreadableError";
  }
}

const PROBE_BYTES = 64 * 1024;

function readBytes(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === "function") return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = () => reject(r.error ?? new Error("read failed"));
    r.readAsArrayBuffer(blob);
  });
}

/** A DOMException / Error name only — never a message (it can hold a path). */
export function errorNameOf(err: unknown): string {
  const n = (err as { name?: unknown } | null)?.name;
  return typeof n === "string" && n ? n : "Error";
}

export async function probeReadable(file: Blob): Promise<{ ok: true } | { ok: false; errorName: string }> {
  try {
    if (file.size === 0) return { ok: false, errorName: "EmptyFile" };
    const buf = await readBytes(file.slice(0, Math.min(file.size, PROBE_BYTES)));
    if (buf.byteLength === 0) return { ok: false, errorName: "EmptyFile" };
    return { ok: true };
  } catch (err) {
    return { ok: false, errorName: errorNameOf(err) };
  }
}

/** The whole file, copied into memory. Throws FileUnreadableError. */
export async function materializeFile(file: File): Promise<File> {
  let buf: ArrayBuffer;
  try {
    buf = await readBytes(file);
  } catch (err) {
    throw new FileUnreadableError(errorNameOf(err));
  }
  // a file that changed size after it was picked is not the file we checked
  if (buf.byteLength === 0 || buf.byteLength !== file.size) throw new FileUnreadableError("FileChanged");
  return new File([buf], file.name, { type: file.type, lastModified: file.lastModified });
}
