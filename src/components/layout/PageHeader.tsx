import type { ReactNode } from 'react';
import { cx } from '@/lib/utils';
import { Breadcrumbs, type Crumb } from '@/components/ui/Breadcrumbs';

export type { Crumb };

export function PageHeader({
  title,
  description,
  crumbs,
  actions,
  meta,
  tabs,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
  meta?: ReactNode;
  tabs?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('mb-5', className)}>
      {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} className="mb-1.5" />}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 dir="auto" className="text-[20px] font-semibold leading-tight tracking-[-0.015em] text-ink-900">{title}</h1>
          {description && <p dir="auto" className="mt-1 text-[13px] text-ink-500">{description}</p>}
          {meta && <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {tabs && <div className="mt-4">{tabs}</div>}
    </div>
  );
}

export function MetaItem({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
  return (
    <span dir="auto" className="flex items-center gap-1.5 text-[12.5px]">
      {icon && <span className="text-ink-400 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>}
      <span className="text-ink-400">{label}</span>
      <span className="font-medium text-ink-800">{value}</span>
    </span>
  );
}
