/* =============================================================================
 * Charging stations — the estate list.
 *
 * Operators arrive here with one of four questions: what is broken, what is
 * waiting to be commissioned, where is a particular unit, and what is
 * installed at a site. The lifecycle tabs answer the first two without
 * anybody touching a filter; the filter row answers the other two.
 * ========================================================================== */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Zap } from 'lucide-react';
import { useI18n } from '@/i18n';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Surface';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { ExportButton, FilterBar, useFilters } from '@/components/common';
import { useNetwork } from '@/data/networkStore';
import { APP_ROUTES } from '@/app/navigation';
import { PRIVILEGES, useSession } from '@/app/session';
import { Can } from '@/app/guards';
import { OCPP_VERSIONS, type ChargingStation } from '@/domain/network';
import { StationsTable } from '../components/StationsTable';
import { CommissionStationModal } from '../components/CommissionStationModal';

type Lane = 'all' | 'online' | 'attention' | 'provisioning' | 'maintenance' | 'retired';

const LANES: Record<Lane, (station: ChargingStation) => boolean> = {
  all: (s) => s.state !== 'Decommissioned',
  online: (s) => s.state === 'Online',
  attention: (s) => s.state === 'Faulted' || s.state === 'Offline',
  provisioning: (s) => s.state === 'Provisioning' || s.state === 'Draft',
  maintenance: (s) => s.state === 'Maintenance',
  retired: (s) => s.state === 'Decommissioned',
};

export function StationsPage() {
  const { t, ln } = useI18n();
  const net = useNetwork();
  const { inScope } = useSession();
  const navigate = useNavigate();
  const [lane, setLane] = useState<Lane>('all');
  const [commissionOpen, setCommissionOpen] = useState(false);

  /* Location-scoped operators only ever see their own site. */
  const visible = useMemo(() => inScope(net.stations), [net.stations, inScope]);
  const scopedLocations = useMemo(() => inScope(net.locations, 'location'), [net.locations, inScope]);

  const filters = useFilters([
    {
      key: 'locationId',
      label: t('stn.filter.location'),
      width: 'w-[180px]',
      options: scopedLocations.map((l) => ({ value: l.id, label: ln(l) })),
    },
    {
      key: 'hardwareProfileId',
      label: t('stn.filter.hardware'),
      width: 'w-[180px]',
      options: net.profiles.map((p) => ({ value: p.id, label: ln(p) })),
    },
    {
      key: 'ocppVersion',
      label: t('stn.filter.ocpp'),
      width: 'w-[130px]',
      options: OCPP_VERSIONS.map((v) => ({ value: v, label: v })),
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
        (station) =>
          LANES[lane](station) &&
          filters.matches({
            locationId: station.locationId,
            hardwareProfileId: station.hardwareProfileId,
            ocppVersion: station.ocppVersion,
          }),
      ),
    [visible, lane, filters],
  );

  const tabs: TabItem<Lane>[] = [
    { key: 'all', label: t('common.all'), count: counts.all },
    { key: 'online', label: t('status.Online'), count: counts.online },
    { key: 'attention', label: t('dash.attentionTitle'), count: counts.attention },
    { key: 'provisioning', label: t('status.Provisioning'), count: counts.provisioning },
    { key: 'maintenance', label: t('status.Maintenance'), count: counts.maintenance },
    ...(counts.retired > 0
      ? [{ key: 'retired' as Lane, label: t('status.Decommissioned'), count: counts.retired }]
      : []),
  ];

  const exportRows = rows.map((station) => {
    const location = net.locations.find((l) => l.id === station.locationId);
    const profile = net.profiles.find((p) => p.id === station.hardwareProfileId);
    return {
      code: station.code,
      name: station.name,
      chargePointId: station.chargePointId,
      location: location ? ln(location) : '',
      hardware: profile ? ln(profile) : '',
      ocppVersion: station.ocppVersion,
      firmwareVersion: station.firmwareVersion,
      state: station.state,
      uptimePct: station.uptimePct,
    };
  });

  return (
    <>
      <PageHeader
        title={t('stn.title')}
        description={t('stn.subtitle')}
        actions={
          <Can do={PRIVILEGES.stationsCommission}>
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setCommissionOpen(true)}>
              {t('stn.new')}
            </Button>
          </Can>
        }
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={<Zap className="h-5 w-5" />}
          title={t('stn.empty')}
          description={t('stn.emptyDesc')}
          action={
            <Can do={PRIVILEGES.stationsCommission}>
              <Button variant="primary" onClick={() => setCommissionOpen(true)}>
                {t('stn.new')}
              </Button>
            </Can>
          }
        />
      ) : (
        <>
          <Tabs items={tabs} value={lane} onChange={setLane} className="mb-4" />
          <StationsTable
            stations={rows}
            search={filters.search}
            emptyTitle={t('common.noResults')}
            emptyDescription={t('common.noResultsDesc')}
            toolbar={
              <FilterBar
                state={filters}
                placeholder={t('stn.title')}
                actions={<ExportButton rows={exportRows} filename="charging-stations" />}
              />
            }
          />
        </>
      )}

      <CommissionStationModal
        open={commissionOpen}
        onClose={() => setCommissionOpen(false)}
        onCreated={(id) => navigate(APP_ROUTES.station(id))}
      />
    </>
  );
}
