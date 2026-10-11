import { cn, formatDate, formatDateTime, formatTonnage } from '@/lib/utils';
import { ReactNode, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  mobileLabel?: string;
  minWidth?: string;
}

interface DataTableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  emptyMessage?: string;
  /** Rows per page. Defaults to 25. */
  pageSize?: number;
}

const PAGE_SIZES = [10, 25, 50, 100];

function pageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  if (current > 3) pages.push('…');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

export function DataTable<T extends object>({
  columns,
  data,
  keyField,
  emptyMessage = 'No records found',
  pageSize: defaultPageSize = 25,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  useEffect(() => { setPage(1); }, [data, pageSize]);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const slice = data.slice(start, start + pageSize);

  if (!data.length) {
    return <p className="py-10 text-center text-steel-500">{emptyMessage}</p>;
  }

  return (
    /* h-full so the parent Card (flex-1) can stretch it to fill remaining viewport */
    <div className="flex h-full min-h-0 flex-col">

      {/* ── Desktop: horizontally + vertically scrollable ── */}
      <div className="hidden flex-1 min-h-0 overflow-auto md:block">
        <table className="min-w-full text-left text-sm">
          {/* Sticky header stays visible while rows scroll */}
          <thead className="sticky top-0 z-10 bg-steel-50 shadow-[0_1px_0_0_#e2e8f0]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wide text-steel-600"
                  style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-steel-100">
            {slice.map((row) => (
              <tr
                key={String(row[keyField])}
                className="hover:bg-steel-50 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-3 align-top text-sm">
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile: scrollable stacked cards ── */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pb-1 md:hidden">
        {slice.map((row) => (
          <div
            key={String(row[keyField])}
            className="rounded-lg border border-steel-200 bg-white p-4 shadow-sm space-y-2"
          >
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between gap-4 text-sm">
                <span className="shrink-0 font-medium text-steel-600">
                  {col.mobileLabel || col.header}
                </span>
                <span className="min-w-0 break-words text-right text-steel-900">
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[col.key] ?? '')}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Pagination — pinned to bottom, never scrolls away ── */}
      <div className="flex-shrink-0 border-t border-steel-100 pt-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Info + page-size selector */}
          <div className="flex items-center gap-3 text-sm text-steel-500">
            <span>
              {start + 1}–{Math.min(start + pageSize, data.length)} of {data.length}
            </span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded border border-steel-200 bg-white px-2 py-1 text-sm text-steel-700 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s} / page</option>
              ))}
            </select>
          </div>

          {/* Page buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <PageBtn onClick={() => setPage(1)} disabled={safePage === 1} title="First">
                <ChevronsLeft className="h-3.5 w-3.5" />
              </PageBtn>
              <PageBtn onClick={() => setPage(safePage - 1)} disabled={safePage === 1} title="Prev">
                <ChevronLeft className="h-3.5 w-3.5" />
              </PageBtn>
              {pageNumbers(safePage, totalPages).map((p, i) =>
                p === '…' ? (
                  <span key={`e${i}`} className="select-none px-1 text-steel-400">…</span>
                ) : (
                  <PageBtn key={p} onClick={() => setPage(p)} active={p === safePage}>
                    {p}
                  </PageBtn>
                ),
              )}
              <PageBtn onClick={() => setPage(safePage + 1)} disabled={safePage === totalPages} title="Next">
                <ChevronRight className="h-3.5 w-3.5" />
              </PageBtn>
              <PageBtn onClick={() => setPage(totalPages)} disabled={safePage === totalPages} title="Last">
                <ChevronsRight className="h-3.5 w-3.5" />
              </PageBtn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PageBtn({
  children, onClick, disabled, active, title,
}: {
  children: ReactNode; onClick: () => void; disabled?: boolean; active?: boolean; title?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-7 min-w-[28px] items-center justify-center rounded px-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-accent text-white'
          : 'text-steel-600 hover:bg-steel-100 disabled:cursor-not-allowed disabled:opacity-40',
      )}
    >
      {children}
    </button>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    REGISTERED: 'bg-slate-100 text-slate-700',
    PICKED_UP: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-700',
    CREATE: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
    PENDING: 'bg-yellow-100 text-yellow-800',
    DISPATCHED: 'bg-green-100 text-green-800',
  };
  return (
    <span className={cn(
      'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
      colors[status] || 'bg-steel-100 text-steel-800',
    )}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export { formatDate, formatDateTime, formatTonnage };
