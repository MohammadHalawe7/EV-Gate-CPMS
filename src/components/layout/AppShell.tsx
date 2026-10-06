import { useEffect, useState, type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cx } from '@/lib/utils';
import { Sidebar, type NavGroup } from './Sidebar';

const COLLAPSE_KEY = 'evgate.sidebar.collapsed';

/**
 * The EV Gate application frame: a persistent rail on `lg` and up, a drawer
 * below it, a sticky header, and a scrolling content column capped at 1600px.
 *
 * Preserved verbatim from EV Gate CPMS apart from its inputs. The product
 * supplies the navigation and renders its own `<Topbar>` through the `topbar`
 * render prop, which receives the handlers the shell owns.
 *
 *   <Route element={
 *     <AppShell
 *       groups={NAV_GROUPS}
 *       topbar={({ openSidebar, openSearch }) => (
 *         <Topbar onOpenSidebar={openSidebar} onOpenSearch={openSearch} … />
 *       )}
 *     />
 *   }>
 */
export function AppShell({
  groups,
  topbar,
  sidebarFooter,
  homeTo = '/',
  onSearchShortcut,
  children,
}: {
  groups: NavGroup[];
  topbar?: (handlers: { openSidebar: () => void; openSearch: () => void }) => ReactNode;
  sidebarFooter?: ReactNode;
  homeTo?: string;
  /** Called on ⌘K / Ctrl+K. Wire a command palette here. */
  onSearchShortcut?: () => void;
  /** Defaults to the router `<Outlet />`. */
  children?: ReactNode;
}) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  /* ⌘K / Ctrl+K. */
  useEffect(() => {
    if (!onSearchShortcut) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onSearchShortcut();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSearchShortcut]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-ink-50">
      <div className="hidden lg:block">
        <Sidebar
          groups={groups}
          homeTo={homeTo}
          footer={sidebarFooter}
          collapsed={collapsed}
          onToggle={() => setCollapsed((p) => !p)}
        />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/35" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 start-0 eg-anim-drawer" style={{ ['--eg-slide-from' as string]: '-100%' }}>
            <Sidebar
              groups={groups}
              homeTo={homeTo}
              footer={sidebarFooter}
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
              onNavigate={() => setMobileOpen(false)}
              mobile
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {topbar?.({ openSidebar: () => setMobileOpen(true), openSearch: () => onSearchShortcut?.() })}
        <main className={cx('eg-scroll flex-1 overflow-y-auto')}>
          <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6">{children ?? <Outlet />}</div>
        </main>
      </div>
    </div>
  );
}
