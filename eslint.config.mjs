import tsparser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
  {
    ignores: ["main.js", "*.js.map", "node_modules/**", "dev/**"],
  },
  ...obsidianmd.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: "./tsconfig.json" },
      globals: {
        window: "readonly",
        document: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        HTMLElement: "readonly",
      },
    },
  },

  // --- Architecture boundaries (see ARCHITECTURE.md) ---------------------
  // The explorer backend is layered. Lower layers must not import from higher
  // ones, and the non-bridge core must stay free of React. The runtime root
  // (runtime.tsx) and the integration/ layer are the only sanctioned bridges
  // to React and the Obsidian host, so they are intentionally exempt.
  {
    // Contracts + core layers: framework-free, no upward imports.
    files: [
      "src/explorer/model.ts",
      "src/explorer/actions.ts",
      "src/explorer/lib/**/*.{ts,tsx}",
      "src/explorer/data/**/*.{ts,tsx}",
      "src/explorer/vault/**/*.{ts,tsx}",
      "src/explorer/navigation/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react/*", "react-dom", "react-dom/*"],
              message:
                "The explorer core is framework-free. React lives in src/ui, runtime.tsx, or integration/.",
            },
            {
              group: [
                "./runtime",
                "../runtime",
                "./integration/*",
                "../integration/*",
              ],
              message:
                "Core layers must not import upward into the runtime root or the integration (host) layer.",
            },
          ],
        },
      ],
    },
  },
  {
    // lib/ is the dependency-light bottom layer: it may only reach down to
    // settings, vault, and the host SDK — never sideways/up into stateful or
    // host-facing layers.
    files: ["src/explorer/lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react/*", "react-dom", "react-dom/*"],
              message: "lib/ is framework-free.",
            },
            {
              group: [
                "../runtime",
                "../integration/*",
                "../data/*",
                "../navigation/*",
              ],
              message:
                "lib/ is the bottom layer: no runtime, integration, data, or navigation imports.",
            },
          ],
        },
      ],
    },
  },
]);
