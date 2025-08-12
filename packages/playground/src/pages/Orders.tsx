import type React from 'react';
import { useEffect, useState } from 'react';
import { FaBox, FaCheckCircle, FaEye, FaTruck } from 'react-icons/fa';
import { Modal } from '../components/Modal';
import type { Order } from '../types';
import { getOrders, updateOrderStatus } from '../utils/localStorage';

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
      cancelled: { color: 'bg-red-100 text-red-800', icon: FaBox },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
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
      minute: '2-digit',
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
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Order ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Customer
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Total
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
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
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleViewDetails(order)}
                        className="text-indigo-600 hover:text-indigo-900"
                        aria-label={`View details for order ${order.id}`}
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                      {/* Intentional a11y issue: select without label */}
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusUpdate(order.id, e.target.value as Order['status'])
                        }
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
              <div className="ml-2 flex-shrink-0">{getStatusBadge(order.status)}</div>
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
                  <div className="text-lg font-semibold text-gray-900">
                    ${order.total.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Items:</span>
                  <div className="text-sm text-gray-900">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <button
                type="button"
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

      {/* Intentional a11y issue: heading-order violation - h1 followed directly by h3 */}
      <div className="mt-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Canceled Orders</h3>

        {/* Desktop Table View for Canceled Orders */}
        <div className="hidden lg:block bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Order ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Customer
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Total
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ORD-CANC-001
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Sarah Johnson</div>
                    <div className="text-sm text-gray-500">sarah.j@email.com</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$89.97</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge('cancelled')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Jan 15, 2024, 10:30 AM
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ORD-CANC-002
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Mike Chen</div>
                    <div className="text-sm text-gray-500">m.chen@email.com</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$156.43</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge('cancelled')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Jan 12, 2024, 2:45 PM
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View for Canceled Orders */}
        <div className="lg:hidden space-y-4">
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">ORD-CANC-001</h4>
                <p className="text-xs text-gray-500 mt-1">Jan 15, 2024, 10:30 AM</p>
              </div>
              <div className="ml-2 flex-shrink-0">{getStatusBadge('cancelled')}</div>
            </div>

            <div className="space-y-2 mb-4">
              <div>
                <span className="text-xs text-gray-500">Customer:</span>
                <div className="text-sm font-medium text-gray-900">Sarah Johnson</div>
                <div className="text-xs text-gray-500">sarah.j@email.com</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500">Total:</span>
                  <div className="text-lg font-semibold text-gray-900">$89.97</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Items:</span>
                  <div className="text-sm text-gray-900">3 items</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">ORD-CANC-002</h4>
                <p className="text-xs text-gray-500 mt-1">Jan 12, 2024, 2:45 PM</p>
              </div>
              <div className="ml-2 flex-shrink-0">{getStatusBadge('cancelled')}</div>
            </div>

            <div className="space-y-2 mb-4">
              <div>
                <span className="text-xs text-gray-500">Customer:</span>
                <div className="text-sm font-medium text-gray-900">Mike Chen</div>
                <div className="text-xs text-gray-500">m.chen@email.com</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500">Total:</span>
                  <div className="text-lg font-semibold text-gray-900">$156.43</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Items:</span>
                  <div className="text-sm text-gray-900">5 items</div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
                {selectedOrder.items.map((item) => (
                  <div
                    key={`${item.productName}-${item.quantity}`}
                    className="flex justify-between items-center py-2 border-b"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.productName}</p>
                      <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium ml-2">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
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
