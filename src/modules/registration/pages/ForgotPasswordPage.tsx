import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MailCheck, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/i18n';
import { cx } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { CONTROL_BASE, CONTROL_INTERACTIVE, Field } from '@/components/ui/Field';
import { AuthLayout } from '@/app/AuthLayout';

export function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <AuthLayout
      eyebrow={t('reset.eyebrow')}
      title={sent ? t('reset.sentTitle') : t('reset.title')}
      description={sent ? undefined : t('reset.subtitle')}
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-700 hover:text-brand-900"
        >
          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          {t('reset.backToLogin')}
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-[10px] border border-success-100 bg-success-50 p-5">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-success-500">
            <MailCheck className="h-5 w-5" />
          </span>
          <p dir="auto" className="text-[13.5px] leading-relaxed text-ink-700">
            {t('reset.sentBody', { email })}
          </p>
          <Button
            variant="secondary"
            fullWidth
            className="mt-4 bg-white"
            onClick={() => {
              setSent(false);
              setEmail('');
            }}
          >
            {t('reset.tryAnother')}
          </Button>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setBusy(true);
            window.setTimeout(() => {
              setBusy(false);
              setSent(true);
            }, 700);
          }}
        >
          <Field label={t('common.email')} required htmlFor="reset-email">
            <div className="relative" dir="ltr">
              <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                id="reset-email"
                type="email"
                dir="ltr"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={cx(CONTROL_BASE, CONTROL_INTERACTIVE, 'h-11 ps-10 pe-3 text-[13.5px]')}
              />
            </div>
          </Field>

          <Button type="submit" variant="primary" size="lg" fullWidth loading={busy}>
            {t('reset.action')}
          </Button>

          <p className="flex items-start gap-2 pt-1 text-[12px] leading-relaxed text-ink-400">
            <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0" />
            <span dir="auto">{t('reset.securityNote')}</span>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
