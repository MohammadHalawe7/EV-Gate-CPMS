/* =============================================================================
 * OCPP → Commands.
 *
 * Sending a command is the one place in this module where the operator acts
 * on hardware in the real world, so the dialogue only asks for the fields the
 * chosen command actually carries, and it says plainly when the target is not
 * connected instead of letting the request fail silently thirty seconds later.
 * ========================================================================== */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Terminal } from 'lucide-react';
import { useI18n } from '@/i18n';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/Surface';
import { Field, Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Overlay';
import { useToast } from '@/components/ui/Toast';
import { FilterBar, useFilters } from '@/components/common';
import { formatNumber, formatRelative } from '@/lib/utils';
import { networkActions, useNetwork } from '@/data/networkStore';
import { PRIVILEGES, useSession } from '@/app/session';
import { Can } from '@/app/guards';
import { APP_ROUTES } from '@/app/navigation';
import {
  COMMAND_STATUSES,
  OCPP_ACTIONS_OUT,
  type OcppCommand,
  type OcppOutboundAction,
} from '@/domain/network';

/** Which extra inputs each command needs. Everything else sends an empty payload. */
const NEEDS: Partial<Record<OcppOutboundAction, ('connector' | 'resetType' | 'availability' | 'keyValue' | 'message')[]>> = {
  Reset: ['resetType'],
  RemoteStartTransaction: ['connector'],
  RemoteStopTransaction: ['connector'],
  UnlockConnector: ['connector'],
  ChangeAvailability: ['connector', 'availability'],
  ChangeConfiguration: ['keyValue'],
  TriggerMessage: ['message'],
  ReserveNow: ['connector'],
  CancelReservation: ['connector'],
};

const TRIGGERABLE = [
  'BootNotification',
  'Heartbeat',
  'StatusNotification',
  'MeterValues',
  'DiagnosticsStatusNotification',
  'FirmwareStatusNotification',
];

export function OcppCommandsPage() {
  const { t, ln, locale } = useI18n();
  const net = useNetwork();
  const toast = useToast();
  const { persona } = useSession();
  const [sendOpen, setSendOpen] = useState(false);

  const [form, setForm] = useState({
    stationId: '',
    action: 'Reset' as OcppOutboundAction,
    connectorId: '1',
    resetType: 'Soft',
    availability: 'Inoperative',
    key: 'HeartbeatInterval',
    value: '300',
    message: 'StatusNotification',
  });

  const target = net.stations.find((s) => s.id === form.stationId);
  const needs = NEEDS[form.action] ?? [];
  const offline = target !== undefined && target.state !== 'Online';

  const filters = useFilters([
    {
      key: 'action',
      label: t('ocpp.cmd.action'),
      width: 'w-[190px]',
      options: OCPP_ACTIONS_OUT.map((a) => ({ value: a, label: a })),
    },
    {
      key: 'stationId',
      label: t('ocpp.filter.station'),
      width: 'w-[180px]',
      options: net.stations.map((s) => ({ value: s.id, label: s.chargePointId })),
    },
    {
      key: 'status',
      label: t('common.status'),
      width: 'w-[140px]',
      options: COMMAND_STATUSES.map((s) => ({ value: s, label: t(`status.${s}` as never) })),
    },
  ]);

  const rows = useMemo(
    () =>
      net.commands.filter((command) =>
        filters.matches({ action: command.action, stationId: command.stationId, status: command.status }),
      ),
    [net.commands, filters],
  );

  function send() {
    if (!form.stationId) return;
    const payload: Record<string, unknown> = {};
    if (needs.includes('connector')) payload.connectorId = Number(form.connectorId);
    if (needs.includes('resetType')) payload.type = form.resetType;
    if (needs.includes('availability')) payload.type = form.availability;
    if (needs.includes('keyValue')) {
      payload.key = form.key;
      payload.value = form.value;
    }
    if (needs.includes('message')) payload.requestedMessage = form.message;

    networkActions.sendCommand(form.stationId, form.action, payload, persona?.name ?? 'You');
    toast.info(t('ocpp.cmd.sent'), t('ocpp.cmd.sentDesc'));
    setSendOpen(false);
  }

  const columns: Column<OcppCommand>[] = [
    {
      key: 'action',
      header: t('ocpp.cmd.action'),
      sortValue: (row) => row.action,
      render: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[12.5px] font-medium text-ink-900">{row.action}</span>
          {Object.keys(row.payload).length > 0 && (
            <span className="truncate font-mono text-[11px] text-ink-400" dir="ltr">
              {Object.entries(row.payload)
                .map(([key, value]) => `${key}=${String(value)}`)
                .join(' · ')}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'station',
      header: t('ocpp.cmd.station'),
      width: '200px',
      sortValue: (row) => row.chargePointId,
      render: (row) => {
        const station = net.stations.find((s) => s.id === row.stationId);
        return station ? (
          <Link to={APP_ROUTES.station(station.id)} className="flex min-w-0 flex-col hover:text-brand-800">
            <span className="truncate text-[12.5px] text-ink-800">{ln(station)}</span>
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
      header: t('ocpp.cmd.col.requested'),
      width: '140px',
      sortValue: (row) => row.createdAt,
      render: (row) => <span className="text-[12px] text-ink-500">{formatRelative(row.createdAt, locale)}</span>,
    },
    {
      key: 'by',
      header: t('ocpp.cmd.col.by'),
      width: '150px',
      sortValue: (row) => row.requestedByName,
      render: (row) => <span className="truncate text-[12.5px] text-ink-700">{row.requestedByName}</span>,
    },
    {
      key: 'duration',
      header: t('ocpp.cmd.col.duration'),
      align: 'end',
      width: '110px',
      sortValue: (row) => row.durationMs ?? 0,
      render: (row) =>
        row.durationMs === null ? (
          <span className="text-[12px] text-ink-400">—</span>
        ) : (
          <span className="tnum text-[12px] text-ink-600">{formatNumber(row.durationMs)} ms</span>
        ),
    },
    {
      key: 'status',
      header: t('common.status'),
      align: 'end',
      width: '150px',
      sortValue: (row) => row.status,
      render: (row) => (
        <span className="flex flex-col items-end gap-1">
          <StatusBadge status={row.status} label={t(`status.${row.status}` as never)} size="sm" />
          {row.error && (
            <Badge tone="danger" size="sm">
              {row.error}
            </Badge>
          )}
        </span>
      ),
    },
  ];

  return (
    <>
      {net.commands.length === 0 ? (
        <EmptyState
          icon={<Terminal className="h-5 w-5" />}
          title={t('ocpp.cmd.empty')}
          description={t('ocpp.cmd.emptyDesc')}
          action={
            <Can do={PRIVILEGES.ocppOperate}>
              <Button variant="primary" onClick={() => setSendOpen(true)}>
                {t('ocpp.cmd.send')}
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
          searchText={(row) => `${row.action} ${row.chargePointId} ${row.requestedByName}`}
          defaultSort={{ key: 'requested', dir: 'desc' }}
          pageSize={15}
          emptyTitle={t('common.noResults')}
          emptyDescription={t('common.noResultsDesc')}
          toolbar={
            <FilterBar
              state={filters}
              placeholder={t('ocpp.cmd.title')}
              actions={
                <Can do={PRIVILEGES.ocppOperate}>
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Send className="h-3.5 w-3.5" />}
                    onClick={() => setSendOpen(true)}
                  >
                    {t('ocpp.cmd.send')}
                  </Button>
                </Can>
              }
            />
          }
        />
      )}

      <Modal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        size="md"
        title={t('ocpp.cmd.sendTitle')}
        description={t('ocpp.cmd.sendHint')}
        footer={
          <>
            <Button onClick={() => setSendOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" onClick={send} disabled={!form.stationId} icon={<Send className="h-4 w-4" />}>
              {t('ocpp.cmd.send')}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('ocpp.cmd.station')} required htmlFor="cmd-station">
            <Select
              id="cmd-station"
              value={form.stationId}
              onChange={(e) => setForm((prev) => ({ ...prev, stationId: e.target.value }))}
            >
              <option value="">{t('ocpp.cfg.pickStation')}</option>
              {net.stations
                .filter((s) => s.state !== 'Decommissioned')
                .map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.chargePointId} — {station.name}
                  </option>
                ))}
            </Select>
          </Field>

          <Field label={t('ocpp.cmd.action')} htmlFor="cmd-action">
            <Select
              id="cmd-action"
              value={form.action}
              onChange={(e) => setForm((prev) => ({ ...prev, action: e.target.value as OcppOutboundAction }))}
            >
              {OCPP_ACTIONS_OUT.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </Select>
          </Field>

          {needs.includes('connector') && (
            <Field label={t('ocpp.cmd.connector')} htmlFor="cmd-connector">
              <Select
                id="cmd-connector"
                value={form.connectorId}
                onChange={(e) => setForm((prev) => ({ ...prev, connectorId: e.target.value }))}
              >
                <option value="0">0 — {t('common.all')}</option>
                {net.connectors
                  .filter((c) => c.stationId === form.stationId)
                  .map((connector) => (
                    <option key={connector.id} value={connector.connectorNumber}>
                      {connector.connectorNumber} — {t(`ctype.${connector.type}` as never)}
                    </option>
                  ))}
              </Select>
            </Field>
          )}

          {needs.includes('resetType') && (
            <Field label={t('ocpp.cmd.resetType')} htmlFor="cmd-reset">
              <Select
                id="cmd-reset"
                value={form.resetType}
                onChange={(e) => setForm((prev) => ({ ...prev, resetType: e.target.value }))}
              >
                <option value="Soft">Soft</option>
                <option value="Hard">Hard</option>
              </Select>
            </Field>
          )}

          {needs.includes('availability') && (
            <Field label={t('ocpp.cmd.availability')} htmlFor="cmd-availability">
              <Select
                id="cmd-availability"
                value={form.availability}
                onChange={(e) => setForm((prev) => ({ ...prev, availability: e.target.value }))}
              >
                <option value="Operative">Operative</option>
                <option value="Inoperative">Inoperative</option>
              </Select>
            </Field>
          )}

          {needs.includes('keyValue') && (
            <>
              <Field label={t('ocpp.cmd.key')} htmlFor="cmd-key">
                <Input
                  id="cmd-key"
                  value={form.key}
                  onChange={(e) => setForm((prev) => ({ ...prev, key: e.target.value }))}
                  dir="ltr"
                />
              </Field>
              <Field label={t('ocpp.cmd.value')} htmlFor="cmd-value">
                <Input
                  id="cmd-value"
                  value={form.value}
                  onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
                  dir="ltr"
                />
              </Field>
            </>
          )}

          {needs.includes('message') && (
            <Field label={t('ocpp.cmd.message')} htmlFor="cmd-message">
              <Select
                id="cmd-message"
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              >
                {TRIGGERABLE.map((message) => (
                  <option key={message} value={message}>
                    {message}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {offline && (
            <div className="sm:col-span-2">
              <Alert tone="warning">{t('ocpp.cmd.offlineWarning')}</Alert>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
