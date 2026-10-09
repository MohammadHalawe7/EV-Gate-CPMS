/* =============================================================================
 * Station → EVSEs & connectors.
 *
 * The physical truth of the unit. Layout is not editable here on purpose: it
 * comes from the hardware profile, and letting an operator reshape one
 * station's bays would quietly break the promise the profile makes. What *is*
 * editable is operational: a connector's reported status and the tariff an
 * EVSE or a single plug carries.
 * ========================================================================== */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleDot, Tags } from 'lucide-react';
import { useI18n } from '@/i18n';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Field, Select } from '@/components/ui/Field';
import { Menu } from '@/components/ui/Menu';
import { Modal } from '@/components/ui/Overlay';
import { useToast } from '@/components/ui/Toast';
import { formatNumber, formatRelative } from '@/lib/utils';
import { networkActions, useNetwork, useTariffResolver } from '@/data/networkStore';
import { PRIVILEGES, useSession } from '@/app/session';
import { APP_ROUTES } from '@/app/navigation';
import {
  CONNECTOR_STATUSES,
  type ChargingStation,
  type Connector,
  type Evse,
  type HardwareProfile,
} from '@/domain/network';
import { ConnectorDot, InheritedFrom, Section, Stat } from './primitives';

export function StationHardwareTab({
  station,
  profile,
  evses,
  connectors,
}: {
  station: ChargingStation;
  profile: HardwareProfile | undefined;
  evses: Evse[];
  connectors: Connector[];
}) {
  const { t, ln, locale } = useI18n();
  const net = useNetwork();
  const toast = useToast();
  const { can } = useSession();
  const resolveFor = useTariffResolver();
  const [tariffTarget, setTariffTarget] = useState<Connector | null>(null);
  const [tariffValue, setTariffValue] = useState('');

  const mayManage = can(PRIVILEGES.stationsManage);
  const mayPrice = can(PRIVILEGES.tariffsManage);
  const activeTariffs = net.tariffs.filter((tf) => tf.status === 'Active');

  function openConnectorTariff(connector: Connector) {
    setTariffTarget(connector);
    setTariffValue(connector.tariffId ?? '');
  }

  function applyConnectorTariff() {
    if (!tariffTarget) return;
    networkActions.assignTariff('connector', [tariffTarget.id], tariffValue === '' ? null : tariffValue);
    toast.success(t('conn.bulkDone'));
    setTariffTarget(null);
  }

  function connectorColumns(): Column<Connector>[] {
    return [
      {
        key: 'connector',
        header: t('evse.col.connector'),
        width: '120px',
        sortValue: (row) => row.connectorNumber,
        render: (row) => (
          <span className="flex items-center gap-2">
            <ConnectorDot status={row.status} />
            <span className="tnum text-[12.5px] font-medium text-ink-900">#{row.connectorNumber}</span>
          </span>
        ),
      },
      {
        key: 'type',
        header: t('evse.col.type'),
        width: '170px',
        sortValue: (row) => row.type,
        render: (row) => (
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[12.5px] text-ink-900">{t(`ctype.${row.type}` as never)}</span>
            <span className="truncate text-[11.5px] text-ink-500">
              {row.cableAttached ? t('evse.cable') : t('evse.socket')}
            </span>
          </span>
        ),
      },
      {
        key: 'power',
        header: t('evse.col.power'),
        align: 'end',
        width: '100px',
        sortValue: (row) => row.maxPowerKw,
        render: (row) => <span className="tnum text-[12.5px] text-ink-800">{formatNumber(row.maxPowerKw)} kW</span>,
      },
      {
        key: 'current',
        header: t('evse.col.current'),
        align: 'end',
        width: '100px',
        sortValue: (row) => row.maxAmperage,
        render: (row) => (
          <span className="tnum text-[12.5px] text-ink-600" dir="ltr">
            {row.maxAmperage} A · {row.voltage} V
          </span>
        ),
      },
      {
        key: 'tariff',
        header: t('evse.col.tariff'),
        width: '170px',
        render: (row) => {
          const resolved = resolveFor({ connectorId: row.id });
          return (
            <span className="flex min-w-0 flex-col">
              {resolved.tariff ? (
                <Link
                  to={APP_ROUTES.tariff(resolved.tariff.id)}
                  className="truncate text-[12.5px] text-ink-800 hover:text-brand-800"
                >
                  {ln(resolved.tariff)}
                </Link>
              ) : (
                <span className="text-[12px] text-ink-400">{t('inherit.none')}</span>
              )}
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
        width: '130px',
        sortValue: (row) => row.lifetimeKwh,
        render: (row) => (
          <span className="flex flex-col items-end">
            <span className="tnum text-[12.5px] text-ink-900">{formatNumber(row.lifetimeKwh)} kWh</span>
            <span className="tnum text-[11px] text-ink-400">{formatNumber(row.lifetimeSessions)}</span>
          </span>
        ),
      },
      {
        key: 'status',
        header: t('evse.col.status'),
        width: '150px',
        align: 'end',
        sortValue: (row) => row.status,
        render: (row) => (
          <span className="flex flex-col items-end gap-1">
            <StatusBadge
              status={row.status}
              label={t(`status.${row.status}` as never)}
              size="sm"
              pulse={row.status === 'Charging'}
            />
            <span className="text-[11px] text-ink-400">{formatRelative(row.lastStatusAt, locale)}</span>
            {row.errorCode && (
              <Badge tone="danger" size="sm">
                {row.errorCode}
              </Badge>
            )}
          </span>
        ),
      },
      ...(mayManage || mayPrice
        ? [
            {
              key: 'actions',
              header: '',
              width: '48px',
              align: 'end' as const,
              render: (row: Connector) => (
                <Menu
                  width={224}
                  items={[
                    ...(mayPrice
                      ? [
                          {
                            key: 'tariff',
                            label: t('inherit.override'),
                            icon: <Tags className="h-3.5 w-3.5" />,
                            onSelect: () => openConnectorTariff(row),
                          },
                        ]
                      : []),
                    ...(mayManage
                      ? CONNECTOR_STATUSES.filter((s) => s !== row.status).map((status, index) => ({
                          key: `status-${status}`,
                          label: `${t('evse.setStatus')}: ${t(`status.${status}` as never)}`,
                          icon: <CircleDot className="h-3.5 w-3.5" />,
                          separatorBefore: index === 0 && mayPrice,
                          onSelect: () => networkActions.setConnectorStatus(row.id, status),
                        }))
                      : []),
                  ]}
                />
              ),
            } as Column<Connector>,
          ]
        : []),
    ];
  }

  return (
    <div className="space-y-4">
      {profile && (
        <Alert tone="info" title={t('evse.fromProfile', { profile: ln(profile) })}>
          <span className="flex flex-wrap items-center gap-2">
            {t('evse.fromProfileHint')}
            <Link to={APP_ROUTES.hardwareProfile(profile.id)} className="font-medium text-brand-800 underline">
              {t('common.open')}
            </Link>
          </span>
        </Alert>
      )}

      {evses.map((evse) => {
        const own = evse.tariffId !== null;
        const resolved = resolveFor({ evseId: evse.id });
        const rows = connectors.filter((c) => c.evseId === evse.id);
        const charging = rows.filter((c) => c.status === 'Charging').length;

        return (
          <Section
            key={evse.id}
            padded={false}
            title={
              <span className="flex flex-wrap items-center gap-2">
                <span className="rounded-[6px] bg-brand-800 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {t('evse.evse', { ordinal: evse.ordinal })}
                </span>
                <span className="text-[12.5px] font-normal text-ink-500" dir="ltr">
                  {evse.evseCode}
                </span>
              </span>
            }
            subtitle={`${formatNumber(evse.maxPowerKw)} kW · ${t(`power.${evse.powerType}` as never)}`}
            action={
              <StatusBadge status={evse.status} label={t(`status.${evse.status}` as never)} size="sm" />
            }
          >
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-ink-100 px-4 py-3">
              <Stat label={t('loc.col.connectors')} value={rows.length} />
              <Stat label={t('status.Charging')} value={charging} tone={charging > 0 ? 'success' : 'muted'} />
              <div className="min-w-0">
                <div className="mb-1 text-[11.5px] font-medium uppercase tracking-wide text-ink-400">
                  {t('evse.col.tariff')}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {own ? (
                    <div className="w-[200px]">
                      <Select
                        aria-label={t('evse.col.tariff')}
                        value={evse.tariffId ?? ''}
                        onChange={(e) => networkActions.assignTariff('evse', [evse.id], e.target.value || null)}
                        disabled={!mayPrice}
                      >
                        {activeTariffs.map((tf) => (
                          <option key={tf.id} value={tf.id}>
                            {ln(tf)}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ) : resolved.tariff ? (
                    <Link
                      to={APP_ROUTES.tariff(resolved.tariff.id)}
                      className="text-[12.5px] text-ink-800 hover:text-brand-800"
                    >
                      {ln(resolved.tariff)}
                    </Link>
                  ) : (
                    <span className="text-[12px] text-ink-400">{t('inherit.none')}</span>
                  )}
                  <InheritedFrom
                    source={resolved.source}
                    own={own}
                    onOverride={
                      mayPrice
                        ? () =>
                            networkActions.assignTariff(
                              'evse',
                              [evse.id],
                              resolved.tariffId ?? activeTariffs[0]?.id ?? null,
                            )
                        : undefined
                    }
                    onClear={mayPrice ? () => networkActions.assignTariff('evse', [evse.id], null) : undefined}
                  />
                </div>
              </div>
            </div>

            <div className="[&>div]:rounded-none [&>div]:border-0 [&>div]:border-t">
              <DataTable
                rows={rows}
                columns={connectorColumns()}
                getRowId={(row) => row.id}
                defaultSort={{ key: 'connector', dir: 'asc' }}
                dense
                hidePaginationWhenSingle
                emptyTitle={t('conn.empty')}
              />
            </div>
          </Section>
        );
      })}

      {station.state === 'Draft' && evses.length === 0 && (
        <Alert tone="warning" title={t('stn.provisioningTitle')}>
          {t('stn.provisioningBody')}
        </Alert>
      )}

      <Modal
        open={tariffTarget !== null}
        onClose={() => setTariffTarget(null)}
        size="sm"
        title={t('conn.bulkTariffTitle', { count: 1 })}
        description={t('conn.bulkTariffBody')}
        footer={
          <>
            <Button onClick={() => setTariffTarget(null)}>{t('common.cancel')}</Button>
            <Button variant="primary" onClick={applyConnectorTariff}>
              {t('common.apply')}
            </Button>
          </>
        }
      >
        <Field label={t('evse.col.tariff')} hint={t('cfg.tariffHint')} htmlFor="connector-tariff">
          <Select id="connector-tariff" value={tariffValue} onChange={(e) => setTariffValue(e.target.value)}>
            <option value="">{t('common.inherit')}</option>
            {activeTariffs.map((tf) => (
              <option key={tf.id} value={tf.id}>
                {ln(tf)}
              </option>
            ))}
          </Select>
        </Field>
      </Modal>
    </div>
  );
}
