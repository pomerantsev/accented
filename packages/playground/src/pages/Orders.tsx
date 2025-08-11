import React, { useState, useEffect } from 'react';
import { FaEye, FaBox, FaTruck, FaCheckCircle } from 'react-icons/fa';
import type { Order } from '../types';
import { getOrders, updateOrderStatus } from '../utils/localStorage';
import { Modal } from '../components/Modal';

interface OrdersProps {
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const Orders: React.FC<OrdersProps> = ({ onShowToast }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleStatusUpdate = (orderId: string, newStatus: Order['status']) => {
    updateOrderStatus(orderId, newStatus);
    setOrders(getOrders());
    onShowToast('success', `Order status updated to ${newStatus}`);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: FaBox },
      processing: { color: 'bg-blue-100 text-blue-800', icon: FaBox },
      shipped: { color: 'bg-purple-100 text-purple-800', icon: FaTruck },
      delivered: { color: 'bg-green-100 text-green-800', icon: FaCheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: FaBox }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Orders</h1>
      
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden lg:block bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {/* Intentional a11y issue: table without caption */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                    <div className="text-sm text-gray-500">{order.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="text-indigo-600 hover:text-indigo-900"
                        aria-label={`View details for order ${order.id}`}
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                      {/* Intentional a11y issue: select without label */}
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'])}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View - Visible on mobile and tablet */}
      <div className="lg:hidden space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white shadow rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">{order.id}</h3>
                <p className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
              </div>
              <div className="ml-2 flex-shrink-0">
                {getStatusBadge(order.status)}
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div>
                <span className="text-xs text-gray-500">Customer:</span>
                <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                <div className="text-xs text-gray-500">{order.customerEmail}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500">Total:</span>
                  <div className="text-lg font-semibold text-gray-900">${order.total.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Items:</span>
                  <div className="text-sm text-gray-900">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <button
                onClick={() => handleViewDetails(order)}
                className="flex items-center text-indigo-600 hover:text-indigo-900 text-sm font-medium"
              >
                <FaEye className="w-4 h-4 mr-1" />
                View Details
              </button>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Status:</span>
                {/* Intentional a11y issue: select without label */}
                <select
                  value={order.status}
                  onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'])}
                  className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Order Details"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Order ID</h4>
                <p className="text-sm text-gray-600">{selectedOrder.id}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Status</h4>
                <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900">Customer Information</h4>
              <p className="text-sm text-gray-600">{selectedOrder.customerName}</p>
              <p className="text-sm text-gray-600">{selectedOrder.customerEmail}</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900">Shipping Address</h4>
              <p className="text-sm text-gray-600">{selectedOrder.shippingAddress}</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900">Order Items</h4>
              <div className="mt-2 space-y-2">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.productName}</p>
                      <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium ml-2">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 font-medium">
                <span>Total:</span>
                <span>${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900">Order Date</h4>
              <p className="text-sm text-gray-600">{formatDate(selectedOrder.createdAt)}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};