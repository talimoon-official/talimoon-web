import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Component-level unit tests only (jsdom). Next's own build/typecheck stay
// the source of truth for the app as a whole; this runner exists for the
// dynamic additional-character UI and the order-model helpers.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", ".claude"],
    // userEvent-driven flow tests type whole answers; under a full parallel
    // run (heavy jsdom setup per worker) they can exceed the 5s default.
    testTimeout: 15_000,
  },
});
