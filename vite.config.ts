/// <reference types="vitest" />

import { resolve } from "node:path";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

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
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/integration/setup/vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/__tests__/**",
        "src/index.ts",
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
    },
  },
});
