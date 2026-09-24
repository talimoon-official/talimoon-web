/**
 * Frontend ↔ talimoon-intake contract regression.
 *
 * Production once rejected every Kazakh / Kyrgyz / Tajik order with
 * `schema_invalid`: the website offered book languages the intake schema
 * never accepted. These checks make that drift impossible to ship again.
 *
 *  1. (always)     the website submits exactly its "available" languages
 *  2. (cross-repo) submittable languages EXACTLY equal the backend enum
 *  3. (cross-repo) a real `buildSubmitPayload` body passes the backend's own
 *                  `submitOrderSchema` for every submittable language
 *
 * Cross-repo checks read the canonical talimoon-intake checkout, by default
 * the sibling at `<web>/../../../talimoon-intake` (override with
 * INTAKE_REPO_DIR). If it is missing they FAIL, unless explicitly opted out
 * with SKIP_CROSS_REPO_CONTRACT=1 — drift must never pass silently.
 */
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  BACKEND_BOOK_LANGUAGES,
  buildSubmitPayload,
  isBackendBookLanguage,
} from "@/lib/order/api";
import { BOOK_LANGUAGE_OPTIONS } from "@/components/begin/orderFormData";
import { SignatureModel } from "@/lib/order/signaturePad";

const INTAKE_DIR = resolve(
  process.env.INTAKE_REPO_DIR ?? join(process.cwd(), "..", "..", "..", "talimoon-intake"),
);
const SCHEMAS_TS = join(INTAKE_DIR, "src", "validation", "schemas.ts");
const skipCrossRepo = process.env.SKIP_CROSS_REPO_CONTRACT === "1";

/**
 * Validate bodies with talimoon-intake's OWN submitOrderSchema, executed by
 * the backend's own toolchain (its tsx + its zod) in a child process — Vite
 * cannot import modules from outside this repository's root.
 */
