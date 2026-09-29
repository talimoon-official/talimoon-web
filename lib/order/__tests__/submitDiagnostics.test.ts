import { describe, it, expect, vi, afterEach } from "vitest";
import { classifySubmitError, fileTypeCategory, reportSubmitDiagnostic } from "../submitDiagnostics";
import { FileUnreadableError } from "../fileReadability";
import { IntakeApiError } from "../api";
import { RequestTimeoutError } from "@/lib/net/fetchWithTimeout";

vi.mock("../api", async (orig) => ({
  ...(await orig<typeof import("../api")>()),
  apiUrl: (p: string) => `https://api.test${p}`,
}));

afterEach(() => vi.unstubAllGlobals());

const img = new File(["x"], "Nodira_passport.jpg", { type: "image/jpeg" });

describe("classifySubmitError", () => {
  it("file read / timeout / network / abort / http are told apart", () => {
    expect(classifySubmitError("child_photo_upload", new FileUnreadableError("NotReadableError"), img)).toMatchObject({
      failure: "file_read_failed",
      errorName: "NotReadableError",
      fileType: "image",
    });
    expect(classifySubmitError("voice_upload", new RequestTimeoutError("order.upload"), null)).toMatchObject({
      failure: "timeout",
      errorName: "RequestTimeoutError",
      fileType: "none",
    });
    expect(classifySubmitError("finalize", new TypeError("Failed to fetch https://api/v1/orders/TAL-2026-0018"))).toMatchObject({
      failure: "network_failed",
      errorName: "TypeError",
    });
    expect(classifySubmitError("finalize", new DOMException("x", "AbortError"))).toMatchObject({ failure: "aborted" });
    expect(classifySubmitError("order_create", new IntakeApiError("m", 409, "turnstile_failed"))).toMatchObject({
      failure: "http_error",
      httpStatus: 409,
      apiCode: "turnstile_failed",
    });
  });

  it("never carries a message, a URL, a filename or an unknown error name", () => {
    const d = classifySubmitError(
      "child_photo_upload",
      Object.assign(new Error("C:/Users/Sherzod/Nodira.jpg"), { name: "WeirdVendorError" }),
      img,
    );
    expect(d.errorName).toBe("other");
    const all = JSON.stringify(d);
    expect(all).not.toMatch(/Sherzod|Nodira|jpg|C:\//);
    // a server code that is not a plain [a-z_] token is dropped
    const h = classifySubmitError("finalize", new IntakeApiError("m", 500, "<script>TAL-2026-0001"));
    expect(h.apiCode).toBeUndefined();
  });

  it("file type is the MIME family only", () => {
    expect(fileTypeCategory(new File(["x"], "a.heic", { type: "image/heic" }))).toBe("image");
    expect(fileTypeCategory(new File(["x"], "v.webm", { type: "audio/webm" }))).toBe("audio");
    expect(fileTypeCategory(new File(["x"], "v", { type: "" }))).toBe("other");
    expect(fileTypeCategory(null)).toBe("none");
  });
});

describe("reportSubmitDiagnostic", () => {
  it("posts the fixed shape, fire-and-forget; a failing network never throws", async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError("offline");
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(() =>
      reportSubmitDiagnostic(classifySubmitError("child_photo_upload", new FileUnreadableError("NotReadableError"), img)),
    ).not.toThrow();
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.test/v1/client-diagnostics");
    expect(init.credentials).toBe("omit");
    expect(init.keepalive).toBe(true);
    expect(JSON.parse(String(init.body))).toEqual({
      stage: "child_photo_upload",
      failure: "file_read_failed",
      errorName: "NotReadableError",
      fileType: "image",
      online: true,
    });
  });
});
