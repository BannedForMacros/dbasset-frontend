'use client';

import { Carga, DetalleCarga as DetalleCargaType } from '../../../../services/carga.service';
import { MdClose, MdBarChart, MdCheckCircle, MdPendingActions, MdAssignment } from 'react-icons/md';

interface Props {
  open: boolean;
  carga: Carga | null;
  detalles: DetalleCargaType[];
  onClose: () => void;
}

export default function ModalDetalleCarga({ open, carga, detalles, onClose }: Props) {
  if (!open || !carga) return null;

  const total         = detalles.length;
  const inventariados = detalles.filter(d => d.inventariado?.trim() === '1').length;
  const pct           = total > 0 ? Math.round((inventariados / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: '#fff', border: '1.5px solid #e2e8f0', maxHeight: '85vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1.5px solid #f1f5f9' }}>
          <div>
            <h2 className="text-base font-bold" style={{ color: '#0f172a' }}>Detalle — {carga.descripcion}</h2>
            <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>Carga #{carga.codCarga}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <MdClose size={20} style={{ color: '#64748b' }} />
          </button>
        </div>

        {/* Progreso */}
        <div className="px-6 py-4" style={{ borderBottom: '1.5px solid #f1f5f9' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MdBarChart size={16} style={{ color: '#1e4786' }} />
              <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>Progreso de inventario</span>
            </div>
            <span className="text-sm font-bold" style={{ color: pct === 100 ? '#0f9b76' : '#1e4786' }}>
              {inventariados} / {total} ({pct}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#f1f5f9' }}>
            <div className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#22c4a1' : '#1e4786' }} />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full">
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                {['#', 'Código', 'Descripción', 'Responsable', 'Fecha Inv.', 'Observación', 'Estado'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ color: '#94a3b8', backgroundColor: '#fafafa' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detalles.map((d, i) => {
                const esInv = d.inventariado?.trim() === '1';
                return (
                  <tr key={d.id ?? i} style={{ borderBottom: '1px solid #f8fafc', backgroundColor: esInv ? 'rgba(34,196,161,0.02)' : 'transparent' }}>
                    <td className="px-4 py-3 text-xs font-mono font-bold" style={{ color: '#cbd5e1' }}>{i + 1}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>{d.codActivo}</span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#0f172a', minWidth: 160 }}>{d.activo?.descripcion ?? '—'}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#64748b' }}>{d.responsable?.nombreResponsable ?? '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ minWidth: 130 }}>
                      {d.fechainventario
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-lg" style={{ backgroundColor: 'rgba(30,71,134,0.06)', color: '#1e4786' }}>{d.fechainventario}</span>
                        : <span style={{ color: '#e2e8f0' }}>—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#64748b', maxWidth: 200 }}>
                      {d.obs ? <span className="block truncate" title={d.obs}>{d.obs}</span> : <span style={{ color: '#e2e8f0' }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {esInv
                        ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(34,196,161,0.1)', color: '#0f9b76' }}><MdCheckCircle size={13} /> Inventariado</span>
                        : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(148,163,184,0.1)', color: '#94a3b8' }}><MdPendingActions size={13} /> Pendiente</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {detalles.length === 0 && (
            <div className="text-center py-16">
              <MdAssignment size={36} style={{ color: '#e2e8f0', margin: '0 auto 8px' }} />
              <p className="text-sm" style={{ color: '#94a3b8' }}>Sin detalles para esta carga</p>
            </div>
          )}
        </div>

        <div className="px-6 py-3 flex justify-end" style={{ borderTop: '1.5px solid #f1f5f9', backgroundColor: '#fafafa' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ color: '#64748b', backgroundColor: '#f1f5f9' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}