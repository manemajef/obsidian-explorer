# Explorer UI Constitution

The goal is not maximum reuse. The goal is to make future design changes
safe, predictable, and fast. When goals conflict, prefer the solution that
makes future changes easier to reason about.

## The golden rules

1. Components declare meaning (`<Card>`, `<Text role="metadata">`), CSS implements it.
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
  primitives/       Recipes (surface.css: data-surface; text.css:
                    data-role × data-emphasis) plus one file per semantic
                    component (button, toolbar, card, badge, tag, link,
                    list-row, pin, layout, icon). Own class + data-attrs
                    only.
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

- **Surfaces** (`data-surface`): `base` · `subtle` (note cards) · `raised`
  (grouped containers) · `control` (interactive card-like controls) ·
  `floating` (toolbar buttons, button groups, pagination). Never exceed 5.
  Modals/overlays are host-owned, not part of this reusable surface scale.
- **Text roles** (`data-role`): `title` · `body` · `description` ·
  `metadata` · `label`.
- **Emphasis** (`data-emphasis`): `primary` · `secondary` · `tertiary` ·
  `faint` · `accent`.
- **15% knobs**, used sparingly and visibly in markup: `weight="medium|bold"`,
  `size="md"` on description text, Button `density="compact"` /
  `fit="content"`.

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
