'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MdCheck, MdClose, MdExpandMore, MdSearch } from 'react-icons/md';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string | number | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  icon?: ReactNode;
  required?: boolean;
  /** Permite escribir para filtrar las opciones (activado por defecto). */
  searchable?: boolean;
  /** Muestra la opción para vaciar el valor (activado por defecto). */
  clearable?: boolean;
  className?: string;
  emptyText?: string;
  size?: 'sm' | 'md';
  ariaLabel?: string;
  /** Colorea el borde para validaciones (rojo/verde). */
  estado?: 'ok' | 'error';
}

interface PanelPos {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
  arriba: boolean;
}

/**
 * Selector del sistema: mismo aspecto para toda la app, con búsqueda,
 * animación de apertura y navegación con teclado. Se dibuja en un portal
 * para que no lo recorte ningún modal con scroll.
 */
export default function Select({
  options, value, onChange, placeholder = 'Seleccionar...', disabled = false,
  label, icon, required, searchable = true, clearable = true, className = '',
  emptyText = 'Sin resultados', size = 'md', ariaLabel, estado,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [indice, setIndice] = useState(0);
  const [pos, setPos] = useState<PanelPos | null>(null);

  const botonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const seleccionado = options.find(o => String(o.value) === String(value ?? ''));

  const filtradas = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    return t ? options.filter(o => o.label.toLowerCase().includes(t)) : options;
  }, [options, busqueda]);

  const cerrar = () => {
    setOpen(false);
    setBusqueda('');
  };

  const abrir = () => {
    if (disabled) return;
    const r = botonRef.current?.getBoundingClientRect();
    if (!r) return;
    const margen = 8;
    const espacioAbajo = window.innerHeight - r.bottom;
    const espacioArriba = r.top;
    const arriba = espacioAbajo < 300 && espacioArriba > espacioAbajo;
    const disponible = (arriba ? espacioArriba : espacioAbajo) - margen * 2;
    const ancho = Math.max(r.width, Math.min(230, window.innerWidth - margen * 2));
    setPos({
      left: Math.max(margen, Math.min(r.left, window.innerWidth - ancho - margen)),
      width: ancho,
      top: arriba ? undefined : r.bottom + 6,
      bottom: arriba ? window.innerHeight - r.top + 6 : undefined,
      maxHeight: Math.max(180, Math.min(340, disponible)),
      arriba,
    });
    setBusqueda('');
    setIndice(0);
    setOpen(true);
  };

  // Cerrar al hacer clic fuera, al hacer scroll de la página o al redimensionar
  useEffect(() => {
    if (!open) return;
    const alClicFuera = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || botonRef.current?.contains(t)) return;
      cerrar();
    };
    const alScroll = (e: Event) => {
      const t = e.target;
      if (t instanceof Node && panelRef.current?.contains(t)) return;
      cerrar();
    };
    const alRedimensionar = () => cerrar();

    document.addEventListener('mousedown', alClicFuera);
    window.addEventListener('scroll', alScroll, true);
    window.addEventListener('resize', alRedimensionar);
    return () => {
      document.removeEventListener('mousedown', alClicFuera);
      window.removeEventListener('scroll', alScroll, true);
      window.removeEventListener('resize', alRedimensionar);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>(`[data-indice="${indice}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [indice, open]);

  const elegir = (opt: SelectOption) => {
    if (opt.disabled) return;
    onChange(String(opt.value));
    cerrar();
  };

  const alTeclear = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cerrar();
      botonRef.current?.focus();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndice(i => Math.min(i + 1, Math.max(filtradas.length - 1, 0)));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndice(i => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filtradas[indice];
      if (opt) elegir(opt);
    }
  };

  const panel = open && pos && typeof document !== 'undefined' ? createPortal(
    <div
      ref={panelRef}
      className="select-panel animate-dropdown"
      data-arriba={pos.arriba}
      role="listbox"
      style={{
        position: 'fixed', left: pos.left, width: pos.width, maxHeight: pos.maxHeight,
        top: pos.top, bottom: pos.bottom, zIndex: 1200,
      }}
      onKeyDown={alTeclear}
    >
      {searchable && (
        <div className="select-buscador">
          <MdSearch size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
          <input
            autoFocus
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setIndice(0); }}
            placeholder="Buscar…"
            aria-label="Buscar opción"
          />
          {busqueda && (
            <button type="button" onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda"
              style={{ color: '#94a3b8', display: 'flex' }}>
              <MdClose size={15} />
            </button>
          )}
        </div>
      )}
      <div className="select-opciones">
        {clearable && (
          <button type="button" className="select-opcion" onClick={() => { onChange(''); cerrar(); }}>
            <span style={{ color: '#94a3b8' }}>{placeholder}</span>
          </button>
        )}
        {filtradas.map((opt, i) => {
          const esSeleccionado = String(opt.value) === String(value ?? '');
          return (
            <button
              key={String(opt.value)}
              type="button"
              role="option"
              aria-selected={esSeleccionado}
              disabled={opt.disabled}
              data-indice={i}
              data-activo={i === indice}
              data-seleccionado={esSeleccionado}
              className="select-opcion"
              onMouseEnter={() => setIndice(i)}
              onClick={() => elegir(opt)}
            >
              <span className="truncate">{opt.label}</span>
              {esSeleccionado && <MdCheck size={16} style={{ color: '#22c4a1', flexShrink: 0 }} />}
            </button>
          );
        })}
        {filtradas.length === 0 && <p className="select-vacio">{emptyText}</p>}
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#64748b' }}>
          {icon && <span style={{ color: '#1e4786' }}>{icon}</span>}
          {label}{required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}
      <div className="relative">
        <button
          ref={botonRef}
          type="button"
          disabled={disabled}
          onClick={() => (open ? cerrar() : abrir())}
          onKeyDown={open ? alTeclear : undefined}
          data-abierto={open}
          data-size={size}
          data-estado={estado}
          aria-label={ariaLabel ?? label}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="select-boton"
        >
          <span className="truncate" style={{ color: seleccionado ? '#0f172a' : '#94a3b8' }}>
            {seleccionado ? seleccionado.label : placeholder}
          </span>
          <MdExpandMore size={18} className="select-chevron" />
        </button>
        {panel}
      </div>
    </div>
  );
}
