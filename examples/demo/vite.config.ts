import { resolve } from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: resolve(import.meta.dirname, "dist"),
  },
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "../../src"),
      "@demo": resolve(import.meta.dirname, "src"),
      "swr-catalyst": resolve(import.meta.dirname, "../../src/index.ts"),
    },
  },
  root: import.meta.dirname,
  test: {
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "e2e/**"],
    globals: true,
    name: "demo",
    setupFiles: [
      resolve(
        import.meta.dirname,
        "../../src/__tests__/integration/setup/vitest.setup.ts"
      ),
    ],
  },
});
