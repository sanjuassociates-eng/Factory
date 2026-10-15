import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { AppLayout } from '@/components/AppLayout';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable, formatDate } from '@/components/ui/DataTable';
import { ALL_PERMISSIONS, Permission } from '@steel-factory/shared';
import { cn } from '@/lib/utils';

const PERM_LABELS: Record<Permission, string> = {
  [Permission.LOG_PRODUCTION]: 'Log Production',
  [Permission.MANAGE_PRODUCTS]: 'Manage Products',
  [Permission.MANAGE_BUYERS]: 'Manage Buyers',
  [Permission.DISPATCH_VEHICLES]: 'Dispatch Vehicles',
  [Permission.MANAGE_USERS]: 'Manage Users',
  [Permission.MANAGE_STOCK]: 'Manage Stock (Adjustments)',
  [Permission.VIEW_AUDIT]: 'View Audit Logs',
  [Permission.VIEW_REVENUE]: 'View Revenue',
};

const schema = z.object({
  name: z.string().min(2, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  isAdmin: z.boolean().default(false),
  permissions: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof schema>;

interface UserRow {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  permissions: string[];
  createdAt: string;
}

export function UsersPage() {
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<UserRow[]>('/users').then((r) => r.data),
  });

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isAdmin: false, permissions: [] },
  });

  const isAdmin = watch('isAdmin');

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/users', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      reset();
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <AppLayout title="User Management">
      <div className="flex h-full flex-col gap-4">

        {/* ── Fixed top ── */}
        <div className="flex-shrink-0 space-y-4">
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add User'}
          </Button>

          {showForm && (
            <Card>
              <CardTitle>New User</CardTitle>
              <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="mt-4 space-y-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Name</label>
                    <Input {...register('name')} />
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Email</label>
                    <Input type="email" {...register('email')} />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Password</label>
                    <Input type="password" {...register('password')} />
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                  </div>
                </div>

                {/* Admin toggle */}
                <div className="flex items-center gap-3">
                  <Controller
                    control={control}
                    name="isAdmin"
                    render={({ field }) => (
                      <button type="button" onClick={() => field.onChange(!field.value)}
                        className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                          field.value ? 'bg-accent' : 'bg-steel-200')}>
                        <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          field.value ? 'translate-x-6' : 'translate-x-1')} />
                      </button>
                    )}
                  />
                  <span className="text-sm font-medium">Admin (full access)</span>
                </div>

                {/* Permissions — only when not admin */}
                {!isAdmin && (
                  <div>
                    <p className="mb-2 text-sm font-medium">Permissions</p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <Controller
                        control={control}
                        name="permissions"
                        render={({ field }) => (
                          <>
                            {ALL_PERMISSIONS.map((perm) => (
                              <label key={perm}
                                className="flex cursor-pointer items-center gap-2 rounded-lg border border-steel-200 px-3 py-2.5 hover:bg-steel-50">
                                <input type="checkbox" checked={field.value.includes(perm)}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...field.value, perm]
                                      : field.value.filter((p) => p !== perm);
                                    field.onChange(next);
                                  }}
                                  className="h-4 w-4 accent-accent" />
                                <span className="text-sm">{PERM_LABELS[perm]}</span>
                              </label>
                            ))}
                          </>
                        )}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Button type="submit" disabled={createMutation.isPending}>Create User</Button>
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
              data={users}
              keyField="id"
              columns={[
                { key: 'name', header: 'Name', minWidth: '130px' },
                { key: 'email', header: 'Email', minWidth: '180px' },
                {
                  key: 'isAdmin', header: 'Access', minWidth: '200px',
                  render: (r) =>
                    r.isAdmin ? (
                      <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-800">Admin</span>
                    ) : (
                      <span className="text-xs text-steel-600">
                        {r.permissions.length
                          ? r.permissions.map((p) => PERM_LABELS[p as Permission] ?? p).join(', ')
                          : 'No permissions'}
                      </span>
                    ),
                },
                { key: 'createdAt', header: 'Created', render: (r) => formatDate(r.createdAt), minWidth: '100px' },
                {
                  key: 'actions', header: 'Actions', minWidth: '90px',
                  render: (r) => (
                    <Button variant="danger" size="sm"
                      onClick={() => setConfirmDelete({ id: r.id, name: r.name })}>
                      Delete
                    </Button>
                  ),
                },
              ]}
              emptyMessage="No users found"
            />
          </div>
        </Card>

      </div>
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete User"
        message={`Delete ${confirmDelete?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => { if (confirmDelete) deleteMutation.mutate(confirmDelete.id); setConfirmDelete(null); }}
        onCancel={() => setConfirmDelete(null)}
      />
    </AppLayout>
  );
}
