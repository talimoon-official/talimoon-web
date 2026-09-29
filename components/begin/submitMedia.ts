/**
 * The media part of the order submission: which selected files still have
 * to be uploaded, whether the browser can still read them, and — when it
 * cannot — how the form recovers by asking for ONLY those files again.
 *
 * "Already uploaded" is tracked by the File object itself (a WeakSet held
 * in the submission session), not by an index: removing an unreadable photo
 * and adding a new one can never shift another photo's done-state, so a
 * retry never re-sends (and duplicates) one that already landed.
 */

import type { AdditionalCharacter } from "@/lib/order/types";
import { probeReadable } from "@/lib/order/fileReadability";
import type { SubmitStage } from "@/lib/order/submitDiagnostics";
import type { MediaGap } from "./orderDraft";

/** The slice of the form the submission reads. */
export interface MediaSource {
  children: Array<{ id: string; name: string; photos?: File[] }>;
  specialPhoto: File | null;
  keepsakeWantsVoice: boolean | null;
  finalVoice: File | null;
  additionalCharacters: AdditionalCharacter[];
}

export type PendingMedia =
  | { kind: "child"; childIndex: number; childId: string; file: File }
  | { kind: "special"; file: File }
  | { kind: "voice"; file: File }
  | { kind: "character"; characterId: string; file: File };

export function stageOf(m: PendingMedia): SubmitStage {
  switch (m.kind) {
    case "child":
      return "child_photo_upload";
    case "special":
      return "keepsake_photo_upload";
    case "voice":
      return "voice_upload";
    case "character":
      return "character_photo_upload";
  }
}

/** Every file still to upload, in the upload order (child photos, keepsake
 *  photo, voice note, character photos). */
export function pendingMedia(
  data: MediaSource,
  namedCharacters: AdditionalCharacter[],
  uploaded: WeakSet<Blob>,
): PendingMedia[] {
  const out: PendingMedia[] = [];
  data.children.forEach((c, childIndex) => {
    for (const file of c.photos ?? []) {
      if (!uploaded.has(file)) out.push({ kind: "child", childIndex, childId: c.id, file });
    }
  });
  if (data.specialPhoto && !uploaded.has(data.specialPhoto)) out.push({ kind: "special", file: data.specialPhoto });
  if (data.keepsakeWantsVoice === true && data.finalVoice && !uploaded.has(data.finalVoice)) {
    out.push({ kind: "voice", file: data.finalVoice });
  }
  for (const ch of namedCharacters) {
    for (const file of ch.photos) {
      if (!uploaded.has(file)) out.push({ kind: "character", characterId: ch.id, file });
    }
  }
  return out;
}

/** The pending files the browser can no longer read (cheap first-bytes probe). */
export async function findUnreadable(items: PendingMedia[]): Promise<Array<PendingMedia & { errorName: string }>> {
  const bad: Array<PendingMedia & { errorName: string }> = [];
  for (const m of items) {
    const r = await probeReadable(m.file);
    if (!r.ok) bad.push({ ...m, errorName: r.errorName });
  }
  return bad;
}

/** Thrown from inside the upload loop when one file turns out unreadable. */
export class UnreadableMediaError extends Error {
  constructor(readonly items: Array<PendingMedia & { errorName: string }>) {
    super("unreadable media");
    this.name = "UnreadableMediaError";
  }
}

/**
 * Remove exactly the unreadable files from the answers and describe the gaps
 * to show. Everything else — every answer, every readable file — is kept.
 */
export function withoutUnreadable<T extends MediaSource>(
  data: T,
  bad: PendingMedia[],
): { data: T; gaps: MediaGap[] } {
  const dead = new Set<Blob>(bad.map((b) => b.file));
  const gaps: MediaGap[] = [];

  const children = data.children.map((c) => {
    const photos = c.photos ?? [];
    const kept = photos.filter((p) => !dead.has(p));
    if (kept.length === photos.length) return c;
    gaps.push({
      kind: "child",
      id: c.id,
      name: c.name,
      count: photos.length - kept.length,
      reason: "unreadable",
      expected: photos.length,
    });
    return { ...c, photos: kept };
  });

  const additionalCharacters = data.additionalCharacters.map((ch) => {
    const kept = ch.photos.filter((p) => !dead.has(p));
    if (kept.length === ch.photos.length) return ch;
    gaps.push({
      kind: "character",
      id: ch.id,
      name: ch.name,
      count: ch.photos.length - kept.length,
      reason: "unreadable",
      expected: ch.photos.length,
    });
    return { ...ch, photos: kept };
  });

  let specialPhoto = data.specialPhoto;
  if (specialPhoto && dead.has(specialPhoto)) {
    specialPhoto = null;
    gaps.push({ kind: "special", reason: "unreadable" });
  }
  let finalVoice = data.finalVoice;
  const voiceGone = !!finalVoice && dead.has(finalVoice);
  if (voiceGone) {
    finalVoice = null;
    gaps.push({ kind: "voice", reason: "unreadable" });
  }

  return {
    data: {
      ...data,
      children,
      additionalCharacters,
      specialPhoto,
      finalVoice,
      ...(voiceGone ? { finalVoiceDurationSec: null } : {}),
    },
    gaps,
  };
}

/** A new gap replaces an older one for the same slot. */
export function mergeGaps(prev: MediaGap[], next: MediaGap[]): MediaGap[] {
  const key = (g: MediaGap) => g.kind + ("id" in g ? `:${g.id}` : "");
  const replaced = new Set(next.map(key));
  return [...prev.filter((g) => !replaced.has(key(g))), ...next];
}
