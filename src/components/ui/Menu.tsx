import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import { cx } from '@/lib/utils';

export interface MenuItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
}

export function Menu({
  items,
  trigger,
  align = 'end',
  width = 200,
  className,
}: {
  items: MenuItem[];
  trigger?: ReactNode;
  align?: 'start' | 'end';
  width?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const isRtl = document.documentElement.dir === 'rtl';
    const anchorEnd = isRtl ? rect.left : rect.right - width;
    const left = align === 'end' ? anchorEnd : isRtl ? rect.right - width : rect.left;
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = Math.min(items.length * 34 + 12, 320);
    const top = spaceBelow < estimatedHeight + 16 ? rect.top - estimatedHeight - 6 : rect.bottom + 6;
    setPos({
      top: Math.max(8, top),
      left: Math.max(8, Math.min(left, window.innerWidth - width - 8)),
    });
  }, [open, align, width, items.length]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      if (anchorRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onScroll = () => setOpen(false);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  return (
    <>
      <div ref={anchorRef} className={cx('inline-flex', className)} onClick={() => setOpen((p) => !p)}>
        {trigger ?? (
          <button
            type="button"
            aria-label="More actions"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[7px] text-ink-500 hover:bg-ink-100 hover:text-ink-800"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      </div>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: pos.top, left: pos.left, width }}
            className="eg-scroll eg-anim-pop fixed z-[70] max-h-80 overflow-y-auto rounded-[10px] border border-ink-200 bg-white p-1 shadow-[var(--shadow-overlay)]"
          >
            {items.map((item) => (
              <div key={item.key}>
                {item.separatorBefore && <div className="my-1 h-px bg-ink-200" />}
                <button
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect?.();
                  }}
                  className={cx(
                    'flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-1.5 text-start text-[13px] transition-colors',
                    item.disabled
                      ? 'cursor-not-allowed text-ink-300'
                      : item.danger
                        ? 'text-danger-700 hover:bg-danger-50'
                        : 'text-ink-700 hover:bg-ink-100 hover:text-ink-900',
                  )}
                >
                  {item.icon && <span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">{item.icon}</span>}
                  <span className="truncate">{item.label}</span>
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

export function Popover({
  open,
  onClose,
  anchorRef,
  children,
  width = 300,
  align = 'end',
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
  width?: number;
  align?: 'start' | 'end';
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const isRtl = document.documentElement.dir === 'rtl';
    const anchorEnd = isRtl ? rect.left : rect.right - width;
    const left = align === 'end' ? anchorEnd : isRtl ? rect.right - width : rect.left;
    setPos({ top: rect.bottom + 8, left: Math.max(8, Math.min(left, window.innerWidth - width - 8)) });
  }, [open, anchorRef, width, align]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node)) return;
      if (anchorRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;
  return createPortal(
    <div
      ref={ref}
      style={{ top: pos.top, left: pos.left, width }}
      className="eg-anim-pop fixed z-[70] rounded-[10px] border border-ink-200 bg-white shadow-[var(--shadow-overlay)]"
    >
      {children}
    </div>,
    document.body,
  );
}
