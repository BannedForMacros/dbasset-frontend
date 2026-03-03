import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void; // Opcional, por si queremos forzar una acción
  children: React.ReactNode;
  title?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e4786]/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Decoración superior Turquesa */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#22c4a1]" />
        
        {/* Botón cerrar (si se proporciona onClose) */}
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={24} />
          </button>
        )}

        <div className="p-8">
          {title && <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{title}</h2>}
          {children}
        </div>
      </div>
    </div>
  );
};