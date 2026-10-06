# EV Gate Design System

The live catalogue is at **`/design-system`** (`http://localhost:5173/design-system`).

Every specimen on that page renders the *actual* component from `src/components/**`. There is no
parallel set of design-system styles: change a button and the catalogue changes with it. This
document explains the tokens behind those components, the variants and states each one exposes,
and the rules that keep every EV Gate product coherent.

This repository is a **UI foundation, not an application**. It carries no business domain, no data
layer and no product modules. For how to build a product on top of it, read **`CLAUDE.md`**.

---

## Contents

1. [Where things live](#1-where-things-live)
2. [Tokens](#2-tokens)
3. [Components](#3-components)
4. [States](#4-states)
5. [Usage rules](#5-usage-rules)
6. [RTL considerations](#6-rtl-considerations)
7. [Naming conventions](#7-naming-conventions)
8. [Extending the system](#8-extending-the-system)

---

## 1. Where things live

```
src/
├── index.css                       ← the source of truth for tokens (Tailwind 4 @theme)
├── App.tsx                         ← providers + the single catalogue route
├── design-system/
│   ├── tokens.ts                   ← typed mirror of @theme, for docs + Figma export
│   ├── DesignSystemPage.tsx        ← the /design-system route
│   ├── Specimen.tsx                ← catalogue chrome (Section, Specimen, Swatch, Frame …)
│   └── sections/                   ← Foundations · Forms · Feedback · DataDisplay · Navigation
├── components/
│   ├── ui/                         ← the component library
│   ├── charts/                     ← SVG chart kit + validated palette
│   ├── common/                     ← filters, exports, money/energy cells
│   └── layout/                     ← AppShell, Sidebar, Topbar, PageHeader, Brand
├── i18n/                           ← en · ar · provider (chrome vocabulary only)
└── lib/utils.ts                    ← cx, formatters, dates, CSV
CLAUDE.md                           ← the rules for building a product on this foundation
design-tokens.json                  ← generated: npm run tokens:export
scripts/export-tokens.mjs
```

A product adds `src/domain/`, `src/data/`, `src/app/` and `src/modules/` beside these. Nothing in
the list above should be forked into a product — see `CLAUDE.md`.

**Two representations of one truth.** Tailwind resolves `bg-brand-900` from the CSS custom
property `--color-brand-900` declared in `src/index.css`. `src/design-system/tokens.ts` restates
those values as typed data so documentation, the catalogue and `design-tokens.json` can read
them. If you change a colour, change it in `index.css` **and** `tokens.ts`, then run
`npm run tokens:export`.

---

## 2. Tokens

### 2.1 Colour

| Ramp | Range | Role |
|---|---|---|
| `brand` | 50 → 950 | EV Gate purple, from `#2A0944`. Identity, primary actions, active navigation, links, selection. |
| `accent` | 50 → 900 | Saffron mango, from `#F9BF58`. A highlight, never a surface. |
| `plum` | 50 → 900 | Third brand hue. Refunds and roaming. |
| `ink` | 50 → 900 | The cool neutral that carries the whole interface. |
| `success` `warning` `danger` `info` | 50 · 100 · 500 · 700 | Feedback. 50/100 for surfaces and rings, 500 for icons and fills, 700 for text on the tint. |
| `status-*` | single values | Operational OCPP connector states. Reserved — never reused as a chart series. |

The steps that carry most of the product:

| Token | Value | Used for |
|---|---|---|
| `brand-900` | `#2a0944` | Primary button, logo, pagination current page |
| `brand-800` | `#3b185f` | Primary hover, active tab underline, active nav icon |
| `brand-50` | `#f7f4fa` | Active nav background, selected row, subtle button |
| `accent-400` | `#f9bf58` | Accent button, Reserved status |
| `accent-600` | `#dc8710` | Chart series 2 (the accessible saffron for data) |
| `white` | `#ffffff` | Panels, tables, dialogs, sidebar, topbar |
| `ink-50` | `#f8f9fb` | Page background, table header strip |
| `ink-200` | `#e5e8ef` | **The** border colour — every panel, table and divider |
| `ink-300` | `#d2d7e2` | Control border |
| `ink-400` | `#a0a7bb` | Placeholders, icons at rest |
| `ink-500` | `#737c94` | Muted text, column headers |
| `ink-800` | `#2b3145` | Body text |
| `ink-900` | `#191e2e` | Headings, key values, tooltip surface |

**Operational status colours**

`available #12a150` · `preparing #0ea5e9` · `charging #2563eb` · `suspended #f59e0b` ·
`finishing #6366f1` · `reserved #f2a626` · `faulted #dc2626` · `unavailable #64748b` ·
`offline #94a3b8`

**Chart palette** (`src/components/charts/palette.ts`) is a fixed six-slot categorical scale —
`#6B3FA0 #DC8710 #1BAF7A #2A78D6 #C02A6E #008300` — validated for colour-vision-deficiency
separation, chroma and lightness on the white chart surface, both adjacent *and* all-pairs. Slots
are assigned in order and never cycled. Two slots sit just under 3:1 contrast, so every chart that
uses them ships a legend and visible values.

### 2.2 Typography

| Family | Stack | Use |
|---|---|---|
| `--font-sans` | Avenir LT Std → Avenir Next → Nunito Sans → system | Latin |
| `--font-arabic` | HONOR Sans Arabic → IBM Plex Sans Arabic → Noto Sans Arabic | Arabic (applied by `html[dir='rtl'] body`) |
| `--font-mono` | JetBrains Mono → system mono | Identifiers, OCPP payloads |

Sizes are explicit pixel values rather than a t-shirt scale — a control management system is dense,
and 12–13px with generous line height reads better in tables than a rounded scale would.

| Role | Classes | Size / weight |
|---|---|---|
| Page title | `text-[20px] font-semibold tracking-[-0.015em] text-ink-900` | 20 / 600 |
| Dialog title | `text-[15px] font-semibold text-ink-900` | 15 / 600 |
| Section title | `text-[14px] font-semibold text-ink-900` | 14 / 600 |
| Metric | `tnum text-[24px] font-semibold tracking-tight` | 24 / 600 |
| Body | `text-[13px] text-ink-700` | 13 / 400 |
| Body strong | `text-[13px] font-medium text-ink-900` | 13 / 500 |
| Label | `text-[12.5px] font-medium text-ink-700` | 12.5 / 500 |
| Caption | `text-[12px] text-ink-500` | 12 / 400 |
| Overline | `text-[11.5px] font-semibold uppercase tracking-wide text-ink-500` | 11.5 / 600 |
| Nav group | `text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-400` | 10.5 / 600 |
| Micro | `text-[11px] text-ink-400` | 11 / 400 |

`table` and `.tnum` set `font-variant-numeric: tabular-nums`, so columns of figures always align.

### 2.3 Spacing

A 4px base scale. Only these steps are used:

| Step | Value | Role |
|---|---|---|
| 1 | 4px | Icon ↔ adjacent glyph |
| 1.5 | 6px | Badge dot gap |
| 2 | 8px | Button group gap, toolbar gap |
| 2.5 | 10px | Sidebar nav icon ↔ label |
| 3 / 3.5 | 12 / 14px | Table cell padding (x) |
| 4 | 16px | Panel padding, grid gutter |
| 5 | 20px | Page header bottom margin, dialog padding (x) |
| 6 | 24px | Section separation inside a page |
| 8 | 32px | Long-form section separation |
| 16 | 64px | Empty state vertical padding |

### 2.4 Radius

Corners get rounder as surfaces get larger.

| Token | Value | Role |
|---|---|---|
| `--radius-xs` | 4px | Checkbox, legend swatch |
| `--radius-sm` | 6px | xs/sm buttons, menu items, pagination |
| — | 7px | **Control radius** — inputs, selects, md buttons, icon buttons |
| `--radius-md` | 8px | Segmented control, topbar search |
| `--radius-lg` | 10px | Panels, cards, tables, menus, toasts |
| — | 12px | Modal panel |
| `--radius-xl` | 14px | Reserved for large surfaces |
| `rounded-full` | 9999px | Badges, dots, progress bars, avatars |

### 2.5 Shadows

Elevation is rare on purpose — panels are separated by a 1px `ink-200` border, not a shadow.

| Token | Role |
|---|---|
| *(none)* | The default for panels, cards and tables |
| `shadow-[0_1px_2px_rgba(25,30,46,0.08)]` | Primary button, active segmented option |
| `--shadow-panel` | Optional lift for a floating summary card |
| `--shadow-raised` | Hover lift, map popups |
| `--shadow-overlay` | Modal, drawer, menu, popover, toast, tooltip |

### 2.6 Breakpoints

| Name | Value | What changes |
|---|---|---|
| `sm` | 640px | Dialogs stop being full-bleed; 2-column detail lists |
| `md` | 768px | Topbar search appears; filter bars go inline |
| `lg` | 1024px | Sidebar becomes persistent (below: a drawer) |
| `xl` | 1280px | 4-column KPI grids; the catalogue's section index appears |
| `2xl` | 1536px | Widest content rhythm |

### 2.7 Component sizes

| Size | Height | Padding (x) | Font | Radius | Use |
|---|---|---|---|---|---|
| `xs` | 28px | 8px | 12px | 6px | Inline row actions |
| `sm` | 32px | 10px | 13px | 6px | Table toolbars, filter bars, dialog footers |
| `md` | 36px | 14px | 13px | 7px | **Default** — forms, page header actions |
| `lg` | 44px | 20px | 14px | 8px | One prominent action (sign in) |

Icons render at 12 / 14 / 16 / 18 / 20px. Layout: sidebar 236px (62px collapsed), topbar 56px,
drawers 420 / 560 / 720 / 920px, modals 448 / 512 / 672 / 896 / 1152px.

### 2.8 Motion

100ms for colour transitions, 150–180ms for transforms, 240ms for the drawer, easing
`cubic-bezier(0.16, 1, 0.3, 1)`. Everything collapses to ~0 under `prefers-reduced-motion`.

---

## 3. Components

### Controls — `src/components/ui/`

| Component | File | Variants | Notes |
|---|---|---|---|
| `Button` | `Button.tsx` | `primary` `secondary` `ghost` `subtle` `accent` `danger` × `xs` `sm` `md` `lg` | `icon`, `iconEnd`, `loading`, `fullWidth`, `state` |
| `LinkButton` | `Button.tsx` | same | A `Button` that navigates |
| `IconButton` | `Button.tsx` | same variants, square | `label` is **required** — it is the accessible name and the tooltip |
| `Spinner` | `Button.tsx` | — | Also used standalone |
| `Field` | `Field.tsx` | — | Label + required marker + hint **or** error |
| `Input` | `Field.tsx` | `invalid`, `state` | 36px, shared control skin |
| `Textarea` | `Field.tsx` | `invalid`, `state` | 3 rows, resize-y only |
| `Select` | `Field.tsx` | `state` | Native select, chevron as a background image, mirrored in RTL |
| `SearchInput` | `Field.tsx` | `state` | Leading magnifier, trailing clear |
| `Checkbox` | `Field.tsx` | `indeterminate` | Native, tinted with `accent-color` |
| `Radio` / `RadioGroup` | `Field.tsx` | `vertical` `horizontal` | Five options or fewer |
| `Switch` | `Field.tsx` | — | Commits immediately |
| `SegmentedControl` | `Field.tsx` | `sm` `md` | 2–4 mutually exclusive views |
| `Autocomplete` | `Autocomplete.tsx` | `invalid`, `state`, `openPanel` | Type-ahead single select |
| `DateInput` / `DateRangeInput` | `DatePicker.tsx` | `invalid`, `readOnly`, `state` | Skinned native date control |
| `CalendarPanel` | `DatePicker.tsx` | single, range, `disabledBefore` | Inline month grid |
| `FileUpload` | `Upload.tsx` | `idle` `dragging` `uploading` `complete` `error` | Dashed dropzone |
| `ImageUpload` | `Upload.tsx` | empty, filled, disabled | Square asset picker |

### Feedback

| Component | File | Variants |
|---|---|---|
| `Badge` | `Badge.tsx` | 9 tones × `sm` `md`, `dot`, `pulse` |
| `StatusBadge` / `statusTone` | `Badge.tsx` | Any status string → tone, via one shared map |
| `SeverityDot` | `Badge.tsx` | Critical · Major · Minor · Info |
| `Tooltip` / `TooltipBubble` | `Tooltip.tsx` | `top` `bottom` `start` `end`, `open` |
| `Alert` | `Alert.tsx` | `info` `success` `warning` `danger` `neutral`, `compact`, `onDismiss`, `action` |
| `ToastCard` / `ToastProvider` / `useToast` | `Toast.tsx` | `success` `error` `info` `warning` |
| `Modal` / `DialogSurface` | `Overlay.tsx` | `sm` `md` `lg` `xl` `full` |
| `Drawer` / `DrawerSurface` | `Overlay.tsx` | `sm` `md` `lg` `xl` |
| `ConfirmDialog` | `Overlay.tsx` | `danger` `primary` `accent` |
| `EmptyState` | `Surface.tsx` | default, `compact` |
| `LoadingState` / `TableSkeleton` / `StatSkeleton` | `States.tsx` | — |
| `ErrorState` | `States.tsx` | `generic` `offline` `forbidden` |

`DialogSurface` and `DrawerSurface` are the chrome without the portal and the backdrop. `Modal`
and `Drawer` compose them — which is also how the catalogue shows a dialog inline without
covering the page.

### Data display

| Component | File | Notes |
|---|---|---|
| `Panel` / `PanelHeader` / `Divider` / `DetailList` | `Surface.tsx` | The only container in the product |
| `Skeleton` / `Avatar` / `ProgressBar` | `Surface.tsx` | |
| `StatTile` | `StatTile.tsx` | KPI tile; 7 accents; `invertDelta`; `to` makes it a link |
| `DataTable` / `Column<T>` | `DataTable.tsx` | Search, sort, selection, pagination, `dense`, `maxHeight`, `rowClassName` |
| `Money` `Energy` `Power` `MutedText` `RecordLink` `KeyValueGrid` `TotalsRow` | `common/index.tsx` | Shared cell renderers |
| `useFilters` / `FilterBar` / `FilterCount` / `ExportButton` | `common/index.tsx` | Filter bar state and chrome |
| `LineAreaChart` `BarChart` `BarList` `DonutChart` `Sparkline` `HeatmapGrid` `Gauge` `Legend` | `charts/index.tsx` | Hand-rolled SVG, no charting library |

### Navigation & shell

| Component | File | Notes |
|---|---|---|
| `Tabs` / `NavTabs` | `Tabs.tsx` | Underline tabs; `NavTabs` items are routes |
| `Accordion` | `Accordion.tsx` | `multiple`, `defaultOpen` |
| `Breadcrumbs` | `Breadcrumbs.tsx` | Also used by `PageHeader` |
| `Menu` / `Popover` | `Menu.tsx` | Portal-mounted, RTL-aware, flips up when short of room |
| `PageHeader` / `MetaItem` | `layout/PageHeader.tsx` | Crumbs, title, description, meta, actions, tabs |
| `AppShell` | `layout/AppShell.tsx` | Rail + drawer + sticky header + 1600px content column. Takes `groups` and a `topbar` render prop. |
| `Sidebar` / `SidebarFooter` | `layout/Sidebar.tsx` | 236px / 62px rail. Navigation arrives as `NavGroup[]` props. |
| `Topbar` | `layout/Topbar.tsx` | Start slot, search, live clock, language toggle, notification popover, account menu — all props. |
| `EvGateLogo` / `BrandLockup` | `layout/Brand.tsx` | CSS mask, so the mark inherits `currentColor`. `suffix` is the product name. |

The shell is the one place the foundation differs from EV Gate CPMS: styling is identical to the
pixel, but content arrives as props instead of being read from a product store, so a product wires
its own navigation without editing these files.

---

## 4. States

Every interactive component exposes the same vocabulary.

| State | How it is produced | How the catalogue shows it |
|---|---|---|
| default | — | rendered |
| hover | `hover:` utilities | `state="hover"` renders the same classes without the prefix |
| active | `active:` utilities | `state="active"` |
| focus | global `:focus-visible` (2px `brand-500`, 2px offset) + control ring | `state="focus"` on inputs |
| disabled | `disabled:` utilities + `disabled` attribute | rendered |
| loading | `loading` prop → `Spinner`, control disabled | rendered |
| error / invalid | `invalid` prop + `Field error` | rendered |
| read-only | `readOnly` + `bg-ink-50 text-ink-600` | rendered |
| selected | `bg-brand-50/60` on a table row | rendered |
| indeterminate | `Checkbox indeterminate` | rendered |

The `state` prop exists **for the catalogue** — it is additive, optional and never used by
application screens, but it means no hover state is hidden from a screen capture. Its class
strings are written out literally next to the `hover:`/`active:` versions inside the component,
so the two cannot drift and Tailwind can extract both.

### EV charging states

The status vocabulary is OCPP's, mapped once in `STATUS_TONES` (`Badge.tsx`) and read by badges,
the map, the charts and the dashboard alike:

- **Connector** — Available · Preparing · Charging · SuspendedEV · SuspendedEVSE · Finishing · Reserved · Unavailable · Faulted
- **Charge point** — Online · Offline · Maintenance · Provisioning
- **Entity** — Active · Inactive · Suspended · Draft · Archived · Blocked · Invited · Frozen
- **Session** — Starting · Charging · Suspended · Stopping · Completed · Failed
- **Transaction / payment** — InProgress · Completed · PendingSettlement · Authorized · Captured · Settled · Refunded · PartiallyRefunded · Disputed · Voided · Failed
- **Invoice / settlement** — Draft · Issued · Paid · Overdue · Void · Pending · Approved · Processing · Processed · OnHold
- **Reservation / authorisation** — Active · Used · Expired · Cancelled · Rejected · Accepted · Invalid
- **Alert / ticket / command** — Open · Acknowledged · Resolved · Suppressed · Scheduled · AwaitingParts · Closed · Queued · Sent · TimedOut
- **Firmware / diagnostics** — Idle · Downloading · Downloaded · Installing · Installed · DownloadFailed · InstallationFailed · Uploading · Uploaded · UploadFailed
- **Health / severity** — Operational · Degraded · Down · Critical · Major · Minor · Info

A status not in the map falls back to the neutral tone rather than throwing, so a new OCPP value
degrades gracefully.

---

## 5. Usage rules

**Containers.** There is one container: `Panel`. White, 1px `ink-200`, 10px radius, 16px padding,
no shadow. Do not nest a card inside a card — separate with space, or with `Divider`.

**Elevation.** If it does not float above the page, it has no shadow.

**Buttons.** One `primary` per screen. Destructive actions are `danger` and live at the end of a
menu, behind a separator, or in a `ConfirmDialog`. In a footer the primary action is last (it is
the end-most position in both directions).

**Colour as meaning.** Colour never carries information alone. Status badges always show a dot
*and* a label; charts always ship a legend and, where contrast is tight, visible values.

**Saffron.** `accent-*` is a highlight, not a surface. It appears on a small number of accent
buttons, the Reserved status and one chart slot. Large saffron or purple fills are out of
character for this product.

**Numbers.** Anything that can change is `tnum` and right-aligned in a table. Money uses `Money`,
energy `Energy`, power `Power` — never a bare `toFixed`.

**Empty, loading, error.** Every list and panel has all three. An empty state names what would be
here and offers the action that creates it. An error state names what failed and offers a way
forward — never a bare "Something went wrong".

**Icons.** Lucide only, 1.5px stroke. `ink-400` at rest. An icon-only control must have a label.

**Toast vs Alert.** Toast = something the user just did and can forget. Alert = state that belongs
to the page and persists.

**Density.** This is an operations product. Prefer 13px body, 36px controls and 12px table padding
over generous consumer spacing.

---

## 6. RTL considerations

Arabic is a first-class direction, not a translation layer. `I18nProvider` sets
`document.documentElement.dir`, and `html[dir='rtl'] body` swaps the font family. There is no
second stylesheet.

**Rules**

1. **Logical properties only.** `ps-` / `pe-`, `ms-` / `me-`, `start-` / `end-`, `text-start` /
   `text-end`, `border-s` / `border-e`. Never `pl-`, `pr-`, `left-`, `right-`, `text-left`.
2. **`dir="auto"` on mixed content.** Any element that can contain Arabic prose next to Latin
   identifiers or figures gets `dir="auto"` so the bidi algorithm isolates it. Without it,
   `146 / 121` renders as `121 / 146` and `kWh 2,094` flips. It is already applied to: `StatTile`
   label / value / footer, `PanelHeader` title and subtitle, `DetailList` terms and definitions,
   `PageHeader` title and description, `MetaItem`, every `DataTable` `<td>`, `TotalsRow`, the
   topbar clock and the dashboard live-session line.
3. **Flip only directional icons.** Chevrons, arrows and the pagination controls use
   `rtl:rotate-180`. A bolt, a wrench or a battery never flips.
4. **Direction-aware values, not duplicated rules.** The drawer slide reads
   `--eg-slide-from`, redefined once under `html[dir='rtl']`. The `Select` chevron uses
   `rtl:bg-[position:left_0.6rem_center]`.
5. **Measure at runtime for portals.** `Menu` and `Popover` read `document.documentElement.dir`
   when computing placement, because a portal is outside the mirrored flow.
6. **Leave maps LTR.** `html[dir='rtl'] .leaflet-container { direction: ltr }` — tiles and pin
   maths are not direction-aware. Leaflet is not a dependency here; the overrides are kept in
   `index.css` so a product that adds a map inherits the same treatment.

The catalogue's **RTL mirroring** section renders the same block of components in both directions
side by side.

---

## 7. Naming conventions

**Files** — `PascalCase.tsx` for components, `camelCase.ts` for logic. One concept per file;
related primitives may share one (`Field.tsx` holds every form control).

**Components** — `PascalCase`. A wrapper that adds behaviour keeps the noun and gains a prefix
(`StatusBadge`, `SearchInput`, `LinkButton`, `IconButton`). A bare surface without its portal
gains the `Surface` suffix (`DialogSurface`, `DrawerSurface`).

**Props**

| Prop | Meaning |
|---|---|
| `variant` | Visual intent — `primary`, `danger`, … |
| `tone` | Semantic colour — `success`, `warning`, … |
| `size` | `xs` `sm` `md` `lg` |
| `state` | A pinned visual state, for the catalogue |
| `invalid` | The control is in error (`Field error` carries the message) |
| `dense` / `compact` | Reduced padding |
| `label` | Accessible name (required on icon-only controls) |
| `hint` | Helper text |
| `on<Event>` | Handler |

**CSS classes** — Tailwind utilities inline. Bespoke classes are prefixed `eg-` and live in
`@layer components` in `index.css`: `.eg-panel`, `.eg-scroll`, `.eg-logo`, `.eg-anim-fade`,
`.eg-anim-pop`, `.eg-anim-drawer`, `.eg-live-dot`, `.eg-map-pin`.

**Tokens** — `--color-{ramp}-{step}`, `--font-{role}`, `--radius-{size}`, `--shadow-{role}`. In
`tokens.ts` and `design-tokens.json` the same names appear as nested objects
(`color.brand.900`, `size.control.md.height`), which is the shape Figma Variables expect.

**Design-system ids** — kebab-case, and they are the anchors on `/design-system`
(`#status-chips`, `#kpi-cards`, `#date-pickers`).

---

## 8. Extending the system

**Adding a component**

1. Build it in `src/components/ui/` from existing tokens. If you find yourself writing a new hex
   value or a new radius, stop — either reuse a token or add one deliberately.
2. Give it `variant` / `size` / `tone` props that match the table in §7.
3. If it has hover or active styling, add the literal `state` counterpart next to it, the way
   `Button` and the form controls do.
4. Add a `Section` to the matching file in `src/design-system/sections/`, register it in `INDEX`
   in `DesignSystemPage.tsx`, and show **every** variant and state.
5. Check it in RTL — the catalogue's RTL section is the quickest way.

**Changing a token**

1. Edit `src/index.css` (`@theme`).
2. Edit `src/design-system/tokens.ts` to match.
3. `npm run tokens:export` to regenerate `design-tokens.json`.
4. `npm run build`.

**Building a product on this foundation**

Read `CLAUDE.md`. In short: compose from what is here, never restyle in a product file, and extend
only when a genuinely new reusable component is required.

**Taking it into Figma**

The page is built for capture: sections are separated by rules, specimens sit on a grid, states
are pinned rather than hover-only, and animation is limited to the pulse dot and the shimmer
skeletons. Capture at 1440px wide for the intended column rhythm. `design-tokens.json` maps onto
Figma Variables — colour ramps as colour variables, `spacing` / `radius` / `size` as numbers,
`typography.styles` as text styles.
