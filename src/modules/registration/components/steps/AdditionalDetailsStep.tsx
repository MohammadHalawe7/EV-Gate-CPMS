import { useI18n } from '@/i18n';
import { Field, Input } from '@/components/ui/Field';
import { Panel, PanelHeader } from '@/components/ui/Surface';
import { Alert } from '@/components/ui/Alert';
import { DependentLookupSelect, LookupSelect } from '../LookupField';
import type { RegistrationFormApi } from '../../useRegistrationForm';

export function AdditionalDetailsStep({ form }: { form: RegistrationFormApi }) {
  const { t } = useI18n();
  const { draft, setField, touch, errorFor } = form;
  const a = draft.additional;

  const err = (path: string) => {
    const key = errorFor(path);
    return key ? t(key as never) : undefined;
  };

  return (
    <div className="space-y-4">
      <Alert tone="info" compact>
        {t('reg.section.additionalNote')}
      </Alert>

      <Panel>
        <PanelHeader title={t('reg.section.sectors')} subtitle={t('reg.section.sectorsHint')} />

        <div className="grid gap-4 sm:grid-cols-2">
          <LookupSelect
            lookup="mainSectors"
            label={t('reg.field.mainSector')}
            value={a.mainSectorId}
            onChange={(v) => setField('additional', 'mainSectorId', v)}
            onBlur={() => touch('additional.mainSectorId')}
            error={err('additional.mainSectorId')}
            placeholder={t('reg.ph.searchSector')}
          />

          <DependentLookupSelect
            lookup="subSectors"
            parentId={a.mainSectorId}
            label={t('reg.field.subSector')}
            value={a.subSectorId}
            onChange={(v) => setField('additional', 'subSectorId', v)}
            error={err('additional.subSectorId')}
            placeholder={t('reg.ph.searchSubSector')}
            waitingHint={t('reg.hint.selectSectorFirst')}
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader title={t('reg.section.postal')} subtitle={t('reg.section.postalHint')} />

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t('reg.field.fax')} htmlFor="add-fax">
            <Input
              id="add-fax"
              dir="ltr"
              className="tnum"
              value={a.faxNumber}
              onChange={(e) => setField('additional', 'faxNumber', e.target.value)}
              placeholder="+971 4 000 0000"
            />
          </Field>

          <Field label={t('reg.field.poBox')} htmlFor="add-pobox">
            <Input
              id="add-pobox"
              dir="ltr"
              className="tnum"
              value={a.poBox}
              onChange={(e) => setField('additional', 'poBox', e.target.value)}
              placeholder="12345"
            />
          </Field>

          <Field label={t('reg.field.zip')} htmlFor="add-zip">
            <Input
              id="add-zip"
              dir="ltr"
              className="tnum"
              value={a.zipCode}
              onChange={(e) => setField('additional', 'zipCode', e.target.value)}
              placeholder="00000"
            />
          </Field>
        </div>
      </Panel>
    </div>
  );
}
