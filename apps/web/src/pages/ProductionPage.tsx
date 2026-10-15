import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, formatDate, formatTonnage } from '@/components/ui/DataTable';
import { formatCurrency } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const schema = z.object({
  productId: z.string().min(1, 'Select a product'),
  tonnage: z.coerce.number().min(0.01, 'Must be > 0'),
  pricePerUnit: z.coerce.number().min(0).optional(),
  date: z.string().min(1),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ProductionLog {
  id: string;
  tonnage: number;
  pricePerUnit: number;
  date: string;
  notes?: string;
  product: { id: string; name: string; grade: string; unit: string };
  operator: { name: string };
}

function localToday() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

export function ProductionPage() {
  const qc = useQueryClient();
  const today = localToday();
  const [editingLog, setEditingLog] = useState<ProductionLog | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string } | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ['products', 'active'],
    queryFn: () => api.get('/products?activeOnly=true').then((r) => r.data),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['production'],
    queryFn: () => api.get<ProductionLog[]>('/production').then((r) => r.data),
  });

  // ── Create form ──
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: today, pricePerUnit: 0 },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/production', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['production'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
      reset({ date: today, productId: '', tonnage: 0, pricePerUnit: 0, notes: '' });
    },
  });

  // ── Edit form ──
  const { register: eReg, handleSubmit: eHandle, reset: eReset, formState: { errors: eErr } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: today, pricePerUnit: 0 },
  });

  const openEdit = (log: ProductionLog) => {
    setEditingLog(log);
    eReset({
      productId: log.product.id,
      tonnage: log.tonnage,
      pricePerUnit: log.pricePerUnit,
      date: log.date.slice(0, 10),
      notes: log.notes ?? '',
    });
  };

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => api.patch(`/production/${editingLog!.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['production'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
      setEditingLog(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/production/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['production'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
  });

  return (
    <AppLayout title="Log Production">
      <div className="flex h-full flex-col gap-4">

        {/* ── Fixed: log form ── */}
        <div className="flex-shrink-0 space-y-4">
          <Card>
            <CardTitle>{editingLog ? `Edit Entry` : 'New Entry'}</CardTitle>
            {editingLog && (
              <p className="mt-1 text-xs text-amber-600">
                Editing: {editingLog.product.name} ({editingLog.product.grade}) — {formatDate(editingLog.date)}
              </p>
            )}
            <form
              onSubmit={editingLog
                ? eHandle((d) => updateMutation.mutate(d))
                : handleSubmit((d) => createMutation.mutate(d))}
              className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">Product</label>
                <Select {...(editingLog ? eReg('productId') : register('productId'))}>
                  <option value="">Select product</option>
                  {products.map((p: { id: string; name: string; grade: string }) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.grade})</option>
                  ))}
                </Select>
                {(editingLog ? eErr : errors).productId && (
                  <p className="mt-1 text-xs text-red-600">{(editingLog ? eErr : errors).productId?.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Date</label>
                <Input type="date" {...(editingLog ? eReg('date') : register('date'))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Tonnage</label>
                <Input type="number" step="0.01" {...(editingLog ? eReg('tonnage') : register('tonnage'))} />
                {(editingLog ? eErr : errors).tonnage && (
                  <p className="mt-1 text-xs text-red-600">{(editingLog ? eErr : errors).tonnage?.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Cost Price (₹/MT)</label>
                <Input type="number" step="1" placeholder="0" {...(editingLog ? eReg('pricePerUnit') : register('pricePerUnit'))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Notes</label>
                <Input {...(editingLog ? eReg('notes') : register('notes'))} placeholder="Optional" />
              </div>
              <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-5">
                <Button type="submit" disabled={editingLog ? updateMutation.isPending : createMutation.isPending}>
                  {editingLog
                    ? (updateMutation.isPending ? 'Saving…' : 'Save Changes')
                    : (createMutation.isPending ? 'Saving…' : 'Log Production')}
                </Button>
                {editingLog && (
                  <Button type="button" variant="ghost" onClick={() => setEditingLog(null)}>Cancel</Button>
                )}
                {!editingLog && createMutation.isSuccess && <p className="text-sm text-green-600">Saved ✓</p>}
                {(editingLog ? updateMutation : createMutation).isError && (
                  <p className="text-sm text-red-600">Failed to save</p>
                )}
              </div>
            </form>
          </Card>
        </div>

        {/* ── Table fills remaining height ── */}
        <Card className="flex flex-1 flex-col min-h-0">
          <CardTitle>Production History</CardTitle>
          <div className="mt-4 flex-1 min-h-0">
            <DataTable
              data={logs}
              keyField="id"
              columns={[
                { key: 'date', header: 'Date', render: (r) => formatDate(r.date), minWidth: '100px' },
                { key: 'product', header: 'Product', render: (r) => `${r.product.name} (${r.product.grade})`, minWidth: '160px' },
                { key: 'tonnage', header: 'Tonnage', render: (r) => formatTonnage(r.tonnage, r.product.unit), minWidth: '100px' },
                { key: 'pricePerUnit', header: 'Cost/MT', render: (r) => r.pricePerUnit > 0 ? formatCurrency(r.pricePerUnit) : '—', minWidth: '110px' },
                { key: 'operator', header: 'Logged By', render: (r) => r.operator.name, minWidth: '120px' },
                { key: 'notes', header: 'Notes', render: (r) => r.notes || '—' },
                {
                  key: 'actions', header: '', minWidth: '80px',
                  render: (r) => (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(r)}
                        className="rounded p-1.5 text-steel-500 hover:bg-steel-100 hover:text-steel-800">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ id: r.id })}
                        className="rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                        disabled={deleteMutation.isPending}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ),
                },
              ]}
              emptyMessage="No production entries yet"
            />
          </div>
        </Card>

      </div>
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Production Entry"
        message="Delete this production entry? This will affect stock balances and cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => { if (confirmDelete) deleteMutation.mutate(confirmDelete.id); setConfirmDelete(null); }}
        onCancel={() => setConfirmDelete(null)}
      />
    </AppLayout>
  );
}
