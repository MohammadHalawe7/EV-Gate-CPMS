import { useMemo, useRef, useState, type ReactNode } from 'react';
import { cx, formatCompact, formatNumber } from '@/lib/utils';
import { AXIS_COLOR, SEQUENTIAL, SERIES, STATUS_COLORS, TEXT_MUTED, seriesColor } from './palette';

/* ========================================================================== */
/* Shared bits                                                                 */
/* ========================================================================== */

export function Legend({
  items,
  className,
}: {
  items: { label: string; color: string; value?: ReactNode }[];
  className?: string;
}) {
  return (
    <ul className={cx('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-[12px] text-ink-600">
          <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: item.color }} />
          <span>{item.label}</span>
          {item.value !== undefined && <span className="tnum font-medium text-ink-800">{item.value}</span>}
        </li>
      ))}
    </ul>
  );
}

function Tooltip({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <div
      className="pointer-events-none absolute z-20 min-w-[120px] -translate-x-1/2 -translate-y-full rounded-[8px] border border-ink-200 bg-white px-2.5 py-1.5 text-[12px] shadow-[var(--shadow-overlay)]"
      style={{ left: x, top: y - 8 }}
    >
      {children}
    </div>
  );
}

function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = 10 ** exp;
  const n = value / base;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * base;
}

/* ========================================================================== */
/* Line / area chart                                                           */
/* ========================================================================== */

export interface SeriesDef {
  key: string;
  label: string;
  values: number[];
  color?: string;
  area?: boolean;
  format?: (v: number) => string;
}

