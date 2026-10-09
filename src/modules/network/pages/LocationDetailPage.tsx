/* =============================================================================
 * Location detail.
 *
 * Six tabs, ordered by how often an operator needs them: the state of the
 * site, the services running on it, the hardware, what it costs, when it is
 * open, and what changed.
 * ========================================================================== */

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Building2,
  Clock,
  CreditCard,
  Gauge,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Zap,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { PageHeader, MetaItem } from '@/components/layout/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Overlay';
import { Menu } from '@/components/ui/Menu';
import { DetailList, EmptyState, Panel } from '@/components/ui/Surface';
import { Alert } from '@/components/ui/Alert';
import { ErrorState } from '@/components/ui/States';
import { Select, Switch } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { Money } from '@/components/common';
import { formatCompact, formatDate, formatNumber } from '@/lib/utils';
import { findLookup } from '@/data/lookups';
import { networkActions, useLocationDetail, useNetwork, usePaymentResolver } from '@/data/networkStore';
import { APP_ROUTES } from '@/app/navigation';
import { PRIVILEGES, useSession } from '@/app/session';
import { Can } from '@/app/guards';
import { EV_CHARGING_SERVICE_ID, loadHeadroom } from '@/domain/network';
import {
  CountRow,
  InheritedFrom,
  PowerBudget,
  Section,
  Stat,
  Timeline,
} from '../components/primitives';
import { LocationFormDrawer } from '../components/LocationFormDrawer';
import { AddEvChargingDrawer } from '../components/AddEvChargingDrawer';
import { PaymentPolicyForm, PaymentPolicySummary } from '../components/PaymentPolicyForm';
import { StationsTable } from '../components/StationsTable';
import { CommissionStationModal } from '../components/CommissionStationModal';

type TabKey = 'overview' | 'services' | 'stations' | 'pricing' | 'access' | 'activity';

