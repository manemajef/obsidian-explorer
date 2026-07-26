# Repository Guidelines

## Project Structure & Module Organization

`main.ts` is the Obsidian plugin entry point. Backend behavior lives in `src/explorer/`: keep host registrations in `integration/`, user flows in `navigation/`, vault writes in `vault/`, stateful data in `data/`, and dependency-light logic in `lib/` or `settings/`. `src/explorer/runtime.tsx` composes the backend. React UI lives under `src/ui/`, with feature components in `components/`, app-agnostic primitives in `components/primitives/`, and CSS in `styles/`. Read `ARCHITECTURE.md` and `STYLING.md` before moving code across these boundaries. Tests currently live in `scripts/*.test.ts`; screenshots and README media live in `assets/`. Do not edit generated `main.js` or `styles.css` directly.

## Build, Test, and Development Commands

- `npm ci` installs the locked dependency set.
- `npm run dev` watches TypeScript, TSX, and CSS and rebuilds plugin bundles.
- `npm run build` type-checks and creates production `main.js` and `styles.css`.
- `npm test` runs the Vitest suite once.
- `npm run lint` checks TypeScript, Obsidian API practices, and architecture boundaries.
- `npm run lint:css` checks CSS ownership, specificity, and token rules.

Run all four validation commands (`lint`, `lint:css`, `build`, and `test`) before handing off a change.

## Coding Style & Naming Conventions

Use TypeScript/TSX with two-space indentation, double quotes, semicolons, and strict typing; avoid `any` and unnecessary assertions. Name files in kebab case (`folder-data-store.ts`), React components and types in PascalCase, and functions/variables in camelCase. Keep core explorer modules React-free. UI primitives accept data through props and must not import `src/explorer/`. Put presentation in scoped CSS classes rather than inline styles; use Obsidian variables and existing `--explorer-*` tokens.

## Testing Guidelines

Use Vitest and name focused files `*.test.ts`. Add regression tests for pure parsing, transforms, and settings logic; follow the arrange/act/assert style shown in `scripts/preview.test.ts`. There is no enforced coverage threshold, so prioritize behavior changed by the patch and verify interactive UI changes manually in an Obsidian vault.

## Commit & Pull Request Guidelines

History commonly uses imperative Conventional Commit subjects such as `fix: prevent layout shift` and `refactor: simplify subfolder indexing`; release commits use `Prepare X.Y.Z`. Keep commits narrow and describe user-visible impact. Pull requests should explain scope and testing, link related issues, and include screenshots or recordings for UI changes. Open an issue before large behavioral changes, and keep contributions focused on folder-note behavior.
