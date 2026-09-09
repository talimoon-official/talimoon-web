import "@testing-library/jest-dom/vitest";

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
