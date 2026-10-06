import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cx } from '@/lib/utils';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastApi {
  push: (title: string, options?: { description?: string; tone?: ToastTone }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICONS: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-success-500" />,
  error: <XCircle className="h-4 w-4 text-danger-500" />,
  info: <Info className="h-4 w-4 text-info-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning-500" />,
};

let nextId = 1;

/**
 * The toast surface itself. Extracted so the Design System can render a toast
 * statically without re-creating its styles — the provider below uses the very
 * same component.
 */
export function ToastCard({
  tone = 'info',
  title,
  description,
  onDismiss,
  animate = true,
  className,
}: {
  tone?: ToastTone;
  title: ReactNode;
  description?: ReactNode;
  onDismiss?: () => void;
  animate?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'pointer-events-auto flex w-full items-start gap-2.5 rounded-[10px] border border-ink-200 bg-white p-3 shadow-[var(--shadow-overlay)]',
        animate && 'eg-anim-pop',
        className,
      )}
    >
      <span className="mt-0.5 shrink-0">{ICONS[tone]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-ink-900">{title}</p>
        {description && <p className="mt-0.5 text-[12px] leading-snug text-ink-500">{description}</p>}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="shrink-0 text-ink-400 hover:text-ink-700">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => setItems((p) => p.filter((t) => t.id !== id)), []);

  const push = useCallback<ToastApi['push']>(
    (title, options) => {
      const id = nextId++;
      setItems((p) => [...p.slice(-3), { id, title, description: options?.description, tone: options?.tone ?? 'info' }]);
      window.setTimeout(() => remove(id), 4200);
    },
    [remove],
  );

  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (title, description) => push(title, { description, tone: 'success' }),
      error: (title, description) => push(title, { description, tone: 'error' }),
      info: (title, description) => push(title, { description, tone: 'info' }),
      warning: (title, description) => push(title, { description, tone: 'warning' }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="pointer-events-none fixed bottom-4 end-4 z-[60] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2">
            {items.map((item) => (
              <ToastCard
                key={item.id}
                tone={item.tone}
                title={item.title}
                description={item.description}
                onDismiss={() => remove(item.id)}
              />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
