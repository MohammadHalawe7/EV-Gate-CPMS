import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cx } from '@/lib/utils';

export interface Crumb {
  label: string;
  to?: string;
}

/**
 * Ancestor trail. The last crumb is the current page and is never a link.
 * The chevron is mirrored in RTL via `rtl:rotate-180`; the trail itself
 * reverses automatically because it is laid out with logical flow.
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className={cx('flex flex-wrap items-center gap-1 text-[12px] text-ink-500', className)}>
      {items.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3 text-ink-300 rtl:rotate-180" />}
          {crumb.to ? (
            <Link to={crumb.to} className="hover:text-brand-800">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-ink-700">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
