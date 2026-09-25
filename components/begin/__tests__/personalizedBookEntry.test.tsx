import { describe, it, expect, vi, beforeEach } from "vitest";
import { useEffect } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }), usePathname: () => "/" }));

import PersonalizedBookEntry, { FORM_PATH, PAY_PATH } from "../PersonalizedBookEntry";
import { LanguageProvider, useLanguage } from "@/lib/i18n/LanguageContext";
import { ENTRY_COPY } from "@/lib/order/entry-copy";
import { clearPlanIntent, peekPlanIntent, setPlanIntent } from "@/lib/order/planIntent";
import { MARKET_PRICING, formatMoney } from "../orderFormData";
import { setMarketPreference } from "@/lib/order/market";

const c = ENTRY_COPY.uz;

beforeEach(() => {
  push.mockReset();
  clearPlanIntent();
  localStorage.clear();
  localStorage.setItem("talimoon-language", "UZ");
  setMarketPreference("UZ");
});

function mount() {
  return render(
    <LanguageProvider>
      <PersonalizedBookEntry />
    </LanguageProvider>,
  );
}

const newCard = () => screen.getByRole("button", { name: new RegExp(c.newTitle) });
const existingCard = () => screen.getByRole("link", { name: new RegExp(c.existingTitle) });

describe("Personalized Books order entry — intent", () => {
  it("frames the choice inside the Personalized Books journey", () => {
    mount();
    const h1 = screen.getByRole("heading", { level: 1, name: c.heading });
    expect(h1).toBeInTheDocument();
    expect(screen.getByText(c.eyebrow)).toBeInTheDocument();
    // context comes BEFORE the intent cards in the document
    expect(h1.compareDocumentPosition(newCard()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("offers the two intents with the approved copy", () => {
    mount();
    expect(newCard()).toHaveTextContent("Yangi buyurtma");
    expect(newCard()).toHaveTextContent("Farzandingiz uchun yangi shaxsiylashtirilgan kitob buyurtmasini boshlang.");
    expect(newCard()).toHaveTextContent("Yangi buyurtma berish");
    expect(existingCard()).toHaveTextContent("Mavjud buyurtma uchun to‘lov");
    expect(existingCard()).toHaveTextContent(
      "Avval formani yuborgan bo‘lsangiz, to‘lov kodini kiriting va saqlangan buyurtmangiz uchun to‘lovni davom ettiring.",
    );
    expect(existingCard()).toHaveTextContent("To‘lovga o‘tish");
    expect(existingCard()).toHaveTextContent("Formani qayta to‘ldirish shart emas");
  });

  it("the existing-order path goes straight to /pay and never to the form", () => {
    mount();
    expect(existingCard()).toHaveAttribute("href", PAY_PATH);
    expect(existingCard().getAttribute("href")).not.toMatch(/form/);
    fireEvent.click(existingCard());
    expect(push).not.toHaveBeenCalledWith(FORM_PATH);
    expect(peekPlanIntent()).toBeUndefined();
  });

  it("book choice is hidden until 'Yangi buyurtma' is chosen, then revealed", () => {
    mount();
    expect(newCard()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("radiogroup", { name: c.planHeading })).toBeNull();
    fireEvent.click(newCard());
    expect(newCard()).toHaveAttribute("aria-expanded", "true");
    const group = screen.getByRole("radiogroup", { name: c.planHeading });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /1 farzand uchun/ })).toHaveTextContent(
      formatMoney(MARKET_PRICING.UZ.single, "UZS"),
    );
    expect(screen.getByRole("radio", { name: /Bir nechta farzand uchun/ })).toHaveTextContent(
      formatMoney(MARKET_PRICING.UZ.multi, "UZS"),
    );
  });
});

describe("Personalized Books order entry — book choice → form", () => {
  it("nothing starts before a book is chosen", () => {
    mount();
    fireEvent.click(newCard());
    fireEvent.click(screen.getByRole("button", { name: c.start }));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(c.startHint);
  });

  it.each([
    ["single", /1 farzand uchun/],
    ["multi", /Bir nechta farzand uchun/],
  ] as const)("%s → the existing form, with the book type handed over in memory", (plan, name) => {
    mount();
    fireEvent.click(newCard());
    const card = screen.getByRole("radio", { name });
    fireEvent.click(card);
    expect(card).toHaveAttribute("aria-checked", "true");
    expect(card).toHaveTextContent(c.chosen);
    fireEvent.click(screen.getByRole("button", { name: c.start }));
    expect(push).toHaveBeenCalledWith(FORM_PATH);
    expect(peekPlanIntent()).toBe(plan);
    // no URL parameter, nothing persisted
    expect(push.mock.calls[0]![0]).not.toContain("?");
    expect(JSON.stringify({ ...localStorage })).not.toMatch(/single|multi/);
  });

  it("prices follow the market selector (the one pricing source)", () => {
    mount();
    fireEvent.click(newCard());
    fireEvent.click(screen.getByRole("radio", { name: c.marketIntl }));
    expect(screen.getByRole("radio", { name: /1 farzand uchun/ })).toHaveTextContent(
      formatMoney(MARKET_PRICING.INTERNATIONAL.single, "USD"),
    );
    expect(screen.getByRole("radio", { name: /Bir nechta farzand uchun/ })).toHaveTextContent(
      formatMoney(MARKET_PRICING.INTERNATIONAL.multi, "USD"),
    );
  });
});

describe("Personalized Books order entry — keyboard", () => {
  it("Tab reaches both intents; Enter reveals; arrows move the selection; Enter starts", async () => {
    const user = userEvent.setup();
    mount();
    await user.tab();
    expect(newCard()).toHaveFocus();
    await user.tab();
    expect(existingCard()).toHaveFocus();
    await user.tab({ shift: true });
    await user.keyboard("{Enter}");
    expect(newCard()).toHaveAttribute("aria-expanded", "true");

    const single = screen.getByRole("radio", { name: /1 farzand uchun/ });
    const multi = screen.getByRole("radio", { name: /Bir nechta farzand uchun/ });
    // roving tabindex: one plan is the tab stop
    expect(single).toHaveAttribute("tabindex", "0");
    expect(multi).toHaveAttribute("tabindex", "-1");
    single.focus();
    await user.keyboard("{ArrowRight}");
    expect(multi).toHaveAttribute("aria-checked", "true");
    expect(multi).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(single).toHaveAttribute("aria-checked", "true");

    screen.getByRole("button", { name: c.start }).focus();
    await user.keyboard("{Enter}");
    expect(push).toHaveBeenCalledWith(FORM_PATH);
    expect(peekPlanIntent()).toBe("single");
  });
});

describe("Personalized Books order entry — structure & locales", () => {
  it("stacks on mobile and pairs on ≥ sm (grid classes), with 44px+ touch targets", () => {
    const { container } = mount();
    const intents = container.querySelector('[data-intent="new"]')!.parentElement!;
    expect(intents.className).toMatch(/\bgrid\b/);
    expect(intents.className).toMatch(/sm:grid-cols-2/);
    expect(intents.className).not.toMatch(/(^|\s)grid-cols-2/); // single column by default
    fireEvent.click(newCard());
    const planCta = container.querySelector('[data-plan="single"] span.h-11');
    expect(planCta).not.toBeNull();
  });

  it.each([
    ["EN", "en"],
    ["RU", "ru"],
  ] as const)("%s copy renders", (lang, key) => {
    function SetLang() {
      const { setLanguage } = useLanguage();
      useEffect(() => setLanguage(lang), [setLanguage]);
      return null;
    }
    render(
      <LanguageProvider>
        <SetLang />
        <PersonalizedBookEntry />
      </LanguageProvider>,
    );
    expect(screen.getByRole("heading", { level: 1, name: ENTRY_COPY[key].heading })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(ENTRY_COPY[key].existingTitle) })).toHaveAttribute("href", PAY_PATH);
  });
});

