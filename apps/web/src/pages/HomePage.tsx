import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Package,
  Truck,
  Users,
  ClipboardList,
  Settings,
  ShieldCheck,
  TrendingUp,
  IndianRupee,
  BarChart2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Permission, StockBalance } from '@steel-factory/shared';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/Card';
import { formatTonnage, formatCurrency } from '@/lib/utils';
import api from '@/lib/api';

const ACTIONS = [
  {
    label: 'Log Production',
    description: 'Record daily steel output',
    href: '/production',
    icon: TrendingUp,
    permission: Permission.LOG_PRODUCTION,
  },
  {
    label: 'Dispatch Vehicle',
    description: 'Register or dispatch a vehicle',
    href: '/vehicles',
    icon: Truck,
    permission: Permission.DISPATCH_VEHICLES,
  },
  {
    label: 'Manage Buyers',
    description: 'Add or update buyer records',
    href: '/buyers',
    icon: Users,
    permission: Permission.MANAGE_BUYERS,
  },
  {
    label: 'Products',
    description: 'Manage product types and grades',
    href: '/products',
    icon: Package,
    permission: Permission.MANAGE_PRODUCTS,
  },
  {
    label: 'User Management',
    description: 'Create users and set permissions',
    href: '/users',
    icon: Settings,
    permission: Permission.MANAGE_USERS,
  },
  {
    label: 'Audit Logs',
    description: 'View system activity history',
    href: '/audit',
    icon: ShieldCheck,
    permission: Permission.VIEW_AUDIT,
  },
  {
    label: 'Revenue Report',
    description: 'Daily revenue realization history',
    href: '/revenue',
    icon: BarChart2,
    permission: Permission.VIEW_REVENUE,
  },
  {
    label: 'Stock Overview',
    description: 'Current stock and dispatch status',
    href: '/stock',
    icon: ClipboardList,
    permission: Permission.DISPATCH_VEHICLES,
  },
];

export function HomePage() {
  const { can, user } = useAuth();

  const { data: stock = [] } = useQuery({
    queryKey: ['stock'],
    queryFn: () => api.get<StockBalance[]>('/stock').then((r) => r.data),
  });

  const { data: revenueData } = useQuery<{ total: number }>({
    queryKey: ['revenue-today'],
    queryFn: () => api.get('/vehicles/revenue/today').then((r) => r.data),
    enabled: can(Permission.VIEW_REVENUE),
  });

  const visible = ACTIONS.filter((a) => can(a.permission));
  const totalAvailable = stock.reduce((s, b) => s + b.available, 0);
  const todayRevenue = revenueData?.total ?? 0;

  return (
    <AppLayout title={`Welcome, ${user?.name ?? ''}!`}>
      {/* Summary stats */}
      {(stock.length > 0 || can(Permission.DISPATCH_VEHICLES)) && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stock.length > 0 && (
            <Card>
              <p className="text-sm text-steel-600">Total Available Stock</p>
              <p className="mt-1 text-2xl font-bold text-accent">{formatTonnage(totalAvailable)}</p>
            </Card>
          )}
          {can(Permission.VIEW_REVENUE) && (
            <Card className="border-green-200 bg-green-50">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-700 font-medium">Today's Revenue</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-green-800">
                {formatCurrency(todayRevenue)}
              </p>
              <p className="text-xs text-green-600">realized (picked up today)</p>
            </Card>
          )}
          {stock.slice(0, can(Permission.DISPATCH_VEHICLES) ? 2 : 3).map((s) => (
            <Card key={s.productId}>
              <p className="text-sm text-steel-600">
                {s.productName} ({s.grade})
              </p>
              <p className="mt-1 text-xl font-bold">{formatTonnage(s.available, s.unit)}</p>
              <p className="text-xs text-steel-500">available</p>
            </Card>
          ))}
        </div>
      )}

      {visible.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} to={action.href}>
                <Card className="flex items-start gap-4 transition-shadow hover:shadow-md cursor-pointer">
                  <div className="rounded-lg bg-accent/10 p-3">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-steel-900">{action.label}</p>
                    <p className="text-sm text-steel-600">{action.description}</p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <p className="text-steel-600">
            No actions available. Contact your admin to assign permissions.
          </p>
        </Card>
      )}
    </AppLayout>
  );
}
