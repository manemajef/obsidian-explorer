# Explorer Plugin Developer Guide

Renders a folder explorer UI inside an Obsidian markdown code block.

## Structure

```
src/
├── explorer.tsx           # Entry: block renderer, vault event listeners
├── types.ts               # FileInfo, FolderInfo
│
├── settings/
│   ├── schema.ts          # Settings types, defaults, validation, UI metadata
│   └── block-parser.ts    # Parse/serialize block syntax
│
├── vault/
│   ├── folder-index.ts    # Folder traversal, file indexing
│   ├── file-listing.ts    # Sort, filter, paginate file lists
│   ├── file-utils.ts      # File metadata, pin state, RTL detection
│   └── actions.ts         # Create files/folders, update blocks
│
└── ui/
    ├── explorer-ui.tsx    # Main React component
    ├── settings-tab.ts    # Plugin settings tab
    ├── render-setting-field.ts  # Shared settings field renderer
    ├── components/        # React components
    │   ├── ui/            # Atomic: badge, action, bar, layout, pin
    │   └── *.tsx          # Feature: actions-bar, cards-view, list-view, etc.
    ├── hooks/             # React state hooks
    └── modals/            # Obsidian modals
```

## Functionality Location

| Feature | Location | Notes |
|---------|----------|-------|
| Block registration | `main.ts` | Registers `explorer` code block processor |
| Block rendering | `explorer.tsx` | Creates React root, vault listeners, settings modal |
| Folder traversal | `vault/folder-index.ts` | `FolderIndex` class, BFS with depth control |
| File visibility | `vault/folder-index.ts` | `showUnsupportedFiles` filter (plugin-level) |
| File visibility | `vault/file-listing.ts` | `onlyNotes`, exclude-self filter (block-level) |
| Sorting | `vault/file-utils.ts` | `sortFiles()` — pinned first, then by criteria |
| Search/filter | `vault/file-utils.ts` | `filterFiles()` — text, #tag, @foldernote |
| Pagination | `vault/file-listing.ts` | `computeFileListing()` slices by page |
| Pin state | `vault/file-utils.ts` | `isPinned()`, `togglePin()` via frontmatter |
| Create files | `vault/actions.ts` | `createFolderWithNote()`, `createNewNote()` |
| Update block | `vault/actions.ts` | `updateExplorerBlock()` modifies markdown |
| Settings schema | `settings/schema.ts` | All settings defined here, UI auto-generates |
| Block syntax parse | `settings/block-parser.ts` | `parseSettings()`, `serializeSettings()` |
| React state | `ui/hooks/use-explorer-state.ts` | Orchestrates pagination, search, listings |
| Search state | `ui/hooks/use-search-state.ts` | Search mode, debounce, lazy file loading |

## File Filtering Pipeline

Files pass through filters in this order:

1. **Exclusion** (`vault/folder-index.ts:shouldIncludeFile`)
   - Excludes folder notes (same name as parent folder)
   - Excludes image/data extensions: json, png, jpeg, jpg, svg, gif, webp

2. **Supported files** (`vault/folder-index.ts:getFilesToDisplay`)
   - If `showUnsupportedFiles=false`: only md, pdf, canvas, docx, pptx, xlsx, csv, txt, rtf, html, epub

3. **Block visibility** (`vault/file-listing.ts:applyBlockVisibility`)
   - Always excludes the file containing the block (self)
   - If `onlyNotes=true`: only md and pdf files pass

4. **Sorting** (`vault/file-utils.ts:sortFiles`)
   - Pinned files first (frontmatter `pin: true`)
   - Then by sortBy: newest, oldest, edited, name

5. **Search filter** (`vault/file-utils.ts:filterFiles`)
   - `#tag` — matches frontmatter tags
   - `@name` — matches folder notes only
   - Plain text — matches filename or path

6. **Pagination** (`vault/file-listing.ts:computeFileListing`)
   - Slices to current page if `usePagination=true`

## Data Flow

1. `main.ts` registers `explorer` code block processor
2. Block source parsed → `settings/block-parser.ts:parseSettings()`
3. Settings merged: plugin defaults + block overrides → `schema.ts:resolveBlockSettings()`
4. `explorer.tsx` indexes folder → `vault/folder-index.ts:FolderIndex`
5. React renders → `ui/explorer-ui.tsx` uses `hooks/use-explorer-state.ts`
6. Hook computes display list → `vault/file-listing.ts:computeFileListing()`

## Settings System

All settings defined in `settings/schema.ts:BLOCK_SETTINGS_SCHEMA`. Each setting declares:
- `kind`: boolean, number, or enum
- `defaultValue`, `blockKey` (syntax name)
- `ui`: which surfaces (plugin/block), section, order, labels

Adding a setting: add to `BLOCK_SETTINGS_SCHEMA` — UI generates automatically.

**Hardcoded dependency:** `usePagination` enables/disables `pageSize` and `paginationStyle` fields (`ui/render-setting-field.ts:34-37`).

## Patterns & Rules

**Vault isolation:** All vault read/write in `vault/`. UI never imports from `obsidian` for file operations.

**React ownership:** React owns DOM inside block container. Never use `container.createEl()` elsewhere.

**Internal links:** Use `InternalLink` component (`ui/components/shared.tsx`) for proper Obsidian link behavior and context menus.

**Settings flow:** Schema is single source of truth. Parse/serialize/validate/UI all derive from it.

**State hooks:** `use-explorer-state.ts` orchestrates, delegates to `use-search-state.ts` and `use-pagination-state.ts`.

**Modern pagination:** "Load more" accumulates page chunks with animation. Classic pagination shows single page.

## Search

- Debounced 80ms (`use-search-state.ts`)
- Lazy loads all files on first search activation
- Results sorted by last edited (hardcoded in search mode)
- Prefixes: `#tag`, `@foldernote`, plain text

## Build

```bash
npm run build    # tsc + esbuild → main.js, styles.css
```
