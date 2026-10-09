/* =============================================================================
 * Station identity editor.
 *
 * Only the facts about the physical unit live here — what it is called, its
 * serial, its firmware, its dates. Behaviour is in Configuration and the
 * layout belongs to the hardware profile, so this drawer stays short.
 *
 * The charge point ID locks once the charger has connected: changing it then
 * would orphan a live websocket session, which is exactly the kind of mistake
 * a form should make impossible rather than merely discourage.
 * ========================================================================== */

import { useState } from 'react';
import { useI18n } from '@/i18n';
import { Drawer } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import { networkActions, useNetwork } from '@/data/networkStore';
import { OCPP_VERSIONS, type ChargingStation } from '@/domain/network';
import { FormGrid, Span } from './primitives';

export function StationEditDrawer({
  open,
  onClose,
  station,
}: {
  open: boolean;
  onClose: () => void;
  station: ChargingStation;
}) {
  const { t, ln } = useI18n();
  const toast = useToast();
  const net = useNetwork();

  const connected = station.commissionedAt !== null;
  const profile = net.profiles.find((p) => p.id === station.hardwareProfileId);

  const [draft, setDraft] = useState({
    name: station.name,
    nameAr: station.nameAr,
    serialNumber: station.serialNumber,
    chargePointId: station.chargePointId,
    ocppVersion: station.ocppVersion,
    firmwareVersion: station.firmwareVersion,
    installedAt: station.installedAt.slice(0, 10),
    warrantyEndsAt: station.warrantyEndsAt.slice(0, 10),
    notes: station.notes,
  });

  function set<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  const nameError = draft.name.trim() === '' ? t('form.required') : undefined;
  const idError = draft.chargePointId.trim() === '' ? t('form.required') : undefined;

  function save() {
    if (nameError || idError) return;
    networkActions.updateStation(station.id, {
      name: draft.name.trim(),
      nameAr: draft.nameAr.trim() || draft.name.trim(),
      serialNumber: draft.serialNumber.trim(),
      chargePointId: connected ? station.chargePointId : draft.chargePointId.trim(),
      ocppVersion: draft.ocppVersion,
      firmwareVersion: draft.firmwareVersion.trim(),
      installedAt: draft.installedAt,
      warrantyEndsAt: draft.warrantyEndsAt,
      notes: draft.notes,
    });
    toast.success(t('toast.saved'), station.code);
    onClose();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="md"
      title={`${t('common.edit')} · ${station.code}`}
      description={profile ? ln(profile) : undefined}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={save} disabled={Boolean(nameError || idError)}>
            {t('common.saveChanges')}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <section>
          <h4 className="mb-3 text-[13px] font-semibold text-ink-900">{t('stn.section.identity')}</h4>
          <FormGrid>
            <Field label={t('stn.field.name')} required error={nameError} htmlFor="stn-name">
              <Input id="stn-name" value={draft.name} onChange={(e) => set('name', e.target.value)} dir="auto" />
            </Field>
            <Field label={t('stn.field.nameAr')} htmlFor="stn-name-ar">
              <Input id="stn-name-ar" value={draft.nameAr} onChange={(e) => set('nameAr', e.target.value)} dir="auto" />
            </Field>
            <Field label={t('stn.field.serial')} htmlFor="stn-serial">
              <Input
                id="stn-serial"
                value={draft.serialNumber}
                onChange={(e) => set('serialNumber', e.target.value)}
                dir="ltr"
              />
            </Field>
            <Field label={t('stn.field.firmware')} htmlFor="stn-firmware">
              <Input
                id="stn-firmware"
                className="tnum"
                value={draft.firmwareVersion}
                onChange={(e) => set('firmwareVersion', e.target.value)}
                dir="ltr"
              />
            </Field>
          </FormGrid>
        </section>

        <section>
          <h4 className="mb-3 text-[13px] font-semibold text-ink-900">{t('ocpp.station.identity')}</h4>
          <FormGrid>
            <Field
              label={t('stn.field.chargePointId')}
              hint={t('stn.field.chargePointIdHint')}
              error={idError}
              required
              htmlFor="stn-cpid"
            >
              <Input
                id="stn-cpid"
                value={draft.chargePointId}
                onChange={(e) => set('chargePointId', e.target.value)}
                disabled={connected}
                dir="ltr"
              />
            </Field>
            <Field label={t('stn.field.ocppVersion')} htmlFor="stn-ocpp">
              <Select
                id="stn-ocpp"
                value={draft.ocppVersion}
                onChange={(e) => set('ocppVersion', e.target.value as ChargingStation['ocppVersion'])}
              >
                {(profile ? profile.ocppVersions : OCPP_VERSIONS).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            {connected && (
              <Span>
                <Alert tone="neutral">{t('stn.field.chargePointIdHint')}</Alert>
              </Span>
            )}
          </FormGrid>
        </section>

        <section>
          <h4 className="mb-3 text-[13px] font-semibold text-ink-900">{t('stn.section.lifecycle')}</h4>
          <FormGrid>
            <Field label={t('stn.field.installedAt')} htmlFor="stn-installed">
              <Input
                id="stn-installed"
                type="date"
                className="tnum"
                value={draft.installedAt}
                onChange={(e) => set('installedAt', e.target.value)}
              />
            </Field>
            <Field label={t('stn.field.warranty')} htmlFor="stn-warranty">
              <Input
                id="stn-warranty"
                type="date"
                className="tnum"
                value={draft.warrantyEndsAt}
                onChange={(e) => set('warrantyEndsAt', e.target.value)}
              />
            </Field>
            <Span>
              <Field label={t('stn.field.notes')} htmlFor="stn-notes">
                <Textarea
                  id="stn-notes"
                  rows={3}
                  value={draft.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  dir="auto"
                />
              </Field>
            </Span>
          </FormGrid>
        </section>
      </div>
    </Drawer>
  );
}
