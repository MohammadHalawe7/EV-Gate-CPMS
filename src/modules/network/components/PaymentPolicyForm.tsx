/* =============================================================================
 * Payment policy editor.
 *
 * Payment is commercial policy, so its home is the company. A location may
 * override it, and this component is used for both — the only difference is
 * who owns the value, which the caller states.
 *
 * It deliberately does not appear at charger level. Repeating payment rules
 * per charger is how an operator ends up with one bay that takes cards and
 * another that does not, for no reason anybody can reconstruct.
 * ========================================================================== */

import { useI18n } from '@/i18n';
import { Field, Input, Select, Switch, Checkbox } from '@/components/ui/Field';
import { Money } from '@/components/common';
import {
  PAYMENT_METHODS,
  WALLET_KINDS,
  type PaymentPolicy,
} from '@/domain/network';
import { FormGrid, Hint, Span } from './primitives';

export function PaymentPolicyForm({
  value,
  onChange,
  disabled,
}: {
  value: PaymentPolicy;
  onChange: (next: PaymentPolicy) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const set = <K extends keyof PaymentPolicy>(field: K, next: PaymentPolicy[K]) =>
    onChange({ ...value, [field]: next });

  const toggleMethod = (method: PaymentPolicy['methods'][number]) =>
    set(
      'methods',
      value.methods.includes(method) ? value.methods.filter((m) => m !== method) : [...value.methods, method],
    );

  return (
    <div className="space-y-5">
      {/* ---- Methods ------------------------------------------------------ */}
      <section>
        <h4 className="text-[13px] font-semibold text-ink-900">{t('pay.methods')}</h4>
        <p className="mb-2.5 text-[12px] text-ink-500">{t('pay.methodsHint')}</p>
        <div className="flex flex-wrap gap-1.5">
          {PAYMENT_METHODS.map((method) => {
            const on = value.methods.includes(method);
            return (
              <button
                key={method}
                type="button"
                disabled={disabled}
                onClick={() => toggleMethod(method)}
                className={
                  'rounded-full border px-3 py-1.5 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ' +
                  (on
                    ? 'border-brand-200 bg-brand-50 font-medium text-brand-800'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:bg-ink-50')
                }
              >
                {t(`pm.${method}` as never)}
              </button>
            );
          })}
        </div>
        {value.methods.length === 0 && (
          <div className="mt-2.5">
            <Hint tone="warning">{t('pay.methodsHint')}</Hint>
          </div>
        )}
      </section>

      {/* ---- Wallet ------------------------------------------------------- */}
      <section>
        <h4 className="mb-2.5 text-[13px] font-semibold text-ink-900">{t('pay.wallet')}</h4>
        <FormGrid>
          <Field label={t('pay.wallet')} hint={t('pay.walletHint')} htmlFor="pay-wallet">
            <Select
              id="pay-wallet"
              disabled={disabled}
              value={value.wallet}
              onChange={(e) => set('wallet', e.target.value as PaymentPolicy['wallet'])}
            >
              {WALLET_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {t(`wallet.${kind}` as never)}
                </option>
              ))}
            </Select>
          </Field>
          {value.wallet === 'External' && (
            <Field label={t('pay.provider')} htmlFor="pay-provider">
              <Input
                id="pay-provider"
                disabled={disabled}
                value={value.externalWalletProvider}
                onChange={(e) => set('externalWalletProvider', e.target.value)}
                placeholder="Network International"
              />
            </Field>
          )}
          <Field label={t('pay.currency')} htmlFor="pay-currency">
            <Select id="pay-currency" disabled={disabled} value={value.currency} onChange={(e) => set('currency', e.target.value)}>
              {['AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'USD', 'EUR'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
        </FormGrid>
      </section>

      {/* ---- Top-up ------------------------------------------------------- */}
      {value.wallet !== 'None' && (
        <section>
          <h4 className="mb-2.5 text-[13px] font-semibold text-ink-900">{t('pay.topUp')}</h4>
          <div className="space-y-3">
            <Switch
              disabled={disabled}
              checked={value.topUp.enabled}
              onChange={(v) => set('topUp', { ...value.topUp, enabled: v })}
              label={t('pay.topUpEnabled')}
            />
            {value.topUp.enabled && (
              <FormGrid>
                <Field label={t('pay.minTopUp')} htmlFor="pay-min-topup">
                  <Input
                    id="pay-min-topup"
                    type="number"
                    min={0}
                    className="tnum"
                    disabled={disabled}
                    value={value.topUp.minimumTopUp}
                    onChange={(e) => set('topUp', { ...value.topUp, minimumTopUp: Number(e.target.value) })}
                  />
                </Field>
                <Field label={t('pay.suggested')} hint="50, 100, 200" htmlFor="pay-suggested">
                  <Input
                    id="pay-suggested"
                    dir="ltr"
                    className="tnum"
                    disabled={disabled}
                    value={value.topUp.suggestedAmounts.join(', ')}
                    onChange={(e) =>
                      set('topUp', {
                        ...value.topUp,
                        suggestedAmounts: e.target.value
                          .split(',')
                          .map((part) => Number(part.trim()))
                          .filter((n) => Number.isFinite(n) && n > 0),
                      })
                    }
                  />
                </Field>
                <Span>
                  <Checkbox
                    disabled={disabled}
                    checked={value.topUp.autoTopUpEnabled}
                    onChange={(v) => set('topUp', { ...value.topUp, autoTopUpEnabled: v })}
                    label={t('pay.autoTopUp')}
                  />
                </Span>
                {value.topUp.autoTopUpEnabled && (
                  <>
                    <Field label={t('pay.autoThreshold')} htmlFor="pay-auto-threshold">
                      <Input
                        id="pay-auto-threshold"
                        type="number"
                        min={0}
                        className="tnum"
                        disabled={disabled}
                        value={value.topUp.autoTopUpThreshold}
                        onChange={(e) => set('topUp', { ...value.topUp, autoTopUpThreshold: Number(e.target.value) })}
                      />
                    </Field>
                    <Field label={t('pay.autoAmount')} htmlFor="pay-auto-amount">
                      <Input
                        id="pay-auto-amount"
                        type="number"
                        min={0}
                        className="tnum"
                        disabled={disabled}
                        value={value.topUp.autoTopUpAmount}
                        onChange={(e) => set('topUp', { ...value.topUp, autoTopUpAmount: Number(e.target.value) })}
                      />
                    </Field>
                  </>
                )}
              </FormGrid>
            )}
          </div>
        </section>
      )}

      {/* ---- Limits ------------------------------------------------------- */}
      <section>
        <h4 className="mb-2.5 text-[13px] font-semibold text-ink-900">{t('pay.limits')}</h4>
        <FormGrid columns={3}>
          {value.wallet !== 'None' && (
            <Field label={t('pay.minBalance')} htmlFor="pay-min-balance">
              <Input
                id="pay-min-balance"
                type="number"
                min={0}
                className="tnum"
                disabled={disabled}
                value={value.minimumWalletBalance}
                onChange={(e) => set('minimumWalletBalance', Number(e.target.value))}
              />
            </Field>
          )}
          {value.methods.includes('Card') && (
            <>
              <Field label={t('pay.minCard')} htmlFor="pay-min-card">
                <Input
                  id="pay-min-card"
                  type="number"
                  min={0}
                  className="tnum"
                  disabled={disabled}
                  value={value.minimumCardPayment}
                  onChange={(e) => set('minimumCardPayment', Number(e.target.value))}
                />
              </Field>
              <Field label={t('pay.preAuth')} hint={t('pay.preAuthHint')} htmlFor="pay-preauth">
                <Input
                  id="pay-preauth"
                  type="number"
                  min={0}
                  className="tnum"
                  disabled={disabled}
                  value={value.preAuthorisationAmount}
                  onChange={(e) => set('preAuthorisationAmount', Number(e.target.value))}
                />
              </Field>
            </>
          )}
        </FormGrid>
      </section>
    </div>
  );
}

/** A compact read-only rendering, for panels that only report the policy. */
export function PaymentPolicySummary({ policy }: { policy: PaymentPolicy }) {
  const { t } = useI18n();
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      <div className="sm:col-span-full">
        <dt className="text-[11.5px] font-medium uppercase tracking-wide text-ink-500">{t('pay.methods')}</dt>
        <dd className="mt-1 flex flex-wrap gap-1.5">
          {policy.methods.length === 0 ? (
            <span className="text-[12.5px] text-danger-700">{t('common.none')}</span>
          ) : (
            policy.methods.map((method) => (
              <span key={method} className="rounded-full bg-ink-100 px-2 py-0.5 text-[11.5px] text-ink-700">
                {t(`pm.${method}` as never)}
              </span>
            ))
          )}
        </dd>
      </div>
      <div>
        <dt className="text-[11.5px] font-medium uppercase tracking-wide text-ink-500">{t('pay.wallet')}</dt>
        <dd className="mt-0.5 text-[13px] text-ink-900">{t(`wallet.${policy.wallet}` as never)}</dd>
      </div>
      {policy.wallet !== 'None' && (
        <div>
          <dt className="text-[11.5px] font-medium uppercase tracking-wide text-ink-500">{t('pay.minBalance')}</dt>
          <dd className="mt-0.5 text-[13px] text-ink-900">
            <Money value={policy.minimumWalletBalance} currency={policy.currency} decimals={0} />
          </dd>
        </div>
      )}
      {policy.methods.includes('Card') && (
        <>
          <div>
            <dt className="text-[11.5px] font-medium uppercase tracking-wide text-ink-500">{t('pay.minCard')}</dt>
            <dd className="mt-0.5 text-[13px] text-ink-900">
              <Money value={policy.minimumCardPayment} currency={policy.currency} decimals={0} />
            </dd>
          </div>
          <div>
            <dt className="text-[11.5px] font-medium uppercase tracking-wide text-ink-500">{t('pay.preAuth')}</dt>
            <dd className="mt-0.5 text-[13px] text-ink-900">
              <Money value={policy.preAuthorisationAmount} currency={policy.currency} decimals={0} />
            </dd>
          </div>
        </>
      )}
    </dl>
  );
}
