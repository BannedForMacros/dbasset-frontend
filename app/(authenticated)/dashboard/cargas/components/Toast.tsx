'use client';

import { useEffect } from 'react';
import { MdCheckCircle, MdError, MdWarning, MdInfo, MdClose } from 'react-icons/md';

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  onClose: () => void;
}

export default function Toast({ type, message, details, onClose }: ToastProps) {
  const icons = {
    success: <MdCheckCircle size={24} />,
    error: <MdError size={24} />,
    warning: <MdWarning size={24} />,
    info: <MdInfo size={24} />
  };

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-[100] ${styles[type]} border-2 rounded-lg shadow-lg p-4 max-w-md animate-slideIn`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0">{icons[type]}</div>
        <div className="flex-1">
          <p className="font-bold text-sm">{message}</p>
          {details && <p className="text-xs mt-1 opacity-80">{details}</p>}
        </div>
        <button onClick={onClose} className="shrink-0 hover:opacity-60">
          <MdClose size={20} />
        </button>
      </div>
    </div>
  );
}