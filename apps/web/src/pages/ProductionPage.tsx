import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, formatDate, formatTonnage } from '@/components/ui/DataTable';

const schema = z.object({
  productId: z.string().min(1, 'Select a product'),
  tonnage: z.coerce.number().min(0.01, 'Must be > 0'),
  date: z.string().min(1),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ProductionLog {
  id: string;
  tonnage: number;
  date: string;
  notes?: string;
  product: { name: string; grade: string; unit: string };
  operator: { name: string };
}

function localToday() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

export function ProductionPage() {
  const qc = useQueryClient();
  const today = localToday();

  const { data: products = [] } = useQuery({
    queryKey: ['products', 'active'],
    queryFn: () => api.get('/products?activeOnly=true').then((r) => r.data),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['production'],
    queryFn: () => api.get<ProductionLog[]>('/production').then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: today },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/production', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['production'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
      reset({ date: today, productId: '', tonnage: 0, notes: '' });
    },
  });

  return (
    <AppLayout title="Log Production">
      <div className="flex h-full flex-col gap-4">

        {/* ── Fixed: log form ── */}
        <Card className="flex-shrink-0">
          <CardTitle>New Entry</CardTitle>
          <form
            onSubmit={handleSubmit((d) => mutation.mutate(d))}
            className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium">Product</label>
              <Select {...register('productId')}>
                <option value="">Select product</option>
                {products.map((p: { id: string; name: string; grade: string }) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.grade})</option>
                ))}
              </Select>
              {errors.productId && <p className="mt-1 text-xs text-red-600">{errors.productId.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Date</label>
              <Input type="date" {...register('date')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tonnage</label>
              <Input type="number" step="0.01" {...register('tonnage')} />
              {errors.tonnage && <p className="mt-1 text-xs text-red-600">{errors.tonnage.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <Input {...register('notes')} placeholder="Optional" />
            </div>
            <div className="flex items-center gap-4 sm:col-span-2 lg:col-span-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Log Production'}
              </Button>
              {mutation.isSuccess && <p className="text-sm text-green-600">Saved ✓</p>}
              {mutation.isError && <p className="text-sm text-red-600">Failed to save</p>}
            </div>
          </form>
        </Card>

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
                { key: 'operator', header: 'Logged By', render: (r) => r.operator.name, minWidth: '120px' },
                { key: 'notes', header: 'Notes', render: (r) => r.notes || '—' },
              ]}
              emptyMessage="No production entries yet"
            />
          </div>
        </Card>

      </div>
    </AppLayout>
  );
}
