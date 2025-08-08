import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Address, AddressFormData, AddressFormErrors } from '../../types/user';
import styles from '../../styles/components/user/profile.module.scss';

interface AddressManagerProps {
  addresses: Address[];
  onAddressChange: () => void;
}

interface AddressModalProps {
  address?: Address;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AddressFormData) => Promise<void>;
}

const AddressModal: React.FC<AddressModalProps> = ({ address, isOpen, onClose, onSave }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<AddressFormData>({
    defaultValues: {
      type: address?.type || 'HOME',
      label: address?.label || '',
      street: address?.street || '',
      city: address?.city || '',
      state: address?.state || '',
      postalCode: address?.postalCode || '',
      country: address?.country || 'United Kingdom',
      isDefault: address?.isDefault || false,
      deliveryInstructions: address?.deliveryInstructions || ''
    }
  });

  const onSubmit = async (data: AddressFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onSave(data);
      reset();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save address');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>
            <i className="fas fa-map-marker-alt"></i>
            {address ? 'Edit Address' : 'Add New Address'}
          </h3>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className={styles.modalContent}>
          {error && (
            <div className={`${styles.alert} ${styles.error}`}>
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.formGrid}>
              {/* Address Type and Label */}
              <div className={styles.formGroup}>
                <label htmlFor="type" className={styles.label}>
                  <i className="fas fa-tag"></i>
                  Address Type *
                </label>
                <select
                  id="type"
                  className={`${styles.select} ${errors.type ? styles.inputError : ''}`}
                  {...register('type', { required: 'Address type is required' })}
                  disabled={isSubmitting}
                >
                  <option value="HOME">Home</option>
                  <option value="WORK">Work</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.type && (
                  <span className={styles.errorMessage}>{errors.type.message}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="label" className={styles.label}>
                  <i className="fas fa-bookmark"></i>
                  Address Label *
                </label>
                <input
                  id="label"
                  type="text"
                  className={`${styles.input} ${errors.label ? styles.inputError : ''}`}
                  placeholder="e.g., My Home, Office, Parents' House"
                  {...register('label', {
                    required: 'Address label is required',
                    minLength: { value: 2, message: 'Label must be at least 2 characters' },
                    maxLength: { value: 30, message: 'Label must be less than 30 characters' }
                  })}
                  disabled={isSubmitting}
                />
                {errors.label && (
                  <span className={styles.errorMessage}>{errors.label.message}</span>
                )}
              </div>

              {/* Street Address */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label htmlFor="street" className={styles.label}>
                  <i className="fas fa-road"></i>
                  Street Address *
                </label>
                <input
                  id="street"
                  type="text"
                  className={`${styles.input} ${errors.street ? styles.inputError : ''}`}
                  placeholder="Enter your street address"
                  {...register('street', {
                    required: 'Street address is required',
                    minLength: { value: 5, message: 'Street address must be at least 5 characters' }
                  })}
                  disabled={isSubmitting}
                />
                {errors.street && (
                  <span className={styles.errorMessage}>{errors.street.message}</span>
                )}
              </div>

              {/* City and State */}
              <div className={styles.formGroup}>
                <label htmlFor="city" className={styles.label}>
                  <i className="fas fa-city"></i>
                  City *
                </label>
                <input
                  id="city"
                  type="text"
                  className={`${styles.input} ${errors.city ? styles.inputError : ''}`}
                  placeholder="Enter city"
                  {...register('city', {
                    required: 'City is required',
                    minLength: { value: 2, message: 'City must be at least 2 characters' }
                  })}
                  disabled={isSubmitting}
                />
                {errors.city && (
                  <span className={styles.errorMessage}>{errors.city.message}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="state" className={styles.label}>
                  <i className="fas fa-map"></i>
                  County/State *
                </label>
                <input
                  id="state"
                  type="text"
                  className={`${styles.input} ${errors.state ? styles.inputError : ''}`}
                  placeholder="Enter county or state"
                  {...register('state', {
                    required: 'County/State is required'
                  })}
                  disabled={isSubmitting}
                />
                {errors.state && (
                  <span className={styles.errorMessage}>{errors.state.message}</span>
                )}
              </div>

              {/* Postal Code and Country */}
              <div className={styles.formGroup}>
                <label htmlFor="postalCode" className={styles.label}>
                  <i className="fas fa-mail-bulk"></i>
                  Postal Code *
                </label>
                <input
                  id="postalCode"
                  type="text"
                  className={`${styles.input} ${errors.postalCode ? styles.inputError : ''}`}
                  placeholder="Enter postal code"
                  {...register('postalCode', {
                    required: 'Postal code is required',
                    pattern: {
                      value: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$|^\d{5}(-\d{4})?$/i,
                      message: 'Please enter a valid postal code'
                    }
                  })}
                  disabled={isSubmitting}
                />
                {errors.postalCode && (
                  <span className={styles.errorMessage}>{errors.postalCode.message}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="country" className={styles.label}>
                  <i className="fas fa-globe"></i>
                  Country *
                </label>
                <select
                  id="country"
                  className={`${styles.select} ${errors.country ? styles.inputError : ''}`}
                  {...register('country', { required: 'Country is required' })}
                  disabled={isSubmitting}
                >
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Ireland">Ireland</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                </select>
                {errors.country && (
                  <span className={styles.errorMessage}>{errors.country.message}</span>
                )}
              </div>

              {/* Delivery Instructions */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label htmlFor="deliveryInstructions" className={styles.label}>
                  <i className="fas fa-clipboard-list"></i>
                  Delivery Instructions (Optional)
                </label>
                <textarea
                  id="deliveryInstructions"
                  className={styles.textarea}
                  placeholder="Any special delivery instructions..."
                  rows={3}
                  {...register('deliveryInstructions')}
                  disabled={isSubmitting}
                />
              </div>

              {/* Default Address Checkbox */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <div className={styles.checkboxGroup}>
                  <input
                    id="isDefault"
                    type="checkbox"
                    className={styles.checkbox}
                    {...register('isDefault')}
                    disabled={isSubmitting}
                  />
                  <label htmlFor="isDefault" className={styles.checkboxLabel}>
                    <i className="fas fa-star"></i>
                    Set as default delivery address
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className={styles.buttonSpinner}></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Save Address
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const AddressManager: React.FC<AddressManagerProps> = ({ addresses, onAddressChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddAddress = () => {
    setEditingAddress(undefined);
    setIsModalOpen(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to delete address');
      }

      onAddressChange();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete address');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user/addresses/${addressId}/default`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to set default address');
      }

      onAddressChange();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to set default address');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async (data: AddressFormData) => {
    const url = editingAddress 
      ? `/api/user/addresses/${editingAddress.id}`
      : '/api/user/addresses';
    
    const method = editingAddress ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to save address');
    }

    onAddressChange();
  };

  const getAddressTypeIcon = (type: Address['type']) => {
    switch (type) {
      case 'HOME': return 'fa-home';
      case 'WORK': return 'fa-briefcase';
      case 'OTHER': return 'fa-map-pin';
      default: return 'fa-map-marker-alt';
    }
  };

  return (
    <div className={styles.addressManager}>
      {error && (
        <div className={`${styles.alert} ${styles.error}`}>
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      <div className={styles.addressHeader}>
        <button 
          className={styles.primaryButton}
          onClick={handleAddAddress}
          disabled={loading}
        >
          <i className="fas fa-plus"></i>
          Add New Address
        </button>
      </div>

      {loading && addresses.length === 0 ? (
        <div className={styles.loadingGrid}>
          {[...Array(2)].map((_, i) => (
            <div key={i} className={styles.addressCardSkeleton}>
              <div className={styles.skeletonLine}></div>
              <div className={styles.skeletonLine}></div>
              <div className={styles.skeletonLine}></div>
            </div>
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className={styles.emptyState}>
          <i className="fas fa-map-marker-alt"></i>
          <h3>No Delivery Addresses</h3>
          <p>Add your first delivery address to start ordering</p>
        </div>
      ) : (
        <div className={styles.addressGrid}>
          {addresses.map((address) => (
            <div key={address.id} className={styles.addressCard} data-testid="address-card">
              <div className={styles.addressCardHeader}>
                <div className={styles.addressType}>
                  <i className={`fas ${getAddressTypeIcon(address.type)}`}></i>
                  <span>{address.label}</span>
                </div>
                {address.isDefault && (
                  <div className={`${styles.badge} ${styles.success}`}>
                    <i className="fas fa-star"></i>
                    Default
                  </div>
                )}
              </div>

              <div className={styles.addressContent}>
                <address>
                  <strong>{address.street}</strong><br />
                  {address.city}, {address.state}<br />
                  {address.postalCode}<br />
                  {address.country}
                </address>
                
                {address.deliveryInstructions && (
                  <div className={styles.deliveryNotes}>
                    <i className="fas fa-info-circle"></i>
                    <small>{address.deliveryInstructions}</small>
                  </div>
                )}
              </div>

              <div className={styles.addressActions}>
                {!address.isDefault && (
                  <button
                    className={styles.linkButton}
                    onClick={() => handleSetDefault(address.id)}
                    disabled={loading}
                  >
                    <i className="fas fa-star"></i>
                    Set Default
                  </button>
                )}
                <button
                  className={styles.linkButton}
                  onClick={() => handleEditAddress(address)}
                  disabled={loading}
                >
                  <i className="fas fa-edit"></i>
                  Edit
                </button>
                <button
                  className={`${styles.linkButton} ${styles.danger}`}
                  onClick={() => handleDeleteAddress(address.id)}
                  disabled={loading}
                >
                  <i className="fas fa-trash"></i>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddressModal
        address={editingAddress}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAddress}
      />
    </div>
  );
};

export default AddressManager;