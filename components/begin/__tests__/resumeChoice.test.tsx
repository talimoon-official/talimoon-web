import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => nav,
  usePathname: () => "/begin/personalized-book",
}));

import { useEffect } from "react";
import { LanguageProvider, useLanguage } from "@/lib/i18n/LanguageContext";
import {
  DRAFT_SCHEMA_VERSION,
  MAX_AGE_MS,
  MEDIA_MAX_AGE_MS,
  memoryStorage,
  setDraftStorage,
  writeDraft,
  writeDraftMedia,
  type DraftStorage,
} from "@/lib/order/formDraft";
import { ENTRY_PATH, FORM_PATH, PRICE_PATH, RESUME_PATH } from "@/lib/order/paths";
import { clearOpenedFromMenu, markOpenedFromMenu } from "@/lib/order/menuReturn";
import { clearPlanIntent, setPlanIntent } from "@/lib/order/planIntent";
import PersonalizedBookEntry from "../PersonalizedBookEntry";
import ResumeChoice, { RESUME_COPY } from "../ResumeChoice";
import { REUPLOAD_COPY } from "../MediaReuploadNotice";
import ResumeChoiceRoute from "@/app/begin/personalized-book/resume/ResumeChoiceRoute";
import FormRoute from "@/app/begin/personalized-book/form/PersonalizedBookFormRoute";
import { emptyForm, type FormData } from "../PersonalizedBookOrderForm";
import { STEPS } from "../orderFormData";
import {
  createDraftSaver,
  hasResumableOrderDraft,
  loadOrderDraft,
  splitMedia,
  toPersisted,
  type OrderDraft,
} from "../orderDraft";
import { resolveDraftLoad } from "../draftLoad";

const FLOW = "personalized-book";
const MEDIA = `${FLOW}:media`;
const c = RESUME_COPY.uz;
const photo = (n: string) => new File(["x"], n, { type: "image/jpeg" });
const PHOTOS_STEP = STEPS.findIndex((s) => s.id === "photos");

function draftData(): FormData {
  const f = emptyForm("UZ");
  return {
    ...f,
    orderer: { ...f.orderer, honorific: "mr", name: "Sherzod", phone: "+998901234567" },
    children: [
      {
        id: "c1",
        name: "Nodira",
        age: 7,
        phase02Done: true,
        phase03Done: true,
        photos: [photo("a"), photo("b"), photo("c")],
        noInterestDetails: true,
        noFavoriteActivity: true,
        emotionalBridge: { noSituation: true, sensitivities: "Ehtiyot bo‘ling", done: true },
      },
    ],
    personalMessage: "Seni yaxshi ko‘ramiz",
    // never-persisted fields, set as if the customer had ticked / signed
    consentAuthority: true,
    consentPrivacy: true,
    consentTerms: true,
    consentDrawnSignature: "data:image/png;base64,SIGNATURE",
  };
}

function draftParts(extra: Partial<OrderDraft> = {}) {
  const { text, media, manifest } = splitMedia(toPersisted(draftData()));
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

async function saveDraft(extra: Partial<OrderDraft> = {}) {
  const p = draftParts(extra);
  await writeDraft(FLOW, p.payload);
  await writeDraftMedia(FLOW, p.media);
}

/** Stores records as if last edited `ageMs` ago. */
async function saveAgedDraft(ageMs: number, extra: Partial<OrderDraft> = {}) {
  const p = draftParts(extra);
  const savedAt = Date.now() - ageMs;
  await store.put(FLOW, { v: DRAFT_SCHEMA_VERSION, flow: FLOW, savedAt, payload: p.payload });
  await store.put(MEDIA, { v: DRAFT_SCHEMA_VERSION, flow: FLOW, savedAt, payload: p.media });
}

function SetLanguage({ to }: { to: "UZ" | "RU" | "EN" }) {
  const { setLanguage } = useLanguage();
  useEffect(() => setLanguage(to), [setLanguage, to]);
  return null;
}

const wrap = (ui: React.ReactNode) => render(<LanguageProvider>{ui}</LanguageProvider>);
const newOrderCard = () => screen.getByRole("link", { name: /Yangi buyurtma/ });

let store: DraftStorage;
const fetchSpy = vi.fn();
beforeEach(() => {
  store = memoryStorage();
  setDraftStorage(store);
  nav.push.mockReset();
  nav.replace.mockReset();
  nav.back.mockReset();
  clearPlanIntent();
  clearOpenedFromMenu();
  localStorage.clear();
  localStorage.setItem("talimoon-language", "UZ");
  fetchSpy.mockReset();
  vi.stubGlobal("fetch", fetchSpy);
});
afterEach(() => {
  setDraftStorage(null);
  vi.unstubAllGlobals();
});

describe("A · no draft", () => {
  it("'Yangi buyurtma' goes straight on to a fresh order (pricing)", async () => {
    const u = userEvent.setup();
    wrap(<PersonalizedBookEntry />);
    await u.click(newOrderCard());
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith(PRICE_PATH));
    expect(nav.push).not.toHaveBeenCalledWith(RESUME_PATH);
  });

  it("the resume screen, reached without a draft, forwards to pricing (no empty choice)", async () => {
    wrap(<ResumeChoiceRoute />);
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith(PRICE_PATH));
    expect(screen.queryByRole("heading", { name: c.title })).toBeNull();
  });
});

