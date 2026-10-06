import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cx } from '@/lib/utils';
import { Checkbox } from './Field';
import { EmptyState } from './Surface';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T, index: number) => ReactNode;
  sortValue?: (row: T) => string | number;
  align?: 'start' | 'center' | 'end';
  width?: string;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Free-text search performed against this string. */
  searchText?: (row: T) => string;
  search?: string;
  defaultSort?: { key: string; dir: 'asc' | 'desc' };
  pageSize?: number;
  pageSizeOptions?: number[];
  selectable?: boolean;
  selectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  dense?: boolean;
  toolbar?: ReactNode;
  footer?: ReactNode;
  rowClassName?: (row: T) => string | undefined;
  maxHeight?: string;
  hidePaginationWhenSingle?: boolean;
}

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  onRowClick,
  searchText,
  search = '',
  defaultSort,
  pageSize: initialPageSize = 12,
  pageSizeOptions = [10, 12, 25, 50, 100],
  selectable,
  selectedIds,
  onSelectedIdsChange,
  emptyTitle = 'No results found',
  emptyDescription = 'Try adjusting your search or filters.',
  emptyAction,
  dense,
  toolbar,
  footer,
  rowClassName,
  maxHeight,
  hidePaginationWhenSingle,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | undefined>(defaultSort);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !searchText) return rows;
    return rows.filter((r) => searchText(r).toLowerCase().includes(q));
  }, [rows, search, searchText]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return filtered;
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = column.sortValue!(a);
      const bv = column.sortValue!(b);
      if (av === bv) return 0;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor;
      return String(av).localeCompare(String(bv)) * factor;
    });
  }, [filtered, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const pageRows = useMemo(
    () => sorted.slice((page - 1) * pageSize, page * pageSize),
    [sorted, page, pageSize],
  );

  const selection = selectedIds ?? [];
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selection.includes(getRowId(r)));

  function toggleAll() {
    if (!onSelectedIdsChange) return;
    const ids = pageRows.map(getRowId);
    onSelectedIdsChange(allOnPageSelected ? selection.filter((id) => !ids.includes(id)) : Array.from(new Set([...selection, ...ids])));
  }

  function toggleOne(id: string) {
    if (!onSelectedIdsChange) return;
    onSelectedIdsChange(selection.includes(id) ? selection.filter((s) => s !== id) : [...selection, id]);
  }

  function handleSort(column: Column<T>) {
    if (!column.sortValue) return;
    setSort((prev) => {
      if (prev?.key !== column.key) return { key: column.key, dir: 'asc' };
      if (prev.dir === 'asc') return { key: column.key, dir: 'desc' };
      return undefined;
    });
  }

  const cellPad = dense ? 'px-3 py-1.5' : 'px-3.5 py-2.5';
  const showPagination = !(hidePaginationWhenSingle && totalPages <= 1);

  return (
    <div className="overflow-hidden rounded-[10px] border border-ink-200 bg-white">
      {toolbar && <div className="border-b border-ink-200 px-3 py-2.5">{toolbar}</div>}

      {sorted.length === 0 ? (
        <EmptyState icon={<Inbox className="h-5 w-5" />} title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <div className={cx('eg-scroll overflow-x-auto', maxHeight && 'overflow-y-auto')} style={maxHeight ? { maxHeight } : undefined}>
          <table className="w-full border-collapse text-[13px]">
            <thead className="sticky top-0 z-10 bg-ink-50/95 backdrop-blur-sm">
              <tr className="border-b border-ink-200">
                {selectable && (
                  <th className={cx('w-10', cellPad)}>
                    <Checkbox checked={allOnPageSelected} onChange={toggleAll} indeterminate={selection.length > 0} />
                  </th>
                )}
                {columns.map((column) => {
                  const isSorted = sort?.key === column.key;
                  return (
                    <th
                      key={column.key}
                      style={column.width ? { width: column.width } : undefined}
                      className={cx(
                        cellPad,
                        'text-[11.5px] font-semibold uppercase tracking-wide text-ink-500 whitespace-nowrap',
                        column.align === 'end' ? 'text-end' : column.align === 'center' ? 'text-center' : 'text-start',
                        column.headerClassName,
                      )}
                    >
                      {column.sortValue ? (
                        <button
                          type="button"
                          onClick={() => handleSort(column)}
                          className={cx(
                            /* `uppercase` is repeated here because the browser reset
                               clears `text-transform` on <button>, which would leave a
                               sortable header in sentence case beside its siblings. */
                            'inline-flex items-center gap-1 uppercase hover:text-ink-800 transition-colors',
                            isSorted && 'text-brand-800',
                          )}
                        >
                          {column.header}
                          {isSorted ? (
                            sort!.dir === 'asc' ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )
                          ) : (
                            <span className="h-3 w-3" />
                          )}
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => {
                const id = getRowId(row);
                const selected = selection.includes(id);
                return (
                  <tr
                    key={id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cx(
                      'border-b border-ink-100 last:border-0 transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-brand-50/45',
                      selected && 'bg-brand-50/60',
                      rowClassName?.(row),
                    )}
                  >
                    {selectable && (
                      <td className={cellPad} onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected} onChange={() => toggleOne(id)} />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        dir="auto"
                        className={cx(
                          cellPad,
                          'align-middle text-ink-700',
                          column.align === 'end' ? 'text-end' : column.align === 'center' ? 'text-center' : 'text-start',
                          column.className,
                        )}
                      >
                        {column.render(row, (page - 1) * pageSize + i)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {sorted.length > 0 && showPagination && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 px-3.5 py-2.5">
          <div className="flex items-center gap-3 text-[12.5px] text-ink-500">
            <span className="tnum">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-7 rounded-[6px] border border-ink-200 bg-white px-1.5 text-[12px] text-ink-600"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-ink-500 hover:bg-ink-100 disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </button>
            {pageNumbers(page, totalPages).map((n, i) =>
              n === '…' ? (
                <span key={`gap-${i}`} className="px-1 text-[12px] text-ink-400">
                  …
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={cx(
                    'tnum inline-flex h-7 min-w-7 items-center justify-center rounded-[6px] px-1.5 text-[12.5px] transition-colors',
                    n === page ? 'bg-brand-900 text-white' : 'text-ink-600 hover:bg-ink-100',
                  )}
                >
                  {n}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-ink-500 hover:bg-ink-100 disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}
      {footer}
    </div>
  );
}

function pageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push('…');
  for (let i = start; i <= end; i += 1) out.push(i);
  if (end < total - 1) out.push('…');
  out.push(total);
  return out;
}
