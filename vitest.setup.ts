import { createElement } from "react";
import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// next/image needs the Next build pipeline for its loader; in jsdom unit
// tests we only care that it renders an <img> with the given alt/props.
// (Used via components/begin/PhotoGuide.tsx → AdditionalCharacters.)
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    ...rest
  }: {
    src: string | { src: string };
    alt?: string;
    [key: string]: unknown;
  }) =>
    createElement("img", {
      src: typeof src === "string" ? src : src?.src,
      alt: alt ?? "",
      ...rest,
    }),
}));

// jsdom has no object-URL implementation — PhotoUpload builds previews with
// URL.createObjectURL / revokeObjectURL. Stub them so the component renders.
const u = URL as unknown as {
  createObjectURL?: (obj: unknown) => string;
  revokeObjectURL?: (url: string) => void;
};
if (typeof u.createObjectURL !== "function") {
  u.createObjectURL = () => "blob:preview";
}
if (typeof u.revokeObjectURL !== "function") {
  u.revokeObjectURL = () => {};
}

// jsdom has no matchMedia — order-flow phases use it via useFlowScroll for
// the fixed-navbar clearance. A minimal, always-"no-match" stub is enough.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
