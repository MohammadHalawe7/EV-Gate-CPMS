/* =============================================================================
 * Hardware profile editor.
 *
 * The connector layout is the substance here. Everything a station inherits —
 * how many bays, which plugs, how much power — is decided once in this drawer
 * and never retyped during commissioning.
 * ========================================================================== */

import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Drawer } from '@/components/ui/Overlay';
import { Button, IconButton } from '@/components/ui/Button';
import { Field, Input, Select, Textarea, Checkbox } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import { getLookup } from '@/data/lookups';
import { networkActions, useProfileUsage } from '@/data/networkStore';
import {
  CONNECTOR_TYPES,
  ENTITY_STATUSES,
  HARDWARE_CATEGORIES,
  OCPP_VERSIONS,
  POWER_TYPES,
  profileConnectorCount,
  type ConnectorTemplate,
  type EvseTemplate,
  type HardwareCapabilities,
  type HardwareProfile,
} from '@/domain/network';
import { FormGrid, Hint, Span } from './primitives';

type Draft = Omit<HardwareProfile, 'id' | 'code' | 'createdAt'>;

const CAPABILITY_KEYS: (keyof HardwareCapabilities)[] = [
  'smartCharging', 'reservation', 'plugAndCharge', 'rfidReader', 'anpr',
  'display', 'loadBalancing', 'offlineCharging', 'certifiedMeter', 'paymentTerminal',
];

function blankConnector(): ConnectorTemplate {
  return { type: 'Type2', powerType: 'AC_3_PHASE', maxPowerKw: 22, maxAmperage: 32, voltage: 400, cableAttached: false };
}

function blankProfile(): Draft {
  return {
    name: '',
    nameAr: '',
    manufacturer: 'abb',
    model: '',
    category: 'AC',
    maxPowerKw: 22,
    evses: [{ ordinal: 1, maxPowerKw: 22, powerType: 'AC_3_PHASE', connectors: [blankConnector()] }],
    ocppVersions: ['1.6J'],
    capabilities: {
      smartCharging: true, reservation: false, plugAndCharge: false, rfidReader: true, anpr: false,
      display: false, loadBalancing: true, offlineCharging: true, certifiedMeter: false, paymentTerminal: false,
    },
    countryOfManufacture: 'AE',
    yearOfManufacture: new Date().getFullYear(),
    ingressProtection: 'IP54',
    operatingTempMinC: -25,
    operatingTempMaxC: 55,
    certifications: ['CE'],
    status: 'Draft',
    notes: '',
  };
}

