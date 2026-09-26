import { describe, it, expect, vi, beforeEach } from "vitest";
import { useEffect } from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }), usePathname: () => "/" }));

import PersonalizedBookEntry from "../PersonalizedBookEntry";
import PersonalizedBookPlans from "../PersonalizedBookPlans";
import { LanguageProvider, useLanguage } from "@/lib/i18n/LanguageContext";
import { ENTRY_COPY, PLAN_COPY } from "@/lib/order/entry-copy";
import { ENTRY_PATH, FORM_PATH, PAY_PATH, PRICE_PATH } from "@/lib/order/paths";
import { clearPlanIntent, peekPlanIntent, setPlanIntent } from "@/lib/order/planIntent";
import { MARKET_PRICING, formatMoney } from "../orderFormData";
import { setMarketPreference } from "@/lib/order/market";

const c = ENTRY_COPY.uz;
const pc = PLAN_COPY.uz;

beforeEach(() => {
  push.mockReset();
  clearPlanIntent();
  localStorage.clear();
  localStorage.setItem("talimoon-language", "UZ");
  setMarketPreference("UZ");
});

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

function mountEntry() {
  return render(
    <LanguageProvider>
      <PersonalizedBookEntry />
    </LanguageProvider>,
  );
}
function mountPlans() {
  return render(
    <LanguageProvider>
      <PersonalizedBookPlans />
    </LanguageProvider>,
  );
}

const newCard = () => screen.getByRole("link", { name: new RegExp(c.newTitle) });
const existingCard = () => screen.getByRole("link", { name: new RegExp(c.existingTitle) });
const planCard = (name: RegExp) => screen.getByRole("link", { name });

