'use client';

import { MdLink, MdVisibility, MdVisibilityOff, MdPriorityHigh } from 'react-icons/md';
import { CampoConfig } from '../../../../../services/configuracion.service';

interface Step3MapeoProps {
  campos: CampoConfig[];
  excelHeaders: string[];
  mapeo: Record<string, string>;
  onMapeoChange: (campo: string, columna: string) => void;
  onCampoToggle: (id: number, key: 'esVisible' | 'esObligatorio') => void;
}

export default function Step3Mapeo({ 
  campos, 
  excelHeaders, 
  mapeo, 
  onMapeoChange, 
  onCampoToggle 
}: Step3MapeoProps) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <MdLink className="text-blue-600 shrink-0 mt-0.5" size={24} />
          <div>
            <h3 className="font-bold text-gray-800 mb-1">Mapeo de Columnas</h3>
            <p className="text-sm text-gray-600">
              Relacione las columnas del Excel con los campos del sistema
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {campos.map((campo) => (
          <div
            key={campo.id}
            className="flex flex-col lg:flex-row items-start lg:items-center gap-4 p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition"
          >
            <div className="w-full lg:w-1/3">
              <p className="font-bold text-gray-800 flex items-center gap-2">
                {campo.etiquetaUsuario}
                {campo.esObligatorio && (
                  <span className="text-red-500 text-xs flex items-center gap-1">
                    <MdPriorityHigh size={14} /> Obligatorio
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400 font-mono">DB: {campo.nombreCampoBd}</p>
            </div>

            <div className="w-full lg:w-1/3">
              <select
                value={mapeo[campo.nombreCampoBd] || ''}
                onChange={(e) => onMapeoChange(campo.nombreCampoBd, e.target.value)}
                className={`w-full px-3 py-2.5 border-2 rounded-lg outline-none transition ${
                  campo.esObligatorio && !mapeo[campo.nombreCampoBd]
                    ? 'border-red-300 bg-red-50 focus:border-red-500'
                    : 'border-gray-300 bg-white focus:border-blue-500'
                }`}
              >
                <option value="">-- Sin mapear --</option>
                {excelHeaders.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div className="w-full lg:w-1/3 flex justify-end gap-6">
              <button
                onClick={() => onCampoToggle(campo.id, 'esVisible')}
                className="flex flex-col items-center gap-1 group"
              >
                <span className="text-[10px] font-bold text-gray-500 uppercase">Visible</span>
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  campo.esVisible ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                    campo.esVisible ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </div>
                {campo.esVisible ? (
                  <MdVisibility size={16} className="text-blue-600" />
                ) : (
                  <MdVisibilityOff size={16} className="text-gray-400" />
                )}
              </button>

              <button
                onClick={() => onCampoToggle(campo.id, 'esObligatorio')}
                className="flex flex-col items-center gap-1 group"
              >
                <span className="text-[10px] font-bold text-gray-500 uppercase">Obligatorio</span>
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  campo.esObligatorio ? 'bg-red-600' : 'bg-gray-300'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                    campo.esObligatorio ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </div>
                {campo.esObligatorio ? (
                  <MdPriorityHigh size={16} className="text-red-600" />
                ) : (
                  <span className="w-4 h-4"></span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}