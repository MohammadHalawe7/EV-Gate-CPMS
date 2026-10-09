/* =============================================================================
 * Stations table — shared by the stations list and the location detail tab.
 *
 * One definition so the two never drift. The location variant hides the
 * location column, which is the only difference between them.
 * ========================================================================== */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { formatNumber, formatRelative } from '@/lib/utils';
import { useNetwork } from '@/data/networkStore';
import { APP_ROUTES } from '@/app/navigation';
import type { ChargingStation } from '@/domain/network';
import { ConnectorChip, RecordCell } from './primitives';

export function StationsTable({
  stations,
  showLocation = true,
  search,
  toolbar,
  emptyTitle,
  emptyDescription,
  emptyAction,
  dense,
}: {
  stations: ChargingStation[];
  showLocation?: boolean;
  search?: string;
  toolbar?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  dense?: boolean;
}) {
  const { t, ln, locale } = useI18n();
  const net = useNetwork();

  const byStation = useMemo(() => {
    const out: Record<string, { connectors: typeof net.connectors; maxKw: number }> = {};
    for (const station of stations) out[station.id] = { connectors: [], maxKw: 0 };
    for (const connector of net.connectors) {
      const row = out[connector.stationId];
      if (row) row.connectors.push(connector);
    }
    for (const evse of net.evses) {
      const row = out[evse.stationId];
      if (row) row.maxKw = Math.max(row.maxKw, evse.maxPowerKw);
    }
    return out;
  }, [stations, net.connectors, net.evses]);

  const columns: Column<ChargingStation>[] = [
    {
      key: 'station',
      header: t('stn.col.station'),
      /* max-width is what actually constrains a column in an auto-layout
         table — without it the identifier subtitle sets the column's floor
         and pushes the status badge off a 1440px screen. */
      className: 'max-w-[230px]',
      width: '230px',
      sortValue: (row) => row.name,
      render: (row) => (
        <RecordCell to={APP_ROUTES.station(row.id)} title={ln(row)} subtitle={`${row.code} · ${row.chargePointId}`} />
      ),
    },
    ...(showLocation
      ? [
          {
            key: 'location',
            header: t('stn.col.location'),
            width: '170px',
            className: 'max-w-[170px]',
            sortValue: (row: ChargingStation) => row.locationId,
            render: (row: ChargingStation) => {
              const location = net.locations.find((l) => l.id === row.locationId);
              if (!location) return <span className="text-ink-400">—</span>;
              return (
                <Link to={APP_ROUTES.location(location.id)} className="block truncate text-[12.5px] text-ink-700 hover:text-brand-800">
                  {ln(location)}
                </Link>
              );
            },
          } as Column<ChargingStation>,
        ]
      : []),
    {
      key: 'hardware',
      header: t('stn.col.hardware'),
      width: '160px',
      sortValue: (row) => row.hardwareProfileId,
      render: (row) => {
        const profile = net.profiles.find((p) => p.id === row.hardwareProfileId);
        if (!profile) return <span className="text-ink-400">—</span>;
        return (
          <Link
            to={APP_ROUTES.hardwareProfile(profile.id)}
            className="block truncate text-[12.5px] text-ink-700 hover:text-brand-800"
          >
            {ln(profile)}
          </Link>
        );
      },
    },
    {
      key: 'connectors',
      header: t('stn.col.connectors'),
      width: '186px',
      render: (row) => {
        const connectors = byStation[row.id]?.connectors ?? [];
        if (connectors.length === 0) return <span className="text-[12.5px] text-ink-400">—</span>;
        return (
          <span className="flex flex-wrap gap-1">
            {connectors.slice(0, 3).map((c) => (
              <ConnectorChip
                key={c.id}
                number={c.connectorNumber}
                type={t(`ctype.${c.type}` as never)}
                status={c.status}
              />
            ))}
            {connectors.length > 3 && (
              <span className="self-center text-[11.5px] text-ink-400">+{connectors.length - 3}</span>
            )}
          </span>
        );
      },
    },
    {
      key: 'power',
      header: t('stn.col.power'),
      align: 'end',
      width: '100px',
      sortValue: (row) => byStation[row.id]?.maxKw ?? 0,
      render: (row) => <span className="tnum text-[12.5px] text-ink-700">{formatNumber(byStation[row.id]?.maxKw ?? 0)} kW</span>,
    },
    {
      key: 'ocpp',
      header: t('stn.col.ocpp'),
      width: '84px',
      sortValue: (row) => row.ocppVersion,
      render: (row) => <Badge tone="neutral" size="sm">{row.ocppVersion}</Badge>,
    },
    {
      key: 'heartbeat',
      header: t('stn.col.heartbeat'),
      width: '116px',
      sortValue: (row) => row.lastHeartbeatAt ?? '',
      render: (row) =>
        row.lastHeartbeatAt ? (
          <span className="text-[12px] text-ink-500">{formatRelative(row.lastHeartbeatAt, locale)}</span>
        ) : (
          <span className="text-[12px] text-ink-400">{t('common.never')}</span>
        ),
    },
    {
      key: 'state',
      header: t('stn.col.state'),
      width: '120px',
      align: 'end',
      sortValue: (row) => row.state,
      render: (row) => (
        <StatusBadge
          status={row.state}
          label={t(`status.${row.state}` as never)}
          size="sm"
          pulse={row.state === 'Faulted'}
        />
      ),
    },
  ];

  return (
    <DataTable
      rows={stations}
      columns={columns}
      getRowId={(row) => row.id}
      search={search}
      searchText={(row) => `${row.name} ${row.nameAr} ${row.code} ${row.chargePointId} ${row.serialNumber}`}
      defaultSort={{ key: 'station', dir: 'asc' }}
      emptyTitle={emptyTitle ?? t('stn.empty')}
      emptyDescription={emptyDescription ?? t('stn.emptyDesc')}
      emptyAction={emptyAction}
      toolbar={toolbar}
      dense={dense}
    />
  );
}
