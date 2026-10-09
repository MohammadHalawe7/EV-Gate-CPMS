/* =============================================================================
 * Tariffs — reusable pricing.
 *
 * The column that matters most is "assigned to": a tariff nobody uses is
 * clutter, and a tariff used in forty places needs care before it changes.
 * ========================================================================== */

import { useMemo, useState } from 'react';
import { Plus, Tags } from 'lucide-react';
import { useI18n } from '@/i18n';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Surface';
import { FilterBar, Money, useFilters } from '@/components/common';
import { useNetwork, useTariffUsage } from '@/data/networkStore';
import { PRIVILEGES } from '@/app/session';
import { Can } from '@/app/guards';
import { APP_ROUTES } from '@/app/navigation';
import { TARIFF_TYPES, type Tariff } from '@/domain/network';
import { RecordCell } from '../components/primitives';
import { TariffDrawer } from '../components/TariffDrawer';

export function TariffsPage() {
  const { t, ln } = useI18n();
  const net = useNetwork();
  const usage = useTariffUsage();
  const [formOpen, setFormOpen] = useState(false);

  const filters = useFilters([
    { key: 'type', label: t('trf.col.type'), options: TARIFF_TYPES.map((v) => ({ value: v, label: v })) },
    {
      key: 'appliesTo',
      label: t('trf.col.appliesTo'),
      options: [
        { value: 'All', label: t('common.all') },
        { value: 'AC', label: 'AC' },
        { value: 'DC', label: 'DC' },
      ],
    },
    {
      key: 'status',
      label: t('loc.filter.status'),
      options: ['Active', 'Draft', 'Archived'].map((s) => ({ value: s, label: t(`status.${s}` as never) })),
    },
  ]);

  const rows = useMemo(
    () => net.tariffs.filter((tf) => filters.matches({ type: tf.type, appliesTo: tf.appliesTo, status: tf.status })),
    [net.tariffs, filters],
  );

  const columns: Column<Tariff>[] = [
    {
      key: 'tariff',
      header: t('trf.col.tariff'),
      className: 'max-w-[260px]',
      width: '260px',
      sortValue: (row) => row.name,
      render: (row) => (
        <RecordCell
          to={APP_ROUTES.tariff(row.id)}
          title={ln(row)}
          subtitle={`${row.code} · ${row.description}`}
          badge={row.isCompanyDefault ? <Badge tone="brand" size="sm">{t('trf.isDefault')}</Badge> : undefined}
        />
      ),
    },
    {
      key: 'type',
      header: t('trf.col.type'),
      width: '96px',
      sortValue: (row) => row.type,
      render: (row) => <Badge tone="neutral" size="sm">{row.type}</Badge>,
    },
    {
      key: 'energy',
      header: t('trf.col.energy'),
      align: 'end',
      width: '120px',
      sortValue: (row) => row.basePricePerKwh,
      render: (row) => (
        <span className="tnum text-[12.5px] text-ink-900">
          <Money value={row.basePricePerKwh} currency={row.currency} /> <span className="text-ink-400">/kWh</span>
        </span>
      ),
    },
    {
      key: 'appliesTo',
      header: t('trf.col.appliesTo'),
      width: '92px',
      sortValue: (row) => row.appliesTo,
      render: (row) => (
        <span className="text-[12.5px] text-ink-700">{row.appliesTo === 'All' ? t('common.all') : row.appliesTo}</span>
      ),
    },
    {
      key: 'schedule',
      header: t('trf.col.schedule'),
      width: '124px',
      render: (row) => (
        <span className="text-[12.5px] text-ink-700">
          {row.twentyFourSeven ? t('trf.alwaysOn') : t('trf.windows', { count: row.windows.length })}
        </span>
      ),
    },
    {
      key: 'usage',
      header: t('trf.col.usage'),
      width: '176px',
      sortValue: (row) => usage[row.id]?.total ?? 0,
      render: (row) => {
        const use = usage[row.id];
        if (!use || use.total === 0) return <span className="text-[12px] text-ink-400">{t('trf.usage.none')}</span>;
        return (
          <span className="flex flex-col">
            <span className="text-[12.5px] font-medium text-ink-900">{t('trf.usage.summary', { total: use.total })}</span>
            <span className="text-[11px] text-ink-400">
              {/* Only the levels that are actually used — printing four zeros
                  tells nobody anything and pushes the table wider. */}
              {[
                use.locations > 0 ? t('trf.usage.sites', { count: use.locations }) : null,
                use.stations > 0 ? t('trf.usage.stations', { count: use.stations }) : null,
                use.evses > 0 ? t('trf.usage.evses', { count: use.evses }) : null,
                use.connectors > 0 ? t('trf.usage.connectors', { count: use.connectors }) : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </span>
        );
      },
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
        title={t('trf.title')}
        description={t('trf.subtitle')}
        actions={
          <Can do={PRIVILEGES.tariffsManage}>
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
              {t('trf.new')}
            </Button>
          </Can>
        }
      />

      {net.tariffs.length === 0 ? (
        <EmptyState
          icon={<Tags className="h-5 w-5" />}
          title={t('trf.empty')}
          description={t('trf.emptyDesc')}
          action={
            <Can do={PRIVILEGES.tariffsManage}>
              <Button variant="primary" onClick={() => setFormOpen(true)}>{t('trf.new')}</Button>
            </Can>
          }
        />
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          search={filters.search}
          searchText={(row) => `${row.name} ${row.nameAr} ${row.code} ${row.description}`}
          defaultSort={{ key: 'tariff', dir: 'asc' }}
          emptyTitle={t('loc.noMatch')}
          emptyDescription={t('loc.noMatchDesc')}
          toolbar={<FilterBar state={filters} placeholder={t('trf.title')} />}
        />
      )}

      <TariffDrawer open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}
