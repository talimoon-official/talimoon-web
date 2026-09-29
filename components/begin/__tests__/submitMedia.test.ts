import { describe, it, expect } from "vitest";
import { findUnreadable, mergeGaps, pendingMedia, withoutUnreadable, type MediaSource } from "../submitMedia";
import { gapIsOpen, type MediaGap } from "../orderDraft";
import { materializeFile, probeReadable, FileUnreadableError } from "@/lib/order/fileReadability";
import type { FormData } from "../PersonalizedBookOrderForm";

const photo = (n: string, type = "image/jpeg") => new File([`bytes-${n}`], n, { type });
const gone = () => Promise.reject(new DOMException("gone", "NotReadableError"));
class DeadFile extends File {
  override slice(): Blob {
    const b = new Blob(["x"]);
    Object.defineProperty(b, "arrayBuffer", { value: gone });
    return b;
  }
  override arrayBuffer(): Promise<ArrayBuffer> {
    return gone();
  }
}
const dead = (n: string, type = "image/jpeg") => new DeadFile(["x"], n, { type });

function source(over: Partial<MediaSource> = {}): MediaSource & { finalVoiceDurationSec: number | null; wantsCharacters: boolean } {
  return {
    children: [
      { id: "c1", name: "Nodira", photos: [photo("a"), photo("b"), photo("c")] },
      { id: "c2", name: "Vali", photos: [photo("d")] },
    ],
    specialPhoto: photo("s"),
    keepsakeWantsVoice: true,
    finalVoice: photo("v.webm", "audio/webm"),
    finalVoiceDurationSec: 9,
    additionalCharacters: [
      { id: "k1", relation: "Otasi", name: "Aziz", photos: [photo("k")] } as MediaSource["additionalCharacters"][number],
    ],
    wantsCharacters: true,
    ...over,
  };
}

describe("fileReadability", () => {
  it("a readable file probes ok and materializes into an in-memory copy with the same bytes/type", async () => {
    const f = photo("a");
    expect(await probeReadable(f)).toEqual({ ok: true });
    const copy = await materializeFile(f);
    expect(copy).not.toBe(f);
    expect(copy.type).toBe("image/jpeg");
    expect(copy.size).toBe(f.size);
    expect(await copy.text()).toBe("bytes-a");
  });

  it("a dead file fails the probe with the error NAME only; an empty file counts as unreadable", async () => {
    expect(await probeReadable(dead("x"))).toEqual({ ok: false, errorName: "NotReadableError" });
    expect(await probeReadable(new File([], "e.jpg"))).toEqual({ ok: false, errorName: "EmptyFile" });
    await expect(materializeFile(dead("x"))).rejects.toBeInstanceOf(FileUnreadableError);
  });

  it("a file that changed size after it was picked is refused", async () => {
    const f = photo("abc");
    Object.defineProperty(f, "size", { value: 999 });
    await expect(materializeFile(f)).rejects.toMatchObject({ errorName: "FileChanged" });
  });
});

describe("submitMedia", () => {
  it("pending media skips what already uploaded (by File identity), in the upload order", () => {
    const s = source();
    const uploaded = new WeakSet<Blob>([s.children[0]!.photos![0]!, s.specialPhoto!]);
    const kinds = pendingMedia(s, s.additionalCharacters, uploaded).map((m) => m.kind);
    expect(kinds).toEqual(["child", "child", "child", "voice", "character"]);
  });

  it("the voice note is only pending when the customer said yes", () => {
    const s = source({ keepsakeWantsVoice: false });
    expect(pendingMedia(s, [], new WeakSet()).some((m) => m.kind === "voice")).toBe(false);
  });

  it("finds exactly the unreadable files", async () => {
    const s = source();
    s.children[0]!.photos![1] = dead("b");
    s.finalVoice = dead("v.webm", "audio/webm");
    const bad = await findUnreadable(pendingMedia(s, s.additionalCharacters, new WeakSet()));
    expect(bad.map((b) => [b.kind, b.errorName])).toEqual([
      ["child", "NotReadableError"],
      ["voice", "NotReadableError"],
    ]);
  });

  it("removes ONLY the affected files; every other file and answer is kept; one gap per slot", async () => {
    const s = source();
    const deadB = dead("b");
    s.children[0]!.photos![1] = deadB;
    const keptA = s.children[0]!.photos![0]!;
    const bad = await findUnreadable(pendingMedia(s, s.additionalCharacters, new WeakSet()));
    const { data, gaps } = withoutUnreadable(s, bad);
    expect(data.children[0]!.photos).toEqual([keptA, s.children[0]!.photos![2]]);
    expect(data.children[1]).toBe(s.children[1]); // untouched object
    expect(data.specialPhoto).toBe(s.specialPhoto);
    expect(data.finalVoice).toBe(s.finalVoice);
    expect(data.finalVoiceDurationSec).toBe(9);
    expect(data.additionalCharacters).toEqual(s.additionalCharacters);
    expect(gaps).toEqual([{ kind: "child", id: "c1", name: "Nodira", count: 1, reason: "unreadable", expected: 3 }]);
  });

  it("the gap stays open until the child has its photo count again (re-selection closes it)", async () => {
    const s = source();
    s.children[0]!.photos![1] = dead("b");
    const { data, gaps } = withoutUnreadable(s, await findUnreadable(pendingMedia(s, [], new WeakSet())));
    const asForm = (d: typeof data) => d as unknown as FormData;
    expect(gapIsOpen(gaps[0]!, asForm(data))).toBe(true);
    const refilled = { ...data, children: data.children.map((c) => (c.id === "c1" ? { ...c, photos: [...c.photos!, photo("new")] } : c)) };
    expect(gapIsOpen(gaps[0]!, asForm(refilled))).toBe(false);
  });

  it("an unreadable voice note clears the take (and its duration); keepsake / character photos likewise", async () => {
    const s = source();
    s.finalVoice = dead("v.webm", "audio/webm");
    s.specialPhoto = dead("s");
    s.additionalCharacters[0]!.photos = [dead("k")];
    const { data, gaps } = withoutUnreadable(s, await findUnreadable(pendingMedia(s, s.additionalCharacters, new WeakSet())));
    expect(data.finalVoice).toBeNull();
    expect(data.finalVoiceDurationSec).toBeNull();
    expect(data.specialPhoto).toBeNull();
    expect(data.additionalCharacters[0]!.photos).toEqual([]);
    expect(gaps.map((g) => g.kind).sort()).toEqual(["character", "special", "voice"]);
  });

  it("a new gap replaces the old one for the same slot (never listed twice)", () => {
    const prev: MediaGap[] = [
      { kind: "child", id: "c1", name: "Nodira", count: 3 },
      { kind: "voice" },
    ];
    const next: MediaGap[] = [{ kind: "child", id: "c1", name: "Nodira", count: 1, reason: "unreadable", expected: 3 }];
    expect(mergeGaps(prev, next)).toEqual([{ kind: "voice" }, next[0]]);
  });
});
