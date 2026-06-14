# Explorer UI Constitution

The goal is not maximum reuse. The goal is to make future design changes
safe, predictable, and fast. When goals conflict, prefer the solution that
makes future changes easier to reason about.

## The golden rules

1. Components declare meaning (`<Card kind="note-card">`, `<Text variant="metadata">`), CSS implements it.
2. Tokens are global and immutable — defined **only** in `tokens.css`.
3. Components may consume tokens but never redefine them.
4. Styling experiments happen in tokens or recipes first, component CSS second, overrides last.
5. Hacks live only in `fixes/*.css`, each with a comment saying what is broken and why the fix exists.
6. Components do not style other components — no `.feature-x .some-component {}`. Prefer a semantic prop over a more specific selector.
7. Shared appearance is achieved through shared tokens/recipes, not shared components.
8. Theme (`.theme-*`) and platform (`.is-mobile`) differences resolve to token **values** in `tokens.css`, or live in `fixes/` — nowhere else. (Enforced by stylelint.)
9. Do not redesign while systematizing: current visuals are the spec.

## Layers

```
src/ui/styles/
  tokens.css        Global design decisions. The only definition site for
                    --explorer-* tokens; theme/mobile value resolution here.
  primitives/       Recipes (glass.css: data-glass; text.css:
                    variant × color × size × weight × density) plus one file per semantic
                    component (button, badge, tag, link, pin, layout,
                    icon). Own class + data-attrs only. Dedicated domain
                    surfaces (NoteCard, FolderButton) and layouts (Toolbar,
                    ListRow) live inside their respective view/component files.
  components/       Stylesheets for root-level rendered UI regions in
                    src/ui/components/*.tsx, plus small domain fragments they
                    share. Layout, grids, placement. No typography, no surface
                    chrome, no theme forks.
  behaviors/        Cross-cutting DOM behavior state that is not owned by a
                    rendered component, such as drag/drop.
  modals/           Styles for src/ui/modals.
  virtual-folder-note.css
                    Host-owned rendered view that does not have a
                    src/ui/components owner.
  fixes/            Quarantined platform/host hacks. Every rule documented.

src/ui/components/
  primitives/       Semantic components — app-ignorant (ESLint-enforced:
                    no explorer/ imports). The only place the style prop
                    is allowed (layout primitives). Toolbar/ToolbarItem/
                    ToolbarGroup are deliberately separate from Button:
                    shared glass comes from tokens, not a shared component.
  note/             Note-domain fragments and hooks shared by list/cards.
  *.tsx             Feature components. Compose semantic components;
                    interactions.ts bundles drag/drop/menu/open wiring and
                    intentionally stays in this root.
```

## Vocabulary (keep it small enough to hold in your head)

- **Surfaces & Panels**: dedicated visual blocks including `NoteCard` (Obsidian Bases-style note cards), `FolderButton` (interactive card-like folder entry), and modern list container/panel styling. These are implemented directly within their respective feature files (`cards-view`, `folder-view`, `modern-list-view`) to prevent primitive file bloat.
- **Glass** (`data-glass`): floating control chrome for toolbar buttons,
  button groups, and pagination. Glass is not a container/card concept.
  It lives in `glass.css`.
- **Text variants** (`variant`): `title` · `body` · `metadata`. `metadata`
  covers small supporting text (previews, dates, folders, counts). A variant is
  the default bundle of color + size + weight + leading. Override one axis only
  when the markup needs to make a local exception visible: `color`, `weight`,
  `size`, or `density`.
- **Text color** (`color`): `normal` · `muted` · `faint` · `accent`.
  Use this instead of inventing one-off emphasis levels.
- **Density** (`density`): `tight` · `normal`, on the Text/Link element that
  needs the line-height change. Region-level density is avoided unless a whole
  component has a real semantic density mode.
- **15% knobs**, used sparingly and visibly in markup:
  `weight="light|normal|medium|semibold|bold"`,
  `size="smallest|smaller|small|text|ui-smaller|ui-small|ui-medium|ui-large"`,
  Button `density="compact"` / `fit="content"`.

Before adding a variant, ask: can an existing variant + prop solve it? Is it
a new concept or just a configuration? Will at least 3 places use it? Can the
difference be explained in one sentence?

## Workflows

**Adjusting visuals:** tokens → recipes → component CSS → override. Always
fix at the highest level that solves the problem.

**New component:** visual variation → extend an existing component;
conceptual difference → new component.

**Enforcement (run on every change):** `npm run lint` (style-prop ban,
primitives/ app-ignorance), `npm run lint:css` (theme/platform quarantine,
specificity caps), `npm run build`.

The full rationale lives in `dev/The UI Bible.md`; the old-system →
new-system value mapping in `dev/UI System/token-audit.md`.
