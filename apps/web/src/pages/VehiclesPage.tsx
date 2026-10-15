import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, StatusBadge, formatDateTime, formatTonnage } from '@/components/ui/DataTable';
import { SearchableSelect, type SelectOption } from '@/components/ui/SearchableSelect';
import { StockBalance } from '@steel-factory/shared';
import { formatCurrency, vehicleTotal } from '@/lib/utils';

const itemSchema = z.object({
  productId: z.string().min(1, 'Select a product'),
  tonnage: z.coerce.number().min(0.01, 'Must be > 0'),
  pricePerUnit: z.coerce.number().min(0, 'Must be ≥ 0'),
});

const schema = z.object({
  buyerId: z.string().min(1, 'Select a buyer'),
  vehicleNumber: z.string().min(3, 'Required'),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Add at least one product'),
});

type FormData = z.infer<typeof schema>;

interface VehicleItem {
  id: string;
  productId: string;
  tonnage: number;
  pricePerUnit: number;
  product: { name: string; grade: string; unit: string };
}

interface Vehicle {
  id: string;
  vehicleNumber: string;
  driverName?: string;
  driverPhone?: string;
  status: string;
  notes?: string;
  pickedUpAt?: string;
  createdAt: string;
  buyer: { id: string; name: string };
  registrar: { name: string };
  items: VehicleItem[];
}

// Reusable vehicle items sub-form — inlined below for simplicity

