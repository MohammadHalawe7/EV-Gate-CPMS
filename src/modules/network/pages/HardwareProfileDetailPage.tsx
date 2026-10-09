/* =============================================================================
 * Hardware profile detail.
 *
 * Read-only by default: a profile is a specification, and most visits are to
 * check what a product does rather than to change it. The layout is shown as
 * the physical arrangement it describes, not as a table of numbers.
 * ========================================================================== */

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Copy, Pencil, Server, Zap } from 'lucide-react';
import { useI18n } from '@/i18n';
import { PageHeader, MetaItem } from '@/components/layout/PageHeader';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DetailList, EmptyState } from '@/components/ui/Surface';
import { Alert } from '@/components/ui/Alert';
import { ErrorState } from '@/components/ui/States';
import { Menu } from '@/components/ui/Menu';
import { useToast } from '@/components/ui/Toast';
import { formatNumber } from '@/lib/utils';
import { findLookup } from '@/data/lookups';
import { networkActions, useNetwork, useProfileUsage } from '@/data/networkStore';
import { PRIVILEGES } from '@/app/session';
import { Can } from '@/app/guards';
import { APP_ROUTES } from '@/app/navigation';
import { profileConnectorCount, type HardwareCapabilities } from '@/domain/network';
import { CapabilityList, Section, Stat } from '../components/primitives';
import { HardwareProfileDrawer } from '../components/HardwareProfileDrawer';
import { StationsTable } from '../components/StationsTable';

const CAPABILITY_KEYS: (keyof HardwareCapabilities)[] = [
  'smartCharging', 'reservation', 'plugAndCharge', 'rfidReader', 'anpr',
  'display', 'loadBalancing', 'offlineCharging', 'certifiedMeter', 'paymentTerminal',
];

