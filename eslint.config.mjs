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
  // --- UI system boundaries (see STYLING.md) -----------------------------
  // Semantic primitives are app-ignorant: they may not import the
  // explorer backend. App wiring belongs in feature components and
  // interactions.ts.
  {
    files: ["src/ui/components/primitives/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/explorer/**"],
              message:
                "Semantic components are app-ignorant. Pass data in via props; wire behavior in feature components.",
            },
          ],
        },
      ],
    },
  },
  // Feature components declare meaning; presentation lives in CSS. Inline
  // styles are allowed only inside primitive layout components.
  {
    files: ["src/ui/**/*.tsx"],
    ignores: ["src/ui/components/primitives/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='style']",
          message:
            "No style prop outside primitives — use a class + CSS, a semantic prop, or a token (STYLING.md).",
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
