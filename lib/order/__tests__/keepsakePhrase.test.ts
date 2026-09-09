import { describe, it, expect } from "vitest";
import {
  joinNames,
  keepsakePossessivePhrase,
  buildKeepsakePhotoInstruction,
  keepsakeMessageExample,
  keepsakeWordsHeading,
  keepsakeWordsHelper,
} from "@/lib/order/keepsakePhrase";

// UZ kinship words that must NEVER appear in an EN / RU sentence.
const UZ_KINSHIP = [
  "dadasi",
  "onasi",
  "bobosi",
  "buvisi",
  "akasi",
  "opasi",
  "amakisi",
  "ammasi",
  "tog‘asi",
  "xolasi",
];

describe("joinNames", () => {
  it("UZ: 1 / 2 / 3 / 4 names join naturally with ' va '", () => {
    expect(joinNames(["Fayzbek"], "uz")).toBe("Fayzbek");
    expect(joinNames(["Fayzbek", "Madinabonu"], "uz")).toBe("Fayzbek va Madinabonu");
    expect(joinNames(["Fayzbek", "Madinabonu", "Muhammadsayyid"], "uz")).toBe(
      "Fayzbek, Madinabonu va Muhammadsayyid",
    );
    expect(joinNames(["A", "B", "C", "D"], "uz")).toBe("A, B, C va D");
  });

  it("EN uses ' and ', RU uses ' и '", () => {
    expect(joinNames(["A", "B"], "en")).toBe("A and B");
    expect(joinNames(["A", "B", "C"], "en")).toBe("A, B and C");
    expect(joinNames(["A", "B"], "ru")).toBe("A и B");
    expect(joinNames(["A", "B", "C"], "ru")).toBe("A, B и C");
  });

  it("trims and drops blanks; empty in => empty out", () => {
    expect(joinNames(["  Fayzbek  ", "", "   "], "uz")).toBe("Fayzbek");
    expect(joinNames([], "uz")).toBe("");
  });
});

describe("keepsakePossessivePhrase", () => {
  it("maps each fine-grained code to its UZ presentation phrase", () => {
    const pairs: Array<[Parameters<typeof keepsakePossessivePhrase>[0], string]> = [
      ["father", "dadasi"],
      ["mother", "onasi"],
      ["grandfather", "bobosi"],
      ["grandmother", "buvisi"],
      ["older_brother", "akasi"],
      ["older_sister", "opasi"],
      ["paternal_uncle", "amakisi"],
      ["paternal_aunt", "ammasi"],
      ["maternal_uncle", "tog‘asi"],
      ["maternal_aunt", "xolasi"],
    ];
    for (const [code, phrase] of pairs) {
      expect(keepsakePossessivePhrase(code, undefined, "uz")).toBe(phrase);
    }
  });

  it("EN and RU phrases differ from UZ", () => {
    expect(keepsakePossessivePhrase("father", undefined, "en")).toBe("father");
    expect(keepsakePossessivePhrase("mother", undefined, "ru")).toBe("мамой");
  });

  it("'other' uses the trimmed custom label, or null when there is none", () => {
    expect(keepsakePossessivePhrase("other", "  qo‘shni bobo  ", "uz")).toBe("qo‘shni bobo");
    expect(keepsakePossessivePhrase("other", "", "uz")).toBeNull();
    expect(keepsakePossessivePhrase("other", undefined, "uz")).toBeNull();
  });

  it("no relationship yet => null", () => {
    expect(keepsakePossessivePhrase("", undefined, "uz")).toBeNull();
  });
});

