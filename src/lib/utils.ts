/* =============================================================================
 * Small shared helpers
 * ========================================================================== */

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

/* ---------------------------------------------------------------- ids ---- */

let counter = 0;
export function uid(prefix = 'id'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

/* ---------------------------------------------------------------- math --- */

export function round(n: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

/* --------------------------------------------------------------- arrays -- */

export function groupBy<T, K extends string | number>(arr: T[], key: (item: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of arr) {
    const k = key(item);
    (out[k] ??= []).push(item);
  }
  return out;
}

export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function sortBy<T>(arr: T[], key: (item: T) => string | number, dir: 'asc' | 'desc' = 'asc'): T[] {
  const factor = dir === 'asc' ? 1 : -1;
  return [...arr].sort((a, b) => {
    const av = key(a);
    const bv = key(b);
    if (av === bv) return 0;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor;
    return String(av).localeCompare(String(bv)) * factor;
  });
}

/* ------------------------------------------------------------- format ---- */

export function formatAed(n: number, decimals = 2): string {
  return `${n.toLocaleString('en-AE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatMoney(n: number, currency = 'AED', decimals = 2): string {
  return `${currency} ${formatAed(n, decimals)}`;
}

export function formatNumber(n: number, decimals = 0): string {
  return n.toLocaleString('en-AE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${round(n / 1_000_000, 1)}M`;
  if (Math.abs(n) >= 1_000) return `${round(n / 1_000, 1)}K`;
  return formatNumber(n, 0);
}

export function formatKwh(n: number): string {
  if (n >= 1000) return `${formatNumber(n / 1000, 2)} MWh`;
  return `${formatNumber(n, n < 10 ? 2 : 1)} kWh`;
}

export function formatPower(kw: number): string {
  return `${formatNumber(kw, kw < 10 ? 1 : 0)} kW`;
}

export function formatPct(n: number, decimals = 1): string {
  return `${formatNumber(n, decimals)}%`;
}

export function formatDuration(seconds: number, style: 'short' | 'long' = 'short'): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (style === 'long') {
    if (h > 0) return `${h}h ${m}m ${sec}s`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  }
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
}

/* --------------------------------------------------------------- dates --- */

export function nowIso(): string {
  return new Date().toISOString();
}

export function isoPlus(base: string | Date, ms: number): string {
  const d = typeof base === 'string' ? new Date(base) : base;
  return new Date(d.getTime() + ms).toISOString();
}

export const MINUTE = 60_000;
export const HOUR = 3_600_000;
export const DAY = 86_400_000;

export function formatDate(iso?: string, locale = 'en-AE'): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(iso?: string, locale = 'en-AE'): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDateTime(iso?: string, locale = 'en-AE'): string {
  if (!iso) return '—';
  return `${formatDate(iso, locale)} · ${formatTime(iso, locale)}`;
}

export function formatRelative(iso?: string, locale = 'en'): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const sign = diff > 0 ? -1 : 1;
  if (abs < MINUTE) return rtf.format(sign * Math.round(abs / 1000), 'second');
  if (abs < HOUR) return rtf.format(sign * Math.round(abs / MINUTE), 'minute');
  if (abs < DAY) return rtf.format(sign * Math.round(abs / HOUR), 'hour');
  if (abs < DAY * 30) return rtf.format(sign * Math.round(abs / DAY), 'day');
  return formatDate(iso);
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function daysAgo(n: number): Date {
  return new Date(Date.now() - n * DAY);
}

/* ----------------------------------------------------------------- csv --- */

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns?: { key: keyof T; label: string }[]): string {
  if (rows.length === 0) return '';
  const cols = columns ?? (Object.keys(rows[0]) as (keyof T)[]).map((k) => ({ key: k, label: String(k) }));
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = cols.map((c) => escape(c.label)).join(',');
  const body = rows.map((r) => cols.map((c) => escape(r[c.key])).join(',')).join('\n');
  return `${head}\n${body}`;
}

export function downloadFile(filename: string, content: string, mime = 'text/csv;charset=utf-8;') {
  const blob = new Blob([`﻿${content}`], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* -------------------------------------------------------------- misc ----- */

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function titleCase(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}
