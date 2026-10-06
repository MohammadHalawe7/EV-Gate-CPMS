import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Bell, Check, Globe, Menu as MenuIcon, Search } from 'lucide-react';
import { cx, formatRelative } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { Avatar } from '@/components/ui/Surface';
import { SeverityDot } from '@/components/ui/Badge';
import { Menu as DropMenu, Popover, type MenuItem } from '@/components/ui/Menu';

/**
 * The EV Gate application header.
 *
 * Preserved verbatim from EV Gate CPMS — 56px, sticky, white at 95% with a
 * blur, and the same right-hand cluster: live clock, language toggle,
 * notification bell with a popover, and the account menu. As with `Sidebar`,
 * the only change is that its content arrives as props rather than from a
 * product store.
 */

export interface TopbarNotification {
  id: string;
  title: string;
  body?: string;
  /** Any status name understood by `statusTone` — Critical, Major, Minor, Info. */
  severity: string;
  at: string;
  read?: boolean;
  onSelect?: () => void;
}

export function Topbar({
  onOpenSidebar,
  onOpenSearch,
  start,
  searchPlaceholder,
  notifications = [],
  onMarkAllRead,
  user,
  accountMenu,
  showClock = true,
  actions,
}: {
  onOpenSidebar?: () => void;
  onOpenSearch?: () => void;
  /** Slot at the start of the bar — a scope switcher, a breadcrumb, a title. */
  start?: ReactNode;
  searchPlaceholder?: string;
  notifications?: TopbarNotification[];
  onMarkAllRead?: () => void;
  user?: { name: string; nameAr?: string; caption?: string; avatarColor?: string };
  accountMenu?: MenuItem[];
  showClock?: boolean;
  /** Extra controls placed before the language toggle. */
  actions?: ReactNode;
}) {
  const { t, locale, setLocale } = useI18n();
  const [notifOpen, setNotifOpen] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  const notifRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showClock) return;
    const id = window.setInterval(() => setClock(new Date()), 30000);
    return () => window.clearInterval(id);
  }, [showClock]);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-ink-200 bg-white/95 px-3 backdrop-blur-sm sm:px-4">
      {onOpenSidebar && (
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label={t('app.openNavigation')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-[7px] text-ink-500 hover:bg-ink-100 lg:hidden"
        >
          <MenuIcon className="h-4.5 w-4.5" />
        </button>
      )}

      {start}

      {onOpenSearch && (
        <>
          <button
            type="button"
            onClick={onOpenSearch}
            className="ms-auto hidden h-9 min-w-[220px] items-center gap-2 rounded-[8px] border border-ink-200 bg-ink-50/70 px-3 text-[12.5px] text-ink-400 transition-colors hover:border-ink-300 hover:bg-white md:flex xl:min-w-[320px]"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 truncate text-start">{searchPlaceholder ?? t('app.search')}</span>
            <kbd className="rounded border border-ink-200 bg-white px-1 text-[10px] text-ink-400">⌘K</kbd>
          </button>

          <button
            type="button"
            onClick={onOpenSearch}
            aria-label={t('app.searchShort')}
            className="ms-auto inline-flex h-9 w-9 items-center justify-center rounded-[7px] text-ink-500 hover:bg-ink-100 md:hidden"
          >
            <Search className="h-4 w-4" />
          </button>
        </>
      )}

      {!onOpenSearch && <span className="ms-auto" />}

      {showClock && (
        <span dir="auto" className="hidden items-center gap-1.5 rounded-[7px] px-2 py-1 text-[12px] text-ink-500 xl:flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success-500 text-success-500 eg-live-dot" />
          </span>
          {clock.toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: false })} GST
        </span>
      )}

      <div className="flex items-center gap-0.5 md:ms-1">
        {actions}

        <button
          type="button"
          onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
          title={t('app.language')}
          className="inline-flex h-9 items-center gap-1.5 rounded-[7px] px-2 text-[12.5px] font-medium text-ink-600 hover:bg-ink-100"
        >
          <Globe className="h-4 w-4 text-ink-400" />
          <span className="hidden sm:inline">{locale === 'en' ? 'AR' : 'EN'}</span>
        </button>

        {notifications.length >= 0 && onMarkAllRead !== undefined && (
          <>
            <button
              ref={notifRef}
              type="button"
              onClick={() => setNotifOpen((p) => !p)}
              aria-label={t('app.notifications')}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-[7px] text-ink-500 hover:bg-ink-100"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute end-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[9.5px] font-semibold text-white">
                  {unread}
                </span>
              )}
            </button>

            <Popover open={notifOpen} onClose={() => setNotifOpen(false)} anchorRef={notifRef} width={360}>
              <div className="flex items-center justify-between border-b border-ink-200 px-3.5 py-2.5">
                <h3 className="text-[13px] font-semibold text-ink-900">{t('app.notifications')}</h3>
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllRead}
                    className="inline-flex items-center gap-1 text-[12px] text-brand-700 hover:text-brand-900"
                  >
                    <Check className="h-3 w-3" />
                    {t('app.markAllRead')}
                  </button>
                )}
              </div>
              <ul className="eg-scroll max-h-[400px] divide-y divide-ink-100 overflow-y-auto">
                {notifications.length === 0 && (
                  <li className="px-3.5 py-8 text-center text-[13px] text-ink-400">{t('app.noNotifications')}</li>
                )}
                {notifications.slice(0, 12).map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        n.onSelect?.();
                      }}
                      className={cx(
                        'flex w-full gap-2.5 px-3.5 py-2.5 text-start transition-colors hover:bg-ink-50',
                        !n.read && 'bg-brand-50/40',
                      )}
                    >
                      <span className="mt-1.5 shrink-0">
                        <SeverityDot severity={n.severity} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium text-ink-900">{n.title}</span>
                        {n.body && <span className="block truncate text-[12px] text-ink-500">{n.body}</span>}
                        <span className="mt-0.5 block text-[11px] text-ink-400">{formatRelative(n.at, locale)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Popover>
          </>
        )}

        {user && (
          <DropMenu
            width={260}
            items={accountMenu ?? []}
            trigger={
              <button type="button" className="flex items-center gap-2 rounded-[8px] px-1 py-1 hover:bg-ink-100">
                <Avatar name={user.name} color={user.avatarColor} size="sm" />
                <span className="hidden min-w-0 text-start lg:block">
                  <span className="block max-w-[150px] truncate text-[12.5px] font-medium leading-tight text-ink-900">
                    {locale === 'ar' ? (user.nameAr ?? user.name) : user.name}
                  </span>
                  {user.caption && (
                    <span className="block max-w-[150px] truncate text-[10.5px] leading-tight text-ink-400">{user.caption}</span>
                  )}
                </span>
              </button>
            }
          />
        )}
      </div>
    </header>
  );
}
