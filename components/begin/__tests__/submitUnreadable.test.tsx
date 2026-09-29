/**
 * Submission with a selected file the browser can no longer read (the
 * 2026-09-29 incident, TAL-2026-0018: an Android gallery / Google Photos file
 * whose temporary access was lost — the upload died in the browser after the
 * CORS preflight and every retry re-sent the same dead File).
 *
 * Drives the REAL submit path of the form (API + Turnstile mocked).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { forwardRef, useImperativeHandle } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { memoryStorage, setDraftStorage } from "@/lib/order/formDraft";
import { SignatureModel } from "@/lib/order/signaturePad";
import PersonalizedBookOrderForm, { emptyForm, type FormData } from "../PersonalizedBookOrderForm";
import { STEPS } from "../orderFormData";
import { restoreOrderDraft, splitMedia, toPersisted, type OrderDraft, type RestoredOrderDraft } from "../orderDraft";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/begin/personalized-book/form",
}));

vi.mock("../Turnstile", () => ({
  default: forwardRef(function FakeTurnstile(_p: unknown, ref) {
    useImperativeHandle(ref, () => ({ execute: async () => "turnstile-token" }));
    return null;
  }),
}));

const api = vi.hoisted(() => ({
  submitOrder: vi.fn(),
  uploadFile: vi.fn(),
  finalizeOrder: vi.fn(),
}));
vi.mock("@/lib/order/api", async (orig) => {
  const real = await orig<typeof import("@/lib/order/api")>();
  return {
    ...real,
    apiUrl: (p: string) => `https://api.test${p}`,
    submitOrder: api.submitOrder,
    uploadFile: api.uploadFile,
    finalizeOrder: api.finalizeOrder,
  };
});

// ── files ──────────────────────────────────────────────────────────────────
const photo = (n: string) => new File([`jpeg-bytes-${n}`], n, { type: "image/jpeg" });
const gone = () => Promise.reject(new DOMException("The file could not be read", "NotReadableError"));

/** Access lost right after the pick: nothing can be read any more. */
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
/** Google-Photos-style temp copy: the first bytes still read, the whole file
 *  no longer does (it changed / was cleaned up during the send). */
class HalfDeadFile extends File {
  override arrayBuffer(): Promise<ArrayBuffer> {
    return gone();
  }
}

function signature(): string {
  const m = new SignatureModel();
  const n = 160;
  m.begin(0.5, 0.5);
  for (let i = 1; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    m.extend(0.5 + 0.3 * Math.sin(t), 0.5 + 0.33 * Math.sin(t) * Math.cos(t));
  }
  m.end();
  return m.toJSON();
}

const CONSENT_STEP = STEPS.findIndex((s) => s.id === "consent");
const PHOTOS_STEP = STEPS.findIndex((s) => s.id === "photos");

function fullData(photos: File[]): FormData {
  const f = emptyForm("UZ");
  return {
    ...f,
    orderer: { ...f.orderer, honorific: "mr", name: "Sherzod Maxfiy", phone: "+998901234567" },
    children: [{ id: "c1", name: "Nodira", age: 7, phase02Done: true, phase03Done: true, photos }],
    personalMessage: "Seni yaxshi ko‘ramiz",
    bookLanguageCode: "uz",
    specialPhoto: photo("esdalik.jpg"),
    consentAuthority: true,
    consentPrivacy: true,
    consentTerms: true,
    consentDrawnSignature: signature(),
  } as FormData;
}

function restoredAtConsent(data: FormData): RestoredOrderDraft {
  const { text, manifest } = splitMedia(toPersisted(data));
  const payload: OrderDraft = {
    bookType: "single",
    data: text,
    phase: "steps",
    stepIndex: CONSENT_STEP,
    marketTouched: false,
    phase01Seeded: true,
    media: manifest,
  };
  const r = restoreOrderDraft(JSON.parse(JSON.stringify(payload)), emptyForm(), STEPS.length)!;
  // the live form data (with its files and the consent of THIS session)
  return { ...r, data, mediaGaps: [] };
}

const mount = (r: RestoredOrderDraft) =>
  render(
    <LanguageProvider>
      <PersonalizedBookOrderForm onBack={() => {}} restored={r} />
    </LanguageProvider>,
  );

const sendButton = () => screen.getAllByRole("button").find((b) => /yuborish|tasdiqlash|imzolash/i.test(b.textContent ?? ""))!;

let diagnostics: Array<Record<string, unknown>>;
const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
  if (String(url).endsWith("/v1/client-diagnostics")) diagnostics.push(JSON.parse(String(init?.body)));
  return new Response(null, { status: 204 });
});

