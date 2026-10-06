/**
 * EV Gate CPMS — centralised design tokens.
 *
 * This file is the *typed mirror* of the `@theme` block in `src/index.css`.
 * Tailwind reads the CSS custom properties; TypeScript reads this module.
 * Both must stay in step — `npm run tokens:export` regenerates
 * `design-tokens.json` from here so the values can be mapped to Figma Variables.
 *
 * Nothing in the application imports colours from here at render time: the app
 * styles through Tailwind utilities (`bg-brand-900`, `text-ink-500`, …) which
 * resolve to the very same custom properties. These objects exist so that the
 * Design System page, documentation and Figma export all read one list.
 */

/* -------------------------------------------------------------------------- */
/* Colour                                                                      */
/* -------------------------------------------------------------------------- */

export type Ramp = Record<string, string>;

export const brand: Ramp = {
  50: '#f7f4fa',
  100: '#ece5f3',
  200: '#d9cbe7',
  300: '#bda6d4',
  400: '#9878bb',
  500: '#77539f',
  600: '#5c3a83',
  700: '#472a6b',
  800: '#3b185f',
  900: '#2a0944',
  950: '#1a0529',
};

export const accent: Ramp = {
  50: '#fefaf0',
  100: '#fdf2d8',
  200: '#fce3ab',
  300: '#fad07b',
  400: '#f9bf58',
  500: '#f2a626',
  600: '#dc8710',
  700: '#b66610',
  800: '#925115',
  900: '#784315',
};

export const plum: Ramp = {
  50: '#fdf3f8',
  100: '#fbe8f2',
  200: '#f8d0e5',
  300: '#f2a9cd',
  400: '#e874ac',
  500: '#d9498c',
  600: '#c02a6e',
  700: '#a32469',
  800: '#861f56',
  900: '#701e49',
};

export const ink: Ramp = {
  50: '#f8f9fb',
  100: '#f1f3f7',
  200: '#e5e8ef',
  300: '#d2d7e2',
  400: '#a0a7bb',
  500: '#737c94',
  600: '#555d74',
  700: '#3f465b',
  800: '#2b3145',
  900: '#191e2e',
};

export const success: Ramp = { 50: '#ecfdf3', 100: '#d1fadf', 500: '#12a150', 700: '#047a45' };
export const warning: Ramp = { 50: '#fffaeb', 100: '#fef0c7', 500: '#f79009', 700: '#b54708' };
export const danger: Ramp = { 50: '#fef3f2', 100: '#fee4e2', 500: '#e0342c', 700: '#b42318' };
export const info: Ramp = { 50: '#eff6ff', 100: '#dbeafe', 500: '#2563eb', 700: '#1d4ed8' };

/** Operational (OCPP connector / charge-point) status colours. */
export const status = {
  available: '#12a150',
  preparing: '#0ea5e9',
  charging: '#2563eb',
  suspended: '#f59e0b',
  finishing: '#6366f1',
  reserved: '#f2a626',
  faulted: '#dc2626',
  unavailable: '#64748b',
  offline: '#94a3b8',
} as const;

export const colors = {
  brand,
  accent,
  plum,
  ink,
  success,
  warning,
  danger,
  info,
  status,
  surface: { page: ink[50], panel: '#ffffff', sunken: ink[100] },
  border: { default: ink[200], strong: ink[300], focus: brand[500] },
  text: { primary: ink[900], body: ink[800], muted: ink[500], subtle: ink[400], inverse: '#ffffff' },
} as const;

/* -------------------------------------------------------------------------- */
/* Typography                                                                  */
/* -------------------------------------------------------------------------- */

export const fontFamily = {
  sans: `'Avenir LT Std', 'Avenir Next', 'Avenir', 'Nunito Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`,
  arabic: `'HONOR Sans Arabic', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif`,
  mono: `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`,
} as const;

export interface TypeStyle {
  name: string;
  /** Tailwind classes used in the application for this role. */
  className: string;
  size: string;
  weight: number;
  lineHeight: string;
  tracking?: string;
  usage: string;
}

/**
 * The type roles actually in use. Sizes are the literal values written in the
 * components (EV Gate uses explicit px sizes rather than Tailwind's t-shirt
 * scale, so that dense enterprise tables stay legible at 12–13px).
 */
