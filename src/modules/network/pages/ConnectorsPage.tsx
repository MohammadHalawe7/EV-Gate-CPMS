/* =============================================================================
 * Connectors — the flat operational board.
 *
 * Stations are how the estate is built; connectors are how it is watched.
 * This is the one screen that ignores the hierarchy entirely: every plug in
 * the network on one list, grouped by what it is doing right now.
 *
 * It is also where a tariff is assigned in bulk, because connector-level
 * pricing is the exception that is tedious to apply one row at a time.
 * ========================================================================== */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlugZap, Tags } from 'lucide-react';
import { useI18n } from '@/i18n';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Surface';
import { Field, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Overlay';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { ExportButton, FilterBar, useFilters } from '@/components/common';
import { formatNumber, formatRelative } from '@/lib/utils';
import { networkActions, useNetwork, useTariffResolver } from '@/data/networkStore';
import { PRIVILEGES, useSession } from '@/app/session';
import { Can } from '@/app/guards';
import { APP_ROUTES } from '@/app/navigation';
import { CONNECTOR_TYPES, POWER_TYPES, type Connector } from '@/domain/network';
import { ConnectorDot } from '../components/primitives';

type Lane = 'all' | 'available' | 'charging' | 'inSession' | 'reserved' | 'unavailable' | 'faulted';

const LANES: Record<Lane, (connector: Connector) => boolean> = {
  all: () => true,
  available: (c) => c.status === 'Available',
  charging: (c) => c.status === 'Charging',
  inSession: (c) => c.status === 'Preparing' || c.status === 'Finishing' || c.status === 'SuspendedEV' || c.status === 'SuspendedEVSE',
  reserved: (c) => c.status === 'Reserved',
  unavailable: (c) => c.status === 'Unavailable',
  faulted: (c) => c.status === 'Faulted',
};

export function ConnectorsPage() {
  const { t, ln, locale } = useI18n();
  const net = useNetwork();
  const toast = useToast();
  const { inScope } = useSession();
  const resolveFor = useTariffResolver();
  const [lane, setLane] = useState<Lane>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTariffId, setAssignTariffId] = useState('');

  const visible = useMemo(() => inScope(net.connectors), [net.connectors, inScope]);
  const scopedLocations = useMemo(() => inScope(net.locations, 'location'), [net.locations, inScope]);

  const filters = useFilters([
    {
      key: 'locationId',
      label: t('conn.col.location'),
      width: 'w-[180px]',
      options: scopedLocations.map((l) => ({ value: l.id, label: ln(l) })),
    },
    {
      key: 'type',
      label: t('conn.filter.type'),
      width: 'w-[150px]',
      options: CONNECTOR_TYPES.map((v) => ({ value: v, label: t(`ctype.${v}` as never) })),
    },
    {
      key: 'powerType',
      label: t('conn.filter.power'),
      width: 'w-[160px]',
      options: POWER_TYPES.map((v) => ({ value: v, label: t(`power.${v}` as never) })),
    },
  ]);

  const counts = useMemo(() => {
    const out = {} as Record<Lane, number>;
    for (const key of Object.keys(LANES) as Lane[]) out[key] = visible.filter(LANES[key]).length;
    return out;
  }, [visible]);

  const rows = useMemo(
    () =>
      visible.filter(
        (connector) =>
          LANES[lane](connector) &&
          filters.matches({
            locationId: connector.locationId,
            type: connector.type,
            powerType: connector.powerType,
          }),
      ),
    [visible, lane, filters],
  );

  const tabs: TabItem<Lane>[] = [
    { key: 'all', label: t('common.all'), count: counts.all },
    { key: 'available', label: t('status.Available'), count: counts.available },
    { key: 'charging', label: t('status.Charging'), count: counts.charging },
    { key: 'inSession', label: t('status.Preparing'), count: counts.inSession },
    { key: 'reserved', label: t('status.Reserved'), count: counts.reserved },
    { key: 'unavailable', label: t('status.Unavailable'), count: counts.unavailable },
    { key: 'faulted', label: t('status.Faulted'), count: counts.faulted },
  ];

  const columns: Column<Connector>[] = [
    {
      key: 'connector',
      header: t('conn.col.connector'),
      width: '150px',
      sortValue: (row) => `${row.stationId}-${row.connectorNumber}`,
      render: (row) => (
        <span className="flex items-center gap-2">
          <ConnectorDot status={row.status} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[12.5px] font-medium text-ink-900">
              {t('ocpp.cmd.connector')} {row.connectorNumber}
            </span>
            <span className="truncate text-[11.5px] text-ink-500">{t(`ctype.${row.type}` as never)}</span>
          </span>
        </span>
      ),
    },
    {
      /* Station and site share one cell. Two columns of names pushed the
         status badge off a 1440px screen, and the site is context for the
         station rather than something you scan independently. */
      key: 'station',
      header: t('conn.col.station'),
      sortValue: (row) => row.stationId,
      render: (row) => {
        const station = net.stations.find((s) => s.id === row.stationId);
        const location = net.locations.find((l) => l.id === row.locationId);
        if (!station) return <span className="text-ink-400">—</span>;
        return (
          <span className="flex min-w-0 flex-col">
            <Link
              to={APP_ROUTES.station(station.id)}
              className="truncate text-[12.5px] font-medium text-ink-900 hover:text-brand-800"
            >
              {ln(station)}
            </Link>
            <span className="truncate text-[11.5px] text-ink-500">
              {location ? ln(location) : ''}
              <span className="text-ink-400"> · {station.chargePointId}</span>
            </span>
          </span>
        );
      },
    },
    {
      key: 'power',
      header: t('evse.col.power'),
      align: 'end',
      width: '96px',
      sortValue: (row) => row.maxPowerKw,
      render: (row) => (
        <span className="flex flex-col items-end">
          <span className="tnum text-[12.5px] text-ink-900">{formatNumber(row.maxPowerKw)} kW</span>
          <span className="tnum text-[11px] text-ink-400">{row.maxAmperage} A</span>
        </span>
      ),
    },
    {
      key: 'tariff',
      header: t('evse.col.tariff'),
      width: '158px',
      render: (row) => {
        const resolved = resolveFor({ connectorId: row.id });
        if (!resolved.tariff) return <span className="text-[12px] text-ink-400">{t('inherit.none')}</span>;
        return (
          <span className="flex min-w-0 flex-col">
            <Link to={APP_ROUTES.tariff(resolved.tariff.id)} className="truncate text-[12.5px] text-ink-800 hover:text-brand-800">
              {ln(resolved.tariff)}
            </Link>
            <span className="truncate text-[11px] text-ink-400">
              {resolved.source === 'connector'
                ? t('inherit.overridden')
                : t('inherit.from', { level: t(`inherit.${resolved.source}` as never) })}
            </span>
          </span>
        );
      },
    },
    {
      key: 'lifetime',
      header: t('evse.col.lifetime'),
      align: 'end',
      width: '124px',
      sortValue: (row) => row.lifetimeKwh,
      render: (row) => (
        <span className="flex flex-col items-end">
          <span className="tnum text-[12.5px] text-ink-900">{formatNumber(row.lifetimeKwh)} kWh</span>
          <span className="tnum text-[11px] text-ink-400">{formatNumber(row.lifetimeSessions)}</span>
        </span>
      ),
    },
    {
      key: 'lastChange',
      header: t('conn.col.lastChange'),
      width: '112px',
      sortValue: (row) => row.lastStatusAt,
      render: (row) => <span className="text-[12px] text-ink-500">{formatRelative(row.lastStatusAt, locale)}</span>,
    },
    {
      key: 'status',
      header: t('evse.col.status'),
      width: '128px',
      align: 'end',
      sortValue: (row) => row.status,
      render: (row) => (
        <span className="flex flex-col items-end gap-1">
          <StatusBadge status={row.status} label={t(`status.${row.status}` as never)} size="sm" pulse={row.status === 'Charging'} />
          {row.errorCode && (
            <Badge tone="danger" size="sm" dot={false}>
              {row.errorCode}
            </Badge>
          )}
        </span>
      ),
    },
  ];

  function applyBulkTariff() {
    networkActions.assignTariff('connector', selectedIds, assignTariffId === '' ? null : assignTariffId);
    toast.success(t('conn.bulkDone'), t('net.selectedCount', { count: selectedIds.length }));
    setAssignOpen(false);
    setSelectedIds([]);
  }

  const exportRows = rows.map((connector) => {
    const station = net.stations.find((s) => s.id === connector.stationId);
    const location = net.locations.find((l) => l.id === connector.locationId);
    return {
      connector: `${station?.chargePointId ?? ''}#${connector.connectorNumber}`,
      station: station ? station.name : '',
      location: location ? location.name : '',
      type: connector.type,
      powerKw: connector.maxPowerKw,
      status: connector.status,
      errorCode: connector.errorCode ?? '',
      lifetimeKwh: connector.lifetimeKwh,
      lifetimeSessions: connector.lifetimeSessions,
    };
  });

  return (
    <>
      <PageHeader title={t('conn.title')} description={t('conn.subtitle')} />

      {visible.length === 0 ? (
        <EmptyState icon={<PlugZap className="h-5 w-5" />} title={t('conn.empty')} description={t('stn.emptyDesc')} />
      ) : (
        <>
          <Tabs items={tabs} value={lane} onChange={setLane} className="mb-4" />
          <DataTable
            rows={rows}
            columns={columns}
            getRowId={(row) => row.id}
            search={filters.search}
            searchText={(row) => {
              const station = net.stations.find((s) => s.id === row.stationId);
              return `${station?.name ?? ''} ${station?.chargePointId ?? ''} ${row.connectorNumber} ${row.type} ${row.errorCode ?? ''}`;
            }}
            defaultSort={{ key: 'station', dir: 'asc' }}
            selectable
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
            emptyTitle={t('conn.empty')}
            emptyDescription={t('common.noResultsDesc')}
            pageSize={25}
            toolbar={
              <FilterBar
                state={filters}
                placeholder={t('conn.title')}
                actions={
                  <>
                    {selectedIds.length > 0 && (
                      <Can do={PRIVILEGES.tariffsManage}>
                        <Button
                          size="sm"
                          variant="primary"
                          icon={<Tags className="h-3.5 w-3.5" />}
                          onClick={() => setAssignOpen(true)}
                        >
                          {t('conn.bulkTariff')}
                        </Button>
                      </Can>
                    )}
                    <ExportButton rows={exportRows} filename="connectors" />
                  </>
                }
              />
            }
          />
        </>
      )}

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        size="sm"
        title={t('conn.bulkTariffTitle', { count: selectedIds.length })}
        description={t('conn.bulkTariffBody')}
        footer={
          <>
            <Button onClick={() => setAssignOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" onClick={applyBulkTariff}>
              {t('common.apply')}
            </Button>
          </>
        }
      >
        <Field label={t('evse.col.tariff')} hint={t('cfg.tariffHint')} htmlFor="bulk-tariff">
          <Select id="bulk-tariff" value={assignTariffId} onChange={(e) => setAssignTariffId(e.target.value)}>
            <option value="">{t('common.inherit')}</option>
            {net.tariffs
              .filter((tf) => tf.status === 'Active')
              .map((tf) => (
                <option key={tf.id} value={tf.id}>
                  {ln(tf)}
                </option>
              ))}
          </Select>
        </Field>
      </Modal>
    </>
  );
}
