/* =============================================================================
 * Network overview — the landing page after sign-in.
 *
 * An operations dashboard answers three questions in order: is anything
 * broken, how busy are we, and what should I do next. The layout follows that
 * order rather than leading with a chart.
 * ========================================================================== */

import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  CircleGauge,
  MapPin,
  Plug,
  Plus,
  Server,
  Tags,
  Zap,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatTile } from '@/components/ui/StatTile';
import { EmptyState } from '@/components/ui/Surface';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DonutChart, BarList } from '@/components/charts';
import { formatCompact, formatNumber } from '@/lib/utils';
import {
  useLocationRollups,
  useNetwork,
  useNetworkStats,
} from '@/data/networkStore';
import { useSession } from '@/app/session';
import { APP_ROUTES } from '@/app/navigation';
import {
  CountRow,
  NextStepCard,
  RecordCell,
  Section,
  Timeline,
} from '../components/primitives';

export function DashboardPage() {
  const { t, ln, locale } = useI18n();
  const navigate = useNavigate();
  const net = useNetwork();
  const stats = useNetworkStats();
  const rollups = useLocationRollups();
  const { inScope, canAny } = useSession();

  const locations = inScope(net.locations, 'location');
  const stations = inScope(net.stations);

  /* Everything that is not doing its job, most urgent first. */
  const attention = useMemo(() => {
    const rows = [
      ...stations.filter((s) => s.state === 'Faulted').map((s) => ({ station: s, rank: 0 })),
      ...stations.filter((s) => s.state === 'Offline').map((s) => ({ station: s, rank: 1 })),
      ...stations.filter((s) => s.state === 'Provisioning').map((s) => ({ station: s, rank: 2 })),
      ...stations.filter((s) => s.state === 'Maintenance').map((s) => ({ station: s, rank: 3 })),
    ];
    return rows.sort((a, b) => a.rank - b.rank).slice(0, 7);
  }, [stations]);

  const statusData = [
    { label: 'Available', value: stats.available },
    { label: 'Charging', value: stats.charging },
    { label: 'Faulted', value: stats.faulted },
    { label: 'Unavailable', value: stats.unavailable },
    {
      label: 'Reserved',
      value: net.connectors.filter((c) => c.status === 'Reserved').length,
    },
  ].filter((d) => d.value > 0);

  const busiest = useMemo(
    () =>
      locations
        .map((l) => ({
          label: ln(l),
          value: rollups[l.id]?.charging ?? 0,
          sub: t('loc.col.connectors') + ': ' + (rollups[l.id]?.connectors ?? 0),
          href: APP_ROUTES.location(l.id),
        }))
        .filter((row) => row.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    [locations, rollups, ln, t],
  );

  return (
    <>
      <PageHeader title={t('dash.title')} description={t('dash.subtitle')} />

      {/* ---- Key figures ---------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile
          label={t('dash.kpi.locations')}
          value={locations.length}
          icon={<MapPin className="h-4 w-4" />}
          accent="brand"
          to={APP_ROUTES.locations}
          footer={`${locations.filter((l) => l.status === 'Active').length} ${t('status.Active').toLowerCase()}`}
        />
        <StatTile
          label={t('dash.kpi.stations')}
          value={stations.length}
          icon={<Zap className="h-4 w-4" />}
          accent="brand"
          to={APP_ROUTES.stations}
          footer={`${stations.filter((s) => s.state === 'Online').length} ${t('status.Online').toLowerCase()}`}
        />
        <StatTile
          label={t('dash.kpi.connectors')}
          value={stats.connectors}
          icon={<Plug className="h-4 w-4" />}
          accent="neutral"
          to={APP_ROUTES.connectors}
        />
        <StatTile
          label={t('dash.kpi.utilisation')}
          value={`${stats.utilisationPct}%`}
          icon={<BatteryCharging className="h-4 w-4" />}
          accent="info"
          footer={`${stats.charging} / ${stats.connectors - stats.unavailable}`}
        />
        <StatTile
          label={t('dash.kpi.availability')}
          value={`${stats.availabilityPct}%`}
          icon={<CircleGauge className="h-4 w-4" />}
          accent={stats.availabilityPct >= 95 ? 'success' : stats.availabilityPct >= 85 ? 'accent' : 'danger'}
        />
        <StatTile
          label={t('dash.kpi.energy')}
          value={formatCompact(stats.lifetimeKwh)}
          unit="kWh"
          icon={<Activity className="h-4 w-4" />}
          accent="plum"
          footer={`${formatCompact(stats.lifetimeSessions)} ${t('loc.overview.sessions').toLowerCase()}`}
        />
      </div>

      {/* ---- Attention first, then volume ---------------------------------- */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Section
          className="xl:col-span-2"
          title={t('dash.attentionTitle')}
          subtitle={t('dash.attentionSubtitle')}
          action={
            attention.length > 0 && (
              <Link to={APP_ROUTES.stations}>
                <Button size="xs">{t('common.viewAll')}</Button>
              </Link>
            )
          }
          padded={false}
        >
          {attention.length === 0 ? (
            <EmptyState
              compact
              icon={<Activity className="h-5 w-5" />}
              title={t('dash.attentionEmpty')}
              description={t('dash.attentionEmptyDesc')}
            />
          ) : (
            <ul className="divide-y divide-ink-100 border-t border-ink-100">
              {attention.map(({ station }) => {
                const location = net.locations.find((l) => l.id === station.locationId);
                return (
                  <li key={station.id}>
                    <Link
                      to={APP_ROUTES.station(station.id)}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-ink-50"
                    >
                      <span
                        className={
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] ' +
                          (station.state === 'Faulted'
                            ? 'bg-danger-50 text-danger-700'
                            : station.state === 'Offline'
                              ? 'bg-ink-100 text-ink-500'
                              : station.state === 'Provisioning'
                                ? 'bg-info-50 text-info-700'
                                : 'bg-warning-50 text-warning-700')
                        }
                      >
                        {station.state === 'Faulted' ? <AlertTriangle className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
                      </span>
                      <RecordCell title={ln(station)} subtitle={`${station.code} · ${location ? ln(location) : '—'}`} />
                      <span className="ms-auto shrink-0">
                        <StatusBadge status={station.state} label={t(`status.${station.state}` as never)} size="sm" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section title={t('dash.statusTitle')} subtitle={t('dash.statusSubtitle')}>
          {stats.connectors === 0 ? (
            <EmptyState compact title={t('conn.empty')} />
          ) : (
            <>
              <DonutChart
                useStatusColors
                data={statusData}
                size={150}
                centerLabel={t('dash.kpi.connectors')}
                centerValue={formatNumber(stats.connectors)}
              />
              <div className="mt-4 border-t border-ink-100 pt-3">
                <CountRow
                  items={[
                    { label: t('status.Available'), value: stats.available, tone: 'success' },
                    { label: t('status.Charging'), value: stats.charging, tone: 'info' },
                    { label: t('status.Faulted'), value: stats.faulted, tone: 'danger' },
                    { label: t('status.Unavailable'), value: stats.unavailable, tone: 'neutral' },
                  ]}
                />
              </div>
            </>
          )}
        </Section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Section title={t('dash.sitesTitle')} subtitle={t('dash.sitesSubtitle')}>
          {busiest.length === 0 ? (
            <p className="py-6 text-center text-[12.5px] text-ink-400">{t('dash.attentionEmptyDesc')}</p>
          ) : (
            <BarList items={busiest} />
          )}
        </Section>

        <Section title={t('dash.quickTitle')}>
          <div className="space-y-2">
            {canAny(['locations.manage']) && (
              <NextStepCard
                to={APP_ROUTES.locations}
                title={t('dash.quick.addLocation')}
                description={t('dash.quick.addLocationDesc')}
                icon={<Plus className="h-4 w-4" />}
              />
            )}
            {canAny(['stations.commission']) && (
              <NextStepCard
                to={APP_ROUTES.stations}
                title={t('dash.quick.commission')}
                description={t('dash.quick.commissionDesc')}
                icon={<Server className="h-4 w-4" />}
              />
            )}
            {canAny(['tariffs.manage']) && (
              <NextStepCard
                to={APP_ROUTES.tariffs}
                title={t('dash.quick.tariff')}
                description={t('dash.quick.tariffDesc')}
                icon={<Tags className="h-4 w-4" />}
              />
            )}
            <NextStepCard
              to={APP_ROUTES.ocppMonitor}
              title={t('dash.quick.ocpp')}
              description={t('dash.quick.ocppDesc')}
              icon={<Activity className="h-4 w-4" />}
            />
          </div>
        </Section>

        <Section
          title={t('dash.activityTitle')}
          action={
            <Button size="xs" onClick={() => navigate(APP_ROUTES.locations)}>
              {t('common.viewAll')}
            </Button>
          }
        >
          <Timeline items={net.activity.slice(0, 7)} emptyLabel={t('dash.attentionEmpty')} />
        </Section>
      </div>

      <p className="sr-only">{locale}</p>
    </>
  );
}
