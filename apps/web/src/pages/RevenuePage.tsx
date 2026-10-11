import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  IndianRupee,
  Truck,
  Package,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import api from '@/lib/api';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatTonnage } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ProductBreakdown {
  productId: string;
  productName: string;
  grade: string;
  unit: string;
  tonnage: number;
  revenue: number;
}

interface DayEntry {
  date: string;
  vehicles: number;
  tonnage: number;
  revenue: number;
  breakdown: ProductBreakdown[];
}

interface RevenueResponse {
  days: DayEntry[];
  totalRevenue: number;
  totalTonnage: number;
  totalVehicles: number;
  from: string;
  to: string;
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function localDate(d = new Date()) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function today() {
  return localDate();
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDate(d);
}

// Simple sparkline-like bar
function RevenueBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-steel-100">
      <div
        className="h-2 rounded-full bg-accent transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function RevenuePage() {
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(today());
  const [appliedFrom, setAppliedFrom] = useState(daysAgo(29));
  const [appliedTo, setAppliedTo] = useState(today());
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [dayPage, setDayPage] = useState(1);
  const DAY_PAGE_SIZE = 15;

  const { data, isLoading } = useQuery<RevenueResponse>({
    queryKey: ['revenue-daily', appliedFrom, appliedTo],
    queryFn: () =>
      api
        .get('/vehicles/revenue/daily', { params: { from: appliedFrom, to: appliedTo } })
        .then((r) => r.data),
  });

  const maxDayRevenue = Math.max(...(data?.days.map((d) => d.revenue) ?? [0]), 1);

  // Reset day page when data changes
  const days = data?.days ?? [];
  const totalDayPages = Math.max(1, Math.ceil(days.length / DAY_PAGE_SIZE));
  const pagedDays = days.slice((dayPage - 1) * DAY_PAGE_SIZE, dayPage * DAY_PAGE_SIZE);