export function LocationDetailPage() {
  const { locationId } = useParams();
  const { t, ln, locale } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const detail = useLocationDetail(locationId);
  const net = useNetwork();

  const [tab, setTab] = useState<TabKey>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [commissionOpen, setCommissionOpen] = useState(false);

  if (!detail) {
    return (
      <ErrorState
        kind="generic"
        title={t('loc.empty')}
        description={t('loc.emptyDesc')}
        action={
          <Link to={APP_ROUTES.locations}>
            <Button variant="primary" size="sm">{t('loc.title')}</Button>
          </Link>
        }
      />
    );
  }

  const { location, services, evService, stations, evses, connectors, activity } = detail;

  const installedKw = evses.reduce((n, e) => n + e.maxPowerKw, 0);
  const budget = loadHeadroom(location.gridCapacityKw, installedKw);
  const counts = {
    available: connectors.filter((c) => c.status === 'Available').length,
    charging: connectors.filter((c) => c.status === 'Charging').length,
    faulted: connectors.filter((c) => c.status === 'Faulted').length,
    unavailable: connectors.filter((c) => c.status === 'Unavailable').length,
  };
  const lifetimeKwh = connectors.reduce((n, c) => n + c.lifetimeKwh, 0);
  const lifetimeSessions = connectors.reduce((n, c) => n + c.lifetimeSessions, 0);

  const city = findLookup('cities', location.cityId);
  const locationType = findLookup('locationTypes', location.type);

  const tabs = [
    { key: 'overview' as const, label: t('loc.tab.overview') },
    { key: 'services' as const, label: t('loc.tab.services'), count: services.length },
    { key: 'stations' as const, label: t('loc.tab.stations'), count: stations.length },
    { key: 'pricing' as const, label: t('loc.tab.pricing') },
    { key: 'access' as const, label: t('loc.tab.access') },
    { key: 'activity' as const, label: t('loc.tab.activity') },
  ];

  return (
    <>
      <PageHeader
        crumbs={[{ label: t('loc.title'), to: APP_ROUTES.locations }, { label: ln(location) }]}
        title={ln(location)}
        description={location.address}
        meta={
          <>
            <MetaItem label={t('loc.col.type')} value={locationType ? ln(locationType) : location.type} icon={<Building2 />} />
            <MetaItem label={t('loc.col.city')} value={city ? ln(city) : '—'} icon={<MapPin />} />
            <MetaItem label={t('loc.field.bays')} value={formatNumber(location.parkingSpaces)} />
            <StatusBadge status={location.status} label={t(`status.${location.status}` as never)} size="sm" />
          </>
        }
        actions={
          <Can do={PRIVILEGES.locationsManage}>
            {!evService && (
              <Button variant="primary" icon={<Zap className="h-4 w-4" />} onClick={() => setServiceOpen(true)}>
                {t('svc.addEv')}
              </Button>
            )}
            <Button icon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>
              {t('common.edit')}
            </Button>
            <Menu
              items={[
                {
                  key: 'archive',
                  label: location.status === 'Archived' ? t('common.restore') : t('common.archive'),
                  danger: location.status !== 'Archived',
                  onSelect: () =>
                    location.status === 'Archived'
                      ? networkActions.setLocationStatus(location.id, 'Active')
                      : setArchiveOpen(true),
                },
              ]}
            />
          </Can>
        }
        tabs={<Tabs items={tabs} value={tab} onChange={setTab} />}
      />

      {/* ---- Overview ------------------------------------------------------ */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {!evService && (
            <Alert
              tone="info"
              title={t('stn.emptyNoService')}
              action={
                <Can do={PRIVILEGES.locationsManage}>
                  <Button size="sm" variant="primary" onClick={() => setServiceOpen(true)}>
                    {t('svc.addEv')}
                  </Button>
                </Can>
              }
            >
              {t('stn.emptyNoServiceDesc')}
            </Alert>
          )}

          {budget.overSubscribed && (
            <Alert tone="warning" title={t('power.overSubscribed')}>
              {t('loc.overview.budgetHint')}
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Panel className="lg:col-span-2">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label={t('loc.col.chargers')} value={formatNumber(stations.length)} />
                <Stat label={t('loc.col.connectors')} value={formatNumber(connectors.length)} />
                <Stat
                  label={t('loc.overview.utilisation')}
                  value={`${counts.charging}`}
                  tone={counts.charging > 0 ? 'success' : 'muted'}
                  hint={`${t('status.Available')}: ${counts.available}`}
                />
                <Stat
                  label={t('status.Faulted')}
                  value={formatNumber(counts.faulted)}
                  tone={counts.faulted > 0 ? 'danger' : 'muted'}
                />
              </div>
              <div className="mt-4 border-t border-ink-100 pt-4">
                <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-ink-500">
                  {t('loc.overview.breakdown')}
                </p>
                {connectors.length === 0 ? (
                  <p className="text-[12.5px] text-ink-400">{t('stn.empty')}</p>
                ) : (
                  <CountRow
                    items={[
                      { label: t('status.Available'), value: counts.available, tone: 'success' },
                      { label: t('status.Charging'), value: counts.charging, tone: 'info' },
                      { label: t('status.Faulted'), value: counts.faulted, tone: 'danger' },
                      { label: t('status.Unavailable'), value: counts.unavailable, tone: 'neutral' },
                    ]}
                  />
                )}
              </div>
            </Panel>

            <Section title={t('loc.overview.budget')} subtitle={t('loc.overview.budgetHint')}>
              <PowerBudget
                installedKw={installedKw}
                limitKw={evService?.evCharging?.siteLoadLimitKw ?? 0}
                gridKw={location.gridCapacityKw}
              />
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-ink-100 pt-3">
                <Stat label={t('loc.overview.energy')} value={`${formatCompact(lifetimeKwh)} kWh`} />
                <Stat label={t('loc.overview.sessions')} value={formatCompact(lifetimeSessions)} />
              </div>
            </Section>
          </div>

          <Section title={t('loc.section.contact')} subtitle={t('loc.section.contactHint')}>
            <DetailList
              columns={3}
              items={[
                { label: t('loc.field.contactName'), value: location.siteContactName || '—' },
                {
                  label: t('loc.field.contactPhone'),
                  value: location.siteContactPhone ? (
                    <a href={`tel:${location.siteContactPhone}`} dir="ltr" className="tnum text-brand-700 hover:text-brand-900">
                      {location.siteContactPhone}
                    </a>
                  ) : '—',
                },
                {
                  label: t('loc.field.contactEmail'),
                  value: location.siteContactEmail ? (
                    <a href={`mailto:${location.siteContactEmail}`} dir="ltr" className="text-brand-700 hover:text-brand-900">
                      {location.siteContactEmail}
                    </a>
                  ) : '—',
                },
                { label: t('loc.field.lat'), value: <span className="tnum" dir="ltr">{location.lat.toFixed(4)}</span> },
                { label: t('loc.field.lng'), value: <span className="tnum" dir="ltr">{location.lng.toFixed(4)}</span> },
                { label: t('common.created'), value: formatDate(location.createdAt, locale === 'ar' ? 'ar-AE' : 'en-AE') },
                ...(location.notes ? [{ label: t('loc.field.notes'), value: location.notes, span: true }] : []),
              ]}
            />
          </Section>
        </div>
      )}

      {/* ---- Services ------------------------------------------------------ */}
      {tab === 'services' && (
        <Section
          title={t('svc.title')}
          subtitle={t('svc.subtitle')}
          action={
            !evService && (
              <Can do={PRIVILEGES.locationsManage}>
                <Button size="sm" variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setServiceOpen(true)}>
                  {t('svc.addEv')}
                </Button>
              </Can>
            )
          }
        >
          {services.length === 0 ? (
            <EmptyState
              compact
              icon={<Zap className="h-5 w-5" />}
              title={t('svc.empty')}
              description={t('svc.emptyDesc')}
              action={
                <Can do={PRIVILEGES.locationsManage}>
                  <Button size="sm" variant="primary" onClick={() => setServiceOpen(true)}>{t('svc.addEv')}</Button>
                </Can>
              }
            />
          ) : (
            <ul className="space-y-2">
              {services.map((service) => {
                const lookup = findLookup('services', service.serviceId);
                const isEv = service.serviceId === EV_CHARGING_SERVICE_ID;
                return (
                  <li
                    key={service.id}
                    className="flex flex-wrap items-center gap-3 rounded-[9px] border border-ink-200 bg-white p-3"
                  >
                    <span
                      className={
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] ' +
                        (isEv ? 'bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-500')
                      }
                    >
                      <Zap className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p dir="auto" className="text-[13px] font-medium text-ink-900">
                        {lookup ? ln(lookup) : service.serviceId}
                      </p>
                      <p className="text-[12px] text-ink-500">
                        {isEv ? t('svc.evDesc') : t('svc.enabled', { when: formatDate(service.enabledAt, locale === 'ar' ? 'ar-AE' : 'en-AE') })}
                      </p>
                    </div>
                    {isEv && service.evCharging && (
                      <div className="flex flex-wrap items-center gap-3 text-[12px] text-ink-500">
                        <span className="tnum">{stations.length} {t('loc.col.chargers').toLowerCase()}</span>
                        <span className="tnum">{formatNumber(service.evCharging.siteLoadLimitKw)} kW</span>
                      </div>
                    )}
                    <StatusBadge status={service.status} label={t(`status.${service.status}` as never)} size="sm" />
                    {isEv && (
                      <Can do={PRIVILEGES.locationsManage}>
                        <Menu
                          items={[
                            { key: 'pricing', label: t('loc.tab.pricing'), onSelect: () => setTab('pricing') },
                            { key: 'stations', label: t('loc.tab.stations'), onSelect: () => setTab('stations') },
                            {
                              key: 'toggle',
                              label: service.status === 'Active' ? t('svc.suspend') : t('svc.resume'),
                              danger: service.status === 'Active',
                              separatorBefore: true,
                              onSelect: () =>
                                service.status === 'Active'
                                  ? networkActions.disableService(service.id)
                                  : networkActions.updateService(service.id, { status: 'Active' }),
                            },
                          ]}
                        />
                      </Can>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      )}

      {/* ---- Stations ------------------------------------------------------ */}
      {tab === 'stations' && (
        <>
          {!evService ? (
            <EmptyState
              icon={<Zap className="h-5 w-5" />}
              title={t('stn.emptyNoService')}
              description={t('stn.emptyNoServiceDesc')}
              action={
                <Can do={PRIVILEGES.locationsManage}>
                  <Button variant="primary" onClick={() => setServiceOpen(true)}>{t('svc.addEv')}</Button>
                </Can>
              }
            />
          ) : (
            <StationsTable
              stations={stations}
              showLocation={false}
              emptyTitle={t('stn.empty')}
              emptyDescription={t('stn.emptyDesc')}
              emptyAction={
                <Can do={PRIVILEGES.stationsCommission}>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => setCommissionOpen(true)}
                  >
                    {t('stn.new')}
                  </Button>
                </Can>
              }
              toolbar={
                <div className="flex w-full items-center justify-between gap-2">
                  <p className="text-[12.5px] text-ink-500">{t('stn.subtitle')}</p>
                  <Can do={PRIVILEGES.stationsCommission}>
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Plus className="h-3.5 w-3.5" />}
                      onClick={() => setCommissionOpen(true)}
                    >
                      {t('stn.new')}
                    </Button>
                  </Can>
                </div>
              }
            />
          )}
        </>
      )}

      {/* ---- Tariff & payment ---------------------------------------------- */}
      {tab === 'pricing' && (
        <LocationPricingTab locationId={location.id} />
      )}

      {/* ---- Access & hours ------------------------------------------------ */}
      {tab === 'access' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Section title={t('loc.section.hours')} subtitle={t('loc.section.hoursHint')}>
            {location.openingHours.twentyFourSeven ? (
              <div className="flex items-center gap-2 rounded-[8px] border border-success-100 bg-success-50 px-3 py-2.5">
                <Clock className="h-4 w-4 text-success-700" />
                <span className="text-[13px] font-medium text-success-700">{t('loc.field.open247')}</span>
              </div>
            ) : (
              <ul className="divide-y divide-ink-100">
                {location.openingHours.windows.map((window) => (
                  <li key={window.day} className="flex items-center justify-between py-2">
                    <span className="text-[12.5px] text-ink-700">{t(`loc.day.${window.day}` as never)}</span>
                    {window.open ? (
                      <span dir="ltr" className="tnum text-[12.5px] text-ink-900">{window.from} – {window.to}</span>
                    ) : (
                      <span className="text-[12.5px] text-ink-400">{t('loc.closed')}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 border-t border-ink-100 pt-3">
              <DetailList
                columns={2}
                items={[
                  { label: t('loc.field.access'), value: t(`access.${location.accessType}` as never) },
                  { label: t('power.grid'), value: <span className="tnum">{formatNumber(location.gridCapacityKw)} kW</span> },
                ]}
              />
            </div>
          </Section>

          <Section title={t('loc.section.amenities')} subtitle={t('loc.section.amenitiesHint')}>
            {location.amenityIds.length === 0 ? (
              <p className="py-4 text-center text-[12.5px] text-ink-400">{t('common.none')}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {location.amenityIds.map((id) => {
                  const amenity = findLookup('amenities', id);
                  return (
                    <Badge key={id} tone="neutral">{amenity ? ln(amenity) : id}</Badge>
                  );
                })}
              </div>
            )}
          </Section>
        </div>
      )}

      {/* ---- Activity ------------------------------------------------------ */}
      {tab === 'activity' && (
        <Section title={t('loc.tab.activity')}>
          <Timeline items={activity.slice(0, 40)} emptyLabel={t('dash.attentionEmpty')} />
        </Section>
      )}

      {/* ---- Overlays ------------------------------------------------------ */}
      <CommissionStationModal
        open={commissionOpen}
        onClose={() => setCommissionOpen(false)}
        presetLocationId={location.id}
        onCreated={(id) => navigate(APP_ROUTES.station(id))}
      />

      <LocationFormDrawer open={editOpen} onClose={() => setEditOpen(false)} location={location} />
      <AddEvChargingDrawer open={serviceOpen} onClose={() => setServiceOpen(false)} location={location} />
      <ConfirmDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={() => {
          networkActions.setLocationStatus(location.id, 'Archived');
          toast.success(t('loc.updated'));
          navigate(APP_ROUTES.locations);
        }}
        title={t('loc.archiveTitle')}
        message={t('loc.archiveBody', { name: ln(location) })}
        confirmLabel={t('common.archive')}
        cancelLabel={t('common.cancel')}
      />

      <p className="sr-only">{net.locations.length}</p>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Tariff & payment tab                                                        */
/* -------------------------------------------------------------------------- */

function LocationPricingTab({ locationId }: { locationId: string }) {
  const { t, ln } = useI18n();
  const toast = useToast();
  const net = useNetwork();
  const detail = useLocationDetail(locationId);
  const resolvePaymentFor = usePaymentResolver();
  const { can } = useSession();
  const editable = can(PRIVILEGES.locationsManage);

  const service = detail?.evService;
  const config = service?.evCharging;
  const companyDefault = net.tariffs.find((tf) => tf.isCompanyDefault);
  const resolvedPayment = resolvePaymentFor(locationId);

  const [paymentDraft, setPaymentDraft] = useState(resolvedPayment.policy);
  const [draftKey, setDraftKey] = useState(resolvedPayment.source);
  if (draftKey !== resolvedPayment.source) {
    setDraftKey(resolvedPayment.source);
    setPaymentDraft(resolvedPayment.policy);
  }

  if (!service || !config) {
    return (
      <EmptyState
        icon={<Zap className="h-5 w-5" />}
        title={t('stn.emptyNoService')}
        description={t('stn.emptyNoServiceDesc')}
      />
    );
  }

  const effectiveTariff = config.defaultTariffId
    ? net.tariffs.find((tf) => tf.id === config.defaultTariffId)
    : companyDefault;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {/* ---- Tariff ------------------------------------------------------- */}
      <Section
        title={t('pricing.tariffTitle')}
        subtitle={t('pricing.tariffHint')}
        action={
          <InheritedFrom
            source={config.defaultTariffId ? 'location' : 'company'}
            own={Boolean(config.defaultTariffId)}
            onClear={editable ? () => networkActions.updateEvChargingConfig(service.id, { defaultTariffId: null }) : undefined}
          />
        }
      >
        <Select
          value={config.defaultTariffId ?? ''}
          disabled={!editable}
          onChange={(e) => {
            networkActions.updateEvChargingConfig(service.id, { defaultTariffId: e.target.value || null });
            toast.success(t('form.saved'));
          }}
        >
          <option value="">
            {t('pricing.useCompanyDefault')}
            {companyDefault ? ` — ${ln(companyDefault)}` : ''}
          </option>
          {net.tariffs
            .filter((tf) => tf.status === 'Active')
            .map((tariff) => (
              <option key={tariff.id} value={tariff.id}>
                {ln(tariff)} · {tariff.code}
              </option>
            ))}
        </Select>

        {effectiveTariff ? (
          <div className="mt-3 rounded-[9px] border border-ink-200 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Link to={APP_ROUTES.tariff(effectiveTariff.id)} className="text-[13px] font-medium text-brand-800 hover:text-brand-900">
                {ln(effectiveTariff)}
              </Link>
              {effectiveTariff.isCompanyDefault && <Badge tone="brand" size="sm">{t('trf.isDefault')}</Badge>}
            </div>
            <DetailList
              columns={2}
              items={[
                { label: t('trf.field.perKwh'), value: <Money value={effectiveTariff.basePricePerKwh} currency={effectiveTariff.currency} /> },
                { label: t('trf.field.sessionFee'), value: <Money value={effectiveTariff.fees.sessionFee} currency={effectiveTariff.currency} /> },
                { label: t('trf.field.idleFee'), value: <Money value={effectiveTariff.fees.idleFeePerMinute} currency={effectiveTariff.currency} /> },
                { label: t('trf.col.schedule'), value: effectiveTariff.twentyFourSeven ? t('trf.alwaysOn') : t('trf.windows', { count: effectiveTariff.windows.length }) },
              ]}
            />
          </div>
        ) : (
          <Alert tone="warning" compact className="mt-3">{t('inherit.none')}</Alert>
        )}

        <div className="mt-4 space-y-3 border-t border-ink-100 pt-4">
          <Switch
            disabled={!editable}
            checked={config.publicListing}
            onChange={(v) => networkActions.updateEvChargingConfig(service.id, { publicListing: v })}
            label={t('svc.field.publicListing')}
            hint={t('svc.field.publicListingHint')}
          />
          <Switch
            disabled={!editable}
            checked={config.roamingEnabled}
            onChange={(v) => networkActions.updateEvChargingConfig(service.id, { roamingEnabled: v })}
            label={t('svc.field.roaming')}
            hint={t('svc.field.roamingHint')}
          />
        </div>
      </Section>

      {/* ---- Payment ------------------------------------------------------ */}
      <Section
        title={t('pricing.paymentTitle')}
        subtitle={t('pricing.paymentHint')}
        action={
          <InheritedFrom
            source={resolvedPayment.source === 'location' ? 'location' : 'company'}
            own={resolvedPayment.source === 'location'}
            onOverride={editable ? () => networkActions.updateEvChargingConfig(service.id, { payment: { ...net.companyPayment } }) : undefined}
            onClear={editable ? () => networkActions.updateEvChargingConfig(service.id, { payment: null }) : undefined}
          />
        }
      >
        {resolvedPayment.source === 'company' ? (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[8px] border border-ink-200 bg-ink-50 px-3 py-2">
              <CreditCard className="h-3.5 w-3.5 text-ink-400" />
              <span className="text-[12px] text-ink-600">{t('pricing.inheritPayment')}</span>
              <Can do={PRIVILEGES.paymentsManage}>
                <Link to={APP_ROUTES.payment} className="text-[12px] font-medium text-brand-800 hover:underline">
                  {t('pay.companyTitle')}
                </Link>
              </Can>
            </div>
            <PaymentPolicySummary policy={resolvedPayment.policy} />
          </>
        ) : (
          <>
            <PaymentPolicyForm value={paymentDraft} onChange={setPaymentDraft} disabled={!editable} />
            {editable && (
              <div className="mt-4 flex justify-end gap-2 border-t border-ink-100 pt-3">
                <Button size="sm" onClick={() => setPaymentDraft(resolvedPayment.policy)}>{t('form.discard')}</Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    networkActions.updateEvChargingConfig(service.id, { payment: paymentDraft });
                    toast.success(t('form.saved'));
                  }}
                >
                  {t('form.save')}
                </Button>
              </div>
            )}
          </>
        )}
      </Section>

      {/* ---- Load ---------------------------------------------------------- */}
      <Section title={t('svc.field.loadLimit')} subtitle={t('svc.field.loadLimitHint')} className="xl:col-span-2">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-ink-100 text-ink-500">
            <Gauge className="h-4 w-4" />
          </span>
          <div className="min-w-[240px] flex-1">
            <PowerBudget
              installedKw={detail.evses.reduce((n, e) => n + e.maxPowerKw, 0)}
              limitKw={config.siteLoadLimitKw}
              gridKw={detail.location.gridCapacityKw}
            />
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-ink-400" />
            <span dir="ltr" className="tnum text-[12.5px] text-ink-700">{config.supportPhone}</span>
          </div>
        </div>
      </Section>
    </div>
  );
}