export const typography: TypeStyle[] = [
  {
    name: 'Page title',
    className: 'text-[20px] font-semibold tracking-[-0.015em] text-ink-900',
    size: '20px',
    weight: 600,
    lineHeight: '1.2',
    tracking: '-0.015em',
    usage: 'PageHeader h1 — one per screen',
  },
  {
    name: 'Dialog title',
    className: 'text-[15px] font-semibold text-ink-900',
    size: '15px',
    weight: 600,
    lineHeight: '1.4',
    usage: 'Modal / Drawer header',
  },
  {
    name: 'Section title',
    className: 'text-[14px] font-semibold text-ink-900',
    size: '14px',
    weight: 600,
    lineHeight: '1.25',
    usage: 'PanelHeader, EmptyState title',
  },
  {
    name: 'Metric',
    className: 'tnum text-[24px] font-semibold tracking-tight text-ink-900',
    size: '24px',
    weight: 600,
    lineHeight: '1',
    tracking: '-0.02em',
    usage: 'KPI value in StatTile — tabular numerals',
  },
  {
    name: 'Body',
    className: 'text-[13px] text-ink-700',
    size: '13px',
    weight: 400,
    lineHeight: '1.5',
    usage: 'Default control / table / paragraph text',
  },
  {
    name: 'Body strong',
    className: 'text-[13px] font-medium text-ink-900',
    size: '13px',
    weight: 500,
    lineHeight: '1.5',
    usage: 'Primary cell in a table row, switch label',
  },
  {
    name: 'Label',
    className: 'text-[12.5px] font-medium text-ink-700',
    size: '12.5px',
    weight: 500,
    lineHeight: '1.4',
    usage: 'Form field label, StatTile label',
  },
  {
    name: 'Caption',
    className: 'text-[12px] text-ink-500',
    size: '12px',
    weight: 400,
    lineHeight: '1.45',
    usage: 'Hints, secondary meta, breadcrumbs',
  },
  {
    name: 'Overline',
    className: 'text-[11.5px] font-semibold uppercase tracking-wide text-ink-500',
    size: '11.5px',
    weight: 600,
    lineHeight: '1.3',
    tracking: '0.04em',
    usage: 'Table column headers, DetailList terms',
  },
  {
    name: 'Nav group',
    className: 'text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-400',
    size: '10.5px',
    weight: 600,
    lineHeight: '1.3',
    tracking: '0.08em',
    usage: 'Sidebar group heading',
  },
  {
    name: 'Micro',
    className: 'text-[11px] text-ink-400',
    size: '11px',
    weight: 400,
    lineHeight: '1.4',
    usage: 'Units (AED, kWh, kW), footnotes',
  },
];

/* -------------------------------------------------------------------------- */
/* Spacing                                                                     */
/* -------------------------------------------------------------------------- */

