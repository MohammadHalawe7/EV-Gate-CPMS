/* =============================================================================
 * Chart palette — EV Gate
 *
 * Categorical slots are assigned in fixed order and never cycled. The order was
 * validated (adjacent *and* all-pairs) for CVD separation, chroma and lightness
 * on the light chart surface; `#DC8710` and `#1BAF7A` sit just under 3:1 contrast
 * so every chart that uses them ships a legend and visible values.
 * ========================================================================== */

export const SERIES = [
  '#6B3FA0', // 1 · brand violet
  '#DC8710', // 2 · saffron deep
  '#1BAF7A', // 3 · aqua
  '#2A78D6', // 4 · blue
  '#C02A6E', // 5 · plum
  '#008300', // 6 · green
] as const;

export function seriesColor(index: number): string {
  return SERIES[index] ?? '#737C94';
}

/** Single-hue sequential ramp (light → dark) for magnitude encoding. */
export const SEQUENTIAL = [
  '#F3EEF9',
  '#E2D6F0',
  '#CBB6E4',
  '#B094D6',
  '#9271C4',
  '#7852AE',
  '#6B3FA0',
] as const;

export function sequentialColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const idx = Math.round(clamped * (SEQUENTIAL.length - 1));
  return SEQUENTIAL[idx];
}

/** Reserved operational status colours — never reused as a categorical slot. */
export const STATUS_COLORS: Record<string, string> = {
  Available: '#12A150',
  Preparing: '#0EA5E9',
  Charging: '#2563EB',
  SuspendedEV: '#F59E0B',
  SuspendedEVSE: '#D97706',
  Finishing: '#6366F1',
  Reserved: '#F2A626',
  Unavailable: '#94A3B8',
  Faulted: '#DC2626',
  Online: '#12A150',
  Offline: '#94A3B8',
  Maintenance: '#F59E0B',
  Provisioning: '#0EA5E9',
};

export const AXIS_COLOR = '#E5E8EF';
export const TEXT_MUTED = '#737C94';
export const TEXT_PRIMARY = '#191E2E';
export const SURFACE = '#FFFFFF';
