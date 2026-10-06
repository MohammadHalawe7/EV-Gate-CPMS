import { Info } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Field, Input } from '@/components/ui/Field';
import { Panel, PanelHeader } from '@/components/ui/Surface';
import { Alert } from '@/components/ui/Alert';
import { DateInput } from '@/components/ui/DatePicker';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { dialCodes } from '@/data/lookups';
import { DependentLookupSelect, LookupNativeSelect, LookupSelect } from '../LookupField';
import { todayIso } from '../../validation';
import type { RegistrationFormApi } from '../../useRegistrationForm';

export function AdminAccountStep({ form }: { form: RegistrationFormApi }) {
  const { t } = useI18n();
  const { draft, setField, touch, errorFor } = form;
  const a = draft.admin;
  const codes = dialCodes();

  const err = (path: string) => {
    const key = errorFor(path);
    return key ? t(key as never) : undefined;
  };

  return (
    <div className="space-y-4">
      <Alert tone="info" icon={<Info />} title={t('reg.section.adminNote')}>
        {t('reg.section.adminNoteBody')}
      </Alert>

      <Panel>
        <PanelHeader title={t('reg.section.credentials')} subtitle={t('reg.section.credentialsHint')} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('reg.field.companyEmail')} required error={err('admin.email')} htmlFor="admin-email">
            <Input
              id="admin-email"
              type="email"
              dir="ltr"
              autoComplete="email"
              value={a.email}
              onChange={(e) => setField('admin', 'email', e.target.value)}
              onBlur={() => touch('admin.email')}
              placeholder="admin@company.com"
              invalid={Boolean(err('admin.email'))}
            />
          </Field>

          <Field
            label={t('reg.field.username')}
            hint={t('reg.hint.username')}
            htmlFor="admin-username"
          >
            <Input id="admin-username" dir="ltr" readOnly value={a.username} placeholder="—" />
          </Field>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title={t('reg.section.adminIdentity')} subtitle={t('reg.section.adminIdentityHint')} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t('reg.field.firstName')} required error={err('admin.firstName')} htmlFor="admin-first">
            <Input
              id="admin-first"
              dir="auto"
              value={a.firstName}
              onChange={(e) => setField('admin', 'firstName', e.target.value)}
              onBlur={() => touch('admin.firstName')}
              invalid={Boolean(err('admin.firstName'))}
            />
          </Field>
          <Field label={t('reg.field.secondName')} htmlFor="admin-second">
            <Input
              id="admin-second"
              dir="auto"
              value={a.secondName}
              onChange={(e) => setField('admin', 'secondName', e.target.value)}
            />
          </Field>
          <Field label={t('reg.field.thirdName')} htmlFor="admin-third">
            <Input
              id="admin-third"
              dir="auto"
              value={a.thirdName}
              onChange={(e) => setField('admin', 'thirdName', e.target.value)}
            />
          </Field>
          <Field label={t('reg.field.lastName')} required error={err('admin.lastName')} htmlFor="admin-last">
            <Input
              id="admin-last"
              dir="auto"
              value={a.lastName}
              onChange={(e) => setField('admin', 'lastName', e.target.value)}
              onBlur={() => touch('admin.lastName')}
              invalid={Boolean(err('admin.lastName'))}
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <LookupNativeSelect
            lookup="genders"
            label={t('reg.field.gender')}
            required
            value={a.genderId}
            onChange={(v) => setField('admin', 'genderId', v)}
            onBlur={() => touch('admin.genderId')}
            error={err('admin.genderId')}
            placeholder={t('reg.ph.gender')}
          />

          <Field label={t('reg.field.phone')} required error={err('admin.phone')} htmlFor="admin-phone">
            <PhoneInput
              id="admin-phone"
              value={a.phone}
              onChange={(v) => setField('admin', 'phone', v)}
              codes={codes}
              invalid={Boolean(err('admin.phone'))}
            />
          </Field>

          <LookupSelect
            lookup="departments"
            label={t('reg.field.department')}
            required
            value={a.departmentId}
            onChange={(v) => setField('admin', 'departmentId', v)}
            onBlur={() => touch('admin.departmentId')}
            error={err('admin.departmentId')}
            placeholder={t('reg.ph.searchDepartment')}
          />

          <DependentLookupSelect
            lookup="positions"
            parentId={a.departmentId}
            label={t('reg.field.position')}
            required
            value={a.positionId}
            onChange={(v) => setField('admin', 'positionId', v)}
            onBlur={() => touch('admin.positionId')}
            error={err('admin.positionId')}
            placeholder={t('reg.ph.searchPosition')}
            waitingHint={t('reg.hint.selectDepartmentFirst')}
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader title={t('reg.section.validity')} subtitle={t('reg.section.validityHint')} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t('reg.field.activationDate')}
            required
            error={err('admin.activationDate')}
            htmlFor="admin-activation"
          >
            <DateInput
              value={a.activationDate}
              onChange={(v) => {
                setField('admin', 'activationDate', v);
                touch('admin.activationDate');
              }}
              min={todayIso()}
              invalid={Boolean(err('admin.activationDate'))}
            />
          </Field>

          <Field
            label={t('reg.field.expiryDate')}
            required
            error={err('admin.expiryDate')}
            htmlFor="admin-expiry"
          >
            <DateInput
              value={a.expiryDate}
              onChange={(v) => {
                setField('admin', 'expiryDate', v);
                touch('admin.expiryDate');
              }}
              min={a.activationDate || todayIso()}
              invalid={Boolean(err('admin.expiryDate'))}
            />
          </Field>
        </div>
      </Panel>
    </div>
  );
}
