import type { Product, Order } from '../types';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    price: 79.99,
    category: 'electronics',
    stock: 45,
    description: 'High-quality wireless headphones with noise cancellation',
    image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300',
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Organic Cotton T-Shirt',
    price: 24.99,
    category: 'clothing',
    stock: 120,
    description: 'Comfortable organic cotton t-shirt in various colors',
    image: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=300',
    status: 'active',
    createdAt: '2024-01-14T14:20:00Z'
  },
  {
    id: '3',
    name: 'Stainless Steel Water Bottle',
    price: 19.99,
    category: 'home',
    stock: 78,
    description: 'Insulated water bottle keeps drinks cold for 24 hours',
    image: 'https://images.pexels.com/photos/1000084/pexels-photo-1000084.jpeg?auto=compress&cs=tinysrgb&w=300',
    status: 'active',
    createdAt: '2024-01-13T09:15:00Z'
  },
  {
    id: '4',
    name: 'Leather Wallet',
    price: 49.99,
    category: 'accessories',
    stock: 32,
    description: 'Genuine leather wallet with RFID protection',
    image: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=300',
    status: 'inactive',
    createdAt: '2024-01-12T16:45:00Z'
  },
  {
    id: '5',
    name: 'Yoga Mat',
    price: 34.99,
    category: 'sports',
    stock: 67,
    description: 'Non-slip yoga mat perfect for all types of yoga practice',
    image: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=300',
    status: 'active',
    createdAt: '2024-01-11T11:30:00Z'
  }
];

export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customerName: 'John Smith',
    customerEmail: 'john.smith@email.com',
    total: 104.98,
    status: 'processing',
    items: [
      { productId: '1', productName: 'Wireless Bluetooth Headphones', quantity: 1, price: 79.99 },
      { productId: '2', productName: 'Organic Cotton T-Shirt', quantity: 1, price: 24.99 }
    ],
    createdAt: '2024-01-16T08:30:00Z',
    shippingAddress: '123 Main St, Anytown, ST 12345'
  },
  {
    id: 'ORD-002',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah.j@email.com',
    total: 69.98,
    status: 'shipped',
    items: [
      { productId: '4', productName: 'Leather Wallet', quantity: 1, price: 49.99 },
      { productId: '3', productName: 'Stainless Steel Water Bottle', quantity: 1, price: 19.99 }
    ],
    createdAt: '2024-01-15T14:20:00Z',
    shippingAddress: '456 Oak Ave, Another City, ST 67890'
  },
  {
    id: 'ORD-003',
    customerName: 'Mike Davis',
    customerEmail: 'mike.davis@email.com',
    total: 34.99,
    status: 'delivered',
    items: [
      { productId: '5', productName: 'Yoga Mat', quantity: 1, price: 34.99 }
    ],
    createdAt: '2024-01-14T10:15:00Z',
    shippingAddress: '789 Pine Rd, Third Town, ST 13579'
  },
  {
    id: 'ORD-004',
    customerName: 'Emily Wilson',
    customerEmail: 'emily.w@email.com',
    total: 149.97,
    status: 'pending',
    items: [
      { productId: '1', productName: 'Wireless Bluetooth Headphones', quantity: 1, price: 79.99 },
      { productId: '5', productName: 'Yoga Mat', quantity: 2, price: 34.99 }
    ],
    createdAt: '2024-01-16T16:45:00Z',
    shippingAddress: '321 Elm St, Fourth City, ST 24680'
  }
];

export const categories = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'sports', label: 'Sports & Fitness' },
  { value: 'books', label: 'Books' }
];