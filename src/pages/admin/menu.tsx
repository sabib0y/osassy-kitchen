import React, { useState } from 'react';
import { Plus, ToggleLeft } from 'lucide-react';
import AdminLayout from '@/components/admin/shared/AdminLayout';
import MenuStats from '@/components/admin/menu/MenuStats';
import MenuFilters from '@/components/admin/menu/MenuFilters';
import MenuGrid from '@/components/admin/menu/MenuGrid';
import MenuItemModal from '@/components/admin/menu/MenuItemModal';
import { useMenu } from '@/hooks/admin/useMenu';
import { MenuItem, MenuItemFilters } from '@/types/admin';
import styles from '@/styles/components/admin/menu.module.scss';

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
      <div className={styles.menuManagement}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h1>Menu Management</h1>
            <p>Manage your restaurant menu items and pricing</p>
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={() => alert('Bulk toggle functionality not implemented yet')}
              className="btn-secondary"
            >
              <ToggleLeft size={18} />
              Bulk Toggle
            </button>
            <button
              onClick={handleCreateItem}
              className="btn-primary"
            >
              <Plus size={18} />
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
          <div className={styles.pagination}>
            <div className={styles.paginationInfo}>
              Showing {((filters.page! - 1) * filters.limit!) + 1} to{' '}
              {Math.min(filters.page! * filters.limit!, menuData.pagination.total)} of{' '}
              {menuData.pagination.total} items
            </div>
            
            <div className={styles.paginationControls}>
              <button
                onClick={() => handleFiltersChange({ ...filters, page: Math.max(1, filters.page! - 1) })}
                disabled={filters.page === 1}
                className="btn-secondary"
              >
                Previous
              </button>
              <button
                onClick={() => handleFiltersChange({ ...filters, page: Math.min(menuData.pagination.totalPages, filters.page! + 1) })}
                disabled={filters.page === menuData.pagination.totalPages}
                className="btn-primary"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Menu Item Modal */}
        <MenuItemModal
          item={selectedItem}
          isOpen={isModalOpen}
          mode={modalMode}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      </div>
    </AdminLayout>
  );
}