import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { cx } from '@/lib/utils';
import { Button, IconButton } from './Button';

function useLockBody(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
}

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);
}

const WIDTHS = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
} as const;

/**
 * The dialog surface on its own — header, scrollable body, footer.
 * Extracted so the Design System can present a dialog inline (outside a
 * portal) without re-creating any of its styling.
 */
export function DialogSurface({
  title,
  description,
  children,
  footer,
  onClose,
  hideClose,
  bodyClassName,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  hideClose?: boolean;
  bodyClassName?: string;
  className?: string;
}) {
  return (
    <div className={cx('w-full rounded-[12px] bg-white', className)}>
      <header className="flex items-start justify-between gap-4 border-b border-ink-200 px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-ink-900">{title}</h2>
          {description && <p className="mt-0.5 text-[12.5px] text-ink-500">{description}</p>}
        </div>
        {!hideClose && (
          <IconButton label="Close" size="sm" onClick={onClose} className="-me-1.5 -mt-0.5">
            <X className="h-4 w-4" />
          </IconButton>
        )}
      </header>
      <div className={cx('eg-scroll overflow-y-auto px-5 py-4', bodyClassName ?? 'max-h-[70vh]')}>{children}</div>
      {footer && (
        <footer className="flex items-center justify-end gap-2 rounded-b-[12px] border-t border-ink-200 bg-ink-50/60 px-5 py-3">
          {footer}
        </footer>
      )}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  hideClose,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof WIDTHS;
  hideClose?: boolean;
}) {
  useLockBody(open);
  useEscape(open, onClose);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div className="fixed inset-0 bg-ink-900/35 backdrop-blur-[1px] eg-anim-fade" onClick={onClose} aria-hidden />
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" className={cx('relative z-10 my-auto w-full', WIDTHS[size])}>
        <DialogSurface
          title={title}
          description={description}
          footer={footer}
          onClose={onClose}
          hideClose={hideClose}
          className="shadow-[var(--shadow-overlay)] outline-none eg-anim-pop"
        >
          {children}
        </DialogSurface>
      </div>
    </div>,
    document.body,
  );
}

const DRAWER_WIDTHS = {
  sm: 'w-full sm:w-[420px]',
  md: 'w-full sm:w-[560px]',
  lg: 'w-full sm:w-[720px]',
  xl: 'w-full sm:w-[920px]',
} as const;

/**
 * The drawer surface on its own — same extraction rationale as
 * `DialogSurface`. Note the slightly taller header padding (py-4) that
 * distinguishes a drawer from a modal.
 */
export function DrawerSurface({
  title,
  description,
  children,
  footer,
  onClose,
  hideClose,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  hideClose?: boolean;
  className?: string;
}) {
  return (
    <div className={cx('flex h-full flex-col bg-white', className)}>
      <header className="flex items-start justify-between gap-4 border-b border-ink-200 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-ink-900">{title}</h2>
          {description && <p className="mt-0.5 text-[12.5px] text-ink-500">{description}</p>}
        </div>
        {!hideClose && (
          <IconButton label="Close" size="sm" onClick={onClose} className="-me-1.5">
            <X className="h-4 w-4" />
          </IconButton>
        )}
      </header>
      <div className="eg-scroll flex-1 overflow-y-auto px-5 py-4">{children}</div>
      {footer && <footer className="flex items-center justify-end gap-2 border-t border-ink-200 bg-ink-50/60 px-5 py-3">{footer}</footer>}
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: keyof typeof DRAWER_WIDTHS;
}) {
  useLockBody(open);
  useEscape(open, onClose);
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-ink-900/35 backdrop-blur-[1px] eg-anim-fade" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        className={cx('relative z-10 h-full shadow-[var(--shadow-overlay)] eg-anim-drawer', DRAWER_WIDTHS[width])}
      >
        <DrawerSurface title={title} description={description} footer={footer} onClose={onClose}>
          {children}
        </DrawerSurface>
      </aside>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary' | 'accent';
  children?: ReactNode;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={
        <span className="flex items-center gap-2">
          {tone === 'danger' && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-danger-50 text-danger-500">
              <AlertTriangle className="h-4 w-4" />
            </span>
          )}
          {title}
        </span>
      }
      footer={
        <>
          <Button onClick={onClose}>{cancelLabel}</Button>
          <Button
            variant={tone === 'danger' ? 'danger' : tone === 'accent' ? 'accent' : 'primary'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message && <p className="text-[13px] leading-relaxed text-ink-600">{message}</p>}
      {children}
    </Modal>
  );
}
