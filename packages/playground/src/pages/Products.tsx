import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import type { Product } from '../types';
import { getProducts, deleteProduct, saveProduct } from '../utils/localStorage';
import { Modal } from '../components/Modal';
import { Select } from '../components/Select';
import { categories } from '../data/mockData';

interface ProductsProps {
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const Products: React.FC<ProductsProps> = ({ onShowToast }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingProduct) {
      saveProduct(editingProduct);
      setProducts(getProducts());
      setIsEditModalOpen(false);
      setEditingProduct(null);
      onShowToast('success', 'Product updated successfully!');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
      setProducts(getProducts());
      onShowToast('success', 'Product deleted successfully!');
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Active</span>
      : <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Inactive</span>;
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Products</h1>
      
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden lg:block bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {/* Intentional a11y issue: table without proper headers association */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {/* Intentional a11y issue: missing alt text */}
                      <img className="h-10 w-10 rounded-full object-cover" src={product.image} />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description.substring(0, 50)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {categories.find(c => c.value === product.category)?.label}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(product.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {/* Intentional a11y issue: buttons without accessible names */}
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <FaEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
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
        {products.map((product) => (
          <div key={product.id} className="bg-white shadow rounded-lg p-4">
            <div className="flex items-start space-x-4">
              {/* Intentional a11y issue: missing alt text */}
              <img 
                className="h-16 w-16 rounded-lg object-cover flex-shrink-0" 
                src={product.image} 
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    {getStatusBadge(product.status)}
                  </div>
                </div>
                
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-1 text-gray-900">
                      {categories.find(c => c.value === product.category)?.label}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Stock:</span>
                    <span className="ml-1 text-gray-900">{product.stock}</span>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-lg font-semibold text-gray-900">
                    ${product.price.toFixed(2)}
                  </div>
                  <div className="flex space-x-3">
                    {/* Intentional a11y issue: buttons without accessible names */}
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900 p-1">
                      <FaEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Product"
      >
        {editingProduct && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                value={editingProduct.name}
                onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <input
                type="number"
                step="0.01"
                value={editingProduct.price}
                onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <Select
                label="Category"
                options={categories}
                value={editingProduct.category}
                onChange={(value) => setEditingProduct({...editingProduct, category: value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock
              </label>
              <input
                type="number"
                value={editingProduct.stock}
                onChange={(e) => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editingProduct.description}
                onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <Select
                label="Status"
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
                value={editingProduct.status}
                onChange={(value) => setEditingProduct({...editingProduct, status: value as 'active' | 'inactive'})}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};