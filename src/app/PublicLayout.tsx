/* =============================================================================
 * The public shell — everything reachable before sign-in.
 *
 * A quiet top bar carrying the EV Gate lockup and the language toggle, a
 * centred content column on the page background, and a thin footer. The
 * authenticated application uses `AppShell` instead; nothing here duplicates
 * it, and both take their type, colour and spacing from the same tokens.
 * ========================================================================== */

import type { ReactNode } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { cx } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { BrandLockup } from '@/components/layout/Brand';
import { Button } from '@/components/ui/Button';

const PUBLIC_LINKS = [
  { to: '/login', key: 'app.signIn' as const },
  { to: '/request-demo', key: 'public.requestDemo' as const },
  { to: '/register', key: 'public.register' as const },
];

export function PublicLayout({ children }: { children?: ReactNode }) {
  const { t, locale, toggleLocale } = useI18n();

  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center gap-4 px-4 sm:px-6">
          <Link to="/login" className="flex items-center" aria-label={t('app.name')}>
            <BrandLockup suffix="CPMS" />
          </Link>

          <nav className="ms-auto hidden items-center gap-1 md:flex">
            {PUBLIC_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cx(
                    'rounded-[7px] px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                    isActive ? 'bg-brand-50 text-brand-900' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                  )
                }
              >
                {t(link.key)}
              </NavLink>
            ))}
          </nav>

          <Button
            size="sm"
            variant="ghost"
            icon={<Globe className="h-3.5 w-3.5" />}
            onClick={toggleLocale}
            className="ms-auto md:ms-0"
          >
            {locale === 'en' ? t('app.arabic') : t('app.english')}
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8">{children ?? <Outlet />}</div>
      </main>

      <footer className="border-t border-ink-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-2 px-4 py-4 text-[12px] text-ink-500 sm:px-6">
          <p dir="auto">{t('public.footer', { year: String(new Date().getFullYear()) })}</p>
          <p className="flex items-center gap-3">
            <span>{t('public.support')}</span>
            <a href="mailto:support@evgate.example" dir="ltr" className="text-brand-700 hover:text-brand-900">
              support@evgate.example
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * The narrow variant — sign in, a submitted confirmation, a status lookup.
 * A single centred column rather than the full 1200px rhythm.
 */
export function PublicNarrow({ children, width = 'md' }: { children: ReactNode; width?: 'sm' | 'md' }) {
  return (
    <div className={cx('mx-auto w-full', width === 'sm' ? 'max-w-[420px]' : 'max-w-[560px]')}>{children}</div>
  );
}