describe("placement", () => {
  it("/begin no longer renders a standalone order block above the product worlds", () => {
    const page = readFileSync(resolve(process.cwd(), "app/begin/page.tsx"), "utf8");
    expect(page).not.toMatch(/OrderPaths/);
    expect(page).toMatch(/<ProductSelect \/>/);
  });

  it("the Personalized Books step renders the entry (not the bare pricing section)", () => {
    const page = readFileSync(resolve(process.cwd(), "app/begin/personalized-book/price/page.tsx"), "utf8");
    expect(page).toMatch(/<PersonalizedBookEntry \/>/);
  });
});

describe("plan intent handoff", () => {
  it("is one-shot and expires", () => {
    setPlanIntent("multi");
    expect(peekPlanIntent()).toBe("multi");
    clearPlanIntent();
    expect(peekPlanIntent()).toBeUndefined();
    vi.useFakeTimers();
    setPlanIntent("single");
    vi.advanceTimersByTime(31 * 60 * 1000);
    expect(peekPlanIntent()).toBeUndefined();
    vi.useRealTimers();
  });
});

describe("form route receives the chosen book type", () => {
  it("passes the plan intent as initialBookType, then clears it", async () => {
    vi.resetModules();
    const seen: Array<string | undefined> = [];
    vi.doMock("@/components/begin/PersonalizedBookOrderForm", () => ({
      default: (props: { initialBookType?: string }) => {
        seen.push(props.initialBookType);
        return null;
      },
    }));
    const intent = await import("@/lib/order/planIntent");
    const { default: Route } = await import("@/app/begin/personalized-book/form/PersonalizedBookFormRoute");
    intent.setPlanIntent("multi");
    render(<Route />);
    expect(seen[0]).toBe("multi");
    expect(intent.peekPlanIntent()).toBeUndefined(); // one-shot
    vi.doUnmock("@/components/begin/PersonalizedBookOrderForm");
  });
});
