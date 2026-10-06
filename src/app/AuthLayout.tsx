/* =============================================================================
 * The public authentication shell.
 *
 * A full-bleed split screen: the brand showcase on the start side, one narrow
 * form column on the end side. Distinct from `PublicLayout` — sign-in has no
 * top navigation and no footer chrome, because there is exactly one thing to
 * do on the page.
 *
 * Below `lg` the showcase is dropped entirely and the form takes the screen
 * under a compact brand header.
 * ========================================================================== */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { cx } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { EvGateLogo } from '@/components/layout/Brand';
import { AuthShowcase, SHOWCASE_COVER } from './AuthShowcase';

export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
  width = 'sm',
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** Links below the card — "no account yet", "back to sign in". */
  footer?: ReactNode;
  width?: 'sm' | 'md';
}) {
  const { t, locale, toggleLocale } = useI18n();

  return (
    <div className="flex min-h-screen bg-white">
      <AuthShowcase className="hidden w-[46%] shrink-0 lg:block xl:w-[52%]" />

      <main className="relative flex min-h-screen flex-1 flex-col">
        {/* Top bar — the mark on small screens, the language toggle always. */}
        <div className="flex h-16 shrink-0 items-center justify-between px-5 sm:px-8">
          <Link to="/login" aria-label={t('app.name')} className="lg:invisible">
            <EvGateLogo height={22} className="text-brand-900" />
          </Link>
          <Button
            size="sm"
            variant="ghost"
            icon={<Globe className="h-3.5 w-3.5" />}
            onClick={toggleLocale}
          >
            {locale === 'en' ? t('app.arabic') : t('app.english')}
          </Button>
        </div>

        {/* Below `lg` the carousel is dropped — a phone gets the form, not a
            slideshow — but the brand still gets one moment on the screen. */}
        <div className="relative isolate mx-5 mb-8 h-32 shrink-0 overflow-hidden rounded-[10px] bg-brand-950 sm:mx-8 lg:hidden">
          <img
            src={SHOWCASE_COVER}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: '58% 42%' }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(26,5,41,0.92) 0%, rgba(26,5,41,0.55) 60%, rgba(26,5,41,0.15) 100%)',
            }}
          />
          <div className="relative flex h-full flex-col justify-end p-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-accent-400">
              {t('showcase.1.eyebrow')}
            </p>
            <p dir="auto" className="mt-1 text-[15px] font-semibold leading-snug text-white">
              {t('showcase.1.headline')}
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-8">
          <div className={cx('w-full', width === 'sm' ? 'max-w-[400px]' : 'max-w-[460px]')}>
            {eyebrow && (
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-brand-600">
                {eyebrow}
              </p>
            )}
            <h1
              dir="auto"
              className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-ink-900"
            >
              {title}
            </h1>
            {description && (
              <p dir="auto" className="mt-2 text-[13.5px] leading-relaxed text-ink-500">
                {description}
              </p>
            )}

            <div className="mt-7">{children}</div>

            {footer && <div className="mt-7 border-t border-ink-200 pt-5">{footer}</div>}
          </div>
        </div>

        <footer className="shrink-0 px-5 pb-6 text-center text-[11.5px] text-ink-400 sm:px-8">
          <span dir="auto">{t('public.footer', { year: String(new Date().getFullYear()) })}</span>
        </footer>
      </main>
    </div>
  );
}
