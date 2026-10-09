/* =============================================================================
 * OCPP → Firmware.
 *
 * Firmware is the riskiest routine operation in a charging network: a bad
 * rollout takes a site offline. So the scheduler is explicitly a campaign —
 * pick the chargers, pick the version, pick a time — and the table reports
 * progress per charger rather than a single aggregate that hides the one unit
 * stuck at 40%.
 * ========================================================================== */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, HardDriveDownload } from 'lucide-react';
import { useI18n } from '@/i18n';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState, ProgressBar } from '@/components/ui/Surface';
import { Checkbox, Field, Input, SearchInput } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Overlay';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import { FilterBar, useFilters } from '@/components/common';
import { formatDateTime, formatRelative } from '@/lib/utils';
import { networkActions, useNetwork } from '@/data/networkStore';
import { PRIVILEGES, useSession } from '@/app/session';
import { Can } from '@/app/guards';
import { APP_ROUTES } from '@/app/navigation';
import { FIRMWARE_STATUSES, type FirmwareJob } from '@/domain/network';

const FAILED: FirmwareJob['status'][] = ['DownloadFailed', 'InstallationFailed'];

export function OcppFirmwarePage() {
  const { t, ln, locale } = useI18n();
  const net = useNetwork();
  const toast = useToast();
  const { persona } = useSession();

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [version, setVersion] = useState('');
  const [when, setWhen] = useState(() => new Date(Date.now() + 3600_000).toISOString().slice(0, 16));

  const filters = useFilters([
    {
      key: 'status',
      label: t('common.status'),
      width: 'w-[170px]',
      options: FIRMWARE_STATUSES.map((s) => ({ value: s, label: t(`status.${s}` as never) })),
    },
    {
      key: 'stationId',
      label: t('ocpp.filter.station'),
      width: 'w-[180px]',
      options: net.stations.map((s) => ({ value: s.id, label: s.chargePointId })),
    },
  ]);

  const rows = useMemo(
    () => net.firmwareJobs.filter((job) => filters.matches({ status: job.status, stationId: job.stationId })),
    [net.firmwareJobs, filters],
  );

  const candidates = useMemo(() => {
    const term = search.trim().toLowerCase();
    return net.stations
      .filter((s) => s.state !== 'Draft' && s.state !== 'Decommissioned')
      .filter((s) => term === '' || `${s.name} ${s.chargePointId} ${s.firmwareVersion}`.toLowerCase().includes(term));
  }, [net.stations, search]);

  function schedule() {
    if (picked.length === 0 || version.trim() === '') return;
    networkActions.scheduleFirmware(picked, version.trim(), new Date(when).toISOString(), persona?.name ?? 'You');
    toast.success(t('ocpp.fw.scheduled'), t('ocpp.fw.scheduledDesc', { count: picked.length }));
    setScheduleOpen(false);
    setPicked([]);
  }

  const columns: Column<FirmwareJob>[] = [
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
      key: 'from',
      header: t('ocpp.fw.col.from'),
      width: '110px',
      sortValue: (row) => row.fromVersion,
      render: (row) => (
        <span className="tnum text-[12.5px] text-ink-600" dir="ltr">
          {row.fromVersion}
        </span>
      ),
    },
    {
      key: 'to',
      header: t('ocpp.fw.col.to'),
      width: '110px',
      sortValue: (row) => row.toVersion,
      render: (row) => (
        <span className="tnum text-[12.5px] font-medium text-ink-900" dir="ltr">
          {row.toVersion}
        </span>
      ),
    },
    {
      key: 'progress',
      header: t('ocpp.fw.col.progress'),
      width: '170px',
      sortValue: (row) => row.progressPct,
      render: (row) => (
        <ProgressBar
          value={row.progressPct}
          showLabel
          tone={FAILED.includes(row.status) ? 'danger' : row.status === 'Installed' ? 'success' : 'brand'}
        />
      ),
    },
    {
      key: 'scheduled',
      header: t('ocpp.fw.col.scheduled'),
      width: '150px',
      sortValue: (row) => row.scheduledAt,
      render: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="text-[12px] text-ink-700">{formatRelative(row.scheduledAt, locale)}</span>
          <span className="tnum text-[11px] text-ink-400" dir="ltr">
            {formatDateTime(row.scheduledAt, locale === 'ar' ? 'ar-AE' : 'en-AE')}
          </span>
        </span>
      ),
    },
    {
      key: 'by',
      header: t('ocpp.cmd.col.by'),
      width: '140px',
      sortValue: (row) => row.requestedByName,
      render: (row) => <span className="truncate text-[12.5px] text-ink-700">{row.requestedByName}</span>,
    },
    {
      key: 'status',
      header: t('common.status'),
      align: 'end',
      width: '160px',
      sortValue: (row) => row.status,
      render: (row) => (
        <span className="flex flex-col items-end gap-1">
          <StatusBadge status={row.status} label={t(`status.${row.status}` as never)} size="sm" />
          {row.error && <span className="text-[11px] text-danger-700">{row.error}</span>}
        </span>
      ),
    },
  ];

  return (
    <>
      {net.firmwareJobs.length === 0 ? (
        <EmptyState
          icon={<HardDriveDownload className="h-5 w-5" />}
          title={t('ocpp.fw.empty')}
          description={t('ocpp.fw.emptyDesc')}
          action={
            <Can do={PRIVILEGES.ocppConfigure}>
              <Button variant="primary" onClick={() => setScheduleOpen(true)}>
                {t('ocpp.fw.new')}
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
          searchText={(row) => `${row.chargePointId} ${row.toVersion} ${row.requestedByName}`}
          defaultSort={{ key: 'scheduled', dir: 'desc' }}
          pageSize={15}
          emptyTitle={t('common.noResults')}
          emptyDescription={t('common.noResultsDesc')}
          toolbar={
            <FilterBar
              state={filters}
              placeholder={t('ocpp.fw.title')}
              actions={
                <Can do={PRIVILEGES.ocppConfigure}>
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<CalendarClock className="h-3.5 w-3.5" />}
                    onClick={() => setScheduleOpen(true)}
                  >
                    {t('ocpp.fw.new')}
                  </Button>
                </Can>
              }
            />
          }
        />
      )}

      <Modal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        size="lg"
        title={t('ocpp.fw.newTitle')}
        description={t('ocpp.fw.newHint')}
        footer={
          <>
            <Button onClick={() => setScheduleOpen(false)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              onClick={schedule}
              disabled={picked.length === 0 || version.trim() === ''}
            >
              {t('ocpp.fw.new')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('ocpp.fw.version')} required htmlFor="fw-version">
              <Input
                id="fw-version"
                className="tnum"
                placeholder="2.4.1"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                dir="ltr"
              />
            </Field>
            <Field label={t('ocpp.fw.when')} htmlFor="fw-when">
              <Input
                id="fw-when"
                type="datetime-local"
                className="tnum"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
              />
            </Field>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[12.5px] font-medium text-ink-700">
                {t('ocpp.fw.targets')}
                {picked.length > 0 && (
                  <span className="ms-2 text-ink-400">{t('net.selectedCount', { count: picked.length })}</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <SearchInput value={search} onChange={setSearch} placeholder={`${t('common.search')}…`} className="w-48" />
                <Button
                  size="xs"
                  onClick={() =>
                    setPicked(picked.length === candidates.length ? [] : candidates.map((s) => s.id))
                  }
                >
                  {picked.length === candidates.length ? t('common.clearSelection') : t('common.selectAll')}
                </Button>
              </div>
            </div>

            <div className="eg-scroll max-h-[300px] divide-y divide-ink-100 overflow-auto rounded-[9px] border border-ink-200">
              {candidates.map((station) => (
                <label
                  key={station.id}
                  className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 hover:bg-ink-50"
                >
                  <Checkbox
                    checked={picked.includes(station.id)}
                    onChange={(on) =>
                      setPicked((prev) => (on ? [...prev, station.id] : prev.filter((id) => id !== station.id)))
                    }
                    label={
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[12.5px] font-medium text-ink-900">{ln(station)}</span>
                        <span className="truncate font-mono text-[11px] text-ink-400" dir="ltr">
                          {station.chargePointId}
                        </span>
                      </span>
                    }
                  />
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="tnum text-[11.5px] text-ink-500" dir="ltr">
                      {station.firmwareVersion}
                    </span>
                    <StatusBadge status={station.state} label={t(`status.${station.state}` as never)} size="sm" />
                  </span>
                </label>
              ))}
              {candidates.length === 0 && (
                <p className="py-6 text-center text-[12.5px] text-ink-400">{t('common.noResults')}</p>
              )}
            </div>
          </div>

          {picked.some((id) => net.stations.find((s) => s.id === id)?.state !== 'Online') && (
            <Alert tone="warning">{t('ocpp.cmd.offlineWarning')}</Alert>
          )}
        </div>
      </Modal>
    </>
  );
}
