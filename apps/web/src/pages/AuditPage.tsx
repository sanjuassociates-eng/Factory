import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, StatusBadge, formatDateTime } from '@/components/ui/DataTable';

interface AuditItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
  user: { name: string; email: string };
}

export function AuditPage() {
  const [entity, setEntity] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data } = useQuery({
    queryKey: ['audit', { entity, from, to }],
    queryFn: () =>
      api.get('/audit', {
        params: {
          entity: entity || undefined,
          from: from || undefined,
          to: to || undefined,
        },
      }).then((r) => r.data),
  });

  const items: AuditItem[] = data?.items ?? [];

  return (
    <AppLayout title="Audit Logs">
      {/* h-full + flex-col: filters fixed, table fills rest */}
      <div className="flex h-full flex-col gap-4">

        {/* ── Fixed filters ── */}
        <Card className="flex-shrink-0">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Entity</label>
              <Select value={entity} onChange={(e) => setEntity(e.target.value)}>
                <option value="">All</option>
                <option value="users">Users</option>
                <option value="products">Products</option>
                <option value="production">Production</option>
                <option value="vehicles">Vehicles</option>
                <option value="buyers">Buyers</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">From</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">To</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        </Card>

        {/* ── Table fills remaining height ── */}
        <Card className="flex flex-1 flex-col min-h-0">
          <p className="mb-3 flex-shrink-0 text-sm text-steel-500">{data?.total ?? 0} records</p>
          <div className="flex-1 min-h-0">
            <DataTable
              data={items}
              keyField="id"
              pageSize={20}
              columns={[
                { key: 'createdAt', header: 'Time', render: (r) => formatDateTime(r.createdAt), minWidth: '160px' },
                { key: 'user', header: 'User', render: (r) => r.user.name, minWidth: '120px' },
                { key: 'action', header: 'Action', render: (r) => <StatusBadge status={r.action} /> },
                { key: 'entity', header: 'Entity' },
                { key: 'entityId', header: 'ID', render: (r) => <span className="font-mono text-xs">{r.entityId.slice(0, 8)}…</span> },
              ]}
              emptyMessage="No audit records found"
            />
          </div>
        </Card>

      </div>
    </AppLayout>
  );
}
