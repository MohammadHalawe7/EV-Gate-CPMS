# CLAUDE.md — how to build on this repository

**This repository is the EV Gate Design System: a reusable UI foundation, not an application.**

It contains the complete EV Gate visual language — tokens, components, every variant and state —
lifted unchanged from EV Gate CPMS. It contains no business domain, no data layer, no product
modules. It exists so that every future EV Gate product starts from the same UI.

---

## The rule

> **Future projects built from this repository MUST reuse this Design System.**
> **Extend it only when a genuinely new reusable component is required.**

Concretely, when you are asked to build a product from a copy of this repository:

1. **Compose from what is here.** Screens are assembled from `src/components/**`. If a screen needs
   a button, a table, a dialog, a status chip — it already exists. Import it.
2. **Never restyle in a product file.** No new hex values, no new radii, no new shadows, no
   `style={{ }}` colour overrides, no one-off Tailwind classes that re-do what a token already
   expresses. If something looks wrong, the fix belongs in the component or the token, not in the
   screen.
3. **Extend only for a genuinely new, reusable pattern.** "This screen needs a stepper and no
   stepper exists" is a reason to add `src/components/ui/Stepper.tsx`. "This screen wants a
   slightly different card" is not — use `Panel`.
4. **When you do extend, extend properly.** See *Adding a component* below. A component that is
   not in the catalogue does not exist as far as the next project is concerned.
5. **Do not fork the foundation into the product.** Keep `src/components/**`, `src/index.css`,
   `src/design-system/**` and `src/i18n/index.tsx` recognisably the same files, so improvements can
   be carried back and forth between products.

---

## The workflow this repository is built for

```
EV Gate Design System   (this repository — never built on directly)
  └─ copy the folder
     └─ rename it and rename `name` in package.json
        └─ give Claude the new business requirements
           └─ build the product on top of this foundation
```

When you are dropped into a **copy** of this repository with product requirements:

1. Read this file and `DESIGN_SYSTEM.md` first.
2. Open `/design-system` and look at what already exists before writing any UI.
3. Add the product's own layers — and only these:
   - `src/domain/` — types, enums, permissions
   - `src/data/` — store, mock or real services
   - `src/app/` — session, navigation config, guards, router
   - `src/modules/` — one folder per business module
4. Wire the shell: build a `NavGroup[]` for `<AppShell groups={…}>` and render `<Topbar>` through
   its `topbar` render prop.
5. Add product strings as new keys in `src/i18n/en.ts` **and** `src/i18n/ar.ts`. The Arabic file is
   typed as `Record<TranslationKey, string>`, so a missing translation is a build error rather than
   a silent English fallback.
6. Leave `/design-system` in place and working. It is the source of truth, and it is how the next
   person checks whether a pattern already exists.

---

## What is in here

```
src/
├── index.css                 tokens (@theme) + base + eg-* primitives  ← the source of truth
├── design-system/            the /design-system catalogue and typed tokens
│   ├── tokens.ts             typed mirror of @theme, for docs and Figma export
│   ├── DesignSystemPage.tsx  the page — 42 sections
│   ├── Specimen.tsx          catalogue chrome
│   └── sections/             Foundations · Forms · Feedback · DataDisplay · Navigation
├── components/
│   ├── ui/                   Button · Field (Input, Textarea, Select, SearchInput, Checkbox,
│   │                         Radio, Switch, SegmentedControl) · Badge · Surface · Overlay ·
│   │                         Menu · Tabs · Toast · DataTable · StatTile · Tooltip · Alert ·
│   │                         Accordion · Breadcrumbs · Autocomplete · DatePicker · Upload · States
│   ├── charts/               SVG chart kit + the CVD-validated palette
│   ├── common/               filters, CSV export, money / energy / power cells
│   └── layout/               AppShell · Sidebar · Topbar · PageHeader · Brand
├── i18n/                     en · ar · provider (RTL, chrome vocabulary only)
├── lib/utils.ts              cx, formatters, dates, CSV
└── App.tsx                   providers + the single catalogue route
```

Everything above is deliberate and load-bearing. The things that are *absent* are equally
deliberate: no `domain/`, no `data/`, no `modules/`, no session or permissions, no seeded database.

---

## Adding a component

Only when no existing component can express the pattern, and the pattern will recur.

1. Create it in `src/components/ui/` and build it **from existing tokens** — the ink ramp for
   neutrals, `brand-*` for identity, the four feedback ramps, the four control heights, the radius
   ladder. If you find yourself typing a hex value, stop.
2. Match the prop conventions: `variant` (visual intent), `tone` (semantic colour), `size`
   (`xs`/`sm`/`md`/`lg`), `label` (required on icon-only controls), `hint`, `on<Event>`.
3. If it has `hover:` or `active:` styling, add the literal unprefixed counterpart beside it and
   expose it through a `state` prop — the way `Button` and the form controls do. This is what keeps
   the catalogue capturable into Figma.
4. Use logical properties only: `ps`/`pe`, `ms`/`me`, `start`/`end`, `text-start`/`text-end`.
   Add `dir="auto"` to anything that can mix Arabic prose with Latin identifiers or figures.
5. Add a `Section` to the matching file in `src/design-system/sections/`, register its id in
   `INDEX` in `DesignSystemPage.tsx`, and show **every** variant and state.
6. Run `npm run typecheck` and `npm run build`, then check it in the catalogue's RTL section.

## Changing a token

1. Edit `src/index.css` (`@theme`).
2. Edit `src/design-system/tokens.ts` to match — it is a hand-maintained mirror, not generated.
3. `npm run tokens:export` to regenerate `design-tokens.json`.
4. `npm run build`.

A token change affects every EV Gate product. Treat it as a brand decision, not a styling tweak.

---

## Non-negotiables

- **Light theme only.** There is no dark mode and adding one is a design decision, not a task.
- **One container.** `Panel` — white, 1px `ink-200`, 10px radius, no shadow. Never nest cards.
- **Elevation is rare.** Shadows are for things that float: menus, popovers, dialogs, drawers,
  toasts, tooltips. Nothing else.
- **Saffron is a highlight, not a surface.** `accent-*` appears on a few accent buttons, the
  Reserved status and one chart slot.
- **One primary button per screen.**
- **Colour never carries meaning alone.** Status badges show a dot and a label; charts ship a
  legend.
- **Numbers are tabular.** Anything that can change uses `tnum` and is right-aligned in a table.
- **Every list has three states.** Empty, loading, error — all three exist in `States.tsx` and
  `Surface.tsx`; use them.
- **RTL is not optional.** Arabic is a first-class direction, not a translation layer.

`DESIGN_SYSTEM.md` is the full reference: every token, every component, every variant and state,
the usage rules, the RTL rules and the naming conventions.
