/* eslint-disable @next/next/no-img-element */
'use client';

import { Carga } from '../../../../services/carga.service';
import { CargaFirma } from '../../../../services/carga-firma.service';
import { Responsable } from '../../../../services/responsable.service';
import { MdClose, MdDraw } from 'react-icons/md';

interface Props {
  open: boolean;
  carga: Carga | null;
  firmas: CargaFirma[];
  loading: boolean;
  responsables: Responsable[];
  onClose: () => void;
}

export default function ModalFirmas({ open, carga, firmas, loading, responsables, onClose }: Props) {
  if (!open || !carga) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: '#fff', border: '1.5px solid #e2e8f0', maxHeight: '80vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1.5px solid #f1f5f9' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(30,71,134,0.08)' }}>
              <MdDraw size={20} style={{ color: '#1e4786' }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: '#0f172a' }}>Firmas — {carga.descripcion}</h2>
              <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                Carga #{carga.codCarga} · {firmas.length} firma{firmas.length !== 1 ? 's' : ''} registrada{firmas.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <MdClose size={20} style={{ color: '#64748b' }} />
          </button>
        </div>

        {/* Contenido */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map(i => <div key={i} className="rounded-xl p-4 animate-pulse" style={{ backgroundColor: '#f8fafc', border: '1.5px solid #f1f5f9', height: 160 }} />)}
            </div>
          ) : firmas.length === 0 ? (
            <div className="text-center py-16">
              <MdDraw size={36} style={{ color: '#e2e8f0', margin: '0 auto 8px' }} />
              <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>No hay firmas registradas para esta carga</p>
              <p className="text-xs mt-1" style={{ color: '#cbd5e1' }}>Las firmas se registran desde la app móvil</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {firmas.map((f, i) => {
                const resp   = responsables.find(r => r.codResponsable === f.codResponsable);
                const nombre = resp?.nombreResponsable ?? f.nombreResponsable ?? `Responsable #${f.codResponsable}`;
                return (
                  <div key={f.id ?? i} className="rounded-xl p-4" style={{ backgroundColor: '#f8fafc', border: '1.5px solid #f1f5f9' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: '#1e4786' }}>{nombre.charAt(0).toUpperCase()}</div>
                      <div>
                        <p className="text-sm font-semibold leading-tight" style={{ color: '#0f172a' }}>{nombre}</p>
                        {f.nombreOficina && <p className="text-xs" style={{ color: '#94a3b8' }}>{f.nombreOficina}</p>}
                      </div>
                    </div>
                    {f.firma ? (
                      <div className="rounded-lg overflow-hidden flex items-center justify-center"
                        style={{ backgroundColor: '#fff', border: '1.5px solid #e2e8f0', minHeight: 100 }}>
                        <img src={f.firma.startsWith('data:') ? f.firma : `data:image/png;base64,${f.firma}`}
                          alt={`Firma de ${nombre}`} className="max-h-24 object-contain" />
                      </div>
                    ) : (
                      <div className="rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: '#f1f5f9', border: '1.5px dashed #cbd5e1', minHeight: 80 }}>
                        <p className="text-xs" style={{ color: '#94a3b8' }}>Sin imagen de firma</p>
                      </div>
                    )}
                  </div>
                );
              })}
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