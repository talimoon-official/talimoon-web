import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("intake error contract", () => {
  it.each([
    [{ error: "archive_unavailable" }, "archive_unavailable"],
    [{ error: "turnstile_failed" }, "turnstile_failed"],
    [{ error: { code: "audio_too_long" } }, "audio_too_long"],
  ])("preserves the safe error code from %j", async (body, code) => {
    vi.stubEnv("NEXT_PUBLIC_INTAKE_API_URL", "https://intake.example");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 503 })));
    const { finalizeOrder } = await import("@/lib/order/api");
    await expect(finalizeOrder({ orderCode: "test", capabilityToken: "test" }))
      .rejects.toMatchObject({ name: "IntakeApiError", status: 503, code });
  });
});
