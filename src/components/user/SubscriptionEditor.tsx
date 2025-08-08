import React, { useState, useEffect } from 'react';
import { SubscriptionResponse, MenuItemResponse } from '../../lib/api-types';
import styles from '../../styles/components/user/subscription-editor.module.scss';

interface SubscriptionEditorProps {
  subscription: SubscriptionResponse;
  onSave: (updatedItems: Array<{ menuItemId: string; quantity: number }>) => Promise<void>;
  onCancel: () => void;
  isUpdating: boolean;
}

interface EditableItem {
  id: string;
  menuItemId: string;
  menuItem: {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string | null;
    category: string;
  };
  quantity: number;
  originalQuantity: number;
}

const SubscriptionEditor: React.FC<SubscriptionEditorProps> = ({
  subscription,
  onSave,
  onCancel,
  isUpdating
}) => {
  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);
  const [availableMenuItems, setAvailableMenuItems] = useState<MenuItemResponse[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    initializeEditor();
    fetchAvailableMenuItems();
  }, [subscription]);

  useEffect(() => {
    checkForChanges();
  }, [editableItems]);

  const initializeEditor = () => {
    const items: EditableItem[] = subscription.items.map(item => ({
      id: item.id,
      menuItemId: item.menuItem.id,
      menuItem: item.menuItem,
      quantity: item.quantity,
      originalQuantity: item.quantity
    }));
    setEditableItems(items);
  };

  const fetchAvailableMenuItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/menu-items?availability=available');
      
      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }
      
      const data = await response.json();
      setAvailableMenuItems(data.data || []);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to load available menu items');
    } finally {
      setLoading(false);
    }
  };

  const checkForChanges = () => {
    const changed = editableItems.some(item => 
      item.quantity !== item.originalQuantity ||
      !subscription.items.find(original => original.id === item.id)
    ) || editableItems.length !== subscription.items.length;
    
    setHasChanges(changed);
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    setEditableItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    setEditableItems(prev => prev.filter(item => item.id !== itemId));
  };

  const addMenuItem = (menuItem: MenuItemResponse) => {
    // Check if item already exists
    const existingItem = editableItems.find(item => item.menuItemId === menuItem.id);
    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: EditableItem = {
        id: `new-${Date.now()}`,
        menuItemId: menuItem.id,
        menuItem,
        quantity: 1,
        originalQuantity: 0
      };
      setEditableItems(prev => [...prev, newItem]);
    }
    setShowAddItem(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const calculateNewTotal = () => {
    return editableItems.reduce((total, item) => 
      total + (item.menuItem.price * item.quantity), 0
    );
  };

  const calculateSavings = () => {
    const originalTotal = subscription.price;
    const newTotal = calculateNewTotal();
    return originalTotal - newTotal;
  };

  const handleSave = async () => {
    const updatedItems = editableItems
      .filter(item => item.quantity > 0)
      .map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity
      }));

    if (updatedItems.length === 0) {
      alert('Please add at least one item to your subscription.');
      return;
    }

    try {
      await onSave(updatedItems);
    } catch (error) {
      console.error('Failed to save subscription:', error);
    }
  };

  const getAvailableItemsToAdd = () => {
    return availableMenuItems.filter(menuItem => 
      !editableItems.some(item => item.menuItemId === menuItem.id)
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading editor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h3>Error Loading Editor</h3>
        <p>{error}</p>
        <button onClick={fetchAvailableMenuItems} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.subscriptionEditor}>
      {/* Header */}
      <div className={styles.editorHeader}>
        <div className={styles.headerContent}>
          <h2>Edit Subscription Items</h2>
          <p>Adjust quantities or add/remove items from your subscription</p>
        </div>
        
        <div className={styles.pricePreview}>
          <div className={styles.currentPrice}>
            <span className={styles.label}>Current:</span>
            <span className={styles.price}>{formatCurrency(subscription.price)}</span>
          </div>
          <div className={styles.arrow}>→</div>
          <div className={styles.newPrice}>
            <span className={styles.label}>New:</span>
            <span className={styles.price}>{formatCurrency(calculateNewTotal())}</span>
          </div>
          {hasChanges && (
            <div className={`${styles.savings} ${calculateSavings() >= 0 ? styles.positive : styles.negative}`}>
              {calculateSavings() >= 0 ? '−' : '+'}{formatCurrency(Math.abs(calculateSavings()))}
            </div>
          )}
        </div>
      </div>

      {/* Current Items */}
      <div className={styles.currentItems}>
        <div className={styles.sectionHeader}>
          <h3>Current Items</h3>
          <button
            onClick={() => setShowAddItem(true)}
            className={styles.addButton}
            disabled={isUpdating}
          >
            <i className="fas fa-plus"></i>
            Add Item
          </button>
        </div>

        <div className={styles.itemsList}>
          {editableItems.map(item => (
            <div key={item.id} className={styles.editableItem}>
              {item.menuItem.imageUrl && (
                <div className={styles.itemImage}>
                  <img src={item.menuItem.imageUrl} alt={item.menuItem.name} />
                </div>
              )}
              
              <div className={styles.itemDetails}>
                <h4>{item.menuItem.name}</h4>
                <p className={styles.itemDescription}>
                  {item.menuItem.description}
                </p>
                <div className={styles.itemMeta}>
                  <span className={styles.category}>{item.menuItem.category}</span>
                  <span className={styles.unitPrice}>
                    {formatCurrency(item.menuItem.price)} each
                  </span>
                </div>
              </div>

              <div className={styles.quantityControls}>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className={styles.quantityButton}
                  disabled={item.quantity <= 0 || isUpdating}
                >
                  <i className="fas fa-minus"></i>
                </button>
                
                <span className={styles.quantity}>{item.quantity}</span>
                
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className={styles.quantityButton}
                  disabled={isUpdating}
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>

              <div className={styles.itemTotal}>
                <span className={styles.totalPrice}>
                  {formatCurrency(item.menuItem.price * item.quantity)}
                </span>
                {item.quantity !== item.originalQuantity && (
                  <div className={styles.changeIndicator}>
                    {item.quantity > item.originalQuantity ? (
                      <span className={styles.increased}>
                        +{item.quantity - item.originalQuantity}
                      </span>
                    ) : (
                      <span className={styles.decreased}>
                        {item.quantity - item.originalQuantity}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => removeItem(item.id)}
                className={styles.removeButton}
                disabled={isUpdating}
                title="Remove item"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItem && (
        <div className={styles.modalOverlay} onClick={() => setShowAddItem(false)}>
          <div className={styles.addItemModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Menu Item</h3>
              <button
                onClick={() => setShowAddItem(false)}
                className={styles.closeButton}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.availableItems}>
                {getAvailableItemsToAdd().map(menuItem => (
                  <div key={menuItem.id} className={styles.availableItem}>
                    {menuItem.imageUrl && (
                      <div className={styles.availableItemImage}>
                        <img src={menuItem.imageUrl} alt={menuItem.name} />
                      </div>
                    )}
                    
                    <div className={styles.availableItemDetails}>
                      <h4>{menuItem.name}</h4>
                      <p>{menuItem.description}</p>
                      <div className={styles.availableItemMeta}>
                        <span className={styles.category}>{menuItem.category}</span>
                        <span className={styles.price}>{formatCurrency(menuItem.price)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => addMenuItem(menuItem)}
                      className={styles.addItemButton}
                    >
                      <i className="fas fa-plus"></i>
                      Add
                    </button>
                  </div>
                ))}
              </div>

              {getAvailableItemsToAdd().length === 0 && (
                <div className={styles.noItems}>
                  <p>All available menu items are already in your subscription.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={styles.editorActions}>
        <button
          onClick={onCancel}
          className={styles.cancelButton}
          disabled={isUpdating}
        >
          Cancel
        </button>
        
        <div className={styles.saveSection}>
          {hasChanges && (
            <div className={styles.changesIndicator}>
              <i className="fas fa-info-circle"></i>
              You have unsaved changes
            </div>
          )}
          
          <button
            onClick={handleSave}
            className={styles.saveButton}
            disabled={!hasChanges || isUpdating || editableItems.length === 0}
          >
            {isUpdating ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className={styles.editorSummary}>
        <div className={styles.summaryItem}>
          <span>Total items:</span>
          <span>{editableItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
        </div>
        <div className={styles.summaryItem}>
          <span>New total:</span>
          <span className={styles.totalAmount}>{formatCurrency(calculateNewTotal())}</span>
        </div>
        <div className={styles.summaryItem}>
          <span>Billing cycle:</span>
          <span>{subscription.interval}</span>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionEditor;