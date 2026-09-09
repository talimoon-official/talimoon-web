import { describe, it, expect } from "vitest";
import { buildSubmitPayload, isBackendBookLanguage, planChildPhotoUploads } from "@/lib/order/api";

function fakeFile(name: string): File {
  return new File(["x"], name, { type: "image/jpeg" });
}

const BASE = {
  idempotencyKey: "test-key-0000000000000000",
  turnstileToken: "tok",
  market: "UZ" as const,
  bookType: "single" as const,
  copies: 1,
  deliveryRequired: false,
  orderer: { fullName: "Test Orderer", phone: "+998900000000" },
  children: [{ name: "Ali", age: 7 }],
  bookLanguage: "uz" as const,
  consent: {
    schema: "talimoon-order-consent-v1" as const,
    acceptedAt: "2026-09-07T10:00:00.000Z",
    locale: "uz" as const,
    electronicSignature: "Test Orderer",
    drawnSignature: "[[[0.1,0.2],[0.2,0.3],[0.3,0.2],[0.4,0.4]]]",
    adultAndChildAuthority: true as const,
    privacyAccepted: true as const,
    privacyVersion: "2026-09-06",
    termsAccepted: true as const,
    termsVersion: "2026-09-06",
    marketingConsent: false as const,
  },
};

describe("isBackendBookLanguage", () => {
  it("accepts every supported book language code", () => {
    expect(isBackendBookLanguage("uz")).toBe(true);
    expect(isBackendBookLanguage("ru")).toBe(true);
    expect(isBackendBookLanguage("en")).toBe(true);
    expect(isBackendBookLanguage("ar")).toBe(true);
    expect(isBackendBookLanguage("kk")).toBe(true);
    expect(isBackendBookLanguage("ky")).toBe(true);
    expect(isBackendBookLanguage("tg")).toBe(true);
  });
});

describe("buildSubmitPayload", () => {
  it("builds the minimal shape the backend expects, channel always W", () => {
    const payload = buildSubmitPayload({
      ...BASE,
      declaredArtifacts: { childPhotoCount: 0, wantsSpecialPhoto: false, characterPhotoCount: 0, hasReceipt: false },
    });
    expect(payload.channel).toBe("W");
    expect(payload.idempotencyKey).toBe(BASE.idempotencyKey);
    expect(payload.declaredArtifacts).toEqual([]);
    expect(payload.profile.bookLanguage).toBe("uz");
    expect(payload.profile.children).toEqual([{ name: "Ali", age: 7 }]);
  });

  it("only includes declaredArtifacts kinds with count > 0", () => {
    const payload = buildSubmitPayload({
      ...BASE,
      declaredArtifacts: {
        childPhotoCount: 3,
        wantsSpecialPhoto: true,
        characterPhotoCount: 0,
        hasReceipt: true,
      },
    });
    expect(payload.declaredArtifacts).toEqual([
      { kind: "child_photo", count: 3 },
      { kind: "special_photo", count: 1 },
      { kind: "receipt", count: 1 },
    ]);
  });

  it("omits a child's age when null rather than sending null", () => {
    const payload = buildSubmitPayload({
      ...BASE,
      children: [{ name: "Ali", age: null }],
      declaredArtifacts: { childPhotoCount: 0, wantsSpecialPhoto: false, characterPhotoCount: 0, hasReceipt: false },
    });
    expect(payload.profile.children[0]).toEqual({
      name: "Ali",
      age: undefined,
      interests: undefined,
      dreams: undefined,
      strengths: undefined,
      growthAreas: undefined,
    });
  });

  it("forwards per-child structured Story Profile text, dropping blanks", () => {
    const payload = buildSubmitPayload({
      ...BASE,
      children: [
        {
          name: "Ali",
          age: 7,
          interests: "Futbol — o'zi o'ynaydi",
          dreams: "ORZU QILADI: uchuvchi",
          strengths: "Mehribon",
          growthAreas: "", // blank must not be sent
        },
      ],
      declaredArtifacts: { childPhotoCount: 0, wantsSpecialPhoto: false, characterPhotoCount: 0, hasReceipt: false },
    });
    expect(payload.profile.children[0]).toEqual({
      name: "Ali",
      age: 7,
      interests: "Futbol — o'zi o'ynaydi",
      dreams: "ORZU QILADI: uchuvchi",
      strengths: "Mehribon",
      growthAreas: undefined,
    });
  });

  it("forwards the structured recipient + per-child relationship, order-level and per child", () => {
    const payload = buildSubmitPayload({
      ...BASE,
      recipientRelationship: { type: "grandparent" },
      children: [
        { name: "Ali", age: 7, relationship: { type: "grandparent" } },
        { name: "Zara", age: 5, relationship: { type: "aunt-uncle" } },
      ],
      declaredArtifacts: { childPhotoCount: 0, wantsSpecialPhoto: false, characterPhotoCount: 0, hasReceipt: false },
    });
    expect(payload.profile.recipientRelationship).toEqual({ type: "grandparent" });
    expect(payload.profile.children[0]!.relationship).toEqual({ type: "grandparent" });
    expect(payload.profile.children[1]!.relationship).toEqual({ type: "aunt-uncle" });
  });

  it("keeps a custom ('other') relationship label, trimmed; drops it for non-other types", () => {
    const payload = buildSubmitPayload({
      ...BASE,
      recipientRelationship: { type: "other", customLabel: "  amakivachchamning farzandi  " },
      children: [{ name: "Ali", age: 7, relationship: { type: "parent", customLabel: "ignored" } }],
      declaredArtifacts: { childPhotoCount: 0, wantsSpecialPhoto: false, characterPhotoCount: 0, hasReceipt: false },
    });
    expect(payload.profile.recipientRelationship).toEqual({
      type: "other",
      customLabel: "amakivachchamning farzandi",
    });
    // customLabel is meaningless for a non-"other" type -> not forwarded
    expect(payload.profile.children[0]!.relationship).toEqual({ type: "parent" });
  });

  it("omits relationship entirely when none was set", () => {
    const payload = buildSubmitPayload({
      ...BASE,
      children: [{ name: "Ali", age: 7 }],
      declaredArtifacts: { childPhotoCount: 0, wantsSpecialPhoto: false, characterPhotoCount: 0, hasReceipt: false },
    });
    expect(payload.profile.recipientRelationship).toBeUndefined();
    expect(payload.profile.children[0]!.relationship).toBeUndefined();
  });

  const NO_ART = {
    childPhotoCount: 0,
    wantsSpecialPhoto: false,
    characterPhotoCount: 0,
    hasReceipt: false,
  };
  const PIN = {
    latitude: 41.311081,
    longitude: 69.240562,
    accuracy: 8,
    source: "map" as const,
    formattedAddress: "Amir Temur ko'chasi 1, Toshkent",
    confirmedByCustomer: true as const,
  };

  it("forwards a confirmed delivery pin verbatim on a delivery order", () => {
    const payload = buildSubmitPayload({
      ...BASE,
      deliveryRequired: true,
      regionCode: "tashkent_city",
      deliveryLocation: PIN,
      declaredArtifacts: NO_ART,
    });
    expect(payload.delivery.location).toEqual(PIN);
    // structured coordinates survive as numbers, complementary to addressText
    expect(typeof payload.delivery.location!.latitude).toBe("number");
  });

  it("keeps map-selected coords that differ from the device's current location", () => {
    const mapPick = { ...PIN, latitude: 40.1, longitude: 65.4, source: "map" as const };
    const payload = buildSubmitPayload({
      ...BASE,
      deliveryRequired: true,
      deliveryLocation: mapPick,
      declaredArtifacts: NO_ART,
    });
    expect(payload.delivery.location).toEqual(mapPick);
  });

  it("drops the pin for a pickup order (no delivery) — never sends a stray location", () => {
    const payload = buildSubmitPayload({
      ...BASE,
      deliveryRequired: false,
      deliveryLocation: PIN,
      declaredArtifacts: NO_ART,
    });
    expect(payload.delivery.location).toBeUndefined();
  });

  it("forwards a structured story giver + a final_voice declared artifact", () => {
    const payload = buildSubmitPayload({
      ...BASE,
      declaredArtifacts: {
        childPhotoCount: 1,
        wantsSpecialPhoto: true,
        characterPhotoCount: 0,
        hasReceipt: false,
        hasFinalVoice: true,
      },
      personalMessage: "Sen bizning eng katta baxtimizsan.",
      storyGiver: {
        relationshipType: "grandparent",
        displayName: "Buvijon",
        presentedAs: "other_person",
      },
    });
    expect(payload.profile.storyGiver).toEqual({
      relationshipType: "grandparent",
      displayName: "Buvijon",
      presentedAs: "other_person",
    });
    expect(payload.declaredArtifacts).toEqual(
      expect.arrayContaining([
        { kind: "special_photo", count: 1 },
        { kind: "final_voice", count: 1 },
      ]),
    );
    expect(payload.profile.personalMessage).toBe("Sen bizning eng katta baxtimizsan.");
  });

  it("keeps a story giver customLabel only for type 'other', trims the given name", () => {
    const other = buildSubmitPayload({
      ...BASE,
      declaredArtifacts: { childPhotoCount: 0, wantsSpecialPhoto: true, characterPhotoCount: 0, hasReceipt: false },
      storyGiver: {
        relationshipType: "other",
        customLabel: "  my cousin's child  ",
        displayName: "  Aziza  ",
        presentedAs: "self",
      },
    });
    expect(other.profile.storyGiver).toEqual({
      relationshipType: "other",
      displayName: "Aziza",
      presentedAs: "self",
      customLabel: "my cousin's child",
    });

    const parent = buildSubmitPayload({
      ...BASE,
      declaredArtifacts: { childPhotoCount: 0, wantsSpecialPhoto: true, characterPhotoCount: 0, hasReceipt: false },
      storyGiver: {
        relationshipType: "parent",
        customLabel: "ignored",
        displayName: "Dada",
        presentedAs: "self",
      },
    });
    expect(parent.profile.storyGiver).toEqual({
      relationshipType: "parent",
      displayName: "Dada",
      presentedAs: "self",
    });
  });

  it("omits storyGiver entirely when no given name was provided", () => {
    const payload = buildSubmitPayload({
      ...BASE,
      declaredArtifacts: { childPhotoCount: 0, wantsSpecialPhoto: false, characterPhotoCount: 0, hasReceipt: false },
      storyGiver: { relationshipType: "parent", displayName: "   ", presentedAs: "self" },
    });
    expect(payload.profile.storyGiver).toBeUndefined();
  });

  it("forwards the fine-grained keepsakeRelationship + voiceRequested alongside the coarse type", () => {
    const payload = buildSubmitPayload({
      ...BASE,
      declaredArtifacts: {
        childPhotoCount: 1,
        wantsSpecialPhoto: true,
        characterPhotoCount: 0,
        hasReceipt: false,
        hasFinalVoice: true,
      },
      personalMessage: "Esdalik so'zlari",
      storyGiver: {
        relationshipType: "aunt-uncle",
        keepsakeRelationship: "paternal_uncle",
        displayName: "Amakijon",
        presentedAs: "other_person",
        voiceRequested: true,
      },
    });
    expect(payload.profile.storyGiver).toEqual({
      relationshipType: "aunt-uncle",
      keepsakeRelationship: "paternal_uncle",
      displayName: "Amakijon",
      presentedAs: "other_person",
      voiceRequested: true,
    });
  });

  it("keeps the keepsake customLabel for the fine-grained 'other' code, drops it otherwise", () => {
    const other = buildSubmitPayload({
      ...BASE,
      declaredArtifacts: { childPhotoCount: 0, wantsSpecialPhoto: true, characterPhotoCount: 0, hasReceipt: false },
      storyGiver: {
        relationshipType: "other",
        keepsakeRelationship: "other",
        customLabel: "  amakivachcham  ",
        displayName: "Aziza",
        presentedAs: "other_person",
        voiceRequested: false,
      },
    });
    expect(other.profile.storyGiver).toEqual({
      relationshipType: "other",
      keepsakeRelationship: "other",
      displayName: "Aziza",
      presentedAs: "other_person",
      customLabel: "amakivachcham",
      voiceRequested: false,
    });

    const uncle = buildSubmitPayload({
      ...BASE,
      declaredArtifacts: { childPhotoCount: 0, wantsSpecialPhoto: true, characterPhotoCount: 0, hasReceipt: false },
      storyGiver: {
        relationshipType: "aunt-uncle",
        keepsakeRelationship: "maternal_uncle",
        customLabel: "ignored",
        displayName: "Tog'ajon",
        presentedAs: "other_person",
      },
    });
    expect(uncle.profile.storyGiver).toEqual({
      relationshipType: "aunt-uncle",
      keepsakeRelationship: "maternal_uncle",
      displayName: "Tog'ajon",
      presentedAs: "other_person",
    });
  });

  it("ignores an invalid keepsakeRelationship value (keeps only the coarse type)", () => {
    const payload = buildSubmitPayload({
      ...BASE,
      declaredArtifacts: { childPhotoCount: 0, wantsSpecialPhoto: true, characterPhotoCount: 0, hasReceipt: false },
      storyGiver: {
        relationshipType: "parent",
        // @ts-expect-error — deliberately invalid to prove it is filtered out
        keepsakeRelationship: "uncle",
        displayName: "Dada",
        presentedAs: "self",
      },
    });
    expect(payload.profile.storyGiver).toEqual({
      relationshipType: "parent",
      displayName: "Dada",
      presentedAs: "self",
    });
  });

  it("omits location entirely when the customer set no pin", () => {
    const payload = buildSubmitPayload({
      ...BASE,
      deliveryRequired: true,
      declaredArtifacts: NO_ART,
    });
    expect(payload.delivery.location).toBeUndefined();
  });
});

describe("planChildPhotoUploads", () => {
  it("1 child: all photos map to childSlots[0]'s childRef", () => {
    const photos = [fakeFile("a.jpg"), fakeFile("b.jpg"), fakeFile("c.jpg")];
    const tasks = planChildPhotoUploads(
      [{ photos }],
      [{ childRef: "child-ref-0" }],
      [[false, false, false]],
    );
    expect(tasks).toHaveLength(3);
    expect(tasks.every((t) => t.childRef === "child-ref-0" && t.childIndex === 0)).toBe(true);
    expect(tasks.map((t) => t.photoIndex)).toEqual([0, 1, 2]);
  });

  it("2+ children: each child's photos map ONLY to that child's own childRef, by index", () => {
    const childA = [fakeFile("a1.jpg"), fakeFile("a2.jpg")];
    const childB = [fakeFile("b1.jpg")];
    const tasks = planChildPhotoUploads(
      [{ photos: childA }, { photos: childB }],
      [{ childRef: "ref-A" }, { childRef: "ref-B" }],
      [
        [false, false],
        [false],
      ],
    );
    const forA = tasks.filter((t) => t.childIndex === 0);
    const forB = tasks.filter((t) => t.childIndex === 1);
    expect(forA).toHaveLength(2);
    expect(forA.every((t) => t.childRef === "ref-A")).toBe(true);
    expect(forA.map((t) => t.file)).toEqual(childA);
    expect(forB).toHaveLength(1);
    expect(forB[0].childRef).toBe("ref-B");
    expect(forB[0].file).toBe(childB[0]);
  });

  it("retry: skips already-uploaded photos for child A but still uploads child B's", () => {
    const childA = [fakeFile("a1.jpg"), fakeFile("a2.jpg")];
    const childB = [fakeFile("b1.jpg"), fakeFile("b2.jpg")];
    // Child A's first photo already succeeded in a prior attempt; nothing
    // else has, including all of child B's.
    const done = [
      [true, false],
      [false, false],
    ];
    const tasks = planChildPhotoUploads(
      [{ photos: childA }, { photos: childB }],
      [{ childRef: "ref-A" }, { childRef: "ref-B" }],
      done,
    );
    expect(tasks).toHaveLength(3);
    expect(tasks).not.toContainEqual(
      expect.objectContaining({ childIndex: 0, photoIndex: 0 }),
    );
    expect(tasks).toContainEqual(expect.objectContaining({ childIndex: 0, photoIndex: 1 }));
    expect(tasks.filter((t) => t.childIndex === 1)).toHaveLength(2);
  });

  it("never plans an upload for a child with no matching childRef", () => {
    const tasks = planChildPhotoUploads(
      [{ photos: [fakeFile("a.jpg")] }, { photos: [fakeFile("b.jpg")] }],
      // Only one slot came back — the second child has no childRef at all.
      [{ childRef: "ref-A" }],
      [[false], [false]],
    );
    expect(tasks).toHaveLength(1);
    expect(tasks[0].childIndex).toBe(0);
    expect(tasks.every((t) => typeof t.childRef === "string" && t.childRef.length > 0)).toBe(true);
  });
});
