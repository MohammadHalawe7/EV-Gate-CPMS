/* =============================================================================
 * OCPP → Diagnostics.
 *
 * A log bundle is requested for a time window, so the window is the form —
 * defaulted to the last 24 hours, which is what somebody chasing a fault
 * almost always wants. Completed bundles offer a download; the prototype has
 * no file store, so the action reports that honestly rather than pretending.
 * ========================================================================== */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileSearch } from 'lucide-react';
import { useI18n } from '@/i18n';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Surface';
import { Field, Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Overlay';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import { FilterBar, useFilters } from '@/components/common';
import { formatDateTime, formatNumber, formatRelative } from '@/lib/utils';
import { networkActions, useNetwork } from '@/data/networkStore';
import { PRIVILEGES, useSession } from '@/app/session';
import { Can } from '@/app/guards';
import { APP_ROUTES } from '@/app/navigation';
import { DIAGNOSTICS_STATUSES, type DiagnosticsJob } from '@/domain/network';

function localInput(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function OcppDiagnosticsPage() {
  const { t, ln, locale } = useI18n();
  const net = useNetwork();
  const toast = useToast();
  const { persona } = useSession();

  const [requestOpen, setRequestOpen] = useState(false);
  const [stationId, setStationId] = useState('');
  const [fromTime, setFromTime] = useState(() => localInput(new Date(Date.now() - 86_400_000)));
  const [toTime, setToTime] = useState(() => localInput(new Date()));

  const target = net.stations.find((s) => s.id === stationId);
  const dateLocale = locale === 'ar' ? 'ar-AE' : 'en-AE';

  const filters = useFilters([
    {
      key: 'status',
      label: t('common.status'),
      width: 'w-[150px]',
      options: DIAGNOSTICS_STATUSES.map((s) => ({ value: s, label: t(`status.${s}` as never) })),
    },
    {
      key: 'stationId',
      label: t('ocpp.filter.station'),
      width: 'w-[180px]',
      options: net.stations.map((s) => ({ value: s.id, label: s.chargePointId })),
    },
  ]);

  const rows = useMemo(
    () => net.diagnosticsJobs.filter((job) => filters.matches({ status: job.status, stationId: job.stationId })),
    [net.diagnosticsJobs, filters],
  );

  function request() {
    if (!stationId) return;
    networkActions.requestDiagnostics(
      stationId,
      new Date(fromTime).toISOString(),
      new Date(toTime).toISOString(),
      persona?.name ?? 'You',
    );
    toast.info(t('ocpp.dg.requested'), t('ocpp.dg.requestedDesc'));
    setRequestOpen(false);
  }

  const columns: Column<DiagnosticsJob>[] = [
    {
      key: 'station',
      header: t('ocpp.cmd.station'),
      sortValue: (row) => row.chargePointId,
      render: (row) => {
        const station = net.stations.find((s) => s.id === row.stationId);
        return station ? (
          <Link to={APP_ROUTES.station(station.id)} className="flex min-w-0 flex-col hover:text-brand-800">
            <span className="truncate text-[12.5px] font-medium text-ink-900">{ln(station)}</span>
            <span className="truncate font-mono text-[11px] text-ink-400" dir="ltr">
              {row.chargePointId}
            </span>
          </Link>
        ) : (
          <span className="font-mono text-[12px] text-ink-500" dir="ltr">
            {row.chargePointId}
          </span>
        );
      },
    },
    {
      key: 'requested',
      header: t('ocpp.dg.col.requested'),
      width: '150px',
      sortValue: (row) => row.requestedAt,
      render: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="text-[12px] text-ink-700">{formatRelative(row.requestedAt, locale)}</span>
          <span className="truncate text-[11px] text-ink-400">{row.requestedByName}</span>
        </span>
      ),
    },
    {
      key: 'window',
      header: t('ocpp.dg.col.window'),
      width: '230px',
      sortValue: (row) => row.fromTime,
      render: (row) => (
        <span className="tnum flex min-w-0 flex-col text-[11.5px] text-ink-600" dir="ltr">
          <span>{formatDateTime(row.fromTime, dateLocale)}</span>
          <span className="text-ink-400">{formatDateTime(row.toTime, dateLocale)}</span>
        </span>
      ),
    },
    {
      key: 'file',
      header: t('ocpp.dg.col.file'),
      sortValue: (row) => row.fileName ?? '',
      render: (row) =>
        row.fileName ? (
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-mono text-[12px] text-ink-800" dir="ltr">
              {row.fileName}
            </span>
            {row.sizeKb !== null && (
              <span className="tnum text-[11px] text-ink-400">{formatNumber(row.sizeKb)} KB</span>
            )}
          </span>
        ) : (
          <span className="text-[12px] text-ink-400">—</span>
        ),
    },
    {
      key: 'status',
      header: t('common.status'),
      align: 'end',
      width: '150px',
      sortValue: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} label={t(`status.${row.status}` as never)} size="sm" />,
    },
    {
      key: 'actions',
      header: '',
      width: '48px',
      align: 'end',
      render: (row) =>
        row.status === 'Uploaded' && row.fileName ? (
          <Button
            size="xs"
            variant="ghost"
            icon={<Download className="h-3.5 w-3.5" />}
            aria-label={t('common.download')}
            title={t('common.download')}
            onClick={() => toast.info(t('common.download'), row.fileName ?? '')}
          />
        ) : null,
    },
  ];

  return (
    <>
      {net.diagnosticsJobs.length === 0 ? (
        <EmptyState
          icon={<FileSearch className="h-5 w-5" />}
          title={t('ocpp.dg.empty')}
          description={t('ocpp.dg.emptyDesc')}
          action={
            <Can do={PRIVILEGES.ocppOperate}>
              <Button variant="primary" onClick={() => setRequestOpen(true)}>
                {t('ocpp.dg.new')}
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
          searchText={(row) => `${row.chargePointId} ${row.fileName ?? ''} ${row.requestedByName}`}
          defaultSort={{ key: 'requested', dir: 'desc' }}
          pageSize={15}
          emptyTitle={t('common.noResults')}
          emptyDescription={t('common.noResultsDesc')}
          toolbar={
            <FilterBar
              state={filters}
              placeholder={t('ocpp.dg.title')}
              actions={
                <Can do={PRIVILEGES.ocppOperate}>
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<FileSearch className="h-3.5 w-3.5" />}
                    onClick={() => setRequestOpen(true)}
                  >
                    {t('ocpp.dg.new')}
                  </Button>
                </Can>
              }
            />
          }
        />
      )}

      <Modal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        size="sm"
        title={t('ocpp.dg.newTitle')}
        description={t('ocpp.dg.newHint')}
        footer={
          <>
            <Button onClick={() => setRequestOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" onClick={request} disabled={!stationId}>
              {t('ocpp.dg.new')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t('ocpp.cmd.station')} required htmlFor="dg-station">
            <Select id="dg-station" value={stationId} onChange={(e) => setStationId(e.target.value)}>
              <option value="">{t('ocpp.cfg.pickStation')}</option>
              {net.stations
                .filter((s) => s.state !== 'Draft' && s.state !== 'Decommissioned')
                .map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.chargePointId} — {station.name}
                  </option>
                ))}
            </Select>
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t('ocpp.dg.from')} htmlFor="dg-from">
              <Input
                id="dg-from"
                type="datetime-local"
                className="tnum"
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
              />
            </Field>
            <Field label={t('ocpp.dg.to')} htmlFor="dg-to">
              <Input
                id="dg-to"
                type="datetime-local"
                className="tnum"
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
              />
            </Field>
          </div>

          {target && target.state !== 'Online' && <Alert tone="warning">{t('ocpp.cmd.offlineWarning')}</Alert>}
        </div>
      </Modal>
    </>
  );
}
