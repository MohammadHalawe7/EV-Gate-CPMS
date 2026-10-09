/* =============================================================================
 * Hardware profiles — the catalogue of products you install.
 *
 * The list leads with the distinction that matters, because getting it wrong
 * is the most common modelling mistake in a CPMS: a profile is a product, a
 * station is an installed instance of it.
 * ========================================================================== */

import { useMemo, useState } from 'react';
import { Plus, Server } from 'lucide-react';
import { useI18n } from '@/i18n';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Surface';
import { Alert } from '@/components/ui/Alert';
import { FilterBar, useFilters } from '@/components/common';
import { formatNumber } from '@/lib/utils';
import { findLookup, getLookup } from '@/data/lookups';
import { useNetwork, useProfileUsage } from '@/data/networkStore';
import { PRIVILEGES } from '@/app/session';
import { Can } from '@/app/guards';
import { APP_ROUTES } from '@/app/navigation';
import { HARDWARE_CATEGORIES, profileConnectorCount, type HardwareProfile } from '@/domain/network';
import { RecordCell } from '../components/primitives';
import { HardwareProfileDrawer } from '../components/HardwareProfileDrawer';

export function HardwareProfilesPage() {
  const { t, ln } = useI18n();
  const net = useNetwork();
  const usage = useProfileUsage();
  const [formOpen, setFormOpen] = useState(false);

  const filters = useFilters([
    {
      key: 'manufacturer',
      label: t('hw.col.manufacturer'),
      options: getLookup('manufacturers').map((m) => ({ value: m.id, label: ln(m) })),
    },
    {
      key: 'category',
      label: t('hw.col.category'),
      options: HARDWARE_CATEGORIES.map((c) => ({ value: c, label: c })),
    },
    {
      key: 'status',
      label: t('loc.filter.status'),
      options: ['Active', 'Draft', 'Archived'].map((s) => ({ value: s, label: t(`status.${s}` as never) })),
    },
  ]);

  const rows = useMemo(
    () => net.profiles.filter((p) => filters.matches({ manufacturer: p.manufacturer, category: p.category, status: p.status })),
    [net.profiles, filters],
  );

  const columns: Column<HardwareProfile>[] = [
    {
      key: 'profile',
      header: t('hw.col.profile'),
      sortValue: (row) => row.name,
      render: (row) => (
        <RecordCell to={APP_ROUTES.hardwareProfile(row.id)} title={ln(row)} subtitle={`${row.code} · ${row.model}`} />
      ),
    },
    {
      key: 'manufacturer',
      header: t('hw.col.manufacturer'),
      width: '160px',
      sortValue: (row) => row.manufacturer,
      render: (row) => {
        const maker = findLookup('manufacturers', row.manufacturer);
        return <span className="text-[12.5px] text-ink-700">{maker ? ln(maker) : row.manufacturer}</span>;
      },
    },
    {
      key: 'category',
      header: t('hw.col.category'),
      width: '96px',
      sortValue: (row) => row.category,
      render: (row) => (
        <Badge tone={row.category === 'DC' ? 'info' : row.category === 'AC' ? 'neutral' : 'plum'} size="sm">
          {row.category}
        </Badge>
      ),
    },
    {
      key: 'power',
      header: t('hw.col.power'),
      align: 'end',
      width: '104px',
      sortValue: (row) => row.maxPowerKw,
      render: (row) => <span className="tnum text-[12.5px] text-ink-900">{formatNumber(row.maxPowerKw)} kW</span>,
    },
    {
      key: 'layout',
      header: t('hw.col.layout'),
      width: '180px',
      sortValue: (row) => profileConnectorCount(row),
      render: (row) => (
        <span className="text-[12.5px] text-ink-700">
          {t('hw.layoutSummary', { evses: row.evses.length, connectors: profileConnectorCount(row) })}
        </span>
      ),
    },
    {
      key: 'ocpp',
      header: t('hw.col.ocpp'),
      width: '130px',
      render: (row) => (
        <span className="flex flex-wrap gap-1">
          {row.ocppVersions.map((v) => (
            <Badge key={v} tone="neutral" size="sm">{v}</Badge>
          ))}
        </span>
      ),
    },
    {
      key: 'installed',
      header: t('hw.col.installed'),
      align: 'end',
      width: '110px',
      sortValue: (row) => usage[row.id] ?? 0,
      render: (row) =>
        (usage[row.id] ?? 0) > 0 ? (
          <span className="tnum text-[12.5px] font-medium text-ink-900">{usage[row.id]}</span>
        ) : (
          <span className="text-[12px] text-ink-400">{t('hw.notInstalled')}</span>
        ),
    },
    {
      key: 'status',
      header: t('loc.col.status'),
      width: '100px',
      align: 'end',
      sortValue: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} label={t(`status.${row.status}` as never)} size="sm" />,
    },
  ];

  return (
    <>
      <PageHeader
        title={t('hw.title')}
        description={t('hw.subtitle')}
        actions={
          <Can do={PRIVILEGES.catalogueManage}>
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
              {t('hw.new')}
            </Button>
          </Can>
        }
      />

      <div className="mb-4">
        <Alert tone="info" title={t('hw.explainTitle')}>{t('hw.explainBody')}</Alert>
      </div>

      {net.profiles.length === 0 ? (
        <EmptyState
          icon={<Server className="h-5 w-5" />}
          title={t('hw.empty')}
          description={t('hw.emptyDesc')}
          action={
            <Can do={PRIVILEGES.catalogueManage}>
              <Button variant="primary" onClick={() => setFormOpen(true)}>{t('hw.new')}</Button>
            </Can>
          }
        />
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          search={filters.search}
          searchText={(row) => `${row.name} ${row.nameAr} ${row.code} ${row.model} ${row.manufacturer}`}
          defaultSort={{ key: 'profile', dir: 'asc' }}
          emptyTitle={t('loc.noMatch')}
          emptyDescription={t('loc.noMatchDesc')}
          toolbar={<FilterBar state={filters} placeholder={t('hw.title')} />}
        />
      )}

      <HardwareProfileDrawer open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}
