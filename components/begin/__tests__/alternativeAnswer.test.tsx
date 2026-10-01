import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { memoryStorage, setDraftStorage } from "@/lib/order/formDraft";
import { AlternativeAnswer, ALT_OR_LABEL } from "../AlternativeAnswer";
import Phase02 from "../Phase02";
import Phase03 from "../Phase03";
import { emptyForm, type FormData } from "../PersonalizedBookOrderForm";
import { STEPS } from "../orderFormData";
import { restoreOrderDraft, stripMedia, toPersisted, type OrderDraft } from "../orderDraft";
import type { SubPosition } from "../flowPosition";
import type { ChildProfile } from "@/lib/order/types";
import { phase02Copy } from "@/lib/order/phase02-copy";
import { phase03Copy } from "@/lib/order/phase03-copy";
import { emotionalBridgeCopy } from "@/lib/order/emotional-bridge-copy";
import {
  childDreamsText,
  childGrowthText,
  childInterestsText,
  childStrengthsText,
  orderEmotionalText,
} from "@/lib/order/profileText";

beforeEach(() => setDraftStorage(memoryStorage()));

// ── the shared card ──────────────────────────────────────────────

describe("AlternativeAnswer — the one ready-answer card", () => {
  function One({ onChange = () => {} }: { onChange?: (v: boolean) => void }) {
    const [on, setOn] = useState(false);
    return (
      <AlternativeAnswer
        id="a1"
        selected={on}
        onChange={(v) => {
          setOn(v);
          onChange(v);
        }}
        label="Bu borada xavotirim yo‘q"
        locale="uz"
      />
    );
  }

  it("is a labelled checkbox; the whole card toggles it, with a visible selected state", async () => {
    const u = userEvent.setup();
    render(<One />);
    const box = screen.getByRole("checkbox", { name: "Bu borada xavotirim yo‘q" });
    const card = box.closest("label")!;
    expect(card.className).toContain("min-h-[60px]");
    expect(card.className).toContain("w-full");
    expect(box).not.toBeChecked();

    await u.click(card); // clicking anywhere on the card, not a tiny box
    expect(box).toBeChecked();
    expect(card.className).toContain("bg-accent-primary/[0.09]");
    expect(card.querySelector("svg")).not.toBeNull(); // the ✓ mark

    await u.click(card);
    expect(box).not.toBeChecked();
  });

  it("keyboard: Tab reaches it, Space toggles it", async () => {
    const u = userEvent.setup();
    const onChange = vi.fn();
    render(<One onChange={onChange} />);
    await u.tab();
    expect(screen.getByRole("checkbox")).toHaveFocus();
    await u.keyboard(" ");
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("shows the YOKI separator (hidden from screen readers) in every locale", () => {
    expect(ALT_OR_LABEL).toEqual({ uz: "YOKI", en: "OR", ru: "ИЛИ" });
    const { container } = render(<One />);
    const sep = screen.getByText("YOKI").parentElement!;
    expect(sep.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector("[data-alternative-answer]")).not.toBeNull();
  });
});

// ── copy: natural, short, in all three languages ─────────────────

describe("alternative-answer copy", () => {
  const locales = ["uz", "en", "ru"] as const;
  const altsFor = (l: (typeof locales)[number]) => {
    const p2 = phase02Copy(l);
    const p3 = phase03Copy(l);
    const eb = emotionalBridgeCopy(l);
    return [p2.q2NothingToAdd, p2.q3NoneAnswer, p2.q4NotYet, p3.q2ItemNone, p3.q3NoneAnswer, p3.q4ItemNone, eb.s1Alt, eb.s2Alt, eb.s3Alt, eb.s4Alt];
  };

  it.each(locales)("%s: every card label exists and is one short line", (l) => {
    for (const s of altsFor(l)) {
      expect(s.trim().length).toBeGreaterThan(0);
      expect(s.split(/\s+/).length).toBeLessThanOrEqual(6);
      expect(s).not.toMatch(/\n|\.$/);
      expect(s).not.toMatch(/skip|n\/a|o‘tkazib|пропуст/i);
    }
  });

  it("the robotic UZ labels are retired from the cards", () => {
    const uz = altsFor("uz");
    for (const old of ["Alohida cheklov yo‘q", "Alohida vaziyat yo‘q", "Aniq bir vaziyat yo‘q", "Asosiylarini esladik"]) {
      expect(uz).not.toContain(old);
    }
    expect(uz).toContain("Bu borada xavotirim yo‘q");
  });

  it("the archive wording printed into the payload is unchanged", () => {
    expect(phase02Copy("uz").q3None).toBe("Aniq bir mashg‘uloti yo‘q");
    expect(phase03Copy("uz").q3None).toBe("Alohida yaxshilashni istagan odat hozircha yo‘q");
    expect(phase02Copy("en").q3None).toBe("No single activity like that");
    expect(phase03Copy("en").q3None).toBe("Nothing I'd like to work on in particular");
  });
});

// ── Phase 02 / Phase 03 screens ─────────────────────────────────

function Kids({
  Comp,
  initial,
  resume,
  seen,
}: {
  Comp: typeof Phase02 | typeof Phase03;
  initial: ChildProfile[];
  resume: SubPosition;
  seen?: ChildProfile[][];
}) {
  const [kids, setKids] = useState(initial);
  seen?.push(kids);
  return (
    <LanguageProvider>
      <Comp
        childrenIn={kids}
        onPatchChild={(id, p) => setKids((ks) => ks.map((k) => (k.id === id ? { ...k, ...p } : k)))}
        onComplete={() => {}}
        onBack={() => {}}
        resume={resume}
      />
    </LanguageProvider>
  );
}
const last = (seen: ChildProfile[][]) => seen[seen.length - 1][0]!;
const cont = () => screen.getByRole("button", { name: /Davom etish/ });

describe("Phase 02 — the ready answers", () => {
  const base: ChildProfile = {
    id: "c1",
    name: "Nodira",
    age: 7,
    interests: [
      { id: "football", source: "preset", detail: "Darvozabon bo‘lish" },
      { id: "books", source: "preset" },
    ],
  };

  const NOTHING = "Qo‘shimcha aytadigan gapim yo‘q";
  const empty: ChildProfile = {
    ...base,
    interests: [
      { id: "football", source: "preset" },
      { id: "books", source: "preset" },
    ],
  };

  it("details: the card shows while every detail is empty, and choosing it deletes nothing", async () => {
    const u = userEvent.setup();
    const seen: ChildProfile[][] = [];
    render(<Kids Comp={Phase02} initial={[empty]} resume={{ idx: 0, screen: "deepen" }} seen={seen} />);
    expect(screen.getByText("YOKI")).toBeInTheDocument();
    const card = screen.getByRole("checkbox", { name: NOTHING });
    await u.click(card);
    expect(card).toBeChecked();
    expect(last(seen).noInterestDetails).toBe(true);
    await u.click(card);
    expect(last(seen).noInterestDetails).toBe(false);
  });

  it("details: typing into any field un-chooses and hides the card; clearing all brings it back", async () => {
    const u = userEvent.setup();
    const seen: ChildProfile[][] = [];
    render(<Kids Comp={Phase02} initial={[empty]} resume={{ idx: 0, screen: "deepen" }} seen={seen} />);
    await new Promise((r) => setTimeout(r, 80)); // let the heading focus land first
    await u.click(screen.getByRole("checkbox", { name: NOTHING }));

    const second = screen.getAllByRole("textbox")[1]!;
    await u.type(second, "Ranglar");
    expect(screen.queryByRole("checkbox", { name: NOTHING })).not.toBeInTheDocument();
    expect(screen.queryByText("YOKI")).not.toBeInTheDocument();
    expect(last(seen).noInterestDetails).toBe(false);
    expect(last(seen).interests![1]!.detail).toBe("Ranglar");

    await u.clear(second);
    const back = screen.getByRole("checkbox", { name: NOTHING });
    expect(back).not.toBeChecked();
  });

  it("details: typed text is never deleted — the card is simply not offered", async () => {
    const seen: ChildProfile[][] = [];
    render(<Kids Comp={Phase02} initial={[base]} resume={{ idx: 0, screen: "deepen" }} seen={seen} />);
    expect(screen.queryByRole("checkbox", { name: NOTHING })).not.toBeInTheDocument();
    expect(screen.getAllByRole("textbox")[0]).toHaveValue("Darvozabon bo‘lish");
    expect(last(seen).interests![0]!.detail).toBe("Darvozabon bo‘lish");
  });

  it("details: a stale/contradictory draft (flag + text) keeps the text and hides the card", () => {
    render(
      <Kids
        Comp={Phase02}
        initial={[{ ...base, noInterestDetails: true }]}
        resume={{ idx: 0, screen: "deepen" }}
      />,
    );
    expect(screen.getAllByRole("textbox")[0]).toHaveValue("Darvozabon bo‘lish");
    expect(screen.queryByRole("checkbox", { name: NOTHING })).not.toBeInTheDocument();
  });

  it("details: Back from the next question keeps typed text and the choice", async () => {
    const u = userEvent.setup();
    const settle = () => new Promise((r) => setTimeout(r, 80)); // heading focus lands at 40ms
    render(<Kids Comp={Phase02} initial={[base]} resume={{ idx: 0, screen: "deepen" }} />);
    await settle();
    await u.type(screen.getAllByRole("textbox")[1]!, "Sarguzasht");
    await u.click(cont());
    await settle();
    await u.click(await screen.findByRole("button", { name: /Orqaga/ }));
    await settle();
    const boxes = await screen.findAllByRole("textbox");
    expect(boxes[0]).toHaveValue("Darvozabon bo‘lish");
    expect(boxes[1]).toHaveValue("Sarguzasht");
  });

  it("activity: the card satisfies the required step and is exclusive with the text", async () => {
    const u = userEvent.setup();
    const seen: ChildProfile[][] = [];
    render(
      <Kids Comp={Phase02} initial={[{ ...base, favoriteActivity: "Lego" }]} resume={{ idx: 0, screen: "activity" }} seen={seen} />,
    );
    const card = screen.getByRole("checkbox", { name: "Aniq bittasini ayta olmayman" });
    await u.click(card);
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(last(seen)).toMatchObject({ noFavoriteActivity: true, favoriteActivity: "" });

    await u.click(cont());
    // moved on to the dream question — no validation error
    expect(await screen.findByText("Hali bu haqda o‘ylab ko‘rmagan")).toBeInTheDocument();

    // Back keeps the choice
    await u.click(screen.getByRole("button", { name: /Orqaga/ }));
    await new Promise((r) => setTimeout(r, 80)); // heading focus lands at 40ms
    expect(screen.getByRole("checkbox", { name: "Aniq bittasini ayta olmayman" })).toBeChecked();
    await u.type(screen.getByRole("textbox"), "Rasm");
    expect(screen.getByRole("checkbox", { name: "Aniq bittasini ayta olmayman" })).not.toBeChecked();
    expect(last(seen)).toMatchObject({ noFavoriteActivity: false, favoriteActivity: "Rasm" });
  });

  it("dream: the card switches to the adult's-hope question", async () => {
    const u = userEvent.setup();
    const seen: ChildProfile[][] = [];
    render(<Kids Comp={Phase02} initial={[base]} resume={{ idx: 0, screen: "dream" }} seen={seen} />);
    await u.click(screen.getByText("Hali bu haqda o‘ylab ko‘rmagan"));
    expect(last(seen).dreamStatus).toBe("not-yet");
    expect(await screen.findByRole("button", { name: "Aslida, orzusi bor" })).toBeInTheDocument();
  });
});

describe("Phase 03 — the ready answers", () => {
  const base: ChildProfile = {
    id: "c1",
    name: "Nodira",
    age: 7,
    phase02Done: true,
    appreciatedQualities: [
      { id: "kind", source: "preset" },
      { id: "brave", source: "preset" },
    ],
    growthBehaviors: [
      { id: "waiting", source: "preset" },
      { id: "sharing", source: "preset" },
    ],
  };

  it("example: one card per quality; each must be answered before Continue", async () => {
    const u = userEvent.setup();
    const seen: ChildProfile[][] = [];
    render(<Kids Comp={Phase03} initial={[base]} resume={{ idx: 0, screen: "example" }} seen={seen} />);
    const cards = screen.getAllByRole("checkbox", { name: "Hozircha misol esimga kelmadi" });
    expect(cards).toHaveLength(2);
    expect(screen.getAllByText("YOKI")).toHaveLength(2);

    await u.click(cards[0]!);
    await u.type(screen.getAllByRole("textbox")[1]!, "Mehmonlar kelganda");
    const q = last(seen).appreciatedQualities!;
    expect(q[0]).toMatchObject({ noDetail: true, detail: "" });
    expect(q[1]).toMatchObject({ noDetail: false, detail: "Mehmonlar kelganda" });
    expect(cards[1]).not.toBeChecked();
  });

  it("growth: the card clears the chosen behaviours and shows the note only while any are chosen", async () => {
    const u = userEvent.setup();
    const seen: ChildProfile[][] = [];
    render(<Kids Comp={Phase03} initial={[base]} resume={{ idx: 0, screen: "growth" }} seen={seen} />);
    expect(screen.getByText(phase03Copy("uz").q3NoneHelp)).toBeInTheDocument();
    await u.click(screen.getByText("Hozircha bunday odati yo‘q"));
    expect(last(seen)).toMatchObject({ noGrowthArea: true, growthBehaviors: [] });
    expect(screen.queryByText(phase03Copy("uz").q3NoneHelp)).not.toBeInTheDocument();
  });

  it("context: per-behaviour 'it happens at different times', exclusive with its text", async () => {
    const u = userEvent.setup();
    const seen: ChildProfile[][] = [];
    render(<Kids Comp={Phase03} initial={[base]} resume={{ idx: 0, screen: "context" }} seen={seen} />);
    const cards = screen.getAllByRole("checkbox", { name: "Har xil paytda bo‘ladi" });
    expect(cards).toHaveLength(2);
    await u.type(screen.getAllByRole("textbox")[0]!, "Kechqurun");
    await u.click(cards[0]!);
    expect(last(seen).growthBehaviors![0]).toMatchObject({ noSpecificContext: true, context: "" });
    expect(screen.getAllByRole("textbox")[0]).toHaveValue("");
  });

  it("no old CheckRow-era labels remain on these screens", () => {
    const src = ["Phase02.tsx", "Phase03.tsx", "EmotionalBridge.tsx"].map((f) =>
      readFileSync(resolve(__dirname, "..", f), "utf8"),
    );
    for (const s of src) {
      expect(s).not.toMatch(/CheckRow|SkipButton|q2SkipLabel|s\dSkip/);
    }
  });
});

// ── persistent draft + payload ───────────────────────────────────

describe("draft & payload compatibility", () => {
  const child: ChildProfile = {
    id: "c1",
    name: "Nodira",
    age: 7,
    phase02Done: true,
    interests: [{ id: "football", source: "preset", detail: "" }],
    noInterestDetails: true,
    noFavoriteActivity: true,
    favoriteActivity: "",
    appreciatedQualities: [{ id: "kind", source: "preset", noDetail: true, detail: "" }],
    noGrowthArea: true,
    growthBehaviors: [],
    emotionalBridge: { noSituation: true, experienceUnsure: true, feelingTrusted: true, noSensitivities: true, done: true },
  };
  function stored(children: ChildProfile[]) {
    const f: FormData = { ...emptyForm("UZ"), children };
    const draft: OrderDraft = {
      bookType: "single",
      data: toPersisted(f),
      phase: "heart",
      stepIndex: 0,
      marketTouched: false,
      phase01Seeded: true,
    };
    const { text, manifest } = stripMedia(toPersisted(f));
    return { payload: { ...draft, data: text, media: manifest } };
  }

  it("every ready-answer choice survives a save → restore round trip", () => {
    const s = stored([child]);
    const r = restoreOrderDraft(JSON.parse(JSON.stringify(s.payload)), emptyForm(), STEPS.length)!;
    expect(r.data.children[0]).toMatchObject({
      noInterestDetails: true,
      noFavoriteActivity: true,
      noGrowthArea: true,
      appreciatedQualities: [{ noDetail: true }],
      emotionalBridge: { noSituation: true, experienceUnsure: true, feelingTrusted: true, noSensitivities: true },
    });
  });

  it("reload: typed interest details come back verbatim, with the card hidden", () => {
    const typed: ChildProfile = {
      ...child,
      noInterestDetails: false,
      interests: [{ id: "football", source: "preset", detail: "Darvozabon bo‘lish" }],
    };
    const s = stored([typed]);
    const r = restoreOrderDraft(JSON.parse(JSON.stringify(s.payload)), emptyForm(), STEPS.length)!;
    const c = r.data.children[0]!;
    expect(c.interests![0]!.detail).toBe("Darvozabon bo‘lish");
    render(<Kids Comp={Phase02} initial={[c]} resume={{ idx: 0, screen: "deepen" }} />);
    expect(screen.getByRole("textbox")).toHaveValue("Darvozabon bo‘lish");
    expect(screen.queryByRole("checkbox", { name: "Qo‘shimcha aytadigan gapim yo‘q" })).not.toBeInTheDocument();
  });

  it("an old draft (pre-card: skip links stored nothing) restores unchanged, nothing reset", () => {
    const old: ChildProfile = { ...child, emotionalBridge: { privateContext: "Yangi maktab", done: true } };
    delete old.noInterestDetails;
    const s = stored([old]);
    const r = restoreOrderDraft(JSON.parse(JSON.stringify(s.payload)), emptyForm(), STEPS.length)!;
    const c = r.data.children[0]!;
    expect(c.emotionalBridge).toEqual({ privateContext: "Yangi maktab", done: true });
    expect(c.noFavoriteActivity).toBe(true); // the old CheckRow flags keep their keys
    expect(c.noInterestDetails).toBeUndefined();
  });

  it("the ready answers add nothing new to the order payload text", () => {
    const withCards = child;
    const blank: ChildProfile = {
      ...child,
      noInterestDetails: undefined,
      emotionalBridge: { done: true },
    };
    for (const fn of [childInterestsText, childDreamsText, childStrengthsText, childGrowthText]) {
      expect(fn(withCards, "uz")).toEqual(fn(blank, "uz"));
    }
    expect(orderEmotionalText([withCards], "uz")).toBeUndefined();
    expect(childDreamsText(withCards, "uz")).toContain("Aniq bir mashg‘uloti yo‘q");
    expect(childGrowthText(withCards, "uz")).toBe("Alohida yaxshilashni istagan odat hozircha yo‘q");
  });
});
