/* =============================================================================
 * Company Registration — the form.
 *
 * One component serves all three onboarding channels. `mode` decides the
 * chrome and the wording, not the fields:
 *
 *   public    a company registering itself from outside the platform
 *   internal  a Platform or Tenant Admin registering a company from inside
 *
 * Only the public route is wired today; the internal route mounts the same
 * component inside `AppShell` when the Companies module arrives.
 * ========================================================================== */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, RotateCcw, Save, Send } from 'lucide-react';
import { useI18n } from '@/i18n';
import { formatRelative } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Surface';
import { Alert } from '@/components/ui/Alert';
import { Stepper, StepperFooter, type StepItem } from '@/components/ui/Stepper';
import { ConfirmDialog } from '@/components/ui/Overlay';
import { useToast } from '@/components/ui/Toast';
import { saveDraft, submitRegistration } from '@/data/registrationService';
import type { CompanyRegistration, RegistrationChannel } from '@/domain';
import { REVIEW_STEP, useRegistrationForm } from '../useRegistrationForm';
import { CompanyInfoStep } from './steps/CompanyInfoStep';
import { AdditionalDetailsStep } from './steps/AdditionalDetailsStep';
import { AdminAccountStep } from './steps/AdminAccountStep';
import { ReviewStep } from './steps/ReviewStep';
import { ContactsPanel } from './ContactsPanel';
import { DocumentsPanel } from './DocumentsPanel';

