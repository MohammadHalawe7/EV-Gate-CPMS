/* =============================================================================
 * OCPP → Monitor.
 *
 * The protocol as it happens. Two decisions worth noting:
 *
 *  - Pausing freezes the rows rather than stopping a subscription. During an
 *    incident you want to read a line without it sliding away, and the
 *    traffic should keep accumulating behind the pause.
 *  - The action is the only clickable cell. A payload is the thing an
 *    engineer actually needs, and burying it behind a row click would make
 *    every other cell look interactive when it is not.
 * ========================================================================== */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Pause, Play } from 'lucide-react';
import { useI18n } from '@/i18n';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Overlay';
import { Panel } from '@/components/ui/Surface';
import { FilterBar, useFilters } from '@/components/common';
import { cx, formatNumber, formatRelative, formatTime } from '@/lib/utils';
import { useNetwork } from '@/data/networkStore';
import { OCPP_ACTIONS_IN, OCPP_ACTIONS_OUT, type OcppMessage } from '@/domain/network';

export function OcppMonitorPage() {
  const { t, locale } = useI18n();
  const net = useNetwork();
  const [live, setLive] = useState(true);
  const [payloadOf, setPayloadOf] = useState<OcppMessage | null>(null);

  /* While live, re-render on a slow tick so relative timestamps stay honest. */
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 5000);
    return () => window.clearInterval(id);
  }, [live]);

  /* Paused keeps the rows that were on screen when the pause was pressed. */
  const frozen = useRef<OcppMessage[] | null>(null);
  if (live) frozen.current = null;
  else if (frozen.current === null) frozen.current = net.messages;
  const source = live ? net.messages : (frozen.current ?? net.messages);

  const actions = useMemo(
    () => [...new Set<string>([...OCPP_ACTIONS_IN, ...OCPP_ACTIONS_OUT])].sort(),
    [],
  );

  const filters = useFilters([
    {
      key: 'direction',
      label: t('ocpp.filter.direction'),
      width: 'w-[140px]',
      options: [
        { value: 'IN', label: t('ocpp.dir.in') },
        { value: 'OUT', label: t('ocpp.dir.out') },
      ],
    },
    {
      key: 'action',
      label: t('ocpp.filter.action'),
      width: 'w-[190px]',
      options: actions.map((a) => ({ value: a, label: a })),
    },
    {
      key: 'stationId',
      label: t('ocpp.filter.station'),
      width: 'w-[180px]',
      options: net.stations.map((s) => ({ value: s.id, label: s.chargePointId })),
    },
    {
      key: 'result',
      label: t('ocpp.filter.result'),
      width: 'w-[130px]',
      options: [
        { value: 'ok', label: t('status.Accepted') },
        { value: 'error', label: t('status.Rejected') },
      ],
    },
  ]);

  const rows = useMemo(
    () =>
      source.filter((message) =>
        filters.matches({
          direction: message.direction,
          action: message.action,
          stationId: message.stationId,
          result: message.ok ? 'ok' : 'error',
        }),
      ),
    [source, filters],
  );

  const columns: Column<OcppMessage>[] = [
    {
      key: 'time',
      header: t('ocpp.col.time'),
      width: '150px',
      sortValue: (row) => row.at,
      render: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="tnum text-[12.5px] text-ink-800" dir="ltr">
            {formatTime(row.at, locale === 'ar' ? 'ar-AE' : 'en-AE')}
          </span>
          <span className="text-[11px] text-ink-400">{formatRelative(row.at, locale)}</span>
        </span>
      ),
    },
    {
      key: 'direction',
      header: t('ocpp.col.direction'),
      width: '112px',
      sortValue: (row) => row.direction,
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-600">
          {row.direction === 'IN' ? (
            <ArrowDownLeft className="h-3.5 w-3.5 text-info-500" />
          ) : (
            <ArrowUpRight className="h-3.5 w-3.5 text-brand-700" />
          )}
          {row.direction === 'IN' ? t('ocpp.dir.in') : t('ocpp.dir.out')}
        </span>
      ),
    },
    {
      key: 'station',
      header: t('ocpp.col.station'),
      width: '180px',
      sortValue: (row) => row.chargePointId,
      render: (row) => (
        <span className="truncate font-mono text-[12px] text-ink-700" dir="ltr">
          {row.chargePointId}
        </span>
      ),
    },
    {
      key: 'action',
      header: t('ocpp.col.action'),
      sortValue: (row) => row.action,
      render: (row) => (
        <button
          type="button"
          onClick={() => setPayloadOf(row)}
          className="truncate text-start text-[12.5px] font-medium text-ink-900 hover:text-brand-800"
        >
          {row.action}
        </button>
      ),
    },
    {
      key: 'version',
      header: 'OCPP',
      width: '80px',
      sortValue: (row) => row.ocppVersion,
      render: (row) => (
        <Badge tone="neutral" size="sm">
          {row.ocppVersion}
        </Badge>
      ),
    },
    {
      key: 'latency',
      header: t('ocpp.col.latency'),
      align: 'end',
      width: '96px',
      sortValue: (row) => row.latencyMs ?? 0,
      render: (row) =>
        row.latencyMs === null ? (
          <span className="text-ink-400">—</span>
        ) : (
          <span className="tnum text-[12px] text-ink-600">{formatNumber(row.latencyMs)} ms</span>
        ),
    },
    {
      key: 'result',
      header: t('ocpp.col.result'),
      align: 'end',
      width: '104px',
      sortValue: (row) => (row.ok ? 1 : 0),
      render: (row) => (
        <Badge tone={row.ok ? 'success' : 'danger'} size="sm">
          {row.ok ? t('status.Accepted') : t('status.Rejected')}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <Panel className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-[14px] font-semibold text-ink-900">
              {t('ocpp.mon.title')}
              <span
                className={cx(
                  'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
                  live ? 'bg-success-50 text-success-700' : 'bg-ink-100 text-ink-500',
                )}
              >
                {/* `.eg-live-dot::after` is `position: absolute; inset: 0`, so it
                    sizes itself against the nearest *positioned* ancestor. The
                    relative wrapper is what keeps the pulse ring the size of the
                    dot — without it the ring inflates to the whole page and
                    swallows every click. Same markup as Badge and Topbar. */}
                <span className="relative flex h-1.5 w-1.5">
                  <span
                    className={cx(
                      'h-1.5 w-1.5 rounded-full',
                      live ? 'eg-live-dot bg-success-500 text-success-500' : 'bg-ink-400',
                    )}
                  />
                </span>
                {live ? t('ocpp.mon.live') : t('ocpp.mon.paused')}
              </span>
            </h3>
            <p className="mt-0.5 text-[12.5px] text-ink-500">{t('ocpp.mon.subtitle')}</p>
          </div>
          <Button
            size="sm"
            icon={live ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            onClick={() => setLive((value) => !value)}
          >
            {live ? t('ocpp.mon.pause') : t('ocpp.mon.resume')}
          </Button>
        </div>
      </Panel>

      <DataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        search={filters.search}
        searchText={(row) => `${row.action} ${row.chargePointId} ${row.uniqueId}`}
        defaultSort={{ key: 'time', dir: 'desc' }}
        pageSize={25}
        emptyTitle={t('common.noResults')}
        emptyDescription={t('common.noResultsDesc')}
        toolbar={<FilterBar state={filters} placeholder={t('ocpp.col.action')} />}
      />

      <Modal
        open={payloadOf !== null}
        onClose={() => setPayloadOf(null)}
        size="md"
        title={t('ocpp.messageDetail')}
        description={payloadOf ? `${payloadOf.action} · ${payloadOf.chargePointId} · ${payloadOf.uniqueId}` : undefined}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral" size="sm">
              {payloadOf?.direction === 'IN' ? t('ocpp.dir.in') : t('ocpp.dir.out')}
            </Badge>
            <Badge tone="neutral" size="sm">
              OCPP {payloadOf?.ocppVersion}
            </Badge>
            <Badge tone={payloadOf?.ok ? 'success' : 'danger'} size="sm">
              {payloadOf?.ok ? t('status.Accepted') : t('status.Rejected')}
            </Badge>
          </div>
          <div>
            <div className="mb-1.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-400">
              {t('ocpp.payload')}
            </div>
            <pre
              dir="ltr"
              className="eg-scroll max-h-[50vh] overflow-auto rounded-[9px] border border-ink-200 bg-ink-50 p-3 font-mono text-[12px] leading-relaxed text-ink-800"
            >
              {payloadOf ? JSON.stringify(payloadOf.payload, null, 2) : ''}
            </pre>
          </div>
        </div>
      </Modal>
    </>
  );
}
