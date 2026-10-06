import type { ComponentType, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cx } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { BrandLockup } from './Brand';

/**
 * The EV Gate navigation rail.
 *
 * Styling is preserved verbatim from EV Gate CPMS — 236px expanded, 62px
 * collapsed, 36px rows, `brand-50` active fill with a 3px start rail, uppercase
 * group headings. What changed for the design system is only the *source* of
 * the items: they arrive as props instead of being read from a product store,
 * so any EV Gate product supplies its own navigation without touching this file.
 */

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
  /** Optional count rendered as a pill (and as a dot when collapsed). */
  badge?: number;
  /** `danger` for anything demanding attention, `info` for volume. */
  badgeTone?: 'danger' | 'info';
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export function Sidebar({
  groups,
  collapsed,
  onToggle,
  onNavigate,
  mobile,
  homeTo = '/',
  brandSuffix,
  footer,
}: {
  groups: NavGroup[];
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  mobile?: boolean;
  homeTo?: string;
  /** Product name shown beside the mark — e.g. "CPMS". */
  brandSuffix?: string;
  footer?: ReactNode;
}) {
  const { t } = useI18n();
  const compact = collapsed && !mobile;

  return (
    <aside
      className={cx(
        'flex h-full flex-col border-e border-ink-200 bg-white transition-[width] duration-200',
        compact ? 'w-[62px]' : 'w-[236px]',
      )}
    >
      <div
        className={cx(
          'flex h-14 shrink-0 items-center border-b border-ink-200',
          compact ? 'justify-center px-2' : 'justify-between px-4',
        )}
      >
        <NavLink to={homeTo} onClick={onNavigate} className="flex items-center">
          <BrandLockup compact={compact} suffix={brandSuffix} />
        </NavLink>
        {!mobile && !collapsed && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={t('app.collapse')}
            title={t('app.collapse')}
            className="text-ink-400 hover:text-ink-700"
          >
            <PanelLeftClose className="h-4 w-4 rtl:rotate-180" />
          </button>
        )}
      </div>

      {compact && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={t('app.expand')}
          title={t('app.expand')}
          className="mx-auto mt-2 text-ink-400 hover:text-ink-700"
        >
          <PanelLeftOpen className="h-4 w-4 rtl:rotate-180" />
        </button>
      )}

      <nav className="eg-scroll flex-1 overflow-y-auto px-2.5 py-3">
        {groups.map((group) => {
          if (group.items.length === 0) return null;
          return (
            <div key={group.label} className="mb-4 last:mb-0">
              {!compact && (
                <p className="mb-1.5 px-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const badgeCount = item.badge ?? 0;
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={onNavigate}
                        title={compact ? item.label : undefined}
                        className={({ isActive }) =>
                          cx(
                            'group relative flex items-center rounded-[7px] text-[13px] font-medium transition-colors',
                            compact ? 'h-9 justify-center' : 'h-9 gap-2.5 px-2.5',
                            isActive
                              ? 'bg-brand-50 text-brand-900'
                              : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <span className="absolute inset-y-1.5 start-0 w-[3px] rounded-full bg-brand-800" aria-hidden />
                            )}
                            <Icon
                              className={cx(
                                'h-4 w-4 shrink-0',
                                isActive ? 'text-brand-800' : 'text-ink-400 group-hover:text-ink-600',
                              )}
                            />
                            {!compact && <span className="flex-1 truncate">{item.label}</span>}
                            {!compact && badgeCount > 0 && (
                              <span
                                className={cx(
                                  'tnum rounded-full px-1.5 py-px text-[10.5px] font-semibold',
                                  item.badgeTone === 'danger' ? 'bg-danger-50 text-danger-700' : 'bg-info-50 text-info-700',
                                )}
                              >
                                {badgeCount}
                              </span>
                            )}
                            {compact && badgeCount > 0 && (
                              <span
                                className={cx(
                                  'absolute end-1.5 top-1.5 h-1.5 w-1.5 rounded-full',
                                  item.badgeTone === 'danger' ? 'bg-danger-500' : 'bg-info-500',
                                )}
                              />
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {!compact && footer && <div className="border-t border-ink-200 px-4 py-3">{footer}</div>}
    </aside>
  );
}

/** The footer treatment used at the bottom of the rail. */
export function SidebarFooter({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <p className="text-[11px] leading-relaxed text-ink-400">
      {title}
      {subtitle && (
        <>
          <br />
          <span className="text-ink-300">{subtitle}</span>
        </>
      )}
    </p>
  );
}
