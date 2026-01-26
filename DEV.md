# Explorer plugin developer guide

This plugin renders a custom explorer UI inside an Obsidian markdown code block:

````
```explorer
... optional per-block overrides ...
````



It uses a React UI, but keeps data/Obsidian operations inside a view class.

## Quick map

- Entry point
  - `main.ts` registers the `explorer` code block and wires plugin settings.

- UI view (state + data flow)
  - `src/ui/explorer-view.tsx` owns state, indexes files, filters/sorts, and renders React UI.
  - `src/ui/explorer-ui.tsx` is the top-level React layout, composed from smaller components.

- React components
- `src/ui/components/*.tsx`
    - `breadcrumbs.tsx`, `search-bar.tsx`, `pagination.tsx`, `cards-view.tsx`, `list-view.tsx`, `folder-buttons.tsx`
    - `shared.tsx` contains `InternalLink` (Obsidian-safe link) and `Icon` helpers.

- Services / data
  - `src/services/folder-index.ts` builds the folder/file index and supports nested depth.
  - `src/services/settings-parser.ts` parses/serializes code block settings.

- Utilities
  - `src/utils/file-utils.ts`, `src/utils/helpers.ts`, `src/utils/link-utils.ts`

- Settings UI
  - `src/ui/settings-tab.ts` is the plugin settings tab (global defaults).
  - `src/ui/modals/settings-modal.ts` is the per-block settings modal.

- Styling
  - `styles.css`

## Runtime flow

1) `main.ts` loads saved plugin defaults, registers `ExplorerSettingsTab`, and registers the `explorer` code block.
2) On render, code block settings are parsed and merged over plugin defaults.
3) `ExplorerView.render()`:
   - finds the active file and parent folder
   - builds a `FolderIndex` for the folder
   - derives filtered/sorted/paged file lists
   - renders the React UI into the code block container
4) UI actions call back into `ExplorerView` to update state and re-render.

## Key data flow

- Per-block overrides: `src/services/settings-parser.ts`
- Default settings: `DEFAULT_SETTINGS` in `src/constants.ts`
- Merge order: plugin defaults -> code block overrides

## Settings

There are two layers:

- Global defaults (Obsidian Settings → plugin tab): `src/ui/settings-tab.ts`
- Per-block overrides (code block or modal): `src/services/settings-parser.ts` and `src/ui/modals/settings-modal.ts`

The per-block modal updates the source markdown block via `ExplorerView.updateSourceBlock()`.

## React UI notes

- React owns the DOM inside the code block container.
- `ExplorerView` keeps state and passes data + callbacks as props.
- Obsidian icons are rendered via `Icon` in `src/ui/components/shared.tsx`.
- Obsidian internal links must use `InternalLink` to preserve correct behavior.

## Folder indexing

- `FolderIndex.loadImmediate()` indexes direct children.
- `FolderIndex.loadToDepth()` pulls nested files into `nestedFiles`.
- `getFilesToDisplay()` switches between immediate or nested based on `settings.depth`.

## Search

- Search is local and filters the current file list.
- The search bar is toggled from the top actions bar and is always available.
- Special prefixes:
  - `#tag` searches tags
  - `@folder` searches folder notes

## Prompt flows

- New folder: `ExplorerView.promptNewFolder()`
  - ensures folder exists
  - creates folder note if missing
  - opens the folder note
- New note: `ExplorerView.createNewNote()`

## Build

- `npm run build` -> `tsc` (type check) then `esbuild` bundle
- `esbuild.config.mjs` bundles `main.ts` to `main.js`

## Where to change things

- UI layout / visuals: `src/ui/explorer-ui.tsx` and `src/ui/components/*.tsx`
- Data rules (sorting/filtering/paging): `src/ui/explorer-view.tsx`
- Folder indexing: `src/services/folder-index.ts`
- Settings parsing: `src/services/settings-parser.ts`
- Styling: `styles.css`

## Common modifications

- Add a new setting:
  1) Update `ExplorerSettings` in `src/types.ts`
  2) Add default in `src/constants.ts`
  3) Add parse/serialize in `src/services/settings-parser.ts`
  4) Add UI to `src/ui/settings-tab.ts` and/or `src/ui/modals/settings-modal.ts`
  5) Use it in `ExplorerView` or components

- Add new UI component:
  - Create a new `src/ui/components/*.tsx` file and import it in `src/ui/explorer-ui.tsx`.

## Gotchas

- React owns the container; don’t call `container.createEl` from elsewhere.
- `InternalLink` is required for proper Obsidian link behavior and context menus.
