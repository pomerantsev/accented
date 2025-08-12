import type React from 'react';
import { useState } from 'react';
import { Select } from '../components/Select';
import { categories } from '../data/mockData';
import type { Product } from '../types';
import { saveProduct } from '../utils/localStorage';

interface AddProductProps {
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const AddProduct: React.FC<AddProductProps> = ({ onShowToast }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    stock: '',
    description: '',
    image: '',
    status: 'active' as 'active' | 'inactive',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.category) {
      onShowToast('error', 'Please fill in all required fields');
      return;
    }

    const newProduct: Product = {
      id: Date.now().toString(),
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category,
      stock: parseInt(formData.stock) || 0,
      description: formData.description,
      image:
        formData.image ||
        'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300',
      status: formData.status,
      createdAt: new Date().toISOString(),
    };

    saveProduct(newProduct);
    onShowToast('success', 'Product added successfully!');

    // Reset form
    setFormData({
      name: '',
      price: '',
      category: '',
      stock: '',
      description: '',
      image: '',
      status: 'active',
    });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Product</h1>

      <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              id="product-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter product name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="product-price"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Price *
              </label>
              <input
                id="product-price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label
                htmlFor="product-stock"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Stock Quantity
              </label>
              <input
                id="product-stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Select
              label="Category *"
              options={categories}
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value })}
              placeholder="Select a category"
            />
          </div>

          <div>
            <label htmlFor="product-image" className="block text-sm font-medium text-gray-700 mb-1">
              Product Image URL
            </label>
            <input
              id="product-image"
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label
              htmlFor="product-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="product-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter product description"
            />
          </div>

          <div>
            <Select
              label="Status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={formData.status}
              onChange={(value) =>
                setFormData({ ...formData, status: value as 'active' | 'inactive' })
              }
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() =>
                setFormData({
                  name: '',
                  price: '',
                  category: '',
                  stock: '',
                  description: '',
                  image: '',
                  status: 'active',
                })
              }
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Clear Form
            </button>
            {/* Intentional a11y issue: low contrast button */}
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-400 border border-transparent rounded-md hover:bg-gray-500"
            >
              Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
