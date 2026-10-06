import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Bell,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Download,
  FileText,
  Gauge,
  Globe,
  LayoutDashboard,
  MapPin,
  Users,
  Wallet,
  Wrench,
  Zap,
  ZapOff,
} from 'lucide-react';
import { cx } from '@/lib/utils';
import {
  accent,
  brand,
  breakpointRoles,
  danger,
  info,
  ink,
  plum,
  radiusRoles,
  shadowRoles,
  shadows,
  spacingRoles,
  status,
  success,
  typography,
  warning,
  controlSizes,
  iconSizes,
  layoutSizes,
} from '../tokens';
import { Section, Specimen, SpecimenGrid, SwatchRamp, Swatch, TokenList, Variant, VariantRow } from '../Specimen';

/* -------------------------------------------------------------------------- */

export function BrandColorsSection() {
  return (
    <Section
      id="brand-colors"
      title="Brand colours"
      description="EV Gate purple #2A0944 and saffron mango #F9BF58, expanded into ramps. Purple carries identity — primary actions, active navigation, links, selection. Saffron is a highlight, never a surface: it appears on a small number of accent buttons, reserved-connector chips and one chart series. Plum is the third brand hue, reserved for refunds and roaming."
    >
      <div className="flex flex-col gap-6">
        <SwatchRamp title="Brand — purple" prefix="brand" ramp={brand} lightUpTo={300} />
        <SwatchRamp title="Accent — saffron mango" prefix="accent" ramp={accent} lightUpTo={400} />
        <SwatchRamp title="Plum — secondary" prefix="plum" ramp={plum} lightUpTo={300} />
      </div>

      <div className="mt-6">
        <TokenList
          rows={[
            { token: 'brand-900', value: brand[900], role: 'Primary button, logo, page title emphasis' },
            { token: 'brand-800', value: brand[800], role: 'Primary hover, active tab underline, active nav icon' },
            { token: 'brand-50', value: brand[50], role: 'Active nav background, selected table row, subtle button' },
            { token: 'accent-400', value: accent[400], role: 'Accent button, reserved status, KPI accent' },
            { token: 'accent-600', value: accent[600], role: 'Chart series 2 — the accessible saffron for data' },
            { token: 'plum-700', value: plum[700], role: 'Refunded / partially refunded badges' },
          ]}
        />
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function NeutralColorsSection() {
  return (
    <Section
      id="neutral-colors"
      title="Neutral colours"
      description="A single cool-grey ramp called ink carries almost the whole interface. Backgrounds are ink-50, panels are pure white, borders are ink-200, and body text is ink-800. The light theme is not decorative — density is high, so contrast does the work that colour would do elsewhere."
    >
      <SwatchRamp title="Ink — neutral" prefix="ink" ramp={ink} lightUpTo={300} />

      <div className="mt-6">
        <TokenList
          rows={[
            { token: 'white', value: '#ffffff', role: 'Panels, tables, dialogs, sidebar, topbar' },
            { token: 'ink-50', value: ink[50], role: 'Page background, table header, footer strip' },
            { token: 'ink-100', value: ink[100], role: 'Sunken chips, ghost hover, skeletons' },
            { token: 'ink-200', value: ink[200], role: 'Default border — every panel, table and divider' },
            { token: 'ink-300', value: ink[300], role: 'Control border, disabled primary fill' },
            { token: 'ink-400', value: ink[400], role: 'Placeholders, icons at rest, footnotes' },
            { token: 'ink-500', value: ink[500], role: 'Muted body text, column headers' },
            { token: 'ink-800', value: ink[800], role: 'Body text' },
            { token: 'ink-900', value: ink[900], role: 'Headings, key values, tooltip surface' },
          ]}
        />
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function SemanticColorsSection() {
  const feedback: { title: string; prefix: string; ramp: Record<string, string> }[] = [
    { title: 'Success', prefix: 'success', ramp: success },
    { title: 'Warning', prefix: 'warning', ramp: warning },
    { title: 'Danger', prefix: 'danger', ramp: danger },
    { title: 'Info', prefix: 'info', ramp: info },
  ];

  return (
    <Section
      id="semantic-colors"
      title="Semantic colours"
      description="Feedback ramps are limited to four steps: 50 and 100 for surfaces and rings, 500 for icons and fills, 700 for text on the tinted surface. Operational status colours are separate — they describe an OCPP connector state, not a judgement, and are used by badges, the network map and the donut charts alike."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {feedback.map((f) => (
          <div key={f.prefix}>
            <h3 className="mb-2 text-[13px] font-semibold text-ink-800">{f.title}</h3>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(f.ramp).map(([step, value]) => (
                <Swatch key={step} name={step} value={value} token={`${f.prefix}-${step}`} onLight={Number(step) <= 100} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <h3 className="mb-2 mt-8 text-[13px] font-semibold text-ink-800">Operational status</h3>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {Object.entries(status).map(([name, value]) => (
          <Swatch key={name} name={name} value={value} token={`status-${name}`} />
        ))}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function TypographySection() {
  return (
    <Section
      id="typography"
      title="Typography"
      description="Avenir LT Std for Latin, HONOR Sans Arabic for Arabic, JetBrains Mono for identifiers and OCPP payloads. EV Gate uses explicit pixel sizes rather than a t-shirt scale: a control management system is dense, and 12–13px with generous line height reads better in tables than a rounded scale would. Numerals are tabular everywhere a figure can change."
    >
      <div className="overflow-hidden rounded-[10px] border border-ink-200 bg-white">
        {typography.map((style) => (
          <div key={style.name} className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-ink-100 px-4 py-3.5 last:border-0">
            <div className="w-32 shrink-0">
              <p className="text-[12.5px] font-medium text-ink-800">{style.name}</p>
              <p className="font-mono text-[10.5px] text-ink-400">
                {style.size} / {style.weight}
              </p>
            </div>
            <p className={cx('min-w-0 flex-1', style.className)}>Dubai Marina Hub · 146 charge points</p>
            <p className="w-full text-[11.5px] text-ink-400 sm:w-56 sm:shrink-0">{style.usage}</p>
          </div>
        ))}
      </div>

      <SpecimenGrid columns={3} className="mt-5">
        <Specimen label="Latin — Avenir stack" note="font-sans">
          <div>
            <p className="text-[15px] text-ink-900">Charging session completed</p>
            <p className="mt-1 text-[13px] text-ink-500">Al Wasl Road · EVG-AE-0142 · 32.41 kWh</p>
          </div>
        </Specimen>
        <Specimen label="Arabic — HONOR Sans stack" note="font-arabic">
          <div dir="rtl" className="font-arabic">
            <p className="text-[15px] text-ink-900">اكتملت جلسة الشحن</p>
            <p className="mt-1 text-[13px] text-ink-500">شارع الوصل · ٣٢٫٤١ كيلوواط ساعة</p>
          </div>
        </Specimen>
        <Specimen label="Mono — identifiers" note="font-mono">
          <div className="font-mono">
            <p className="text-[13px] text-ink-900">RemoteStopTransaction</p>
            <p className="mt-1 text-[12px] text-ink-500">idTag: 04A3B9C2 · txn 88214</p>
          </div>
        </Specimen>
      </SpecimenGrid>

      <div className="mt-5">
        <Specimen label="Tabular numerals" note=".tnum — columns of figures stay aligned" span={2}>
          <div className="flex gap-10">
            <div>
              <p className="mb-1 text-[11.5px] uppercase tracking-wide text-ink-500">Tabular</p>
              <p className="tnum text-[15px] text-ink-900">1,118,417.50</p>
              <p className="tnum text-[15px] text-ink-900">98,004.25</p>
              <p className="tnum text-[15px] text-ink-900">11,111.11</p>
            </div>
            <div>
              <p className="mb-1 text-[11.5px] uppercase tracking-wide text-ink-500">Proportional</p>
              <p className="text-[15px] text-ink-900" style={{ fontVariantNumeric: 'proportional-nums' }}>
                1,118,417.50
              </p>
              <p className="text-[15px] text-ink-900" style={{ fontVariantNumeric: 'proportional-nums' }}>
                98,004.25
              </p>
              <p className="text-[15px] text-ink-900" style={{ fontVariantNumeric: 'proportional-nums' }}>
                11,111.11
              </p>
            </div>
          </div>
        </Specimen>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function SpacingSection() {
  return (
    <Section
      id="spacing"
      title="Spacing"
      description="A 4px base scale. Only the steps listed here are used; anything between them is a mistake rather than a decision. Gutters between grid items are 16px, sections inside a page are separated by 24px, and panels are padded 16px."
    >
      <div className="overflow-hidden rounded-[10px] border border-ink-200 bg-white">
        {spacingRoles.map((s) => (
          <div key={s.step} className="flex items-center gap-4 border-b border-ink-100 px-4 py-2.5 last:border-0">
            <span className="w-14 shrink-0 font-mono text-[11.5px] text-brand-800">{s.step}</span>
            <span className="tnum w-12 shrink-0 font-mono text-[11.5px] text-ink-700">{s.value}</span>
            <span className="h-3 shrink-0 rounded-[2px] bg-brand-300" style={{ width: s.value }} />
            <span className="min-w-0 flex-1 text-[12.5px] text-ink-600">{s.role}</span>
          </div>
        ))}
      </div>

      <SpecimenGrid columns={2} className="mt-5">
        <Specimen label="Panel padding" note="p-4 · 16px">
          <div className="w-full rounded-[10px] border border-dashed border-brand-300 bg-brand-50/40 p-4">
            <div className="rounded-[6px] border border-ink-200 bg-white px-3 py-2 text-[12.5px] text-ink-600">Panel content</div>
          </div>
        </Specimen>
        <Specimen label="Grid gutter" note="gap-4 · 16px">
          <div className="grid w-full grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-[6px] border border-ink-200 bg-ink-50 py-4" />
            ))}
          </div>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function RadiusSection() {
  return (
    <Section
      id="radius"
      title="Border radius"
      description="Corners get rounder as surfaces get larger: 6–7px on controls, 10px on panels and tables, 12px on dialogs, fully round on badges and dots. Nothing in the product is square-cornered and nothing is a pill except a badge."
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {radiusRoles.map((r) => (
          <div key={r.name} className="min-w-0">
            <div
              className="mb-2 flex h-16 items-center justify-center border border-ink-200 bg-white"
              style={{ borderRadius: r.value }}
            >
              <span className="tnum font-mono text-[11px] text-ink-500">{r.value}</span>
            </div>
            <p className="font-mono text-[11px] text-brand-800">{r.name}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-ink-400">{r.role}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function ShadowsSection() {
  return (
    <Section
      id="shadows"
      title="Shadows"
      description="Elevation is rare on purpose. Panels, tables and cards are separated by a 1px ink-200 border, not by a shadow — stacking soft shadows across a dense operations screen makes it feel muddy. Shadows are reserved for things that genuinely float above the page: menus, popovers, dialogs, drawers, toasts and tooltips."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {shadowRoles.map((s) => (
          <div key={s.name} className="min-w-0">
            <div
              className="mb-2.5 flex h-20 items-center justify-center rounded-[10px] border border-ink-200 bg-white"
              style={{ boxShadow: s.name === 'none' ? undefined : shadows[s.name as keyof typeof shadows] }}
            >
              <span className="font-mono text-[11px] text-ink-500">{s.name}</span>
            </div>
            <p className="font-mono text-[10.5px] break-all text-brand-800">{s.token}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-ink-400">{s.role}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

const ICON_SET = [
  { icon: LayoutDashboard, name: 'LayoutDashboard', use: 'Control centre' },
  { icon: MapPin, name: 'MapPin', use: 'Locations, map' },
  { icon: Zap, name: 'Zap', use: 'Charge point, live session' },
  { icon: ZapOff, name: 'ZapOff', use: 'Offline charge point' },
  { icon: BatteryCharging, name: 'BatteryCharging', use: 'Connector charging' },
  { icon: Gauge, name: 'Gauge', use: 'Utilisation, power' },
  { icon: Activity, name: 'Activity', use: 'OCPP monitor, health' },
  { icon: Building2, name: 'Building2', use: 'Tenants, companies' },
  { icon: Users, name: 'Users', use: 'Users, drivers' },
  { icon: CreditCard, name: 'CreditCard', use: 'Payments, RFID' },
  { icon: Wallet, name: 'Wallet', use: 'Wallet float' },
  { icon: FileText, name: 'FileText', use: 'Invoices, reports' },
  { icon: Wrench, name: 'Wrench', use: 'Maintenance' },
  { icon: AlertTriangle, name: 'AlertTriangle', use: 'Alerts, warnings' },
  { icon: CheckCircle2, name: 'CheckCircle2', use: 'Success' },
  { icon: Bell, name: 'Bell', use: 'Notifications' },
  { icon: Globe, name: 'Globe', use: 'Language, roaming' },
  { icon: CalendarClock, name: 'CalendarClock', use: 'Reservations' },
  { icon: Download, name: 'Download', use: 'Export CSV' },
  { icon: ChevronDown, name: 'ChevronDown', use: 'Disclosure' },
];

export function IconsSection() {
  return (
    <Section
      id="icons"
      title="Icons"
      description="Lucide, 1.5px stroke, drawn on a 24px grid and rendered at 14 or 16px. Icons are ink-400 at rest and inherit the text colour when a control is active or hovered; they never carry meaning alone — every icon-only control has a label and a tooltip."
    >
      <Specimen label="Sizes" note="h-3 · h-3.5 · h-4 · h-4.5 · h-5" span={2}>
        <VariantRow>
          {Object.entries(iconSizes).map(([name, value]) => (
            <Variant key={name} label={`${name} · ${value}`}>
              <Zap className="text-ink-600" style={{ width: value, height: value }} />
            </Variant>
          ))}
        </VariantRow>
      </Specimen>

      <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4 lg:grid-cols-5">
        {ICON_SET.map(({ icon: Icon, name, use }) => (
          <div key={name} className="flex min-w-0 items-center gap-2.5 rounded-[8px] border border-ink-200 bg-white px-3 py-2">
            <Icon className="h-4 w-4 shrink-0 text-ink-500" />
            <span className="min-w-0">
              <span className="block truncate font-mono text-[11px] text-ink-800">{name}</span>
              <span className="block truncate text-[10.5px] text-ink-400">{use}</span>
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function SizingSection() {
  return (
    <Section
      id="sizing"
      title="Breakpoints & component sizes"
      description="Every interactive control snaps to one of four heights so that a button, an input and a select placed side by side always line up. Layout sizes are fixed pixel values because the shell is a fixed chrome around a fluid content area."
    >
      <SpecimenGrid columns={2}>
        <Specimen label="Control heights" note="xs 28 · sm 32 · md 36 · lg 44" span={2} surface="none">
          <TokenList
            rows={Object.entries(controlSizes).map(([name, s]) => ({
              token: name,
              value: `${s.height} · pad ${s.paddingX} · ${s.fontSize} · r${s.radius}`,
              role:
                name === 'xs'
                  ? 'Inline row actions, dense toolbars'
                  : name === 'sm'
                    ? 'Table toolbars, filter bars, dialog footers'
                    : name === 'md'
                      ? 'Default — forms, page header actions'
                      : 'Prominent single action (sign in, primary CTA)',
            }))}
          />
        </Specimen>
        <Specimen label="Breakpoints" span={2} surface="none">
          <TokenList rows={breakpointRoles.map((b) => ({ token: b.name, value: b.value, role: b.role }))} />
        </Specimen>
        <Specimen label="Layout sizes" span={2} surface="none">
          <TokenList
            rows={Object.entries(layoutSizes).map(([name, value]) => ({
              token: name,
              value,
              role:
                name.startsWith('sidebar')
                  ? 'Sidebar rail'
                  : name === 'topbarHeight'
                    ? 'Sticky application header'
                    : name.startsWith('drawer')
                      ? 'Drawer width'
                      : 'Modal max width',
            }))}
          />
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}
