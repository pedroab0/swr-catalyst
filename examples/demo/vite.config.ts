import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: import.meta.dirname,
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "../../src"),
      "swr-catalyst": resolve(import.meta.dirname, "../../src/index.ts"),
    },
  },
  build: {
    outDir: resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
});