describe("buildKeepsakePhotoInstruction", () => {
  it("single child + father + author => natural UZ sentence", () => {
    expect(
      buildKeepsakePhotoInstruction({
        childNames: ["Fayzbek"],
        relationship: "father",
        authorName: "Sherzodbek",
        locale: "uz",
      }),
    ).toBe("Fayzbek bilan dadasi Sherzodbek birga tushgan haqiqiy suratni yuklang.");
  });

  it("two children joins names naturally", () => {
    expect(
      buildKeepsakePhotoInstruction({
        childNames: ["Fayzbek", "Madinabonu"],
        relationship: "father",
        authorName: "Sherzodbek",
        locale: "uz",
      }),
    ).toBe(
      "Fayzbek va Madinabonu bilan dadasi Sherzodbek birga tushgan haqiqiy suratni yuklang.",
    );
  });

  it("three children uses the deterministic joiner", () => {
    expect(
      buildKeepsakePhotoInstruction({
        childNames: ["Fayzbek", "Madinabonu", "Muhammadsayyid"],
        relationship: "grandmother",
        authorName: "Robiya",
        locale: "uz",
      }),
    ).toBe(
      "Fayzbek, Madinabonu va Muhammadsayyid bilan buvisi Robiya birga tushgan haqiqiy suratni yuklang.",
    );
  });

  it("'other' with a custom label parenthesises the name (no assumed agreement)", () => {
    expect(
      buildKeepsakePhotoInstruction({
        childNames: ["Fayzbek"],
        relationship: "other",
        customLabel: "murabbiysi",
        authorName: "Anvar",
        locale: "uz",
      }),
    ).toBe("Fayzbek bilan murabbiysi (Anvar) birga tushgan haqiqiy suratni yuklang.");
  });

  it("falls back to a safe generic line when data is incomplete", () => {
    const generic = "Bola(lar) bilan esdalik so‘zlari egasi birga tushgan haqiqiy suratni yuklang.";
    expect(
      buildKeepsakePhotoInstruction({ childNames: ["Fayzbek"], relationship: "", authorName: "X", locale: "uz" }),
    ).toBe(generic);
    expect(
      buildKeepsakePhotoInstruction({ childNames: ["Fayzbek"], relationship: "father", authorName: "", locale: "uz" }),
    ).toBe(generic);
    expect(
      buildKeepsakePhotoInstruction({ childNames: [], relationship: "father", authorName: "X", locale: "uz" }),
    ).toBe(generic);
    expect(
      buildKeepsakePhotoInstruction({
        childNames: ["Fayzbek"],
        relationship: "other",
        customLabel: "",
        authorName: "X",
        locale: "uz",
      }),
    ).toBe(generic);
  });

  it("never produces undefined / null / empty commas / raw enum codes", () => {
    const s = buildKeepsakePhotoInstruction({
      childNames: ["Fayzbek"],
      relationship: "father",
      authorName: "Sherzodbek",
      locale: "uz",
    });
    expect(s).not.toMatch(/undefined|null|,\s*,|,\s*$/);
    expect(s).not.toContain("father");
  });

  it("EN sentence is natural and leaks no UZ kinship word", () => {
    const s = buildKeepsakePhotoInstruction({
      childNames: ["Fayzbek", "Madinabonu"],
      relationship: "father",
      authorName: "Sherzodbek",
      locale: "en",
    });
    expect(s).toBe(
      "Upload a real photo of Fayzbek and Madinabonu together with their father Sherzodbek.",
    );
    for (const w of UZ_KINSHIP) expect(s).not.toContain(w);
  });

  it("RU sentence is natural and leaks no UZ kinship word", () => {
    const s = buildKeepsakePhotoInstruction({
      childNames: ["Fayzbek"],
      relationship: "mother",
      authorName: "Nilufar",
      locale: "ru",
    });
    expect(s).toBe("Загрузите настоящую фотографию, где Fayzbek вместе с мамой Nilufar.");
    for (const w of UZ_KINSHIP) expect(s).not.toContain(w);
  });

  it("no em dash character anywhere in the produced sentences", () => {
    for (const locale of ["uz", "en", "ru"] as const) {
      const s = buildKeepsakePhotoInstruction({
        childNames: ["A", "B"],
        relationship: "grandfather",
        authorName: "N",
        locale,
      });
      expect(s).not.toContain("—");
    }
  });
});

describe("keepsake message heading / helper / example", () => {
  it("heading and helper adapt to child count and never break", () => {
    expect(keepsakeWordsHeading(["Fayzbek"], "uz")).toBe("Fayzbek uchun maxsus esdalik so‘zlari");
    expect(keepsakeWordsHeading(["Fayzbek", "Madinabonu"], "uz")).toContain("Fayzbek va Madinabonu");
    expect(keepsakeWordsHeading([], "uz")).toBe("Farzandingiz uchun maxsus esdalik so‘zlari");
    expect(keepsakeWordsHelper(["A", "B"], "uz")).toMatch(/Ularga/);
    expect(keepsakeWordsHelper(["A"], "uz")).toMatch(/Unga/);
  });

  it("UZ example uses the real child name, respectful register, no em dash", () => {
    const ex = keepsakeMessageExample(["Fayzbek"], "uz");
    expect(ex).toContain("Fayzbek");
    expect(ex).not.toMatch(/\bsen\b|\bseni\b|\bsening\b/i);
    expect(ex).not.toContain("—");
    expect(ex.toLowerCase()).toContain("siz");
  });

  it("UZ multi-child example joins names and uses plural forms", () => {
    const ex = keepsakeMessageExample(["Fayzbek", "Madinabonu"], "uz");
    expect(ex).toContain("Fayzbek va Madinabonu");
    expect(ex).toMatch(/ulg‘ayinglar|bo‘linglar/);
  });

  it("EN / RU examples carry the name and leak no UZ kinship word", () => {
    const en = keepsakeMessageExample(["Zarina"], "en");
    const ru = keepsakeMessageExample(["Zarina"], "ru");
    expect(en).toContain("Zarina");
    expect(ru).toContain("Zarina");
    for (const w of UZ_KINSHIP) {
      expect(en).not.toContain(w);
      expect(ru).not.toContain(w);
    }
  });
});
