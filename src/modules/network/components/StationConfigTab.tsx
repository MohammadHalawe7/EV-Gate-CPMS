/* =============================================================================
 * Station → Configuration.
 *
 * The original form put forty fields on one page in the order the database
 * stores them. This reorganises them into the four questions an operator
 * actually asks — who may charge, what happens during a session, how the
 * station shares the site's power, and what it costs — and holds the whole
 * page in one draft so nothing is half-saved.
 *
 * Capabilities gate the controls: a charger with no card terminal shows the
 * option disabled and says why, instead of letting somebody switch on
 * something the hardware cannot do.
 * ========================================================================== */

import { useI18n } from '@/i18n';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Checkbox, Field, Input, Select, SegmentedControl, Switch } from '@/components/ui/Field';
import { Tooltip } from '@/components/ui/Tooltip';
import { useToast } from '@/components/ui/Toast';
import { Link } from 'react-router-dom';
import { networkActions, useNetwork, useTariffResolver } from '@/data/networkStore';
import { PRIVILEGES, useSession } from '@/app/session';
import { APP_ROUTES } from '@/app/navigation';
import {
  ACCESS_TYPES,
  AUTH_METHODS,
  LOAD_BALANCING_MODES,
  OFFLINE_BEHAVIOURS,
  type AuthMethod,
  type ChargingStation,
  type HardwareCapabilities,
  type HardwareProfile,
  type StationConfig,
} from '@/domain/network';
import { FormGrid, InheritedFrom, Section, Span, UnsavedBar, useDraft } from './primitives';

/** Which hardware capability each authorisation method depends on. */
const AUTH_REQUIRES: Partial<Record<AuthMethod, keyof HardwareCapabilities>> = {
  RfidCard: 'rfidReader',
  AdHocCard: 'paymentTerminal',
  PlugAndCharge: 'plugAndCharge',
  Anpr: 'anpr',
};

