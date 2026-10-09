/* =============================================================================
 * Location form — create and edit.
 *
 * A drawer rather than a page: creating a site is a side errand from the list,
 * and a drawer keeps the list behind it as context. The fields are grouped the
 * way somebody surveying a site thinks about them — what it is, where it is,
 * what it can carry, when it is open, who to call.
 * ========================================================================== */

import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { Drawer } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Switch, Textarea, Checkbox } from '@/components/ui/Field';
import { Autocomplete } from '@/components/ui/Autocomplete';
import { useToast } from '@/components/ui/Toast';
import { getDependentLookup, getLookup } from '@/data/lookups';
import { networkActions, type LocationDraft } from '@/data/networkStore';
import {
  ACCESS_TYPES,
  ENTITY_STATUSES,
  LOCATION_TYPES,
  type Location,
  type LocationType,
} from '@/domain/network';
import { FormGrid, Hint, Span } from '../components/primitives';

function blankLocation(): LocationDraft {
  return {
    name: '',
    nameAr: '',
    type: 'Public',
    status: 'Draft',
    address: '',
    addressAr: '',
    countryId: 'AE',
    cityId: '',
    lat: 25.2048,
    lng: 55.2708,
    parkingSpaces: 0,
    amenityIds: [],
    openingHours: {
      twentyFourSeven: true,
      windows: Array.from({ length: 7 }, (_, day) => ({ day, open: true, from: '08:00', to: '20:00' })),
    },
    accessType: 'Public',
    gridCapacityKw: 0,
    siteContactName: '',
    siteContactPhone: '',
    siteContactEmail: '',
    notes: '',
  };
}

