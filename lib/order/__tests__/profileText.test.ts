import { describe, it, expect } from "vitest";
import type { ChildProfile } from "@/lib/order/types";
import {
  childDreamsText,
  childGrowthText,
  childInterestsText,
  childStrengthsText,
  orderDesiredValueLabels,
  orderEmotionalText,
} from "@/lib/order/profileText";

/**
 * Regression guard for the production Story Profile data-mapping bug:
 * the /begin form collects the child's world / character / values /
 * emotional bridge as structured per-child answers, but the submit
 * payload used to drop all of it, so every structured Story Profile
 * section rendered "— taqdim etilmagan —". These assert the serialisers
 * turn each answered section into real text and only yield `undefined`
 * when the customer genuinely skipped it.
 */

function child(patch: Partial<ChildProfile> = {}): ChildProfile {
  return {
    id: "c1",
    name: "Madinabonu",
    age: 6,
    ...patch,
  };
}

const FULL = child({
  interests: [
    { id: "football", source: "preset", detail: "o'zi o'ynashni yaxshi ko'radi" },
    { id: "kittens", source: "preset" },
    { id: "dinozavrlar", source: "custom", detail: "turlari haqida o'qiydi" },
  ],
  favoriteActivity: "hovlida rasm chizadi",
  dreamStatus: "has-dream",
  childDream: "shifokor bo'lish",
  appreciatedQualities: [
    { id: "kind", source: "preset", detail: "ukasiga doim yordam beradi" },
    { id: "curious", source: "preset" },
  ],
  growthBehaviors: [
    { id: "waiting", source: "preset", context: "navbat kutishga qiynaladi" },
    { id: "temper", source: "preset" },
  ],
  desiredValues: ["patience", "gratitude"],
  emotionalBridge: {
    privateContext: "otasi ish tufayli uzoqda",
    childExperience: "menimcha, ba'zan meni sog'inadi",
    intendedFeeling: "mehrim kamaymaganini his qilsin",
    sensitivities: "ajralish haqida ochiq gapirilmasin",
  },
});

describe("profileText — per-child serialisers (uz)", () => {
  it("interests: one line per interest, verbatim detail kept", () => {
    const out = childInterestsText(FULL, "uz")!;
    expect(out).toContain("Futbol — o'zi o'ynashni yaxshi ko'radi");
    expect(out).toContain("Mushukchalar");
    expect(out).toContain("dinozavrlar — turlari haqida o'qiydi");
    expect(out.split("\n")).toHaveLength(3);
    expect(out).not.toContain("taqdim etilmagan");
  });

  it("dreams: favourite activity + the child's own dream, not conflated", () => {
    const out = childDreamsText(FULL, "uz")!;
    expect(out).toContain("hovlida rasm chizadi");
    expect(out).toContain("shifokor bo'lish");
  });

  it("dreams: the ADULT's hope is labelled as such when there is no child dream", () => {
    const c = child({ dreamStatus: "not-yet", adultHope: "mehribon inson bo'lib ulg'aysin" });
    const out = childDreamsText(c, "uz")!;
    expect(out).toContain("mehribon inson bo'lib ulg'aysin");
    expect(out).not.toContain("shifokor");
  });

  it("strengths: appreciated qualities with their own examples", () => {
    const out = childStrengthsText(FULL, "uz")!;
    expect(out).toContain("Mehribon — ukasiga doim yordam beradi");
    expect(out).toContain("Qiziquvchan");
  });

  it("growthAreas: behaviours with their per-item context", () => {
    const out = childGrowthText(FULL, "uz")!;
    expect(out).toContain("navbat kutishga qiynaladi");
    expect(out.toLowerCase()).toContain("jahli"); // "temper" full label
  });

  it("growthAreas: explicit 'nothing in particular' is preserved, not dropped", () => {
    const out = childGrowthText(child({ noGrowthArea: true }), "uz")!;
    expect(out.length).toBeGreaterThan(0);
    expect(out).not.toContain("taqdim etilmagan");
  });

  it("every section is undefined for a child who answered nothing", () => {
    const bare = child();
    expect(childInterestsText(bare, "uz")).toBeUndefined();
    expect(childDreamsText(bare, "uz")).toBeUndefined();
    expect(childStrengthsText(bare, "uz")).toBeUndefined();
    expect(childGrowthText(bare, "uz")).toBeUndefined();
  });
});

