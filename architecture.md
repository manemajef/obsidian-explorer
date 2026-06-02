# Architecture

This plugin has two halves with the **same shape**: a clear root that wires
things together, two shared contracts that flow down, and leaf modules that are
each exactly one kind of thing. If you keep that shape, the codebase stays easy
to hold in your head. This document is the contract — some of it is enforced by
ESLint (`eslint.config.mjs`), the rest is convention.

## The mental model

Both `src/ui/` and `src/explorer/` follow the same three rules:

1. **One composition root** wires everything and is the file you read first.
2. **Two shared contracts** flow down to everyone: a **data** model and a
   **methods** model.
3. **Leaves** are sorted by role, and the role is visible from the path. A leaf
   never reaches sideways into a peer or upward into the root.

|                  | UI (`src/ui/`)                              | Backend (`src/explorer/`)                    |
| ---------------- | ------------------------------------------- | -------------------------------------------- |
| Composition root | [`explorer-ui.tsx`](src/ui/explorer-ui.tsx) | [`runtime.tsx`](src/explorer/runtime.tsx)    |
| Data contract    | `ExplorerModel` (props)                     | [`model.ts`](src/explorer/model.ts)          |
| Methods contract | `ExplorerActions`                           | [`actions.ts`](src/explorer/actions.ts)      |
| Leaves           | `components/*-view.tsx`                     | `lib/ data/ vault/ navigation/ integration/` |

The UI render path touches **only** `model` + `actions`. That is what lets you
edit `cards-view.tsx` without thinking about `list-view.tsx`.

## Backend layers (`src/explorer/`)

Read top-to-bottom; each layer may only import from layers **below** it.

```
runtime.tsx          composition root — owns the session, the refresh loop,
                     vault event subscriptions; builds the model, mounts the UI.

integration/         registered with the Obsidian host: commands, the virtual
                     folder-note view, native file-explorer hooks, the
                     reading-mode + folder-note-rename listeners. The ONLY layer
                     (besides runtime) allowed to touch React or `Plugin`.

  ── contracts ──    model.ts (data everyone reads)  ·  actions.ts (methods the
                     mounted UI calls — a thin facade over navigation/vault/lib)

navigation/          use-cases: open/create folder notes, go-to-parent,
                     homepage, "open the virtual folder view".

vault/   data/       vault/  : vault writes (move, rename, create, block-update)
                     data/   : stateful read/index runtime (session cache,
                               FolderIndex loader)

lib/                 dependency-light helpers + domain types: nodes, listing
settings/            transforms, folder-note primitives. Framework-free, no
                     host registration, callable anywhere.
```

`state.ts` used to live here — it is React hooks, so it now lives in the UI as
[`ui/explorer-state.ts`](src/ui/explorer-state.ts). **The backend has no React.**

## "Where does my change go?"

- **Pure transform / predicate / domain getter** (no state, no I/O, no host) →
  `lib/`.
- **Writes to the vault** (rename/move/create/modify) → `vault/`.
- **Caches or indexes that live for the session** → `data/`.
- **A user-facing flow that composes the above** (e.g. "open a folder note") →
  `navigation/`, then surface it on `actions.ts` if the mounted UI needs it.
- **Anything registered with Obsidian** (command, view, event listener, DOM
  hook) → `integration/`.
- **New data the UI needs to read** → add it to `model.ts`.
- **New thing the UI needs to do** → add a method to `actions.ts` (which calls
  down into `navigation`/`vault`/`lib`).

If a file would do two of these, split it — that is exactly the smell this
layout exists to prevent (it is why `listing.ts` became `lib/listing.ts` +
`data/folder-index.ts`, and why `virtual-folder-note` is split between
`navigation/` and `integration/`).

## Naming conventions

- `navigation/`, `integration/` etc. encode the role in the path — prefer that
  over clever filenames.
- UI leaf components are `*-view.tsx` and take `{ model, files, actions, … }`.
- Registration entry points are `register*(plugin, deps)` and live in
  `integration/`.

## Enforced by ESLint

These fail `npm run lint`:

- The core (`model.ts`, `actions.ts`, `lib/`, `data/`, `vault/`, `navigation/`)
  must not import `react`/`react-dom`.
- The core must not import upward into `runtime` or `integration/`.
- `lib/` must not import `data/`, `navigation/`, `runtime`, or `integration/`.

## Convention (not linted — keep it anyway)

- Only `integration/` (and `runtime.tsx`) register things with the Obsidian
  `Plugin`/host. `main.ts` stays thin: load settings, then call the
  `register*` functions.
- UI views read through `model`/`actions`; reaching directly into backend
  modules (a couple of pure predicates aside) is a smell.
- Keep `lib/` genuinely dependency-light.
