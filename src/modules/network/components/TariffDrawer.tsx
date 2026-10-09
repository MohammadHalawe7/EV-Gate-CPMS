/* =============================================================================
 * Tariff editor.
 *
 * The old concept listed a dozen fees in one flat form. They are grouped here
 * by the moment they are charged — energy while charging, fees at the session
 * boundary, fees around a reservation — because that is the order somebody
 * reasons about a price, and because a fee set to zero should visibly be off
 * rather than silently present.
 * ========================================================================== */

import { useMemo, useState } from 'react';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Drawer } from '@/components/ui/Overlay';
import { Button, IconButton } from '@/components/ui/Button';
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { Money } from '@/components/common';
import { uid } from '@/lib/utils';
import { networkActions } from '@/data/networkStore';
import {
  ENTITY_STATUSES,
  TARIFF_TYPES,
  type Tariff,
  type TariffWindow,
} from '@/domain/network';
import { FormGrid, Hint, Span, SummaryRow } from './primitives';

type Draft = Omit<Tariff, 'id' | 'code' | 'companyId' | 'tenantId' | 'createdAt' | 'updatedAt'>;

function blankTariff(): Draft {
  return {
    name: '',
    nameAr: '',
    description: '',
    type: 'Energy',
    status: 'Draft',
    currency: 'AED',
    basePricePerKwh: 0.7,
    basePricePerMinute: 0,
    fees: {
      sessionFee: 0,
      idleFeePerMinute: 0,
      idleGraceMinutes: 10,
      idleFeeCap: 0,
      reservationFee: 0,
      rebookingFee: 0,
      cancellationFee: 0,
      cancellationGraceMinutes: 15,
      noShowFee: 0,
      minimumCharge: 0,
    },
    twentyFourSeven: true,
    windows: [],
    appliesTo: 'All',
    vatPct: 5,
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: null,
    isCompanyDefault: false,
  };
}

/** The example quoted in the editor, so a price change is never abstract. */
export function priceExample(tariff: Pick<Draft, 'basePricePerKwh' | 'basePricePerMinute' | 'fees' | 'vatPct'>) {
  const kwh = 30;
  const minutes = 45;
  const idleMinutes = 20;
  const energy = kwh * tariff.basePricePerKwh;
  const time = minutes * tariff.basePricePerMinute;
  const session = tariff.fees.sessionFee;
  const billableIdle = Math.max(0, idleMinutes - tariff.fees.idleGraceMinutes);
  const rawIdle = billableIdle * tariff.fees.idleFeePerMinute;
  const idle = tariff.fees.idleFeeCap > 0 ? Math.min(rawIdle, tariff.fees.idleFeeCap) : rawIdle;
  const net = Math.max(energy + time + session + idle, tariff.fees.minimumCharge);
  const vat = (net * tariff.vatPct) / 100;
  return { energy, time, session, idle, net, vat, total: net + vat };
}

