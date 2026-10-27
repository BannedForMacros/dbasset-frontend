'use client';

import { useEffect } from 'react';
import { MdCheckCircle, MdError, MdWarning, MdInfo, MdClose } from 'react-icons/md';

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  onClose: () => void;
}

const ESTILOS = {
  success: { icono: MdCheckCircle, color: '#0f9b76', fondo: 'rgba(34,196,161,0.12)' },
  error:   { icono: MdError,       color: '#dc2626', fondo: 'rgba(239,68,68,0.1)' },
  warning: { icono: MdWarning,     color: '#b45309', fondo: 'rgba(245,158,11,0.12)' },
  info:    { icono: MdInfo,        color: '#1e4786', fondo: 'rgba(30,71,134,0.08)' },
};

export default function Toast({ type, message, details, onClose }: ToastProps) {
  const e = ESTILOS[type];
  const Icono = e.icono;

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-[100] w-[min(26rem,calc(100vw-2rem))] rounded-2xl p-3.5 flex items-start gap-3 animate-fade-up"
      style={{ backgroundColor: '#fff', border: '1.5px solid #e2e8f0', boxShadow: '0 18px 45px rgba(15,23,42,0.16)' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: e.fondo, color: e.color }}>
        <Icono size={20} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="font-semibold text-sm" style={{ color: '#0f172a' }}>{message}</p>
        {details && <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{details}</p>}
      </div>
      <button onClick={onClose} className="p-1 rounded-lg shrink-0 transition-colors hover:bg-slate-100" style={{ color: '#94a3b8' }}
        aria-label="Cerrar aviso">
        <MdClose size={18} />
      </button>
    </div>
  );
}
