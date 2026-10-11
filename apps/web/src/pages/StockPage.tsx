import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/Card';
import { DataTable, formatTonnage } from '@/components/ui/DataTable';
import { StockBalance } from '@steel-factory/shared';

export function StockPage() {
  const { data: stock = [], isLoading } = useQuery({
    queryKey: ['stock'],
    queryFn: () => api.get<StockBalance[]>('/stock').then((r) => r.data),
  });

  return (
    <AppLayout title="Stock Overview">
      <div className="flex h-full flex-col gap-4">

        {/* ── Fixed summary tiles ── */}
        <div className="flex-shrink-0 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                <div className="flex justify-between border-t border-steel-100 pt-1.5 text-base">
                  <span className="font-semibold">Available</span>
                  <span className="font-bold text-accent">{formatTonnage(s.available, s.unit)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Table fills remaining height ── */}
        {!isLoading && stock.length > 0 && (
          <Card className="flex flex-1 flex-col min-h-0">
            <div className="flex-1 min-h-0">
              <DataTable
                data={stock}
                keyField="productId"
                columns={[
                  { key: 'productName', header: 'Product', minWidth: '120px' },
                  { key: 'grade', header: 'Grade', minWidth: '100px' },
                  { key: 'produced', header: 'Produced', render: (r) => formatTonnage(r.produced, r.unit), minWidth: '110px' },
                  { key: 'committed', header: 'Committed', render: (r) => formatTonnage(r.committed, r.unit), minWidth: '110px' },
                  { key: 'dispatched', header: 'Dispatched', render: (r) => formatTonnage(r.dispatched, r.unit), minWidth: '110px' },
                  { key: 'available', header: 'Available', render: (r) => formatTonnage(r.available, r.unit), minWidth: '110px' },
                ]}
                emptyMessage="No products found"
              />
            </div>
          </Card>
        )}

      </div>
    </AppLayout>
  );
}
