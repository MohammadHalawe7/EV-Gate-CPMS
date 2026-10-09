/* =============================================================================
 * Charging station detail.
 *
 * Five tabs in the order an operator needs them: is it healthy, what is
 * plugged into it, how is it configured, how does it talk to us, and what
 * changed. Everything that is *about the unit* is on Overview; everything
 * that is a *decision* is behind one of the other tabs.
 *
 * The commissioning banner is the deliberate part. A station exists as a
 * record before the hardware ever connects, and most systems leave that gap
 * invisible — so the one thing the installer needs (identity, endpoint) is
 * the first thing on the page until the first BootNotification lands.
 * ========================================================================== */

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Copy,
  Cpu,
  MapPin,
  Pencil,
  PlugZap,
  Power,
  Server,
  Trash2,
  Wrench,
  Zap,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { PageHeader, MetaItem } from '@/components/layout/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Menu, type MenuItem } from '@/components/ui/Menu';
import { ConfirmDialog } from '@/components/ui/Overlay';
import { DetailList, Panel, ProgressBar } from '@/components/ui/Surface';
import { Alert } from '@/components/ui/Alert';
import { ErrorState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { Money } from '@/components/common';
import { formatDate, formatNumber, formatRelative } from '@/lib/utils';
import {
  networkActions,
  usePaymentResolver,
  useStationDetail,
  useTariffResolver,
} from '@/data/networkStore';
import { APP_ROUTES } from '@/app/navigation';
import { PRIVILEGES } from '@/app/session';
import { Can } from '@/app/guards';
import { ConnectorChip, CountRow, Section, Stat, Timeline } from '../components/primitives';
import { StationEditDrawer } from '../components/StationEditDrawer';
import { StationHardwareTab } from '../components/StationHardwareTab';
import { StationConfigTab } from '../components/StationConfigTab';
import { StationOcppTab } from '../components/StationOcppTab';

type TabKey = 'overview' | 'hardware' | 'configuration' | 'ocpp' | 'activity';

export function StationDetailPage() {
  const { stationId } = useParams();
  const { t, ln, locale } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const detail = useStationDetail(stationId);
  const resolveTariffFor = useTariffResolver();
  const resolvePaymentFor = usePaymentResolver();

  const [tab, setTab] = useState<TabKey>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [decommissionOpen, setDecommissionOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  if (!detail) {
    return (
      <ErrorState
        kind="generic"
        title={t('stn.empty')}
        description={t('stn.emptyDesc')}
        action={
          <Link to={APP_ROUTES.stations}>
            <Button variant="primary" size="sm">
              {t('stn.title')}
            </Button>
          </Link>
        }
      />
    );
  }

  const { station, location, profile, evses, connectors, messages, commands, activity } = detail;

  const waiting = station.state === 'Provisioning' || station.state === 'Draft';
  /* Telemetry only means something once the charger has reported in. */
  const reported = station.lastBootAt !== null;
  const installedKw = evses.reduce((n, e) => n + e.maxPowerKw, 0);
  const counts = {
    available: connectors.filter((c) => c.status === 'Available').length,
    charging: connectors.filter((c) => c.status === 'Charging').length,
    faulted: connectors.filter((c) => c.status === 'Faulted').length,
    unavailable: connectors.filter((c) => c.status === 'Unavailable').length,
  };
  const faulted = connectors.filter((c) => c.status === 'Faulted');
  const lifetimeKwh = connectors.reduce((n, c) => n + c.lifetimeKwh, 0);
  const lifetimeSessions = connectors.reduce((n, c) => n + c.lifetimeSessions, 0);

  const tariff = resolveTariffFor({ stationId: station.id });
  const payment = resolvePaymentFor(station.locationId);

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t('common.copied'));
    } catch {
      /* clipboard unavailable — nothing useful to report */
    }
  }

  const stateItems: MenuItem[] = [
    ...(station.state !== 'Online' && !waiting
      ? [
          {
            key: 'online',
            label: t('stn.state.setOnline'),
            icon: <Power className="h-3.5 w-3.5" />,
            onSelect: () => networkActions.setStationState(station.id, 'Online'),
          },
        ]
      : []),
    ...(station.state !== 'Maintenance'
      ? [
          {
            key: 'maintenance',
            label: t('stn.state.setMaintenance'),
            icon: <Wrench className="h-3.5 w-3.5" />,
            onSelect: () => networkActions.setStationState(station.id, 'Maintenance'),
          },
        ]
      : []),
    ...(station.state !== 'Offline' && !waiting
      ? [
          {
            key: 'offline',
            label: t('stn.state.setOffline'),
            onSelect: () => networkActions.setStationState(station.id, 'Offline'),
          },
        ]
      : []),
    ...(station.state !== 'Decommissioned'
      ? [
          {
            key: 'decommission',
            label: t('stn.state.decommission'),
            danger: true,
            separatorBefore: true,
            onSelect: () => setDecommissionOpen(true),
          },
        ]
      : []),
    {
      key: 'remove',
      label: t('common.delete'),
      icon: <Trash2 className="h-3.5 w-3.5" />,
      danger: true,
      separatorBefore: station.state === 'Decommissioned',
      onSelect: () => setRemoveOpen(true),
    },
  ];

  const tabs = [
    { key: 'overview' as const, label: t('stn.tab.overview') },
    { key: 'hardware' as const, label: t('stn.tab.hardware'), count: connectors.length },
    { key: 'configuration' as const, label: t('stn.tab.configuration') },
    { key: 'ocpp' as const, label: t('stn.tab.ocpp'), count: messages.length },
    { key: 'activity' as const, label: t('stn.tab.activity') },
  ];

  return (
    <>
      <PageHeader
        crumbs={[
          { label: t('stn.title'), to: APP_ROUTES.stations },
          ...(location ? [{ label: ln(location), to: APP_ROUTES.location(location.id) }] : []),
          { label: ln(station) },
        ]}
        title={ln(station)}
        description={
          <span dir="ltr" className="font-mono text-[12.5px]">
            {station.code} · {station.chargePointId}
          </span>
        }
        meta={
          <>
            {location && (
              <MetaItem
                label={t('stn.col.location')}
                value={
                  <Link to={APP_ROUTES.location(location.id)} className="hover:text-brand-800">
                    {ln(location)}
                  </Link>
                }
                icon={<MapPin />}
              />
            )}
            {profile && (
              <MetaItem
                label={t('stn.col.hardware')}
                value={
                  <Link to={APP_ROUTES.hardwareProfile(profile.id)} className="hover:text-brand-800">
                    {ln(profile)}
                  </Link>
                }
                icon={<Server />}
              />
            )}
            <MetaItem label={t('stn.col.power')} value={`${formatNumber(installedKw)} kW`} icon={<Zap />} />
            <MetaItem label={t('stn.col.ocpp')} value={station.ocppVersion} icon={<Cpu />} />
            <StatusBadge
              status={station.state}
              label={t(`status.${station.state}` as never)}
              size="sm"
              pulse={station.state === 'Faulted'}
            />
          </>
        }
        actions={
          <Can do={PRIVILEGES.stationsManage}>
            <Button icon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>
              {t('common.edit')}
            </Button>
            <Menu items={stateItems} width={232} />
          </Can>
        }
      />

      {/* ---- Commissioning ------------------------------------------------- */}
      {waiting && (
        <Panel className="mb-4 border-accent-500/50 bg-accent-50">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-[14px] font-semibold text-brand-900">{t('stn.provisioningTitle')}</h3>
              <p className="mt-1 max-w-prose text-[12.5px] text-ink-600">{t('stn.provisioningBody')}</p>

              <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  { label: t('stn.field.chargePointId'), value: station.chargePointId, hint: t('ocpp.copyIdentity') },
                  { label: t('ocpp.station.endpoint'), value: station.config.ocpp.endpointUrl, hint: t('ocpp.copyEndpoint') },
                ].map((row) => (
                  <div key={row.label} className="min-w-0">
                    <dt className="mb-1 text-[11.5px] font-medium uppercase tracking-wide text-ink-400">
                      {row.label}
                    </dt>
                    <dd className="flex items-center gap-2">
                      <code
                        dir="ltr"
                        className="min-w-0 flex-1 truncate rounded-[7px] border border-ink-200 bg-white px-2.5 py-1.5 font-mono text-[12px] text-ink-900"
                      >
                        {row.value}
                      </code>
                      <Button
                        size="xs"
                        icon={<Copy className="h-3.5 w-3.5" />}
                        aria-label={row.hint}
                        title={row.hint}
                        onClick={() => copy(row.value)}
                      />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <Can do={PRIVILEGES.stationsCommission}>
              <Button
                variant="primary"
                icon={<PlugZap className="h-4 w-4" />}
                onClick={() => {
                  networkActions.simulateBoot(station.id);
                  toast.success(t('stn.bootedToast'), t('stn.bootedToastDesc'));
                }}
              >
                {t('stn.simulateBoot')}
              </Button>
            </Can>
          </div>
        </Panel>
      )}

      {faulted.length > 0 && (
        <div className="mb-4">
          <Alert tone="danger" title={t('dash.attentionTitle')}>
            <span className="flex flex-wrap items-center gap-2">
              {faulted.map((connector) => (
                <Badge key={connector.id} tone="danger" size="sm">
                  #{connector.connectorNumber} · {connector.errorCode ?? t('status.Faulted')}
                </Badge>
              ))}
            </span>
          </Alert>
        </div>
      )}

      <Tabs items={tabs} value={tab} onChange={setTab} className="mb-4" />

      {/* ---- Overview ------------------------------------------------------ */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
          <Section className="xl:col-span-2" title={t('stn.section.health')} subtitle={t('ocpp.station.timingHint')}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {/* A station that has never booted has no telemetry — saying so is
                  more useful than printing a number nothing measured. */}
              {reported ? (
                <>
                  <div className="min-w-0">
                    <div className="mb-1.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-400">
                      {t('stn.uptime')}
                    </div>
                    <div className="tnum mb-1.5 text-[18px] font-semibold text-ink-900">{station.uptimePct}%</div>
                    <ProgressBar
                      value={station.uptimePct}
                      tone={station.uptimePct >= 98 ? 'success' : station.uptimePct >= 90 ? 'warning' : 'danger'}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-400">
                      {t('stn.signal')}
                    </div>
                    <div className="tnum mb-1.5 text-[18px] font-semibold text-ink-900">{station.networkSignalPct}%</div>
                    <ProgressBar
                      value={station.networkSignalPct}
                      tone={station.networkSignalPct >= 60 ? 'brand' : 'warning'}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Stat label={t('stn.uptime')} value="—" tone="muted" hint={t('stn.provisioningTitle')} />
                  <Stat label={t('stn.signal')} value="—" tone="muted" />
                </>
              )}
              <Stat
                label={t('stn.lastHeartbeat')}
                value={station.lastHeartbeatAt ? formatRelative(station.lastHeartbeatAt, locale) : t('common.never')}
                tone={station.lastHeartbeatAt ? 'default' : 'muted'}
              />
              <Stat
                label={t('stn.lastBoot')}
                value={station.lastBootAt ? formatRelative(station.lastBootAt, locale) : t('common.never')}
                tone={station.lastBootAt ? 'default' : 'muted'}
              />
            </div>

            <div className="mt-4 border-t border-ink-100 pt-4">
              <div className="mb-2.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-400">
                {t('evse.title')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {connectors.map((connector) => (
                  <ConnectorChip
                    key={connector.id}
                    number={connector.connectorNumber}
                    type={t(`ctype.${connector.type}` as never)}
                    status={connector.status}
                    powerKw={connector.maxPowerKw}
                    onClick={() => setTab('hardware')}
                  />
                ))}
                {connectors.length === 0 && (
                  <span className="text-[12.5px] text-ink-400">{t('conn.empty')}</span>
                )}
              </div>
              {connectors.length > 0 && (
                <div className="mt-3">
                  <CountRow
                    items={[
                      { label: t('status.Available'), value: counts.available, tone: 'success' },
                      { label: t('status.Charging'), value: counts.charging, tone: 'info' },
                      { label: t('status.Unavailable'), value: counts.unavailable, tone: 'neutral' },
                      { label: t('status.Faulted'), value: counts.faulted, tone: 'danger' },
                    ]}
                  />
                </div>
              )}
            </div>
          </Section>

          {/* ---- Pricing summary -------------------------------------------- */}
          <Section title={t('loc.tab.pricing')} subtitle={t('cfg.tariffHint')}>
            <div className="space-y-3">
              <div>
                <div className="mb-1 text-[11.5px] font-medium uppercase tracking-wide text-ink-400">
                  {t('evse.col.tariff')}
                </div>
                {tariff.tariff ? (
                  <>
                    <Link
                      to={APP_ROUTES.tariff(tariff.tariff.id)}
                      className="text-[13.5px] font-semibold text-ink-900 hover:text-brand-800"
                    >
                      {ln(tariff.tariff)}
                    </Link>
                    <div className="tnum mt-0.5 text-[12.5px] text-ink-600">
                      <Money value={tariff.tariff.basePricePerKwh} currency={tariff.tariff.currency} />
                      <span className="text-ink-400"> /kWh</span>
                    </div>
                    <div className="mt-1 text-[11.5px] text-ink-400">
                      {tariff.source === 'station'
                        ? t('inherit.overridden')
                        : t('inherit.from', { level: t(`inherit.${tariff.source}` as never) })}
                    </div>
                  </>
                ) : (
                  <span className="text-[12.5px] text-ink-400">{t('inherit.none')}</span>
                )}
              </div>

              <div className="border-t border-ink-100 pt-3">
                <div className="mb-1.5 text-[11.5px] font-medium uppercase tracking-wide text-ink-400">
                  {t('pricing.paymentTitle')}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {payment.policy.methods.map((method) => (
                    <Badge key={method} tone="neutral" size="sm">
                      {t(`pm.${method}` as never)}
                    </Badge>
                  ))}
                </div>
                <div className="mt-1.5 text-[11.5px] text-ink-400">
                  {payment.source === 'location' ? t('inherit.overridden') : t('pricing.inheritPayment')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-ink-100 pt-3">
                <Stat label={t('loc.overview.energy')} value={`${formatNumber(lifetimeKwh)} kWh`} />
                <Stat label={t('loc.overview.sessions')} value={formatNumber(lifetimeSessions)} />
              </div>
            </div>
          </Section>

          {/* ---- Identity ---------------------------------------------------- */}
          <Section className="xl:col-span-3" title={t('stn.section.identity')}>
            <DetailList
              columns={3}
              items={[
                { label: t('common.code'), value: <span className="tnum">{station.code}</span> },
                { label: t('stn.field.serial'), value: <span dir="ltr">{station.serialNumber}</span> },
                { label: t('stn.field.firmware'), value: <span className="tnum" dir="ltr">{station.firmwareVersion}</span> },
                {
                  label: t('stn.field.profile'),
                  value: profile ? (
                    <Link to={APP_ROUTES.hardwareProfile(profile.id)} className="hover:text-brand-800">
                      {ln(profile)}
                    </Link>
                  ) : (
                    '—'
                  ),
                },
                { label: t('stn.field.installedAt'), value: formatDate(station.installedAt, locale === 'ar' ? 'ar-AE' : 'en-AE') },
                { label: t('stn.field.warranty'), value: formatDate(station.warrantyEndsAt, locale === 'ar' ? 'ar-AE' : 'en-AE') },
                {
                  label: t('stn.commissionedAt'),
                  value: station.commissionedAt
                    ? formatDate(station.commissionedAt, locale === 'ar' ? 'ar-AE' : 'en-AE')
                    : '—',
                },
                { label: t('cfg.visibility'), value: t(`access.${station.config.access.visibility}` as never) },
                {
                  label: t('cfg.authMethods'),
                  value: (
                    <span className="flex flex-wrap gap-1">
                      {station.config.access.authMethods.map((method) => (
                        <Badge key={method} tone="neutral" size="sm">
                          {t(`authm.${method}` as never)}
                        </Badge>
                      ))}
                      {station.config.access.authMethods.length === 0 && (
                        <span className="text-ink-400">{t('common.none')}</span>
                      )}
                    </span>
                  ),
                },
                ...(station.notes ? [{ label: t('stn.field.notes'), value: station.notes, span: true }] : []),
              ]}
            />
          </Section>
        </div>
      )}

      {tab === 'hardware' && (
        <StationHardwareTab station={station} profile={profile} evses={evses} connectors={connectors} />
      )}

      {tab === 'configuration' && <StationConfigTab station={station} profile={profile} />}

      {tab === 'ocpp' && <StationOcppTab station={station} messages={messages} commands={commands} />}

      {tab === 'activity' && (
        <Section title={t('common.activity')} subtitle={t('dash.activityTitle')}>
          <Timeline
            items={activity.map((entry) => ({
              id: entry.id,
              action: entry.action,
              detail: entry.detail,
              actorName: entry.actorName,
              at: entry.at,
              tone: entry.tone,
            }))}
            emptyLabel={t('common.noResults')}
          />
        </Section>
      )}

      <StationEditDrawer open={editOpen} onClose={() => setEditOpen(false)} station={station} />

      <ConfirmDialog
        open={decommissionOpen}
        onClose={() => setDecommissionOpen(false)}
        onConfirm={() => {
          networkActions.setStationState(station.id, 'Decommissioned');
          toast.success(t('toast.updated'), station.code);
          setDecommissionOpen(false);
        }}
        title={t('stn.decommissionTitle')}
        message={t('stn.decommissionBody', { code: station.code })}
        confirmLabel={t('stn.state.decommission')}
        cancelLabel={t('common.cancel')}
      />

      <ConfirmDialog
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => {
          networkActions.removeStation(station.id);
          toast.success(t('toast.deleted'), station.code);
          navigate(APP_ROUTES.stations);
        }}
        title={t('stn.removeTitle')}
        message={t('stn.removeBody', { code: station.code })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
      />
    </>
  );
}
