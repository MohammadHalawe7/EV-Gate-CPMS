import { useI18n } from '@/i18n';
import { Field, Input } from '@/components/ui/Field';
import { Panel, PanelHeader } from '@/components/ui/Surface';
import { ImageUpload } from '@/components/ui/Upload';
import { Alert } from '@/components/ui/Alert';
import {
  DependentLookupSelect,
  LookupMultiSelect,
  LookupNativeSelect,
  LookupSelect,
} from '../LookupField';
import type { RegistrationFormApi } from '../../useRegistrationForm';

export function CompanyInfoStep({ form }: { form: RegistrationFormApi }) {
  const { t } = useI18n();
  const { draft, setField, touch, errorFor, requiresChargers } = form;
  const c = draft.company;

  const err = (path: string) => {
    const key = errorFor(path);
    return key ? t(key as never) : undefined;
  };

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader title={t('reg.section.identity')} subtitle={t('reg.section.identityHint')} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('reg.field.logo')} required error={err('company.logo')} className="sm:col-span-2">
            <ImageUpload
              label={t('reg.action.uploadLogo')}
              hint={t('reg.hint.logo')}
              src={c.logo || undefined}
              onSelect={(file) => {
                const reader = new FileReader();
                reader.onload = () => {
                  setField('company', 'logo', String(reader.result));
                  touch('company.logo');
                };
                reader.readAsDataURL(file);
              }}
              onClear={() => setField('company', 'logo', '')}
            />
          </Field>

          <Field label={t('reg.field.nameEn')} required error={err('company.name')} htmlFor="company-name">
            <Input
              id="company-name"
              dir="ltr"
              value={c.name}
              onChange={(e) => setField('company', 'name', e.target.value)}
              onBlur={() => touch('company.name')}
              placeholder={t('reg.ph.nameEn')}
              invalid={Boolean(err('company.name'))}
            />
          </Field>

          <Field label={t('reg.field.nameAr')} required error={err('company.nameAr')} htmlFor="company-name-ar">
            <Input
              id="company-name-ar"
              dir="rtl"
              value={c.nameAr}
              onChange={(e) => setField('company', 'nameAr', e.target.value)}
              onBlur={() => touch('company.nameAr')}
              placeholder={t('reg.ph.nameAr')}
              invalid={Boolean(err('company.nameAr'))}
            />
          </Field>

          <Field
            label={t('reg.field.tradeRegister')}
            required
            error={err('company.tradeRegisterNumber')}
            hint={err('company.tradeRegisterNumber') ? undefined : t('reg.hint.tradeRegister')}
            htmlFor="company-trn"
          >
            <Input
              id="company-trn"
              dir="ltr"
              value={c.tradeRegisterNumber}
              onChange={(e) => setField('company', 'tradeRegisterNumber', e.target.value)}
              onBlur={() => touch('company.tradeRegisterNumber')}
              placeholder="CN-1234567"
              invalid={Boolean(err('company.tradeRegisterNumber'))}
            />
          </Field>

          <Field label={t('reg.field.profileUrl')} error={err('company.profileUrl')} htmlFor="company-url">
            <Input
              id="company-url"
              type="url"
              dir="ltr"
              value={c.profileUrl}
              onChange={(e) => setField('company', 'profileUrl', e.target.value)}
              onBlur={() => touch('company.profileUrl')}
              placeholder="https://example.com"
              invalid={Boolean(err('company.profileUrl'))}
            />
          </Field>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title={t('reg.section.location')} subtitle={t('reg.section.locationHint')} />

        <div className="grid gap-4 sm:grid-cols-2">
          <LookupSelect
            lookup="countries"
            label={t('reg.field.country')}
            required
            value={c.countryId}
            onChange={(v) => setField('company', 'countryId', v)}
            onBlur={() => touch('company.countryId')}
            error={err('company.countryId')}
            placeholder={t('reg.ph.searchCountry')}
          />

          <DependentLookupSelect
            lookup="cities"
            parentId={c.countryId}
            label={t('reg.field.city')}
            required
            value={c.cityId}
            onChange={(v) => setField('company', 'cityId', v)}
            onBlur={() => touch('company.cityId')}
            error={err('company.cityId')}
            placeholder={t('reg.ph.searchCity')}
            waitingHint={t('reg.hint.selectCountryFirst')}
          />

          <Field label={t('reg.field.address')} className="sm:col-span-2" htmlFor="company-address">
            <Input
              id="company-address"
              dir="auto"
              value={c.address}
              onChange={(e) => setField('company', 'address', e.target.value)}
              placeholder={t('reg.ph.address')}
            />
          </Field>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title={t('reg.section.scale')} subtitle={t('reg.section.scaleHint')} />

        <div className="grid gap-4 sm:grid-cols-2">
          <LookupMultiSelect
            lookup="services"
            label={t('reg.field.services')}
            required
            value={c.serviceIds}
            onChange={(v) => setField('company', 'serviceIds', v)}
            onBlur={() => touch('company.serviceIds')}
            error={err('company.serviceIds')}
            placeholder={t('reg.ph.services')}
            className="sm:col-span-2"
          />

          <Field label={t('reg.field.users')} required error={err('company.numberOfUsers')} htmlFor="company-users">
            <Input
              id="company-users"
              type="number"
              min={1}
              className="tnum"
              value={c.numberOfUsers}
              onChange={(e) => setField('company', 'numberOfUsers', e.target.value)}
              onBlur={() => touch('company.numberOfUsers')}
              placeholder="25"
              invalid={Boolean(err('company.numberOfUsers'))}
            />
          </Field>

          <Field
            label={t('reg.field.locations')}
            required
            error={err('company.numberOfLocations')}
            htmlFor="company-locations"
          >
            <Input
              id="company-locations"
              type="number"
              min={1}
              className="tnum"
              value={c.numberOfLocations}
              onChange={(e) => setField('company', 'numberOfLocations', e.target.value)}
              onBlur={() => touch('company.numberOfLocations')}
              placeholder="4"
              invalid={Boolean(err('company.numberOfLocations'))}
            />
          </Field>

          {requiresChargers && (
            <Field
              label={t('reg.field.chargers')}
              required
              error={err('company.numberOfChargers')}
              hint={err('company.numberOfChargers') ? undefined : t('reg.hint.chargers')}
              htmlFor="company-chargers"
            >
              <Input
                id="company-chargers"
                type="number"
                min={1}
                className="tnum"
                value={c.numberOfChargers}
                onChange={(e) => setField('company', 'numberOfChargers', e.target.value)}
                onBlur={() => touch('company.numberOfChargers')}
                placeholder="12"
                invalid={Boolean(err('company.numberOfChargers'))}
              />
            </Field>
          )}

          <LookupNativeSelect
            lookup="employeeBands"
            label={t('reg.field.employees')}
            required
            value={c.employeeBandId}
            onChange={(v) => setField('company', 'employeeBandId', v)}
            onBlur={() => touch('company.employeeBandId')}
            error={err('company.employeeBandId')}
            placeholder={t('reg.ph.employees')}
          />
        </div>

        {!requiresChargers && c.serviceIds.length > 0 && (
          <Alert tone="neutral" compact className="mt-4">
            {t('reg.hint.chargersHidden')}
          </Alert>
        )}
      </Panel>
    </div>
  );
}
