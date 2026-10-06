import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useI18n } from '@/i18n';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Panel, PanelHeader, DetailList, EmptyState } from '@/components/ui/Surface';
import { Alert } from '@/components/ui/Alert';
import { StatusBadge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/States';
import { Stepper, type StepItem } from '@/components/ui/Stepper';
import { PublicNarrow } from '@/app/PublicLayout';
import { useLookupLabel } from '../components/LookupField';
import { findByReference } from '@/data/registrationService';
import type { CompanyRegistration, RegistrationStatus } from '@/domain';

/** Where a status sits on the applicant-facing track. */
const TRACK: RegistrationStatus[] = ['Submitted', 'UnderReview', 'Approved'];

function trackIndex(status: RegistrationStatus): number {
  if (status === 'Rejected' || status === 'Withdrawn') return 1;
  if (status === 'Demo' || status === 'Converted') return TRACK.length;
  const i = TRACK.indexOf(status);
  return i < 0 ? 0 : i;
}

export function RegistrationStatusPage() {
  const { t, intlLocale } = useI18n();
  const label = useLookupLabel();
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [record, setRecord] = useState<CompanyRegistration | null>(null);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return;
    setBusy(true);
    setSearched(false);
    const found = await findByReference(reference);
    setRecord(found);
    setBusy(false);
    setSearched(true);
  };

  const steps: StepItem[] = TRACK.map((status) => ({
    key: status,
    label: t(`status.${status}` as never),
  }));

  const rejected = record?.status === 'Rejected';
  const current = record ? trackIndex(record.status) : 0;

  return (
    <PublicNarrow>
      <div className="mb-6 text-center">
        <h1 className="text-[20px] font-semibold tracking-[-0.015em] text-ink-900">{t('track.title')}</h1>
        <p className="mt-1 text-[13px] text-ink-500">{t('track.subtitle')}</p>
      </div>

      <Panel className="p-5">
        <form onSubmit={lookup} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label={t('track.reference')} className="flex-1" htmlFor="track-ref">
            <Input
              id="track-ref"
              dir="ltr"
              className="tnum"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="EVG-REG-2026-0001"
            />
          </Field>
          <Button type="submit" variant="primary" loading={busy} icon={<Search className="h-3.5 w-3.5" />}>
            {t('track.action')}
          </Button>
        </form>
        <p className="mt-2 text-[11.5px] text-ink-400">{t('track.hint')}</p>
      </Panel>

      {busy && (
        <Panel className="mt-4">
          <LoadingState label={t('track.searching')} />
        </Panel>
      )}

      {!busy && searched && !record && (
        <Panel className="mt-4">
          <EmptyState
            compact
            icon={<Search className="h-5 w-5" />}
            title={t('track.notFound')}
            description={t('track.notFoundDesc')}
          />
        </Panel>
      )}

      {!busy && record && (
        <Panel className="mt-4">
          <PanelHeader
            title={record.company.name || t('track.application')}
            subtitle={<span dir="ltr">{record.reference}</span>}
            action={<StatusBadge status={record.status} label={t(`status.${record.status}` as never)} />}
          />

          <Stepper
            steps={steps.map((step, index) =>
              rejected && index === 1 ? { ...step, status: 'error' as const } : step,
            )}
            current={current}
            className="mb-4"
          />

          {rejected && record.decisionNote && (
            <Alert tone="danger" title={t('track.rejectedTitle')} className="mb-4">
              <span dir="auto">{record.decisionNote}</span>
            </Alert>
          )}

          {record.status === 'Demo' && (
            <Alert tone="info" title={t('track.demoTitle')} className="mb-4">
              {t('track.demoBody')}
            </Alert>
          )}

          <DetailList
            items={[
              { label: t('common.status'), value: t(`status.${record.status}` as never) },
              { label: t('reg.field.country'), value: label('countries', record.company.countryId) },
              { label: t('track.submittedAt'), value: formatDateTime(record.submittedAt ?? undefined, intlLocale) },
              { label: t('common.updated'), value: formatDateTime(record.updatedAt, intlLocale) },
            ]}
          />
        </Panel>
      )}

      <p className="mt-5 text-center text-[13px] text-ink-500">
        <Link to="/login" className="font-medium text-brand-700 hover:text-brand-900">
          {t('reset.backToLogin')}
        </Link>
      </p>
    </PublicNarrow>
  );
}
