import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useI18n } from '@/i18n';
import { cx } from '@/lib/utils';
import { Button, IconButton } from '@/components/ui/Button';
import { Checkbox, CONTROL_BASE, CONTROL_INTERACTIVE, Field } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Surface';
import { AuthLayout } from '@/app/AuthLayout';
import { APP_ROUTES } from '@/app/navigation';
import { PERSONAS, useSession } from '@/app/session';

export function LoginPage() {
  const { t, ln } = useI18n();
  const navigate = useNavigate();
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * There is no authentication service yet — credentials belong to User & Role
   * Management. Any well-formed pair signs in as the Platform Administrator;
   * the persona row below is the quicker route and the one that demonstrates
   * how the permission model changes what the product shows.
   */
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError(t('login.err.credentials'));
      return;
    }
    setError(null);
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      signIn(PERSONAS[0].id);
      navigate(APP_ROUTES.dashboard);
    }, 700);
  };

  const enterAs = (personaId: string) => {
    signIn(personaId);
    navigate(APP_ROUTES.dashboard);
  };

  return (
    <AuthLayout
      eyebrow={t('login.eyebrow')}
      title={t('login.title')}
      description={t('login.subtitle')}
      footer={
        <div className="space-y-3">
          <p className="text-[13px] text-ink-500">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="font-medium text-brand-700 hover:text-brand-900">
              {t('public.register')}
            </Link>
          </p>
          <Link
            to="/registration-status"
            className="inline-flex items-center gap-1 text-[12.5px] text-ink-400 hover:text-brand-700"
          >
            {t('public.trackApplication')}
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </Link>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <Alert tone="warning" compact>
            {error}
          </Alert>
        )}

        <Field label={t('common.email')} required htmlFor="login-email">
          <div className="relative" dir="ltr">
            <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              id="login-email"
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

        <Field label={t('login.password')} required htmlFor="login-password">
          <div className="relative" dir="ltr">
            <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              id="login-password"
              type={reveal ? 'text' : 'password'}
              dir="ltr"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={cx(CONTROL_BASE, CONTROL_INTERACTIVE, 'h-11 ps-10 pe-11 text-[13.5px]')}
            />
            <IconButton
              label={t(reveal ? 'login.hidePassword' : 'login.showPassword')}
              size="sm"
              variant="ghost"
              onClick={() => setReveal((p) => !p)}
              className="absolute end-1.5 top-1/2 -translate-y-1/2"
            >
              {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </IconButton>
          </div>
        </Field>

        <div className="flex items-center justify-between gap-3 pt-0.5">
          <Checkbox checked={remember} onChange={setRemember} label={t('login.remember')} />
          <Link
            to="/forgot-password"
            className="text-[12.5px] font-medium text-brand-700 hover:text-brand-900"
          >
            {t('login.forgot')}
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={busy}
          iconEnd={<ArrowRight className="h-4 w-4 rtl:rotate-180" />}
          className="mt-1"
        >
          {t('app.signIn')}
        </Button>

        {/* ---- Demo personas ------------------------------------------------
            The prototype has no identity provider. Rather than hide that, the
            screen offers the four administration levels directly: one click
            signs in and the whole product re-scopes around that role. */}
        <div className="pt-1">
          <div className="mb-2 flex items-center gap-2.5">
            <span className="h-px flex-1 bg-ink-200" />
            <span className="text-[11px] font-medium uppercase tracking-[0.07em] text-ink-400">
              {t('login.personaTitle')}
            </span>
            <span className="h-px flex-1 bg-ink-200" />
          </div>
          <p className="mb-2.5 text-center text-[11.5px] leading-relaxed text-ink-400">
            {t('login.personaHint')}
          </p>
          <ul className="space-y-1.5">
            {PERSONAS.map((persona) => (
              <li key={persona.id}>
                <button
                  type="button"
                  onClick={() => enterAs(persona.id)}
                  className="group flex w-full items-center gap-3 rounded-[9px] border border-ink-200 bg-white px-3 py-2.5 text-start transition-all hover:border-brand-300 hover:bg-brand-50/40"
                >
                  <Avatar name={persona.name} color={persona.avatarColor} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span dir="auto" className="block truncate text-[12.5px] font-medium text-ink-900">
                      {ln({ name: persona.name, nameAr: persona.nameAr })}
                    </span>
                    <span className="block truncate text-[11px] text-ink-500">
                      {t(`persona.${persona.roleKey}` as never)}
                    </span>
                  </span>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink-200 text-ink-300 transition-colors group-hover:border-brand-400 group-hover:bg-brand-800 group-hover:text-white">
                    <Check className="h-3 w-3" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => navigate('/request-demo')}
          className="w-full rounded-[8px] border border-dashed border-ink-300 px-4 py-2.5 text-[12.5px] text-ink-500 transition-colors hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-800"
        >
          {t('login.demoNudge')}
        </button>
      </form>
    </AuthLayout>
  );
}
