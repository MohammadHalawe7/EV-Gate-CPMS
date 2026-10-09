/* =============================================================================
 * Add EV charging to a location.
 *
 * Three steps rather than one long form. The order matters: what the site is
 * for, what it costs, how drivers pay. Each step inherits a sensible default
 * from the company, so an operator can accept all three and still end up with
 * a correctly configured site.
 * ========================================================================== */

import { useMemo, useState } from 'react';
import { Check, CreditCard, Tags, Zap } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Modal } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Switch } from '@/components/ui/Field';
import { Stepper } from '@/components/ui/Stepper';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import { Money } from '@/components/common';
import { formatNumber } from '@/lib/utils';
import { networkActions, useNetwork } from '@/data/networkStore';
import { EV_CHARGING_SERVICE_ID, type EvChargingServiceConfig, type Location, type PaymentPolicy } from '@/domain/network';
import { FormGrid, Hint, Span, SummaryRow } from './primitives';
import { PaymentPolicyForm } from './PaymentPolicyForm';

export function AddEvChargingDrawer({
  open,
  onClose,
  location,
}: {
  open: boolean;
  onClose: () => void;
  location: Location;
}) {
  const { t, ln } = useI18n();
  const toast = useToast();
  const net = useNetwork();
  const [step, setStep] = useState(0);

  const companyDefault = net.tariffs.find((tf) => tf.isCompanyDefault);
  const activeTariffs = net.tariffs.filter((tf) => tf.status === 'Active');

  const [config, setConfig] = useState<EvChargingServiceConfig>({
    defaultTariffId: null,
    payment: null,
    siteLoadLimitKw: location.gridCapacityKw,
    publicListing: location.accessType === 'Public',
    roamingEnabled: location.accessType === 'Public',
    supportPhone: '+971 800 383 4283',
  });
  const [overridePayment, setOverridePayment] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState<PaymentPolicy>(net.companyPayment);

  const set = <K extends keyof EvChargingServiceConfig>(field: K, value: EvChargingServiceConfig[K]) =>
    setConfig((prev) => ({ ...prev, [field]: value }));

  const steps = useMemo(
    () => [
      { key: 'basics', label: t('svc.step.basics'), description: t('svc.step.basicsHint') },
      { key: 'pricing', label: t('svc.step.pricing'), description: t('svc.step.pricingHint') },
      { key: 'payment', label: t('svc.step.payment'), description: t('svc.step.paymentHint') },
    ],
    [t],
  );

  const overLimit = config.siteLoadLimitKw > location.gridCapacityKw;

  const finish = () => {
    networkActions.enableService(location.id, EV_CHARGING_SERVICE_ID, {
      ...config,
      payment: overridePayment ? paymentDraft : null,
    });
    toast.success(t('svc.enabledToast'), t('svc.enabledToastDesc'));
    onClose();
    setStep(0);
  };

  const selectedTariff = config.defaultTariffId
    ? net.tariffs.find((tf) => tf.id === config.defaultTariffId)
    : companyDefault;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={t('svc.wizardTitle', { name: ln(location) })}
      description={t('svc.wizardSubtitle')}
      footer={
        <>
          {step > 0 && <Button onClick={() => setStep((s) => s - 1)}>{t('common.back')}</Button>}
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          {step < steps.length - 1 ? (
            <Button variant="primary" onClick={() => setStep((s) => s + 1)}>
              {t('common.next')}
            </Button>
          ) : (
            <Button variant="primary" icon={<Check className="h-4 w-4" />} onClick={finish}>
              {t('svc.addEv')}
            </Button>
          )}
        </>
      }
    >
      <Stepper steps={steps} current={step} onSelect={(i) => i < step && setStep(i)} className="mb-5" />

      {/* ---- 1 · Basics ---------------------------------------------------- */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-[9px] border border-brand-100 bg-brand-50/60 p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white text-brand-700">
              <Zap className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[13px] font-medium text-brand-900">{t('svc.evTitle')}</p>
              <p className="text-[12px] text-brand-800/80">{t('svc.evDesc')}</p>
            </div>
          </div>

          <FormGrid columns={1}>
            <Switch
              checked={config.publicListing}
              onChange={(v) => set('publicListing', v)}
              label={t('svc.field.publicListing')}
              hint={t('svc.field.publicListingHint')}
            />
            <Switch
              checked={config.roamingEnabled}
              onChange={(v) => set('roamingEnabled', v)}
              label={t('svc.field.roaming')}
              hint={t('svc.field.roamingHint')}
            />
          </FormGrid>

          <FormGrid>
            <Field
              label={t('svc.field.loadLimit')}
              hint={t('svc.field.loadLimitHint')}
              error={overLimit ? t('power.overSubscribed') : undefined}
              htmlFor="svc-limit"
            >
              <Input
                id="svc-limit"
                type="number"
                min={0}
                className="tnum"
                value={config.siteLoadLimitKw}
                invalid={overLimit}
                onChange={(e) => set('siteLoadLimitKw', Number(e.target.value))}
              />
            </Field>
            <Field label={t('svc.field.supportPhone')} htmlFor="svc-phone">
              <Input id="svc-phone" dir="ltr" className="tnum" value={config.supportPhone} onChange={(e) => set('supportPhone', e.target.value)} />
            </Field>
            <Span>
              <Hint>
                {t('power.grid')}: {formatNumber(location.gridCapacityKw)} kW
              </Hint>
            </Span>
          </FormGrid>
        </div>
      )}

      {/* ---- 2 · Tariff ---------------------------------------------------- */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-[9px] border border-ink-200 bg-ink-50 p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white text-ink-500">
              <Tags className="h-4 w-4" />
            </span>
            <p className="text-[12px] leading-relaxed text-ink-600">{t('pricing.tariffHint')}</p>
          </div>

          <Field label={t('pricing.tariffTitle')} htmlFor="svc-tariff">
            <Select id="svc-tariff" value={config.defaultTariffId ?? ''} onChange={(e) => set('defaultTariffId', e.target.value || null)}>
              <option value="">
                {t('pricing.useCompanyDefault')}
                {companyDefault ? ` — ${ln(companyDefault)}` : ''}
              </option>
              {activeTariffs.map((tariff) => (
                <option key={tariff.id} value={tariff.id}>
                  {ln(tariff)} · {tariff.code}
                </option>
              ))}
            </Select>
          </Field>

          {selectedTariff ? (
            <div className="rounded-[9px] border border-ink-200 p-3">
              <p className="mb-2 text-[12.5px] font-medium text-ink-900">{ln(selectedTariff)}</p>
              <SummaryRow
                label={t('trf.field.perKwh')}
                value={<Money value={selectedTariff.basePricePerKwh} currency={selectedTariff.currency} />}
              />
              <SummaryRow
                label={t('trf.field.sessionFee')}
                value={<Money value={selectedTariff.fees.sessionFee} currency={selectedTariff.currency} />}
              />
              <SummaryRow
                label={t('trf.field.idleFee')}
                value={<Money value={selectedTariff.fees.idleFeePerMinute} currency={selectedTariff.currency} />}
              />
              <SummaryRow
                label={t('trf.col.schedule')}
                value={selectedTariff.twentyFourSeven ? t('trf.alwaysOn') : t('trf.windows', { count: selectedTariff.windows.length })}
              />
            </div>
          ) : (
            <Alert tone="warning" compact>
              {t('inherit.none')}
            </Alert>
          )}
        </div>
      )}

      {/* ---- 3 · Payment --------------------------------------------------- */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-[9px] border border-ink-200 bg-ink-50 p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white text-ink-500">
              <CreditCard className="h-4 w-4" />
            </span>
            <p className="text-[12px] leading-relaxed text-ink-600">{t('pricing.paymentHint')}</p>
          </div>

          <Switch
            checked={overridePayment}
            onChange={setOverridePayment}
            label={t('pricing.overridePayment')}
            hint={overridePayment ? undefined : t('pricing.inheritPayment')}
          />

          {overridePayment ? (
            <PaymentPolicyForm value={paymentDraft} onChange={setPaymentDraft} />
          ) : (
            <div className="rounded-[9px] border border-ink-200 bg-white p-3">
              <p className="mb-2 text-[12px] text-ink-500">{t('pricing.inheritPayment')}</p>
              <div className="flex flex-wrap gap-1.5">
                {net.companyPayment.methods.map((method) => (
                  <span key={method} className="rounded-full bg-ink-100 px-2 py-0.5 text-[11.5px] text-ink-700">
                    {t(`pm.${method}` as never)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