function backendParse(bodies: unknown[]): Array<{ success: boolean; paths: string[] }> {
  const dir = mkdtempSync(join(tmpdir(), "intake-contract-"));
  try {
    const script = join(dir, "check.ts");
    writeFileSync(
      script,
      [
        `import { readFileSync } from "node:fs";`,
        `import { submitOrderSchema } from ${JSON.stringify(pathToFileURL(SCHEMAS_TS).href)};`,
        `const bodies = JSON.parse(readFileSync(0, "utf8"));`,
        `const out = bodies.map((b) => { const r = submitOrderSchema.safeParse(b);`,
        `  return { success: r.success, paths: r.success ? [] : r.error.issues.map((i) => i.path.join(".")) }; });`,
        `process.stdout.write(JSON.stringify(out));`,
      ].join("\n"),
    );
    const tsx = join(INTAKE_DIR, "node_modules", "tsx", "dist", "cli.mjs");
    const stdout = execFileSync(process.execPath, [tsx, script], {
      cwd: INTAKE_DIR,
      input: JSON.stringify(bodies),
      encoding: "utf8",
      timeout: 60_000,
    });
    return JSON.parse(stdout);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function backendBookLanguages(): string[] {
  const src = readFileSync(SCHEMAS_TS, "utf8");
  const m = src.match(/export const bookLanguageSchema = z\.enum\(\[([^\]]+)\]\)/);
  if (!m) throw new Error("bookLanguageSchema not found in talimoon-intake schemas.ts");
  return [...m[1]!.matchAll(/"([a-z]{2,3})"/g)].map((x) => x[1]!);
}

describe("book language contract — website side", () => {
  it("submits exactly the languages marked available", () => {
    const available = BOOK_LANGUAGE_OPTIONS.filter((o) => o.status === "available").map((o) => o.code);
    expect([...available].sort()).toEqual([...BACKEND_BOOK_LANGUAGES].sort());
  });

  it("every coming-soon language is refused before submit", () => {
    const soon = BOOK_LANGUAGE_OPTIONS.filter((o) => o.status === "soon").map((o) => o.code);
    expect(soon.sort()).toEqual(["ar", "kk", "ky", "tg"]);
    for (const code of soon) expect(isBackendBookLanguage(code)).toBe(false);
  });
});

describe.skipIf(skipCrossRepo)("book language contract — against talimoon-intake", () => {
  it("the canonical talimoon-intake checkout is reachable", () => {
    expect(
      existsSync(SCHEMAS_TS),
      `talimoon-intake not found at ${INTAKE_DIR}. Set INTAKE_REPO_DIR, or SKIP_CROSS_REPO_CONTRACT=1 to opt out explicitly.`,
    ).toBe(true);
  });

  it("the website's submittable languages EXACTLY equal the backend enum (uz | ru | en)", () => {
    const backend = backendBookLanguages();
    expect([...backend].sort()).toEqual([...BACKEND_BOOK_LANGUAGES].sort());
    expect([...backend].sort()).toEqual(["en", "ru", "uz"]);
  });

  it("a real website payload passes the backend submitOrderSchema for every submittable language", () => {
    const sig = new SignatureModel();
    sig.begin(0.1, 0.5);
    for (let i = 1; i <= 40; i++) sig.extend(0.1 + i * 0.015, 0.5 + Math.sin(i / 4) * 0.2);
    sig.end();

    const bodies = BACKEND_BOOK_LANGUAGES.map((bookLanguage) =>
      buildSubmitPayload({
        idempotencyKey: "contract-test-key-0000000",
        turnstileToken: "tok",
        market: "UZ",
        bookType: "single",
        copies: 1,
        deliveryRequired: true,
        regionCode: "tashkent_city",
        countryCode: "UZ",
        deliveryLocation: {
          latitude: 41.3,
          longitude: 69.2,
          accuracy: 12,
          source: "device",
          confirmedByCustomer: true,
        },
        clientDeclaredTotal: 499000,
        declaredArtifacts: {
          childPhotoCount: 2,
          wantsSpecialPhoto: true,
          characterPhotoCount: 0,
        },
        orderer: { fullName: "Test Orderer", phone: "+998901234567" },
        addressText: "Toshkent",
        recipientRelationship: { type: "parent" },
        children: [{ name: "Madina", age: 5, relationship: { type: "parent" } }],
        personalMessage: "Seni yaxshi ko'ramiz",
        storyGiver: {
          relationshipType: "parent",
          keepsakeRelationship: "mother",
          displayName: "Onajon",
          presentedAs: "self",
          voiceRequested: false,
        },
        bookLanguage,
        consent: {
          schema: "talimoon-order-consent-v1",
          acceptedAt: "2026-09-24T10:00:00.000Z",
          locale: "uz",
          electronicSignature: "Test Orderer",
          drawnSignature: sig.toJSON(),
          adultAndChildAuthority: true,
          privacyAccepted: true,
          privacyVersion: "2026-09-07",
          termsAccepted: true,
          termsVersion: "2026-09-07",
          contractTemplateVersion: "2026-09-07",
          marketingConsent: false,
        },
      }),
    );
    // Non-vacuity control: the same body with a coming-soon language (the
    // exact production failure) must be REJECTED at profile.bookLanguage —
    // proving this harness really detects drift.
    const control = { ...bodies[0]!, profile: { ...bodies[0]!.profile, bookLanguage: "kk" } };

    // exactly what fetch() sends
    const results = backendParse(
      [...bodies, control].map((b) => JSON.parse(JSON.stringify(b))),
    );
    const controlResult = results.pop()!;
    expect(controlResult.success).toBe(false);
    expect(controlResult.paths).toEqual(["profile.bookLanguage"]);

    results.forEach((r, i) => {
      expect(
        r.success,
        `bookLanguage=${BACKEND_BOOK_LANGUAGES[i]} rejected at: ${r.paths.join(", ")}`,
      ).toBe(true);
    });
  }, 90_000);
});
