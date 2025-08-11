import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { ToastContainer } from './components/Toast';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { AddProduct } from './pages/AddProduct';
import { Orders } from './pages/Orders';
import type { ToastMessage } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: ToastMessage['type'], message: string) => {
    const newToast: ToastMessage = {
      id: Date.now().toString(),
      type,
      message
    };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <Products onShowToast={showToast} />;
      case 'add-product':
        return <AddProduct onShowToast={showToast} />;
      case 'orders':
        return <Orders onShowToast={showToast} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderCurrentPage()}
      </Layout>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}

export default App;