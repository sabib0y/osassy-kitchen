import React from 'react';
import { X, MapPin, Clock, User, Phone, Mail, Package } from 'lucide-react';
import { Order } from '@/types/admin';
import StatusBadge from '../shared/StatusBadge';
import { useUpdateOrderStatus } from '@/hooks/admin/useOrders';
import { ButtonLoading } from '../shared/LoadingSpinner';

interface OrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderModal({ order, isOpen, onClose }: OrderModalProps) {
  const updateOrderMutation = useUpdateOrderStatus();

  if (!isOpen || !order) return null;

  const handleStatusUpdate = async (status: Order['status']) => {
    try {
      await updateOrderMutation.mutateAsync({ orderId: order.id, status });
      // Modal will automatically reflect changes due to React Query refetch
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString()}`;
  };

  const getNextStatusOptions = (currentStatus: Order['status']) => {
    switch (currentStatus) {
      case 'PENDING':
        return [
          { value: 'IN_PROGRESS', label: 'Mark In Progress', color: 'blue' },
          { value: 'DELIVERED', label: 'Mark Delivered', color: 'green' },
          { value: 'CANCELLED', label: 'Cancel Order', color: 'red' },
        ];
      case 'IN_PROGRESS':
        return [
          { value: 'DELIVERED', label: 'Mark Delivered', color: 'green' },
          { value: 'CANCELLED', label: 'Cancel Order', color: 'red' },
        ];
      case 'DELIVERED':
      case 'CANCELLED':
        return [];
      default:
        return [];
    }
  };

  const statusOptions = getNextStatusOptions(order.status);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Order #{order.id.slice(-8).toUpperCase()}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={order.status} size="md" />
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Order Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Items */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Order Items ({order.items.length})
                  </h3>
                  
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-md">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.menuItem.name}</h4>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.menuItem.price)} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Total */}
                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Subtotal:</span>
                      <span className="text-sm text-gray-900">
                        {formatCurrency(order.totalPrice - order.deliveryFee)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-600">Delivery Fee:</span>
                      <span className="text-sm text-gray-900">
                        {formatCurrency(order.deliveryFee)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                      <span className="font-semibold text-gray-900">Total:</span>
                      <span className="font-semibold text-lg text-gray-900">
                        {formatCurrency(order.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Delivery Information
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Address:</label>
                      <p className="text-gray-900 mt-1">{order.deliveryAddress}</p>
                    </div>
                    
                    {order.deliveryDate && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Delivery Date:</label>
                        <p className="text-gray-900 mt-1 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {formatDate(order.deliveryDate)}
                        </p>
                      </div>
                    )}
                    
                    {order.specialInstructions && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Special Instructions:</label>
                        <p className="text-gray-900 mt-1">{order.specialInstructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Customer & Actions */}
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Customer Details
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name:</label>
                      <p className="text-gray-900 mt-1">{order.user.name}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email:</label>
                      <p className="text-gray-900 mt-1 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {order.user.email}
                      </p>
                    </div>
                    
                    {order.user.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone:</label>
                        <p className="text-gray-900 mt-1 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {order.user.phone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Actions */}
                {statusOptions.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Update Status
                    </h3>
                    
                    <div className="space-y-2">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleStatusUpdate(option.value as Order['status'])}
                          disabled={updateOrderMutation.isPending}
                          className={`
                            w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                            ${option.color === 'blue' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : ''}
                            ${option.color === 'green' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}
                            ${option.color === 'red' ? 'bg-red-100 text-red-700 hover:bg-red-200' : ''}
                          `}
                        >
                          {updateOrderMutation.isPending ? (
                            <ButtonLoading size="sm" />
                          ) : null}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order Timeline */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Order Timeline
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Order Placed</p>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    
                    {order.updatedAt !== order.createdAt && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Status Updated</p>
                          <p className="text-xs text-gray-500">{formatDate(order.updatedAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
