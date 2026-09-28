import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { memoryStorage, readDraft, setDraftStorage } from "@/lib/order/formDraft";
import PersonalizedBookOrderForm, { emptyForm, type FormData } from "../PersonalizedBookOrderForm";
import { STEPS } from "../orderFormData";
import { restoreOrderDraft, toPersisted, type OrderDraft } from "../orderDraft";

function seededData(): FormData {
  const f = emptyForm("UZ");
  return {
    ...f,
    orderer: { ...f.orderer, honorific: "mr", name: "Sherzod" },
    children: [{ id: "c1", name: "Nodira", age: 7, phase02Done: true, phase03Done: true }],
    personalMessage: "Seni yaxshi ko‘ramiz",
  };
}

function restored(extra: Partial<OrderDraft>) {
  const stored: OrderDraft = {
    bookType: "single",
    data: toPersisted(seededData()),
    phase: "steps",
    stepIndex: 0,
    marketTouched: false,
    phase01Seeded: true,
    ...extra,
  };
  return restoreOrderDraft(JSON.parse(JSON.stringify(stored)), emptyForm(), STEPS.length)!;
}

beforeEach(() => setDraftStorage(memoryStorage()));
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
    const personal = STEPS[0]!;
    expect(screen.getByRole("heading", { name: personal.titleUz })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Seni yaxshi ko‘ramiz")).toBeInTheDocument();
  });

  it("keeps saving after a restore (debounced), with consent never stored", async () => {
    vi.useFakeTimers();
    mount(restored({ phase: "steps", stepIndex: 0 }));
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    vi.useRealTimers();
    await vi.waitFor(async () => {
      const d = await readDraft<OrderDraft>("personalized-book");
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
    expect(await readDraft("personalized-book")).toBeUndefined();
  });
});
