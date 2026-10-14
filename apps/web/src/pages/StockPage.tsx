import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/lib/api';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, formatDate, formatTonnage } from '@/components/ui/DataTable';
import { StockBalance, Permission } from '@steel-factory/shared';
import { useAuth } from '@/lib/auth';

const adjustSchema = z.object({
  productId: z.string().min(1, 'Select a product'),
  type: z.enum(['DAMAGE', 'WASTAGE', 'RETURN', 'CORRECTION']),
  tonnage: z.coerce.number().refine((v) => v !== 0, 'Cannot be zero'),
  reason: z.string().min(1, 'Reason is required'),
  date: z.string().min(1),
  notes: z.string().optional(),
});

type AdjustForm = z.infer<typeof adjustSchema>;

interface StockAdjustment {
  id: string;
  tonnage: number;
  type: string;
  reason: string;
  date: string;
  notes?: string;
  product: { name: string; grade: string; unit: string };
  creator: { name: string };
}

const TYPE_LABELS: Record<string, { label: string; sign: string }> = {
  DAMAGE:     { label: 'Damage',     sign: '-' },
  WASTAGE:    { label: 'Wastage',    sign: '-' },
  RETURN:     { label: 'Return',     sign: '+' },
  CORRECTION: { label: 'Correction', sign: '±' },
};

function localToday() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

