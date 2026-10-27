'use client';

import { MdEditNote, MdLightbulbOutline } from 'react-icons/md';
import { PasoEncabezado } from '../PasoEncabezado';

interface Step1DescripcionProps {
  descripcion: string;
  onDescripcionChange: (value: string) => void;
  onNext: () => void;
}

export default function Step1Descripcion({
  descripcion,
  onDescripcionChange,
  onNext
}: Step1DescripcionProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <PasoEncabezado
        icono={<MdEditNote size={26} />}
        titulo="Nombre de la carga"
        descripcion="Una descripción clara ayuda a encontrar la carga después en el historial."
      />

      <div className="rounded-2xl p-5 space-y-2" style={{ backgroundColor: '#fff', border: '1.5px solid #e2e8f0' }}>
        <label htmlFor="descripcion-carga" className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
          Descripción <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          id="descripcion-carga"
          type="text"
          autoFocus
          value={descripcion}
          onChange={(e) => onDescripcionChange(e.target.value)}
          placeholder="Ej: Inventario anual 2026 - Sede Central"
          className="input-suave"
          style={{ fontSize: '1rem', padding: '0.8rem 0.9rem' }}
          onKeyDown={(e) => e.key === 'Enter' && onNext()}
          maxLength={255}
        />
      </div>

      <div className="rounded-xl p-3.5 flex items-start gap-3 text-sm"
        style={{ backgroundColor: 'rgba(30,71,134,0.05)', border: '1px solid rgba(30,71,134,0.12)', color: '#334155' }}>
        <MdLightbulbOutline size={20} className="shrink-0 mt-0.5" style={{ color: '#1e4786' }} />
        <p>Incluya el tipo de inventario, la ubicación y la fecha. Por ejemplo: <i>“Inventario semestral 2026 - Almacén Lurín”</i>.</p>
      </div>
    </div>
  );
}
