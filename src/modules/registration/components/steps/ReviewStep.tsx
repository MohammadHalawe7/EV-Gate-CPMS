import { Pencil } from 'lucide-react';
import { useI18n } from '@/i18n';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Panel, PanelHeader, DetailList, Divider } from '@/components/ui/Surface';
import { Alert } from '@/components/ui/Alert';
import { Checkbox } from '@/components/ui/Field';
import { formatPhone } from '@/components/ui/PhoneInput';
import { dialCodes } from '@/data/lookups';
import { fullName } from '@/domain';
import { useLookupLabel } from '../LookupField';
import type { RegistrationFormApi } from '../../useRegistrationForm';

function EditLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button size="xs" variant="ghost" icon={<Pencil className="h-3 w-3" />} onClick={onClick}>
      {label}
    </Button>
  );
}

export function ReviewStep({
  form,
  consent,
  onConsentChange,
  consentError,
}: {
  form: RegistrationFormApi;
  consent: boolean;
  onConsentChange: (value: boolean) => void;
  consentError?: string;
}) {
  const { t, intlLocale } = useI18n();
  const label = useLookupLabel();
  const codes = dialCodes();
  const { draft, goTo, invalidSteps } = form;
  const c = draft.company;
  const a = draft.additional;
  const admin = draft.admin;

  const services = c.serviceIds.map((id) => label('services', id));

  return (
    <div className="space-y-4">
      {invalidSteps.length > 0 ? (
        <Alert tone="danger" title={t('reg.review.incompleteTitle')}>
          {t('reg.review.incompleteBody')}
        </Alert>
      ) : (
        <Alert tone="info" title={t('reg.review.title')}>
          {t('reg.review.body')}
        </Alert>
      )}

      <Panel>
        <PanelHeader
          title={t('reg.section.identity')}
          action={<EditLink label={t('common.edit')} onClick={() => goTo(0)} />}
        />
        <div className="flex items-start gap-4">
          {c.logo ? (
            <img
              src={c.logo}
              alt=""
              className="h-16 w-16 shrink-0 rounded-[8px] border border-ink-200 object-contain p-1"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[8px] border border-dashed border-ink-300 text-[11px] text-ink-400">
              {t('common.none')}
            </div>
          )}
          <DetailList
            className="flex-1"
            items={[
              { label: t('reg.field.nameEn'), value: c.name },
              { label: t('reg.field.nameAr'), value: c.nameAr },
              { label: t('reg.field.tradeRegister'), value: <span dir="ltr">{c.tradeRegisterNumber}</span> },
              { label: t('reg.field.profileUrl'), value: c.profileUrl ? <span dir="ltr">{c.profileUrl}</span> : '—' },
              { label: t('reg.field.country'), value: label('countries', c.countryId) },
              { label: t('reg.field.city'), value: label('cities', c.cityId) },
              { label: t('reg.field.address'), value: c.address || '—', span: true },
            ]}
          />
        </div>

        <Divider className="my-4" />

        <DetailList
          items={[
            {
              label: t('reg.field.services'),
              value: (
                <span className="flex flex-wrap gap-1.5">
                  {services.length === 0
                    ? '—'
                    : services.map((s) => (
                        <Badge key={s} tone="brand" size="sm">
                          {s}
                        </Badge>
                      ))}
                </span>
              ),
              span: true,
            },
            { label: t('reg.field.users'), value: <span className="tnum">{c.numberOfUsers || '—'}</span> },
            { label: t('reg.field.locations'), value: <span className="tnum">{c.numberOfLocations || '—'}</span> },
            ...(c.numberOfChargers
              ? [{ label: t('reg.field.chargers'), value: <span className="tnum">{c.numberOfChargers}</span> }]
              : []),
            { label: t('reg.field.employees'), value: label('employeeBands', c.employeeBandId) },
          ]}
        />
      </Panel>

      <Panel>
        <PanelHeader
          title={t('reg.step.additional')}
          action={<EditLink label={t('common.edit')} onClick={() => goTo(1)} />}
        />
        <DetailList
          columns={3}
          items={[
            { label: t('reg.field.mainSector'), value: label('mainSectors', a.mainSectorId) },
            { label: t('reg.field.subSector'), value: label('subSectors', a.subSectorId) },
            { label: t('reg.field.fax'), value: a.faxNumber ? <span dir="ltr">{a.faxNumber}</span> : '—' },
            { label: t('reg.field.poBox'), value: a.poBox || '—' },
            { label: t('reg.field.zip'), value: a.zipCode || '—' },
          ]}
        />
      </Panel>

      <Panel>
        <PanelHeader
          title={t('reg.step.admin')}
          subtitle={t('reg.review.adminHint')}
          action={<EditLink label={t('common.edit')} onClick={() => goTo(2)} />}
        />
        <DetailList
          items={[
            { label: t('reg.col.name'), value: fullName(admin) },
            { label: t('reg.field.gender'), value: label('genders', admin.genderId) },
            { label: t('reg.field.companyEmail'), value: <span dir="ltr">{admin.email}</span> },
            { label: t('reg.field.username'), value: <span dir="ltr">{admin.username || '—'}</span> },
            { label: t('reg.field.department'), value: label('departments', admin.departmentId) },
            { label: t('reg.field.position'), value: label('positions', admin.positionId) },
            {
              label: t('reg.field.phone'),
              value: (
                <span className="tnum" dir="ltr">
                  {formatPhone(admin.phone, codes) || '—'}
                </span>
              ),
            },
            {
              label: t('reg.field.validity'),
              value: (
                <span className="tnum" dir="auto">
                  {formatDate(admin.activationDate, intlLocale)} → {formatDate(admin.expiryDate, intlLocale)}
                </span>
              ),
            },
          ]}
        />
      </Panel>

      <Panel>
        <PanelHeader
          title={t('reg.step.records')}
          action={<EditLink label={t('common.edit')} onClick={() => goTo(3)} />}
        />
        <DetailList
          columns={2}
          items={[
            {
              label: t('reg.section.contacts'),
              value:
                draft.contacts.length === 0 ? (
                  t('common.none')
                ) : (
                  <ul className="space-y-1">
                    {draft.contacts.map((contact) => (
                      <li key={contact.id} dir="auto">
                        <span className="font-medium text-ink-900">{fullName(contact)}</span>
                        <span className="text-ink-500"> · {label('positions', contact.positionId)}</span>
                      </li>
                    ))}
                  </ul>
                ),
            },
            {
              label: t('reg.section.documents'),
              value:
                draft.documents.length === 0 ? (
                  <span className="text-danger-700">{t('reg.err.documentsRequired')}</span>
                ) : (
                  <ul className="space-y-1">
                    {draft.documents.map((document) => (
                      <li key={document.id} dir="auto">
                        <span className="font-medium text-ink-900">
                          {label('documentTypes', document.documentTypeId)}
                        </span>
                        <span className="tnum text-ink-500"> · {formatDate(document.expiryDate, intlLocale)}</span>
                      </li>
                    ))}
                  </ul>
                ),
            },
          ]}
        />
      </Panel>

      <Panel>
        <Checkbox
          checked={consent}
          onChange={onConsentChange}
          label={<span dir="auto">{t('reg.review.consent')}</span>}
        />
        {consentError && <p className="mt-2 ps-6 text-[12.5px] text-danger-700">{consentError}</p>}
      </Panel>
    </div>
  );
}