describe("profileText — order-level serialisers", () => {
  it("desired values: de-duplicated union across children, labelled", () => {
    const a = child({ id: "a", desiredValues: ["patience", "gratitude"] });
    const b = child({ id: "b", name: "Sherzod", desiredValues: ["gratitude", "courage"] });
    expect(orderDesiredValueLabels([a, b], "uz")).toEqual(["Sabr", "Shukr", "Jasorat"]);
  });

  it("desired values: undefined (not []) when no child chose any", () => {
    expect(orderDesiredValueLabels([child()], "uz")).toBeUndefined();
  });

  it("Ko'ngil so'zlari: the four numbered parts under the header + standing note", () => {
    const out = orderEmotionalText([FULL], "uz")!;
    // production-facing header + "not copied into the book" note, once
    expect(out).toContain("NOZIK VAZIYAT / HISSIY KONTEKST");
    expect(out).toContain("kitobga so'zma-so'z ko'chirilmaydi");
    // the four psychologically distinct pieces, numbered, verbatim
    expect(out).toContain("1. Vaziyat: otasi ish tufayli uzoqda");
    expect(out).toContain(
      "2. Bolaning holati haqidagi ota-ona / buyurtmachi kuzatuvi: menimcha, ba'zan meni sog'inadi",
    );
    expect(out).toContain("3. Istalgan hissiy yo'nalish: mehrim kamaymaganini his qilsin");
    expect(out).toContain(
      "4. Ehtiyotkor yondashiladigan mavzular: ajralish haqida ochiq gapirilmasin",
    );
    // Step 2's LABEL is a parent observation, never "the child's mental state"
    expect(out).toContain("ota-ona / buyurtmachi kuzatuvi");
    expect(out).not.toContain("Bolaning ruhiy holati");
    // no direct quote to the child, no "one sentence from your heart" leftover
    expect(out).not.toContain("Yurakdan");
  });

  it("Ko'ngil so'zlari: a single filled step still serialises (no forced problem)", () => {
    const happy = child({ emotionalBridge: { intendedFeeling: "mehr va yaqinlik" } });
    const out = orderEmotionalText([happy], "uz")!;
    expect(out).toContain("3. Istalgan hissiy yo'nalish: mehr va yaqinlik");
    expect(out).not.toContain("1. Vaziyat:");
  });

  it("Ko'ngil so'zlari: multi-child — each child's context is name-attributed, in order", () => {
    const a = child({ id: "a", name: "Madinabonu", emotionalBridge: { privateContext: "A vaziyat" } });
    const b = child({ id: "b", name: "Sherzod", emotionalBridge: { privateContext: "B vaziyat" } });
    const out = orderEmotionalText([a, b], "uz")!;
    expect(out).toContain("Madinabonu:");
    expect(out).toContain("Sherzod:");
    expect(out.indexOf("A vaziyat")).toBeLessThan(out.indexOf("Sherzod:"));
  });

  it("Ko'ngil so'zlari: undefined when no child filled any of the four fields", () => {
    expect(orderEmotionalText([child()], "uz")).toBeUndefined();
    expect(orderEmotionalText([child({ emotionalBridge: { done: true } })], "uz")).toBeUndefined();
  });

  it("Ko'ngil so'zlari: EN and RU carry the same four distinctions", () => {
    const en = orderEmotionalText([FULL], "en")!;
    expect(en).toContain("SENSITIVE SITUATION / EMOTIONAL CONTEXT");
    expect(en).toContain("1. Situation:");
    expect(en).toContain("2. Parent's / buyer's observation about the child:");
    expect(en).toContain("3. Desired emotional direction:");
    expect(en).toContain("4. Themes to approach with care:");
    const ru = orderEmotionalText([FULL], "ru")!;
    expect(ru).toContain("ДЕЛИКАТНАЯ СИТУАЦИЯ / ЭМОЦИОНАЛЬНЫЙ КОНТЕКСТ");
    expect(ru).toContain("1. Ситуация:");
    expect(ru).toContain("4. Темы, требующие бережного подхода:");
  });
});