describe("B · valid unfinished draft", () => {
  it("'Yangi buyurtma' opens the resume choice, not the form", async () => {
    const u = userEvent.setup();
    await saveDraft();
    wrap(<PersonalizedBookEntry />);
    await u.click(newOrderCard());
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith(RESUME_PATH));
    expect(nav.push).not.toHaveBeenCalledWith(PRICE_PATH);
  });

  it("the resume screen shows the two choices with their helpers", async () => {
    await saveDraft();
    wrap(<ResumeChoiceRoute />);
    expect(await screen.findByRole("heading", { name: c.title })).toBeInTheDocument();
    expect(screen.getByText(c.body)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: new RegExp(c.continueCta) })).toHaveAccessibleDescription(c.continueHelper);
    expect(screen.getByRole("button", { name: new RegExp(c.startNewCta) })).toHaveAccessibleDescription(c.startNewHelper);
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("a plan chosen straight into the form (same type) still asks first", async () => {
    await saveDraft();
    setPlanIntent("single");
    wrap(<FormRoute />);
    expect(await screen.findByRole("heading", { name: c.title })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: STEPS[0]!.titleUz })).toBeNull();
  });
});

describe("C · Davom ettirish", () => {
  it("goes to the form by REPLACE, draft untouched, nothing sent", async () => {
    const u = userEvent.setup();
    await saveDraft({ stepIndex: PHOTOS_STEP });
    wrap(<ResumeChoiceRoute />);
    await u.click(await screen.findByRole("button", { name: new RegExp(c.continueCta) }));
    expect(nav.replace).toHaveBeenCalledWith(FORM_PATH);
    expect(nav.push).not.toHaveBeenCalled();
    expect(await store.get(FLOW)).toBeDefined();
    expect(await store.get(MEDIA)).toBeDefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("the form then reopens on the exact saved step with answers, photos and cards", async () => {
    await saveDraft({ stepIndex: PHOTOS_STEP });
    wrap(<FormRoute />); // no plan intent = the Continue path
    expect(await screen.findByRole("heading", { name: STEPS[PHOTOS_STEP]!.titleUz })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: c.title })).toBeNull();
    expect(document.querySelector("[data-media-reupload]")).toBeNull(); // photos came back
  });

  it("restores a per-child sub-screen and every answer, optional cards included", async () => {
    await saveDraft({ phase: "world", pos: { idx: 0, screen: "dream" } });
    const r = resolveDraftLoad(await loadOrderDraft(), undefined).restored!;
    expect(r.phase).toBe("world");
    expect(r.pos).toEqual({ idx: 0, screen: "dream" });
    const child = r.data.children[0]!;
    expect(child.noInterestDetails).toBe(true);
    expect(child.noFavoriteActivity).toBe(true);
    expect(child.emotionalBridge).toMatchObject({ noSituation: true, sensitivities: "Ehtiyot bo‘ling", done: true });
    expect(child.phase02Done && child.phase03Done).toBe(true);
    expect(child.photos).toHaveLength(3);
    expect(r.data.personalMessage).toBe("Seni yaxshi ko‘ramiz");
  });

  it("from the form route's own choice: continue reopens the saved step", async () => {
    const u = userEvent.setup();
    await saveDraft({ stepIndex: PHOTOS_STEP });
    setPlanIntent("multi");
    wrap(<FormRoute />);
    await u.click(await screen.findByRole("button", { name: new RegExp(c.continueCta) }));
    expect(await screen.findByRole("heading", { name: STEPS[PHOTOS_STEP]!.titleUz })).toBeInTheDocument();
  });
});

