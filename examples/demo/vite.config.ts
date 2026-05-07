import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: import.meta.dirname,
  resolve: {
    alias: {
      "@demo": resolve(import.meta.dirname, "src"),
      "@": resolve(import.meta.dirname, "../../src"),
      "swr-catalyst": resolve(import.meta.dirname, "../../src/index.ts"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [resolve(import.meta.dirname, "../../src/__tests__/integration/setup/vitest.setup.ts")],
  },
  build: {
    outDir: resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
});
