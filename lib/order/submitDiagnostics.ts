/**
 * Privacy-safe diagnostics for order-submission failures.
 *
 * The 2026-09-29 incident (TAL-2026-0018) could only be reconstructed from
 * server logs, because a request that dies in the browser never reaches the
 * server and the customer only saw the generic error. Now each failure sends
 * ONE small, fixed-shape report to the intake service:
 *
 *   stage     order_create | child_photo_upload | keepsake_photo_upload |
 *             character_photo_upload | voice_upload | finalize
 *   failure   file_read_failed | network_failed | timeout | aborted | http_error
 *   errorName an allowlisted browser error name (never a message)
 *   httpStatus / apiCode   for http_error only (server-defined codes)
 *   fileType  image | audio | other | none — the MIME family only
 *   online    navigator.onLine
 *
 * NEVER: names, phone, address, filenames, file contents, order code,
 * payment code, tokens, URLs. The server validates the same allowlists.
 * Fire-and-forget: a report can never affect the submission itself.
 */

import { apiUrl, IntakeApiError } from "./api";
import { RequestTimeoutError } from "@/lib/net/fetchWithTimeout";
import { FileUnreadableError, errorNameOf } from "./fileReadability";

export type SubmitStage =
  | "order_create"
  | "child_photo_upload"
  | "keepsake_photo_upload"
  | "character_photo_upload"
  | "voice_upload"
  | "finalize";

export type SubmitFailure = "file_read_failed" | "network_failed" | "timeout" | "aborted" | "http_error";
export type FileTypeCategory = "image" | "audio" | "other" | "none";

export const ERROR_NAMES = [
  "NotReadableError",
  "NotFoundError",
  "NotAllowedError",
  "SecurityError",
  "AbortError",
  "TypeError",
  "EmptyFile",
  "FileChanged",
  "RequestTimeoutError",
  "IntakeApiError",
  "Error",
  "other",
] as const;
export type ErrorName = (typeof ERROR_NAMES)[number];

export interface SubmitDiagnostic {
  stage: SubmitStage;
  failure: SubmitFailure;
  errorName: ErrorName;
  httpStatus?: number;
  apiCode?: string;
  fileType: FileTypeCategory;
  online: boolean;
}

export function fileTypeCategory(file: Blob | null | undefined): FileTypeCategory {
  if (!file) return "none";
  const t = (file.type || "").toLowerCase();
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("audio/") || t.startsWith("video/webm")) return "audio";
  return "other";
}

function allowName(n: string): ErrorName {
  return (ERROR_NAMES as readonly string[]).includes(n) ? (n as ErrorName) : "other";
}

/** Server-defined error codes are [a-z_]; anything else is dropped. */
function safeApiCode(code: string | undefined): string | undefined {
  return code && /^[a-z_]{1,40}$/.test(code) ? code : undefined;
}

export function classifySubmitError(
  stage: SubmitStage,
  err: unknown,
  file: Blob | null = null,
): SubmitDiagnostic {
  const online = typeof navigator === "undefined" ? true : navigator.onLine !== false;
  const base = { stage, fileType: fileTypeCategory(file), online };
  if (err instanceof FileUnreadableError) {
    return { ...base, failure: "file_read_failed", errorName: allowName(err.errorName) };
  }
  if (err instanceof RequestTimeoutError) return { ...base, failure: "timeout", errorName: "RequestTimeoutError" };
  if (err instanceof IntakeApiError) {
    return {
      ...base,
      failure: "http_error",
      errorName: "IntakeApiError",
      httpStatus: err.status,
      ...(safeApiCode(err.code) ? { apiCode: safeApiCode(err.code) } : {}),
    };
  }
  const name = errorNameOf(err);
  if (name === "AbortError") return { ...base, failure: "aborted", errorName: "AbortError" };
  return { ...base, failure: "network_failed", errorName: allowName(name) };
}

/** Fire-and-forget. Never throws, never blocks the caller. */
export function reportSubmitDiagnostic(d: SubmitDiagnostic): void {
  try {
    void fetch(apiUrl("/v1/client-diagnostics"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(d),
      keepalive: true,
      credentials: "omit",
    }).catch(() => {});
  } catch {
    /* no API configured / fetch unavailable: diagnostics are optional */
  }
}
