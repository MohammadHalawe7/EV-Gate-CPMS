import { useEffect, useState } from 'react';
import { BookText, Zap } from 'lucide-react';
import { cx } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Field, Input, Select, Checkbox, Switch } from '@/components/ui/Field';
import { StatTile } from '@/components/ui/StatTile';
import { Panel, PanelHeader, DetailList } from '@/components/ui/Surface';
import { Alert } from '@/components/ui/Alert';
import { EvGateLogo } from '@/components/layout/Brand';
import { Section, SectionGroup, Specimen, SpecimenGrid } from './Specimen';
import {
  BrandColorsSection,
  IconsSection,
  NeutralColorsSection,
  RadiusSection,
  SemanticColorsSection,
  ShadowsSection,
  SizingSection,
  SpacingSection,
  TypographySection,
} from './sections/Foundations';
import {
  AutocompleteSection,
  ButtonsSection,
  CheckboxesSection,
  DatePickersSection,
  IconButtonsSection,
  InputsSection,
  MultiSelectSection,
  PhoneSection,
  RadiosSection,
  SearchSection,
  SelectsSection,
  StepperSection,
  SwitchesSection,
  TextareaSection,
  UploadSection,
} from './sections/Forms';
import {
  AlertsSection,
  BadgesSection,
  DialogsSection,
  DrawersSection,
  PanelAnatomySection,
  StatesSection,
  ToastsSection,
  TooltipsSection,
} from './sections/Feedback';
import {
  CardsSection,
  ChartsSection,
  FiltersSection,
  KpiSection,
  TableAnatomySection,
  TablesSection,
} from './sections/DataDisplay';
import {
  AccordionsSection,
  BreadcrumbsSection,
  MenusSection,
  PageHeadersSection,
  ShellSection,
  TabsSection,
} from './sections/Navigation';

/* -------------------------------------------------------------------------- */
/* Section index                                                               */
/* -------------------------------------------------------------------------- */

const INDEX: { group: string; items: { id: string; label: string }[] }[] = [
  {
    group: 'Foundations',
    items: [
      { id: 'brand-colors', label: 'Brand colours' },
      { id: 'neutral-colors', label: 'Neutral colours' },
      { id: 'semantic-colors', label: 'Semantic colours' },
      { id: 'typography', label: 'Typography' },
      { id: 'spacing', label: 'Spacing' },
      { id: 'radius', label: 'Border radius' },
      { id: 'shadows', label: 'Shadows' },
      { id: 'icons', label: 'Icons' },
      { id: 'sizing', label: 'Breakpoints & sizes' },
    ],
  },
  {
    group: 'Controls',
    items: [
      { id: 'buttons', label: 'Buttons' },
      { id: 'icon-buttons', label: 'Icon buttons' },
      { id: 'inputs', label: 'Inputs' },
      { id: 'textareas', label: 'Text areas' },
      { id: 'selects', label: 'Selects' },
      { id: 'autocomplete', label: 'Autocomplete' },
      { id: 'multi-select', label: 'Multi select' },
      { id: 'phone-input', label: 'Phone input' },
      { id: 'date-pickers', label: 'Date pickers' },
      { id: 'checkboxes', label: 'Checkboxes' },
      { id: 'radios', label: 'Radio buttons' },
      { id: 'switches', label: 'Switches' },
      { id: 'search', label: 'Search' },
      { id: 'file-upload', label: 'File & image upload' },
      { id: 'stepper', label: 'Stepper' },
    ],
  },
  {
    group: 'Feedback',
    items: [
      { id: 'status-chips', label: 'Status chips & badges' },
      { id: 'tooltips', label: 'Tooltips' },
      { id: 'alerts', label: 'Alerts' },
      { id: 'toasts', label: 'Toasts' },
      { id: 'dialogs', label: 'Dialogs' },
      { id: 'drawers', label: 'Drawers' },
      { id: 'states', label: 'Empty, loading & error' },
      { id: 'panels', label: 'Panels & section headers' },
    ],
  },
  {
    group: 'Data',
    items: [
      { id: 'cards', label: 'Cards' },
      { id: 'kpi-cards', label: 'KPI cards' },
      { id: 'tables', label: 'Tables' },
      { id: 'table-headers', label: 'Table headers & pagination' },
      { id: 'filters', label: 'Filters' },
      { id: 'charts', label: 'Charts' },
    ],
  },
  {
    group: 'Navigation',
    items: [
      { id: 'tabs', label: 'Tabs' },
      { id: 'accordions', label: 'Accordions' },
      { id: 'breadcrumbs', label: 'Breadcrumbs' },
      { id: 'dropdown-menus', label: 'Dropdown menus' },
      { id: 'page-headers', label: 'Page & section headers' },
      { id: 'shell', label: 'Sidebar & topbar' },
    ],
  },
  {
    group: 'Direction',
    items: [{ id: 'rtl', label: 'RTL mirroring' }],
  },
];

