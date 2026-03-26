import React, { useState, useCallback } from 'react';
import { Users, Shield, UserPlus, Search, RefreshCw } from 'lucide-react';
import { useUsers, useUpdateUserRole, UserFilters, User } from '@/hooks/admin/useUsers';
import AdminLayout from '@/components/admin/shared/AdminLayout';
import { PageLoading } from '@/components/admin/shared/LoadingSpinner';
import { PageError } from '@/components/admin/shared/ErrorMessage';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
}

function StatsCard({ title, value, icon: Icon }: StatsCardProps) {
  return (
    <div
      className="rounded-lg p-6 shadow-sm"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
            {title}
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>
            {value}
          </p>
        </div>
        <div
          className="p-3 rounded-full"
          style={{ background: 'var(--primary)', opacity: 0.1 }}
        >
          <Icon size={24} style={{ color: 'var(--primary)' }} />
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 20,
    role: 'ALL',
  });
  const [searchInput, setSearchInput] = useState('');
  const [confirmingUserId, setConfirmingUserId] = useState<string | null>(null);

  const {
    data: usersData,
    isLoading,
    error,
    refetch
  } = useUsers(filters);

  const updateRoleMutation = useUpdateUserRole();

  const handleSearch = useCallback(() => {
    setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
  }, [searchInput]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRoleFilter = (role: 'ALL' | 'USER' | 'ADMIN') => {
    setFilters(prev => ({ ...prev, role, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleRoleChange = async (user: User) => {
    if (confirmingUserId === user.id) {
      // User confirmed - proceed with role change
      const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
      try {
        await updateRoleMutation.mutateAsync({ userId: user.id, role: newRole });
        setConfirmingUserId(null);
      } catch (error) {
        console.error('Failed to update role:', error);
        alert(error instanceof Error ? error.message : 'Failed to update role');
        setConfirmingUserId(null);
      }
    } else {
      // First click - show confirmation
      setConfirmingUserId(user.id);
    }
  };

  const handleCancelConfirm = () => {
    setConfirmingUserId(null);
  };

  if (isLoading && !usersData) {
    return (
      <AdminLayout title="User Management">
        <PageLoading text="Loading users..." />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="User Management">
        <PageError message="Failed to load users" onRetry={() => refetch()} />
      </AdminLayout>
    );
  }

  const users = usersData?.data || [];
  const pagination = usersData?.pagination;
  const stats = usersData?.stats;

  return (
    <AdminLayout
      title="User Management"
      description="Manage user accounts and roles"
    >
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>
            User Management
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Manage user accounts and permissions
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-2"
          style={{
            background: 'var(--secondary)',
            color: 'var(--secondary-foreground)',
            borderRadius: '0.5rem',
            padding: '0.5rem 1rem',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
        />
        <StatsCard
          title="Administrators"
          value={stats?.adminCount || 0}
          icon={Shield}
        />
        <StatsCard
          title="New Users (30 days)"
          value={stats?.newUsersCount || 0}
          icon={UserPlus}
        />
      </div>

      {/* Filters */}
      <div
        className="rounded-lg p-4 mb-6"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2"
                size={18}
                style={{ color: 'var(--muted-foreground)' }}
              />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-4 py-2 rounded-lg"
                style={{
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="flex gap-2">
            {(['ALL', 'USER', 'ADMIN'] as const).map((role) => (
              <button
                key={role}
                onClick={() => handleRoleFilter(role)}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  background: filters.role === role ? 'var(--primary)' : 'var(--background)',
                  color: filters.role === role ? 'var(--primary-foreground)' : 'var(--foreground)',
                  border: filters.role === role ? 'none' : '1px solid var(--border)',
                }}
              >
                {role === 'ALL' ? 'All Roles' : role}
              </button>
            ))}
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded-lg font-medium"
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              border: 'none',
            }}
          >
            Search
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--muted)' }}>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center" style={{ color: 'var(--muted-foreground)' }}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-opacity-50" style={{ background: 'var(--card)' }}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center font-medium"
                          style={{
                            background: 'var(--primary)',
                            color: 'var(--primary-foreground)',
                            opacity: 0.8
                          }}
                        >
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                            {user.name || 'No name'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" style={{ color: 'var(--foreground)' }}>
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: user.role === 'ADMIN' ? 'var(--primary)' : 'var(--muted)',
                          color: user.role === 'ADMIN' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                      {new Date(user.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                      {user._count.orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {confirmingUserId === user.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRoleChange(user)}
                            disabled={updateRoleMutation.isPending}
                            className="px-3 py-1 rounded text-xs font-medium"
                            style={{
                              background: user.role === 'ADMIN' ? 'var(--destructive)' : 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              cursor: updateRoleMutation.isPending ? 'not-allowed' : 'pointer',
                              opacity: updateRoleMutation.isPending ? 0.5 : 1,
                            }}
                          >
                            {updateRoleMutation.isPending ? 'Updating...' : 'Confirm'}
                          </button>
                          <button
                            onClick={handleCancelConfirm}
                            className="px-3 py-1 rounded text-xs font-medium"
                            style={{
                              background: 'var(--muted)',
                              color: 'var(--muted-foreground)',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRoleChange(user)}
                          className="px-3 py-1 rounded text-xs font-medium transition-colors"
                          style={{
                            background: 'var(--secondary)',
                            color: 'var(--secondary-foreground)',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {user.role === 'ADMIN' ? 'Make User' : 'Make Admin'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage || isLoading}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(page => {
                  const current = pagination.page;
                  return page === 1 || page === pagination.totalPages ||
                         (page >= current - 2 && page <= current + 2);
                })
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(page)}
                      disabled={isLoading}
                      className="px-3 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: page === pagination.page ? 'var(--primary)' : 'white',
                        color: page === pagination.page ? 'var(--primary-foreground)' : 'var(--secondary)',
                        border: page === pagination.page ? 'none' : '1px solid var(--border)',
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))
              }
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage || isLoading}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>

          <div className="text-sm text-gray-700">
            Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
