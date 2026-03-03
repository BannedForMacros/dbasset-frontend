'use client';

import { MdClose, MdBusiness, MdLayers, MdMeetingRoom, MdPerson, MdInsertDriveFile, MdBuild, MdLocationOn } from 'react-icons/md';
import Badge from '@/app/components/Badge';
import { Activo } from '@/app/services/activo.service';
import { Carga } from '@/app/services/carga.service';
import { Local } from '@/app/services/local.service';
import { Area } from '@/app/services/area.service';
import { Oficina } from '@/app/services/oficina.service';
import { Responsable } from '@/app/services/responsable.service';
import { Estado } from '@/app/services/estado.service';

interface ActivoConCarga extends Activo { detalleCarga?: { carga?: Carga } }

function getEstadoType(nombre: string): 'good' | 'regular' | 'bad' | 'neutral' {
  const n = nombre.toLowerCase();
  if (n.includes('bueno') || n.includes('nuevo') || n.includes('excelente')) return 'good';
  if (n.includes('regular') || n.includes('medio')) return 'regular';
  if (n.includes('malo') || n.includes('dañado') || n.includes('deteriorado')) return 'bad';
  return 'neutral';
}

interface Props { open: boolean; onClose: () => void; activo: ActivoConCarga | null; }

export default function ModalDetalle({ open, onClose, activo }: Props) {
  if (!open || !activo) return null;
  const estado = activo.estado as Estado | undefined;
  const local  = activo.local as Local | undefined;
  const area   = activo.area as Area | undefined;
  const oficina = activo.oficina as Oficina | undefined;
  const responsable = activo.responsable as Responsable | undefined;
  const carga = activo.detalleCarga?.carga;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-3xl my-8 rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: '#fff', boxShadow: '0 25px 60px rgba(0,0,0,0.15)', maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ background: 'linear-gradient(135deg, #003366 0%, #1e4786 100%)' }}>
          <div>
            <h3 className="font-bold text-lg text-white">Detalle del Activo</h3>
            <p className="text-xs mt-0.5 font-mono" style={{ color: '#22c4a1' }}>{activo.codActivo}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg"
            style={{ color: 'rgba(255,255,255,0.7)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <MdClose size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Descripción principal */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl"
            style={{ backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0' }}>
            <div>
              <p className="text-xl font-bold" style={{ color: '#0f172a' }}>{activo.descripcion}</p>
              {activo.codInterno && (
                <p className="text-xs mt-1 font-mono" style={{ color: '#94a3b8' }}>Int: {activo.codInterno}</p>
              )}
            </div>
            {estado?.nombreEstado && (
              <Badge label={estado.nombreEstado} type={getEstadoType(estado.nombreEstado)} />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Carga */}
            {carga && (
              <InfoSection icon={<MdInsertDriveFile size={18}/>} title="Carga de Inventario" accent="brand">
                <InfoRow label="N° Carga" value={`#${carga.codCarga}`} mono />
                <InfoRow label="Descripción" value={carga.descripcion || '—'} />
                <InfoRow label="Fecha" value={carga.fecha || '—'} />
              </InfoSection>
            )}

            {/* Técnicos */}
            <InfoSection icon={<MdBuild size={18}/>} title="Detalles Técnicos">
              <InfoRow label="Marca"  value={activo.marca  || '—'} />
              <InfoRow label="Modelo" value={activo.modelo || '—'} />
              <InfoRow label="Serie"  value={activo.serie  || '—'} mono />
              <InfoRow label="Color"  value={activo.color  || '—'} />
              <InfoRow label="Año"    value={activo.anio   || '—'} />
              <InfoRow label="F. Compra" value={activo.fechaCompra || '—'} />
            </InfoSection>

            {/* Ubicación */}
            <InfoSection icon={<MdLocationOn size={18}/>} title="Ubicación Física" accent="blue">
              <InfoRow label="Local"   value={local?.nombreLocal    || '—'} icon={<MdBusiness size={13}/>} />
              <InfoRow label="Área"    value={area?.nombreArea      || '—'} icon={<MdLayers size={13}/>} />
              <InfoRow label="Oficina" value={oficina?.nombreOficina || '—'} icon={<MdMeetingRoom size={13}/>} />
            </InfoSection>

            {/* Asignación */}
            <InfoSection icon={<MdPerson size={18}/>} title="Asignación" accent="teal">
              <InfoRow label="Custodio" value={responsable?.nombreResponsable || '—'} />
              <InfoRow label="Estado"   value={estado?.nombreEstado || '—'} />
            </InfoSection>
          </div>
        </div>

        <div className="flex justify-end px-6 py-4" style={{ borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#1e4786' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#163564'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1e4786'}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoSection({ icon, title, children, accent }: {
  icon: React.ReactNode; title: string; children: React.ReactNode; accent?: 'blue' | 'teal' | 'brand';
}) {
  const bg = accent === 'blue' ? 'rgba(30,71,134,0.03)' : accent === 'teal' ? 'rgba(34,196,161,0.03)' : accent === 'brand' ? 'rgba(0,51,102,0.03)' : '#fafafa';
  const border = accent === 'blue' ? 'rgba(30,71,134,0.12)' : accent === 'teal' ? 'rgba(34,196,161,0.2)' : '#f1f5f9';
  const iconColor = accent === 'teal' ? '#22c4a1' : '#1e4786';
  return (
    <div className="rounded-xl p-4 space-y-2.5" style={{ backgroundColor: bg, border: `1.5px solid ${border}` }}>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: iconColor }}>{icon}</span>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono, icon }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs" style={{ color: '#94a3b8', minWidth: '80px' }}>{label}</span>
      <span className="text-sm font-medium flex items-center gap-1.5"
        style={{ color: '#0f172a', fontFamily: mono ? 'monospace' : 'inherit' }}>
        {icon && <span style={{ color: '#64748b' }}>{icon}</span>}
        {value}
      </span>
    </div>
  );
}