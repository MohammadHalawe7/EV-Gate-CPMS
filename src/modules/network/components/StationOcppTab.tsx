/* =============================================================================
 * Station → OCPP & connectivity.
 *
 * Deliberately *not* the OCPP Operations Centre. This tab answers "how does
 * this one charger talk to us" — the identity the installer types into the
 * unit, the timings, and the handful of commands you send while standing in
 * front of it. Fleet-wide work lives in /ocpp.
 * ========================================================================== */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Eraser,
  LockOpen,
  Power,
  RadioTower,
  Settings2,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Field, Input, Select, Switch } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/Surface';
import { Modal } from '@/components/ui/Overlay';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime, formatNumber, formatRelative } from '@/lib/utils';
import { networkActions } from '@/data/networkStore';
import { PRIVILEGES, useSession } from '@/app/session';
import { APP_ROUTES } from '@/app/navigation';
import {
  SECURITY_PROFILES,
  type ChargingStation,
  type OcppCommand,
  type OcppMessage,
  type OcppOutboundAction,
  type StationConfig,
} from '@/domain/network';
import { FormGrid, Section, Span, UnsavedBar, useDraft } from './primitives';

interface QuickCommand {
  action: OcppOutboundAction;
  payload: Record<string, unknown>;
  icon: React.ReactNode;
}