export function StationConfigTab({
  station,
  profile,
}: {
  station: ChargingStation;
  profile: HardwareProfile | undefined;
}) {
  const { t, ln } = useI18n();
  const net = useNetwork();
  const toast = useToast();
  const { can } = useSession();
  const resolveFor = useTariffResolver();

  const mayManage = can(PRIVILEGES.stationsManage);
  const form = useDraft<StationConfig>(station.config);
  const { draft } = form;

  const caps = profile?.capabilities;
  const activeTariffs = net.tariffs.filter((tf) => tf.status === 'Active');
  const resolved = resolveFor({ stationId: station.id });
  const ownTariff = station.tariffId !== null;

  function supports(method: AuthMethod) {
    const required = AUTH_REQUIRES[method];
    if (!required || !caps) return true;
    return caps[required];
  }

  function patchAccess(patch: Partial<StationConfig['access']>) {
    form.patch({ access: { ...draft.access, ...patch } } as Partial<StationConfig>);
  }
  function patchPolicy(patch: Partial<StationConfig['policy']>) {
    form.patch({ policy: { ...draft.policy, ...patch } } as Partial<StationConfig>);
  }
  function patchSmart(patch: Partial<StationConfig['smart']>) {
    form.patch({ smart: { ...draft.smart, ...patch } } as Partial<StationConfig>);
  }

  function toggleAuth(method: AuthMethod, on: boolean) {
    const next = on
      ? [...draft.access.authMethods, method]
      : draft.access.authMethods.filter((m) => m !== method);
    patchAccess({ authMethods: next });
  }

  function save() {
    form.commit((value) => networkActions.updateStationConfig(station.id, value));
    toast.success(t('cfg.savedToast'));
  }

  const noAuth = draft.access.authMethods.length === 0;

  return (
    <>
      <div className="space-y-4 pb-16">
        {/* ---- Access & authorisation ------------------------------------- */}
        <Section title={t('cfg.access')} subtitle={t('cfg.accessHint')}>
          <FormGrid columns={2}>
            <Span>
              <Field label={t('cfg.visibility')} hint={t('cfg.visibilityHint')}>
                <div>
                  <SegmentedControl
                    value={draft.access.visibility}
                    onChange={(value) => patchAccess({ visibility: value })}
                    options={ACCESS_TYPES.map((v) => ({ value: v, label: t(`access.${v}` as never) }))}
                  />
                </div>
              </Field>
            </Span>

            <Span>
              <Field label={t('cfg.authMethods')} hint={t('cfg.authMethodsHint')}>
                <div className="flex flex-col gap-2 pt-0.5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
                  {AUTH_METHODS.map((method) => {
                    const ok = supports(method);
                    const control = (
                      <Checkbox
                        checked={draft.access.authMethods.includes(method)}
                        onChange={(on) => toggleAuth(method, on)}
                        disabled={!ok || !mayManage}
                        label={t(`authm.${method}` as never)}
                      />
                    );
                    return (
                      <span key={method}>
                        {ok ? control : <Tooltip label={t('cfg.notSupported')}>{control}</Tooltip>}
                      </span>
                    );
                  })}
                </div>
              </Field>
            </Span>

            {noAuth && (
              <Span>
                <Alert tone="warning">{t('cfg.noAuthWarning')}</Alert>
              </Span>
            )}

            <Switch
              checked={draft.access.roamingEnabled}
              onChange={(on) => patchAccess({ roamingEnabled: on })}
              label={t('cfg.roaming')}
              hint={t('svc.field.roamingHint')}
              disabled={!mayManage}
            />
            <Switch
              checked={draft.access.reservationEnabled}
              onChange={(on) => patchAccess({ reservationEnabled: on })}
              label={t('cfg.reservationEnabled')}
              hint={caps && !caps.reservation ? t('cfg.notSupported') : undefined}
              disabled={!mayManage || (caps ? !caps.reservation : false)}
            />
            {draft.access.reservationEnabled && (
              <Field label={t('cfg.reservationMax')} htmlFor="cfg-reservation-max">
                <Input
                  id="cfg-reservation-max"
                  type="number"
                  min={0}
                  value={draft.access.reservationMaxMinutes}
                  onChange={(e) => patchAccess({ reservationMaxMinutes: Number(e.target.value) })}
                  disabled={!mayManage}
                />
              </Field>
            )}
          </FormGrid>
        </Section>

        {/* ---- Charging policy -------------------------------------------- */}
        <Section title={t('cfg.policy')} subtitle={t('cfg.policyHint')}>
          <FormGrid columns={2}>
            <Field label={t('cfg.offline')} hint={t('cfg.offlineHint')} htmlFor="cfg-offline">
              <Select
                id="cfg-offline"
                value={draft.policy.offlineBehaviour}
                onChange={(e) => patchPolicy({ offlineBehaviour: e.target.value as StationConfig['policy']['offlineBehaviour'] })}
                disabled={!mayManage}
              >
                {OFFLINE_BEHAVIOURS.map((v) => (
                  <option key={v} value={v}>
                    {t(`offline.${v}` as never)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={t('cfg.idleGrace')} hint={t('cfg.idleGraceHint')} htmlFor="cfg-idle">
              <Input
                id="cfg-idle"
                type="number"
                min={0}
                value={draft.policy.idleGraceMinutes}
                onChange={(e) => patchPolicy({ idleGraceMinutes: Number(e.target.value) })}
                disabled={!mayManage}
              />
            </Field>

            <Span>
              <Field label={t('cfg.limits')} hint={t('cfg.limitsHint')}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label={t('cfg.maxMinutes')} htmlFor="cfg-max-min">
                    <Input
                      id="cfg-max-min"
                      type="number"
                      min={0}
                      value={draft.policy.maxSessionMinutes}
                      onChange={(e) => patchPolicy({ maxSessionMinutes: Number(e.target.value) })}
                      disabled={!mayManage}
                    />
                  </Field>
                  <Field label={t('cfg.maxKwh')} htmlFor="cfg-max-kwh">
                    <Input
                      id="cfg-max-kwh"
                      type="number"
                      min={0}
                      value={draft.policy.maxSessionKwh}
                      onChange={(e) => patchPolicy({ maxSessionKwh: Number(e.target.value) })}
                      disabled={!mayManage}
                    />
                  </Field>
                  <Field label={t('cfg.maxCost')} htmlFor="cfg-max-cost">
                    <Input
                      id="cfg-max-cost"
                      type="number"
                      min={0}
                      value={draft.policy.maxSessionCost}
                      onChange={(e) => patchPolicy({ maxSessionCost: Number(e.target.value) })}
                      disabled={!mayManage}
                    />
                  </Field>
                </div>
              </Field>
            </Span>

            <Switch
              checked={draft.policy.stopOnFullCharge}
              onChange={(on) => patchPolicy({ stopOnFullCharge: on })}
              label={t('cfg.stopOnFull')}
              disabled={!mayManage}
            />
            <Switch
              checked={draft.policy.allowSimultaneousCharging}
              onChange={(on) => patchPolicy({ allowSimultaneousCharging: on })}
              label={t('cfg.simultaneous')}
              hint={t('cfg.simultaneousHint')}
              disabled={!mayManage}
            />
          </FormGrid>
        </Section>

        {/* ---- Smart charging --------------------------------------------- */}
        <Section title={t('cfg.smart')} subtitle={t('cfg.smartHint')}>
          <FormGrid columns={2}>
            <Span>
              <Switch
                checked={draft.smart.enabled}
                onChange={(on) => patchSmart({ enabled: on })}
                label={t('cfg.smartEnabled')}
                hint={caps && !caps.smartCharging ? t('cfg.notSupported') : undefined}
                disabled={!mayManage || (caps ? !caps.smartCharging : false)}
              />
            </Span>

            {draft.smart.enabled && (
              <>
                <Field label={t('cfg.maxCurrent')} htmlFor="cfg-max-current">
                  <Input
                    id="cfg-max-current"
                    type="number"
                    min={0}
                    value={draft.smart.maxCurrentA}
                    onChange={(e) => patchSmart({ maxCurrentA: Number(e.target.value) })}
                    disabled={!mayManage}
                  />
                </Field>
                <Field label={t('cfg.loadBalancing')} htmlFor="cfg-lb">
                  <Select
                    id="cfg-lb"
                    value={draft.smart.loadBalancing}
                    onChange={(e) => patchSmart({ loadBalancing: e.target.value as StationConfig['smart']['loadBalancing'] })}
                    disabled={!mayManage || (caps ? !caps.loadBalancing : false)}
                  >
                    {LOAD_BALANCING_MODES.map((v) => (
                      <option key={v} value={v}>
                        {t(`lb.${v}` as never)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t('cfg.priority')} hint={t('cfg.priorityHint')} htmlFor="cfg-priority">
                  <Input
                    id="cfg-priority"
                    type="number"
                    min={0}
                    max={10}
                    value={draft.smart.priority}
                    onChange={(e) => patchSmart({ priority: Number(e.target.value) })}
                    disabled={!mayManage}
                  />
                </Field>
              </>
            )}
          </FormGrid>
        </Section>

        {/* ---- Tariff ------------------------------------------------------
            Saved immediately rather than through the draft: a tariff change
            is an assignment, not a form edit, and it is the one setting on
            this page that is also reachable from three other screens. ---- */}
        <Section title={t('cfg.tariffTitle')} subtitle={t('cfg.tariffHint')}>
          <div className="flex flex-wrap items-end gap-3">
            {ownTariff ? (
              <div className="w-full max-w-[280px]">
                <Field label={t('evse.col.tariff')} htmlFor="cfg-tariff">
                  <Select
                    id="cfg-tariff"
                    value={station.tariffId ?? ''}
                    onChange={(e) => networkActions.assignTariff('station', [station.id], e.target.value || null)}
                    disabled={!can(PRIVILEGES.tariffsManage)}
                  >
                    {activeTariffs.map((tf) => (
                      <option key={tf.id} value={tf.id}>
                        {ln(tf)}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            ) : (
              <div className="min-w-0">
                <div className="mb-1 text-[12.5px] font-medium text-ink-700">{t('evse.col.tariff')}</div>
                {resolved.tariff ? (
                  <Link
                    to={APP_ROUTES.tariff(resolved.tariff.id)}
                    className="text-[13px] font-medium text-ink-900 hover:text-brand-800"
                  >
                    {ln(resolved.tariff)}
                  </Link>
                ) : (
                  <span className="text-[12.5px] text-ink-400">{t('inherit.none')}</span>
                )}
              </div>
            )}

            <InheritedFrom
              className="pb-2"
              source={resolved.source}
              own={ownTariff}
              onOverride={
                can(PRIVILEGES.tariffsManage)
                  ? () =>
                      networkActions.assignTariff(
                        'station',
                        [station.id],
                        resolved.tariffId ?? activeTariffs[0]?.id ?? null,
                      )
                  : undefined
              }
              onClear={
                can(PRIVILEGES.tariffsManage)
                  ? () => networkActions.assignTariff('station', [station.id], null)
                  : undefined
              }
            />

            {resolved.tariff && (
              <Badge tone="neutral" size="sm" className="mb-2">
                {resolved.tariff.code}
              </Badge>
            )}
          </div>
        </Section>
      </div>

      <UnsavedBar dirty={form.dirty && mayManage} onSave={save} onDiscard={form.reset} />
    </>
  );
}
