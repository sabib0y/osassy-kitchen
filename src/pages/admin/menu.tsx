import React, { useState } from 'react';
import { Plus, Eye } from 'lucide-react';
import AdminLayout from '@/components/admin/shared/AdminLayout';
import MenuStats from '@/components/admin/menu/MenuStats';
import MenuFilters from '@/components/admin/menu/MenuFilters';
import MenuGrid from '@/components/admin/menu/MenuGrid';
import { useMenu } from '@/hooks/admin/useMenu';
import { MenuItem, MenuItemFilters } from '@/types/admin';

export default function MenuManagement() {
  const [filters, setFilters] = useState<MenuItemFilters>({
    page: 1,
    limit: 12
  });
  
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const {
    data: menuData,
    stats,
    isLoading,
    error,
    refetch,
    toggleAvailability,
    deleteItem
  } = useMenu(filters);

  const handleFiltersChange = (newFilters: MenuItemFilters) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    refetch();
  };

  const handleCreateItem = () => {
    setSelectedItem(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setSelectedItem(item);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteItem.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete menu item:', error);
    }
  };

  const handleToggleAvailability = async (id: string) => {
    try {
      await toggleAvailability.mutateAsync(id);
    } catch (error) {
      console.error('Failed to toggle availability:', error);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    refetch();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Menu Management</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--secondary)' }}>
              Manage your restaurant menu items, categories, and availability
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => alert('Bulk toggle functionality not implemented yet')}
              className="btn-secondary inline-flex items-center gap-2"
              style={{
                background: 'var(--secondary)',
                color: 'var(--secondary-foreground)',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontWeight: '600',
                transition: 'background 0.2s',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Eye className="w-4 h-4" />
              Bulk Toggle
            </button>
            <button
              onClick={handleCreateItem}
              className="btn-primary inline-flex items-center gap-2"
              style={{
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontWeight: '600',
                transition: 'background 0.2s',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Plus className="w-4 h-4" />
              Add Menu Item
            </button>
          </div>
        </div>

        {/* Stats */}
        <MenuStats />

        {/* Filters */}
        <MenuFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onApplyFilters={handleApplyFilters}
          isLoading={isLoading}
        />

        {/* Menu Grid */}
        <MenuGrid
          items={menuData?.data}
          isLoading={isLoading}
          error={error}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
          onToggleAvailability={handleToggleAvailability}
        />

        {/* Pagination */}
        {menuData?.pagination && menuData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => handleFiltersChange({ ...filters, page: Math.max(1, filters.page! - 1) })}
                disabled={filters.page === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handleFiltersChange({ ...filters, page: Math.min(menuData.pagination.totalPages, filters.page! + 1) })}
                disabled={filters.page === menuData.pagination.totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--secondary)' }}>
                  Showing{' '}
                  <span className="font-medium">
                    {(filters.page! - 1) * filters.limit! + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(filters.page! * filters.limit!, menuData.pagination.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{menuData.pagination.total}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => handleFiltersChange({ ...filters, page: Math.max(1, filters.page! - 1) })}
                    disabled={filters.page === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      color: 'var(--secondary)',
                      border: '1px solid var(--border)',
                      background: 'white',
                      cursor: filters.page === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {Array.from({ length: Math.min(5, menuData.pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handleFiltersChange({ ...filters, page: pageNum })}
                        className="relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20"
                        style={{
                          background: filters.page === pageNum ? 'var(--primary)' : 'white',
                          color: filters.page === pageNum ? 'var(--primary-foreground)' : 'var(--foreground)',
                          border: filters.page === pageNum ? 'none' : '1px solid var(--border)',
                          cursor: 'pointer'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handleFiltersChange({ ...filters, page: Math.min(menuData.pagination.totalPages, filters.page! + 1) })}
                    disabled={filters.page === menuData.pagination.totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      color: 'var(--secondary)',
                      border: '1px solid var(--border)',
                      background: 'white',
                      cursor: filters.page === menuData.pagination.totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
