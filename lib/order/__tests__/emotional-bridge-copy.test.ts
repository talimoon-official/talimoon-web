import { describe, it, expect } from "vitest";
import {
  EMOTIONAL_BRIDGE_COPY,
  emotionalBridgeCopy,
  type EmotionalBridgeCopy,
  type Locale,
} from "@/lib/order/emotional-bridge-copy";

const LOCALES: Locale[] = ["uz", "en", "ru"];

/** Every user-visible string in one locale's copy, flattened. */
function allStrings(c: EmotionalBridgeCopy): string[] {
  const out: string[] = [];
  const NAME = "Nodira";
  const push = (v: unknown) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(push);
    else if (typeof v === "function") {
      // call with plausible args for every arity/shape used in the module
      try {
        out.push((v as (n: string, m: boolean) => string)(NAME, false));
        out.push((v as (n: string, m: boolean) => string)(NAME, true));
      } catch {
        /* not a (name,multi) fn */
      }
      try {
        out.push((v as (n: string) => string)(NAME));
      } catch {
        /* not a (name) fn */
      }
    }
  };
  Object.values(c).forEach(push);
  return out.filter((s) => s.length > 0);
}

describe("KO'NGIL SO'ZLARI copy — psychological safety", () => {
  it("resolves uz/en/ru and falls back to en for anything else", () => {
    expect(emotionalBridgeCopy("uz")).toBe(EMOTIONAL_BRIDGE_COPY.uz);
    expect(emotionalBridgeCopy("ru")).toBe(EMOTIONAL_BRIDGE_COPY.ru);
    expect(emotionalBridgeCopy("en")).toBe(EMOTIONAL_BRIDGE_COPY.en);
    expect(emotionalBridgeCopy("ar")).toBe(EMOTIONAL_BRIDGE_COPY.en);
  });

  for (const loc of LOCALES) {
    describe(loc, () => {
      const c = EMOTIONAL_BRIDGE_COPY[loc];
      const text = allStrings(c).join("\n").toLowerCase();

      it("never diagnoses or uses clinical / therapeutic language", () => {
        for (const bad of [
          "trauma",
          "травм",
          "disorder",
          "расстройств",
          "diagnos",
          "диагно",
          "therap",
          "терап",
          "psycholog",
          "психолог",
          "attachment disorder",
          "anxiety disorder",
        ]) {
          expect(text).not.toContain(bad);
        }
      });

      it("never blames or stigmatises the child", () => {
        for (const bad of [
          "yomon bola",
          "muammoli bola",
          "buzilgan xulq",
          "bad child",
          "difficult child",
          "плохой ребёнок",
          "проблемный ребёнок",
        ]) {
          expect(text).not.toContain(bad);
        }
      });

      it("does not promise a therapeutic outcome", () => {
        for (const bad of [
          "muammoni hal qil",
          "hal qilamiz",
          "tuzatamiz",
          "we will fix",
          "will heal",
          "resolve the",
          "исправим",
          "решим проблему",
          "вылечим",
        ]) {
          expect(text).not.toContain(bad);
        }
      });

      it("Step 2 asks a possibility / parent observation, not a fact about the child's mind", () => {
        const s2 = [c.s2Q("Nodira", false), c.s2Q("Nodira", true), c.s2Help].join(" ").toLowerCase();
        // must be hedged
        const hedged =
          /sizningcha|menimcha|mumkin|bo['’]lishi mumkin|might|in your view|как вам кажется|может/.test(
            s2,
          );
        expect(hedged).toBe(true);
        // must NOT assert certainty about the child's thoughts
        expect(s2).not.toMatch(/nima deb o['’]ylaydi\b/);
        expect(s2).not.toMatch(/what does .* think\b/);
        // an explicit "I don't know" escape hatch exists
        expect(c.s2Skip.toLowerCase()).toMatch(/bilmayman|don['’]t know|не знаю/);
      });

      it("does not duplicate Esdalik Sahifasi (no request for a message / wish to the child)", () => {
        expect(text).not.toContain("unga nima demoqchisiz");
        expect(text).not.toContain("qanday tilak");
        expect(text).not.toContain("qaysi so'zlarni eslab qolsin");
        expect(text).not.toContain("bir gap aytsangiz");
        expect(text).not.toContain("yuragingizdan faqat bitta gap");
        expect(text).not.toContain("one sentence from your heart");
        expect(text).not.toContain("what would you say to them");
      });

      it("keeps skip options on steps 1, 2 and 4 (guilt-free, no forced disclosure)", () => {
        expect(c.s1Skip.trim().length).toBeGreaterThan(0);
        expect(c.s2Skip.trim().length).toBeGreaterThan(0);
        expect(c.s4Skip.trim().length).toBeGreaterThan(0);
        // step 1 skip reads as "nothing in particular", not "I refuse"
        expect(c.s1Skip.toLowerCase()).toMatch(/yo[‘'’ʻ`]q|nothing|ничего/);
      });

      it("Step 3 asks for an emotional direction, not a quote to the child", () => {
        const s3 = [c.s3Q("Nodira", false), c.s3Help, c.s3Placeholder].join(" ").toLowerCase();
        expect(s3).not.toMatch(/["“„][^"”]*seni[^"”]*["”]/); // no quoted "…seni…" line
        expect(s3).not.toContain("men seni yaxshi ko'raman");
        expect(s3).not.toContain("i love you");
      });

      it("the full privacy explanation is shown once and stays non-promissory", () => {
        expect(c.privacyExplanation.length).toBeGreaterThan(40);
        const p = c.privacyExplanation.toLowerCase();
        expect(p).not.toContain("bolaga tushuntiramiz");
        expect(p).not.toContain("xabarni yetkazamiz");
        expect(p).not.toContain("ruhiy holatini tuzatamiz");
      });

      it("the eyebrow is the flow name, not the retired 'Yuragingizda qolgan gaplar'", () => {
        expect(c.eyebrow).not.toContain("Yuragingizda qolgan gaplar");
        expect(c.eyebrow).not.toContain("Words still in your heart");
      });

      it("every required copy key is present and non-empty", () => {
        const keys: (keyof EmotionalBridgeCopy)[] = [
          "continue",
          "back",
          "eyebrow",
          "introHeading",
          "trustNote",
          "s1Help",
          "s1Skip",
          "s2Help",
          "s2Placeholder",
          "s2Skip",
          "s3Help",
          "s3Placeholder",
          "s4Q",
          "s4Help",
          "s4Placeholder",
          "s4Skip",
          "ackHeading",
          "privacyExplanation",
        ];
        for (const k of keys) expect(String(c[k]).trim().length).toBeGreaterThan(0);
        expect(c.introBody.length).toBeGreaterThan(0);
      });
    });
  }
});