beforeEach(() => {
  setDraftStorage(memoryStorage());
  diagnostics = [];
  vi.stubGlobal("fetch", fetchMock);
  api.submitOrder.mockReset().mockResolvedValue({
    orderCode: "TAL-2026-0099",
    capabilityToken: "cap-secret-token",
    childSlots: [{ childRef: "ref-1" }],
  });
  api.uploadFile.mockReset().mockResolvedValue(undefined);
  api.finalizeOrder.mockReset().mockResolvedValue({
    orderCode: "TAL-2026-0099",
    status: "COMPLETE",
    lifecycleStatus: "AWAITING_PAYMENT",
    resume: null,
    paymentCode: { code: "K7M4P2", expiresAt: new Date(Date.now() + 1e9).toISOString() },
    paymentCodeDelivery: null,
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  setDraftStorage(null);
});

/** Nothing identifying may ever reach a diagnostic. */
function expectPrivacySafe(d: Record<string, unknown>) {
  const all = JSON.stringify(d);
  for (const needle of ["Nodira", "Sherzod", "Maxfiy", "+998", "jpg", "esdalik", "TAL-", "cap-secret", "turnstile", "K7M4P2", "jpeg-bytes"]) {
    expect(all).not.toContain(needle);
  }
  expect(Object.keys(d).sort()).toEqual(
    expect.arrayContaining(["errorName", "failure", "fileType", "online", "stage"]),
  );
  for (const k of Object.keys(d)) {
    expect(["stage", "failure", "errorName", "httpStatus", "apiCode", "fileType", "online"]).toContain(k);
  }
}

describe("a selected file the browser can no longer read", () => {
  it("is caught BEFORE the order is created: no network, only that photo asked for again, answers intact", async () => {
    const u = userEvent.setup();
    mount(restoredAtConsent(fullData([photo("a.jpg"), new DeadFile(["x"], "b.jpg", { type: "image/jpeg" }), photo("c.jpg")])));
    await u.click(sendButton());

    // taken to the photos step, with the specific message — not the generic error
    await waitFor(() => expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(STEPS[PHOTOS_STEP]!.titleUz));
    const banner = document.querySelector('[data-media-reupload="banner"]')!;
    expect(banner.textContent).toContain("Bu suratni o‘qib bo‘lmadi. Iltimos, suratni qayta tanlang.");
    expect(banner.textContent).toMatch(/Nodira suratlari \(1 ta\)/);
    expect(document.body.textContent).not.toContain("Buyurtmangizni yuborishda xatolik");
    expect(document.querySelector('[data-media-reupload="inline"]')!.textContent).toContain("Bu suratni o‘qib bo‘lmadi");

    // no order, no upload
    expect(api.submitOrder).not.toHaveBeenCalled();
    expect(api.uploadFile).not.toHaveBeenCalled();

    // one privacy-safe diagnostic
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      stage: "child_photo_upload",
      failure: "file_read_failed",
      errorName: "NotReadableError",
      fileType: "image",
    });
    expectPrivacySafe(diagnostics[0]!);
  });

  it("an unreadable VOICE note: the voice message, on the step that owns it", async () => {
    const u = userEvent.setup();
    const data = {
      ...fullData([photo("a.jpg"), photo("b.jpg"), photo("c.jpg")]),
      keepsakeWantsVoice: true,
      finalVoice: new DeadFile(["x"], "ovoz.webm", { type: "audio/webm" }),
      finalVoiceDurationSec: 12,
    } as FormData;
    mount(restoredAtConsent(data));
    await u.click(sendButton());
    const banner = await waitFor(() => document.querySelector('[data-media-reupload="banner"]')!);
    expect(banner.textContent).toContain("Ovozli faylni o‘qib bo‘lmadi. Iltimos, uni qayta yozing yoki qayta tanlang.");
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      STEPS.find((s) => s.id === "personal-touch")!.titleUz,
    );
    expect(api.submitOrder).not.toHaveBeenCalled();
    expect(diagnostics[0]).toMatchObject({ stage: "voice_upload", failure: "file_read_failed", fileType: "audio" });
    expectPrivacySafe(diagnostics[0]!);
    // the answers are all still there
    expect(screen.getByDisplayValue("Seni yaxshi ko‘ramiz")).toBeInTheDocument();
  });

  it("dies DURING the send (probe ok, full read fails): the order + already-sent photos are kept, the dead File is never uploaded", async () => {
    const u = userEvent.setup();
    const half = new HalfDeadFile(["x"], "b.jpg", { type: "image/jpeg" });
    mount(restoredAtConsent(fullData([photo("a.jpg"), half, photo("c.jpg")])));
    await u.click(sendButton());
    await waitFor(() => expect(document.querySelector('[data-media-reupload="banner"]')).not.toBeNull());

    expect(api.submitOrder).toHaveBeenCalledTimes(1);
    expect(api.uploadFile).toHaveBeenCalledTimes(1); // photo a only
    const sent = api.uploadFile.mock.calls.map((c) => c[0].file as File);
    expect(sent.map((f) => f.name)).toEqual(["a.jpg"]);
    expect(sent.some((f) => f === half)).toBe(false);
    // the upload body is an in-memory COPY, never the original picked File
    expect(sent[0]).toBeInstanceOf(File);
    expect(api.finalizeOrder).not.toHaveBeenCalled();
    expect(diagnostics.at(-1)).toMatchObject({ stage: "child_photo_upload", failure: "file_read_failed" });
    for (const d of diagnostics) expectPrivacySafe(d);
  });
});

describe("a readable file whose upload fails on the network", () => {
  it("keeps the file, shows the retryable error; the retry re-uses the SAME order and sends each photo exactly once", async () => {
    const u = userEvent.setup();
    api.uploadFile
      .mockResolvedValueOnce(undefined) // a
      .mockRejectedValueOnce(new TypeError("Failed to fetch")); // b, first try
    mount(restoredAtConsent(fullData([photo("a.jpg"), photo("b.jpg"), photo("c.jpg")])));
    await u.click(sendButton());
    await waitFor(() => expect(document.body.textContent).toContain("Buyurtmangizni yuborishda xatolik"));
    expect(document.querySelector('[data-media-reupload="banner"]')).toBeNull(); // nothing to re-select
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      stage: "child_photo_upload",
      failure: "network_failed",
      errorName: "TypeError",
      fileType: "image",
    });
    expectPrivacySafe(diagnostics[0]!);

    await u.click(sendButton()); // retry
    await waitFor(() => expect(api.finalizeOrder).toHaveBeenCalledTimes(1));
    expect(api.submitOrder).toHaveBeenCalledTimes(1);
    const names = api.uploadFile.mock.calls.map((c) => (c[0].file as File).name);
    expect(names).toEqual(["a.jpg", "b.jpg", "b.jpg", "c.jpg", "esdalik.jpg"]);
  });
});
