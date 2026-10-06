import { useState } from 'react';
import {
  Activity,
  Bell,
  Download,
  Globe,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  RefreshCcw,
  Search,
  Trash2,
  UserCircle2,
  Zap,
} from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import { Menu, type MenuItem } from '@/components/ui/Menu';
import { Tabs, NavTabs } from '@/components/ui/Tabs';
import { Accordion } from '@/components/ui/Accordion';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Avatar, PanelHeader } from '@/components/ui/Surface';
import { PageHeader, MetaItem } from '@/components/layout/PageHeader';
import { BrandLockup, EvGateLogo } from '@/components/layout/Brand';
import { Sidebar, SidebarFooter, type NavGroup } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Frame, Section, Specimen, SpecimenGrid, Variant, VariantRow } from '../Specimen';

/* -------------------------------------------------------------------------- */

export function TabsSection() {
  const [tab, setTab] = useState('overview');
  return (
    <Section
      id="tabs"
      title="Tabs"
      description="An underline tab bar sits directly under the page header and switches views inside one record. The active tab is brand-800 with a 2px underline; inactive tabs are ink-500 and pick up an ink-300 underline on hover. Counts ride in a pill that inherits the active tone."
    >
      <SpecimenGrid columns={1}>
        <Specimen label="Default with counts" surface="none">
          <div className="w-full rounded-[10px] border border-ink-200 bg-white px-4 pt-2">
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { key: 'overview', label: 'Overview' },
                { key: 'connectors', label: 'Connectors', count: 4 },
                { key: 'sessions', label: 'Sessions', count: 128 },
                { key: 'ocpp', label: 'OCPP log', count: 1204 },
                { key: 'config', label: 'Configuration' },
                { key: 'audit', label: 'Audit', disabled: true },
              ]}
            />
            <div className="py-6 text-center text-[12px] text-ink-400">Tab panel — “{tab}”</div>
          </div>
        </Specimen>

        <Specimen label="With icons, small size" surface="none">
          <div className="w-full rounded-[10px] border border-ink-200 bg-white px-4 pt-2 pb-4">
            <Tabs
              size="sm"
              value="monitor"
              onChange={() => {}}
              items={[
                { key: 'monitor', label: 'Monitor', icon: <Activity /> },
                { key: 'commands', label: 'Commands', icon: <Zap />, count: 12 },
                { key: 'firmware', label: 'Firmware', icon: <Download /> },
              ]}
            />
          </div>
        </Specimen>

        <Specimen label="Route tabs" note="NavTabs — each tab is a NavLink" surface="none">
          <div className="w-full rounded-[10px] border border-ink-200 bg-white px-4 pt-2 pb-4">
            <NavTabs
              items={[
                { to: '/design-system', label: 'Monitor', end: true },
                { to: '/design-system#tabs', label: 'Commands', count: 12 },
                { to: '/design-system#accordions', label: 'Configuration' },
              ]}
            />
          </div>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function AccordionsSection() {
  return (
    <Section
      id="accordions"
      title="Accordions"
      description="Used where a screen has many optional groups — the privilege matrix, OCPP configuration keys, tariff rate components. Rows share the panel border language and the chevron rotates rather than swapping icons, so the control never shifts."
    >
      <SpecimenGrid columns={2}>
        <Specimen label="Default" note="First item open" surface="none">
          <Accordion
            className="w-full"
            defaultOpen={['network']}
            items={[
              {
                key: 'network',
                title: 'Network privileges',
                meta: '18 of 22',
                children: 'stations.view · stations.create · stations.update · locations.view · connectors.command …',
              },
              { key: 'commerce', title: 'Commerce privileges', meta: '9 of 16', children: 'tariffs.view · invoices.view · settlements.approve …' },
              { key: 'platform', title: 'Platform privileges', meta: '0 of 14', children: 'tenants.view · companies.manage · users.invite …' },
              { key: 'locked', title: 'Reserved for EV Gate staff', meta: 'Locked', disabled: true, children: '' },
            ]}
          />
        </Specimen>

        <Specimen label="Single-open with icons" note="multiple={false}" surface="none">
          <Accordion
            className="w-full"
            multiple={false}
            defaultOpen={['heartbeat']}
            items={[
              {
                key: 'heartbeat',
                title: 'HeartbeatInterval',
                icon: <Activity />,
                meta: '300 s',
                children: 'Interval at which the charge point sends a Heartbeat when no other message is due.',
              },
              { key: 'meter', title: 'MeterValueSampleInterval', icon: <Zap />, meta: '60 s', children: 'Sampling interval for MeterValues during a transaction.' },
              { key: 'reset', title: 'ResetRetries', icon: <Power />, meta: '3', children: 'Number of times the charge point retries a failed reset.' },
            ]}
          />
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function BreadcrumbsSection() {
  return (
    <Section
      id="breadcrumbs"
      title="Breadcrumbs"
      description="The ancestor trail above a page title. The last crumb is the current page and is never a link. The chevron mirrors in RTL; the trail itself reverses on its own because it is laid out in logical flow rather than with left/right values."
    >
      <SpecimenGrid columns={1}>
        <Specimen label="Two levels" surface="none">
          <div className="w-full rounded-[10px] border border-ink-200 bg-white p-4">
            <Breadcrumbs items={[{ label: 'Locations', to: '/design-system' }, { label: 'Dubai Marina Hub' }]} />
          </div>
        </Specimen>
        <Specimen label="Four levels" surface="none">
          <div className="w-full rounded-[10px] border border-ink-200 bg-white p-4">
            <Breadcrumbs
              items={[
                { label: 'Tenants', to: '/design-system' },
                { label: 'EV Gate Mobility', to: '/design-system' },
                { label: 'Dubai Operations', to: '/design-system' },
                { label: 'Dubai Marina Hub' },
              ]}
            />
          </div>
        </Specimen>
        <Specimen label="RTL" note="dir=&quot;rtl&quot; — the trail and chevrons mirror" surface="none">
          <div dir="rtl" className="w-full rounded-[10px] border border-ink-200 bg-white p-4 font-arabic">
            <Breadcrumbs items={[{ label: 'المواقع', to: '/design-system' }, { label: 'مرسى دبي' }]} />
          </div>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

const MENU_ITEMS: MenuItem[] = [
  { key: 'view', label: 'View charge point', icon: <Search /> },
  { key: 'edit', label: 'Edit details', icon: <Pencil /> },
  { key: 'restart', label: 'Send Reset (Soft)', icon: <RefreshCcw />, separatorBefore: true },
  { key: 'unlock', label: 'Unlock connector', icon: <Zap /> },
  { key: 'availability', label: 'Set Unavailable', icon: <Power />, disabled: true },
  { key: 'delete', label: 'Delete charge point', icon: <Trash2 />, danger: true, separatorBefore: true },
];

export function MenusSection() {
  return (
    <Section
      id="dropdown-menus"
      title="Dropdown menus"
      description="Portal-mounted, aligned to the end of the trigger and flipped above it when there is not enough room below. Items are 13px with a 14px leading icon; a separator groups destructive actions at the bottom, where they are danger-700 on a danger-50 hover."
    >
      <SpecimenGrid columns={2}>
        <Specimen label="Live menus" note="Click to open — portal-mounted with RTL-aware placement">
          <VariantRow>
            <Variant label="default trigger">
              <Menu items={MENU_ITEMS} />
            </Variant>
            <Variant label="button trigger">
              <Menu items={MENU_ITEMS} trigger={<Button size="sm" iconEnd={<MoreHorizontal className="h-3.5 w-3.5" />}>Actions</Button>} />
            </Variant>
            <Variant label="align start">
              <Menu items={MENU_ITEMS} align="start" trigger={<Button size="sm">Aligned to start</Button>} />
            </Variant>
          </VariantRow>
        </Specimen>

        <Specimen label="Menu anatomy" note="Rendered inline so item states are captured" surface="none">
          <div className="w-[220px] rounded-[10px] border border-ink-200 bg-white p-1 shadow-[var(--shadow-overlay)]">
            <span className="flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-1.5 text-[13px] text-ink-700">
              <Search className="h-3.5 w-3.5" />
              Default item
            </span>
            <span className="flex w-full items-center gap-2.5 rounded-[6px] bg-ink-100 px-2.5 py-1.5 text-[13px] text-ink-900">
              <Pencil className="h-3.5 w-3.5" />
              Hovered item
            </span>
            <span className="flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-1.5 text-[13px] text-ink-300">
              <Power className="h-3.5 w-3.5" />
              Disabled item
            </span>
            <div className="my-1 h-px bg-ink-200" />
            <span className="flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-1.5 text-[13px] text-danger-700">
              <Trash2 className="h-3.5 w-3.5" />
              Destructive item
            </span>
            <span className="flex w-full items-center gap-2.5 rounded-[6px] bg-danger-50 px-2.5 py-1.5 text-[13px] text-danger-700">
              <Trash2 className="h-3.5 w-3.5" />
              Destructive · hovered
            </span>
          </div>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

export function PageHeadersSection() {
  return (
    <Section
      id="page-headers"
      title="Page headers & section headers"
      description="A page header carries the trail, a 20px title, an optional description, a row of meta items and the screen's actions — with the single primary action last. A section header (PanelHeader) is its smaller sibling inside a panel: 14px title, 12.5px subtitle, one action slot."
    >
      <SpecimenGrid columns={1}>
        <Specimen label="Page header — list screen" surface="none">
          <div className="w-full rounded-[10px] border border-ink-200 bg-white p-5">
            <PageHeader
              className="mb-0"
              title="Charging stations"
              description="Every charge point in scope, with its live connector state."
              crumbs={[{ label: 'Network', to: '/design-system' }, { label: 'Charging stations' }]}
              actions={
                <>
                  <Button size="sm" icon={<Download className="h-3.5 w-3.5" />}>
                    Export CSV
                  </Button>
                  <Button size="sm" variant="primary" icon={<Plus className="h-3.5 w-3.5" />}>
                    Add charge point
                  </Button>
                </>
              }
            />
          </div>
        </Specimen>

        <Specimen label="Page header — record screen" note="With status, meta row and tabs" surface="none">
          <div className="w-full rounded-[10px] border border-ink-200 bg-white p-5">
            <PageHeader
              className="mb-0"
              title="EVG-AE-0142"
              description="Alpitronic HYC 200 · DC 180 kW · OCPP 1.6J"
              crumbs={[
                { label: 'Network', to: '/design-system' },
                { label: 'Charging stations', to: '/design-system' },
                { label: 'EVG-AE-0142' },
              ]}
              meta={
                <>
                  <MetaItem label="Location" value="Dubai Marina Hub" />
                  <MetaItem label="Connectors" value="2 of 4 in use" />
                  <MetaItem label="Last heartbeat" value="12 s ago" />
                  <StatusBadge status="Online" />
                </>
              }
              actions={
                <>
                  <Button size="sm" icon={<RefreshCcw className="h-3.5 w-3.5" />}>
                    Reset
                  </Button>
                  <Button size="sm" variant="primary" icon={<Zap className="h-3.5 w-3.5" />}>
                    Remote start
                  </Button>
                  <Menu items={MENU_ITEMS} />
                </>
              }
              tabs={
                <Tabs
                  value="overview"
                  onChange={() => {}}
                  items={[
                    { key: 'overview', label: 'Overview' },
                    { key: 'connectors', label: 'Connectors', count: 4 },
                    { key: 'sessions', label: 'Sessions', count: 128 },
                  ]}
                />
              }
            />
          </div>
        </Specimen>

        <Specimen label="Section headers" note="PanelHeader — default and compact" surface="none">
          <div className="grid w-full gap-4 sm:grid-cols-2">
            <div className="rounded-[10px] border border-ink-200 bg-white p-4">
              <PanelHeader
                title="Revenue by location"
                subtitle="Last 30 days · AED"
                action={
                  <Button size="xs" variant="ghost">
                    View all
                  </Button>
                }
              />
              <div className="rounded-[8px] border border-dashed border-ink-200 py-8 text-center text-[12px] text-ink-400">Body</div>
            </div>
            <div className="rounded-[10px] border border-ink-200 bg-white p-4">
              <PanelHeader compact title="Connector mix" subtitle="229 connectors" />
              <div className="rounded-[8px] border border-dashed border-ink-200 py-8 text-center text-[12px] text-ink-400">Body</div>
            </div>
          </div>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * A neutral demonstration navigation. The design system ships no product
 * modules, so the catalogue feeds the real `<Sidebar>` a small generic tree
 * that exercises every visual state it has: grouped sections, an active item,
 * a danger badge and an info badge.
 */
const DEMO_NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { to: '/design-system', label: 'Dashboard', icon: Activity, end: true },
      { to: '/nav-demo/records', label: 'Records', icon: Search },
      { to: '/nav-demo/reports', label: 'Reports', icon: Download },
    ],
  },
  {
    label: 'Operate',
    items: [
      { to: '/nav-demo/attention', label: 'Attention', icon: Bell, badge: 7, badgeTone: 'danger' },
      { to: '/nav-demo/in-progress', label: 'In progress', icon: Zap, badge: 24, badgeTone: 'info' },
      { to: '/nav-demo/scheduled', label: 'Scheduled', icon: RefreshCcw },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/nav-demo/directory', label: 'Directory', icon: UserCircle2 },
      { to: '/nav-demo/settings', label: 'Settings', icon: Power },
    ],
  },
];

const DEMO_ACCOUNT_MENU: MenuItem[] = [
  { key: 'profile', label: 'My profile', icon: <UserCircle2 /> },
  { key: 'help', label: 'Help & documentation', icon: <Globe /> },
  { key: 'signout', label: 'Sign out', icon: <LogOut />, danger: true, separatorBefore: true },
];

const DEMO_NOTIFICATIONS = [
  { id: 'n1', title: 'Threshold exceeded', body: 'Queue depth passed the configured limit.', severity: 'Critical', at: new Date(Date.now() - 6 * 60_000).toISOString() },
  { id: 'n2', title: 'Nightly job finished', body: '1,003 records processed.', severity: 'Info', at: new Date(Date.now() - 92 * 60_000).toISOString(), read: true },
];

export function ShellSection() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Section
      id="shell"
      title="Sidebar navigation & topbar"
      description="The application shell: a 236px sidebar (62px collapsed) and a 56px sticky topbar, exactly as EV Gate CPMS renders them. Both take their content as props here rather than reading a product store, so a new product supplies its own navigation, notifications and account menu without touching either file. The tree below is a neutral demonstration set — one active row, six at rest, and both badge tones."
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start gap-6">
          <Frame label="Sidebar — expanded (236px)" height={520} className="w-[236px] shrink-0">
            <div className="h-full w-[236px]">
              <Sidebar
                groups={DEMO_NAV}
                brandSuffix="DS"
                collapsed={false}
                onToggle={() => {}}
                footer={<SidebarFooter title="EV Gate Design System · v1.0" subtitle="UI foundation" />}
              />
            </div>
          </Frame>
          <Frame label="Collapsed (62px)" height={520} className="w-[62px] shrink-0">
            <div className="h-full w-[62px]">
              <Sidebar groups={DEMO_NAV} collapsed onToggle={() => {}} />
            </div>
          </Frame>
          <Frame label="Interactive" height={520} className="w-[236px] shrink-0">
            <div className="h-full transition-[width] duration-200" style={{ width: collapsed ? 62 : 236 }}>
              <Sidebar
                groups={DEMO_NAV}
                brandSuffix="DS"
                collapsed={collapsed}
                onToggle={() => setCollapsed((c) => !c)}
                footer={<SidebarFooter title="EV Gate Design System · v1.0" subtitle="UI foundation" />}
              />
            </div>
          </Frame>
        </div>

        <Frame label="Topbar — start slot, search, live clock, language, notifications, account">
          <Topbar
            onOpenSidebar={() => {}}
            onOpenSearch={() => {}}
            searchPlaceholder="Search records…"
            start={
              <Badge tone="brand" dot>
                Workspace · Production
              </Badge>
            }
            notifications={DEMO_NOTIFICATIONS}
            onMarkAllRead={() => {}}
            user={{ name: 'Layla Al Suwaidi', caption: 'Platform Operations' }}
            accountMenu={DEMO_ACCOUNT_MENU}
          />
        </Frame>
      </div>

      <SpecimenGrid columns={2} className="mt-5">
        <Specimen label="Nav item states" note="Rendered statically — default, hover, active, with badge" surface="none">
          <div className="w-[236px] rounded-[10px] border border-ink-200 bg-white p-2.5">
            <p className="mb-1.5 px-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">Operate</p>
            <ul className="space-y-0.5">
              <li>
                <span className="flex h-9 items-center gap-2.5 rounded-[7px] px-2.5 text-[13px] font-medium text-ink-600">
                  <Activity className="h-4 w-4 text-ink-400" />
                  <span className="flex-1">Default</span>
                </span>
              </li>
              <li>
                <span className="flex h-9 items-center gap-2.5 rounded-[7px] bg-ink-100 px-2.5 text-[13px] font-medium text-ink-900">
                  <Activity className="h-4 w-4 text-ink-600" />
                  <span className="flex-1">Hovered</span>
                </span>
              </li>
              <li>
                <span className="relative flex h-9 items-center gap-2.5 rounded-[7px] bg-brand-50 px-2.5 text-[13px] font-medium text-brand-900">
                  <span className="absolute inset-y-1.5 start-0 w-[3px] rounded-full bg-brand-800" />
                  <Activity className="h-4 w-4 text-brand-800" />
                  <span className="flex-1">Active</span>
                </span>
              </li>
              <li>
                <span className="flex h-9 items-center gap-2.5 rounded-[7px] px-2.5 text-[13px] font-medium text-ink-600">
                  <Bell className="h-4 w-4 text-ink-400" />
                  <span className="flex-1">Alerts</span>
                  <span className="tnum rounded-full bg-danger-50 px-1.5 py-px text-[10.5px] font-semibold text-danger-700">7</span>
                </span>
              </li>
              <li>
                <span className="flex h-9 items-center gap-2.5 rounded-[7px] px-2.5 text-[13px] font-medium text-ink-600">
                  <Zap className="h-4 w-4 text-ink-400" />
                  <span className="flex-1">Live sessions</span>
                  <span className="tnum rounded-full bg-info-50 px-1.5 py-px text-[10.5px] font-semibold text-info-700">24</span>
                </span>
              </li>
            </ul>
          </div>
        </Specimen>

        <Specimen label="Brand lockup" note="Applied as a CSS mask so it inherits currentColor">
          <div className="flex w-full flex-col gap-4">
            <VariantRow>
              <Variant label="full · brand-900">
                <EvGateLogo height={26} className="text-brand-900" />
              </Variant>
              <Variant label="full · accent-400">
                <span className="inline-flex items-center rounded-[6px] bg-brand-900 px-3 py-2">
                  <EvGateLogo height={22} className="text-accent-400" />
                </span>
              </Variant>
              <Variant label="mark">
                <EvGateLogo variant="mark" height={20} className="text-brand-900" />
              </Variant>
            </VariantRow>
            <VariantRow>
              <Variant label="lockup">
                <BrandLockup />
              </Variant>
              <Variant label='lockup · suffix="CPMS"'>
                <BrandLockup suffix="CPMS" />
              </Variant>
              <Variant label="lockup · compact">
                <BrandLockup compact />
              </Variant>
            </VariantRow>
          </div>
        </Specimen>

        <Specimen label="Topbar controls" note="The affordances that live on the right of the header" span={2}>
          <VariantRow>
            <Variant label="search trigger">
              <span className="flex h-9 min-w-[220px] items-center gap-2 rounded-[8px] border border-ink-200 bg-ink-50/70 px-3 text-[12.5px] text-ink-400">
                <Search className="h-3.5 w-3.5" />
                <span className="flex-1 text-start">Search…</span>
                <kbd className="rounded border border-ink-200 bg-white px-1 text-[10px] text-ink-400">⌘K</kbd>
              </span>
            </Variant>
            <Variant label="language">
              <IconButton label="Language">
                <Globe className="h-4 w-4" />
              </IconButton>
            </Variant>
            <Variant label="notifications">
              <span className="relative inline-flex">
                <IconButton label="Notifications">
                  <Bell className="h-4 w-4" />
                </IconButton>
                <span className="absolute -end-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-semibold text-white">
                  3
                </span>
              </span>
            </Variant>
            <Variant label="avatar">
              <Avatar name="Mohammad Halaweh" />
            </Variant>
            <Variant label="account menu">
              <Menu
                align="end"
                items={[
                  { key: 'profile', label: 'My profile', icon: <UserCircle2 /> },
                  { key: 'signout', label: 'Sign out', icon: <LogOut />, danger: true, separatorBefore: true },
                ]}
                trigger={
                  <span className="inline-flex items-center gap-2 rounded-[8px] px-1.5 py-1">
                    <Avatar name="Layla Al Suwaidi" size="sm" />
                    <span className="hidden text-start sm:block">
                      <span className="block text-[12.5px] font-medium leading-tight text-ink-900">Layla Al Suwaidi</span>
                      <span className="block text-[11px] leading-tight text-ink-500">Platform Operations</span>
                    </span>
                  </span>
                }
              />
            </Variant>
            <Variant label="scope chip">
              <Badge tone="brand" dot>
                EV Gate Mobility · Dubai Operations
              </Badge>
            </Variant>
          </VariantRow>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}
