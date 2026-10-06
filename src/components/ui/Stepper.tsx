import type { ReactNode } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { cx } from '@/lib/utils';

export type StepStatus = 'complete' | 'current' | 'upcoming' | 'error';

export interface StepItem {
  key: string;
  label: string;
  description?: string;
  /** Overrides the status derived from `current`. */
  status?: StepStatus;
  optional?: boolean;
}

function statusOf(item: StepItem, index: number, current: number): StepStatus {
  if (item.status) return item.status;
  if (index < current) return 'complete';
  if (index === current) return 'current';
  return 'upcoming';
}

const NODE: Record<StepStatus, string> = {
  complete: 'border-brand-800 bg-brand-800 text-white',
  current: 'border-brand-800 bg-white text-brand-900',
  upcoming: 'border-ink-300 bg-white text-ink-400',
  error: 'border-danger-500 bg-danger-50 text-danger-700',
};

const LABEL: Record<StepStatus, string> = {
  complete: 'text-ink-700',
  current: 'text-ink-900',
  upcoming: 'text-ink-400',
  error: 'text-danger-700',
};

/**
 * Progress through a long, sectioned task — a multi-step form, an onboarding
 * wizard, a guided import.
 *
 * Horizontal on `sm` and up, vertical below, so a five-step flow stays legible
 * on a phone. `onSelect` makes completed steps navigable; leave it out for a
 * strictly linear flow. The connector is drawn with a logical `border-s`/
 * `border-t` so it mirrors in RTL without a second rule.
 */
export function Stepper({
  steps,
  current,
  onSelect,
  className,
  orientation = 'responsive',
}: {
  steps: StepItem[];
  current: number;
  onSelect?: (index: number) => void;
  className?: string;
  orientation?: 'responsive' | 'horizontal' | 'vertical';
}) {
  const horizontal = orientation === 'horizontal';
  const vertical = orientation === 'vertical';

  return (
    <ol
      className={cx(
        'flex',
        horizontal && 'flex-row items-start gap-1',
        vertical && 'flex-col gap-0',
        orientation === 'responsive' && 'flex-col gap-0 sm:flex-row sm:items-start sm:gap-1',
        className,
      )}
    >
      {steps.map((item, index) => {
        const status = statusOf(item, index, current);
        const last = index === steps.length - 1;
        const interactive = Boolean(onSelect) && status !== 'upcoming';
        const Node = interactive ? 'button' : 'div';

        return (
          <li
            key={item.key}
            aria-current={status === 'current' ? 'step' : undefined}
            className={cx(
              'relative min-w-0',
              horizontal && 'flex-1',
              orientation === 'responsive' && 'sm:flex-1',
            )}
          >
            <Node
              {...(interactive ? { type: 'button' as const, onClick: () => onSelect?.(index) } : {})}
              className={cx(
                'flex w-full items-start gap-2.5 rounded-[7px] p-1.5 text-start',
                vertical || orientation === 'responsive' ? '' : '',
                interactive && 'transition-colors hover:bg-ink-50',
              )}
            >
              <span
                className={cx(
                  'mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11.5px] font-semibold tnum',
                  NODE[status],
                )}
              >
                {status === 'complete' ? (
                  <Check className="h-3.5 w-3.5" />
                ) : status === 'error' ? (
                  <AlertCircle className="h-3.5 w-3.5" />
                ) : (
                  index + 1
                )}
              </span>
              <span className="min-w-0 flex-1 pb-1">
                <span
                  dir="auto"
                  className={cx(
                    'block truncate text-[12.5px] font-medium leading-5',
                    LABEL[status],
                  )}
                >
                  {item.label}
                  {item.optional && <span className="ms-1.5 text-[11px] font-normal text-ink-400">·</span>}
                </span>
                {item.description && (
                  <span dir="auto" className="mt-0.5 block truncate text-[11.5px] text-ink-400">
                    {item.description}
                  </span>
                )}
              </span>
            </Node>

            {!last && (
              <span
                aria-hidden
                className={cx(
                  'absolute bg-ink-200',
                  horizontal && 'end-0 top-[15px] hidden',
                  vertical
                    ? 'start-[15px] top-8 h-[calc(100%-2rem)] w-px'
                    : 'start-[15px] top-8 h-[calc(100%-2rem)] w-px sm:start-auto sm:top-[15px] sm:h-px sm:w-full',
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The footer of a stepped flow: back on the start side, the committing action
 * on the end side (which is the end-most position in both directions), and an
 * optional secondary action — "Save draft" — beside it.
 */
export function StepperFooter({
  start,
  end,
  className,
}: {
  start?: ReactNode;
  end?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'flex flex-wrap items-center justify-between gap-2 border-t border-ink-200 pt-4',
        className,
      )}
    >
      <div className="flex items-center gap-2">{start}</div>
      <div className="flex items-center gap-2">{end}</div>
    </div>
  );
}
