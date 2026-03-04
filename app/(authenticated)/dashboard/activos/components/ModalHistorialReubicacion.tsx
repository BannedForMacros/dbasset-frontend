'use client';

import { Local } from '../../../../services/local.service';
import { Area } from '../../../../services/area.service';
import { Oficina } from '../../../../services/oficina.service';
import { Responsable } from '../../../../services/responsable.service';
import { Reubicacion } from '../../../../services/reubicacion.service';
import {
  MdClose, MdHistory, MdLocationOn, MdArrowForward,
  MdPerson, MdCalendarToday,
} from 'react-icons/md';

interface Props {
  open: boolean;
  codActivo: string;
  descripcion: string;
  reubicaciones: Reubicacion[];
  loading: boolean;
  locales: Local[];
  areas: Area[];
  oficinas: Oficina[];
  responsables: Responsable[];
  onClose: () => void;
}

function getNombre(
  lista: { codLocal?: number; codArea?: number; codOficina?: number; codResponsable?: number; nombreLocal?: string; nombreArea?: string; nombreOficina?: string; nombreResponsable?: string }[],
  cod: number | undefined,
  campo: 'nombreLocal' | 'nombreArea' | 'nombreOficina' | 'nombreResponsable',
  codCampo: 'codLocal' | 'codArea' | 'codOficina' | 'codResponsable'
): string {
  if (!cod) return '—';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const found = (lista as any[]).find((i: any) => i[codCampo] === cod);
  return found?.[campo] ?? `#${cod}`;
}

export default function ModalHistorialReubicacion({
  open, codActivo, descripcion, reubicaciones, loading,
  locales, areas, oficinas, responsables, onClose,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-3xl rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: '#fff', border: '1.5px solid #e2e8f0', maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1.5px solid #f1f5f9' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(30,71,134,0.08)' }}>
              <MdHistory size={20} style={{ color: '#1e4786' }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: '#0f172a' }}>
                Historial de Reubicaciones
              </h2>
              <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                {descripcion} ·{' '}
                <span className="font-mono">{codActivo}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <MdClose size={20} style={{ color: '#64748b' }} />
          </button>
        </div>

        {/* Contenido */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl p-4 animate-pulse"
                  style={{ backgroundColor: '#f8fafc', border: '1.5px solid #f1f5f9', height: 100 }} />
              ))}
            </div>
          ) : reubicaciones.length === 0 ? (
            <div className="text-center py-16">
              <MdHistory size={36} style={{ color: '#e2e8f0', margin: '0 auto 8px' }} />
              <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>
                Sin reubicaciones registradas
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reubicaciones.map((r, i) => {
                const localAnt  = getNombre(locales,      r.codLocalAnterior,   'nombreLocal',       'codLocal');
                const areaAnt   = getNombre(areas,        r.codAreaAnterior,    'nombreArea',        'codArea');
                const ofAnt     = getNombre(oficinas,     r.codOficinaAnterior, 'nombreOficina',     'codOficina');
                const respAnt   = getNombre(responsables, r.codRespAnterior,    'nombreResponsable', 'codResponsable');

                const localNvo  = getNombre(locales,      r.codLocalNuevo,      'nombreLocal',       'codLocal');
                const areaNvo   = getNombre(areas,        r.codAreaNuevo,       'nombreArea',        'codArea');
                const ofNvo     = getNombre(oficinas,     r.codOficinaaNuevo,   'nombreOficina',     'codOficina');
                const respNvo   = getNombre(responsables, r.codRespNuevo,       'nombreResponsable', 'codResponsable');

                return (
                  <div key={r.id ?? i} className="rounded-xl p-4"
                    style={{ backgroundColor: '#f8fafc', border: '1.5px solid #f1f5f9' }}>

                    {/* Fecha y observación */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(30,71,134,0.08)', color: '#1e4786' }}>
                          #{reubicaciones.length - i}
                        </span>
                        {r.fechaReubicacion && (
                          <div className="flex items-center gap-1 text-xs" style={{ color: '#64748b' }}>
                            <MdCalendarToday size={12} />
                            {r.fechaReubicacion}
                          </div>
                        )}
                      </div>
                      {r.observacion && r.observacion !== '0' && (
                        <span className="text-xs px-2 py-0.5 rounded-lg"
                          style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
                          {r.observacion}
                        </span>
                      )}
                    </div>

                    {/* Ubicación: anterior → nueva */}
                    <div className="grid grid-cols-1 gap-3" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
                      {/* Anterior */}
                      <div className="rounded-lg p-3"
                        style={{ backgroundColor: '#fff', border: '1.5px solid #fee2e2' }}>
                        <p className="text-xs font-bold uppercase tracking-wider mb-2"
                          style={{ color: '#ef4444' }}>Anterior</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#64748b' }}>
                            <MdLocationOn size={12} style={{ color: '#ef4444', flexShrink: 0 }} />
                            <span>{localAnt} › {areaAnt} › {ofAnt}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#64748b' }}>
                            <MdPerson size={12} style={{ color: '#ef4444', flexShrink: 0 }} />
                            <span>{respAnt}</span>
                          </div>
                        </div>
                      </div>

                      {/* Flecha */}
                      <div className="flex items-center justify-center px-2">
                        <MdArrowForward size={20} style={{ color: '#94a3b8' }} />
                      </div>

                      {/* Nueva */}
                      <div className="rounded-lg p-3"
                        style={{ backgroundColor: '#fff', border: '1.5px solid #bbf7d0' }}>
                        <p className="text-xs font-bold uppercase tracking-wider mb-2"
                          style={{ color: '#0f9b76' }}>Nueva</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#64748b' }}>
                            <MdLocationOn size={12} style={{ color: '#0f9b76', flexShrink: 0 }} />
                            <span>{localNvo} › {areaNvo} › {ofNvo}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#64748b' }}>
                            <MdPerson size={12} style={{ color: '#0f9b76', flexShrink: 0 }} />
                            <span>{respNvo}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-3 flex justify-end"
          style={{ borderTop: '1.5px solid #f1f5f9', backgroundColor: '#fafafa' }}>
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{ color: '#64748b', backgroundColor: '#f1f5f9' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}