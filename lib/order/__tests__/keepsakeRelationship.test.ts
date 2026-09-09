import { describe, it, expect } from "vitest";
import {
  KEEPSAKE_RELATIONSHIPS,
  coarseFor,
  isKeepsakeRelationship,
  keepsakeRelationshipLabel,
  keepsakeRelationshipOptions,
  type KeepsakeRelationship,
} from "@/lib/order/keepsakeRelationship";

describe("keepsakeRelationship — canonical codes", () => {
  it("has exactly the 11 approved fine-grained codes, in canonical order", () => {
    expect([...KEEPSAKE_RELATIONSHIPS]).toEqual([
      "father",
      "mother",
      "grandfather",
      "grandmother",
      "older_brother",
      "older_sister",
      "paternal_uncle",
      "paternal_aunt",
      "maternal_uncle",
      "maternal_aunt",
      "other",
    ]);
  });

  it("isKeepsakeRelationship accepts only the canonical codes", () => {
    for (const c of KEEPSAKE_RELATIONSHIPS) expect(isKeepsakeRelationship(c)).toBe(true);
    for (const bad of ["uncle", "aunt-uncle", "parent", "", null, undefined, 3]) {
      expect(isKeepsakeRelationship(bad)).toBe(false);
    }
  });
});

describe("keepsakeRelationship — localised labels (display only)", () => {
  it("gives the exact approved UZ labels", () => {
    const uz: Record<KeepsakeRelationship, string> = {
      father: "Otasi",
      mother: "Onasi",
      grandfather: "Bobosi",
      grandmother: "Buvisi",
      older_brother: "Akasi",
      older_sister: "Opasi",
      paternal_uncle: "Amakisi",
      paternal_aunt: "Ammasi",
      maternal_uncle: "Tog‘asi",
      maternal_aunt: "Xolasi",
      other: "Boshqa",
    };
    for (const [code, label] of Object.entries(uz)) {
      expect(keepsakeRelationshipLabel(code as KeepsakeRelationship, "uz")).toBe(label);
    }
  });

  it("EN and RU differ from UZ but map the same set of codes", () => {
    expect(keepsakeRelationshipLabel("father", "en")).toBe("Father");
    expect(keepsakeRelationshipLabel("father", "ru")).toBe("Отец");
    expect(keepsakeRelationshipOptions("en")).toHaveLength(11);
    expect(keepsakeRelationshipOptions("ru").map((o) => o.code)).toEqual([
      ...KEEPSAKE_RELATIONSHIPS,
    ]);
  });
});

describe("keepsakeRelationship — coarseFor downcast (fine → legacy)", () => {
  it("widens each fine code to the correct coarse bucket, never narrows", () => {
    expect(coarseFor("father")).toBe("parent");
    expect(coarseFor("mother")).toBe("parent");
    expect(coarseFor("grandfather")).toBe("grandparent");
    expect(coarseFor("grandmother")).toBe("grandparent");
    expect(coarseFor("older_brother")).toBe("sibling");
    expect(coarseFor("older_sister")).toBe("sibling");
    expect(coarseFor("paternal_uncle")).toBe("aunt-uncle");
    expect(coarseFor("paternal_aunt")).toBe("aunt-uncle");
    expect(coarseFor("maternal_uncle")).toBe("aunt-uncle");
    expect(coarseFor("maternal_aunt")).toBe("aunt-uncle");
    expect(coarseFor("other")).toBe("other");
  });

  it("covers every canonical code (no code left unmapped)", () => {
    for (const c of KEEPSAKE_RELATIONSHIPS) {
      expect(typeof coarseFor(c)).toBe("string");
    }
  });
});
