import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import {
  memoryStorage,
  readDraft,
  setDraftStorage,
  writeDraft,
  writeDraftMedia,
  type DraftStorage,
} from "@/lib/order/formDraft";
import PersonalizedBookOrderForm, { emptyForm, type FormData } from "../PersonalizedBookOrderForm";
import { STEPS } from "../orderFormData";
import { restoreOrderDraft, splitMedia, toPersisted, type OrderDraft } from "../orderDraft";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/begin/personalized-book/form",
}));

const FLOW = "personalized-book";
const photo = (n: string) => new File(["x"], n, { type: "image/jpeg" });
const PHOTOS_STEP = STEPS.findIndex((s) => s.id === "photos");

function seededData(): FormData {
  const f = emptyForm("UZ");
  return {
    ...f,
    orderer: { ...f.orderer, honorific: "mr", name: "Sherzod" },
    children: [{ id: "c1", name: "Nodira", age: 7, phase02Done: true, phase03Done: true, photos: [photo("a"), photo("b"), photo("c")] }],
    personalMessage: "Seni yaxshi ko‘ramiz",
  };
}

function storedParts(extra: Partial<OrderDraft>, data = seededData()) {
  const { text, media, manifest } = splitMedia(toPersisted(data));
  const payload: OrderDraft = {
    bookType: "single",
    data: text,
    phase: "steps",
    stepIndex: 0,
    marketTouched: false,
    phase01Seeded: true,
    media: manifest,
    ...extra,
  };
  return { payload, media };
}

function restored(extra: Partial<OrderDraft>, withMedia = true) {
  const s = storedParts(extra);
  return restoreOrderDraft(JSON.parse(JSON.stringify(s.payload)), emptyForm(), STEPS.length, withMedia ? s.media : undefined)!;
}

let store: DraftStorage;
beforeEach(() => {
  store = memoryStorage();
  setDraftStorage(store);
});
afterEach(() => {
  setDraftStorage(null);
  vi.useRealTimers();
});

const mount = (r: ReturnType<typeof restored>) =>
  render(
    <LanguageProvider>
      <PersonalizedBookOrderForm onBack={() => {}} restored={r} />
    </LanguageProvider>,
  );

describe("the whole form reopens where the customer left it", () => {
  it("inside a per-child phase: the exact question, not the beginning", () => {
    mount(restored({ phase: "world", pos: { idx: 0, screen: "dream" } }));
    expect(screen.queryByRole("heading", { name: /Assalomu alaykum/ })).toBeNull();
    expect(screen.queryByRole("heading", { name: /nimalar qiziqtiradi/ })).toBeNull();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toMatch(/orzu|Nodira/i);
  });

  it("on a wizard step: that step, with its answers", () => {
    mount(restored({ phase: "steps", stepIndex: 0 }));
    expect(screen.getByRole("heading", { name: STEPS[0]!.titleUz })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Seni yaxshi ko‘ramiz")).toBeInTheDocument();
    expect(document.querySelector("[data-media-reupload]")).toBeNull(); // nothing expired
  });

  it("media expired: same step, answers intact, and ONLY the missing files are asked for", () => {
    mount(restored({ phase: "steps", stepIndex: PHOTOS_STEP }, false));
    // still on the photos step — not restarted
    expect(screen.getByRole("heading", { name: STEPS[PHOTOS_STEP]!.titleUz })).toBeInTheDocument();
    const banner = document.querySelector('[data-media-reupload="banner"]')!;
    expect(banner).not.toBeNull();
    expect(banner.textContent).toMatch(/48 soat/);
    expect(banner.textContent).toMatch(/Nodira suratlari \(3 ta\)/);
    const inline = document.querySelector('[data-media-reupload="inline"]')!;
    expect(inline.textContent).toMatch(/Nodira suratlari/);
    expect(screen.queryByText(/Assalomu alaykum/)).toBeNull();
  });

  it("the banner can be dismissed; the inline marker stays on the step until re-added", async () => {
    const u = userEvent.setup();
    mount(restored({ phase: "steps", stepIndex: PHOTOS_STEP }, false));
    await u.click(screen.getByRole("button", { name: "Tushunarli" }));
    expect(document.querySelector('[data-media-reupload="banner"]')).toBeNull();
    expect(document.querySelector('[data-media-reupload="inline"]')).not.toBeNull();
  });

  it("keeps saving after a restore (debounced), with consent never stored", async () => {
    vi.useFakeTimers();
    mount(restored({ phase: "steps", stepIndex: 0 }));
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    vi.useRealTimers();
    await vi.waitFor(async () => {
      const d = (await readDraft<OrderDraft>(FLOW))?.payload;
      expect(d?.phase).toBe("steps");
      expect(d?.data.orderer.name).toBe("Sherzod");
      expect(d && "consentDrawnSignature" in d.data).toBe(false);
    });
  });

  it("a fresh form writes nothing until the customer enters something", async () => {
    vi.useFakeTimers();
    render(
      <LanguageProvider>
        <PersonalizedBookOrderForm onBack={() => {}} />
      </LanguageProvider>,
    );
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    vi.useRealTimers();
    expect(await readDraft(FLOW)).toBeUndefined();
  });
});

describe("'Yangi buyurtma boshlash' deletes the previous draft AND its media", () => {
  it("through the real route: choice screen → start new → both records gone", async () => {
    const u = userEvent.setup();
    const s = storedParts({ bookType: "single" });
    await writeDraft(FLOW, s.payload);
    await writeDraftMedia(FLOW, s.media);
    expect(await store.get(`${FLOW}:media`)).toBeDefined();

    const { setPlanIntent } = await import("@/lib/order/planIntent");
    const { default: Route } = await import("@/app/begin/personalized-book/form/PersonalizedBookFormRoute");
    setPlanIntent("multi"); // a DIFFERENT book type than the draft
    render(
      <LanguageProvider>
        <Route />
      </LanguageProvider>,
    );
    await u.click(await screen.findByRole("button", { name: "Yangi buyurtma boshlash" }));
    await waitFor(async () => {
      expect(await store.get(FLOW)).toBeUndefined();
      expect(await store.get(`${FLOW}:media`)).toBeUndefined();
    });
    // and a fresh form opened
    expect(await screen.findByRole("heading", { name: /Assalomu alaykum/ })).toBeInTheDocument();
  });
});
