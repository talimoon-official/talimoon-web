import { describe, it, expect } from "vitest";
import { isOrderFunnelPath } from "@/lib/site/order-funnel";

describe("isOrderFunnelPath", () => {
  it("matches the funnel entry point and every route beneath it", () => {
    expect(isOrderFunnelPath("/begin")).toBe(true);
    expect(isOrderFunnelPath("/begin/personalized-book")).toBe(true);
    expect(isOrderFunnelPath("/begin/personalized-book/price")).toBe(true);
    expect(isOrderFunnelPath("/begin/personalized-book/form")).toBe(true);
    expect(isOrderFunnelPath("/begin/anything/deeper/still")).toBe(true);
  });

  it("does not match normal public pages", () => {
    expect(isOrderFunnelPath("/")).toBe(false);
    expect(isOrderFunnelPath("/about")).toBe(false);
    expect(isOrderFunnelPath("/products/personalized-books")).toBe(false);
    expect(isOrderFunnelPath("/journey")).toBe(false);
    expect(isOrderFunnelPath("/story-library")).toBe(false);
  });

  it("does not match paths that merely start with the word 'begin'", () => {
    expect(isOrderFunnelPath("/beginner")).toBe(false);
    expect(isOrderFunnelPath("/begins")).toBe(false);
    expect(isOrderFunnelPath("/begin-here")).toBe(false);
  });

  it("is safe when the pathname is absent", () => {
    expect(isOrderFunnelPath(null)).toBe(false);
    expect(isOrderFunnelPath(undefined)).toBe(false);
    expect(isOrderFunnelPath("")).toBe(false);
  });
});
