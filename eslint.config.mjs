import tsparser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

const rawVaultMutationRestrictions = [
  {
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.object.type='MemberExpression'][callee.object.property.name='vault'][callee.property.name=/^(create|createFolder|modify|process)$/]",
    message:
      "Raw user-vault writes belong in src/explorer/vault/. Call a role-specific vault primitive.",
  },
  {
    selector:
      "CallExpression[callee.type='MemberExpression'][callee.object.type='MemberExpression'][callee.object.property.name='fileManager'][callee.property.name=/^(processFrontMatter|renameFile|promptForDeletion|trashFile)$/]",
    message:
      "Raw FileManager mutations belong in src/explorer/vault/. Call a role-specific vault primitive.",
  },
];

export default defineConfig([
  {
    ignores: [
      "main.js",
      "*.js.map",
      "node_modules/**",
      "dev/**",
      "esbuild.config.mjs",
    ],
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
        requestAnimationFrame: "readonly",
        HTMLElement: "readonly",
      },
    },
    rules: {
      "obsidianmd/settings-tab/prefer-setting-definitions": "off",
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
      "src/explorer/api.ts",
      "src/explorer/domain/**/*.{ts,tsx}",
      "src/explorer/data/**/*.{ts,tsx}",
      "src/explorer/vault/**/*.{ts,tsx}",
      "src/explorer/operations/**/*.{ts,tsx}",
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
    // User-vault mutations have one low-level owner. FolderDataStore's
    // adapter.write() persists plugin-private JSON and intentionally does not
    // match these Vault/FileManager member restrictions. Editor.replaceRange()
    // is likewise an active-editor operation, not a raw Vault mutation.
    files: [
      "main.ts",
      "src/ui/**/*.{ts,tsx}",
      "src/explorer/api.ts",
      "src/explorer/model.ts",
      "src/explorer/runtime.tsx",
      "src/explorer/domain/**/*.{ts,tsx}",
      "src/explorer/data/**/*.{ts,tsx}",
      "src/explorer/integration/**/*.{ts,tsx}",
      "src/explorer/operations/**/*.{ts,tsx}",
      "src/explorer/settings/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...rawVaultMutationRestrictions,
      ],
    },
  },
  {
    // Rendered UI receives read contracts and the bound Explorer. It must not
    // reach into behavior, persistence, or host-registration implementations.
    files: ["src/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/explorer/operations/**",
                "**/explorer/vault/**",
                "**/explorer/data/**",
                "**/explorer/integration/**",
              ],
              message:
                "UI may import ExplorerApi/model read contracts and dependency-light helpers, not operations, vault, data, or integration implementations.",
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
    ignores: ["src/ui/components/primitives/**", "src/ui/dev-fixtures/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...rawVaultMutationRestrictions,
        {
          selector: "JSXAttribute[name.name='style']",
          message:
            "No style prop outside primitives — use a class + CSS, a semantic prop, or a token (STYLING.md).",
        },
      ],
    },
  },
  {
    // domain/ is dependency-light: no stateful, behavioral, host-registration,
    // composition-root, React, or UI implementation imports.
    files: ["src/explorer/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react/*", "react-dom", "react-dom/*"],
              message: "domain/ is framework-free.",
            },
            {
              group: [
                "../runtime",
                "../integration/*",
                "../data/*",
                "../operations/*",
                "../../ui/*",
                "../../ui/**",
              ],
              message:
                "domain/ cannot import runtime, integration, data, operations, or UI implementations.",
            },
          ],
        },
      ],
    },
  },
  {
    // Stateful data and low-level vault effects may depend on domain/settings,
    // but not on intentions, host registration, roots, React, or UI adapters.
    files: [
      "src/explorer/data/**/*.{ts,tsx}",
      "src/explorer/vault/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react/*", "react-dom", "react-dom/*"],
              message: "Backend data and vault effects are framework-free.",
            },
            {
              group: [
                "../runtime",
                "../integration/*",
                "../operations/*",
                "../../ui/*",
                "../../ui/**",
              ],
              message:
                "Data and vault effects cannot import runtime, integration, operations, or UI implementations.",
            },
          ],
        },
      ],
    },
  },
]);
