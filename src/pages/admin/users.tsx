import React, { useState, useCallback } from 'react';
import { Users, Shield, UserPlus, Search, RefreshCw } from 'lucide-react';
import { useUsers, useUpdateUserRole, UserFilters, User } from '@/hooks/admin/useUsers';
import AdminLayout from '@/components/admin/shared/AdminLayout';
import { PageLoading } from '@/components/admin/shared/LoadingSpinner';
import { PageError } from '@/components/admin/shared/ErrorMessage';
import styles from '@/styles/components/admin/users.module.scss';

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
    <AdminLayout title="User Management" description="Manage user accounts and roles">
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>User Management</h1>
          <p className={styles.pageDescription}>Manage user accounts and permissions</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className={`${styles.refreshBtn} ${isLoading ? styles.loading : ''}`}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statsCard}>
          <div className={styles.statsIcon}>
            <Users size={24} />
          </div>
          <div className={styles.statsContent}>
            <p className={styles.statsLabel}>Total Users</p>
            <p className={styles.statsValue}>{stats?.totalUsers || 0}</p>
          </div>
        </div>

        <div className={styles.statsCard}>
          <div className={styles.statsIcon}>
            <Shield size={24} />
          </div>
          <div className={styles.statsContent}>
            <p className={styles.statsLabel}>Administrators</p>
            <p className={styles.statsValue}>{stats?.adminCount || 0}</p>
          </div>
        </div>

        <div className={styles.statsCard}>
          <div className={styles.statsIcon}>
            <UserPlus size={24} />
          </div>
          <div className={styles.statsContent}>
            <p className={styles.statsLabel}>New Users (30 days)</p>
            <p className={styles.statsValue}>{stats?.newUsersCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersCard}>
        <div className={styles.filtersRow}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.roleFilters}>
            {(['ALL', 'USER', 'ADMIN'] as const).map((role) => (
              <button
                key={role}
                onClick={() => handleRoleFilter(role)}
                className={`${styles.roleBtn} ${filters.role === role ? styles.active : ''}`}
              >
                {role === 'ALL' ? 'All' : role}
              </button>
            ))}
          </div>

          <button onClick={handleSearch} className={styles.searchBtn}>
            <Search size={16} />
            Search
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Orders</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyRow}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.avatar}>
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <span className={styles.userName}>{user.name || 'No name'}</span>
                      </div>
                    </td>
                    <td className={styles.emailCell}>{user.email}</td>
                    <td>
                      <span className={`${styles.roleBadge} ${user.role === 'ADMIN' ? styles.admin : styles.user}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className={styles.dateCell}>
                      {new Date(user.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className={styles.ordersCell}>{user._count.orders}</td>
                    <td>
                      {confirmingUserId === user.id ? (
                        <div className={styles.actionGroup}>
                          <button
                            onClick={() => handleRoleChange(user)}
                            disabled={updateRoleMutation.isPending}
                            className={`${styles.actionBtn} ${styles.confirm}`}
                          >
                            {updateRoleMutation.isPending ? 'Updating...' : 'Confirm'}
                          </button>
                          <button
                            onClick={handleCancelConfirm}
                            className={`${styles.actionBtn} ${styles.cancel}`}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRoleChange(user)}
                          className={`${styles.actionBtn} ${user.role === 'ADMIN' ? styles.makeUser : styles.makeAdmin}`}
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
        <div className={styles.pagination}>
          <div className={styles.paginationNav}>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage || isLoading}
              className={styles.pageBtn}
            >
              Previous
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(page => {
                const current = pagination.page;
                return page === 1 || page === pagination.totalPages ||
                       (page >= current - 2 && page <= current + 2);
              })
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className={styles.pageEllipsis}>...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(page)}
                    disabled={isLoading}
                    className={`${styles.pageBtn} ${page === pagination.page ? styles.active : ''}`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))
            }

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage || isLoading}
              className={styles.pageBtn}
            >
              Next
            </button>
          </div>

          <div className={styles.paginationInfo}>
            Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} users)
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