const ALL_IDS = INDEX.flatMap((g) => g.items.map((i) => i.id));

function useActiveSection() {
  const [active, setActive] = useState(ALL_IDS[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-72px 0px -70% 0px', threshold: 0 },
    );
    ALL_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  return active;
}

/* -------------------------------------------------------------------------- */
/* RTL section                                                                 */
/* -------------------------------------------------------------------------- */

function RtlSection() {
  return (
    <Section
      id="rtl"
      title="RTL mirroring"
      description="Arabic is a first-class direction, not a translation layer. Every component is built with logical CSS properties — ps/pe, ms/me, start/end, text-start/text-end — so the same markup mirrors without a second stylesheet. Content that mixes Arabic prose with Latin identifiers or figures carries dir=&quot;auto&quot; on the specific element, which is what stops “146 / 121” or “kWh 2,094” from reversing. Icons that encode direction (chevrons, arrows, the drawer slide) flip with rtl:rotate-180 or a direction-aware custom property; icons that do not (a bolt, a wrench) never flip."
    >
      <SpecimenGrid columns={2}>
        <Specimen label="LTR — English" surface="none">
          <div className="w-full rounded-[10px] border border-ink-200 bg-white p-4">
            <RtlSpecimenBody />
          </div>
        </Specimen>
        <Specimen label="RTL — العربية" note='dir="rtl" · font-arabic' surface="none">
          <div dir="rtl" className="w-full rounded-[10px] border border-ink-200 bg-white p-4 font-arabic">
            <RtlSpecimenBody arabic />
          </div>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

function RtlSpecimenBody({ arabic }: { arabic?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <PanelHeader
        compact
        title={arabic ? 'مرسى دبي' : 'Dubai Marina Hub'}
        subtitle={arabic ? 'شارع الشيخ زايد · دبي' : 'Sheikh Zayed Road · Dubai'}
        action={<StatusBadge status="Active" size="sm" label={arabic ? 'نشط' : undefined} />}
      />
      <StatTile
        label={arabic ? 'الطاقة المسلَّمة' : 'Energy delivered'}
        value="2,094"
        unit="kWh"
        delta={6.4}
        deltaLabel={arabic ? 'مقارنة بالأسبوع الماضي' : 'vs last week'}
        icon={<Zap />}
      />
      <DetailList
        columns={1}
        items={[
          { label: arabic ? 'نقاط الشحن' : 'Charge points', value: '12' },
          { label: arabic ? 'الموصلات المتاحة' : 'Connectors free', value: '146 / 121' },
          { label: arabic ? 'التعرفة' : 'Tariff', value: arabic ? 'شحن سريع · ذروة' : 'DC Fast · Peak' },
        ]}
      />
      <Field label={arabic ? 'اسم نقطة الشحن' : 'Charge point name'} hint={arabic ? 'يظهر للسائقين في التطبيق.' : 'Shown to drivers in the app.'}>
        <Input defaultValue={arabic ? 'مرسى دبي ٠١' : 'Dubai Marina Hub 01'} />
      </Field>
      <Field label={arabic ? 'الحالة' : 'Status'}>
        <Select defaultValue="a">
          <option value="a">{arabic ? 'متاح' : 'Available'}</option>
        </Select>
      </Field>
      <Checkbox checked onChange={() => {}} label={arabic ? 'إشعار عند العطل' : 'Notify on fault'} />
      <Switch checked onChange={() => {}} label={arabic ? 'المحاكاة المباشرة' : 'Live simulation'} />
      <Alert tone="warning" compact>
        {arabic ? 'أربع نقاط شحن دون اتصال منذ أكثر من ساعة.' : '4 charge points have been offline for over an hour.'}
      </Alert>
      <div className="flex items-center gap-2">
        <Button size="sm">{arabic ? 'إلغاء' : 'Cancel'}</Button>
        <Button size="sm" variant="primary">
          {arabic ? 'حفظ التغييرات' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export function DesignSystemPage() {
  const active = useActiveSection();

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Header ------------------------------------------------------------ */}
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-4 px-5">
          <EvGateLogo height={22} className="text-brand-900" />
          <span className="hidden border-s border-ink-200 ps-3 text-[11px] font-medium uppercase leading-tight tracking-wider text-ink-400 sm:inline-block">
            Design System
          </span>
          <Badge tone="brand" className="ms-1 hidden sm:inline-flex">
            v1.0
          </Badge>
          <span className="ms-auto inline-flex items-center gap-1.5 text-[12.5px] text-ink-500">
            <BookText className="h-3.5 w-3.5 text-ink-400" />
            <code className="font-mono text-[12px]">DESIGN_SYSTEM.md</code>
          </span>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] gap-8 px-5 py-8">
        {/* Section index -------------------------------------------------- */}
        <nav className="sticky top-[88px] hidden h-[calc(100vh-120px)] w-52 shrink-0 xl:block">
          <div className="eg-scroll h-full overflow-y-auto pe-2">
            {INDEX.map((group) => (
              <div key={group.group} className="mb-5 last:mb-0">
                <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">{group.group}</p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={cx(
                          'block truncate rounded-[6px] px-2 py-1 text-[12.5px] transition-colors',
                          active === item.id ? 'bg-brand-50 font-medium text-brand-900' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                        )}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Catalogue ------------------------------------------------------ */}
        <main className="min-w-0 flex-1">
          <Panel className="mb-12">
            <h1 className="text-[24px] font-semibold tracking-[-0.015em] text-ink-900">EV Gate Design System</h1>
            <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-ink-600">
              The reusable UI foundation for every EV Gate product. Each specimen renders the actual component from{' '}
              <code className="font-mono text-[12.5px] text-brand-800">src/components</code>, styled by the tokens in{' '}
              <code className="font-mono text-[12.5px] text-brand-800">src/index.css</code> and mirrored for tooling in{' '}
              <code className="font-mono text-[12.5px] text-brand-800">src/design-system/tokens.ts</code>. Nothing here is a
              re-drawing — change a component and this page changes with it.
            </p>
            <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-ink-600">
              States that a real interface hides behind a pointer — hover, active, focus, dragging, uploading — are pinned open through
              each component's own <code className="font-mono text-[12.5px] text-brand-800">state</code> prop, so a screen capture carries
              them into Figma intact.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <DetailList
                columns={1}
                items={[
                  { label: 'Theme', value: 'Light only' },
                  { label: 'Base font', value: '14px / 1.5' },
                ]}
              />
              <DetailList
                columns={1}
                items={[
                  { label: 'Brand', value: '#2A0944 · #F9BF58' },
                  { label: 'Grid base', value: '4px' },
                ]}
              />
              <DetailList
                columns={1}
                items={[
                  { label: 'Directions', value: 'LTR + RTL' },
                  { label: 'Build rules', value: 'CLAUDE.md' },
                ]}
              />
            </div>
          </Panel>

          <SectionGroup label="Foundations">
            <BrandColorsSection />
            <NeutralColorsSection />
            <SemanticColorsSection />
            <TypographySection />
            <SpacingSection />
            <RadiusSection />
            <ShadowsSection />
            <IconsSection />
            <SizingSection />
          </SectionGroup>

          <SectionGroup label="Controls">
            <ButtonsSection />
            <IconButtonsSection />
            <InputsSection />
            <TextareaSection />
            <SelectsSection />
            <AutocompleteSection />
            <MultiSelectSection />
            <PhoneSection />
            <DatePickersSection />
            <CheckboxesSection />
            <RadiosSection />
            <SwitchesSection />
            <SearchSection />
            <UploadSection />
            <StepperSection />
          </SectionGroup>

          <SectionGroup label="Feedback">
            <BadgesSection />
            <TooltipsSection />
            <AlertsSection />
            <ToastsSection />
            <DialogsSection />
            <DrawersSection />
            <StatesSection />
            <PanelAnatomySection />
          </SectionGroup>

          <SectionGroup label="Data display">
            <CardsSection />
            <KpiSection />
            <TablesSection />
            <TableAnatomySection />
            <FiltersSection />
            <ChartsSection />
          </SectionGroup>

          <SectionGroup label="Navigation & shell">
            <TabsSection />
            <AccordionsSection />
            <BreadcrumbsSection />
            <MenusSection />
            <PageHeadersSection />
            <ShellSection />
          </SectionGroup>

          <SectionGroup label="Direction">
            <RtlSection />
          </SectionGroup>

          <footer className="mt-14 border-t border-ink-200 pt-5 text-[12px] text-ink-400">
            EV Gate Design System · rendered from the live component library · light theme only.
          </footer>
        </main>
      </div>
    </div>
  );
}
