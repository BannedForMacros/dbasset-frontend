import React from 'react';
import { MdSearch, MdInbox } from 'react-icons/md';

interface DataTableProps<T> {
  data: T[];
  columns: { header: string; className?: string }[];
  // ✅ CAMBIO 1: Definimos que renderRow recibe (item, index)
  renderRow: (item: T, index: number) => React.ReactNode; 
  loading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters?: React.ReactNode; 
}

export function DataTable<T>({
  data,
  columns,
  renderRow,
  loading,
  searchTerm,
  onSearchChange,
  filters
}: DataTableProps<T>) {

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* Barra de Herramientas */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MdSearch className="text-gray-400" size={20} />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        {filters && (
          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
            {filters}
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
              {columns.map((col, idx) => (
                <th key={idx} className={`px-6 py-4 ${col.className || ''}`}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-gray-500">
                  <div className="flex justify-center items-center gap-2">Cargando datos...</div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <MdInbox size={40} className="mb-2 text-gray-300"/> 
                    No se encontraron registros
                  </div>
                </td>
              </tr>
            ) : (
              // ✅ CAMBIO 2: Pasamos el 'index' aquí. Esto arregla el error NaN.
              data.map((item, index) => renderRow(item, index))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer */}
      {!loading && data.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-right">
          Total: {data.length} registros
        </div>
      )}
    </div>
  );
}