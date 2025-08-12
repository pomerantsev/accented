import type React from 'react';
import { FaBox, FaHome, FaPlus, FaShoppingCart } from 'react-icons/fa';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Intentional a11y issue: using div instead of header landmark */}
      <div className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img
                src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=50"
                className="w-8 h-8 rounded mr-3"
                alt="MerchantHub Admin logo"
              />
              <h1 className="text-xl sm:text-2xl font-bold">MerchantHub Admin</h1>
            </div>
            {/* Intentional a11y issue: low contrast text */}
            <div className="text-blue-200 text-sm hidden sm:block">Welcome back, Admin</div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Intentional a11y issue: using div instead of nav landmark */}
        <div className="w-64 bg-white shadow-md min-h-screen flex-shrink-0">
          <div className="p-4">
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
                    currentPage === 'dashboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FaHome className="w-5 h-5 mr-3" />
                  Dashboard
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('products')}
                  className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
                    currentPage === 'products'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FaBox className="w-5 h-5 mr-3" />
                  Products
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('add-product')}
                  className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
                    currentPage === 'add-product'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FaPlus className="w-5 h-5 mr-3" />
                  Add Product
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('orders')}
                  className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
                    currentPage === 'orders'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FaShoppingCart className="w-5 h-5 mr-3" />
                  Orders
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Intentional a11y issue: using div instead of main landmark */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">{children}</div>
      </div>
    </div>
  );
};