export function LineAreaChart({
  labels,
  series,
  height = 220,
  yTicks = 4,
  className,
  showLegend = true,
  xTickEvery,
  unitLabel,
}: {
  labels: string[];
  series: SeriesDef[];
  height?: number;
  yTicks?: number;
  className?: string;
  showLegend?: boolean;
  xTickEvery?: number;
  unitLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const padL = 42;
  const padR = 10;
  const padT = 10;
  const padB = 22;
  const W = 640;
  const H = height;

  const max = useMemo(() => niceCeil(Math.max(1, ...series.flatMap((s) => s.values))), [series]);
  const n = labels.length;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const stepX = n > 1 ? innerW / (n - 1) : 0;
  const px = (i: number) => padL + i * stepX;
  const py = (v: number) => padT + innerH - (v / max) * innerH;

  const tickEvery = xTickEvery ?? Math.max(1, Math.ceil(n / 7));

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const isRtl = document.documentElement.dir === 'rtl';
    const relX = isRtl ? rect.right - e.clientX : e.clientX - rect.left;
    const ratio = relX / rect.width;
    const svgX = ratio * W;
    const idx = Math.round((svgX - padL) / (stepX || 1));
    setHover(Math.max(0, Math.min(n - 1, idx)));
  }

  const hoverX = hover !== null ? (px(hover) / W) * 100 : 0;

  return (
    <div className={cx('w-full', className)}>
      <div ref={wrapRef} className="relative" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {unitLabel && (
          <span className="absolute start-0 -top-1 text-[10.5px] text-ink-400">{unitLabel}</span>
        )}
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none" role="img">
          {/* grid */}
          {Array.from({ length: yTicks + 1 }, (_, i) => {
            const v = (max / yTicks) * i;
            return (
              <g key={i}>
                <line x1={padL} x2={W - padR} y1={py(v)} y2={py(v)} stroke={AXIS_COLOR} strokeWidth={1} />
                <text
                  x={padL - 8}
                  y={py(v) + 3.5}
                  textAnchor="end"
                  fontSize={10}
                  fill={TEXT_MUTED}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatCompact(v)}
                </text>
              </g>
            );
          })}

          {/* x labels */}
          {labels.map((label, i) =>
            i % tickEvery === 0 || i === n - 1 ? (
              <text key={i} x={px(i)} y={H - 6} textAnchor="middle" fontSize={10} fill={TEXT_MUTED}>
                {label}
              </text>
            ) : null,
          )}

          {/* series */}
          {series.map((s, si) => {
            const color = s.color ?? seriesColor(si);
            const points = s.values.map((v, i) => `${px(i)},${py(v)}`).join(' ');
            const areaPath = `M ${px(0)},${py(0)} L ${s.values.map((v, i) => `${px(i)},${py(v)}`).join(' L ')} L ${px(n - 1)},${py(0)} Z`;
            return (
              <g key={s.key}>
                {s.area !== false && (
                  <>
                    <defs>
                      <linearGradient id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <path d={areaPath} fill={`url(#grad-${s.key})`} />
                  </>
                )}
                <polyline
                  points={points}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}

          {/* crosshair */}
          {hover !== null && (
            <g>
              <line x1={px(hover)} x2={px(hover)} y1={padT} y2={padT + innerH} stroke="#A0A7BB" strokeWidth={1} strokeDasharray="3 3" />
              {series.map((s, si) => (
                <circle
                  key={s.key}
                  cx={px(hover)}
                  cy={py(s.values[hover] ?? 0)}
                  r={4.5}
                  fill={s.color ?? seriesColor(si)}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </g>
          )}
        </svg>

        {hover !== null && (
          <Tooltip x={(hoverX / 100) * (wrapRef.current?.clientWidth ?? 0)} y={height * 0.42}>
            <p className="mb-1 font-medium text-ink-900">{labels[hover]}</p>
            {series.map((s, si) => (
              <p key={s.key} className="flex items-center justify-between gap-3 text-ink-600">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-[2px]" style={{ background: s.color ?? seriesColor(si) }} />
                  {s.label}
                </span>
                <span className="tnum font-medium text-ink-900">
                  {s.format ? s.format(s.values[hover] ?? 0) : formatNumber(s.values[hover] ?? 0, 1)}
                </span>
              </p>
            ))}
          </Tooltip>
        )}
      </div>
      {showLegend && series.length > 1 && (
        <Legend className="mt-2 ps-10" items={series.map((s, si) => ({ label: s.label, color: s.color ?? seriesColor(si) }))} />
      )}
    </div>
  );
}

/* ========================================================================== */
/* Bar chart                                                                   */
/* ========================================================================== */

export function BarChart({
  labels,
  values,
  color,
  height = 180,
  format,
  className,
  highlightIndex,
}: {
  labels: string[];
  values: number[];
  color?: string;
  height?: number;
  format?: (v: number) => string;
  className?: string;
  highlightIndex?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const max = niceCeil(Math.max(1, ...values));
  const barColor = color ?? SERIES[0];

  return (
    <div className={cx('w-full', className)} ref={wrapRef}>
      <div className="relative flex items-end gap-[3px]" style={{ height }}>
        {values.map((v, i) => {
          const h = Math.max(2, (v / max) * (height - 18));
          const isHot = hover === i || highlightIndex === i;
          return (
            <div
              key={i}
              className="group relative flex flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ height }}
            >
              <div
                className="w-full rounded-t-[4px] transition-opacity"
                style={{
                  height: h,
                  background: barColor,
                  opacity: hover === null ? (highlightIndex === undefined || isHot ? 1 : 0.45) : isHot ? 1 : 0.4,
                }}
              />
              <span className="mt-1.5 truncate text-[10px] text-ink-500">{labels[i]}</span>
            </div>
          );
        })}
        {hover !== null && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-[8px] border border-ink-200 bg-white px-2.5 py-1.5 text-[12px] shadow-[var(--shadow-overlay)]"
            style={{ left: `${((hover + 0.5) / values.length) * 100}%`, top: height - 20 }}
          >
            <span className="text-ink-500">{labels[hover]} · </span>
            <span className="tnum font-medium text-ink-900">
              {format ? format(values[hover]) : formatNumber(values[hover], 0)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ========================================================================== */
/* Horizontal bar list                                                         */
/* ========================================================================== */

export function BarList({
  items,
  format,
  className,
  colorFor,
}: {
  items: { label: string; value: number; sub?: string; href?: string }[];
  format?: (v: number) => string;
  className?: string;
  colorFor?: (index: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className={cx('flex flex-col gap-2.5', className)}>
      {items.map((item, i) => (
        <li key={item.label} className="group">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate text-[12.5px] text-ink-700">{item.label}</span>
            <span className="tnum shrink-0 text-[12.5px] font-medium text-ink-900">
              {format ? format(item.value) : formatNumber(item.value, 0)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${(item.value / max) * 100}%`, background: colorFor?.(i) ?? SERIES[0] }}
            />
          </div>
          {item.sub && <p className="mt-0.5 text-[11.5px] text-ink-400">{item.sub}</p>}
        </li>
      ))}
    </ul>
  );
}

/* ========================================================================== */
/* Donut                                                                       */
/* ========================================================================== */

export function DonutChart({
  data,
  size = 168,
  thickness = 18,
  centerLabel,
  centerValue,
  className,
  useStatusColors,
}: {
  data: { label: string; value: number; color?: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: ReactNode;
  className?: string;
  useStatusColors?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  // 2px surface gap between segments
  const gap = 2;

  let offset = 0;
  const segments = data.map((d, i) => {
    const fraction = d.value / total;
    const length = Math.max(0, fraction * circumference - gap);
    const seg = {
      ...d,
      color: d.color ?? (useStatusColors ? (STATUS_COLORS[d.label] ?? seriesColor(i)) : seriesColor(i)),
      dash: `${length} ${circumference - length}`,
      offset: -offset,
      fraction,
    };
    offset += fraction * circumference;
    return seg;
  });

  return (
    <div className={cx('flex items-center gap-5', className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={c} cy={c} r={r} fill="none" stroke="#F1F3F7" strokeWidth={thickness} />
          {segments.map((s, i) => (
            <circle
              key={s.label}
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={hover === i ? thickness + 3 : thickness}
              strokeDasharray={s.dash}
              strokeDashoffset={s.offset}
              strokeLinecap="butt"
              className="transition-[stroke-width] duration-150"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tnum text-[20px] font-semibold text-ink-900">
            {hover !== null ? `${Math.round(segments[hover].fraction * 100)}%` : centerValue}
          </span>
          <span className="mt-0.5 max-w-[80%] truncate text-[11px] text-ink-500">
            {hover !== null ? segments[hover].label : centerLabel}
          </span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {segments.map((s, i) => (
          <li
            key={s.label}
            className={cx(
              'flex items-center justify-between gap-3 rounded-[6px] px-1.5 py-0.5 text-[12.5px] transition-colors',
              hover === i && 'bg-ink-50',
            )}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="flex min-w-0 items-center gap-2 text-ink-600">
              <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: s.color }} />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="tnum shrink-0 font-medium text-ink-900">{formatNumber(s.value, 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ========================================================================== */
/* Sparkline                                                                   */
/* ========================================================================== */

export function Sparkline({
  values,
  color,
  width = 96,
  height = 28,
  className,
  area = true,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
  area?: boolean;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const stroke = color ?? SERIES[0];
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - 2 - ((v - min) / range) * (height - 4);
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      {area && <polygon points={`0,${height} ${pts.join(' ')} ${width},${height}`} fill={stroke} opacity={0.1} />}
      <polyline points={pts.join(' ')} fill="none" stroke={stroke} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ========================================================================== */
/* Hour × weekday heatmap (sequential, single hue)                             */
/* ========================================================================== */

export function HeatmapGrid({
  rows,
  columns,
  values,
  format,
  className,
}: {
  rows: string[];
  columns: string[];
  /** values[rowIndex][columnIndex] */
  values: number[][];
  format?: (v: number) => string;
  className?: string;
}) {
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const max = Math.max(1, ...values.flat());
  return (
    <div className={cx('w-full', className)}>
      <div className="relative overflow-x-auto eg-scroll">
        <table className="w-full border-separate" style={{ borderSpacing: 2 }}>
          <thead>
            <tr>
              <th className="w-9" />
              {columns.map((col, ci) => (
                <th key={col} className="pb-1 text-[9.5px] font-normal text-ink-400">
                  {ci % 2 === 0 ? col : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row}>
                <td className="pe-1.5 text-end text-[10px] text-ink-500 whitespace-nowrap">{row}</td>
                {columns.map((col, ci) => {
                  const v = values[ri]?.[ci] ?? 0;
                  const t = v / max;
                  const idx = Math.round(t * (SEQUENTIAL.length - 1));
                  return (
                    <td
                      key={col}
                      onMouseEnter={() => setHover({ r: ri, c: ci })}
                      onMouseLeave={() => setHover(null)}
                      className="h-5 cursor-default rounded-[3px] transition-transform"
                      style={{
                        background: v === 0 ? '#F5F6F9' : SEQUENTIAL[idx],
                        outline: hover?.r === ri && hover?.c === ci ? '2px solid #191E2E' : undefined,
                      }}
                      title={`${row} ${col} · ${format ? format(v) : formatNumber(v, 0)}`}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5 text-[10.5px] text-ink-500">
        <span>Low</span>
        {SEQUENTIAL.map((c) => (
          <span key={c} className="h-2.5 w-4 rounded-[2px]" style={{ background: c }} />
        ))}
        <span>High</span>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* Gauge                                                                       */
/* ========================================================================== */

export function Gauge({
  value,
  max = 100,
  label,
  size = 132,
  color = SERIES[0],
  format,
}: {
  value: number;
  max?: number;
  label?: string;
  size?: number;
  color?: string;
  format?: (v: number) => string;
}) {
  const r = size / 2 - 10;
  const c = size / 2;
  const circumference = Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`}>
        <path
          d={`M ${c - r} ${c} A ${r} ${r} 0 0 1 ${c + r} ${c}`}
          fill="none"
          stroke="#F1F3F7"
          strokeWidth={10}
          strokeLinecap="round"
        />
        <path
          d={`M ${c - r} ${c} A ${r} ${r} 0 0 1 ${c + r} ${c}`}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${pct * circumference} ${circumference}`}
        />
        <text x={c} y={c - 6} textAnchor="middle" fontSize={20} fontWeight={600} fill="#191E2E" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {format ? format(value) : formatNumber(value, 0)}
        </text>
      </svg>
      {label && <span className="-mt-1 text-[11.5px] text-ink-500">{label}</span>}
    </div>
  );
}
