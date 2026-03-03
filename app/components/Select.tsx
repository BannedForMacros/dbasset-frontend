'use client';

import { useState, useRef, useEffect } from 'react';
import { MdExpandMore, MdCheck } from 'react-icons/md';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  icon?: React.ReactNode;
  required?: boolean;
}

export default function Select({
  options, value, onChange, placeholder = 'Seleccionar...', 
  disabled = false, label, icon, required
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" 
          style={{ color: '#64748b' }}>
          {icon && <span style={{ color: '#1e4786' }}>{icon}</span>}
          {label}{required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}
      <div ref={ref} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(o => !o)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
          style={{
            backgroundColor: disabled ? '#f8fafc' : '#fff',
            border: open ? '1.5px solid #1e4786' : '1.5px solid #e2e8f0',
            color: selected ? '#0f172a' : '#94a3b8',
            cursor: disabled ? 'not-allowed' : 'pointer',
            boxShadow: open ? '0 0 0 3px rgba(30,71,134,0.08)' : 'none',
          }}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <MdExpandMore
            size={18}
            style={{
              color: '#94a3b8',
              transform: open ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s',
              flexShrink: 0,
            }}
          />
        </button>

        {open && (
          <div
            className="absolute z-50 w-full mt-1 rounded-lg overflow-hidden"
            style={{
              backgroundColor: '#fff',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              maxHeight: '220px',
              overflowY: 'auto',
            }}
          >
            {/* Opción vacía / placeholder */}
            <div
              onClick={() => { onChange(''); setOpen(false); }}
              className="flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer transition-colors duration-100"
              style={{ color: '#94a3b8' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {placeholder}
            </div>
            {options.map(opt => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={opt.value}
                  onClick={() => { onChange(String(opt.value)); setOpen(false); }}
                  className="flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer transition-colors duration-100"
                  style={{
                    backgroundColor: isSelected ? 'rgba(30,71,134,0.06)' : 'transparent',
                    color: isSelected ? '#1e4786' : '#0f172a',
                    fontWeight: isSelected ? 600 : 400,
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(34,196,161,0.08)';
                    if (!isSelected) e.currentTarget.style.color = '#1e4786';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    if (!isSelected) e.currentTarget.style.color = '#0f172a';
                  }}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <MdCheck size={16} style={{ color: '#22c4a1', flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}