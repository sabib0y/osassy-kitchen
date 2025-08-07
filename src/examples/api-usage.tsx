/**
 * Example usage of the API integration foundation
 * This file demonstrates how to use the API client and React Query hooks
 */

import React from 'react';
import { useSession } from 'next-auth/react';
import { 
  useMenuItems, 
  useUserOrders, 
  useUserProfile,
  useCreateOrder,
  useUpdateProfile 
} from '@/hooks/useApi';
import { api } from '@/lib/api-client';
import type { CreateOrderRequest, UpdateProfileRequest } from '@/lib/api-types';

// Example: Component using React Query hooks
const UserDashboardExample: React.FC = () => {
  const { data: session } = useSession();

  // Using the custom React Query hooks
  const { data: menuItems, isLoading: menuLoading, error: menuError } = useMenuItems({
    category: 'main-dishes',
    search: '',
  });

  const { data: orders, isLoading: ordersLoading } = useUserOrders({
    page: 1,
    limit: 10,
  });

  const { data: profile, isLoading: profileLoading } = useUserProfile();

  // Using mutation hooks
  const createOrderMutation = useCreateOrder({
    onSuccess: () => {
      alert('Order created successfully!');
    },
    onError: (error) => {
      alert(`Failed to create order: ${error.message}`);
    },
  });

  const updateProfileMutation = useUpdateProfile({
    onSuccess: () => {
      alert('Profile updated successfully!');
    },
  });

  const handleCreateOrder = async () => {
    if (!menuItems?.data || menuItems.data.length === 0) return;

    const orderData: CreateOrderRequest = {
      items: [
        {
          menuItemId: menuItems.data[0].id,
          quantity: 2,
        },
      ],
      deliveryAddress: '123 Main St, Lagos, Nigeria',
      specialInstructions: 'Please deliver after 6 PM',
    };

    createOrderMutation.mutate(orderData);
  };

  const handleUpdateProfile = async () => {
    const profileData: UpdateProfileRequest = {
      name: 'John Doe',
      phone: '+234 123 456 7890',
      address: {
        street: '123 Main St',
        city: 'Lagos',
        state: 'Lagos',
        postalCode: '12345',
        country: 'Nigeria',
      },
    };

    updateProfileMutation.mutate(profileData);
  };

  if (!session) {
    return <div>Please log in to access this page.</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>API Integration Example</h1>

      <section>
        <h2>Menu Items</h2>
        {menuLoading && <p>Loading menu items...</p>}
        {menuError && <p style={{ color: 'red' }}>Error loading menu items</p>}
        {menuItems?.data && (
          <div>
            <p>Found {menuItems.data.length} menu items</p>
            <ul>
              {menuItems.data.slice(0, 5).map((item) => (
                <li key={item.id}>
                  {item.name} - £{item.price} ({item.category})
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section>
        <h2>Recent Orders</h2>
        {ordersLoading && <p>Loading orders...</p>}
        {orders?.data && (
          <div>
            <p>Total orders: {orders.data.pagination?.totalCount || 0}</p>
            <ul>
              {orders.data.data?.slice(0, 3).map((order) => (
                <li key={order.id}>
                  Order #{order.id.slice(0, 8)} - £{order.totalPrice} ({order.status})
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section>
        <h2>Profile</h2>
        {profileLoading && <p>Loading profile...</p>}
        {profile?.data && (
          <div>
            <p>Name: {profile.data.name}</p>
            <p>Email: {profile.data.email}</p>
            <p>Phone: {profile.data.phone || 'Not set'}</p>
          </div>
        )}
      </section>

      <section>
        <h2>Actions</h2>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            onClick={handleCreateOrder}
            disabled={createOrderMutation.isPending || !menuItems?.data?.[0]}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            {createOrderMutation.isPending ? 'Creating...' : 'Create Sample Order'}
          </button>

          <button
            onClick={handleUpdateProfile}
            disabled={updateProfileMutation.isPending}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </section>
    </div>
  );
};

// Example: Direct API client usage (without React Query)
export const directApiUsage = async () => {
  try {
    // Get menu items
    const menuResponse = await api.get('/menu-items', {
      category: 'rice-dishes',
      search: 'jollof',
    });

    console.log('Menu items:', menuResponse.data);

    // Create a new order
    const orderData: CreateOrderRequest = {
      items: [
        { menuItemId: 'menu-item-id', quantity: 1 },
      ],
      deliveryAddress: '456 Another St, Lagos',
    };

    const orderResponse = await api.post('/user/orders', orderData);
    console.log('Created order:', orderResponse.data);

    // Upload a file (if needed)
    // const fileInput = document.getElementById('file-input') as HTMLInputElement;
    // if (fileInput?.files?.[0]) {
    //   const uploadResponse = await api.upload(
    //     '/admin/menu-items/upload-image',
    //     fileInput.files[0],
    //     { category: 'main-dishes' }
    //   );
    //   console.log('Upload result:', uploadResponse.data);
    // }

  } catch (error) {
    console.error('API Error:', error);
  }
};

export default UserDashboardExample;