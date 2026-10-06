import { useId, useState, type ReactNode } from 'react';
import { cx } from '@/lib/utils';

export type TooltipPlacement = 'top' | 'bottom' | 'start' | 'end';

/** Shared bubble — also rendered on its own by the Design System. */
export function TooltipBubble({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      role="tooltip"
      className={cx(
        'pointer-events-none inline-block max-w-[240px] rounded-[7px] bg-ink-900 px-2 py-1 text-[12px] leading-snug text-white',
        'shadow-[var(--shadow-overlay)]',
        className,
      )}
    >
      {children}
    </span>
  );
}

const PLACEMENT: Record<TooltipPlacement, string> = {
  top: 'bottom-full start-1/2 -translate-x-1/2 rtl:translate-x-1/2 mb-1.5',
  bottom: 'top-full start-1/2 -translate-x-1/2 rtl:translate-x-1/2 mt-1.5',
  start: 'end-full top-1/2 -translate-y-1/2 me-1.5',
  end: 'start-full top-1/2 -translate-y-1/2 ms-1.5',
};

/**
 * CSS-positioned tooltip. Kept out of a portal on purpose: it is only used on
 * small inline affordances, and staying in flow means it mirrors correctly in
 * RTL without measuring anything.
 *
 * `open` pins it — the Design System uses that so the state is visible in a
 * static capture rather than hidden behind hover.
 */
export function Tooltip({
  label,
  placement = 'top',
  children,
  open,
  className,
}: {
  label: ReactNode;
  placement?: TooltipPlacement;
  children: ReactNode;
  open?: boolean;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const id = useId();
  const visible = open ?? hovered;

  return (
    <span
      className={cx('relative inline-flex', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-describedby={visible ? id : undefined}
    >
      {children}
      {visible && (
        <span className={cx('absolute z-50 whitespace-nowrap', PLACEMENT[placement])}>
          <TooltipBubble>
            <span id={id}>{label}</span>
          </TooltipBubble>
        </span>
      )}
    </span>
  );
}
