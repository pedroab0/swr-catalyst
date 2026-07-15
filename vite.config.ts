/// <reference types="vitest" />

import { resolve } from "node:path";
import dts from "vite-plugin-dts";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      fileName: "swr-catalyst",
      name: "swr-catalyst",
    },
    rollupOptions: {
      external: ["react", "swr"],
      output: {
        globals: {
          react: "React",
          swr: "SWR",
        },
      },
    },
  },
  plugins: [dts()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
      "@demo": resolve(import.meta.dirname, "./examples/demo/src"),
      "swr-catalyst": resolve(import.meta.dirname, "./src/index.ts"),
    },
  },
  test: {
    coverage: {
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/__tests__/**",
        "src/index.ts",
        "examples/**",
      ],
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "**/e2e/**"],
    globals: true,
    name: "root",
    setupFiles: ["./src/__tests__/integration/setup/vitest.setup.ts"],
  },
});
