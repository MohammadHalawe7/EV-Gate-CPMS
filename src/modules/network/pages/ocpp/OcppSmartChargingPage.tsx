/* =============================================================================
 * OCPP → Smart charging.
 *
 * A charging profile is a schedule of power ceilings. The hard part for an
 * operator is not the fields but believing the result, so the editor draws
 * the day as a bar as you type: twenty-four hours wide, each period as tall
 * as its share of the profile's highest limit.
 *
 * Scope is a radio, not a free-for-all: a profile either caps a whole site or
 * one station, and the OCPP purpose follows from that choice.
 * ========================================================================== */

import { useMemo, useState } from 'react';
import { Gauge, Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Surface';
import { Field, Input, Radio, Select } from '@/components/ui/Field';
import { Drawer, ConfirmDialog } from '@/components/ui/Overlay';
import { useToast } from '@/components/ui/Toast';
import { cx, formatNumber } from '@/lib/utils';
import { networkActions, useNetwork } from '@/data/networkStore';
import { PRIVILEGES, useSession } from '@/app/session';
import { Can } from '@/app/guards';
import {
  CHARGING_PROFILE_PURPOSES,
  CHARGING_RATE_UNITS,
  type ChargingProfile,
  type ChargingRateUnit,
} from '@/domain/network';
import { FormGrid, Span } from '../../components/primitives';

type Period = ChargingProfile['periods'][number];

function hhmm(startSec: number): string {
  const minutes = Math.floor(startSec / 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function toSeconds(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return (h || 0) * 3600 + (m || 0) * 60;
}

/** The day as a bar. Width is the period's share of 24h, height its limit. */
function ScheduleBar({ periods, unit }: { periods: Period[]; unit: ChargingRateUnit }) {
  const sorted = [...periods].sort((a, b) => a.startSec - b.startSec);
  const peak = Math.max(1, ...sorted.map((p) => p.limit));

  return (
    <div className="flex h-20 items-end gap-px overflow-hidden rounded-[7px] border border-ink-200 bg-ink-50">
      {sorted.map((period, index) => {
        const end = index + 1 < sorted.length ? sorted[index + 1].startSec : 86400;
        const width = ((end - period.startSec) / 86400) * 100;
        const height = Math.max(8, (period.limit / peak) * 100);
        return (
          <div
            key={`${period.startSec}-${index}`}
            className="group relative flex items-end justify-center"
            style={{ width: `${width}%` }}
            title={`${hhmm(period.startSec)} · ${formatNumber(period.limit)} ${unit}`}
          >
            <div
              className={cx('w-full rounded-t-[3px]', index % 2 === 0 ? 'bg-brand-700' : 'bg-brand-500')}
              style={{ height: `${height}%` }}
            />
            {width > 12 && (
              <span className="absolute bottom-1 text-[10px] font-medium text-white">
                {formatNumber(period.limit)}
              </span>
            )}
          </div>
        );
      })}
      {sorted.length === 0 && (
        <span className="w-full self-center text-center text-[12px] text-ink-400">—</span>
      )}
    </div>
  );
}

export function OcppSmartChargingPage() {
  const { t, ln } = useI18n();
  const net = useNetwork();
  const toast = useToast();
  const { can } = useSession();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ChargingProfile | null>(null);
  const [removing, setRemoving] = useState<ChargingProfile | null>(null);

  const mayConfigure = can(PRIVILEGES.ocppConfigure);

  const nextProfileId = useMemo(
    () => net.chargingProfiles.reduce((n, p) => Math.max(n, p.profileId), 0) + 1,
    [net.chargingProfiles],
  );

  const [draft, setDraft] = useState({
    name: '',
    scope: 'location' as 'location' | 'station',
    locationId: '',
    stationId: '',
    purpose: 'ChargePointMaxProfile' as ChargingProfile['purpose'],
    stackLevel: 1,
    chargingRateUnit: 'W' as ChargingRateUnit,
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: '',
    periods: [
      { startSec: 0, limit: 22000, numberPhases: 3 },
      { startSec: 64800, limit: 11000, numberPhases: 3 },
    ] as Period[],
  });

  function openNew() {
    setEditing(null);
    setDraft((prev) => ({
      ...prev,
      name: '',
      scope: 'location',
      locationId: net.locations[0]?.id ?? '',
      stationId: '',
      purpose: 'ChargePointMaxProfile',
      stackLevel: 1,
    }));
    setEditorOpen(true);
  }

  function openEdit(profile: ChargingProfile) {
    setEditing(profile);
    setDraft({
      name: profile.name,
      scope: profile.locationId ? 'location' : 'station',
      locationId: profile.locationId ?? '',
      stationId: profile.stationId ?? '',
      purpose: profile.purpose,
      stackLevel: profile.stackLevel,
      chargingRateUnit: profile.chargingRateUnit,
      validFrom: profile.validFrom.slice(0, 10),
      validTo: profile.validTo?.slice(0, 10) ?? '',
      periods: profile.periods,
    });
    setEditorOpen(true);
  }

  const targetMissing =
    draft.scope === 'location' ? draft.locationId === '' : draft.stationId === '';
  const nameError = draft.name.trim() === '' ? t('form.required') : undefined;

  function save() {
    if (nameError || targetMissing) return;
    const payload = {
      name: draft.name.trim(),
      stationId: draft.scope === 'station' ? draft.stationId : null,
      locationId: draft.scope === 'location' ? draft.locationId : null,
      profileId: editing?.profileId ?? nextProfileId,
      stackLevel: draft.stackLevel,
      purpose: draft.purpose,
      kind: 'Recurring' as const,
      recurrency: 'Daily' as const,
      chargingRateUnit: draft.chargingRateUnit,
      validFrom: draft.validFrom,
      validTo: draft.validTo || null,
      periods: [...draft.periods].sort((a, b) => a.startSec - b.startSec),
      status: 'Active' as const,
    };

    if (editing) networkActions.updateChargingProfile(editing.id, payload);
    else networkActions.createChargingProfile(payload);

    toast.success(t('toast.saved'), payload.name);
    setEditorOpen(false);
  }

  function setPeriod(index: number, patch: Partial<Period>) {
    setDraft((prev) => ({
      ...prev,
      periods: prev.periods.map((period, i) => (i === index ? { ...period, ...patch } : period)),
    }));
  }

  const columns: Column<ChargingProfile>[] = [
    {
      key: 'profile',
      header: t('ocpp.sc.col.profile'),
      sortValue: (row) => row.name,
      render: (row) => (
        <button
          type="button"
          onClick={() => openEdit(row)}
          className="flex min-w-0 flex-col text-start hover:text-brand-800"
          disabled={!mayConfigure}
        >
          <span className="truncate text-[12.5px] font-medium text-ink-900">{row.name}</span>
          <span className="tnum truncate text-[11.5px] text-ink-500">
            #{row.profileId} · {row.kind}
            {row.recurrency ? ` · ${row.recurrency}` : ''}
          </span>
        </button>
      ),
    },
    {
      key: 'scope',
      header: t('ocpp.sc.col.scope'),
      width: '200px',
      sortValue: (row) => (row.locationId ? 'a' : 'b'),
      render: (row) => {
        if (row.locationId) {
          const location = net.locations.find((l) => l.id === row.locationId);
          return (
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[12.5px] text-ink-800">{location ? ln(location) : '—'}</span>
              <span className="text-[11.5px] text-ink-400">{t('ocpp.sc.scopeSite')}</span>
            </span>
          );
        }
        const station = net.stations.find((s) => s.id === row.stationId);
        return (
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[12.5px] text-ink-800">{station ? ln(station) : '—'}</span>
            <span className="text-[11.5px] text-ink-400">{t('ocpp.sc.scopeStation')}</span>
          </span>
        );
      },
    },
    {
      key: 'purpose',
      header: t('ocpp.sc.col.purpose'),
      width: '190px',
      sortValue: (row) => row.purpose,
      render: (row) => (
        <Badge tone="neutral" size="sm">
          {row.purpose}
        </Badge>
      ),
    },
    {
      key: 'stack',
      header: t('ocpp.sc.col.stack'),
      align: 'end',
      width: '90px',
      sortValue: (row) => row.stackLevel,
      render: (row) => <span className="tnum text-[12.5px] text-ink-700">{row.stackLevel}</span>,
    },
    {
      key: 'periods',
      header: t('ocpp.sc.col.periods'),
      width: '230px',
      render: (row) => (
        <span className="flex flex-wrap gap-1">
          {row.periods.map((period, index) => (
            <Badge key={index} tone="brand" size="sm">
              {t('ocpp.sc.limitAt', {
                limit: `${formatNumber(period.limit)} ${row.chargingRateUnit}`,
                time: hhmm(period.startSec),
              })}
            </Badge>
          ))}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      align: 'end',
      width: '110px',
      sortValue: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} label={t(`status.${row.status}` as never)} size="sm" />,
    },
    ...(mayConfigure
      ? [
          {
            key: 'actions',
            header: '',
            width: '48px',
            align: 'end' as const,
            render: (row: ChargingProfile) => (
              <Button
                size="xs"
                variant="ghost"
                icon={<Trash2 className="h-3.5 w-3.5" />}
                aria-label={t('common.delete')}
                title={t('common.delete')}
                onClick={() => setRemoving(row)}
              />
            ),
          } as Column<ChargingProfile>,
        ]
      : []),
  ];

  return (
    <>
      {net.chargingProfiles.length === 0 ? (
        <EmptyState
          icon={<Gauge className="h-5 w-5" />}
          title={t('ocpp.sc.empty')}
          description={t('ocpp.sc.emptyDesc')}
          action={
            <Can do={PRIVILEGES.ocppConfigure}>
              <Button variant="primary" onClick={openNew}>
                {t('ocpp.sc.new')}
              </Button>
            </Can>
          }
        />
      ) : (
        <DataTable
          rows={net.chargingProfiles}
          columns={columns}
          getRowId={(row) => row.id}
          defaultSort={{ key: 'stack', dir: 'desc' }}
          hidePaginationWhenSingle
          emptyTitle={t('ocpp.sc.empty')}
          emptyDescription={t('ocpp.sc.emptyDesc')}
          toolbar={
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <p className="text-[12.5px] text-ink-500">{t('ocpp.sc.subtitle')}</p>
              <Can do={PRIVILEGES.ocppConfigure}>
                <Button size="sm" variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={openNew}>
                  {t('ocpp.sc.new')}
                </Button>
              </Can>
            </div>
          }
        />
      )}

      <Drawer
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        width="lg"
        title={editing ? `${t('common.edit')} · ${editing.name}` : t('ocpp.sc.new')}
        description={t('ocpp.sc.subtitle')}
        footer={
          <>
            <Button onClick={() => setEditorOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" onClick={save} disabled={Boolean(nameError) || targetMissing}>
              {editing ? t('common.saveChanges') : t('common.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <section>
            <h4 className="mb-3 text-[13px] font-semibold text-ink-900">{t('trf.section.identity')}</h4>
            <FormGrid>
              <Span>
                <Field label={t('common.name')} required error={nameError} htmlFor="sc-name">
                  <Input
                    id="sc-name"
                    value={draft.name}
                    onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                    dir="auto"
                  />
                </Field>
              </Span>

              <Span>
                <Field label={t('ocpp.sc.col.scope')}>
                  <div className="flex flex-col gap-2 pt-0.5 sm:flex-row sm:gap-6">
                    <Radio
                      checked={draft.scope === 'location'}
                      onChange={() =>
                        setDraft((prev) => ({ ...prev, scope: 'location', purpose: 'ChargePointMaxProfile' }))
                      }
                      label={t('ocpp.sc.scopeSite')}
                      name="sc-scope"
                    />
                    <Radio
                      checked={draft.scope === 'station'}
                      onChange={() => setDraft((prev) => ({ ...prev, scope: 'station', purpose: 'TxDefaultProfile' }))}
                      label={t('ocpp.sc.scopeStation')}
                      name="sc-scope"
                    />
                  </div>
                </Field>
              </Span>

              {draft.scope === 'location' ? (
                <Field label={t('stn.col.location')} required htmlFor="sc-location">
                  <Select
                    id="sc-location"
                    value={draft.locationId}
                    onChange={(e) => setDraft((prev) => ({ ...prev, locationId: e.target.value }))}
                  >
                    <option value="">{t('common.none')}</option>
                    {net.locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : (
                <Field label={t('ocpp.cmd.station')} required htmlFor="sc-station">
                  <Select
                    id="sc-station"
                    value={draft.stationId}
                    onChange={(e) => setDraft((prev) => ({ ...prev, stationId: e.target.value }))}
                  >
                    <option value="">{t('common.none')}</option>
                    {net.stations
                      .filter((s) => s.state !== 'Decommissioned')
                      .map((station) => (
                        <option key={station.id} value={station.id}>
                          {station.chargePointId} — {station.name}
                        </option>
                      ))}
                  </Select>
                </Field>
              )}

              <Field label={t('ocpp.sc.col.purpose')} htmlFor="sc-purpose">
                <Select
                  id="sc-purpose"
                  value={draft.purpose}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, purpose: e.target.value as ChargingProfile['purpose'] }))
                  }
                >
                  {CHARGING_PROFILE_PURPOSES.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={t('ocpp.sc.col.stack')} htmlFor="sc-stack">
                <Input
                  id="sc-stack"
                  type="number"
                  min={0}
                  max={9}
                  value={draft.stackLevel}
                  onChange={(e) => setDraft((prev) => ({ ...prev, stackLevel: Number(e.target.value) }))}
                />
              </Field>

              <Field label={t('common.type')} htmlFor="sc-unit">
                <Select
                  id="sc-unit"
                  value={draft.chargingRateUnit}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, chargingRateUnit: e.target.value as ChargingRateUnit }))
                  }
                >
                  {CHARGING_RATE_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={t('trf.field.validFrom')} htmlFor="sc-from">
                <Input
                  id="sc-from"
                  type="date"
                  className="tnum"
                  value={draft.validFrom}
                  onChange={(e) => setDraft((prev) => ({ ...prev, validFrom: e.target.value }))}
                />
              </Field>
              <Field label={t('trf.field.validTo')} hint={t('common.notSet')} htmlFor="sc-to">
                <Input
                  id="sc-to"
                  type="date"
                  className="tnum"
                  value={draft.validTo}
                  onChange={(e) => setDraft((prev) => ({ ...prev, validTo: e.target.value }))}
                />
              </Field>
            </FormGrid>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-[13px] font-semibold text-ink-900">{t('ocpp.sc.schedule')}</h4>
              <Button
                size="xs"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    periods: [
                      ...prev.periods,
                      {
                        startSec: Math.min(
                          82800,
                          (prev.periods[prev.periods.length - 1]?.startSec ?? 0) + 3600,
                        ),
                        limit: prev.periods[prev.periods.length - 1]?.limit ?? 11000,
                        numberPhases: 3,
                      },
                    ],
                  }))
                }
              >
                {t('common.add')}
              </Button>
            </div>

            <ScheduleBar periods={draft.periods} unit={draft.chargingRateUnit} />

            <div className="mt-3 space-y-2">
              {draft.periods.map((period, index) => (
                <div key={index} className="flex flex-wrap items-end gap-2 rounded-[9px] border border-ink-200 p-2.5">
                  <div className="w-[120px]">
                    <Field label={t('trf.window.from')} htmlFor={`sc-start-${index}`}>
                      <Input
                        id={`sc-start-${index}`}
                        type="time"
                        className="tnum"
                        value={hhmm(period.startSec)}
                        onChange={(e) => setPeriod(index, { startSec: toSeconds(e.target.value) })}
                      />
                    </Field>
                  </div>
                  <div className="w-[140px]">
                    <Field label={`${t('cfg.maxCurrent')} (${draft.chargingRateUnit})`} htmlFor={`sc-limit-${index}`}>
                      <Input
                        id={`sc-limit-${index}`}
                        type="number"
                        min={0}
                        className="tnum"
                        value={period.limit}
                        onChange={(e) => setPeriod(index, { limit: Number(e.target.value) })}
                      />
                    </Field>
                  </div>
                  <div className="w-[110px]">
                    <Field label={t('power.AC_3_PHASE')} htmlFor={`sc-phases-${index}`}>
                      <Select
                        id={`sc-phases-${index}`}
                        value={String(period.numberPhases)}
                        onChange={(e) => setPeriod(index, { numberPhases: Number(e.target.value) })}
                      >
                        <option value="1">1</option>
                        <option value="3">3</option>
                      </Select>
                    </Field>
                  </div>
                  {draft.periods.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                      aria-label={t('common.remove')}
                      title={t('common.remove')}
                      className="mb-0.5"
                      onClick={() =>
                        setDraft((prev) => ({ ...prev, periods: prev.periods.filter((_, i) => i !== index) }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </Drawer>

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) networkActions.removeChargingProfile(removing.id);
          toast.success(t('toast.deleted'), removing?.name);
          setRemoving(null);
        }}
        title={t('common.deleteConfirm')}
        message={t('common.deleteConfirmDesc')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
      />
    </>
  );
}
