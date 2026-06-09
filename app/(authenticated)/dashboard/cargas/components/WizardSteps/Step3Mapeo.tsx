'use client';

import { MdLink, MdVisibility, MdVisibilityOff, MdPriorityHigh, MdLocationOn, MdWarning } from 'react-icons/md';
import { CampoConfig } from '../../../../../services/configuracion.service';

interface Step3MapeoProps {
  campos: CampoConfig[];
  excelHeaders: string[];
  mapeo: Record<string, string>;
  modoUbicacion: 'excel' | 'unica' | null;
  onModoChange: (modo: 'excel' | 'unica') => void;
  onMapeoChange: (campo: string, columna: string) => void;
  onCampoToggle: (id: number, key: 'esVisible' | 'esObligatorio') => void;
}

export default function Step3Mapeo({
  campos,
  excelHeaders,
  mapeo,
  modoUbicacion,
  onModoChange,
  onMapeoChange,
  onCampoToggle
}: Step3MapeoProps) {
  // Campos de ubicación (no están en configuración dinámica)
  const camposUbicacion = [
    { key: 'cod_local', label: 'Local / Sede' },
    { key: 'cod_area', label: 'Área' },
    { key: 'cod_oficina', label: 'Oficina' }
  ];

  const tieneUbicacion = camposUbicacion.every(cu => mapeo[cu.key]);

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

      {/* SELECCIÓN EXPLÍCITA DEL MODO DE UBICACIÓN */}
      <div className="border-2 border-blue-300 rounded-lg overflow-hidden">
        <div className="bg-blue-100 px-4 py-3 border-b border-blue-300 flex items-center gap-2">
          <MdLocationOn className="text-blue-600" size={20} />
          <h4 className="font-bold text-gray-800">¿Cómo se asigna la ubicación? (Obligatorio)</h4>
        </div>

        <div className="p-4 bg-blue-50 space-y-4">
          {/* Dos opciones explícitas */}
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onModoChange('unica')}
              className={`text-left p-4 rounded-lg border-2 transition ${
                modoUbicacion === 'unica'
                  ? 'border-blue-600 bg-white ring-2 ring-blue-200'
                  : 'border-gray-300 bg-white hover:border-blue-400'
              }`}
            >
              <p className="font-bold text-gray-800 flex items-center gap-2">
                <MdLocationOn size={18} className="text-blue-600" />
                Una sola ubicación para toda la carga
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Todos los activos del Excel pertenecen al mismo Local / Área / Oficina.
                Lo eliges en el siguiente paso.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onModoChange('excel')}
              className={`text-left p-4 rounded-lg border-2 transition ${
                modoUbicacion === 'excel'
                  ? 'border-blue-600 bg-white ring-2 ring-blue-200'
                  : 'border-gray-300 bg-white hover:border-blue-400'
              }`}
            >
              <p className="font-bold text-gray-800 flex items-center gap-2">
                <MdLink size={18} className="text-blue-600" />
                La ubicación viene en el Excel
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Cada activo trae su propia ubicación en columnas. Las mapeas aquí abajo.
              </p>
            </button>
          </div>

          {/* Aviso para ubicación única */}
          {modoUbicacion === 'unica' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-3">
              <MdLocationOn className="text-green-600 shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-green-800">
                Asignarás <strong>Local, Área y Oficina</strong> para toda la carga en el siguiente paso.
                No necesitas columnas de ubicación en el Excel.
              </p>
            </div>
          )}

          {/* Selects de ubicación SOLO si la ubicación viene en el Excel */}
          {modoUbicacion === 'excel' && (
            <div className="space-y-3">
              {camposUbicacion.map((campo) => (
                <div key={campo.key} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-blue-200">
                  <div className="w-1/3">
                    <p className="font-bold text-gray-800 flex items-center gap-2">
                      {campo.label}
                      <span className="text-red-500 text-xs flex items-center gap-1">
                        <MdPriorityHigh size={14} /> Requerido
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 font-mono">DB: {campo.key}</p>
                  </div>

                  <div className="flex-1">
                    <select
                      value={mapeo[campo.key] || ''}
                      onChange={(e) => onMapeoChange(campo.key, e.target.value)}
                      className={`w-full px-3 py-2.5 border-2 rounded-lg outline-none transition ${
                        !mapeo[campo.key]
                          ? 'border-red-300 bg-red-50 focus:border-red-500'
                          : 'border-green-300 bg-green-50 focus:border-green-500'
                      }`}
                    >
                      <option value="">-- Seleccionar columna --</option>
                      {excelHeaders.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}

              {tieneUbicacion ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-sm text-green-800 font-medium">
                    ✓ Ubicación completa. Los activos tomarán su ubicación del Excel.
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-3">
                  <MdWarning className="text-amber-600 shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-amber-800">
                    Debe mapear <strong>Local</strong>, <strong>Área</strong> y <strong>Oficina</strong> desde las columnas del Excel.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN DE CAMPOS DINÁMICOS */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h4 className="font-bold text-gray-800">Campos del Activo</h4>
        </div>

        <div className="p-4 space-y-3">
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
                  className="flex flex-col items-center gap-1"
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
                  className="flex flex-col items-center gap-1"
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
    </div>
  );
}