export function TariffDrawer({
  open,
  onClose,
  tariff,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  tariff?: Tariff;
  onSaved?: (id: string) => void;
}) {
  const { t, ln } = useI18n();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(() => (tariff ? { ...tariff } : blankTariff()));
  const [touched, setTouched] = useState(false);

  const key = tariff?.id ?? 'new';
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) {
    setLastKey(key);
    setDraft(tariff ? { ...tariff } : blankTariff());
    setTouched(false);
  }

  const set = <K extends keyof Draft>(field: K, value: Draft[K]) => setDraft((prev) => ({ ...prev, [field]: value }));
  const setFee = <K extends keyof Draft['fees']>(field: K, value: Draft['fees'][K]) =>
    setDraft((prev) => ({ ...prev, fees: { ...prev.fees, [field]: value } }));

  const setWindow = (index: number, patch: Partial<TariffWindow>) =>
    set('windows', draft.windows.map((w, i) => (i === index ? { ...w, ...patch } : w)));

  const errors = {
    name: !draft.name.trim() ? t('form.required') : undefined,
    basePricePerKwh: draft.basePricePerKwh < 0 ? t('form.number') : undefined,
  };
  const invalid = Object.values(errors).some(Boolean);
  const err = (field: keyof typeof errors) => (touched ? errors[field] : undefined);

  const example = useMemo(() => priceExample(draft), [draft]);

  const save = () => {
    setTouched(true);
    if (invalid) return;
    if (tariff) {
      networkActions.updateTariff(tariff.id, draft);
      onSaved?.(tariff.id);
    } else {
      const created = networkActions.createTariff(draft);
      onSaved?.(created.id);
    }
    toast.success(t('trf.savedToast'));
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="xl"
      title={tariff ? ln(tariff) : t('trf.new')}
      description={tariff ? tariff.code : t('trf.section.identityHint')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={save}>{tariff ? t('common.saveChanges') : t('trf.new')}</Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* ---- Identity --------------------------------------------------- */}
        <section>
          <h4 className="mb-1 text-[13px] font-semibold text-ink-900">{t('trf.section.identity')}</h4>
          <p className="mb-3 text-[12px] text-ink-500">{t('trf.section.identityHint')}</p>
          <FormGrid>
            <Field label={t('trf.field.name')} required error={err('name')} htmlFor="trf-name">
              <Input id="trf-name" dir="auto" value={draft.name} onChange={(e) => set('name', e.target.value)} invalid={Boolean(err('name'))} />
            </Field>
            <Field label={t('trf.field.nameAr')} htmlFor="trf-name-ar">
              <Input id="trf-name-ar" dir="rtl" value={draft.nameAr} onChange={(e) => set('nameAr', e.target.value)} />
            </Field>
            <Span>
              <Field label={t('trf.field.description')} htmlFor="trf-desc">
                <Textarea id="trf-desc" dir="auto" rows={2} value={draft.description} onChange={(e) => set('description', e.target.value)} />
              </Field>
            </Span>
            <Field label={t('trf.field.type')} htmlFor="trf-type">
              <Select id="trf-type" value={draft.type} onChange={(e) => set('type', e.target.value as Draft['type'])}>
                {TARIFF_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
            </Field>
            <Field label={t('trf.field.appliesTo')} htmlFor="trf-applies">
              <Select id="trf-applies" value={draft.appliesTo} onChange={(e) => set('appliesTo', e.target.value as Draft['appliesTo'])}>
                <option value="All">{t('common.all')}</option>
                <option value="AC">AC</option>
                <option value="DC">DC</option>
              </Select>
            </Field>
            <Field label={t('trf.field.currency')} htmlFor="trf-currency">
              <Select id="trf-currency" value={draft.currency} onChange={(e) => set('currency', e.target.value)}>
                {['AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'USD', 'EUR'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label={t('loc.field.status')} htmlFor="trf-status">
              <Select id="trf-status" value={draft.status} onChange={(e) => set('status', e.target.value as Draft['status'])}>
                {ENTITY_STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`status.${s}` as never)}</option>
                ))}
              </Select>
            </Field>
          </FormGrid>
        </section>

        {/* ---- Energy ----------------------------------------------------- */}
        <section>
          <h4 className="mb-1 text-[13px] font-semibold text-ink-900">{t('trf.section.energy')}</h4>
          <p className="mb-3 text-[12px] text-ink-500">{t('trf.section.energyHint')}</p>
          <FormGrid columns={3}>
            <Field label={t('trf.field.perKwh')} error={err('basePricePerKwh')} htmlFor="trf-kwh">
              <Input
                id="trf-kwh"
                type="number"
                step="0.01"
                min={0}
                className="tnum"
                value={draft.basePricePerKwh}
                onChange={(e) => set('basePricePerKwh', Number(e.target.value))}
                invalid={Boolean(err('basePricePerKwh'))}
              />
            </Field>
            <Field label={t('trf.field.perMinute')} htmlFor="trf-min">
              <Input
                id="trf-min"
                type="number"
                step="0.01"
                min={0}
                className="tnum"
                value={draft.basePricePerMinute}
                onChange={(e) => set('basePricePerMinute', Number(e.target.value))}
              />
            </Field>
            <Field label={t('trf.field.vat')} htmlFor="trf-vat">
              <Input
                id="trf-vat"
                type="number"
                step="0.5"
                min={0}
                className="tnum"
                value={draft.vatPct}
                onChange={(e) => set('vatPct', Number(e.target.value))}
              />
            </Field>
          </FormGrid>
        </section>

        {/* ---- Schedule --------------------------------------------------- */}
        <section>
          <h4 className="mb-1 text-[13px] font-semibold text-ink-900">{t('trf.section.schedule')}</h4>
          <p className="mb-3 text-[12px] text-ink-500">{t('trf.section.scheduleHint')}</p>

          <Switch
            checked={draft.twentyFourSeven}
            onChange={(v) => set('twentyFourSeven', v)}
            label={t('trf.field.open247')}
          />

          {!draft.twentyFourSeven && (
            <div className="mt-3 space-y-2">
              {draft.windows.length === 0 && (
                <div className="rounded-[9px] border border-dashed border-ink-300 bg-ink-50 px-4 py-5 text-center">
                  <CalendarClock className="mx-auto mb-1.5 h-5 w-5 text-ink-400" />
                  <p className="text-[12.5px] font-medium text-ink-700">{t('trf.window.empty')}</p>
                  <p className="mt-0.5 text-[12px] text-ink-500">{t('trf.window.emptyDesc')}</p>
                </div>
              )}

              {draft.windows.map((window, wi) => (
                <div key={window.id} className="rounded-[9px] border border-ink-200 p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <div className="min-w-[140px] flex-1">
                      <Input
                        className="h-8"
                        aria-label={t('trf.window.label')}
                        placeholder={t('trf.window.label')}
                        value={window.label}
                        onChange={(e) => setWindow(wi, { label: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-1.5" dir="ltr">
                      <Input
                        type="number"
                        min={0}
                        max={24}
                        className="h-8 w-[72px] tnum"
                        aria-label={t('trf.window.from')}
                        value={window.fromHour}
                        onChange={(e) => setWindow(wi, { fromHour: Number(e.target.value) })}
                      />
                      <span className="text-ink-400">–</span>
                      <Input
                        type="number"
                        min={0}
                        max={24}
                        className="h-8 w-[72px] tnum"
                        aria-label={t('trf.window.to')}
                        value={window.toHour}
                        onChange={(e) => setWindow(wi, { toHour: Number(e.target.value) })}
                      />
                    </div>
                    <div className="w-[110px]">
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        className="h-8 tnum"
                        aria-label={t('trf.window.price')}
                        value={window.pricePerKwh}
                        onChange={(e) => setWindow(wi, { pricePerKwh: Number(e.target.value) })}
                      />
                    </div>
                    <IconButton
                      label={t('common.remove')}
                      size="sm"
                      variant="ghost"
                      onClick={() => set('windows', draft.windows.filter((_, i) => i !== wi))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconButton>
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                      const on = window.days.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() =>
                            setWindow(wi, { days: on ? window.days.filter((d) => d !== day) : [...window.days, day].sort() })
                          }
                          className={
                            'h-7 min-w-[38px] rounded-[6px] border px-1.5 text-[11.5px] transition-colors ' +
                            (on
                              ? 'border-brand-200 bg-brand-50 font-medium text-brand-800'
                              : 'border-ink-200 bg-white text-ink-500 hover:bg-ink-50')
                          }
                        >
                          {t(`loc.day.${day}` as never).slice(0, 3)}
                        </button>
                      );
                    })}
                    {window.toHour <= window.fromHour && (
                      <span className="ms-2 text-[11.5px] text-accent-700">{t('trf.window.overnight')}</span>
                    )}
                  </div>
                </div>
              ))}

              <Button
                size="sm"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() =>
                  set('windows', [
                    ...draft.windows,
                    { id: uid('win'), label: '', days: [0, 1, 2, 3, 4], fromHour: 16, toHour: 22, pricePerKwh: draft.basePricePerKwh, pricePerMinute: 0 },
                  ])
                }
              >
                {t('trf.addWindow')}
              </Button>
            </div>
          )}
        </section>

        {/* ---- Fees ------------------------------------------------------- */}
        <section>
          <h4 className="mb-1 text-[13px] font-semibold text-ink-900">{t('trf.section.fees')}</h4>
          <p className="mb-3 text-[12px] text-ink-500">{t('trf.section.feesHint')}</p>

          <p className="mb-2 text-[11.5px] font-medium uppercase tracking-wide text-ink-500">{t('trf.preview.session')}</p>
          <FormGrid columns={2}>
            <Field label={t('trf.field.sessionFee')} htmlFor="trf-session">
              <Input id="trf-session" type="number" step="0.5" min={0} className="tnum" value={draft.fees.sessionFee} onChange={(e) => setFee('sessionFee', Number(e.target.value))} />
            </Field>
            <Field label={t('trf.field.minimumCharge')} htmlFor="trf-minimum">
              <Input id="trf-minimum" type="number" step="0.5" min={0} className="tnum" value={draft.fees.minimumCharge} onChange={(e) => setFee('minimumCharge', Number(e.target.value))} />
            </Field>
          </FormGrid>

          <p className="mb-2 mt-4 text-[11.5px] font-medium uppercase tracking-wide text-ink-500">{t('trf.preview.idle')}</p>
          <FormGrid columns={3}>
            <Field label={t('trf.field.idleFee')} htmlFor="trf-idle">
              <Input id="trf-idle" type="number" step="0.25" min={0} className="tnum" value={draft.fees.idleFeePerMinute} onChange={(e) => setFee('idleFeePerMinute', Number(e.target.value))} />
            </Field>
            <Field label={t('trf.field.idleGrace')} htmlFor="trf-idle-grace">
              <Input id="trf-idle-grace" type="number" min={0} className="tnum" value={draft.fees.idleGraceMinutes} onChange={(e) => setFee('idleGraceMinutes', Number(e.target.value))} />
            </Field>
            <Field label={t('trf.field.idleCap')} htmlFor="trf-idle-cap">
              <Input id="trf-idle-cap" type="number" min={0} className="tnum" value={draft.fees.idleFeeCap} onChange={(e) => setFee('idleFeeCap', Number(e.target.value))} />
            </Field>
          </FormGrid>

          <p className="mb-2 mt-4 text-[11.5px] font-medium uppercase tracking-wide text-ink-500">{t('cfg.reservation')}</p>
          <FormGrid columns={3}>
            <Field label={t('trf.field.reservationFee')} htmlFor="trf-res">
              <Input id="trf-res" type="number" step="0.5" min={0} className="tnum" value={draft.fees.reservationFee} onChange={(e) => setFee('reservationFee', Number(e.target.value))} />
            </Field>
            <Field label={t('trf.field.rebookingFee')} htmlFor="trf-rebook">
              <Input id="trf-rebook" type="number" step="0.5" min={0} className="tnum" value={draft.fees.rebookingFee} onChange={(e) => setFee('rebookingFee', Number(e.target.value))} />
            </Field>
            <Field label={t('trf.field.noShowFee')} htmlFor="trf-noshow">
              <Input id="trf-noshow" type="number" step="0.5" min={0} className="tnum" value={draft.fees.noShowFee} onChange={(e) => setFee('noShowFee', Number(e.target.value))} />
            </Field>
            <Field label={t('trf.field.cancellationFee')} htmlFor="trf-cancel">
              <Input id="trf-cancel" type="number" step="0.5" min={0} className="tnum" value={draft.fees.cancellationFee} onChange={(e) => setFee('cancellationFee', Number(e.target.value))} />
            </Field>
            <Field label={t('trf.field.cancellationGrace')} htmlFor="trf-cancel-grace">
              <Input id="trf-cancel-grace" type="number" min={0} className="tnum" value={draft.fees.cancellationGraceMinutes} onChange={(e) => setFee('cancellationGraceMinutes', Number(e.target.value))} />
            </Field>
          </FormGrid>
        </section>

        {/* ---- Validity --------------------------------------------------- */}
        <section>
          <h4 className="mb-3 text-[13px] font-semibold text-ink-900">{t('trf.section.validity')}</h4>
          <FormGrid>
            <Field label={t('trf.field.validFrom')} htmlFor="trf-from">
              <Input id="trf-from" type="date" className="tnum" value={draft.validFrom.slice(0, 10)} onChange={(e) => set('validFrom', e.target.value)} />
            </Field>
            <Field label={t('trf.field.validTo')} hint={t('common.notSet')} htmlFor="trf-to">
              <Input id="trf-to" type="date" className="tnum" value={draft.validTo?.slice(0, 10) ?? ''} onChange={(e) => set('validTo', e.target.value || null)} />
            </Field>
          </FormGrid>
        </section>

        {/* ---- Worked example --------------------------------------------- */}
        <section className="rounded-[9px] border border-brand-100 bg-brand-50/50 p-3">
          <h4 className="text-[13px] font-semibold text-brand-900">{t('trf.preview')}</h4>
          <p className="mb-2 text-[12px] text-brand-800/75">{t('trf.previewHint')}</p>
          <SummaryRow label={t('trf.preview.energy')} value={<Money value={example.energy} currency={draft.currency} />} />
          {draft.basePricePerMinute > 0 && (
            <SummaryRow label={t('trf.preview.time')} value={<Money value={example.time} currency={draft.currency} />} />
          )}
          {draft.fees.sessionFee > 0 && (
            <SummaryRow label={t('trf.preview.session')} value={<Money value={example.session} currency={draft.currency} />} />
          )}
          {example.idle > 0 && (
            <SummaryRow label={t('trf.preview.idle')} value={<Money value={example.idle} currency={draft.currency} />} />
          )}
          <SummaryRow label={t('trf.preview.vat')} value={<Money value={example.vat} currency={draft.currency} />} />
          <div className="mt-1.5 flex items-center justify-between border-t border-brand-200 pt-2">
            <span className="text-[12.5px] font-semibold text-brand-900">{t('trf.preview.total')}</span>
            <span className="text-[14px] font-semibold text-brand-900">
              <Money value={example.total} currency={draft.currency} />
            </span>
          </div>
        </section>

        <Hint>{t('trf.defaultHint')}</Hint>
      </div>
    </Drawer>
  );
}