  const quickRanges = [
    { label: 'Today', from: today(), to: today() },
    { label: 'Last 7 days', from: daysAgo(6), to: today() },
    { label: 'Last 30 days', from: daysAgo(29), to: today() },
    { label: 'This month', from: localDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), to: today() },
  ];

  function applyRange(f: string, t: string) {
    setFrom(f);
    setTo(t);
    setAppliedFrom(f);
    setAppliedTo(t);
  }

  return (
    <AppLayout title="Revenue Realization">
      <div className="flex h-full flex-col gap-4">

      {/* ── Fixed: filter bar ── */}
      <Card className="flex-shrink-0">
        <div className="flex flex-wrap items-end gap-3">
          {/* Quick ranges */}
          <div className="flex flex-wrap gap-2">
            {quickRanges.map((r) => (
              <button
                key={r.label}
                onClick={() => applyRange(r.from, r.to)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  appliedFrom === r.from && appliedTo === r.to
                    ? 'border-accent bg-accent text-white'
                    : 'border-steel-200 bg-white text-steel-700 hover:bg-steel-50',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          {/* Custom range */}
          <div className="ml-auto flex items-end gap-2">
            <div>
              <label className="mb-1 block text-xs text-steel-500">From</label>
              <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="w-36 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-steel-500">To</label>
              <Input type="date" value={to} min={from} max={today()} onChange={(e) => setTo(e.target.value)} className="w-36 text-sm" />
            </div>
            <Button size="sm" onClick={() => { setAppliedFrom(from); setAppliedTo(to); }}>Apply</Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : (
        <>
          {/* ── Fixed: summary cards ── */}
          <div className="flex-shrink-0 grid gap-4 sm:grid-cols-3">
            <Card className="border-green-200 bg-green-50">
              <div className="flex items-center gap-2 text-green-700">
                <IndianRupee className="h-5 w-5" />
                <span className="text-sm font-medium">Total Revenue</span>
              </div>
              <p className="mt-2 text-3xl font-bold text-green-800">
                {formatCurrency(data?.totalRevenue ?? 0)}
              </p>
              <p className="mt-1 text-xs text-green-600">
                {fmtDate(appliedFrom)} – {fmtDate(appliedTo)}
              </p>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-steel-600">
                <Truck className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium">Vehicles Dispatched</span>
              </div>
              <p className="mt-2 text-3xl font-bold text-steel-900">{data?.totalVehicles ?? 0}</p>
              <p className="mt-1 text-xs text-steel-500">picked up in period</p>
            </Card>
            <Card>
              <div className="flex items-center gap-2 text-steel-600">
                <Package className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium">Total Dispatched</span>
              </div>
              <p className="mt-2 text-3xl font-bold text-steel-900">
                {formatTonnage(data?.totalTonnage ?? 0)}
              </p>
              {data && data.totalTonnage > 0 && data.totalRevenue > 0 && (
                <p className="mt-1 text-xs text-steel-500">
                  avg {formatCurrency(data.totalRevenue / data.totalTonnage)}/MT
                </p>
              )}
            </Card>
          </div>

          {/* ── Scrollable: daily breakdown fills the rest ── */}
          {!data?.days.length ? (
            <Card className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center gap-3 py-8 text-steel-500">
                <TrendingUp className="h-10 w-10 text-steel-300" />
                <p>No dispatches in this period</p>
                <p className="text-sm">Revenue is recorded when a vehicle is marked as picked up.</p>
              </div>
            </Card>
          ) : (
            <Card className="flex flex-1 flex-col min-h-0">
              <div className="mb-3 flex flex-shrink-0 items-center gap-2">
                <Calendar className="h-4 w-4 text-steel-500" />
                <h2 className="text-sm font-semibold text-steel-700">
                  Daily Breakdown ({data.days.length} day{data.days.length !== 1 ? 's' : ''} with activity)
                </h2>
              </div>

              {/* Desktop column headers */}
              <div className="hidden flex-shrink-0 grid-cols-[160px_80px_120px_1fr_120px] gap-4 border-b border-steel-200 pb-2 text-xs font-semibold uppercase tracking-wide text-steel-500 md:grid">
                <span>Date</span>
                <span className="text-right">Vehicles</span>
                <span className="text-right">Tonnage</span>
                <span>Bar</span>
                <span className="text-right">Revenue</span>
              </div>

              {/* Scrollable rows */}
              <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-steel-100">
                {pagedDays.map((day) => {
                  const isOpen = expandedDay === day.date;
                  return (
                    <div key={day.date}>
                      <button className="w-full text-left" onClick={() => setExpandedDay(isOpen ? null : day.date)}>
                        {/* Desktop row */}
                        <div className="hidden grid-cols-[160px_80px_120px_1fr_120px] items-center gap-4 px-0 py-3 hover:bg-steel-50 md:grid">
                          <div className="flex items-center gap-2">
                            {isOpen ? <ChevronDown className="h-4 w-4 text-steel-400" /> : <ChevronRight className="h-4 w-4 text-steel-400" />}
                            <span className="text-sm font-medium text-steel-900">{fmtDate(day.date)}</span>
                          </div>
                          <span className="text-right text-sm text-steel-700">{day.vehicles}</span>
                          <span className="text-right text-sm text-steel-700">{formatTonnage(day.tonnage)}</span>
                          <RevenueBar value={day.revenue} max={maxDayRevenue} />
                          <span className="text-right text-sm font-bold text-steel-900">
                            {day.revenue > 0 ? formatCurrency(day.revenue) : '—'}
                          </span>
                        </div>
                        {/* Mobile row */}
                        <div className="flex items-center justify-between py-3 hover:bg-steel-50 md:hidden">
                          <div className="flex items-center gap-2">
                            {isOpen ? <ChevronDown className="h-4 w-4 text-steel-400" /> : <ChevronRight className="h-4 w-4 text-steel-400" />}
                            <div>
                              <p className="text-sm font-medium text-steel-900">{fmtDate(day.date)}</p>
                              <p className="text-xs text-steel-500">{day.vehicles} vehicle{day.vehicles !== 1 ? 's' : ''} · {formatTonnage(day.tonnage)}</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-steel-900">{day.revenue > 0 ? formatCurrency(day.revenue) : '—'}</span>
                        </div>
                      </button>

                      {/* Expanded breakdown */}
                      {isOpen && day.breakdown.length > 0 && (
                        <div className="border-t border-steel-100 bg-steel-50 px-4 py-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-steel-500">Product Breakdown</p>
                          <div className="space-y-2">
                            {day.breakdown.map((b) => (
                              <div key={b.productId}
                                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-lg bg-white px-3 py-2 text-sm shadow-sm sm:grid-cols-[1fr_120px_140px]">
                                <span className="font-medium text-steel-800">
                                  {b.productName} <span className="font-normal text-steel-500">({b.grade})</span>
                                </span>
                                <span className="text-right text-steel-600">{formatTonnage(b.tonnage, b.unit)}</span>
                                <span className="text-right font-semibold text-steel-900">{b.revenue > 0 ? formatCurrency(b.revenue) : '—'}</span>
                              </div>
                            ))}
                            {day.breakdown.length > 1 && (
                              <div className="flex justify-between rounded-lg border border-steel-200 bg-accent/5 px-3 py-2 text-sm">
                                <span className="font-semibold text-steel-700">Day Total</span>
                                <span className="font-bold text-steel-900">{formatCurrency(day.revenue)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination — pinned */}
              <div className="flex-shrink-0 border-t border-steel-100 pt-3">
                <div className="flex items-center justify-between text-sm text-steel-500">
                  <span>{(dayPage - 1) * DAY_PAGE_SIZE + 1}–{Math.min(dayPage * DAY_PAGE_SIZE, days.length)} of {days.length} days</span>
                  {totalDayPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDayPage(1)} disabled={dayPage === 1} className="rounded p-1 hover:bg-steel-100 disabled:opacity-40"><ChevronsLeft className="h-4 w-4" /></button>
                      <button onClick={() => setDayPage(dayPage - 1)} disabled={dayPage === 1} className="rounded p-1 hover:bg-steel-100 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                      <span className="px-2 font-medium">{dayPage} / {totalDayPages}</span>
                      <button onClick={() => setDayPage(dayPage + 1)} disabled={dayPage === totalDayPages} className="rounded p-1 hover:bg-steel-100 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
                      <button onClick={() => setDayPage(totalDayPages)} disabled={dayPage === totalDayPages} className="rounded p-1 hover:bg-steel-100 disabled:opacity-40"><ChevronsRight className="h-4 w-4" /></button>
                    </div>
                  )}
                </div>
              </div>

              {/* Period total footer */}
              <div className="mt-2 flex-shrink-0 flex items-center justify-between rounded-lg bg-steel-800 px-4 py-3 text-white">
                <span className="text-sm font-medium">Period Total</span>
                <span className="text-lg font-bold">{formatCurrency(data.totalRevenue)}</span>
              </div>
            </Card>
          )}
        </>
      )}

      </div>
    </AppLayout>
  );
}