export function LocationFormDrawer({
  open,
  onClose,
  location,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  /** Omit to create. */
  location?: Location;
  onSaved?: (id: string) => void;
}) {
  const { t, ln, locale } = useI18n();
  const toast = useToast();
  const [draft, setDraft] = useState<LocationDraft>(() => (location ? { ...location } : blankLocation()));
  const [touched, setTouched] = useState(false);

  /* Reset whenever the drawer is opened for a different record. */
  const key = location?.id ?? 'new';
  const [lastKey, setLastKey] = useState(key);
  if (lastKey !== key) {
    setLastKey(key);
    setDraft(location ? { ...location } : blankLocation());
    setTouched(false);
  }

  const set = <K extends keyof LocationDraft>(field: K, value: LocationDraft[K]) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  const countries = useMemo(
    () => getLookup('countries').map((c) => ({ value: c.id, label: ln(c) })),
    [ln],
  );
  const cities = useMemo(
    () => getDependentLookup('cities', draft.countryId).map((c) => ({ value: c.id, label: ln(c) })),
    [draft.countryId, ln],
  );
  const amenities = useMemo(() => getLookup('amenities'), []);
  const locationTypes = useMemo(() => getLookup('locationTypes'), []);

  const errors = {
    name: !draft.name.trim() ? t('form.required') : undefined,
    cityId: !draft.cityId ? t('form.required') : undefined,
    gridCapacityKw: draft.gridCapacityKw <= 0 ? t('form.positive') : undefined,
  };
  const invalid = Object.values(errors).some(Boolean);

  const save = () => {
    setTouched(true);
    if (invalid) return;
    if (location) {
      networkActions.updateLocation(location.id, draft);
      toast.success(t('loc.updated'));
      onSaved?.(location.id);
    } else {
      const created = networkActions.createLocation(draft);
      toast.success(t('loc.created'), created.code);
      onSaved?.(created.id);
    }
    onClose();
  };

  const err = (field: keyof typeof errors) => (touched ? errors[field] : undefined);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="lg"
      title={location ? t('loc.edit') : t('loc.new')}
      description={location ? location.code : t('loc.section.identityHint')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={save}>
            {location ? t('common.saveChanges') : t('loc.new')}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* ---- Identity -------------------------------------------------- */}
        <section>
          <h4 className="mb-1 text-[13px] font-semibold text-ink-900">{t('loc.section.identity')}</h4>
          <p className="mb-3 text-[12px] text-ink-500">{t('loc.section.identityHint')}</p>
          <FormGrid>
            <Field label={t('loc.field.name')} required error={err('name')} htmlFor="loc-name">
              <Input
                id="loc-name"
                dir="auto"
                value={draft.name}
                onChange={(e) => set('name', e.target.value)}
                invalid={Boolean(err('name'))}
                placeholder="Marina Mall Dubai"
              />
            </Field>
            <Field label={t('loc.field.nameAr')} htmlFor="loc-name-ar">
              <Input id="loc-name-ar" dir="rtl" value={draft.nameAr} onChange={(e) => set('nameAr', e.target.value)} />
            </Field>
            <Field label={t('loc.field.type')} htmlFor="loc-type">
              <Select id="loc-type" value={draft.type} onChange={(e) => set('type', e.target.value as LocationType)}>
                {LOCATION_TYPES.map((type) => {
                  const option = locationTypes.find((o) => o.id === type);
                  return (
                    <option key={type} value={type}>
                      {option ? ln(option) : type}
                    </option>
                  );
                })}
              </Select>
            </Field>
            <Field label={t('loc.field.status')} htmlFor="loc-status">
              <Select
                id="loc-status"
                value={draft.status}
                onChange={(e) => set('status', e.target.value as Location['status'])}
              >
                {ENTITY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`status.${status}` as never)}
                  </option>
                ))}
              </Select>
            </Field>
          </FormGrid>
        </section>

        {/* ---- Address --------------------------------------------------- */}
        <section>
          <h4 className="mb-1 text-[13px] font-semibold text-ink-900">{t('loc.section.address')}</h4>
          <p className="mb-3 text-[12px] text-ink-500">{t('loc.section.addressHint')}</p>
          <FormGrid>
            <Field label={t('loc.field.country')}>
              <Autocomplete
                options={countries}
                value={draft.countryId}
                onChange={(v) => {
                  set('countryId', v ?? '');
                  /* The city must belong to the country, so a change clears it. */
                  set('cityId', '');
                }}
              />
            </Field>
            <Field label={t('loc.field.city')} required error={err('cityId')}>
              <Autocomplete
                options={cities}
                value={draft.cityId}
                onChange={(v) => set('cityId', v ?? '')}
                disabled={!draft.countryId}
                invalid={Boolean(err('cityId'))}
              />
            </Field>
            <Span>
              <Field label={t('loc.field.address')} htmlFor="loc-address">
                <Input id="loc-address" dir="auto" value={draft.address} onChange={(e) => set('address', e.target.value)} />
              </Field>
            </Span>
            <Span>
              <Field label={t('loc.field.addressAr')} htmlFor="loc-address-ar">
                <Input id="loc-address-ar" dir="rtl" value={draft.addressAr} onChange={(e) => set('addressAr', e.target.value)} />
              </Field>
            </Span>
            <Field label={t('loc.field.lat')} htmlFor="loc-lat">
              <Input
                id="loc-lat"
                type="number"
                step="0.0001"
                dir="ltr"
                className="tnum"
                value={draft.lat}
                onChange={(e) => set('lat', Number(e.target.value))}
              />
            </Field>
            <Field label={t('loc.field.lng')} htmlFor="loc-lng">
              <Input
                id="loc-lng"
                type="number"
                step="0.0001"
                dir="ltr"
                className="tnum"
                value={draft.lng}
                onChange={(e) => set('lng', Number(e.target.value))}
              />
            </Field>
            <Span>
              <Hint>{t('loc.hint.coords')}</Hint>
            </Span>
          </FormGrid>
        </section>

        {/* ---- Capacity -------------------------------------------------- */}
        <section>
          <h4 className="mb-1 text-[13px] font-semibold text-ink-900">{t('loc.section.capacity')}</h4>
          <p className="mb-3 text-[12px] text-ink-500">{t('loc.section.capacityHint')}</p>
          <FormGrid>
            <Field label={t('loc.field.bays')} htmlFor="loc-bays">
              <Input
                id="loc-bays"
                type="number"
                min={0}
                className="tnum"
                value={draft.parkingSpaces}
                onChange={(e) => set('parkingSpaces', Number(e.target.value))}
              />
            </Field>
            <Field
              label={t('loc.field.grid')}
              required
              error={err('gridCapacityKw')}
              hint={err('gridCapacityKw') ? undefined : t('loc.hint.grid')}
              htmlFor="loc-grid"
            >
              <Input
                id="loc-grid"
                type="number"
                min={0}
                className="tnum"
                value={draft.gridCapacityKw}
                onChange={(e) => set('gridCapacityKw', Number(e.target.value))}
                invalid={Boolean(err('gridCapacityKw'))}
              />
            </Field>
            <Field label={t('loc.field.access')} htmlFor="loc-access">
              <Select
                id="loc-access"
                value={draft.accessType}
                onChange={(e) => set('accessType', e.target.value as Location['accessType'])}
              >
                {ACCESS_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {t(`access.${value}` as never)}
                  </option>
                ))}
              </Select>
            </Field>
          </FormGrid>
        </section>

        {/* ---- Hours ----------------------------------------------------- */}
        <section>
          <h4 className="mb-1 text-[13px] font-semibold text-ink-900">{t('loc.section.hours')}</h4>
          <p className="mb-3 text-[12px] text-ink-500">{t('loc.section.hoursHint')}</p>
          <Switch
            checked={draft.openingHours.twentyFourSeven}
            onChange={(v) => set('openingHours', { ...draft.openingHours, twentyFourSeven: v })}
            label={t('loc.field.open247')}
          />
          {!draft.openingHours.twentyFourSeven && (
            <ul className="mt-3 space-y-1.5">
              {draft.openingHours.windows.map((window, i) => (
                <li key={window.day} className="flex flex-wrap items-center gap-2 rounded-[8px] border border-ink-200 px-2.5 py-1.5">
                  <span className="w-20 shrink-0 text-[12.5px] text-ink-700">{t(`loc.day.${window.day}` as never)}</span>
                  <Checkbox
                    checked={window.open}
                    onChange={(v) => {
                      const windows = [...draft.openingHours.windows];
                      windows[i] = { ...window, open: v };
                      set('openingHours', { ...draft.openingHours, windows });
                    }}
                    label=""
                  />
                  {window.open ? (
                    <span className="flex items-center gap-1.5" dir="ltr">
                      <Input
                        type="time"
                        className="h-8 w-[104px] tnum"
                        value={window.from}
                        onChange={(e) => {
                          const windows = [...draft.openingHours.windows];
                          windows[i] = { ...window, from: e.target.value };
                          set('openingHours', { ...draft.openingHours, windows });
                        }}
                      />
                      <span className="text-ink-400">–</span>
                      <Input
                        type="time"
                        className="h-8 w-[104px] tnum"
                        value={window.to}
                        onChange={(e) => {
                          const windows = [...draft.openingHours.windows];
                          windows[i] = { ...window, to: e.target.value };
                          set('openingHours', { ...draft.openingHours, windows });
                        }}
                      />
                    </span>
                  ) : (
                    <span className="text-[12px] text-ink-400">{t('loc.closed')}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ---- Amenities ------------------------------------------------- */}
        <section>
          <h4 className="mb-1 text-[13px] font-semibold text-ink-900">{t('loc.section.amenities')}</h4>
          <p className="mb-3 text-[12px] text-ink-500">{t('loc.section.amenitiesHint')}</p>
          <div className="flex flex-wrap gap-1.5">
            {amenities.map((amenity) => {
              const on = draft.amenityIds.includes(amenity.id);
              return (
                <button
                  key={amenity.id}
                  type="button"
                  onClick={() =>
                    set(
                      'amenityIds',
                      on ? draft.amenityIds.filter((id) => id !== amenity.id) : [...draft.amenityIds, amenity.id],
                    )
                  }
                  className={
                    'rounded-full border px-2.5 py-1 text-[12px] transition-colors ' +
                    (on
                      ? 'border-brand-200 bg-brand-50 text-brand-800'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:bg-ink-50')
                  }
                >
                  {ln(amenity)}
                </button>
              );
            })}
          </div>
        </section>

        {/* ---- Contact --------------------------------------------------- */}
        <section>
          <h4 className="mb-1 text-[13px] font-semibold text-ink-900">{t('loc.section.contact')}</h4>
          <p className="mb-3 text-[12px] text-ink-500">{t('loc.section.contactHint')}</p>
          <FormGrid>
            <Field label={t('loc.field.contactName')} htmlFor="loc-cname">
              <Input id="loc-cname" dir="auto" value={draft.siteContactName} onChange={(e) => set('siteContactName', e.target.value)} />
            </Field>
            <Field label={t('loc.field.contactPhone')} htmlFor="loc-cphone">
              <Input id="loc-cphone" dir="ltr" className="tnum" value={draft.siteContactPhone} onChange={(e) => set('siteContactPhone', e.target.value)} />
            </Field>
            <Span>
              <Field label={t('loc.field.contactEmail')} htmlFor="loc-cemail">
                <Input id="loc-cemail" type="email" dir="ltr" value={draft.siteContactEmail} onChange={(e) => set('siteContactEmail', e.target.value)} />
              </Field>
            </Span>
            <Span>
              <Field label={t('loc.field.notes')} htmlFor="loc-notes">
                <Textarea id="loc-notes" dir="auto" rows={3} value={draft.notes} onChange={(e) => set('notes', e.target.value)} />
              </Field>
            </Span>
          </FormGrid>
        </section>

        <p className="sr-only">{locale}</p>
      </div>
    </Drawer>
  );
}