export function StockPage() {
  const qc = useQueryClient();
  const { can } = useAuth();
  const today = localToday();
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const canManageStock = can(Permission.MANAGE_STOCK);

  const { data: stock = [], isLoading } = useQuery({
    queryKey: ['stock'],
    queryFn: () => api.get<StockBalance[]>('/stock').then((r) => r.data),
  });

  const { data: adjustments = [] } = useQuery({
    queryKey: ['stock-adjustments'],
    queryFn: () => api.get<StockAdjustment[]>('/stock/adjustments').then((r) => r.data),
    enabled: canManageStock,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AdjustForm>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { date: today, type: 'DAMAGE' },
  });

  const createAdjustment = useMutation({
    mutationFn: (data: AdjustForm) => api.post('/stock/adjustments', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock'] });
      qc.invalidateQueries({ queryKey: ['stock-adjustments'] });
      reset({ date: today, type: 'DAMAGE', productId: '', tonnage: 0, reason: '', notes: '' });
      setShowAdjustForm(false);
    },
  });

  return (
    <AppLayout title="Stock Overview">
      <div className="flex h-full flex-col gap-4">

        {/* ── Fixed summary tiles ── */}
        <div className="flex-shrink-0 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stock.map((s) => (
              <Card key={s.productId}>
                <p className="font-semibold text-steel-900">{s.productName}</p>
                <p className="mb-3 text-xs text-steel-500">{s.grade}</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-steel-500">Produced</span>
                    <span className="font-medium">{formatTonnage(s.produced, s.unit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-steel-500">Committed</span>
                    <span className="font-medium text-yellow-700">{formatTonnage(s.committed, s.unit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-steel-500">Dispatched</span>
                    <span className="font-medium text-green-700">{formatTonnage(s.dispatched, s.unit)}</span>
                  </div>
                  {s.adjusted !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-steel-500">Adjustments</span>
                      <span className={`font-medium ${s.adjusted < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {s.adjusted > 0 ? '+' : ''}{formatTonnage(s.adjusted, s.unit)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-steel-100 pt-1.5 text-base">
                    <span className="font-semibold">Available</span>
                    <span className={`font-bold ${s.available < 0 ? 'text-red-600' : 'text-accent'}`}>
                      {formatTonnage(s.available, s.unit)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* ── Log Adjustment form (MANAGE_STOCK only) ── */}
          {canManageStock && (
            <Card>
              <button
                onClick={() => setShowAdjustForm(!showAdjustForm)}
                className="flex w-full items-center justify-between text-left"
              >
                <CardTitle>Log Stock Adjustment</CardTitle>
                {showAdjustForm ? <ChevronUp className="h-4 w-4 text-steel-500" /> : <ChevronDown className="h-4 w-4 text-steel-500" />}
              </button>
              {showAdjustForm && (
                <form
                  onSubmit={handleSubmit((d) => createAdjustment.mutate(d))}
                  className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  <div>
                    <label className="mb-1 block text-sm font-medium">Product</label>
                    <Select {...register('productId')}>
                      <option value="">Select product</option>
                      {stock.map((s) => (
                        <option key={s.productId} value={s.productId}>{s.productName} ({s.grade})</option>
                      ))}
                    </Select>
                    {errors.productId && <p className="mt-1 text-xs text-red-600">{errors.productId.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Type</label>
                    <Select {...register('type')}>
                      <option value="DAMAGE">Damage (reduces stock)</option>
                      <option value="WASTAGE">Wastage (reduces stock)</option>
                      <option value="RETURN">Return (adds to stock)</option>
                      <option value="CORRECTION">Correction (+ or −)</option>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Tonnage</label>
                    <p className="mb-1 text-xs text-steel-400">Use negative (−) for reductions, positive (+) for additions</p>
                    <Input type="number" step="0.01" placeholder="-5.0 or +2.5" {...register('tonnage')} />
                    {errors.tonnage && <p className="mt-1 text-xs text-red-600">{errors.tonnage.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Reason</label>
                    <Input placeholder="e.g. Damaged in transit" {...register('reason')} />
                    {errors.reason && <p className="mt-1 text-xs text-red-600">{errors.reason.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Date</label>
                    <Input type="date" {...register('date')} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Notes</label>
                    <Input placeholder="Optional" {...register('notes')} />
                  </div>
                  <div className="flex items-center gap-4 sm:col-span-2 lg:col-span-3">
                    <Button type="submit" disabled={createAdjustment.isPending}>
                      {createAdjustment.isPending ? 'Saving…' : 'Save Adjustment'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setShowAdjustForm(false)}>Cancel</Button>
                    {createAdjustment.isError && (
                      <p className="text-sm text-red-600">
                        {(createAdjustment.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'}
                      </p>
                    )}
                  </div>
                </form>
              )}
            </Card>
          )}
        </div>

        {/* ── Table fills remaining height ── */}
        {!isLoading && (
          <Card className="flex flex-1 flex-col min-h-0">
            <CardTitle>{canManageStock && adjustments.length > 0 ? 'Adjustment History' : 'Stock Balances'}</CardTitle>
            <div className="mt-4 flex-1 min-h-0">
              {canManageStock && adjustments.length > 0 ? (
                <DataTable
                  data={adjustments}
                  keyField="id"
                  columns={[
                    { key: 'date', header: 'Date', render: (r) => formatDate(r.date), minWidth: '100px' },
                    { key: 'product', header: 'Product', render: (r) => `${r.product.name} (${r.product.grade})`, minWidth: '160px' },
                    { key: 'type', header: 'Type', render: (r) => TYPE_LABELS[r.type]?.label ?? r.type, minWidth: '100px' },
                    {
                      key: 'tonnage', header: 'Tonnage', minWidth: '110px',
                      render: (r) => (
                        <span className={r.tonnage < 0 ? 'text-red-600 font-medium' : 'text-blue-600 font-medium'}>
                          {r.tonnage > 0 ? '+' : ''}{formatTonnage(r.tonnage, r.product.unit)}
                        </span>
                      ),
                    },
                    { key: 'reason', header: 'Reason', minWidth: '160px' },
                    { key: 'creator', header: 'By', render: (r) => r.creator.name, minWidth: '100px' },
                    { key: 'notes', header: 'Notes', render: (r) => r.notes || '—' },
                  ]}
                  emptyMessage="No adjustments yet"
                />
              ) : (
                <DataTable
                  data={stock}
                  keyField="productId"
                  columns={[
                    { key: 'productName', header: 'Product', minWidth: '120px' },
                    { key: 'grade', header: 'Grade', minWidth: '100px' },
                    { key: 'produced', header: 'Produced', render: (r) => formatTonnage(r.produced, r.unit), minWidth: '110px' },
                    { key: 'committed', header: 'Committed', render: (r) => formatTonnage(r.committed, r.unit), minWidth: '110px' },
                    { key: 'dispatched', header: 'Dispatched', render: (r) => formatTonnage(r.dispatched, r.unit), minWidth: '110px' },
                    { key: 'adjusted', header: 'Adjusted', render: (r) => r.adjusted !== 0 ? formatTonnage(r.adjusted, r.unit) : '—', minWidth: '110px' },
                    { key: 'available', header: 'Available', render: (r) => formatTonnage(r.available, r.unit), minWidth: '110px' },
                  ]}
                  emptyMessage="No products found"
                />
              )}
            </div>
          </Card>
        )}

      </div>
    </AppLayout>
  );
}
