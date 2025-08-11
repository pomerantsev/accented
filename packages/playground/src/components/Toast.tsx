import type React from 'react';
import { useEffect } from 'react';
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimes,
} from 'react-icons/fa';
import type { ToastMessage } from '../types';

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <FaCheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <FaExclamationCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <FaExclamationTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <FaInfoCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`flex items-center p-4 border rounded-lg shadow-md ${getBgColor()}`}>
      {getIcon()}
      <span className="ml-3 flex-1">{toast.message}</span>
      {/* Intentional a11y issue: button without accessible name */}
      <button onClick={() => onClose(toast.id)} className="ml-4 text-gray-400 hover:text-gray-600">
        <FaTimes className="w-4 h-4" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};
