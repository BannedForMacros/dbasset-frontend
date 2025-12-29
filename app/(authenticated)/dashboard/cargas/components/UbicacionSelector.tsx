'use client';

import { useState, useEffect } from 'react';
import { MdLocationOn, MdWarning } from 'react-icons/md';
import { Local } from '../../../../services/local.service';
import { Area } from '../../../../services/area.service';
import { Oficina } from '../../../../services/oficina.service';

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
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MdWarning className="text-amber-600 shrink-0 mt-0.5" size={24} />
          <div className="text-sm text-amber-800">
            <p className="font-bold mb-1">Ubicación Requerida</p>
            <p>
              El archivo Excel no contiene columnas de ubicación (Local, Área, Oficina). 
              Todos los activos de esta carga se asignarán a la ubicación que seleccione a continuación.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <MdLocationOn className="text-blue-600" size={24} />
          <h3 className="font-bold text-gray-800">Seleccionar Ubicación Única</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Local <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedLocal}
              onChange={(e) => {
                setSelectedLocal(e.target.value);
                setSelectedArea('');
                setSelectedOficina('');
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Seleccionar Local</option>
              {locales.map(l => (
                <option key={l.codLocal} value={l.codLocal}>{l.nombreLocal}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Área <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedArea}
              onChange={(e) => {
                setSelectedArea(e.target.value);
                setSelectedOficina('');
              }}
              disabled={!selectedLocal}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Seleccionar Área</option>
              {areasFiltered.map(a => (
                <option key={a.codArea} value={a.codArea}>{a.nombreArea}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Oficina <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedOficina}
              onChange={(e) => setSelectedOficina(e.target.value)}
              disabled={!selectedArea}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Seleccionar Oficina</option>
              {oficinasFiltered.map(o => (
                <option key={o.codOficina} value={o.codOficina}>{o.nombreOficina}</option>
              ))}
            </select>
          </div>
        </div>

        {isComplete && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-sm text-green-800 font-medium">
              Ubicación completa. Todos los activos se asignarán a esta ubicación.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}