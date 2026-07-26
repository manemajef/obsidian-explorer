import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      obsidian: new URL(
        "./scripts/obsidian-test-stub.ts",
        import.meta.url,
      ).pathname,
    },
  },
});
