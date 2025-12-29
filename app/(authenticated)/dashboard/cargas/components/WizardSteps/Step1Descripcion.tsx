'use client';

import { MdInsertDriveFile } from 'react-icons/md';

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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <MdInsertDriveFile className="text-blue-600 mx-auto mb-4" size={64} />
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Crear Nueva Carga</h3>
        <p className="text-gray-600">Ingrese una descripción identificable para esta carga</p>
      </div>
      
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Descripción de la Carga
        </label>
        <input
          type="text"
          autoFocus
          value={descripcion}
          onChange={(e) => onDescripcionChange(e.target.value)}
          placeholder="Ej: Inventario Oficina Central - Diciembre 2024"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none text-lg"
          onKeyPress={(e) => e.key === 'Enter' && onNext()}
        />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm text-blue-800">
        <p className="font-bold mb-1">💡 Consejo</p>
        <p>Use descripciones claras que incluyan ubicación, fecha o tipo de inventario.</p>
      </div>
    </div>
  );
}