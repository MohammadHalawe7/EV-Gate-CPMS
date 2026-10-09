/* =============================================================================
 * Locations — the list.
 *
 * The entry point to the whole network. A location row answers the three
 * questions an operator asks at a glance: is EV charging switched on here,
 * how much hardware is on site, and is any of it broken.
 * ========================================================================== */

import { useMemo, useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { useI18n } from '@/i18n';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Surface';
import { FilterBar, useFilters } from '@/components/common';
import { formatNumber } from '@/lib/utils';
import { getLookup, findLookup } from '@/data/lookups';
import { useLocationRollups, useNetwork } from '@/data/networkStore';
import { useSession, PRIVILEGES } from '@/app/session';
import { Can } from '@/app/guards';
import { APP_ROUTES } from '@/app/navigation';
import type { Location } from '@/domain/network';
import { CountRow, RecordCell } from '../components/primitives';
import { LocationFormDrawer } from '../components/LocationFormDrawer';

export function LocationsPage() {
  const { t, ln } = useI18n();
  const net = useNetwork();
  const rollups = useLocationRollups();
  const { inScope } = useSession();
  const [formOpen, setFormOpen] = useState(false);

  const all = inScope(net.locations, 'location');

  const cityOptions = useMemo(() => {
    const ids = [...new Set(all.map((l) => l.cityId))];
    return ids
      .map((id) => ({ value: id, label: ln(findLookup('cities', id) ?? { name: id }) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [all, ln]);

  const filters = useFilters([
    {
      key: 'type',
      label: t('loc.filter.type'),
      options: getLookup('locationTypes').map((o) => ({ value: o.id, label: ln(o) })),
    },
    { key: 'cityId', label: t('loc.filter.city'), options: cityOptions },
    {
      key: 'status',
      label: t('loc.filter.status'),
      options: ['Active', 'Draft', 'Suspended', 'Archived'].map((s) => ({ value: s, label: t(`status.${s}` as never) })),
    },
    {
      key: 'ev',
      label: t('loc.filter.service'),
      options: [
        { value: 'on', label: t('loc.filter.serviceOn') },
        { value: 'off', label: t('loc.filter.serviceOff') },
      ],
    },
  ]);

  const rows = useMemo(
    () =>
      all.filter((l) =>
        filters.matches({
          type: l.type,
          cityId: l.cityId,
          status: l.status,
          ev: rollups[l.id]?.evEnabled ? 'on' : 'off',
        }),
      ),
    [all, filters, rollups],
  );

  const columns: Column<Location>[] = [
    {
      key: 'location',
      header: t('loc.col.location'),
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[11px] font-semibold text-white"
            style={{ backgroundColor: `hsl(${row.imageHue} 46% 38%)` }}
            aria-hidden
          >
            {row.name.slice(0, 2).toUpperCase()}
          </span>
          <RecordCell
            to={APP_ROUTES.location(row.id)}
            title={ln(row)}
            subtitle={`${row.code} · ${row.address}`}
            badge={
              rollups[row.id]?.evEnabled ? undefined : (
                <Badge tone="neutral" size="sm">{t('loc.filter.serviceOff')}</Badge>
              )
            }
          />
        </div>
      ),
    },
    {
      key: 'type',
      header: t('loc.col.type'),
      width: '130px',
      sortValue: (row) => row.type,
      render: (row) => (
        <span className="text-[12.5px] text-ink-700">{ln(findLookup('locationTypes', row.type) ?? { name: row.type })}</span>
      ),
    },
    {
      key: 'city',
      header: t('loc.col.city'),
      width: '120px',
      sortValue: (row) => row.cityId,
      render: (row) => (
        <span className="text-[12.5px] text-ink-700">{ln(findLookup('cities', row.cityId) ?? { name: '—' })}</span>
      ),
    },
    {
      key: 'chargers',
      header: t('loc.col.chargers'),
      align: 'end',
      width: '90px',
      sortValue: (row) => rollups[row.id]?.stations ?? 0,
      render: (row) => <span className="tnum text-[12.5px] text-ink-900">{rollups[row.id]?.stations ?? 0}</span>,
    },
    {
      key: 'connectors',
      header: t('loc.col.connectors'),
      width: '200px',
      sortValue: (row) => rollups[row.id]?.connectors ?? 0,
      render: (row) => {
        const roll = rollups[row.id];
        if (!roll || roll.connectors === 0) return <span className="text-[12.5px] text-ink-400">—</span>;
        return (
          <CountRow
            items={[
              { label: t('status.Available'), value: roll.available, tone: 'success' },
              { label: t('status.Charging'), value: roll.charging, tone: 'info' },
              ...(roll.faulted > 0 ? [{ label: t('status.Faulted'), value: roll.faulted, tone: 'danger' as const }] : []),
            ]}
          />
        );
      },
    },
    {
      key: 'power',
      header: t('loc.col.power'),
      align: 'end',
      width: '140px',
      sortValue: (row) => rollups[row.id]?.installedKw ?? 0,
      render: (row) => {
        const installed = rollups[row.id]?.installedKw ?? 0;
        const over = installed > row.gridCapacityKw;
        return (
          <span className={`tnum text-[12.5px] ${over ? 'font-medium text-danger-700' : 'text-ink-700'}`}>
            {formatNumber(installed)} / {formatNumber(row.gridCapacityKw)} kW
          </span>
        );
      },
    },
    {
      key: 'status',
      header: t('loc.col.status'),
      width: '110px',
      align: 'end',
      sortValue: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} label={t(`status.${row.status}` as never)} size="sm" />,
    },
  ];

  return (
    <>
      <PageHeader
        title={t('loc.title')}
        description={t('loc.subtitle')}
        actions={
          <Can do={PRIVILEGES.locationsManage}>
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
              {t('loc.new')}
            </Button>
          </Can>
        }
      />

      {all.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-5 w-5" />}
          title={t('loc.empty')}
          description={t('loc.emptyDesc')}
          action={
            <Can do={PRIVILEGES.locationsManage}>
              <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
                {t('loc.new')}
              </Button>
            </Can>
          }
        />
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          search={filters.search}
          searchText={(row) => `${row.name} ${row.nameAr} ${row.code} ${row.address}`}
          defaultSort={{ key: 'location', dir: 'asc' }}
          emptyTitle={t('loc.noMatch')}
          emptyDescription={t('loc.noMatchDesc')}
          toolbar={<FilterBar state={filters} placeholder={t('loc.title')} />}
        />
      )}

      <LocationFormDrawer open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}
