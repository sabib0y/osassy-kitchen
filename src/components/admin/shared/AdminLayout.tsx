import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Repeat, 
  Utensils, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: Repeat },
  { name: 'Menu Items', href: '/admin/menu', icon: Utensils },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ 
        background: 'var(--sidebar)', 
        color: 'var(--sidebar-foreground)', 
        borderRight: '1px solid var(--sidebar-border)',
        minWidth: '220px',
        width: '220px'
      }}>
        <div className="flex items-center gap-2 mb-8 px-4 py-6">
          <img 
            src="https://placehold.co/40x40" 
            alt="Osassy's Kitchen" 
            className="w-10 h-10 rounded-full"
          />
          <span className="font-bold text-lg">Osassy Admin</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto p-2 rounded-md hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-2">
          {navigation.map((item) => {
            const isActive = router.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className="sidebar-link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  color: isActive ? 'var(--sidebar-primary-foreground)' : 'var(--sidebar-foreground)',
                  background: isActive ? 'var(--sidebar-primary)' : 'transparent',
                  transition: 'background 0.2s'
                }}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {session?.user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session?.user?.name || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 min-h-screen" style={{ background: 'var(--background)' }}>
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex h-16 items-center gap-x-4 mb-6 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1 text-lg font-semibold">
            {title || 'Admin Dashboard'}
          </div>
        </div>

        {/* Page header - Desktop */}
        {(title || description) && (
          <div className="hidden lg:flex items-center justify-between mb-6">
            <div>
              {title && (
                <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-1" style={{ color: 'var(--secondary)' }}>
                  {description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Page content */}
        {children}
      </main>
    </div>
  );
}
