import React from 'react';
import { FaBox, FaShoppingCart, FaDollarSign, FaUsers } from 'react-icons/fa';

export const Dashboard: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Intentional a11y issue: decorative icons not marked as such */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FaBox className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">1,234</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FaShoppingCart className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Orders Today</p>
              <p className="text-2xl font-bold text-gray-900">56</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FaDollarSign className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">$12,345</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FaUsers className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Customers</p>
              <p className="text-2xl font-bold text-gray-900">890</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Orders</h2>
          {/* Intentional a11y issue: low contrast text */}
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-400">Order #ORD-001</span>
              <span className="font-medium">$104.98</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-400">Order #ORD-002</span>
              <span className="font-medium">$69.98</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-400">Order #ORD-003</span>
              <span className="font-medium">$34.99</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Low Stock Alert</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span>Leather Wallet</span>
              <span className="text-red-600 font-medium">32 left</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span>Wireless Headphones</span>
              <span className="text-yellow-600 font-medium">45 left</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};