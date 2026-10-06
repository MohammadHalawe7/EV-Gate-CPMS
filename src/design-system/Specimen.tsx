import type { ReactNode } from 'react';
import { cx } from '@/lib/utils';

/**
 * Design-System chrome.
 *
 * Everything in this file is scaffolding for the catalogue page — frames,
 * captions and swatches. None of it is an application component and none of it
 * re-implements one: the specimens inside always render the real thing from
 * `src/components/**`.
 */

/* -------------------------------------------------------------------------- */
/* Section                                                                     */
/* -------------------------------------------------------------------------- */

export function Section({
  id,
  title,
  description,
  children,
  className,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cx('scroll-mt-20', className)}>
      <header className="mb-5 border-b border-ink-200 pb-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink-900">{title}</h2>
          <code className="font-mono text-[11px] text-ink-400">#{id}</code>
        </div>
        {description && <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-ink-500">{description}</p>}
      </header>
      {children}
    </section>
  );
}

export function SectionGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-14 last:mb-0">
      <h1 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700">{label}</h1>
      <div className="flex flex-col gap-12">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Specimen frame                                                              */
/* -------------------------------------------------------------------------- */

/**
 * One labelled example. The frame is deliberately plain — a caption above and
 * a light surface beneath — so a Figma capture yields the component itself
 * rather than the documentation wrapper.
 */
export function Specimen({
  label,
  note,
  children,
  span,
  align = 'start',
  surface = 'panel',
  className,
}: {
  label: string;
  note?: string;
  children: ReactNode;
  /** Grid columns to occupy inside a `SpecimenGrid`. */
  span?: 1 | 2 | 3 | 4;
  align?: 'start' | 'center';
  surface?: 'panel' | 'page' | 'none';
  className?: string;
}) {
  const spanClass =
    span === 4 ? 'sm:col-span-2 lg:col-span-4' : span === 3 ? 'sm:col-span-2 lg:col-span-3' : span === 2 ? 'sm:col-span-2' : '';
  return (
    <figure className={cx('min-w-0', spanClass, className)}>
      <figcaption className="mb-2 flex flex-wrap items-baseline gap-x-2">
        <span className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">{label}</span>
        {note && <span className="text-[11.5px] text-ink-400">{note}</span>}
      </figcaption>
      <div
        className={cx(
          'flex flex-wrap gap-3 rounded-[10px] p-4',
          align === 'center' ? 'items-center justify-center' : 'items-start',
          surface === 'panel' && 'border border-ink-200 bg-white',
          surface === 'page' && 'border border-ink-200 bg-ink-50',
        )}
      >
        {children}
      </div>
    </figure>
  );
}

/** Responsive grid used to align specimens into tidy columns for capture. */
export function SpecimenGrid({
  columns = 2,
  children,
  className,
}: {
  columns?: 1 | 2 | 3 | 4;
  children: ReactNode;
  className?: string;
}) {
  const cols =
    columns === 1
      ? 'grid-cols-1'
      : columns === 3
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        : columns === 4
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          : 'grid-cols-1 sm:grid-cols-2';
  return <div className={cx('grid gap-5', cols, className)}>{children}</div>;
}

/** A single item inside a specimen, with its own small caption underneath. */
export function Variant({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cx('flex min-w-0 flex-col items-start gap-1.5', className)}>
      <div className="flex min-h-9 items-center">{children}</div>
      <span className="font-mono text-[10.5px] leading-tight text-ink-400">{label}</span>
    </div>
  );
}

/** Row of variants that wraps neatly. */
export function VariantRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('flex flex-wrap items-start gap-x-5 gap-y-4', className)}>{children}</div>;
}

/* -------------------------------------------------------------------------- */
/* Token display                                                               */
/* -------------------------------------------------------------------------- */

export function Swatch({
  name,
  value,
  token,
  onLight,
}: {
  name: string;
  value: string;
  token: string;
  /** true when the swatch is light enough that sample text must be dark. */
  onLight?: boolean;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[8px] border border-ink-200 bg-white">
      <div
        className="flex h-14 items-end justify-end p-1.5"
        style={{ background: value }}
      >
        <span className={cx('font-mono text-[10px]', onLight ? 'text-ink-600' : 'text-white/80')}>{name}</span>
      </div>
      <div className="px-2 py-1.5">
        <p className="truncate font-mono text-[10.5px] uppercase text-ink-700">{value}</p>
        <p className="truncate font-mono text-[10px] text-ink-400">{token}</p>
      </div>
    </div>
  );
}

export function SwatchRamp({
  title,
  prefix,
  ramp,
  lightUpTo = 300,
}: {
  title: string;
  prefix: string;
  ramp: Record<string, string>;
  /** Steps at or below this number get dark sample text. */
  lightUpTo?: number;
}) {
  return (
    <div>
      <h3 className="mb-2 text-[13px] font-semibold text-ink-800">{title}</h3>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-11">
        {Object.entries(ramp).map(([step, value]) => (
          <Swatch
            key={step}
            name={step}
            value={value}
            token={`${prefix}-${step}`}
            onLight={Number(step) <= lightUpTo}
          />
        ))}
      </div>
    </div>
  );
}

/** Small monospace token reference, used under specimens. */
export function TokenList({ rows }: { rows: { token: string; value: string; role?: string }[] }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-ink-200 bg-white">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-b border-ink-200 bg-ink-50/80">
            <th className="px-3.5 py-2 text-start text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">Token</th>
            <th className="px-3.5 py-2 text-start text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">Value</th>
            <th className="px-3.5 py-2 text-start text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">Used for</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.token} className="border-b border-ink-100 last:border-0">
              <td className="px-3.5 py-2 font-mono text-[11.5px] text-brand-800">{row.token}</td>
              <td className="px-3.5 py-2 font-mono text-[11.5px] text-ink-700">{row.value}</td>
              <td className="px-3.5 py-2 text-ink-600">{row.role ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Bordered frame for composed chrome (sidebar, topbar) shown out of context. */
export function Frame({
  label,
  children,
  height,
  className,
}: {
  label: string;
  children: ReactNode;
  height?: number;
  className?: string;
}) {
  return (
    <figure className={cx('min-w-0', className)}>
      <figcaption className="mb-2 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">{label}</figcaption>
      <div
        className="overflow-hidden rounded-[10px] border border-ink-200 bg-white"
        style={height ? { height } : undefined}
      >
        {children}
      </div>
    </figure>
  );
}
