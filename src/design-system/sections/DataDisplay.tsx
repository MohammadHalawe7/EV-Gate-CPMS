import { useState } from 'react';
import { AlertTriangle, BatteryCharging, Download, MoreHorizontal, Pencil, Plus, TrendingUp, Wallet, Zap } from 'lucide-react';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Menu } from '@/components/ui/Menu';
import { SearchInput, Select } from '@/components/ui/Field';
import { StatTile } from '@/components/ui/StatTile';
import { Divider, Panel, PanelHeader, ProgressBar } from '@/components/ui/Surface';
import { Energy, KeyValueGrid, Money, MutedText, Power, TotalsRow } from '@/components/common';
import { BarChart, BarList, DonutChart, Gauge, HeatmapGrid, Legend, LineAreaChart, Sparkline } from '@/components/charts';
import { SEQUENTIAL, SERIES, STATUS_COLORS } from '@/components/charts/palette';
import { Section, Specimen, SpecimenGrid, Variant, VariantRow } from '../Specimen';

/* -------------------------------------------------------------------------- */
/* Demo rows                                                                   */
/* -------------------------------------------------------------------------- */

interface DemoRow {
  id: string;
  identity: string;
  location: string;
  status: string;
  connectors: string;
  power: number;
  energy: number;
  revenue: number;
}

const ROWS: DemoRow[] = [
  { id: 'r1', identity: 'EVG-AE-0142', location: 'Dubai Marina Hub', status: 'Charging', connectors: '2 / 4', power: 118, energy: 412.8, revenue: 1284.5 },
  { id: 'r2', identity: 'EVG-AE-0143', location: 'Dubai Marina Hub', status: 'Available', connectors: '0 / 4', power: 0, energy: 288.1, revenue: 902.25 },
  { id: 'r3', identity: 'EVG-AE-0158', location: 'JBR The Walk', status: 'Faulted', connectors: '0 / 2', power: 0, energy: 64.4, revenue: 201.8 },
  { id: 'r4', identity: 'EVG-AE-0161', location: 'Abu Dhabi Corniche', status: 'Offline', connectors: '0 / 2', power: 0, energy: 0, revenue: 0 },
  { id: 'r5', identity: 'EVG-AE-0174', location: 'Al Majaz Waterfront', status: 'Preparing', connectors: '1 / 2', power: 0, energy: 155.2, revenue: 486.9 },
  { id: 'r6', identity: 'EVG-AE-0181', location: 'Yas Mall', status: 'Reserved', connectors: '1 / 4', power: 0, energy: 331.7, revenue: 1044.15 },
];

const ROW_MENU = [
  { key: 'view', label: 'View charge point' },
  { key: 'edit', label: 'Edit' },
  { key: 'reset', label: 'Send Reset', separatorBefore: true },
  { key: 'unlock', label: 'Unlock connector' },
  { key: 'delete', label: 'Delete', danger: true, separatorBefore: true },
];