describe("intent screen (/begin/personalized-book)", () => {
  it("frames the choice inside the Personalized Books journey", () => {
    mountEntry();
    const h1 = screen.getByRole("heading", { level: 1, name: c.heading });
    expect(screen.getByText(c.eyebrow)).toBeInTheDocument();
    expect(h1.compareDocumentPosition(newCard()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("offers exactly the two intents with the approved copy", () => {
    const { container } = mountEntry();
    expect(container.querySelectorAll("[data-intent]")).toHaveLength(2);
    expect(newCard()).toHaveTextContent("Yangi buyurtma");
    expect(newCard()).toHaveTextContent("Farzandingiz uchun yangi shaxsiylashtirilgan kitob buyurtmasini boshlang.");
    expect(existingCard()).toHaveTextContent("Mavjud buyurtma uchun to‘lov");
    expect(existingCard()).toHaveTextContent("Formani qayta to‘ldirish shart emas");
  });

  it("'Yangi buyurtma' navigates to the dedicated pricing page", () => {
    mountEntry();
    expect(PRICE_PATH).toBe("/begin/personalized-book/price");
    expect(newCard()).toHaveAttribute("href", PRICE_PATH);
    expect(newCard()).not.toHaveAttribute("aria-expanded");
  });

  it("pricing never expands inline on the intent screen", () => {
    mountEntry();
    fireEvent.click(newCard());
    expect(screen.queryByText(pc.heading)).toBeNull();
    expect(screen.queryByText(/499 000/)).toBeNull();
    expect(screen.queryByText(/699 000/)).toBeNull();
    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(read("components/begin/PersonalizedBookEntry.tsx")).not.toMatch(/MARKET_PRICING|useState/);
  });

  it("'Mavjud buyurtma uchun to‘lov' goes straight to /pay, never the form", () => {
    mountEntry();
    expect(existingCard()).toHaveAttribute("href", PAY_PATH);
    expect(PAY_PATH).toBe("/pay");
    fireEvent.click(existingCard());
    expect(push).not.toHaveBeenCalled();
    expect(peekPlanIntent()).toBeUndefined();
  });

  it("stacks on mobile and pairs on ≥ sm", () => {
    const { container } = mountEntry();
    const grid = container.querySelector('[data-intent="new"]')!.parentElement!;
    expect(grid.className).toMatch(/\bgrid\b/);
    expect(grid.className).toMatch(/sm:grid-cols-2/);
    expect(grid.className).not.toMatch(/(^|\s)grid-cols-2/);
  });

  it.each([
    ["EN", "en"],
    ["RU", "ru"],
  ] as const)("%s copy renders", (lang, key) => {
    function SetLang() {
      const { setLanguage } = useLanguage();
      // module-level language state: restore UZ on unmount so later tests stay UZ
      useEffect(() => {
        setLanguage(lang);
        return () => setLanguage("UZ");
      }, [setLanguage]);
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
    expect(screen.getByRole("link", { name: new RegExp(ENTRY_COPY[key].newTitle) })).toHaveAttribute("href", PRICE_PATH);
  });
});

describe("pricing page (/begin/personalized-book/price)", () => {
  it("shows the approved header", () => {
    mountPlans();
    expect(screen.getByText("Buyurtmani boshlash")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Kitob turini tanlang" })).toBeInTheDocument();
    expect(screen.getByText("Farzandlaringiz soniga mos variantni tanlang.")).toBeInTheDocument();
  });

  it("shows exactly two options, each a complete premium card", () => {
    const { container } = mountPlans();
    const cards = container.querySelectorAll("[data-plan]");
    expect(cards).toHaveLength(2);
    cards.forEach((card) => {
      expect(card).toHaveTextContent("Shaxsiylashtirilgan kitob");
      expect(card).toHaveTextContent("Shuni tanlash");
      expect(card.querySelector("svg")).not.toBeNull(); // visual marker
      expect(card.getAttribute("role")).toBeNull(); // not a radio form
    });
    expect(planCard(/1 farzand uchun/)).toHaveTextContent("499 000 so‘m");
    expect(planCard(/1 farzand uchun/)).toHaveTextContent(pc.singleBody);
    expect(planCard(/Bir nechta farzand uchun/)).toHaveTextContent("699 000 so‘m");
    expect(planCard(/Bir nechta farzand uchun/)).toHaveTextContent(pc.multiBody);
  });

  it("prices come from MARKET_PRICING (no hardcoded values)", () => {
    mountPlans();
    const num = (n: number) => n.toLocaleString("en-US").replace(/,/g, " ");
    expect(planCard(/1 farzand uchun/)).toHaveTextContent(num(MARKET_PRICING.UZ.single));
    expect(planCard(/Bir nechta farzand uchun/)).toHaveTextContent(num(MARKET_PRICING.UZ.multi));
    fireEvent.click(screen.getByRole("radio", { name: pc.marketIntl }));
    expect(planCard(/1 farzand uchun/)).toHaveTextContent(formatMoney(MARKET_PRICING.INTERNATIONAL.single, "USD"));
    expect(planCard(/Bir nechta farzand uchun/)).toHaveTextContent(formatMoney(MARKET_PRICING.INTERNATIONAL.multi, "USD"));
  });

  it.each([
    ["single", /1 farzand uchun/],
    ["multi", /Bir nechta farzand uchun/],
  ] as const)("%s → continues to the existing form with the book type handed over", (plan, name) => {
    mountPlans();
    const card = planCard(name);
    expect(card).toHaveAttribute("href", FORM_PATH);
    expect(card).toHaveAttribute("data-chosen", "false");
    fireEvent.click(card);
    expect(card).toHaveAttribute("data-chosen", "true"); // selected state
    expect(peekPlanIntent()).toBe(plan);
    expect(card.getAttribute("href")).not.toContain("?");
    expect(JSON.stringify({ ...localStorage })).not.toMatch(/single|multi/);
  });

  it("keyboard: Tab reaches both cards; Enter chooses", async () => {
    const user = userEvent.setup();
    mountPlans();
    const single = planCard(/1 farzand uchun/);
    const multi = planCard(/Bir nechta farzand uchun/);
    single.focus();
    await user.tab();
    expect(multi).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(peekPlanIntent()).toBe("multi");
  });

  it("offers a way back to the intent screen", () => {
    mountPlans();
    expect(screen.getByRole("link", { name: pc.back })).toHaveAttribute("href", ENTRY_PATH);
  });

  it("stacks full-width on mobile, side by side on desktop, large touch targets", () => {
    const { container } = mountPlans();
    const list = container.querySelector("[data-plan]")!.closest("ul")!;
    expect(list.className).toMatch(/\bgrid\b/);
    expect(list.className).toMatch(/md:grid-cols-2/);
    expect(list.className).not.toMatch(/(^|\s)grid-cols-2/);
    container.querySelectorAll("[data-plan]").forEach((card) => {
      expect(card.className).toMatch(/\bw-full\b/);
      expect(within(card as HTMLElement).getByText(pc.choose).className).toMatch(/\bh-12\b/);
    });
  });

  it.each([
    ["EN", "en"],
    ["RU", "ru"],
  ] as const)("%s copy renders", (lang, key) => {
    function SetLang() {
      const { setLanguage } = useLanguage();
      // module-level language state: restore UZ on unmount so later tests stay UZ
      useEffect(() => {
        setLanguage(lang);
        return () => setLanguage("UZ");
      }, [setLanguage]);
      return null;
    }
    render(
      <LanguageProvider>
        <SetLang />
        <PersonalizedBookPlans />
      </LanguageProvider>,
    );
    expect(screen.getByRole("heading", { level: 1, name: PLAN_COPY[key].heading })).toBeInTheDocument();
    expect(screen.getAllByText(PLAN_COPY[key].choose)).toHaveLength(2);
  });
});

describe("routing", () => {
  it("/begin → Personalized Books goes to the intent screen", () => {
    expect(read("components/begin/ProductSelect.tsx")).toMatch(/router\.push\("\/begin\/personalized-book"\)/);
    expect(read("app/begin/page.tsx")).not.toMatch(/OrderPaths/);
  });

  it("each step is its own page", () => {
    expect(read("app/begin/personalized-book/page.tsx")).toMatch(/<PersonalizedBookEntry \/>/);
    expect(read("app/begin/personalized-book/page.tsx")).not.toMatch(/redirect\(/);
    const price = read("app/begin/personalized-book/price/page.tsx");
    expect(price).toMatch(/<PersonalizedBookPlans \/>/);
    expect(price).not.toMatch(/PersonalizedBookEntry/);
  });

  it("the form's back step returns to the pricing page", () => {
    expect(read("app/begin/personalized-book/form/PersonalizedBookFormRoute.tsx")).toMatch(
      /router\.push\("\/begin\/personalized-book\/price"\)/,
    );
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