export function HardwareProfileDrawer({
  open,
  onClose,
  profile,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  profile?: HardwareProfile;
  onSaved?: (id: string) => void;
}) {
  const { t, ln } = useI18n();
  const toast = useToast();
  const usage = useProfileUsage();
  const [draft, setDraft] = useState<Draft>(() => (profile ? { ...profile } : blankProfile()));
  const [touched, setTouched] = useState(false);

  const key = profile?.id ?? 'new';
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) {
    setLastKey(key);
    setDraft(profile ? { ...profile } : blankProfile());
    setTouched(false);
  }

  const manufacturers = useMemo(() => getLookup('manufacturers'), []);
  const countries = useMemo(() => getLookup('countries'), []);

  const set = <K extends keyof Draft>(field: K, value: Draft[K]) => setDraft((prev) => ({ ...prev, [field]: value }));

  const setEvse = (index: number, patch: Partial<EvseTemplate>) =>
    set('evses', draft.evses.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  const setConnector = (evseIndex: number, connectorIndex: number, patch: Partial<ConnectorTemplate>) =>
    set(
      'evses',
      draft.evses.map((e, i) =>
        i === evseIndex
          ? { ...e, connectors: e.connectors.map((c, ci) => (ci === connectorIndex ? { ...c, ...patch } : c)) }
          : e,
      ),
    );

  const errors = {
    name: !draft.name.trim() ? t('form.required') : undefined,
    model: !draft.model.trim() ? t('form.required') : undefined,
    maxPowerKw: draft.maxPowerKw <= 0 ? t('form.positive') : undefined,
    evses: draft.evses.length === 0 || draft.evses.some((e) => e.connectors.length === 0) ? t('form.required') : undefined,
  };
  const invalid = Object.values(errors).some(Boolean);
  const err = (field: keyof typeof errors) => (touched ? errors[field] : undefined);

  const installed = profile ? (usage[profile.id] ?? 0) : 0;

  const save = () => {
    setTouched(true);
    if (invalid) return;
    if (profile) {
      networkActions.updateProfile(profile.id, draft);
      onSaved?.(profile.id);
    } else {
      const created = networkActions.createProfile(draft);
      onSaved?.(created.id);
    }
    toast.success(t('hw.savedToast'));
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="xl"
      title={profile ? ln(profile) : t('hw.new')}
      description={profile ? profile.code : t('hw.section.productHint')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={save}>{profile ? t('common.saveChanges') : t('hw.new')}</Button>
        </>
      }
    >
      <div className="space-y-6">
        {installed > 0 && (
          <Alert tone="warning" title={t('hw.inUseTitle')}>
            {t('hw.inUseBody', { count: installed })}
          </Alert>
        )}

        {/* ---- Product --------------------------------------------------- */}
        <section>
          <h4 className="mb-1 text-[13px] font-semibold text-ink-900">{t('hw.section.product')}</h4>
          <p className="mb-3 text-[12px] text-ink-500">{t('hw.section.productHint')}</p>
          <FormGrid>
            <Field label={t('hw.field.name')} required error={err('name')} htmlFor="hw-name">
              <Input id="hw-name" dir="auto" value={draft.name} onChange={(e) => set('name', e.target.value)} invalid={Boolean(err('name'))} />
            </Field>
            <Field label={t('hw.field.nameAr')} htmlFor="hw-name-ar">
              <Input id="hw-name-ar" dir="rtl" value={draft.nameAr} onChange={(e) => set('nameAr', e.target.value)} />
            </Field>
            <Field label={t('hw.field.manufacturer')} htmlFor="hw-maker">
              <Select id="hw-maker" value={draft.manufacturer} onChange={(e) => set('manufacturer', e.target.value)}>
                {manufacturers.map((m) => (
                  <option key={m.id} value={m.id}>{ln(m)}</option>
                ))}
              </Select>
            </Field>
            <Field label={t('hw.field.model')} required error={err('model')} htmlFor="hw-model">
              <Input id="hw-model" dir="ltr" value={draft.model} onChange={(e) => set('model', e.target.value)} invalid={Boolean(err('model'))} />
            </Field>
            <Field label={t('hw.field.category')} htmlFor="hw-category">
              <Select id="hw-category" value={draft.category} onChange={(e) => set('category', e.target.value as Draft['category'])}>
                {HARDWARE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label={t('hw.field.maxPower')} required error={err('maxPowerKw')} htmlFor="hw-power">
              <Input
                id="hw-power"
                type="number"
                min={0}
                className="tnum"
                value={draft.maxPowerKw}
                onChange={(e) => set('maxPowerKw', Number(e.target.value))}
                invalid={Boolean(err('maxPowerKw'))}
              />
            </Field>
            <Span>
              <Field label={t('hw.field.ocpp')}>
                <div className="flex flex-wrap gap-1.5">
                  {OCPP_VERSIONS.map((version) => {
                    const on = draft.ocppVersions.includes(version);
                    return (
                      <button
                        key={version}
                        type="button"
                        onClick={() =>
                          set('ocppVersions', on ? draft.ocppVersions.filter((v) => v !== version) : [...draft.ocppVersions, version])
                        }
                        className={
                          'rounded-full border px-3 py-1 text-[12px] transition-colors ' +
                          (on ? 'border-brand-200 bg-brand-50 font-medium text-brand-800' : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50')
                        }
                      >
                        {version}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </Span>
            <Field label={t('loc.field.status')} htmlFor="hw-status">
              <Select id="hw-status" value={draft.status} onChange={(e) => set('status', e.target.value as Draft['status'])}>
                {ENTITY_STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`status.${s}` as never)}</option>
                ))}
              </Select>
            </Field>
          </FormGrid>
        </section>

        {/* ---- Layout ---------------------------------------------------- */}
        <section>
          <div className="mb-1 flex items-center justify-between gap-3">
            <h4 className="text-[13px] font-semibold text-ink-900">{t('hw.section.layout')}</h4>
            <span className="text-[12px] text-ink-500">
              {t('hw.layoutSummary', { evses: draft.evses.length, connectors: draft.evses.reduce((n, e) => n + e.connectors.length, 0) })}
            </span>
          </div>
          <p className="mb-3 text-[12px] text-ink-500">{t('hw.section.layoutHint')}</p>

          <div className="space-y-3">
            {draft.evses.map((evse, ei) => (
              <div key={ei} className="rounded-[9px] border border-ink-200 bg-ink-50/50 p-3">
                <div className="mb-2.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-[6px] bg-brand-800 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {t('hw.evseLabel', { ordinal: evse.ordinal })}
                  </span>
                  <div className="w-[120px]">
                    <Input
                      type="number"
                      min={0}
                      className="h-8 tnum"
                      aria-label={t('hw.field.maxPower')}
                      value={evse.maxPowerKw}
                      onChange={(e) => setEvse(ei, { maxPowerKw: Number(e.target.value) })}
                    />
                  </div>
                  <div className="w-[150px]">
                    <Select
                      className="h-8"
                      aria-label={t('conn.filter.power')}
                      value={evse.powerType}
                      onChange={(e) => setEvse(ei, { powerType: e.target.value as EvseTemplate['powerType'] })}
                    >
                      {POWER_TYPES.map((p) => (
                        <option key={p} value={p}>{t(`power.${p}` as never)}</option>
                      ))}
                    </Select>
                  </div>
                  {draft.evses.length > 1 && (
                    <span className="ms-auto">
                      <IconButton
                        label={t('hw.removeEvse')}
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          set('evses', draft.evses.filter((_, i) => i !== ei).map((e, i) => ({ ...e, ordinal: i + 1 })))
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconButton>
                    </span>
                  )}
                </div>

                <ul className="space-y-1.5">
                  {evse.connectors.map((connector, ci) => (
                    <li key={ci} className="flex flex-wrap items-center gap-1.5 rounded-[7px] border border-ink-200 bg-white p-1.5">
                      <span className="tnum flex h-6 w-6 items-center justify-center rounded-[5px] bg-ink-100 text-[10.5px] font-semibold text-ink-600">
                        {ci + 1}
                      </span>
                      <div className="w-[130px]">
                        <Select
                          className="h-8"
                          aria-label={t('evse.col.type')}
                          value={connector.type}
                          onChange={(e) => setConnector(ei, ci, { type: e.target.value as ConnectorTemplate['type'] })}
                        >
                          {CONNECTOR_TYPES.map((type) => (
                            <option key={type} value={type}>{t(`ctype.${type}` as never)}</option>
                          ))}
                        </Select>
                      </div>
                      <div className="w-[96px]">
                        <Input
                          type="number"
                          min={0}
                          className="h-8 tnum"
                          aria-label={t('evse.col.power')}
                          value={connector.maxPowerKw}
                          onChange={(e) => setConnector(ei, ci, { maxPowerKw: Number(e.target.value) })}
                        />
                      </div>
                      <div className="w-[88px]">
                        <Input
                          type="number"
                          min={0}
                          className="h-8 tnum"
                          aria-label={t('evse.col.current')}
                          value={connector.maxAmperage}
                          onChange={(e) => setConnector(ei, ci, { maxAmperage: Number(e.target.value) })}
                        />
                      </div>
                      <Checkbox
                        checked={connector.cableAttached}
                        onChange={(v) => setConnector(ei, ci, { cableAttached: v })}
                        label={t('evse.cable')}
                      />
                      {evse.connectors.length > 1 && (
                        <span className="ms-auto">
                          <IconButton
                            label={t('common.remove')}
                            size="sm"
                            variant="ghost"
                            onClick={() => setEvse(ei, { connectors: evse.connectors.filter((_, i) => i !== ci) })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </IconButton>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                <Button
                  size="xs"
                  variant="ghost"
                  className="mt-2"
                  icon={<Plus className="h-3 w-3" />}
                  onClick={() => setEvse(ei, { connectors: [...evse.connectors, blankConnector()] })}
                >
                  {t('hw.addConnector')}
                </Button>
              </div>
            ))}
          </div>

          <Button
            size="sm"
            className="mt-2.5"
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={() =>
              set('evses', [
                ...draft.evses,
                { ordinal: draft.evses.length + 1, maxPowerKw: draft.maxPowerKw, powerType: draft.category === 'DC' ? 'DC' : 'AC_3_PHASE', connectors: [blankConnector()] },
              ])
            }
          >
            {t('hw.addEvse')}
          </Button>

          {err('evses') && <p className="mt-2 text-[12px] text-danger-700">{err('evses')}</p>}
        </section>

        {/* ---- Capabilities ---------------------------------------------- */}
        <section>
          <h4 className="mb-1 text-[13px] font-semibold text-ink-900">{t('hw.section.capabilities')}</h4>
          <p className="mb-3 text-[12px] text-ink-500">{t('hw.section.capabilitiesHint')}</p>
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {CAPABILITY_KEYS.map((capability) => (
              <Checkbox
                key={capability}
                checked={draft.capabilities[capability]}
                onChange={(v) => set('capabilities', { ...draft.capabilities, [capability]: v })}
                label={t(`hw.cap.${capability}` as never)}
              />
            ))}
          </div>
        </section>

        {/* ---- Compliance ------------------------------------------------ */}
        <section>
          <h4 className="mb-3 text-[13px] font-semibold text-ink-900">{t('hw.section.compliance')}</h4>
          <FormGrid>
            <Field label={t('hw.field.country')} htmlFor="hw-country">
              <Select id="hw-country" value={draft.countryOfManufacture} onChange={(e) => set('countryOfManufacture', e.target.value)}>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{ln(c)}</option>
                ))}
              </Select>
            </Field>
            <Field label={t('hw.field.year')} htmlFor="hw-year">
              <Input
                id="hw-year"
                type="number"
                className="tnum"
                value={draft.yearOfManufacture}
                onChange={(e) => set('yearOfManufacture', Number(e.target.value))}
              />
            </Field>
            <Field label={t('hw.field.ip')} htmlFor="hw-ip">
              <Input id="hw-ip" dir="ltr" value={draft.ingressProtection} onChange={(e) => set('ingressProtection', e.target.value)} />
            </Field>
            <Field label={t('hw.field.certifications')} hint="CE, IEC 61851" htmlFor="hw-cert">
              <Input
                id="hw-cert"
                dir="ltr"
                value={draft.certifications.join(', ')}
                onChange={(e) => set('certifications', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
              />
            </Field>
            <Field label={t('hw.field.tempMin')} htmlFor="hw-tmin">
              <Input
                id="hw-tmin"
                type="number"
                className="tnum"
                value={draft.operatingTempMinC}
                onChange={(e) => set('operatingTempMinC', Number(e.target.value))}
              />
            </Field>
            <Field label={t('hw.field.tempMax')} htmlFor="hw-tmax">
              <Input
                id="hw-tmax"
                type="number"
                className="tnum"
                value={draft.operatingTempMaxC}
                onChange={(e) => set('operatingTempMaxC', Number(e.target.value))}
              />
            </Field>
            <Span>
              <Field label={t('hw.field.notes')} htmlFor="hw-notes">
                <Textarea id="hw-notes" dir="auto" rows={3} value={draft.notes} onChange={(e) => set('notes', e.target.value)} />
              </Field>
            </Span>
            <Span>
              <Hint>{t('hw.explainBody')}</Hint>
            </Span>
          </FormGrid>
        </section>
      </div>
    </Drawer>
  );
}

export { profileConnectorCount };