function columns(): Column<DemoRow>[] {
  return [
    {
      key: 'identity',
      header: 'Charge point',
      sortValue: (r) => r.identity,
      render: (r) => (
        <span className="block">
          <span className="block font-medium text-ink-900">{r.identity}</span>
          <span className="block text-[11.5px] text-ink-500">{r.location}</span>
        </span>
      ),
    },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
    { key: 'connectors', header: 'In use', align: 'center', render: (r) => <span className="tnum">{r.connectors}</span> },
    { key: 'power', header: 'Power', align: 'end', sortValue: (r) => r.power, render: (r) => (r.power ? <Power value={r.power} /> : <MutedText>—</MutedText>) },
    { key: 'energy', header: 'Energy (30d)', align: 'end', sortValue: (r) => r.energy, render: (r) => <Energy value={r.energy} /> },
    { key: 'revenue', header: 'Revenue', align: 'end', sortValue: (r) => r.revenue, render: (r) => <Money value={r.revenue} /> },
    {
      key: 'actions',
      header: '',
      align: 'end',
      width: '96px',
      render: () => (
        <span className="flex items-center justify-end gap-1">
          <IconButton label="Edit" size="sm">
            <Pencil className="h-3.5 w-3.5" />
          </IconButton>
          <Menu items={ROW_MENU} />
        </span>
      ),
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Cards                                                                       */
/* -------------------------------------------------------------------------- */

export function CardsSection() {
  return (
    <Section
      id="cards"
      title="Cards"
      description="A card is a panel with content — there is no separate card component and no card-specific shadow. Keeping one container means a dashboard tile, a table wrapper and a summary block all sit on the same 1px border and 10px radius."
    >
      <SpecimenGrid columns={3}>
        <Specimen label="Summary card" surface="none">
          <Panel className="w-full">
            <PanelHeader compact title="Wallet float" subtitle="Across 1,284 drivers" />
            <p className="tnum text-[24px] font-semibold leading-none text-ink-900">AED 418,204.50</p>
            <Divider className="my-3" />
            <TotalsRow
              items={[
                { label: 'Topped up (30d)', value: 96400 },
                { label: 'Spent (30d)', value: 88112.4 },
                { label: 'Net', value: 8287.6, strong: true },
              ]}
            />
          </Panel>
        </Specimen>

        <Specimen label="Record card" note="With status and inline actions" surface="none">
          <Panel className="w-full">
            <PanelHeader
              compact
              title="Dubai Marina Hub"
              subtitle="Sheikh Zayed Road · Dubai"
              action={<StatusBadge status="Active" size="sm" />}
            />
            <KeyValueGrid
              rows={[
                { label: 'Charge points', value: '12' },
                { label: 'Connectors', value: '28' },
                { label: 'Utilisation (7d)', value: '41%' },
                { label: 'Tariff', value: 'DC Fast · Peak' },
              ]}
            />
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" fullWidth>
                Open location
              </Button>
            </div>
          </Panel>
        </Specimen>

        <Specimen label="Progress card" surface="none">
          <Panel className="w-full">
            <PanelHeader compact title="Firmware rollout" subtitle="3.2.14 · 146 charge points" />
            <div className="flex flex-col gap-3">
              {[
                ['Installed', 118, 'success'],
                ['Downloading', 19, 'info'],
                ['Pending', 6, 'accent'],
                ['Failed', 3, 'danger'],
              ].map(([label, value, tone]) => (
                <div key={label as string}>
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-[12.5px] text-ink-600">{label}</span>
                    <span className="tnum text-[12.5px] font-medium text-ink-900">{value}</span>
                  </div>
                  <ProgressBar value={((value as number) / 146) * 100} tone={tone as 'success'} />
                </div>
              ))}
            </div>
          </Panel>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* KPI cards                                                                   */
/* -------------------------------------------------------------------------- */

export function KpiSection() {
  return (
    <Section
      id="kpi-cards"
      title="KPI cards"
      description="The dashboard tile: a muted label, a 24px tabular metric, an optional unit, and a delta chip that is green when the movement is good. `invertDelta` flips that judgement for metrics where down is better — faults, downtime, failed payments. Passing `to` makes the whole tile a link and adds a hover border."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Energy delivered" value="18,412" unit="kWh" delta={6.4} deltaLabel="vs last week" icon={<Zap />} accent="brand" />
        <StatTile label="Revenue" value="AED 118,204" delta={3.1} deltaLabel="vs last week" icon={<TrendingUp />} accent="success" />
        <StatTile label="Live sessions" value="24" icon={<BatteryCharging />} accent="info" footer={<Badge tone="info" dot pulse size="sm">Live</Badge>} />
        <StatTile label="Faulted connectors" value="7" delta={-18.2} deltaLabel="vs last week" invertDelta icon={<AlertTriangle />} accent="danger" />
      </div>

      <SpecimenGrid columns={2} className="mt-5">
        <Specimen label="Accents" note="brand · accent · success · danger · info · plum · neutral" span={2}>
          <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Wallet float" value="418,204" unit="AED" icon={<Wallet />} accent="plum" />
            <StatTile label="Reserved" value="9" icon={<Zap />} accent="accent" />
            <StatTile label="Charge points" value="146" icon={<Zap />} accent="neutral" footer={<span className="text-ink-400">33 locations</span>} />
            <StatTile label="Utilisation" value="41" unit="%" icon={<TrendingUp />} accent="success" delta={0.8} />
          </div>
        </Specimen>

        <Specimen label="Minimal" note="No icon, no delta">
          <div className="w-full">
            <StatTile label="Open incidents" value="3" />
          </div>
        </Specimen>

        <Specimen label="With sparkline footer" note="footer accepts any node">
          <div className="w-full">
            <StatTile
              label="Sessions today"
              value="212"
              accent="brand"
              icon={<BatteryCharging />}
              footer={<Sparkline values={[18, 22, 19, 28, 31, 26, 34, 41, 38, 44]} />}
            />
          </div>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Tables                                                                      */
/* -------------------------------------------------------------------------- */

export function TablesSection() {
  const [selected, setSelected] = useState<string[]>(['r2']);
  const [search, setSearch] = useState('');

  return (
    <Section
      id="tables"
      title="Tables"
      description="One DataTable powers every list in the product: search, column sorting, selection, pagination and CSV export. Rows are separated by a 1px ink-100 rule rather than zebra striping — at this density stripes fight with the status colours. Numbers are right-aligned and tabular; every cell is bidi-isolated so mixed Arabic and Latin content never reverses."
    >
      <Specimen
        label="Full table"
        note="Header · sortable columns · selection · row actions · pagination"
        span={2}
        surface="none"
      >
        <div className="w-full">
          <DataTable
            rows={ROWS}
            columns={columns()}
            getRowId={(r) => r.id}
            search={search}
            searchText={(r) => `${r.identity} ${r.location} ${r.status}`}
            selectable
            selectedIds={selected}
            onSelectedIdsChange={setSelected}
            defaultSort={{ key: 'identity', dir: 'asc' }}
            pageSize={5}
            toolbar={
              <div className="flex flex-wrap items-center gap-2">
                <SearchInput value={search} onChange={setSearch} placeholder="Search charge points…" className="w-full sm:w-64" />
                <div className="w-[152px] shrink-0">
                  <Select defaultValue="">
                    <option value="">All statuses</option>
                    <option>Available</option>
                    <option>Charging</option>
                    <option>Faulted</option>
                  </Select>
                </div>
                <div className="ms-auto flex items-center gap-2">
                  <Button size="sm" icon={<Download className="h-3.5 w-3.5" />}>
                    Export CSV
                  </Button>
                  <Button size="sm" variant="primary" icon={<Plus className="h-3.5 w-3.5" />}>
                    Add charge point
                  </Button>
                </div>
              </div>
            }
          />
        </div>
      </Specimen>

      <SpecimenGrid columns={1} className="mt-5">
        <Specimen label="Row states" note="Normal · hover · selected — all rendered statically" surface="none">
          <div className="w-full">
            <DataTable
              rows={ROWS.slice(0, 4)}
              columns={columns().slice(0, 4)}
              getRowId={(r) => r.id}
              selectable
              selectedIds={['r3']}
              onSelectedIdsChange={() => {}}
              hidePaginationWhenSingle
              rowClassName={(r) => (r.id === 'r2' ? 'bg-brand-50/45' : undefined)}
              footer={
                <div className="border-t border-ink-200 px-3.5 py-2 text-[11.5px] text-ink-400">
                  Row 1 default · row 2 pinned to the hover fill (bg-brand-50/45) · row 3 selected (bg-brand-50/60)
                </div>
              }
            />
          </div>
        </Specimen>

        <Specimen label="Dense" note="dense — used inside drawers and detail panels" surface="none">
          <div className="w-full">
            <DataTable
              rows={ROWS.slice(0, 3)}
              columns={columns().slice(0, 5)}
              getRowId={(r) => r.id}
              dense
              hidePaginationWhenSingle
            />
          </div>
        </Specimen>

        <Specimen label="Empty" note="No rows — the table renders an EmptyState in place of the grid" surface="none">
          <div className="w-full">
            <DataTable
              rows={[] as DemoRow[]}
              columns={columns()}
              getRowId={(r) => r.id}
              emptyTitle="No charge points match these filters"
              emptyDescription="Clear the status filter or widen the search."
              emptyAction={<Button size="sm">Clear filters</Button>}
            />
          </div>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Table header / pagination anatomy                                           */
/* -------------------------------------------------------------------------- */

export function TableAnatomySection() {
  return (
    <Section
      id="table-headers"
      title="Table headers & pagination"
      description="Column headers are 11.5px uppercase ink-500 on an ink-50 strip that sticks to the top of a scrolling table. A sortable header is a button that cycles ascending → descending → unsorted and turns brand-800 while active. Pagination sits on a bordered footer with the range, a page-size select and numbered pages that elide beyond seven."
    >
      <SpecimenGrid columns={2}>
        <Specimen label="Header cell states" note="Idle · sortable · sorted asc · sorted desc" span={2} surface="none">
          <div className="w-full overflow-hidden rounded-[10px] border border-ink-200 bg-white">
            <table className="w-full border-collapse text-[13px]">
              <thead className="bg-ink-50/95">
                <tr className="border-b border-ink-200">
                  <th className="px-3.5 py-2.5 text-start text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
                    Not sortable
                  </th>
                  <th className="px-3.5 py-2.5 text-start text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
                    <span className="inline-flex items-center gap-1">
                      Sortable<span className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-3.5 py-2.5 text-start text-[11.5px] font-semibold uppercase tracking-wide text-brand-800">
                    <span className="inline-flex items-center gap-1">
                      Sorted ascending
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                    </span>
                  </th>
                  <th className="px-3.5 py-2.5 text-end text-[11.5px] font-semibold uppercase tracking-wide text-brand-800">
                    <span className="inline-flex items-center gap-1">
                      Sorted descending
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M19 12l-7 7-7-7" />
                      </svg>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-ink-100">
                  <td className="px-3.5 py-2.5 text-ink-700">Text cell</td>
                  <td className="px-3.5 py-2.5 text-ink-700">
                    <StatusBadge status="Available" />
                  </td>
                  <td className="px-3.5 py-2.5 text-ink-700">
                    <Energy value={412.8} />
                  </td>
                  <td className="px-3.5 py-2.5 text-end text-ink-700">
                    <Money value={1284.5} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Specimen>

        <Specimen label="Cell types" note="The shared cell renderers from components/common">
          <div className="flex flex-col gap-2 text-[13px]">
            <span>
              <MutedText>Money</MutedText> <Money value={1284.5} />
            </span>
            <span>
              <MutedText>Energy</MutedText> <Energy value={32.41} />
            </span>
            <span>
              <MutedText>Power</MutedText> <Power value={118} />
            </span>
            <span>
              <MutedText>Empty</MutedText> <MutedText>—</MutedText>
            </span>
            <span className="font-mono text-[12.5px] text-ink-700">EVG-AE-0142</span>
          </div>
        </Specimen>

        <Specimen label="Row actions" note="Two direct actions plus an overflow menu">
          <VariantRow>
            <Variant label="icon actions">
              <span className="flex items-center gap-1">
                <IconButton label="Edit" size="sm">
                  <Pencil className="h-3.5 w-3.5" />
                </IconButton>
                <IconButton label="More" size="sm">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </IconButton>
              </span>
            </Variant>
            <Variant label="live menu">
              <Menu items={ROW_MENU} />
            </Variant>
          </VariantRow>
        </Specimen>

        <Specimen label="Pagination" note="Range · page size · numbered pages" span={2} surface="none">
          <div className="w-full overflow-hidden rounded-[10px] border border-ink-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5">
              <div className="flex items-center gap-3 text-[12.5px] text-ink-500">
                <span className="tnum">25–48 of 1,003</span>
                <select className="h-7 rounded-[6px] border border-ink-200 bg-white px-1.5 text-[12px] text-ink-600" defaultValue="25">
                  <option>10</option>
                  <option>25</option>
                  <option>50</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-ink-500">‹</span>
                <span className="tnum inline-flex h-7 min-w-7 items-center justify-center rounded-[6px] px-1.5 text-[12.5px] text-ink-600">1</span>
                <span className="tnum inline-flex h-7 min-w-7 items-center justify-center rounded-[6px] bg-brand-900 px-1.5 text-[12.5px] text-white">2</span>
                <span className="tnum inline-flex h-7 min-w-7 items-center justify-center rounded-[6px] px-1.5 text-[12.5px] text-ink-600">3</span>
                <span className="px-1 text-[12px] text-ink-400">…</span>
                <span className="tnum inline-flex h-7 min-w-7 items-center justify-center rounded-[6px] px-1.5 text-[12.5px] text-ink-600">42</span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-ink-500">›</span>
              </div>
            </div>
          </div>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Filters                                                                     */
/* -------------------------------------------------------------------------- */

export function FiltersSection() {
  const [search, setSearch] = useState('EVG-AE');
  return (
    <Section
      id="filters"
      title="Filters"
      description="A filter bar is a search field, a row of fixed-width selects and — once anything is set — a Clear all ghost button. Each select is wrapped in a fixed-width box because the control itself is full-width by design; that wrapper is the single reason filter bars stay on one line."
    >
      <SpecimenGrid columns={1}>
        <Specimen label="Filter bar — inactive" surface="none">
          <div className="flex w-full flex-wrap items-center gap-2 rounded-[10px] border border-ink-200 bg-white p-3">
            <SearchInput value="" onChange={() => {}} placeholder="Search…" className="w-full min-w-[200px] sm:w-64" />
            {['Status', 'Location', 'Protocol', 'Power class'].map((label) => (
              <div key={label} className="w-[152px] shrink-0">
                <Select defaultValue="">
                  <option value="">{label}</option>
                </Select>
              </div>
            ))}
          </div>
        </Specimen>

        <Specimen label="Filter bar — active" note="Clear all appears; count chip shows how many are set" surface="none">
          <div className="flex w-full flex-wrap items-center gap-2 rounded-[10px] border border-ink-200 bg-white p-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Search…" className="w-full min-w-[200px] sm:w-64" />
            <div className="w-[152px] shrink-0">
              <Select defaultValue="Charging">
                <option>Charging</option>
              </Select>
            </div>
            <div className="w-[152px] shrink-0">
              <Select defaultValue="Dubai Marina Hub">
                <option>Dubai Marina Hub</option>
              </Select>
            </div>
            <Button size="sm" variant="ghost">
              Clear all
            </Button>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-[11.5px] font-medium text-brand-800">
              3 filters
            </span>
          </div>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Charts                                                                      */
/* -------------------------------------------------------------------------- */

const DAYS = ['Aug 19', 'Aug 20', 'Aug 21', 'Aug 22', 'Aug 23', 'Aug 24', 'Aug 25'];
const ENERGY = [2140, 2380, 2210, 2620, 2890, 2440, 2710];
const SESSIONS = [118, 132, 121, 148, 161, 139, 152];

export function ChartsSection() {
  return (
    <Section
      id="charts"
      title="Charts & data visualisation"
      description="A hand-rolled SVG kit — no charting library. The six-slot categorical palette was validated for colour-vision-deficiency separation, chroma and lightness on the white chart surface, both for adjacent slots and all pairs; two slots sit just under 3:1 contrast, so every chart that uses them ships a legend and visible values. Operational status colours are reserved and never reused as a categorical slot."
    >
      <SpecimenGrid columns={2}>
        <Specimen label="Categorical palette" note="Fixed order · never cycled" surface="none">
          <div className="w-full rounded-[10px] border border-ink-200 bg-white p-4">
            <div className="mb-3 flex gap-2">
              {SERIES.map((c, i) => (
                <div key={c} className="min-w-0 flex-1">
                  <div className="h-10 rounded-[6px]" style={{ background: c }} />
                  <p className="mt-1 font-mono text-[10px] text-ink-500">
                    {i + 1} · {c}
                  </p>
                </div>
              ))}
            </div>
            <Legend items={SERIES.map((c, i) => ({ label: `Series ${i + 1}`, color: c }))} />
          </div>
        </Specimen>

        <Specimen label="Sequential ramp" note="Single hue · magnitude encoding" surface="none">
          <div className="w-full rounded-[10px] border border-ink-200 bg-white p-4">
            <div className="flex gap-1">
              {SEQUENTIAL.map((c) => (
                <div key={c} className="min-w-0 flex-1">
                  <div className="h-10 rounded-[4px]" style={{ background: c }} />
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11.5px] text-ink-400">Low → High. Used by the heatmap and the map density layer.</p>
          </div>
        </Specimen>

        <Specimen label="Line / area chart" note="Multi-series with crosshair and tooltip" span={2} surface="none">
          <Panel className="w-full">
            <PanelHeader compact title="Energy delivered vs sessions" subtitle="Last 7 days" />
            <LineAreaChart
              labels={DAYS}
              unitLabel="kWh"
              series={[
                { key: 'energy', label: 'Energy (kWh)', values: ENERGY, color: SERIES[0], area: true },
                { key: 'sessions', label: 'Sessions', values: SESSIONS, color: SERIES[1] },
              ]}
            />
          </Panel>
        </Specimen>

        <Specimen label="Bar chart" surface="none">
          <Panel className="w-full">
            <PanelHeader compact title="Sessions per day" />
            <BarChart labels={DAYS} values={SESSIONS} color={SERIES[0]} />
          </Panel>
        </Specimen>

        <Specimen label="Donut — operational status" note="useStatusColors" surface="none">
          <Panel className="w-full">
            <PanelHeader compact title="Connector status" subtitle="229 connectors" />
            <div className="flex flex-wrap items-center gap-6">
              <DonutChart
                useStatusColors
                centerLabel="Connectors"
                centerValue="229"
                data={[
                  { label: 'Available', value: 164 },
                  { label: 'Charging', value: 24 },
                  { label: 'Preparing', value: 5 },
                  { label: 'Reserved', value: 9 },
                  { label: 'Faulted', value: 7 },
                  { label: 'Unavailable', value: 20 },
                ]}
              />
              <Legend
                className="flex-col !items-start"
                items={[
                  { label: 'Available', color: STATUS_COLORS.Available, value: 164 },
                  { label: 'Charging', color: STATUS_COLORS.Charging, value: 24 },
                  { label: 'Preparing', color: STATUS_COLORS.Preparing, value: 5 },
                  { label: 'Reserved', color: STATUS_COLORS.Reserved, value: 9 },
                  { label: 'Faulted', color: STATUS_COLORS.Faulted, value: 7 },
                  { label: 'Unavailable', color: STATUS_COLORS.Unavailable, value: 20 },
                ]}
              />
            </div>
          </Panel>
        </Specimen>

        <Specimen label="Bar list" note="Ranked breakdown — the dashboard's top-N pattern" surface="none">
          <Panel className="w-full">
            <PanelHeader compact title="Revenue by location" subtitle="Last 30 days · AED" />
            <BarList
              format={(v) => v.toLocaleString('en-AE')}
              colorFor={(i) => SERIES[i % SERIES.length]}
              items={[
                { label: 'Dubai Marina Hub', value: 42180, sub: '12 charge points' },
                { label: 'Yas Mall', value: 31044, sub: '8 charge points' },
                { label: 'Abu Dhabi Corniche', value: 24902, sub: '9 charge points' },
                { label: 'JBR The Walk', value: 18201, sub: '6 charge points' },
                { label: 'Al Majaz Waterfront', value: 11486, sub: '4 charge points' },
              ]}
            />
          </Panel>
        </Specimen>

        <Specimen label="Gauges" note="Single metric against a target" surface="none">
          <Panel className="w-full">
            <PanelHeader compact title="Network health" />
            <div className="flex flex-wrap items-end justify-around gap-4">
              <Gauge value={41} label="Utilisation %" color={SERIES[0]} />
              <Gauge value={98.2} label="Uptime %" color={SERIES[2]} format={(v) => v.toFixed(1)} />
              <Gauge value={7} max={229} label="Faulted" color={SERIES[4]} />
            </div>
          </Panel>
        </Specimen>

        <Specimen label="Sparklines" note="Inline trend — no axes, no tooltip" surface="none">
          <Panel className="w-full">
            <PanelHeader compact title="Per-location trend" />
            <div className="flex flex-col gap-2.5">
              {[
                ['Dubai Marina Hub', [18, 22, 19, 28, 31, 26, 34], SERIES[0]],
                ['Yas Mall', [24, 21, 26, 22, 19, 23, 20], SERIES[1]],
                ['JBR The Walk', [8, 11, 9, 14, 12, 16, 19], SERIES[2]],
              ].map(([label, values, color]) => (
                <div key={label as string} className="flex items-center justify-between gap-3">
                  <span className="text-[12.5px] text-ink-700">{label}</span>
                  <Sparkline values={values as number[]} color={color as string} />
                </div>
              ))}
            </div>
          </Panel>
        </Specimen>

        <Specimen label="Heatmap" note="Hour × weekday demand" span={2} surface="none">
          <Panel className="w-full">
            <PanelHeader compact title="Sessions by hour" subtitle="Last 4 weeks" />
            <HeatmapGrid
              rows={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
              columns={Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}`)}
              values={Array.from({ length: 7 }, (_, d) =>
                Array.from({ length: 24 }, (_, h) => {
                  const peak = h >= 7 && h <= 9 ? 3 : h >= 17 && h <= 21 ? 4 : h >= 11 && h <= 15 ? 2 : 0.6;
                  const weekend = d >= 5 ? 0.7 : 1;
                  return Math.round(peak * weekend * (8 + ((d * 7 + h * 3) % 9)));
                }),
              )}
            />
          </Panel>
        </Specimen>

        <Specimen label="Progress bars" note="Tones follow the semantic ramps" span={2}>
          <div className="flex w-full flex-col gap-3">
            <ProgressBar value={72} tone="brand" showLabel />
            <ProgressBar value={94} tone="success" showLabel />
            <ProgressBar value={48} tone="accent" showLabel />
            <ProgressBar value={22} tone="danger" showLabel />
            <ProgressBar value={61} tone="info" showLabel height={4} />
          </div>
        </Specimen>
      </SpecimenGrid>
    </Section>
  );
}
