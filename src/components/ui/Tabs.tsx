import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { cx } from '@/lib/utils';

export interface TabItem<T extends string = string> {
  key: T;
  label: ReactNode;
  count?: number;
  icon?: ReactNode;
  disabled?: boolean;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  size = 'md',
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={cx('eg-scroll -mb-px flex gap-1 overflow-x-auto border-b border-ink-200', className)}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            disabled={item.disabled}
            onClick={() => onChange(item.key)}
            className={cx(
              'relative -mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 font-medium transition-colors',
              size === 'sm' ? 'px-2.5 pb-2 pt-1.5 text-[12.5px]' : 'px-3 pb-2.5 pt-2 text-[13px]',
              active
                ? 'border-brand-800 text-brand-900'
                : 'border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-800',
              item.disabled && 'cursor-not-allowed opacity-40',
            )}
          >
            {item.icon && <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{item.icon}</span>}
            {item.label}
            {item.count !== undefined && (
              <span
                className={cx(
                  'tnum rounded-full px-1.5 py-px text-[11px]',
                  active ? 'bg-brand-100 text-brand-800' : 'bg-ink-100 text-ink-500',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function NavTabs({
  items,
  className,
}: {
  items: { to: string; label: ReactNode; end?: boolean; count?: number }[];
  className?: string;
}) {
  return (
    <div className={cx('eg-scroll -mb-px flex gap-1 overflow-x-auto border-b border-ink-200', className)}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cx(
              'relative -mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 pb-2.5 pt-2 text-[13px] font-medium transition-colors',
              isActive
                ? 'border-brand-800 text-brand-900'
                : 'border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-800',
            )
          }
        >
          {item.label}
          {item.count !== undefined && (
            <span className="tnum rounded-full bg-ink-100 px-1.5 py-px text-[11px] text-ink-500">{item.count}</span>
          )}
        </NavLink>
      ))}
    </div>
  );
}