export function CompanyRegistrationForm({
  mode = 'public',
  channel = 'self',
  onSubmitted,
}: {
  mode?: 'public' | 'internal';
  channel?: RegistrationChannel;
  onSubmitted?: (record: CompanyRegistration) => void;
}) {
  const { t, intlLocale } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  const form = useRegistrationForm(channel);

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | undefined>();
  const [resetting, setResetting] = useState(false);
  const [restoredVisible, setRestoredVisible] = useState(Boolean(form.restored));

  const steps: StepItem[] = [
    { key: 'company', label: t('reg.step.company'), description: t('reg.step.companyHint') },
    { key: 'additional', label: t('reg.step.additional'), description: t('reg.step.additionalHint') },
    { key: 'admin', label: t('reg.step.admin'), description: t('reg.step.adminHint') },
    { key: 'records', label: t('reg.step.records'), description: t('reg.step.recordsHint') },
    { key: 'review', label: t('reg.step.review'), description: t('reg.step.reviewHint') },
  ].map((step, index) =>
    form.invalidSteps.includes(index) && index !== form.step
      ? { ...step, status: 'error' as const }
      : step,
  );

  const handleSaveDraft = async () => {
    setSaving(true);
    await saveDraft(form.draft, form.step);
    form.markSaved();
    setSaving(false);
    toast.success(t('reg.toast.draftSaved'), t('reg.toast.draftSavedDesc'));
  };

  const handleSubmit = async () => {
    if (!consent) {
      setConsentError(t('reg.err.consent'));
      return;
    }
    if (!form.validateEverything()) {
      toast.error(t('reg.toast.incomplete'), t('reg.toast.incompleteDesc'));
      return;
    }
    setConfirming(true);
  };

  const confirmSubmit = async () => {
    setConfirming(false);
    setSubmitting(true);
    const record = await submitRegistration(form.draft);
    setSubmitting(false);
    toast.success(t('reg.toast.submitted'), record.reference);
    if (onSubmitted) onSubmitted(record);
    else navigate('/register/submitted', { state: { reference: record.reference, email: record.admin.email } });
  };

  const documentsError = form.errors['documents'] ? t(form.errors['documents'] as never) : undefined;

  /* A long form needs a way back to what failed. The summary names the count
     and the footer keeps its place; the page returns to the top so the summary
     is the first thing seen after a blocked "Next". */
  const stepErrorCount = useMemo(() => Object.keys(form.errors).length, [form.errors]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [form.step]);

  return (
    <div className="space-y-5">
      {restoredVisible && form.restored && (
        <Alert
          tone="info"
          title={t('reg.draft.restoredTitle')}
          onDismiss={() => setRestoredVisible(false)}
          action={
            <Button size="xs" variant="ghost" icon={<RotateCcw className="h-3 w-3" />} onClick={() => setResetting(true)}>
              {t('reg.draft.startOver')}
            </Button>
          }
        >
          {t('reg.draft.restoredBody', { when: formatRelative(form.restored.savedAt, intlLocale) })}
        </Alert>
      )}

      {/* The stepper stays in view through a long form — it is both the
          progress read-out and the way back to an earlier step. `top-14`
          parks it under the public header rather than over it. */}
      <div className="sticky top-14 z-20 -mx-4 bg-ink-50/85 px-4 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <Panel className="shadow-[var(--shadow-panel)]">
          <Stepper steps={steps} current={form.step} onSelect={form.goTo} />
        </Panel>
      </div>

      {stepErrorCount > 0 && form.step !== REVIEW_STEP && (
        <Alert tone="danger" title={t('reg.err.summaryTitle', { count: String(stepErrorCount) })}>
          {t('reg.err.summaryBody')}
        </Alert>
      )}

      {form.step === 0 && <CompanyInfoStep form={form} />}
      {form.step === 1 && <AdditionalDetailsStep form={form} />}
      {form.step === 2 && <AdminAccountStep form={form} />}
      {form.step === 3 && (
        <div className="space-y-4">
          <ContactsPanel
            contacts={form.draft.contacts}
            onSave={form.upsertContact}
            onRemove={form.removeContact}
          />
          <DocumentsPanel
            documents={form.draft.documents}
            onSave={form.upsertDocument}
            onRemove={form.removeDocument}
            error={documentsError}
          />
        </div>
      )}
      {form.step === REVIEW_STEP && (
        <ReviewStep
          form={form}
          consent={consent}
          onConsentChange={(v) => {
            setConsent(v);
            if (v) setConsentError(undefined);
          }}
          consentError={consentError}
        />
      )}

      <StepperFooter
        start={
          form.step > 0 ? (
            <Button variant="ghost" icon={<ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />} onClick={form.back}>
              {t('common.back')}
            </Button>
          ) : (
            mode === 'public' && (
              <Button variant="ghost" onClick={() => navigate('/login')}>
                {t('reg.action.cancelToLogin')}
              </Button>
            )
          )
        }
        end={
          <>
            <Button icon={<Save className="h-3.5 w-3.5" />} loading={saving} onClick={handleSaveDraft}>
              {t('reg.action.saveDraft')}
            </Button>
            {form.step < REVIEW_STEP ? (
              <Button
                variant="primary"
                iconEnd={<ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />}
                onClick={form.next}
              >
                {t('common.next')}
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={<Send className="h-3.5 w-3.5" />}
                loading={submitting}
                onClick={handleSubmit}
              >
                {mode === 'internal' ? t('reg.action.createCompany') : t('reg.action.submit')}
              </Button>
            )}
          </>
        }
      />

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={confirmSubmit}
        tone="primary"
        title={t('reg.confirm.title')}
        message={t('reg.confirm.body', { company: form.draft.company.name })}
        confirmLabel={t('reg.action.submit')}
      >
        <ul className="mt-3 space-y-1.5 text-[12.5px] text-ink-600">
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-500" />
            {t('reg.confirm.point1')}
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-500" />
            {t('reg.confirm.point2')}
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-500" />
            {t('reg.confirm.point3')}
          </li>
        </ul>
      </ConfirmDialog>

      <ConfirmDialog
        open={resetting}
        onClose={() => setResetting(false)}
        onConfirm={() => {
          form.reset();
          setResetting(false);
          setRestoredVisible(false);
          setConsent(false);
        }}
        title={t('reg.draft.discardTitle')}
        message={t('reg.draft.discardBody')}
        confirmLabel={t('reg.draft.startOver')}
      />
    </div>
  );
}