describe("D · Yangi buyurtma boshlash", () => {
  it("asks once; 'Orqaga' keeps the draft; confirming deletes ONLY the local draft", async () => {
    const u = userEvent.setup();
    await saveDraft();
    wrap(<ResumeChoiceRoute />);
    await u.click(await screen.findByRole("button", { name: new RegExp(c.startNewCta) }));
    // one tap only opens the confirmation
    expect(screen.getByRole("heading", { name: c.confirmTitle })).toBeInTheDocument();
    expect(screen.getByText(c.confirmBody)).toBeInTheDocument();
    expect(await store.get(FLOW)).toBeDefined();

    // cancel → back to the choice, nothing deleted
    await u.click(document.querySelector<HTMLButtonElement>('[data-resume-action="cancel-new"]')!);
    expect(screen.getByRole("heading", { name: c.title })).toBeInTheDocument();
    expect(await store.get(FLOW)).toBeDefined();
    expect(await store.get(MEDIA)).toBeDefined();

    // confirm → both records gone, normal first step (pricing)
    await u.click(screen.getByRole("button", { name: new RegExp(c.startNewCta) }));
    await u.click(screen.getByRole("button", { name: c.confirmYes }));
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith(PRICE_PATH));
    expect(await store.get(FLOW)).toBeUndefined();
    expect(await store.get(MEDIA)).toBeUndefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("in the form route: confirm → fresh form on its first screen", async () => {
    const u = userEvent.setup();
    await saveDraft({ stepIndex: PHOTOS_STEP });
    setPlanIntent("single");
    wrap(<FormRoute />);
    await u.click(await screen.findByRole("button", { name: new RegExp(c.startNewCta) }));
    await u.click(screen.getByRole("button", { name: c.confirmYes }));
    expect(await screen.findByRole("heading", { name: /Assalomu alaykum/ })).toBeInTheDocument();
    expect(await store.get(FLOW)).toBeUndefined();
    expect(await store.get(MEDIA)).toBeUndefined();
  });

  it("the destructive choice is never the visually dominant one", () => {
    wrap(<ResumeChoice onContinue={() => {}} onStartNew={() => {}} onBack={() => {}} />);
    const cont = screen.getByRole("button", { name: new RegExp(c.continueCta) });
    const fresh = screen.getByRole("button", { name: new RegExp(c.startNewCta) });
    expect(cont.compareDocumentPosition(fresh) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(cont.className).toMatch(/gold-mid/);
    expect(fresh.className).not.toMatch(/gold/);
  });

  it("a double tap on Continue fires once", async () => {
    const u = userEvent.setup();
    const onContinue = vi.fn();
    wrap(<ResumeChoice onContinue={onContinue} onStartNew={() => {}} onBack={() => {}} />);
    const cont = screen.getByRole("button", { name: new RegExp(c.continueCta) });
    await u.dblClick(cont);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});

describe("E · finalized order", () => {
  it("seal() after finalize removes the draft; the next 'Yangi buyurtma' starts fresh", async () => {
    const u = userEvent.setup();
    await saveDraft();
    expect(await hasResumableOrderDraft()).toBe(true);
    await createDraftSaver().seal();
    expect(await hasResumableOrderDraft()).toBe(false);
    wrap(<PersonalizedBookEntry />);
    await u.click(newOrderCard());
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith(PRICE_PATH));
  });
});

describe("F · expired answers (> 7 days)", () => {
  it("are discarded: no prompt, records deleted, fresh start", async () => {
    await saveAgedDraft(MAX_AGE_MS + 60_000);
    expect(await hasResumableOrderDraft()).toBe(false);
    expect(await store.get(FLOW)).toBeUndefined();
    expect(await store.get(MEDIA)).toBeUndefined();
    wrap(<ResumeChoiceRoute />);
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith(PRICE_PATH));
  });

  it("a corrupt / foreign record is never offered and is deleted", async () => {
    await store.put(FLOW, { v: DRAFT_SCHEMA_VERSION, flow: FLOW, savedAt: Date.now(), payload: { junk: true } });
    expect(await hasResumableOrderDraft()).toBe(false);
    expect(await store.get(FLOW)).toBeUndefined();
    await store.put(FLOW, { v: DRAFT_SCHEMA_VERSION - 1, flow: FLOW, savedAt: Date.now(), payload: draftParts().payload });
    expect(await hasResumableOrderDraft()).toBe(false);
  });
});

describe("G · expired media (> 48 hours, answers still valid)", () => {
  it("still offers to continue; Continue restores the step and asks only for the files", async () => {
    await saveAgedDraft(MEDIA_MAX_AGE_MS + 60_000, { stepIndex: PHOTOS_STEP });
    expect(await hasResumableOrderDraft()).toBe(true);
    wrap(<FormRoute />);
    expect(await screen.findByRole("heading", { name: STEPS[PHOTOS_STEP]!.titleUz })).toBeInTheDocument();
    const banner = document.querySelector('[data-media-reupload="banner"]')!;
    expect(banner.textContent).toContain(REUPLOAD_COPY.uz.title);
    expect(REUPLOAD_COPY.uz.title).toBe("Javoblaringiz saqlangan. Faqat ayrim fayllarni qayta yuklash kerak.");
    expect(banner.textContent).toMatch(/Nodira suratlari \(3 ta\)/);
    expect(await store.get(MEDIA)).toBeUndefined();
  });
});

describe("H · Back / refresh", () => {
  it("Back steps back to the menu when the menu opened this screen", async () => {
    const u = userEvent.setup();
    await saveDraft();
    markOpenedFromMenu();
    wrap(<ResumeChoiceRoute />);
    await u.click(await screen.findByRole("button", { name: c.back }));
    expect(nav.back).toHaveBeenCalledTimes(1);
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("after a reload / direct landing, Back REPLACES to the menu", async () => {
    const u = userEvent.setup();
    await saveDraft();
    wrap(<ResumeChoiceRoute />);
    await u.click(await screen.findByRole("button", { name: c.back }));
    expect(nav.replace).toHaveBeenCalledWith(ENTRY_PATH);
    expect(nav.back).not.toHaveBeenCalled();
  });

  it("a refresh keeps the choice while the draft exists; the confirmation never auto-deletes", async () => {
    const u = userEvent.setup();
    await saveDraft();
    const first = wrap(<ResumeChoiceRoute />);
    await u.click(await screen.findByRole("button", { name: new RegExp(c.startNewCta) }));
    first.unmount(); // reload mid-confirmation
    wrap(<ResumeChoiceRoute />);
    expect(await screen.findByRole("heading", { name: c.title })).toBeInTheDocument();
    expect(await store.get(FLOW)).toBeDefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("I · privacy / security", () => {
  it("the choice shows nothing personal", async () => {
    await saveDraft();
    const { container } = wrap(<ResumeChoiceRoute />);
    await screen.findByRole("heading", { name: c.title });
    const text = container.textContent ?? "";
    for (const secret of ["Nodira", "Sherzod", "+998", "Seni yaxshi", "Ehtiyot"]) expect(text).not.toContain(secret);
    expect(container.querySelector("img")).toBeNull();
  });

  it("consent ticks and the signature are never stored nor restored", async () => {
    await saveDraft();
    const raw = JSON.stringify((await store.get(FLOW)) as object);
    expect(raw).not.toMatch(/consent|SIGNATURE|paymentCode|token/i);
    const r = resolveDraftLoad(await loadOrderDraft(), undefined).restored!;
    expect(r.data.consentAuthority || r.data.consentPrivacy || r.data.consentTerms).toBe(false);
    expect(r.data.consentDrawnSignature).toBe("");
  });
});

describe("J · copy", () => {
  it("UZ matches the approved wording", () => {
    expect(c).toMatchObject({
      title: "Oldingi buyurtmani davom ettirasizmi?",
      body: "Sizda tugallanmagan buyurtma bor.",
      continueCta: "Davom ettirish",
      continueHelper: "Avval to‘xtagan joyingizdan davom etasiz.",
      startNewCta: "Yangi buyurtma boshlash",
      startNewHelper: "Oldingi ma’lumotlar o‘chiriladi va forma boshidan boshlanadi.",
      confirmTitle: "Yangi buyurtma boshlaysizmi?",
      confirmBody: "Oldingi tugallanmagan ma’lumotlaringiz o‘chiriladi.",
      confirmYes: "Ha, yangi boshlayman",
      confirmNo: "Orqaga",
    });
  });

  it("RU and EN have every string, non-empty and translated", () => {
    const keys = Object.keys(RESUME_COPY.uz) as (keyof typeof c)[];
    for (const loc of ["en", "ru"] as const) {
      for (const k of keys) {
        expect(RESUME_COPY[loc][k].trim()).not.toBe("");
        expect(RESUME_COPY[loc][k]).not.toBe(RESUME_COPY.uz[k]);
      }
    }
    expect(REUPLOAD_COPY.en.title).toMatch(/answers are saved/i);
    expect(REUPLOAD_COPY.ru.title).toMatch(/ответы сохранены/i);
  });

  it("renders in RU and EN with the site language", async () => {
    await saveDraft();
    for (const [lang, loc] of [["RU", "ru"], ["EN", "en"]] as const) {
      const view = wrap(
        <>
          <SetLanguage to={lang} />
          <ResumeChoiceRoute />
        </>,
      );
      expect(await screen.findByRole("heading", { name: RESUME_COPY[loc].title })).toBeInTheDocument();
      view.unmount();
    }
    wrap(<SetLanguage to="UZ" />).unmount();
  });
});