/** Tailwind's 4px base scale, limited to the steps EV Gate actually uses. */
export const spacing = {
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

/** Named layout rhythm — what each step means in this product. */
export const spacingRoles = [
  { step: '1', value: '4px', role: 'Icon ↔ adjacent glyph' },
  { step: '1.5', value: '6px', role: 'Badge dot gap, tight inline stacks' },
  { step: '2', value: '8px', role: 'Button group gap, toolbar gap' },
  { step: '2.5', value: '10px', role: 'Sidebar nav icon ↔ label' },
  { step: '3', value: '12px', role: 'Table cell padding (x), card inner rows' },
  { step: '3.5', value: '14px', role: 'Table cell padding (x, comfortable)' },
  { step: '4', value: '16px', role: 'Panel padding, grid gutter' },
  { step: '5', value: '20px', role: 'Page header bottom margin, dialog padding (x)' },
  { step: '6', value: '24px', role: 'Section separation inside a page' },
  { step: '8', value: '32px', role: 'Design System / long-form section separation' },
  { step: '16', value: '64px', role: 'Empty state vertical padding' },
] as const;

/* -------------------------------------------------------------------------- */
/* Radius                                                                      */
/* -------------------------------------------------------------------------- */

export const radius = {
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '10px',
  xl: '14px',
  full: '9999px',
} as const;

export const radiusRoles = [
  { name: 'xs', value: '4px', role: 'Checkbox, legend swatch' },
  { name: 'sm', value: '6px', role: 'xs/sm buttons, menu items, pagination' },
  { name: 'control', value: '7px', role: 'Inputs, selects, md buttons, icon buttons' },
  { name: 'md', value: '8px', role: 'Segmented control, topbar search' },
  { name: 'lg', value: '10px', role: 'Panels, cards, tables, menus, toasts' },
  { name: 'dialog', value: '12px', role: 'Modal panel' },
  { name: 'xl', value: '14px', role: 'Reserved — large marketing surfaces' },
  { name: 'full', value: '9999px', role: 'Badges, dots, progress bars, avatars' },
] as const;

/* -------------------------------------------------------------------------- */
/* Elevation                                                                   */
/* -------------------------------------------------------------------------- */

export const shadows = {
  none: 'none',
  panel: '0 1px 2px 0 rgb(25 30 46 / 0.04), 0 1px 3px 0 rgb(25 30 46 / 0.04)',
  raised: '0 2px 4px -1px rgb(25 30 46 / 0.06), 0 6px 16px -4px rgb(25 30 46 / 0.08)',
  overlay: '0 12px 32px -8px rgb(25 30 46 / 0.18), 0 4px 12px -4px rgb(25 30 46 / 0.08)',
  control: '0 1px 2px rgba(25, 30, 46, 0.08)',
} as const;

export const shadowRoles = [
  { name: 'none', token: '—', role: 'Default. Panels use a 1px ink-200 border, not a shadow.' },
  { name: 'control', token: 'shadow-[0_1px_2px_rgba(25,30,46,0.08)]', role: 'Primary button, active segment' },
  { name: 'panel', token: '--shadow-panel', role: 'Optional lift for a floating summary card' },
  { name: 'raised', token: '--shadow-raised', role: 'Hover lift, map popups' },
  { name: 'overlay', token: '--shadow-overlay', role: 'Modal, drawer, menu, popover, toast, tooltip' },
] as const;

/* -------------------------------------------------------------------------- */
/* Breakpoints                                                                 */
/* -------------------------------------------------------------------------- */

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const breakpointRoles = [
  { name: 'sm', value: '640px', role: 'Dialogs stop being full-bleed; 2-column detail lists' },
  { name: 'md', value: '768px', role: 'Topbar search appears; filter bars go inline' },
  { name: 'lg', value: '1024px', role: 'Sidebar becomes persistent (below: drawer)' },
  { name: 'xl', value: '1280px', role: '4-column KPI grids, wide dashboard split' },
  { name: '2xl', value: '1536px', role: 'Max content rhythm; tables gain breathing room' },
] as const;

/* -------------------------------------------------------------------------- */
/* Component sizes                                                             */
/* -------------------------------------------------------------------------- */

/** Control heights — every interactive control snaps to one of these. */
export const controlSizes = {
  xs: { height: '28px', paddingX: '8px', fontSize: '12px', radius: '6px' },
  sm: { height: '32px', paddingX: '10px', fontSize: '13px', radius: '6px' },
  md: { height: '36px', paddingX: '14px', fontSize: '13px', radius: '7px' },
  lg: { height: '44px', paddingX: '20px', fontSize: '14px', radius: '8px' },
} as const;

export const iconSizes = {
  xs: '12px',
  sm: '14px',
  md: '16px',
  lg: '18px',
  xl: '20px',
} as const;

export const layoutSizes = {
  sidebarExpanded: '236px',
  sidebarCollapsed: '62px',
  topbarHeight: '56px',
  drawerSm: '420px',
  drawerMd: '560px',
  drawerLg: '720px',
  drawerXl: '920px',
  modalSm: '448px',
  modalMd: '512px',
  modalLg: '672px',
  modalXl: '896px',
  modalFull: '1152px',
} as const;

/* -------------------------------------------------------------------------- */
/* Motion                                                                      */
/* -------------------------------------------------------------------------- */

export const motion = {
  instant: '100ms',
  fast: '150ms',
  base: '180ms',
  drawer: '240ms',
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

/* -------------------------------------------------------------------------- */
/* Flattened export — consumed by scripts/export-tokens.mjs                    */
/* -------------------------------------------------------------------------- */

export const designTokens = {
  $meta: {
    name: 'EV Gate CPMS',
    version: '1.0.0',
    description: 'Design tokens for the EV Gate multi-tenant CPMS. Light theme only.',
  },
  color: colors,
  typography: { fontFamily, styles: typography },
  spacing,
  radius,
  shadow: shadows,
  breakpoint: breakpoints,
  size: { control: controlSizes, icon: iconSizes, layout: layoutSizes },
  motion,
} as const;

export type DesignTokens = typeof designTokens;
