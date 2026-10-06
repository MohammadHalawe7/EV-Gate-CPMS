import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from '@/lib/utils';

export interface AccordionItem {
  key: string;
  title: ReactNode;
  meta?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  disabled?: boolean;
}

/**
 * Disclosure list. Rows share the panel border language (1px ink-200,
 * 10px radius) rather than stacking shadowed cards.
 */
export function Accordion({
  items,
  defaultOpen = [],
  multiple = true,
  className,
}: {
  items: AccordionItem[];
  defaultOpen?: string[];
  multiple?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState<string[]>(defaultOpen);

  function toggle(key: string) {
    setOpen((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      return multiple ? [...prev, key] : [key];
    });
  }

  return (
    <div className={cx('divide-y divide-ink-200 overflow-hidden rounded-[10px] border border-ink-200 bg-white', className)}>
      {items.map((item) => {
        const isOpen = open.includes(item.key);
        return (
          <div key={item.key}>
            <button
              type="button"
              disabled={item.disabled}
              aria-expanded={isOpen}
              onClick={() => toggle(item.key)}
              className={cx(
                'flex w-full items-center gap-2.5 px-4 py-3 text-start transition-colors',
                item.disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-ink-50',
              )}
            >
              <ChevronDown
                className={cx('h-4 w-4 shrink-0 text-ink-400 transition-transform duration-150', isOpen && 'rotate-180')}
              />
              {item.icon && <span className="shrink-0 text-ink-400 [&>svg]:h-4 [&>svg]:w-4">{item.icon}</span>}
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink-900">{item.title}</span>
              {item.meta && <span className="shrink-0 text-[12px] text-ink-500">{item.meta}</span>}
            </button>
            {isOpen && <div className="border-t border-ink-100 bg-ink-50/40 px-4 py-3.5 text-[13px] text-ink-600">{item.children}</div>}
          </div>
        );
      })}
    </div>
  );
}
