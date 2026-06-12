# Explorer Architecture Rules

The goal is to keep the plugin easy to change without loading the whole codebase
into your head. When in doubt, choose the option that keeps ownership obvious
from the file path.

This document is the architecture contract. Some of it is enforced by
`eslint.config.mjs`; the rest is convention.

## The Golden Rules

1. Each half of the plugin has one composition root:
   `src/explorer/runtime.tsx` for the backend and `src/ui/explorer-ui.tsx` for
   the UI.
2. The mounted UI reads data from `ExplorerModel` and calls behavior through
   `ExplorerActions`. Do not make view components reach around those contracts.
3. Backend core code is framework-free. React belongs in `src/ui/`,
   `src/explorer/runtime.tsx`, or `src/explorer/integration/`.
4. Lower backend layers do not import upward into roots or host integration.
5. Files are sorted by role, not by convenience. If a file starts doing two
   different jobs, split it.
6. Host registration lives in `integration/`. Domain decisions live below it.
7. New UI data goes into `model.ts`; new UI commands go into `actions.ts`.
8. UI structure and styling rules are governed by `STYLING.md`.

## Backend Layers

Read this top to bottom. Imports should point downward, not sideways or upward.

```txt
src/explorer/runtime.tsx
  Composition root. Owns session lifecycle, host subscriptions, model building,
  action creation, and UI mounting.

src/explorer/integration/
  Obsidian-facing registration: commands, views, host event listeners, and DOM
  hooks. This layer may touch the host and React.

src/explorer/model.ts
  Data contract the UI reads.

src/explorer/actions.ts
  Methods contract the UI calls. Keep it thin; delegate real work downward.

src/explorer/navigation/
  User-facing flows that compose lower-level operations, such as opening folder
  notes, home pages, or virtual folder notes.

src/explorer/vault/
  Vault writes: create, rename, move, and modify files or blocks.

src/explorer/data/
  Stateful runtime data: session caches, indexes, and persistent data stores.

src/explorer/lib/
src/explorer/settings/
  Dependency-light domain types, predicates, transforms, and settings logic.
  No React, no host registration, no runtime state.
```

## UI Layers

```txt
src/ui/explorer-ui.tsx
  Composition root. Chooses which rendered regions appear and passes model,
  files, actions, and context-menu wiring down.

src/ui/explorer-state.ts
  React state for the mounted UI: search, pagination, metadata refresh, and
  visible files.

src/ui/components/primitives/
  App-ignorant semantic components. They do not import explorer modules.

src/ui/components/note/
  Note-domain fragments and hooks shared by cards and lists.

src/ui/components/*.tsx
  Rendered UI regions: list, cards, folders, search, pagination, actions.

src/ui/components/interactions.ts
  Shared interaction bundles for drag/drop, context menus, and open behavior.

src/ui/modals/
  Obsidian modal implementations.
```

CSS ownership, tokens, and UI styling rules live in `STYLING.md`.

## Where Changes Go

- Pure transform, predicate, domain getter, or type helper: `src/explorer/lib/`.
- Settings schema or migration logic: `src/explorer/settings/`.
- Vault write: `src/explorer/vault/`.
- Session cache, index, or persistent data store: `src/explorer/data/`.
- User-facing flow that composes lower layers: `src/explorer/navigation/`.
- Obsidian command, view, event listener, or host DOM hook:
  `src/explorer/integration/`.
- Data the UI needs to read: add it to `ExplorerModel`.
- Behavior the UI needs to trigger: add it to `ExplorerActions`.
- Rendered UI region: `src/ui/components/*.tsx`.
- Shared note UI: `src/ui/components/note/`.
- App-ignorant UI primitive: `src/ui/components/primitives/`.

## Smells

- A view imports directly from `vault/`, `data/`, or `navigation/` instead of
  using `actions`.
- A core backend file imports React.
- A `lib/` file imports `data/`, `navigation/`, `integration/`, or `runtime`.
- A file both registers host behavior and implements domain logic.
- A UI primitive imports from `src/explorer/`.
- A change needs a clever filename because the folder does not explain the role.

## Enforced Checks

Run these before handing off code:

```sh
npm run lint
npm run lint:css
npm run build
```

`npm run lint` enforces the important architecture boundaries:

- core backend files cannot import React;
- core backend files cannot import upward into `runtime` or `integration`;
- `lib/` cannot import stateful or host-facing layers;
- UI primitives cannot import explorer modules;
- feature UI cannot use inline `style` props.
