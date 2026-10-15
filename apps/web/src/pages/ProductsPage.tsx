import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { AppLayout } from '@/components/AppLayout';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  grade: z.string().min(1, 'Required'),
  unit: z.string().default('MT'),
});

type FormData = z.infer<typeof schema>;

interface Product {
  id: string;
  name: string;
  grade: string;
  unit: string;
  isActive: boolean;
}

export function ProductsPage() {
  const [confirmDialog, setConfirmDialog] = useState<{ id: string } | null>(null);
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get<Product[]>('/products').then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { unit: 'MT' },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/products', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      reset();
      setShowForm(false);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  return (
    <AppLayout title="Products">
      <div className="flex h-full flex-col gap-4">

        {/* ── Fixed top ── */}
        <div className="flex-shrink-0 space-y-4">
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Product'}
          </Button>

          {showForm && (
            <Card>
              <CardTitle>New Product</CardTitle>
              <form
                onSubmit={handleSubmit((d) => createMutation.mutate(d))}
                className="mt-4 grid gap-4 sm:grid-cols-3"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium">Name</label>
                  <Input placeholder="TMT Bar" {...register('name')} />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Grade</label>
                  <Input placeholder="Fe500D" {...register('grade')} />
                  {errors.grade && <p className="mt-1 text-xs text-red-600">{errors.grade.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Unit</label>
                  <Input placeholder="MT" {...register('unit')} />
                </div>
                <div className="sm:col-span-3">
                  <Button type="submit" disabled={createMutation.isPending}>Create Product</Button>
                </div>
              </form>
            </Card>
          )}
        </div>

        {/* ── Table fills remaining height ── */}
        <Card className="flex flex-1 flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <DataTable
              data={products}
              keyField="id"
              columns={[
                { key: 'name', header: 'Product', minWidth: '140px' },
                { key: 'grade', header: 'Grade', minWidth: '100px' },
                { key: 'unit', header: 'Unit', minWidth: '70px' },
                {
                  key: 'isActive', header: 'Status', minWidth: '80px',
                  render: (r) => (
                    <span className={r.isActive
                      ? 'text-xs font-medium text-green-700'
                      : 'text-xs text-steel-400'}>
                      {r.isActive ? 'Active' : 'Inactive'}
                    </span>
                  ),
                },
                {
                  key: 'actions', header: 'Actions', minWidth: '120px',
                  render: (r) =>
                    r.isActive ? (
                      <Button variant="danger" size="sm"
                        onClick={() => setConfirmDialog({ id: r.id })}>
                        Deactivate
                      </Button>
                    ) : null,
                },
              ]}
              emptyMessage="No products yet"
            />
          </div>
        </Card>

      </div>
      <ConfirmDialog
        isOpen={!!confirmDialog}
        title="Deactivate Product"
        message="Deactivate this product? It will no longer appear for new vehicle bookings."
        confirmLabel="Deactivate"
        danger
        onConfirm={() => { if (confirmDialog) deactivateMutation.mutate(confirmDialog.id); setConfirmDialog(null); }}
        onCancel={() => setConfirmDialog(null)}
      />
    </AppLayout>
  );
}
