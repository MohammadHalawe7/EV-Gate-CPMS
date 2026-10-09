/* =============================================================================
 * Commissioning a charging station.
 *
 * Four steps, and only one of them is data entry. The hardware profile does
 * the heavy lifting: picking it decides the EVSEs, the connectors, the power
 * and the capabilities, so the operator names the unit and confirms.
 *
 * The station is created in `Provisioning`, not `Online`. A record is not a
 * charger — the unit is live when it has sent its first BootNotification, and
 * pretending otherwise is how estates end up with phantom chargers.
 * ========================================================================== */

import { useMemo, useState } from 'react';
import { Check, Server, Zap } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Modal } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Stepper } from '@/components/ui/Stepper';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Surface';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import { formatNumber } from '@/lib/utils';
import { findLookup } from '@/data/lookups';
import { networkActions, useNetwork } from '@/data/networkStore';
import {
  EV_CHARGING_SERVICE_ID,
  profileConnectorCount,
  type HardwareProfile,
  type OcppVersion,
} from '@/domain/network';
import { FormGrid, Hint, Span, SummaryRow } from './primitives';

export function CommissionStationModal({
  open,
  onClose,
  presetLocationId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  presetLocationId?: string;
  onCreated?: (stationId: string) => void;
}) {
  const { t, ln } = useI18n();
  const toast = useToast();
  const net = useNetwork();

  const [step, setStep] = useState(0);
  const [locationId, setLocationId] = useState(presetLocationId ?? '');
  const [profileId, setProfileId] = useState('');
  const [identity, setIdentity] = useState({
    name: '',
    nameAr: '',
    serialNumber: '',
    chargePointId: '',
    ocppVersion: '1.6J' as OcppVersion,
    firmwareVersion: '1.0.0',
    installedAt: new Date().toISOString().slice(0, 10),
    warrantyEndsAt: new Date(Date.now() + 730 * 86_400_000).toISOString().slice(0, 10),
    notes: '',
  });
  const [touched, setTouched] = useState(false);

  /* Only sites with an active EV charging service can hold a charger. */
  const eligible = useMemo(
    () =>
      net.locations.filter((location) =>
        net.services.some(
          (s) => s.locationId === location.id && s.serviceId === EV_CHARGING_SERVICE_ID && s.status === 'Active',
        ),
      ),
    [net.locations, net.services],
  );

  const availableProfiles = useMemo(() => net.profiles.filter((p) => p.status === 'Active'), [net.profiles]);

  const location = net.locations.find((l) => l.id === locationId);
  const profile = net.profiles.find((p) => p.id === profileId);
  const service = net.services.find((s) => s.locationId === locationId && s.serviceId === EV_CHARGING_SERVICE_ID);

  /* Suggest a charge point identity from the next station code. */
  const suggestedId = useMemo(() => {
    const max = net.stations.reduce((n, s) => Math.max(n, Number(s.code.replace(/\D/g, '')) || 0), 0);
    return `AE-EVG-CP${String(max + 1).padStart(4, '0')}`;
  }, [net.stations]);

  const steps = [
    { key: 'site', label: t('cm.step.site'), description: t('cm.step.siteHint') },
    { key: 'hardware', label: t('cm.step.hardware'), description: t('cm.step.hardwareHint') },
    { key: 'identity', label: t('cm.step.identity'), description: t('cm.step.identityHint') },
    { key: 'review', label: t('cm.step.review'), description: t('cm.step.reviewHint') },
  ];

  const identityErrors = {
    name: !identity.name.trim() ? t('form.required') : undefined,
    serialNumber: !identity.serialNumber.trim() ? t('form.required') : undefined,
    chargePointId: !(identity.chargePointId || suggestedId).trim()
      ? t('form.required')
      : net.stations.some((s) => s.chargePointId === (identity.chargePointId || suggestedId))
        ? t('cm.idTaken')
        : undefined,
  };

  const canAdvance =
    step === 0 ? Boolean(locationId)
    : step === 1 ? Boolean(profileId)
    : step === 2 ? !Object.values(identityErrors).some(Boolean)
    : true;

  const reset = () => {
    setStep(0);
    setLocationId(presetLocationId ?? '');
    setProfileId('');
    setIdentity((prev) => ({ ...prev, name: '', nameAr: '', serialNumber: '', chargePointId: '' }));
    setTouched(false);
  };

  const create = () => {
    if (!profile || !service) return;
    const station = networkActions.commissionStation({
      locationId,
      serviceId: service.id,
      hardwareProfileId: profile.id,
      name: identity.name,
      nameAr: identity.nameAr || identity.name,
      serialNumber: identity.serialNumber,
      chargePointId: identity.chargePointId || suggestedId,
      ocppVersion: identity.ocppVersion,
      firmwareVersion: identity.firmwareVersion,
      installedAt: identity.installedAt,
      warrantyEndsAt: identity.warrantyEndsAt,
      tariffId: null,
      notes: identity.notes,
    });
    toast.success(t('cm.createdToast'), t('cm.createdToastDesc'));
    onCreated?.(station.id);
    onClose();
    reset();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={t('cm.title')}
      description={t('cm.subtitle')}
      footer={
        <>
          {step > 0 && <Button onClick={() => setStep((s) => s - 1)}>{t('common.back')}</Button>}
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          {step < 3 ? (
            <Button
              variant="primary"
              disabled={!canAdvance && step !== 2}
              onClick={() => {
                if (step === 2) {
                  setTouched(true);
                  if (!canAdvance) return;
                }
                setStep((s) => s + 1);
              }}
            >
              {t('common.next')}
            </Button>
          ) : (
            <Button variant="primary" icon={<Check className="h-4 w-4" />} onClick={create}>
              {t('cm.create')}
            </Button>
          )}
        </>
      }
    >
      <Stepper steps={steps} current={step} onSelect={(i) => i < step && setStep(i)} className="mb-5" />

      {/* ---- 1 · Site ------------------------------------------------------ */}
      {step === 0 && (
        <div className="space-y-3">
          <div>
            <h4 className="text-[13px] font-semibold text-ink-900">{t('cm.pickSite')}</h4>
            <p className="text-[12px] text-ink-500">{t('cm.pickSiteHint')}</p>
          </div>
          {eligible.length === 0 ? (
            <EmptyState compact icon={<Zap className="h-5 w-5" />} title={t('cm.noSites')} description={t('cm.noSitesDesc')} />
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {eligible.map((item) => {
                const selected = item.id === locationId;
                const city = findLookup('cities', item.cityId);
                const stations = net.stations.filter((s) => s.locationId === item.id).length;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setLocationId(item.id)}
                      className={
                        'flex w-full items-center gap-3 rounded-[9px] border p-3 text-start transition-colors ' +
                        (selected ? 'border-brand-400 bg-brand-50' : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50')
                      }
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[11px] font-semibold text-white"
                        style={{ backgroundColor: `hsl(${item.imageHue} 46% 38%)` }}
                      >
                        {item.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span dir="auto" className="block truncate text-[13px] font-medium text-ink-900">{ln(item)}</span>
                        <span className="block truncate text-[11.5px] text-ink-500">
                          {city ? ln(city) : ''} · {stations} {t('loc.col.chargers').toLowerCase()}
                        </span>
                      </span>
                      {selected && <Check className="h-4 w-4 shrink-0 text-brand-700" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* ---- 2 · Hardware --------------------------------------------------- */}
      {step === 1 && (
        <div className="space-y-3">
          <div>
            <h4 className="text-[13px] font-semibold text-ink-900">{t('cm.pickHardware')}</h4>
            <p className="text-[12px] text-ink-500">{t('cm.pickHardwareHint')}</p>
          </div>
          <ul className="space-y-2">
            {availableProfiles.map((item) => (
              <li key={item.id}>
                <ProfileOption profile={item} selected={item.id === profileId} onSelect={() => setProfileId(item.id)} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---- 3 · Identity --------------------------------------------------- */}
      {step === 2 && (
        <div className="space-y-4">
          <Hint>{t('cm.identityHint')}</Hint>
          <FormGrid>
            <Field
              label={t('stn.field.name')}
              required
              error={touched ? identityErrors.name : undefined}
              htmlFor="cm-name"
            >
              <Input
                id="cm-name"
                dir="auto"
                value={identity.name}
                onChange={(e) => setIdentity((p) => ({ ...p, name: e.target.value }))}
                invalid={Boolean(touched && identityErrors.name)}
                placeholder={profile ? `${profile.model} · North 01` : ''}
              />
            </Field>
            <Field label={t('stn.field.nameAr')} htmlFor="cm-name-ar">
              <Input id="cm-name-ar" dir="rtl" value={identity.nameAr} onChange={(e) => setIdentity((p) => ({ ...p, nameAr: e.target.value }))} />
            </Field>
            <Field
              label={t('stn.field.serial')}
              required
              error={touched ? identityErrors.serialNumber : undefined}
              htmlFor="cm-serial"
            >
              <Input
                id="cm-serial"
                dir="ltr"
                className="tnum"
                value={identity.serialNumber}
                onChange={(e) => setIdentity((p) => ({ ...p, serialNumber: e.target.value }))}
                invalid={Boolean(touched && identityErrors.serialNumber)}
              />
            </Field>
            <Field
              label={t('stn.field.chargePointId')}
              required
              hint={touched && identityErrors.chargePointId ? undefined : t('stn.field.chargePointIdHint')}
              error={touched ? identityErrors.chargePointId : undefined}
              htmlFor="cm-cpid"
            >
              <Input
                id="cm-cpid"
                dir="ltr"
                className="tnum"
                value={identity.chargePointId || suggestedId}
                onChange={(e) => setIdentity((p) => ({ ...p, chargePointId: e.target.value }))}
                invalid={Boolean(touched && identityErrors.chargePointId)}
              />
            </Field>
            <Field label={t('stn.field.ocppVersion')} htmlFor="cm-ocpp">
              <Select
                id="cm-ocpp"
                value={identity.ocppVersion}
                onChange={(e) => setIdentity((p) => ({ ...p, ocppVersion: e.target.value as OcppVersion }))}
              >
                {(profile?.ocppVersions ?? ['1.6J']).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </Select>
            </Field>
            <Field label={t('stn.field.firmware')} htmlFor="cm-fw">
              <Input id="cm-fw" dir="ltr" className="tnum" value={identity.firmwareVersion} onChange={(e) => setIdentity((p) => ({ ...p, firmwareVersion: e.target.value }))} />
            </Field>
            <Field label={t('stn.field.installedAt')} htmlFor="cm-installed">
              <Input id="cm-installed" type="date" className="tnum" value={identity.installedAt} onChange={(e) => setIdentity((p) => ({ ...p, installedAt: e.target.value }))} />
            </Field>
            <Field label={t('stn.field.warranty')} htmlFor="cm-warranty">
              <Input id="cm-warranty" type="date" className="tnum" value={identity.warrantyEndsAt} onChange={(e) => setIdentity((p) => ({ ...p, warrantyEndsAt: e.target.value }))} />
            </Field>
            <Span>
              <Field label={t('stn.field.notes')} htmlFor="cm-notes">
                <Textarea id="cm-notes" dir="auto" rows={2} value={identity.notes} onChange={(e) => setIdentity((p) => ({ ...p, notes: e.target.value }))} />
              </Field>
            </Span>
          </FormGrid>
        </div>
      )}

      {/* ---- 4 · Review ----------------------------------------------------- */}
      {step === 3 && profile && location && (
        <div className="space-y-4">
          <Alert tone="info">{t('cm.reviewHint')}</Alert>

          <div className="rounded-[9px] border border-ink-200 p-3">
            <SummaryRow label={t('stn.field.location')} value={ln(location)} />
            <SummaryRow label={t('stn.field.profile')} value={ln(profile)} />
            <SummaryRow label={t('stn.field.name')} value={identity.name} />
            <SummaryRow label={t('stn.field.serial')} value={<span dir="ltr" className="tnum">{identity.serialNumber}</span>} />
            <SummaryRow label={t('stn.field.chargePointId')} value={<span dir="ltr" className="tnum">{identity.chargePointId || suggestedId}</span>} />
            <SummaryRow label={t('stn.field.ocppVersion')} value={identity.ocppVersion} />
            <SummaryRow label={t('stn.field.firmware')} value={<span dir="ltr" className="tnum">{identity.firmwareVersion}</span>} />
          </div>

          <div className="rounded-[9px] border border-brand-100 bg-brand-50/50 p-3">
            <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-brand-700">{t('cm.willCreate')}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">
                {profile.evses.length === 1
                  ? t('cm.willCreateEvses', { count: profile.evses.length })
                  : t('cm.willCreateEvsesPlural', { count: profile.evses.length })}
              </Badge>
              <Badge tone="brand">{t('cm.willCreateConnectors', { count: profileConnectorCount(profile) })}</Badge>
              <span className="tnum text-[12px] text-brand-800">{formatNumber(profile.maxPowerKw)} kW</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.evses.flatMap((evse) =>
                evse.connectors.map((connector, ci) => (
                  <span key={`${evse.ordinal}-${ci}`} className="rounded-[6px] border border-brand-200 bg-white px-2 py-0.5 text-[11.5px] text-brand-800">
                    {t(`ctype.${connector.type}` as never)}
                  </span>
                )),
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ProfileOption({
  profile,
  selected,
  onSelect,
}: {
  profile: HardwareProfile;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t, ln } = useI18n();
  const maker = findLookup('manufacturers', profile.manufacturer);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        'flex w-full items-start gap-3 rounded-[9px] border p-3 text-start transition-colors ' +
        (selected ? 'border-brand-400 bg-brand-50' : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50')
      }
    >
      <span
        className={
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] ' +
          (selected ? 'bg-brand-800 text-white' : 'bg-ink-100 text-ink-500')
        }
      >
        <Server className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span dir="auto" className="text-[13px] font-medium text-ink-900">{ln(profile)}</span>
          <Badge tone={profile.category === 'DC' ? 'info' : 'neutral'} size="sm">{profile.category}</Badge>
          <span className="tnum text-[12px] text-ink-500">{formatNumber(profile.maxPowerKw)} kW</span>
        </span>
        <span className="mt-0.5 block text-[11.5px] text-ink-500">
          {maker ? ln(maker) : profile.manufacturer} · {t('hw.layoutSummary', { evses: profile.evses.length, connectors: profileConnectorCount(profile) })}
        </span>
        <span className="mt-1.5 flex flex-wrap gap-1">
          {[...new Set(profile.evses.flatMap((e) => e.connectors.map((c) => c.type)))].map((type) => (
            <span key={type} className="rounded-[5px] bg-ink-100 px-1.5 py-0.5 text-[10.5px] text-ink-600">
              {t(`ctype.${type}` as never)}
            </span>
          ))}
        </span>
      </span>
      {selected && <Check className="h-4 w-4 shrink-0 text-brand-700" />}
    </button>
  );
}
