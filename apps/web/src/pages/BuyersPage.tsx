import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { AppLayout } from '@/components/AppLayout';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable, formatDate } from '@/components/ui/DataTable';
import { useAuth } from '@/lib/auth';
import { Permission } from '@steel-factory/shared';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  contact: z.string().optional(),
  address: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Buyer {
  id: string;
  name: string;
  contact?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  _count: { vehicles: number };
}

export function BuyersPage() {
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const qc = useQueryClient();
  const { can } = useAuth();
  const canManage = can(Permission.MANAGE_BUYERS);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const { data: buyers = [] } = useQuery({
    queryKey: ['buyers', search],
    queryFn: () => api.get<Buyer[]>('/buyers', { params: search ? { q: search } : {} }).then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/buyers', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['buyers'] });
      reset();
      setShowForm(false);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/buyers/${id}`, { isActive: false }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['buyers'] }),
  });

  return (
    <AppLayout title="Buyers">
      <div className="flex h-full flex-col gap-4">

        {/* ── Fixed top: search bar + collapsible form ── */}
        <div className="flex-shrink-0 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search buyers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            {canManage && (
              <Button onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancel' : 'Add Buyer'}
              </Button>
            )}
          </div>

          {showForm && canManage && (
            <Card>
              <CardTitle>New Buyer</CardTitle>
              <form
                onSubmit={handleSubmit((d) => createMutation.mutate(d))}
                className="mt-4 grid gap-4 sm:grid-cols-3"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium">Name</label>
                  <Input {...register('name')} />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Contact</label>
                  <Input placeholder="+91 …" {...register('contact')} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Address</label>
                  <Input {...register('address')} />
                </div>
                <div className="sm:col-span-3">
                  <Button type="submit" disabled={createMutation.isPending}>Create Buyer</Button>
                </div>
              </form>
            </Card>
          )}
        </div>

        {/* ── Table fills remaining height ── */}
        <Card className="flex flex-1 flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <DataTable
              data={buyers}
              keyField="id"
              columns={[
                {
                  key: 'name', header: 'Name', minWidth: '140px',
                  render: (r) => (
                    <Link to={`/buyers/${r.id}`} className="font-medium text-accent hover:underline">
                      {r.name}
                    </Link>
                  ),
                },
                { key: 'contact', header: 'Contact', render: (r) => r.contact || '—', minWidth: '140px' },
                { key: 'address', header: 'Address', render: (r) => r.address || '—' },
                { key: 'vehicles', header: 'Vehicles', render: (r) => r._count.vehicles, minWidth: '80px' },
                { key: 'createdAt', header: 'Added', render: (r) => formatDate(r.createdAt), minWidth: '100px' },
                ...(canManage
                  ? [{
                      key: 'actions', header: 'Actions', minWidth: '100px',
                      render: (r: Buyer) =>
                        r.isActive ? (
                          <Button variant="danger" size="sm"
                            onClick={() => setConfirmDialog({
                              title: 'Deactivate Buyer',
                              message: `Deactivate ${r.name}? They won't appear in new vehicle registrations.`,
                              onConfirm: () => deactivateMutation.mutate(r.id),
                            })}>
                            Deactivate
                          </Button>
                        ) : <span className="text-xs text-steel-400">Inactive</span>,
                    }]
                  : []),
              ]}
              emptyMessage="No buyers found"
            />
          </div>
        </Card>

      </div>
      <ConfirmDialog
        isOpen={!!confirmDialog}
        title={confirmDialog?.title ?? ''}
        message={confirmDialog?.message ?? ''}
        confirmLabel="Deactivate"
        danger
        onConfirm={() => { confirmDialog?.onConfirm(); setConfirmDialog(null); }}
        onCancel={() => setConfirmDialog(null)}
      />
    </AppLayout>
  );
}
