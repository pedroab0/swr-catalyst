/// <reference types="vitest" />

import path, { resolve } from "node:path";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
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
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