export function HardwareProfileDetailPage() {
  const { profileId } = useParams();
  const { t, ln } = useI18n();
  const toast = useToast();
  const net = useNetwork();
  const usage = useProfileUsage();
  const [editOpen, setEditOpen] = useState(false);

  const profile = net.profiles.find((p) => p.id === profileId);

  if (!profile) {
    return (
      <ErrorState
        kind="generic"
        title={t('hw.empty')}
        description={t('hw.emptyDesc')}
        action={
          <Link to={APP_ROUTES.hardware}>
            <Button variant="primary" size="sm">{t('hw.title')}</Button>
          </Link>
        }
      />
    );
  }

  const maker = findLookup('manufacturers', profile.manufacturer);
  const country = findLookup('countries', profile.countryOfManufacture);
  const installed = usage[profile.id] ?? 0;
  const stations = net.stations.filter((s) => s.hardwareProfileId === profile.id);

  return (
    <>
      <PageHeader
        crumbs={[{ label: t('hw.title'), to: APP_ROUTES.hardware }, { label: ln(profile) }]}
        title={ln(profile)}
        description={`${maker ? ln(maker) : profile.manufacturer} · ${profile.model}`}
        meta={
          <>
            <MetaItem label={t('hw.col.category')} value={profile.category} icon={<Server />} />
            <MetaItem label={t('hw.col.power')} value={`${formatNumber(profile.maxPowerKw)} kW`} icon={<Zap />} />
            <MetaItem label={t('hw.col.installed')} value={installed > 0 ? t('hw.installedCount', { count: installed }) : t('hw.notInstalled')} />
            <StatusBadge status={profile.status} label={t(`status.${profile.status}` as never)} size="sm" />
          </>
        }
        actions={
          <Can do={PRIVILEGES.catalogueManage}>
            <Button icon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>{t('common.edit')}</Button>
            <Menu
              items={[
                {
                  key: 'duplicate',
                  label: t('common.duplicate'),
                  icon: <Copy className="h-3.5 w-3.5" />,
                  onSelect: () => {
                    const copy = networkActions.duplicateProfile(profile.id);
                    if (copy) toast.success(t('hw.savedToast'), copy.code);
                  },
                },
                {
                  key: 'archive',
                  label: profile.status === 'Archived' ? t('common.restore') : t('common.archive'),
                  danger: profile.status !== 'Archived',
                  separatorBefore: true,
                  onSelect: () =>
                    networkActions.updateProfile(profile.id, { status: profile.status === 'Archived' ? 'Active' : 'Archived' }),
                },
              ]}
            />
          </Can>
        }
      />

      {installed > 0 && (
        <div className="mb-4">
          <Alert tone="info" title={t('hw.inUseTitle')}>{t('hw.inUseBody', { count: installed })}</Alert>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* ---- Layout ------------------------------------------------------ */}
        <Section className="xl:col-span-2" title={t('hw.section.layout')} subtitle={t('hw.section.layoutHint')}>
          <div className="space-y-3">
            {profile.evses.map((evse) => (
              <div key={evse.ordinal} className="rounded-[9px] border border-ink-200 p-3">
                <div className="mb-2.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-[6px] bg-brand-800 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {t('hw.evseLabel', { ordinal: evse.ordinal })}
                  </span>
                  <span className="tnum text-[12.5px] font-medium text-ink-900">{formatNumber(evse.maxPowerKw)} kW</span>
                  <span className="text-[12px] text-ink-500">{t(`power.${evse.powerType}` as never)}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {evse.connectors.map((connector, ci) => (
                    <span key={ci} className="flex items-center gap-2 rounded-[7px] border border-ink-200 bg-ink-50 px-2.5 py-1.5">
                      <span className="text-[12.5px] font-medium text-ink-800">{t(`ctype.${connector.type}` as never)}</span>
                      <span className="tnum text-[11.5px] text-ink-500">{formatNumber(connector.maxPowerKw)} kW</span>
                      <span className="tnum text-[11.5px] text-ink-400">{connector.maxAmperage} A</span>
                      <Badge tone="neutral" size="sm">
                        {connector.cableAttached ? t('evse.cable') : t('evse.socket')}
                      </Badge>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-ink-100 pt-4 sm:grid-cols-4">
            <Stat label="EVSEs" value={profile.evses.length} />
            <Stat label={t('loc.col.connectors')} value={profileConnectorCount(profile)} />
            <Stat label={t('hw.col.power')} value={`${formatNumber(profile.maxPowerKw)} kW`} />
            <Stat
              label={t('hw.col.ocpp')}
              value={<span className="flex flex-wrap gap-1">{profile.ocppVersions.map((v) => <Badge key={v} tone="neutral" size="sm">{v}</Badge>)}</span>}
            />
          </div>
        </Section>

        {/* ---- Capabilities ------------------------------------------------ */}
        <Section title={t('hw.section.capabilities')} subtitle={t('hw.section.capabilitiesHint')}>
          <CapabilityList
            items={CAPABILITY_KEYS.map((key) => ({
              label: t(`hw.cap.${key}` as never),
              on: profile.capabilities[key],
            }))}
          />
        </Section>

        {/* ---- Compliance -------------------------------------------------- */}
        <Section className="xl:col-span-3" title={t('hw.section.compliance')}>
          <DetailList
            columns={3}
            items={[
              { label: t('hw.field.manufacturer'), value: maker ? ln(maker) : profile.manufacturer },
              { label: t('hw.field.model'), value: profile.model },
              { label: t('hw.field.country'), value: country ? ln(country) : profile.countryOfManufacture },
              { label: t('hw.field.year'), value: <span className="tnum">{profile.yearOfManufacture}</span> },
              { label: t('hw.field.ip'), value: profile.ingressProtection },
              {
                label: 'Operating range',
                value: <span className="tnum" dir="ltr">{profile.operatingTempMinC}°C — {profile.operatingTempMaxC}°C</span>,
              },
              {
                label: t('hw.field.certifications'),
                span: true,
                value: (
                  <span className="flex flex-wrap gap-1.5">
                    {profile.certifications.map((c) => (
                      <Badge key={c} tone="neutral" size="sm">{c}</Badge>
                    ))}
                  </span>
                ),
              },
              ...(profile.notes ? [{ label: t('hw.field.notes'), value: profile.notes, span: true }] : []),
            ]}
          />
        </Section>
      </div>

      {/* ---- Installed stations -------------------------------------------- */}
      <div className="mt-4">
        <Section
          title={t('stn.title')}
          subtitle={installed > 0 ? t('hw.installedCount', { count: installed }) : t('hw.notInstalled')}
          padded={false}
        >
          {stations.length === 0 ? (
            <EmptyState
              compact
              icon={<Zap className="h-5 w-5" />}
              title={t('hw.notInstalled')}
              description={t('hw.emptyDesc')}
            />
          ) : (
            <div className="[&>div]:rounded-none [&>div]:border-0 [&>div]:border-t">
              <StationsTable stations={stations} dense />
            </div>
          )}
        </Section>
      </div>

      <HardwareProfileDrawer open={editOpen} onClose={() => setEditOpen(false)} profile={profile} />
    </>
  );
}
