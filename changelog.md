# Changelog

> Brief entries here. For big features/refactors, add a detailed report in `notes/changes/YYYY-MM-DD-slug.md` and link to it.
> For in-progress tasks, use `notes/tasks/` to track work.

---

## 2026-02-04 - Backend API + Obsidian Bridge Refactor

**Task:** Introduce a backend API/core layer and move Obsidian orchestration out of UI while preserving existing plugin behavior.
**Files:**
- `main.ts` — now resolves effective settings via backend resolver and delegates block rendering to `ExplorerBridge`
- `src/plugin/obsidian/explorer-bridge.tsx` (new) — thin host adapter that wires Obsidian context to backend + UI callbacks
- `src/backend/explorer-api.ts` (new) — single backend facade for render model building and all vault actions
- `src/backend/file-listing.ts` (new) — centralized sort/filter/search/pagination computation
- `src/backend/settings-resolver.ts` (new) — canonical effective settings merge + normalization
- `src/backend/contracts.ts` (new) — typed backend boundary contracts
- `src/backend/services/block-settings.ts` (new) — explorer block parser/serializer moved behind backend service
- `src/ui/hooks/use-explorer-state.ts` — now state-focused and delegates display logic to backend listing
- `src/ui/components/actions-bar.tsx`, `src/ui/components/folder-buttons.tsx`, `src/ui/components/breadcrumbs.tsx` — no direct service imports; use callbacks from parent
- `src/services/vault-actions.ts` — `openOrCreateFolderNote` now supports `sourcePath/newLeaf` for correct UI callback flow
- `src/services/folder-index.ts` — fixed `onlyNotes` filter bug (`BASE` → `pdf`)
- `src/ui/explorer-view.tsx` — compatibility alias to new bridge

Details → `notes/changes/2026-02-04-backend-api-bridge-refactor.md`

---

## 2026-02-02 - Glass UI Components

**Task:** Replace old action buttons with new self-contained glass components. New glass effect system with specular highlights, theme-aware tokens, Obsidian-compatible compositing.
**Files:**
- `src/ui/components/ui/glass.tsx` (new) — `GlassItem`, `GlassGroup`, `GlassGroupItem` with built-in icon rendering via `setIcon`
- `src/ui/styles/glass.css` (new) — glass surface, theme tokens scoped to `.explorer-container`, pseudo-element highlights
- `src/ui/styles/index.css` — added `glass.css` import, removed dead `shared.css` import
- `src/ui/components/actions-bar.tsx` — uses glass components directly (no middlemen)
- `src/ui/components/search.tsx` — uses `GlassItem` directly
- `src/ui/components/breadcrumbs.tsx` — uses `GlassItem` directly
- `src/ui/components/ui/action-button.tsx` → moved to `deprecated/` (reference only)
- `src/ui/components/ui/icon-button.tsx` → moved to `deprecated/` (reference only)

Details → `notes/changes/2026-02-02-glass-components.md`

---

## 2026-02-01 - Shelve Breadcrumbs & Independent Parent Button

**Task:** Gate breadcrumbs behind dev flag (commented out), give parent-folder button its own `showParentButton` plugin setting.
**Files:** `types.ts` (+showParentButton), `constants.ts` (default true), `settings-parser.ts` (parse), `settings-tab.ts` (new toggle, breadcrumbs toggle commented out), `settings-modal.ts` (breadcrumbs toggle commented out), `actions-bar.tsx` (uses showParentButton, breadcrumbs block commented out), `explorer-ui.tsx` (passes showParentButton)

## 2026-02-01 - CSS Refactor: Component-Scoped Stylesheets

**Task:** Split monolithic `styles.css` into component files in `src/ui/styles/`, bundled via esbuild.
**Files:** New `src/ui/styles/` directory with: `variables.css`, `shared.css`, `folder-buttons.css`, `note-cards.css`, `list-view.css`, `pagination.css`, `action-bar.css`, `index.css` (entry). `esbuild.config.mjs` updated to use `outdir` + CSS entry point. `styles.css` is now a build output.

---

## 2026-01-30 - Pagination Opt-Out Setting

**Task:** Add a `usePagination` setting to disable pagination and skip page slicing.
**Files:** `src/types.ts` (new setting), `src/constants.ts` (default), `src/services/settings-parser.ts` (parse/serialize), `src/ui/settings-tab.ts` (global toggle + disable page size), `src/ui/modals/settings-modal.ts` (per-block toggle + disable page size), `src/ui/hooks/use-explorer-state.ts` (skip pagination when disabled)

