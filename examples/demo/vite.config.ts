import { resolve } from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

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
    name: "demo",
    globals: true,
    environment: "jsdom",
    setupFiles: [
      resolve(
        import.meta.dirname,
        "../../src/__tests__/integration/setup/vitest.setup.ts"
      ),
    ],
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
  build: {
    outDir: resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
});
