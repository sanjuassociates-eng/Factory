import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Factory } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Permission } from '@steel-factory/shared';
import { cn } from '@/lib/utils';
import { Button } from './ui/Button';

interface NavItem {
  label: string;
  href: string;
  permission?: Permission;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/home' },
  { label: 'Log Production', href: '/production', permission: Permission.LOG_PRODUCTION },
  { label: 'Stock', href: '/stock', permission: Permission.DISPATCH_VEHICLES },
  { label: 'Vehicles', href: '/vehicles', permission: Permission.DISPATCH_VEHICLES },
  { label: 'Revenue', href: '/revenue', permission: Permission.VIEW_REVENUE },
  { label: 'Buyers', href: '/buyers', permission: Permission.MANAGE_BUYERS },
  { label: 'Products', href: '/products', permission: Permission.MANAGE_PRODUCTS },
  { label: 'Users', href: '/users', permission: Permission.MANAGE_USERS },
  { label: 'Audit Logs', href: '/audit', permission: Permission.VIEW_AUDIT },
];

export function AppLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const { user, logout, can } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleItems = navItems.filter(
    (item) => !item.permission || can(item.permission),
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (href: string) =>
    href === '/home'
      ? location.pathname === href
      : location.pathname.startsWith(href);

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {visibleItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          onClick={onClick}
          className={cn(
            'block rounded-lg px-4 py-2.5 text-sm font-medium min-h-11 md:min-h-0',
            isActive(item.href)
              ? 'bg-accent text-white'
              : 'text-steel-700 hover:bg-steel-100',
          )}
        >
          {item.label}
        </Link>
      ))}
    </>
  );

  return (
    /* Full-viewport shell — nothing outside scrolls */
    <div className="flex h-screen flex-col overflow-hidden bg-steel-50">

      {/* ── Mobile sticky header ── */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-steel-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <Factory className="h-6 w-6 text-accent" />
          <span className="font-semibold">Steel Factory</span>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 hover:bg-steel-100"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* ── Mobile slide-in drawer ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <nav className="absolute right-0 top-0 h-full w-72 overflow-y-auto bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{user?.name}</p>
                <p className="text-xs text-steel-600">
                  {user?.isAdmin ? 'Admin' : user?.permissions.length ? 'Staff' : 'Viewer'}
                </p>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              <NavLinks onClick={() => setMenuOpen(false)} />
            </div>
            <Button
              variant="ghost"
              className="mt-6 w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </nav>
        </div>
      )}

      {/* ── Body row: sidebar + main ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop sidebar — fixed height, scrolls independently if nav is long */}
        <aside className="hidden w-56 flex-shrink-0 flex-col overflow-y-auto border-r border-steel-200 bg-white md:flex">
          <div className="flex items-center gap-2 border-b border-steel-200 px-5 py-5">
            <Factory className="h-7 w-7 text-accent" />
            <div>
              <p className="font-bold text-steel-900">Steel Factory</p>
              <p className="text-xs text-steel-600">
                {user?.isAdmin ? 'Admin' : 'Staff'}
              </p>
            </div>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            <NavLinks />
          </nav>
          <div className="border-t border-steel-200 p-4">
            <p className="mb-1 truncate text-sm font-medium">{user?.name}</p>
            <p className="mb-3 truncate text-xs text-steel-500">{user?.email}</p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </aside>

        {/* Main content — fixed height, only THIS pane scrolls */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden p-4 md:p-8">
            <h1 className="mb-5 flex-shrink-0 text-2xl font-bold text-steel-900 md:text-3xl">
              {title}
            </h1>
            {/* Each page controls its own scroll strategy via h-full or natural flow */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {children}
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}
