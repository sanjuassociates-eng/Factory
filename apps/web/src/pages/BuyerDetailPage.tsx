import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, Truck, IndianRupee } from 'lucide-react';
import api from '@/lib/api';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/DataTable';
import { formatCurrency, formatTonnage, vehicleTotal } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface VehicleItem {
  id: string;
  tonnage: number;
  pricePerUnit: number;
  product: { name: string; grade: string; unit: string };
}

interface Vehicle {
  id: string;
  vehicleNumber: string;
  driverName?: string;
  status: string;
  pickedUpAt?: string;
  createdAt: string;
  registrar: { name: string };
  items: VehicleItem[];
}

interface BuyerDetail {
  id: string;
  name: string;
  contact?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  vehicles: Vehicle[];
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function BuyerDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: buyer, isLoading } = useQuery<BuyerDetail>({
    queryKey: ['buyer', id],
    queryFn: () => api.get(`/buyers/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <AppLayout title="Buyer">
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (!buyer) {
    return (
      <AppLayout title="Buyer not found">
        <p>Buyer not found.</p>
      </AppLayout>
    );
  }

  const activeVehicles = buyer.vehicles.filter((v) => v.status !== 'CANCELLED');
  const pickedUp = buyer.vehicles.filter((v) => v.status === 'PICKED_UP');
  const totalRevenue = pickedUp.reduce((sum, v) => sum + vehicleTotal(v.items), 0);
  const totalTonnage = pickedUp.reduce(
    (sum, v) => sum + v.items.reduce((s, i) => s + i.tonnage, 0),
    0,
  );

  return (
    <AppLayout title={buyer.name}>
      {/* Back link */}
      <Link to="/buyers" className="mb-4 inline-flex items-center gap-1 text-sm text-steel-500 hover:text-steel-900">
        <ArrowLeft className="h-4 w-4" />
        All Buyers
      </Link>

      {/* Header card */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-steel-900">{buyer.name}</h2>
            {buyer.contact && <p className="text-steel-500">{buyer.contact}</p>}
            {buyer.address && <p className="text-steel-500">{buyer.address}</p>}
          </div>
          <span className={cn('rounded-full px-3 py-1 text-xs font-medium',
            buyer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700')}>
            {buyer.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-steel-100 pt-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-steel-900">
              <Truck className="h-5 w-5 text-accent" />
              {activeVehicles.length}
            </div>
            <p className="text-xs text-steel-500">Total Vehicles</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-steel-900">
              <Package className="h-5 w-5 text-accent" />
              {formatTonnage(totalTonnage)}
            </div>
            <p className="text-xs text-steel-500">Dispatched</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-700">
              <IndianRupee className="h-5 w-5" />
              {new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(totalRevenue)}
            </div>
            <p className="text-xs text-steel-500">Revenue</p>
          </div>
        </div>
      </Card>

      {/* Transaction history */}
      <Card>
        <CardTitle>Transaction History</CardTitle>
        {buyer.vehicles.length === 0 ? (
          <p className="py-8 text-center text-steel-500">No vehicles registered yet</p>
        ) : (
          <div className="mt-4 space-y-4">
            {buyer.vehicles.map((v) => {
              const total = vehicleTotal(v.items);
              const isCancelled = v.status === 'CANCELLED';
              return (
                <div
                  key={v.id}
                  className={cn(
                    'rounded-lg border p-4',
                    isCancelled
                      ? 'border-red-100 bg-red-50 opacity-60'
                      : 'border-steel-200 bg-white',
                  )}
                >
                  {/* Vehicle header */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Truck className="h-4 w-4 text-steel-400" />
                      <span className="font-bold tracking-wide text-steel-900">{v.vehicleNumber}</span>
                      {v.driverName && (
                        <span className="text-sm text-steel-500">{v.driverName}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={v.status} />
                      <span className="text-xs text-steel-400">{fmt(v.createdAt)}</span>
                    </div>
                  </div>

                  {/* Line items */}
                  <div className="mt-3 space-y-2">
                    {v.items.map((item) => {
                      const lineTotal = item.tonnage * item.pricePerUnit;
                      return (
                        <div
                          key={item.id}
                          className="grid grid-cols-[1fr_auto] gap-2 rounded bg-steel-50 px-3 py-2 text-sm sm:grid-cols-[1fr_120px_120px_120px]"
                        >
                          <span className="font-medium text-steel-800">
                            {item.product.name}{' '}
                            <span className="text-steel-500">({item.product.grade})</span>
                          </span>
                          <span className="text-right text-steel-700">
                            {formatTonnage(item.tonnage, item.product.unit)}
                          </span>
                          <span className="text-right text-steel-500">
                            {item.pricePerUnit > 0
                              ? `@ ${formatCurrency(item.pricePerUnit)}/MT`
                              : '—'}
                          </span>
                          <span className="text-right font-semibold text-steel-900">
                            {lineTotal > 0 ? formatCurrency(lineTotal) : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-steel-100 pt-3 text-xs text-steel-500">
                    <span>Registered by {v.registrar.name}</span>
                    {v.pickedUpAt && (
                      <span>Picked up {fmtTime(v.pickedUpAt)}</span>
                    )}
                    {total > 0 && (
                      <div className="ml-auto flex items-center gap-2">
                        <span>Invoice Total</span>
                        <span className="text-base font-bold text-steel-900">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </AppLayout>
  );
}