export function StationOcppTab({
  station,
  messages,
  commands,
}: {
  station: ChargingStation;
  messages: OcppMessage[];
  commands: OcppCommand[];
}) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const { can } = useSession();
  const [payloadOf, setPayloadOf] = useState<OcppMessage | null>(null);

  const mayConfigure = can(PRIVILEGES.ocppConfigure);
  const mayOperate = can(PRIVILEGES.ocppOperate);
  const online = station.state === 'Online';

  const form = useDraft<StationConfig['ocpp']>(station.config.ocpp);
  const { draft } = form;

  function save() {
    form.commit((value) => networkActions.updateStationConfig(station.id, { ocpp: value }));
    toast.success(t('cfg.savedToast'));
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t('common.copied'));
    } catch {
      /* clipboard unavailable in this context — nothing useful to report */
    }
  }

  const quick: QuickCommand[] = [
    { action: 'Reset', payload: { type: 'Soft' }, icon: <Power className="h-3.5 w-3.5" /> },
    { action: 'ClearCache', payload: {}, icon: <Eraser className="h-3.5 w-3.5" /> },
    { action: 'GetConfiguration', payload: {}, icon: <Settings2 className="h-3.5 w-3.5" /> },
    { action: 'TriggerMessage', payload: { requestedMessage: 'StatusNotification' }, icon: <RadioTower className="h-3.5 w-3.5" /> },
    { action: 'UnlockConnector', payload: { connectorId: 1 }, icon: <LockOpen className="h-3.5 w-3.5" /> },
  ];

  function send(command: QuickCommand) {
    networkActions.sendCommand(station.id, command.action, command.payload);
    toast.info(t('ocpp.cmd.sent'), t('ocpp.cmd.sentDesc'));
  }

  const messageColumns: Column<OcppMessage>[] = [
    {
      key: 'time',
      header: t('ocpp.col.time'),
      width: '130px',
      sortValue: (row) => row.at,
      render: (row) => <span className="text-[12px] text-ink-500">{formatRelative(row.at, locale)}</span>,
    },
    {
      key: 'direction',
      header: t('ocpp.col.direction'),
      width: '110px',
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
      key: 'latency',
      header: t('ocpp.col.latency'),
      align: 'end',
      width: '90px',
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
      width: '100px',
      sortValue: (row) => (row.ok ? 1 : 0),
      render: (row) => (
        <Badge tone={row.ok ? 'success' : 'danger'} size="sm">
          {row.ok ? t('status.Accepted') : t('status.Rejected')}
        </Badge>
      ),
    },
  ];

  const commandColumns: Column<OcppCommand>[] = [
    {
      key: 'action',
      header: t('ocpp.cmd.action'),
      sortValue: (row) => row.action,
      render: (row) => <span className="truncate text-[12.5px] font-medium text-ink-900">{row.action}</span>,
    },
    {
      key: 'requested',
      header: t('ocpp.cmd.col.requested'),
      width: '140px',
      sortValue: (row) => row.createdAt,
      render: (row) => <span className="text-[12px] text-ink-500">{formatRelative(row.createdAt, locale)}</span>,
    },
    {
      key: 'by',
      header: t('ocpp.cmd.col.by'),
      width: '140px',
      sortValue: (row) => row.requestedByName,
      render: (row) => <span className="truncate text-[12.5px] text-ink-700">{row.requestedByName}</span>,
    },
    {
      key: 'duration',
      header: t('ocpp.cmd.col.duration'),
      align: 'end',
      width: '100px',
      sortValue: (row) => row.durationMs ?? 0,
      render: (row) =>
        row.durationMs === null ? (
          <span className="text-ink-400">—</span>
        ) : (
          <span className="tnum text-[12px] text-ink-600">{formatNumber(row.durationMs)} ms</span>
        ),
    },
    {
      key: 'status',
      header: t('common.status'),
      align: 'end',
      width: '110px',
      sortValue: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} label={t(`status.${row.status}` as never)} size="sm" />,
    },
  ];

  return (
    <>
      <div className="space-y-4 pb-16">
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
          {/* ---- Identity & endpoint -------------------------------------- */}
          <Section title={t('ocpp.station.identity')} subtitle={t('ocpp.station.identityHint')}>
            <FormGrid columns={1}>
              <Field label={t('stn.field.chargePointId')} hint={t('stn.field.chargePointIdHint')}>
                <div className="flex items-center gap-2">
                  <code className="font-mono min-w-0 flex-1 truncate rounded-[7px] border border-ink-200 bg-ink-50 px-2.5 py-2 text-[12.5px] text-ink-900" dir="ltr">
                    {station.chargePointId}
                  </code>
                  <Button
                    size="sm"
                    icon={<Copy className="h-3.5 w-3.5" />}
                    aria-label={t('ocpp.copyIdentity')}
                    title={t('ocpp.copyIdentity')}
                    onClick={() => copy(station.chargePointId)}
                  />
                </div>
              </Field>

              <Field label={t('ocpp.station.endpoint')}>
                <div className="flex items-center gap-2">
                  <code className="font-mono min-w-0 flex-1 truncate rounded-[7px] border border-ink-200 bg-ink-50 px-2.5 py-2 text-[12.5px] text-ink-900" dir="ltr">
                    {draft.endpointUrl}
                  </code>
                  <Button
                    size="sm"
                    icon={<Copy className="h-3.5 w-3.5" />}
                    aria-label={t('ocpp.copyEndpoint')}
                    title={t('ocpp.copyEndpoint')}
                    onClick={() => copy(draft.endpointUrl)}
                  />
                </div>
              </Field>

              <Field label={t('ocpp.station.security')} hint={t('ocpp.station.securityHint')} htmlFor="ocpp-security">
                <Select
                  id="ocpp-security"
                  value={String(draft.securityProfile)}
                  onChange={(e) => form.patch({ securityProfile: Number(e.target.value) as StationConfig['ocpp']['securityProfile'] })}
                  disabled={!mayConfigure}
                >
                  {SECURITY_PROFILES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="flex flex-wrap items-center gap-3">
                <Badge tone={draft.hasCredentials ? 'success' : 'warning'} size="sm">
                  {t('ocpp.station.credentials')}: {draft.hasCredentials ? t('common.yes') : t('common.no')}
                </Badge>
                <Badge tone="neutral" size="sm">
                  OCPP {station.ocppVersion}
                </Badge>
              </div>

              <Switch
                checked={draft.allowUnknownChargePoint}
                onChange={(on) => form.patch({ allowUnknownChargePoint: on })}
                label={t('ocpp.station.allowUnknown')}
                disabled={!mayConfigure}
              />
            </FormGrid>
          </Section>

          {/* ---- Timing --------------------------------------------------- */}
          <Section title={t('ocpp.station.timing')} subtitle={t('ocpp.station.timingHint')}>
            <FormGrid columns={2}>
              <Field label={t('ocpp.station.heartbeat')} htmlFor="ocpp-heartbeat">
                <Input
                  id="ocpp-heartbeat"
                  type="number"
                  min={10}
                  value={draft.heartbeatIntervalSec}
                  onChange={(e) => form.patch({ heartbeatIntervalSec: Number(e.target.value) })}
                  disabled={!mayConfigure}
                />
              </Field>
              <Field label={t('ocpp.station.timeout')} htmlFor="ocpp-timeout">
                <Input
                  id="ocpp-timeout"
                  type="number"
                  min={10}
                  value={draft.connectionTimeoutSec}
                  onChange={(e) => form.patch({ connectionTimeoutSec: Number(e.target.value) })}
                  disabled={!mayConfigure}
                />
              </Field>
              <Field label={t('ocpp.station.meterInterval')} htmlFor="ocpp-meter">
                <Input
                  id="ocpp-meter"
                  type="number"
                  min={0}
                  value={draft.meterValueIntervalSec}
                  onChange={(e) => form.patch({ meterValueIntervalSec: Number(e.target.value) })}
                  disabled={!mayConfigure}
                />
              </Field>
              <Field label={t('ocpp.station.resetRetries')} htmlFor="ocpp-retries">
                <Input
                  id="ocpp-retries"
                  type="number"
                  min={0}
                  max={10}
                  value={draft.resetRetries}
                  onChange={(e) => form.patch({ resetRetries: Number(e.target.value) })}
                  disabled={!mayConfigure}
                />
              </Field>

              <Span>
                <div className="rounded-[9px] border border-ink-200 bg-ink-50 px-3 py-2.5">
                  <div className="mb-1 text-[11.5px] font-medium uppercase tracking-wide text-ink-400">
                    {t('stn.lastHeartbeat')}
                  </div>
                  <div className="text-[12.5px] text-ink-800">
                    {station.lastHeartbeatAt
                      ? `${formatRelative(station.lastHeartbeatAt, locale)} · ${formatDateTime(station.lastHeartbeatAt, locale === 'ar' ? 'ar-AE' : 'en-AE')}`
                      : t('common.never')}
                  </div>
                </div>
              </Span>
            </FormGrid>
          </Section>
        </div>

        {/* ---- Quick commands --------------------------------------------- */}
        {mayOperate && (
          <Section
            title={t('ocpp.station.quick')}
            subtitle={t('ocpp.cmd.sendHint')}
            action={
              <Link to={APP_ROUTES.ocppCommands}>
                <Button size="sm">{t('ocpp.cmd.title')}</Button>
              </Link>
            }
          >
            {!online && (
              <div className="mb-3">
                <Alert tone="warning">{t('ocpp.cmd.offlineWarning')}</Alert>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {quick.map((command) => (
                <Button
                  key={command.action}
                  size="sm"
                  icon={command.icon}
                  onClick={() => send(command)}
                >
                  {command.action}
                </Button>
              ))}
            </div>

            {commands.length > 0 && (
              <div className="mt-4 [&>div]:border-x-0 [&>div]:border-b-0 [&>div]:rounded-none">
                <DataTable
                  rows={commands.slice(0, 5)}
                  columns={commandColumns}
                  getRowId={(row) => row.id}
                  defaultSort={{ key: 'requested', dir: 'desc' }}
                  dense
                  hidePaginationWhenSingle
                  emptyTitle={t('ocpp.cmd.empty')}
                  emptyDescription={t('ocpp.cmd.emptyDesc')}
                />
              </div>
            )}
          </Section>
        )}

        {/* ---- Recent messages -------------------------------------------- */}
        <Section
          padded={false}
          title={t('ocpp.station.recent')}
          subtitle={t('ocpp.mon.subtitle')}
          action={
            <Link to={APP_ROUTES.ocppMonitor}>
              <Button size="sm">{t('ocpp.station.viewAll')}</Button>
            </Link>
          }
        >
          {messages.length === 0 ? (
            <div className="border-t border-ink-100">
              <EmptyState
                compact
                icon={<RadioTower className="h-5 w-5" />}
                title={t('ocpp.station.noMessages')}
                description={t('ocpp.station.noMessagesDesc')}
              />
            </div>
          ) : (
            <div className="[&>div]:rounded-none [&>div]:border-0 [&>div]:border-t">
              <DataTable
                rows={messages.slice(0, 10)}
                columns={messageColumns}
                getRowId={(row) => row.id}
                defaultSort={{ key: 'time', dir: 'desc' }}
                dense
                hidePaginationWhenSingle
                emptyTitle={t('ocpp.station.noMessages')}
              />
            </div>
          )}
        </Section>
      </div>

      <UnsavedBar dirty={form.dirty && mayConfigure} onSave={save} onDiscard={form.reset} />

      <Modal
        open={payloadOf !== null}
        onClose={() => setPayloadOf(null)}
        size="md"
        title={t('ocpp.messageDetail')}
        description={payloadOf ? `${payloadOf.action} · ${payloadOf.uniqueId}` : undefined}
      >
        <pre
          dir="ltr"
          className="eg-scroll max-h-[50vh] overflow-auto rounded-[9px] border border-ink-200 bg-ink-50 p-3 text-[12px] leading-relaxed text-ink-800"
        >
          {payloadOf ? JSON.stringify(payloadOf.payload, null, 2) : ''}
        </pre>
      </Modal>
    </>
  );
}
