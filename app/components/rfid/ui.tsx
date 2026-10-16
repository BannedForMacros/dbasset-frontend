'use client';

/* Piezas de interfaz de los módulos RFID, con la misma paleta que el resto del panel. */

import { ReactNode, useCallback, useState } from 'react';
import { MdClose, MdCheckCircle, MdError, MdInfo } from 'react-icons/md';

export const COLORES = {
  brand: '#1e4786',
  brandHover: '#163564',
  accent: '#22c4a1',
  texto: '#0f172a',
  suave: '#64748b',
  tenue: '#94a3b8',
  borde: '#e2e8f0',
};

export function PageHeader({ titulo, subtitulo, icono, acciones }: {
  titulo: string; subtitulo?: string; icono?: ReactNode; acciones?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: COLORES.texto }}>{titulo}</h1>
        {subtitulo && (
          <p className="text-sm mt-0.5 flex items-center gap-1.5" style={{ color: COLORES.tenue }}>
            {icono}{subtitulo}
          </p>
        )}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl ${className}`} style={{ backgroundColor: '#fff', border: `1.5px solid ${COLORES.borde}` }}>
      {children}
    </div>
  );
}

type Variante = 'primario' | 'secundario' | 'peligro' | 'exito';

const VARIANTES: Record<Variante, { bg: string; hover: string; color: string; border: string }> = {
  primario:   { bg: '#1e4786', hover: '#163564', color: '#fff', border: '#1e4786' },
  secundario: { bg: '#f1f5f9', hover: '#e2e8f0', color: '#475569', border: '#e2e8f0' },
  peligro:    { bg: 'rgba(239,68,68,0.08)', hover: 'rgba(239,68,68,0.16)', color: '#dc2626', border: 'rgba(239,68,68,0.25)' },
  exito:      { bg: 'rgba(34,196,161,0.1)', hover: 'rgba(34,196,161,0.2)', color: '#0f9b76', border: 'rgba(34,196,161,0.3)' },
};

export function Boton({ children, onClick, variante = 'primario', disabled, type = 'button', title, pequeno }: {
  children: ReactNode; onClick?: () => void; variante?: Variante; disabled?: boolean;
  type?: 'button' | 'submit'; title?: string; pequeno?: boolean;
}) {
  const v = VARIANTES[variante];
  return (
    <button
      type={type} onClick={onClick} disabled={disabled} title={title}
      className={`flex items-center gap-1.5 rounded-xl font-semibold transition-all ${pequeno ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'}`}
      style={{
        backgroundColor: disabled ? '#f1f5f9' : v.bg, color: disabled ? '#94a3b8' : v.color,
        border: `1.5px solid ${disabled ? '#e2e8f0' : v.border}`, cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = v.hover; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.backgroundColor = v.bg; }}
    >
      {children}
    </button>
  );
}

export function Campo({ etiqueta, requerido, children }: { etiqueta: string; requerido?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORES.suave }}>
        {etiqueta}{requerido && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

export const inputCls = 'w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all';
export const inputStyle: React.CSSProperties = { border: `1.5px solid ${COLORES.borde}`, color: COLORES.texto, backgroundColor: '#fff' };

export function ModalBase({ abierto, titulo, subtitulo, onCerrar, children, pie, ancho = 'max-w-2xl' }: {
  abierto: boolean; titulo: string; subtitulo?: string; onCerrar: () => void;
  children: ReactNode; pie?: ReactNode; ancho?: string;
}) {
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className={`w-full ${ancho} my-8 rounded-2xl overflow-hidden flex flex-col`}
        style={{ backgroundColor: '#fff', boxShadow: '0 25px 60px rgba(0,0,0,0.15)', maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #003366 0%, #1e4786 100%)' }}>
          <div>
            <h3 className="font-bold text-lg text-white">{titulo}</h3>
            {subtitulo && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{subtitulo}</p>}
          </div>
          <button onClick={onCerrar} className="p-2 rounded-lg" style={{ color: 'rgba(255,255,255,0.7)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <MdClose size={22} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">{children}</div>
        {pie && (
          <div className="flex justify-end gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}>
            {pie}
          </div>
        )}
      </div>
    </div>
  );
}

export function Tabla({ columnas, children, vacio, cargando }: {
  columnas: string[]; children: ReactNode; vacio?: boolean; cargando?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
            {columnas.map((c, i) => (
              <th key={`${i}-${c}`}className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                style={{ color: COLORES.tenue, backgroundColor: '#fafafa' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cargando ? (
            <tr><td colSpan={columnas.length} className="px-4 py-10 text-center text-sm" style={{ color: COLORES.tenue }}>Cargando…</td></tr>
          ) : vacio ? (
            <tr><td colSpan={columnas.length} className="px-4 py-10 text-center text-sm" style={{ color: COLORES.tenue }}>Sin registros</td></tr>
          ) : children}
        </tbody>
      </table>
    </div>
  );
}

export const tdCls = 'px-4 py-3 text-sm align-top';

export function Pastilla({ texto, tono = 'neutro' }: { texto: string; tono?: 'ok' | 'alerta' | 'error' | 'neutro' | 'marca' }) {
  const t = {
    ok:     { bg: 'rgba(34,196,161,0.1)', color: '#0f9b76', border: 'rgba(34,196,161,0.3)' },
    alerta: { bg: 'rgba(245,158,11,0.1)', color: '#b45309', border: 'rgba(245,158,11,0.3)' },
    error:  { bg: 'rgba(239,68,68,0.08)', color: '#dc2626', border: 'rgba(239,68,68,0.25)' },
    neutro: { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
    marca:  { bg: 'rgba(30,71,134,0.08)', color: '#1e4786', border: 'rgba(30,71,134,0.2)' },
  }[tono];
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: t.bg, color: t.color, border: `1px solid ${t.border}` }}>{texto}</span>
  );
}

export function Epc({ valor }: { valor?: string | null }) {
  if (!valor) return <span className="text-xs" style={{ color: '#cbd5e1' }}>Sin EPC</span>;
  return <span className="text-xs font-mono px-1.5 py-0.5 rounded break-all" style={{ backgroundColor: 'rgba(34,196,161,0.08)', color: '#0f766e' }}>{valor}</span>;
}

/* ── Avisos ── */
export interface Aviso { tipo: 'ok' | 'error' | 'info'; texto: string }

export function useAviso() {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const mostrar = useCallback((tipo: Aviso['tipo'], texto: string) => {
    setAviso({ tipo, texto });
    setTimeout(() => setAviso(a => (a && a.texto === texto ? null : a)), 5000);
  }, []);
  const nodo = aviso ? (
    <div className="fixed top-4 right-4 z-[100] max-w-md rounded-lg shadow-lg p-4 flex items-start gap-3 border-2"
      style={{
        backgroundColor: aviso.tipo === 'ok' ? '#f0fdf4' : aviso.tipo === 'error' ? '#fef2f2' : '#eff6ff',
        borderColor: aviso.tipo === 'ok' ? '#bbf7d0' : aviso.tipo === 'error' ? '#fecaca' : '#bfdbfe',
        color: aviso.tipo === 'ok' ? '#166534' : aviso.tipo === 'error' ? '#991b1b' : '#1e40af',
      }}>
      {aviso.tipo === 'ok' ? <MdCheckCircle size={22} /> : aviso.tipo === 'error' ? <MdError size={22} /> : <MdInfo size={22} />}
      <p className="text-sm font-semibold flex-1">{aviso.texto}</p>
      <button onClick={() => setAviso(null)}><MdClose size={18} /></button>
    </div>
  ) : null;
  return { mostrar, nodo };
}
