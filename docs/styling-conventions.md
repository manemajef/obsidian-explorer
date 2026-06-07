# Styling conventions

The UI CSS is organized by ownership. A selector should make it obvious which
component owns the rule and which states are supported.

## File ownership

`src/ui/styles/index.css` imports styles in this order:

1. `tokens.css`: plugin-level spacing, radius, color, motion, and theme tokens.
2. `host.css`: Obsidian integration, host/container behavior, and global
   compatibility rules.
3. `primitives/`: reusable primitive implementations such as surface, layout,
   text, badge, tags, link, and icon.
4. `components/` and component CSS files: feature components such as note rows,
   cards, folders, pagination, search, and modals.
5. `features/`: page or integration surfaces such as virtual folder notes.

Do not put new unrelated rules into a catch-all file. If a rule has multiple
owners, split the rule or move the shared behavior into a primitive.

## Naming

Use component-owned class names:

```css
.explorer-note-row {}
.explorer-note-row__title {}
.explorer-note-row__metadata {}
```

Avoid broad or ambiguous names:

```css
.title {}
.item {}
.pin {}
```

## State

Use `data-*` attributes for component state and layout state:

```tsx
<div className="explorer-note-row" data-layout="desktop" data-pinned={pinned} />
```

```css
.explorer-note-row[data-layout="desktop"] {}
.explorer-note-row[data-pinned="true"] {}
```

Do not add new state through arbitrary modifier class combinations unless the
state is already part of a stable component API.

## Boundaries

Parent components must not style child component internals. For example,
`ListView` should not target `.tag`, `.pin`, `.internal-link`, or child SVGs.
If a parent needs a different child presentation, expose an explicit prop on the
child component, such as `size`, `variant`, `tone`, `overflow`, or `placement`.

Allowed:

```tsx
<Pin placement="row-leading" size="sm" />
<TagList overflow="hidden" size="sm" />
```

Avoid:

```css
.explorer-modern-list .pin svg {}
.explorer-card .tags-container .tag {}
```

## Theme and mobile rules

Theme and mobile selectors should set tokens at a boundary whenever possible.
Component files should consume those tokens instead of duplicating theme/mobile
branches.

Allowed:

```css
.theme-dark .explorer-container {
  --explorer-surface-bg: var(--background-primary-alt);
}
```

Avoid:

```css
.theme-dark.is-mobile .explorer-container .explorer-note-row .explorer-badge {}
```

Use theme/mobile selectors inside component CSS only when the component truly
cannot express the difference with props, tokens, or container-owned state.

## Selector budget

Keep component selectors shallow. Prefer one class plus optional `data-*` state.
Descendant selectors are acceptable only within the owning component's own
elements.

Review new CSS against these checks:

- Does this selector have one clear owner?
- Is this state visible in TypeScript props or `data-*`?
- Is this rule styling another component's internals?
- Could a primitive prop or token replace this override?
