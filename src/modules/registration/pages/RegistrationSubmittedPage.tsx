import { Link, useLocation, Navigate } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle2, Copy, Mail } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useState } from 'react';
import { Button, IconButton } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Surface';
import { StatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { BrandPanel } from '@/app/BrandPanel';
import networkMap from '@/assets/brand/imagery/evgate-network-map.webp';
import { REGISTRATION_EMAILS } from '@/domain';

interface SubmittedState {
  reference?: string;
  email?: string;
  demo?: boolean;
}

export function RegistrationSubmittedPage() {
  const { t } = useI18n();
  const toast = useToast();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const state = (location.state ?? {}) as SubmittedState;

  if (!state.reference) return <Navigate to="/register" replace />;

  const demo = Boolean(state.demo);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(state.reference as string);
      setCopied(true);
      toast.success(t('common.copied'));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the reference is on screen either way */
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-[900px] gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Panel className="p-6 sm:p-8">
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-success-50 text-success-500 ring-8 ring-success-50/50">
          <CheckCircle2 className="h-6 w-6" />
        </span>

        <h1
          dir="auto"
          className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink-900"
        >
          {demo ? t('done.demoTitle') : t('done.title')}
        </h1>
        <p dir="auto" className="mt-2 max-w-lg text-[13.5px] leading-relaxed text-ink-500">
          {demo ? t('done.demoBody') : t('done.body')}
        </p>

        {!demo && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[10px] border border-brand-100 bg-brand-50/60 p-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">
                {t('done.reference')}
              </p>
              <p dir="ltr" className="tnum mt-1 text-[20px] font-semibold text-brand-900">
                {state.reference}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status="Submitted" />
              <IconButton label={t('common.copy')} size="sm" variant="ghost" onClick={copy}>
                {copied ? <Check className="h-4 w-4 text-success-500" /> : <Copy className="h-4 w-4" />}
              </IconButton>
            </div>
          </div>
        )}

        {state.email && (
          <p className="mt-4 flex items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-500">
            <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info-500" />
            <span dir="auto">{t('done.emailBody', { email: state.email })}</span>
          </p>
        )}

        <ol className="mt-7 space-y-0 border-t border-ink-200 pt-6">
          {(['done.step1', 'done.step2', 'done.step3'] as const).map((key, i, all) => (
            <li key={key} className="relative flex gap-3.5 pb-5 last:pb-0">
              {i < all.length - 1 && (
                <span aria-hidden className="absolute start-[13px] top-7 h-[calc(100%-1.25rem)] w-px bg-ink-200" />
              )}
              <span className="tnum relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-white text-[11.5px] font-semibold text-ink-500">
                {i + 1}
              </span>
              <p dir="auto" className="pt-1 text-[13px] leading-relaxed text-ink-700">
                {t(key)}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-ink-200 pt-5">
          <Link to="/login">
            <Button variant="primary" iconEnd={<ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />}>
              {t('done.backToLogin')}
            </Button>
          </Link>
          <Link to="/registration-status">
            <Button>{t('public.trackApplication')}</Button>
          </Link>
        </div>
      </Panel>

      <BrandPanel image={networkMap} imagePosition="55% 60%" minHeight={340}>
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-accent-400">
          {t('done.aside.eyebrow')}
        </p>
        <h2 dir="auto" className="mt-2 text-[18px] font-semibold leading-snug text-white">
          {t('done.aside.title')}
        </h2>
        <p dir="auto" className="mt-2.5 text-[12.5px] leading-relaxed text-brand-100/85">
          {t('done.aside.body')}
        </p>
        <p className="mt-4 border-t border-white/10 pt-3 text-[11.5px] text-brand-200/70">
          {t('done.emailsSent', { count: String(REGISTRATION_EMAILS.length) })}
        </p>
      </BrandPanel>
    </div>
  );
}
