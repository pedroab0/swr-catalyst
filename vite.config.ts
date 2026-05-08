/// <reference types="vitest" />

import { resolve } from "node:path";
import dts from "vite-plugin-dts";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      name: "swr-catalyst",
      fileName: "swr-catalyst",
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
  test: {
    name: "root",
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/integration/setup/vitest.setup.ts"],
    exclude: [...configDefaults.exclude, "**/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/__tests__/**",
        "src/index.ts",
        "examples/**",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
      "@demo": resolve(import.meta.dirname, "./examples/demo/src"),
      "swr-catalyst": resolve(import.meta.dirname, "./src/index.ts"),
    },
  },
});
