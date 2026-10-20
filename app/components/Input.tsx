'use client';

import { InputHTMLAttributes, ReactNode, useId, useState } from 'react';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  icon?: ReactNode;
  error?: string;
  hint?: string;
  containerClassName?: string;
  size?: 'sm' | 'md';
}

/**
 * Campo de texto del sistema: misma estética y animación que Select.
 * Acepta cualquier atributo nativo (type, value, onChange, required, ...).
 */
export default function Input({
  label, icon, error, hint, containerClassName = '', size = 'md',
  className = '', id, type = 'text', required, disabled, ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [verClave, setVerClave] = useState(false);
  const esClave = type === 'password';
  const tipoReal = esClave && verClave ? 'text' : type;

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
          style={{ color: '#64748b' }}>
          {icon && <span style={{ color: '#1e4786' }}>{icon}</span>}
          {label}{required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94a3b8' }}>
            {icon}
          </span>
        )}
        <input
          id={inputId}
          type={tipoReal}
          required={required}
          disabled={disabled}
          data-error={!!error}
          className={`input-suave ${className}`}
          style={{
            paddingLeft: icon ? '2.25rem' : undefined,
            paddingRight: esClave ? '2.5rem' : undefined,
            ...(size === 'sm' ? { paddingTop: '0.4rem', paddingBottom: '0.4rem', fontSize: '0.8rem' } : null),
          }}
          {...rest}
        />
        {esClave && (
          <button
            type="button"
            onClick={() => setVerClave(v => !v)}
            aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors"
            style={{ color: '#94a3b8' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1e4786')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
          >
            {verClave ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
          </button>
        )}
      </div>
      {error
        ? <p className="text-xs font-medium" style={{ color: '#dc2626' }}>{error}</p>
        : hint ? <p className="text-xs" style={{ color: '#94a3b8' }}>{hint}</p> : null}
    </div>
  );
}