---

## 2026-01-29 - Breadcrumbs Redesign (Inline in Actions Bar)

**Task:** Redesign breadcrumbs to be compact/muted and live inside the actions bar.
**Files:** `breadcrumbs.tsx` (redesigned — path trimming, smaller font, muted colors), `actions-bar.tsx` (added `showBreadcrumbs` prop), `explorer-ui.tsx` (removed standalone breadcrumbs), `styles.css` (breadcrumbs CSS overhaul)
Behind `USE_BREADCRUMBS` dev flag (default `false`). Hidden on mobile and during search. Deep paths trimmed: Home > ... > Parent > Current.

---

## 2026-01-29 - Component Refactoring (Atomic UI)

**Task:** Extract reusable atomic components from scattered UI patterns; unify CSS.
**Files:**
- `src/ui/components/ui/icon-button.tsx` (new) — neutral clickable icon (no glass, inherits Obsidian hover)
- `src/ui/components/ui/action-button.tsx` (new) — ActionButton (single glass circle) + ActionGroup (glass container for multiple)
- `src/ui/components/ui/badge.tsx` (new) — unified ext-tag, ext-tag-bg, pin-icon
- `src/ui/components/ui/layout.tsx` (new) — Group, Stack, Separator, Divider
- `src/ui/components/actions-bar.tsx` — uses IconButton, ButtonGroup, Group, Separator
- `src/ui/components/search.tsx` — uses IconButton, Group
- `src/ui/components/list-view.tsx` — uses Badge, Group (kills inline styles)
- `src/ui/components/cards-view.tsx` — uses Badge
- `src/ui/components/pagination.tsx` — uses Group (kills inline styles)
- `src/ui/explorer-ui.tsx` — uses Divider
- `styles.css` — purged utilities (.flex, .gap-2, .justify-between, .br-md), old icon classes (.action-icon, .action-icons, .pin-icon, .ext-tag), legacy search CSS, dead .glass-btn. Added component CSS sections.

Details → `notes/changes/2026-01-29-component-refactoring.md`

---

## 2026-01-29 - Notes Framework

**Task:** Set up `notes/` as a structured knowledge base for humans and agents.
**Files:** `notes/skill.md` (new), `notes/architecture.md` (new), `notes/changes/*.md` (new), `changelog.md` (slimmed)
Deleted stale files (`DEV.md`, empty `agent/`, `tasks/`, `changelog/` subfolder). Split architecture/gotchas out of changelog into dedicated docs. Added workflow protocol in `skill.md`.

---

## 2026-01-29 - CSS Cleanup

**Task:** Organize scattered CSS rules, remove dead classes.
**Files:** `styles.css`
Removed: `.explorer-actions-wrap`, `.explorer-search-row/col`, `.clickable-muted`, `.search-input` standalone, empty hover rules. Reorganized into labeled sections (Navigation, Actions Bar, Inline Search, Legacy Search Bar).

---

## 2026-01-29 - Inline Search in Actions Bar

**Task:** Move search into the actions bar as a self-contained `Search` component.
**Files:** `search.tsx` (new), `actions-bar.tsx`, `explorer-ui.tsx`, `styles.css`
Search button and input/cancel now live inside ActionsBar. Legacy `search-bar.tsx` kept for rollback.
Details → `notes/changes/2026-01-29-inline-search.md`

---

## 2026-01-29 - Search Performance Fix

**Task:** Fix search input delay (~350ms) and optimize search pipeline.
**Files:** `use-explorer-state.ts`, `file-utils.ts`, `search-bar.tsx`
Single 80ms debounce, TFile[] pipeline (no eager FileInfo mapping), cache kept on close.
Details → `notes/changes/2026-01-29-search-pipeline.md`

---

## 2026-01-29 - Search State Separation

**Task:** Separate normal view and search state completely.
**Files:** `use-explorer-state.ts`
Independent data paths and pagination for normal view vs search. Instant exit.
Details → `notes/changes/2026-01-29-search-pipeline.md`

---

## 2025-01-27 - Simplify Refactor

**Task:** Consolidate scattered React state, eliminate dead code, improve DX.
**Files:** `use-explorer-state.ts` (new), `vault-actions.ts` (new), deleted 5 files
Merged 2 hooks into 1, added file filtering, BFS search traversal.
Details → `notes/changes/2025-01-27-claude-simplify-refactor.md`
