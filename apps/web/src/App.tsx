import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Permission } from '@steel-factory/shared';
import { LoginPage } from '@/pages/LoginPage';
import { HomePage } from '@/pages/HomePage';
import { ProductionPage } from '@/pages/ProductionPage';
import { StockPage } from '@/pages/StockPage';
import { VehiclesPage } from '@/pages/VehiclesPage';
import { BuyersPage } from '@/pages/BuyersPage';
import { BuyerDetailPage } from '@/pages/BuyerDetailPage';
import { RevenuePage } from '@/pages/RevenuePage';
import { ProductsPage } from '@/pages/ProductsPage';
import { UsersPage } from '@/pages/UsersPage';
import { AuditPage } from '@/pages/AuditPage';

const qc = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/home" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RootRedirect />} />

            {/* All authenticated routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/home" element={<HomePage />} />
            </Route>

            <Route element={<ProtectedRoute permission={Permission.LOG_PRODUCTION} />}>
              <Route path="/production" element={<ProductionPage />} />
            </Route>

            <Route element={<ProtectedRoute permission={Permission.DISPATCH_VEHICLES} />}>
              <Route path="/stock" element={<StockPage />} />
              <Route path="/vehicles" element={<VehiclesPage />} />
            </Route>

            <Route element={<ProtectedRoute permission={Permission.VIEW_REVENUE} />}>
              <Route path="/revenue" element={<RevenuePage />} />
            </Route>

            <Route element={<ProtectedRoute permission={Permission.MANAGE_BUYERS} />}>
              <Route path="/buyers" element={<BuyersPage />} />
              <Route path="/buyers/:id" element={<BuyerDetailPage />} />
            </Route>

            <Route element={<ProtectedRoute permission={Permission.MANAGE_PRODUCTS} />}>
              <Route path="/products" element={<ProductsPage />} />
            </Route>

            <Route element={<ProtectedRoute permission={Permission.MANAGE_USERS} />}>
              <Route path="/users" element={<UsersPage />} />
            </Route>

            <Route element={<ProtectedRoute permission={Permission.VIEW_AUDIT} />}>
              <Route path="/audit" element={<AuditPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