export function VehiclesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Confirm dialog state
  const [confirm, setConfirm] = useState<{
    title: string; message: string; confirmLabel: string; danger?: boolean; onConfirm: () => void;
  } | null>(null);

  const { data: buyers = [] } = useQuery({
    queryKey: ['buyers'],
    queryFn: () => api.get('/buyers').then((r) => r.data),
  });

  const { data: stock = [] } = useQuery({
    queryKey: ['stock'],
    queryFn: () => api.get<StockBalance[]>('/stock').then((r) => r.data),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get<Vehicle[]>('/vehicles').then((r) => r.data),
  });

  const buyerOptions: SelectOption[] = buyers.map((b: { id: string; name: string; contact?: string }) => ({
    value: b.id,
    label: b.name,
    sublabel: b.contact,
  }));

  const productOptions: SelectOption[] = stock.map((s) => ({
    value: s.productId,
    label: s.productName,
    sublabel: `${s.grade} — ${formatTonnage(s.available, s.unit)} avail.`,
  }));

  // ── Create form ──
  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { buyerId: '', items: [{ productId: '', tonnage: 0, pricePerUnit: 0 }] },
    });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedBuyerId = watch('buyerId');
  const watchedItems = watch('items');

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/vehicles', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
      reset({ buyerId: '', items: [{ productId: '', tonnage: 0, pricePerUnit: 0 }] });
      setShowForm(false);
    },
  });

  // ── Edit form ──
  const {
    register: eReg, handleSubmit: eHandle, control: eCtrl,
    watch: eWatch, setValue: eSet, reset: eReset, formState: { errors: eErr },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { buyerId: '', items: [] } });
  const { fields: eFields, append: eAppend, remove: eRemove } = useFieldArray({ control: eCtrl, name: 'items' });
  const eWatchedBuyerId = eWatch('buyerId');
  const eWatchedItems = eWatch('items');

  const openEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    eReset({
      buyerId: v.buyer.id,
      vehicleNumber: v.vehicleNumber,
      driverName: v.driverName ?? '',
      driverPhone: v.driverPhone ?? '',
      notes: v.notes ?? '',
      items: v.items.map((i) => ({ productId: i.productId, tonnage: i.tonnage, pricePerUnit: i.pricePerUnit })),
    });
  };

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => api.patch(`/vehicles/${editingVehicle!.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
      setEditingVehicle(null);
    },
  });

  const pickupMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/vehicles/${id}/pickup`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${id}/permanent`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
  });

  const formTotal = watchedItems.reduce(
    (sum, item) => sum + (Number(item.tonnage) || 0) * (Number(item.pricePerUnit) || 0),
    0,
  );
  const editTotal = eWatchedItems.reduce(
    (sum, item) => sum + (Number(item.tonnage) || 0) * (Number(item.pricePerUnit) || 0),
    0,
  );

  const askConfirm = (cfg: typeof confirm) => setConfirm(cfg);

  return (
    <AppLayout title="Vehicles">
      <div className="flex h-full flex-col gap-4">

        {/* ── Fixed top: register button + create form ── */}
        <div className="flex-shrink-0 space-y-4">
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Register Vehicle'}
          </Button>

          {showForm && (
            <Card>
              <CardTitle>New Vehicle Dispatch</CardTitle>
              <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="mt-4 space-y-5">
                <div>
                  <label className="mb-1 block text-sm font-medium">Buyer</label>
                  <SearchableSelect options={buyerOptions} value={watchedBuyerId}
                    onChange={(v) => setValue('buyerId', v, { shouldValidate: true })}
                    placeholder="Search and select buyer..." />
                  {errors.buyerId && <p className="mt-1 text-sm text-red-600">{errors.buyerId.message}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Vehicle Number</label>
                    <Input placeholder="MH12AB1234" {...register('vehicleNumber')} />
                    {errors.vehicleNumber && <p className="mt-1 text-xs text-red-600">{errors.vehicleNumber.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Driver Name</label>
                    <Input {...register('driverName')} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Driver Phone</label>
                    <Input type="tel" {...register('driverPhone')} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Notes</label>
                    <Input {...register('notes')} />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium">Products</label>
                    <Button type="button" variant="ghost" size="sm"
                      onClick={() => append({ productId: '', tonnage: 0, pricePerUnit: 0 })}>
                      <Plus className="mr-1 h-4 w-4" /> Add Product
                    </Button>
                  </div>
                  {errors.items && !Array.isArray(errors.items) && (
                    <p className="mb-2 text-sm text-red-600">{errors.items.message}</p>
                  )}
                  <div className="mb-1 hidden grid-cols-[1fr_100px_120px_32px] gap-2 px-3 text-xs font-medium text-steel-500 sm:grid">
                    <span>Product</span><span>Tonnage</span><span>Rate (₹/MT)</span><span />
                  </div>
                  <div className="space-y-2">
                    {fields.map((field, idx) => (
                      <div key={field.id} className="grid gap-2 rounded-lg border border-steel-200 bg-steel-50 p-3 sm:grid-cols-[1fr_100px_120px_32px] sm:items-center">
                        <div>
                          <span className="mb-1 block text-xs text-steel-500 sm:hidden">Product</span>
                          <SearchableSelect options={productOptions} value={watch(`items.${idx}.productId`)}
                            onChange={(v) => setValue(`items.${idx}.productId`, v, { shouldValidate: true })}
                            placeholder="Select product..." />
                          {errors.items?.[idx]?.productId && (
                            <p className="mt-1 text-xs text-red-600">{errors.items[idx]?.productId?.message}</p>
                          )}
                        </div>
                        <div>
                          <span className="mb-1 block text-xs text-steel-500 sm:hidden">Tonnage</span>
                          <Input type="number" step="0.01" placeholder="0.00" {...register(`items.${idx}.tonnage`)} />
                        </div>
                        <div>
                          <span className="mb-1 block text-xs text-steel-500 sm:hidden">Rate (₹/MT)</span>
                          <Input type="number" step="1" placeholder="0" {...register(`items.${idx}.pricePerUnit`)} />
                        </div>
                        {fields.length > 1 && (
                          <button type="button" onClick={() => remove(idx)}
                            className="self-center rounded-lg p-1.5 text-red-500 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {formTotal > 0 && (
                    <div className="mt-3 flex justify-end rounded-lg bg-steel-100 px-4 py-2 text-sm">
                      <span className="mr-4 text-steel-600">Invoice Total</span>
                      <span className="font-bold text-steel-900">{formatCurrency(formTotal)}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Registering…' : 'Register Vehicle'}
                  </Button>
                  {createMutation.isError && (
                    <p className="text-sm text-red-600">
                      {(createMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'}
                    </p>
                  )}
                </div>
              </form>
            </Card>
          )}
        </div>

        {/* ── Table fills remaining height ── */}
        <Card className="flex flex-1 flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <DataTable
              data={vehicles}
              keyField="id"
              pageSize={10}
              columns={[
                { key: 'vehicleNumber', header: 'Vehicle', minWidth: '120px' },
                {
                  key: 'buyer', header: 'Buyer', minWidth: '140px',
                  render: (r) => (
                    <Link to={`/buyers/${r.buyer.id}`} className="text-accent hover:underline">
                      {r.buyer.name}
                    </Link>
                  ),
                },
                {
                  key: 'items', header: 'Products', minWidth: '200px',
                  render: (r) => (
                    <ul className="space-y-0.5 text-xs">
                      {r.items.map((item) => (
                        <li key={item.id}>
                          {item.product.name} ({item.product.grade}) —{' '}
                          {formatTonnage(item.tonnage, item.product.unit)}
                          {item.pricePerUnit > 0 && (
                            <span className="text-steel-400"> @ {formatCurrency(item.pricePerUnit)}/MT</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ),
                },
                {
                  key: 'total', header: 'Total', minWidth: '110px',
                  render: (r) => {
                    const total = vehicleTotal(r.items);
                    return total > 0 ? <span className="font-medium">{formatCurrency(total)}</span> : '—';
                  },
                },
                { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} />, minWidth: '110px' },
                { key: 'pickedUpAt', header: 'Picked Up', render: (r) => r.pickedUpAt ? formatDateTime(r.pickedUpAt) : '—', minWidth: '160px' },
                { key: 'registrar', header: 'By', render: (r) => r.registrar.name, minWidth: '100px' },
                {
                  key: 'actions', header: 'Actions', minWidth: '180px',
                  render: (r) => (
                    <div className="flex gap-1.5 flex-wrap">
                      {r.status !== 'CANCELLED' && (
                        <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {r.status === 'REGISTERED' && (
                        <>
                          <Button size="sm"
                            disabled={pickupMutation.isPending}
                            onClick={() => askConfirm({
                              title: 'Mark as Picked Up',
                              message: `Confirm that ${r.vehicleNumber} has left the factory?`,
                              confirmLabel: 'Mark Picked Up',
                              onConfirm: () => pickupMutation.mutate(r.id),
                            })}>
                            Pickup
                          </Button>
                          <Button size="sm" variant="ghost"
                            disabled={cancelMutation.isPending}
                            onClick={() => askConfirm({
                              title: 'Cancel Vehicle',
                              message: `Cancel the dispatch entry for ${r.vehicleNumber}? The record will be kept with CANCELLED status.`,
                              confirmLabel: 'Cancel Entry',
                              danger: true,
                              onConfirm: () => cancelMutation.mutate(r.id),
                            })}>
                            Cancel
                          </Button>
                          <Button size="sm" variant="danger"
                            disabled={deleteMutation.isPending}
                            onClick={() => askConfirm({
                              title: 'Delete Vehicle Entry',
                              message: `Permanently delete the entry for ${r.vehicleNumber}? This cannot be undone.`,
                              confirmLabel: 'Delete',
                              danger: true,
                              onConfirm: () => deleteMutation.mutate(r.id),
                            })}>
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  ),
                },
              ]}
              emptyMessage="No vehicles registered yet"
            />
          </div>
        </Card>
      </div>

      {/* ── Edit Modal ── */}
      <Modal
        isOpen={!!editingVehicle}
        onClose={() => setEditingVehicle(null)}
        title={editingVehicle ? `Edit Vehicle — ${editingVehicle.vehicleNumber}` : 'Edit Vehicle'}
        size="xl"
      >
        {editingVehicle?.status === 'PICKED_UP' && (
          <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
            ⚠️ This vehicle has already been picked up. Editing items will recalculate stock and revenue automatically.
          </div>
        )}
        <form onSubmit={eHandle((d) => updateMutation.mutate(d))} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Buyer</label>
              <SearchableSelect options={buyerOptions} value={eWatchedBuyerId}
                onChange={(v) => eSet('buyerId', v, { shouldValidate: true })} placeholder="Search buyer..." />
              {eErr.buyerId && <p className="mt-1 text-sm text-red-600">{eErr.buyerId.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Vehicle Number</label>
              <Input placeholder="MH12AB1234" {...eReg('vehicleNumber')} />
              {eErr.vehicleNumber && <p className="mt-1 text-xs text-red-600">{eErr.vehicleNumber.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Driver Name</label>
              <Input {...eReg('driverName')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Driver Phone</label>
              <Input type="tel" {...eReg('driverPhone')} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <Input {...eReg('notes')} />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">Products</label>
              <Button type="button" variant="ghost" size="sm"
                onClick={() => eAppend({ productId: '', tonnage: 0, pricePerUnit: 0 })}>
                <Plus className="mr-1 h-4 w-4" /> Add Product
              </Button>
            </div>
            <div className="mb-1 hidden grid-cols-[1fr_100px_120px_32px] gap-2 px-3 text-xs font-medium text-steel-500 sm:grid">
              <span>Product</span><span>Tonnage</span><span>Rate (₹/MT)</span><span />
            </div>
            <div className="space-y-2">
              {eFields.map((field, idx) => (
                <div key={field.id} className="grid gap-2 rounded-lg border border-steel-200 bg-steel-50 p-3 sm:grid-cols-[1fr_100px_120px_32px] sm:items-center">
                  <div>
                    <span className="mb-1 block text-xs text-steel-500 sm:hidden">Product</span>
                    <SearchableSelect options={productOptions} value={eWatch(`items.${idx}.productId`)}
                      onChange={(v) => eSet(`items.${idx}.productId`, v, { shouldValidate: true })}
                      placeholder="Select product..." />
                  </div>
                  <div>
                    <span className="mb-1 block text-xs text-steel-500 sm:hidden">Tonnage</span>
                    <Input type="number" step="0.01" placeholder="0.00" {...eReg(`items.${idx}.tonnage`)} />
                  </div>
                  <div>
                    <span className="mb-1 block text-xs text-steel-500 sm:hidden">Rate (₹/MT)</span>
                    <Input type="number" step="1" placeholder="0" {...eReg(`items.${idx}.pricePerUnit`)} />
                  </div>
                  {eFields.length > 1 && (
                    <button type="button" onClick={() => eRemove(idx)}
                      className="self-center rounded-lg p-1.5 text-red-500 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {editTotal > 0 && (
              <div className="mt-3 flex justify-end rounded-lg bg-steel-100 px-4 py-2 text-sm">
                <span className="mr-4 text-steel-600">Invoice Total</span>
                <span className="font-bold text-steel-900">{formatCurrency(editTotal)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 pb-1">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditingVehicle(null)}>Discard</Button>
            {updateMutation.isError && (
              <p className="text-sm text-red-600">
                {(updateMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'}
              </p>
            )}
          </div>
        </form>
      </Modal>

      {/* ── Confirm Dialog ── */}
      <ConfirmDialog
        isOpen={!!confirm}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        onConfirm={() => { confirm?.onConfirm(); setConfirm(null); }}
        onCancel={() => setConfirm(null)}
      />
    </AppLayout>
  );
}
