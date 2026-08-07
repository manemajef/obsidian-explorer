# mocks/types — vendored type declarations

These are **verbatim copies** of third-party `.d.ts` files, not test doubles or
hand-written stubs. Do not edit them by hand.

| Path | Copied from |
| --- | --- |
| `types/obsidian.d.ts` | `node_modules/obsidian/obsidian.d.ts` |
| `types/react/` | `node_modules/@types/react/` |
| `types/react-dom/` | `node_modules/@types/react-dom/` |
| `types/csstype.d.ts` | `node_modules/csstype/index.d.ts` |
| `types/prop-types.d.ts` | `node_modules/@types/prop-types/index.d.ts` |

`csstype` and `prop-types` are here because `@types/react` imports them. Without
them `CSSProperties` degrades to `any` and every inline style object in
`components/primitives/layout.tsx` reports as an unsafe assignment. Both are leaf
packages, so this set closes the import graph — verified by type-checking the
repo with `node_modules` entirely absent.

## Why they exist

The Obsidian community plugin scanner runs type-aware `typescript-eslint` rules
(`@typescript-eslint/no-unsafe-*`) against a checkout of this repo **without
installing `node_modules`**. Every import from `obsidian`, `react`, and
`react-dom` therefore fails to resolve, becomes TypeScript's internal *error
type* — which behaves as `any` — and every downstream member access, call,
assignment, argument, and return gets flagged. That produced ~2,000 false
positives and dropped the plugin's Scorecard score to ~0 from release 1.5.1
onward, with no corresponding change in this codebase.

Upstream tracking:

- https://github.com/obsidianmd/eslint-plugin/issues/182
- https://forum.obsidian.md/t/bug-plugin-scorecard-linter-cannot-resolve-internal-deps-in-monorepos/116176

Checking the declarations in, and pointing `compilerOptions.paths` at them, lets
the scanner's TypeScript program resolve these imports from the repo itself.
Measured effect under a faithful reproduction of the scanner: **1,988 warnings →
0**.

## Why the directory is called `mocks`

The scanner skips a fixed list of paths, and `**/mocks/**` is one of them. If
these files were linted, the vendored declarations would themselves report ~1,438
warnings (`no-deprecated`, `no-explicit-any`, `no-empty-object-type`). Any other
name on the scanner's ignore list (`test/`, `tests/`, `__mocks__/`, `dist`,
`build`, `pkg`) would work equally well; `mocks` was chosen only because it is
ignored. Renaming means updating `compilerOptions.paths` in `tsconfig.json` to
match.

## Keeping them current

`compilerOptions.paths` makes these copies — not `node_modules` — the types the
project compiles against, so drift would mean silently building against stale
declarations. `npm run build` runs a check that fails if they differ from the
installed packages.

```bash
npm run types:check   # verify copies match node_modules (run by npm run build)
npm run types:sync    # refresh copies after bumping obsidian or @types/react
```

Re-run `npm run types:sync` and commit the result whenever `obsidian`,
`@types/react`, or `@types/react-dom` changes.

## When to delete this

Once the scanner installs dependencies before linting, this directory, the
`paths` mapping, the `mocks` entry in `exclude`, and the `types:sync` /
`types:check` scripts can all be removed.
