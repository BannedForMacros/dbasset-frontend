'use client';

import { useState, useEffect } from 'react';
import { MdLocationOn, MdCheckCircle } from 'react-icons/md';
import Select from '@/app/components/Select';
import { Local } from '../../../../services/local.service';
import { Area } from '../../../../services/area.service';
import { Oficina } from '../../../../services/oficina.service';
import { PasoEncabezado, AvisoPaso } from './PasoEncabezado';

interface UbicacionSelectorProps {
  locales: Local[];
  areas: Area[];
  oficinas: Oficina[];
  onUbicacionComplete: (local: number, area: number, oficina: number) => void;
}

export default function UbicacionSelector({
  locales,
  areas,
  oficinas,
  onUbicacionComplete
}: UbicacionSelectorProps) {
  const [selectedLocal, setSelectedLocal] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedOficina, setSelectedOficina] = useState('');

  const areasFiltered = selectedLocal
    ? areas.filter(a => {
        const local = 'codLocal' in a.local ? a.local.codLocal : (a.local as Local).codLocal;
        return local === Number(selectedLocal);
      })
    : [];

  const oficinasFiltered = selectedArea
    ? oficinas.filter(o => {
        const area = 'codArea' in o.area ? o.area.codArea : (o.area as Area).codArea;
        return area === Number(selectedArea);
      })
    : [];

  useEffect(() => {
    if (selectedLocal && selectedArea && selectedOficina) {
      onUbicacionComplete(
        Number(selectedLocal),
        Number(selectedArea),
        Number(selectedOficina)
      );
    }
  }, [selectedLocal, selectedArea, selectedOficina, onUbicacionComplete]);

  const isComplete = selectedLocal && selectedArea && selectedOficina;

  return (
    <div className="space-y-5">
      <PasoEncabezado
        icono={<MdLocationOn size={24} />}
        titulo="Ubicación de la carga"
        descripcion="Todos los activos de esta carga quedarán en la ubicación que elija."
      />

      <div className="rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4"
        style={{ backgroundColor: '#fff', border: '1.5px solid #e2e8f0' }}>
        <Select
          label="1. Local"
          required
          value={selectedLocal}
          onChange={(v) => {
            setSelectedLocal(v);
            setSelectedArea('');
            setSelectedOficina('');
          }}
          placeholder="Seleccionar local"
          options={locales.map(l => ({ value: l.codLocal ?? '', label: l.nombreLocal }))}
        />
        <Select
          label="2. Área"
          required
          value={selectedArea}
          onChange={(v) => {
            setSelectedArea(v);
            setSelectedOficina('');
          }}
          disabled={!selectedLocal}
          placeholder={selectedLocal ? 'Seleccionar área' : 'Primero el local'}
          options={areasFiltered.map(a => ({ value: a.codArea ?? '', label: a.nombreArea }))}
        />
        <Select
          label="3. Oficina"
          required
          value={selectedOficina}
          onChange={(v) => setSelectedOficina(v)}
          disabled={!selectedArea}
          placeholder={selectedArea ? 'Seleccionar oficina' : 'Primero el área'}
          options={oficinasFiltered.map(o => ({ value: o.codOficina ?? '', label: o.nombreOficina }))}
        />
      </div>

      {isComplete && (
        <AvisoPaso tono="ok" icono={<MdCheckCircle size={18} />}>
          Ubicación completa. Todos los activos se asignarán a esta oficina.
        </AvisoPaso>
      )}
    </div>
  );
}
