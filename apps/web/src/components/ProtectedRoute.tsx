import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Permission } from '@steel-factory/shared';

interface Props {
  permission?: Permission;
}

export function ProtectedRoute({ permission }: Props) {
  const { user, loading, can } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (permission && !can(permission)) return <Navigate to="/home" replace />;

  return <Outlet />;
}
