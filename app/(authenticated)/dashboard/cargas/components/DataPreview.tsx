'use client';

import { MdVisibility, MdSelectAll, MdInfo } from 'react-icons/md';

type ExcelRow = Record<string, string | number | boolean | null | undefined>;

interface DataPreviewProps {
  data: ExcelRow[];
  selectedRows: Set<number>;
  onRowToggle: (index: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  assignedRows?: Set<number>;
  rowAssignments?: Map<number, { responsable?: string; inventariador?: string }>;
}

export default function DataPreview({ 
  data, 
  selectedRows, 
  onRowToggle, 
  onSelectAll, 
  onDeselectAll,
  assignedRows = new Set(),
  rowAssignments = new Map()
}: DataPreviewProps) {
  if (data.length === 0) return null;

  const headers = Object.keys(data[0]);
  const previewData = data.slice(0, 100);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
        <div className="flex items-center gap-3">
          <MdVisibility className="text-blue-600" size={20} />
          <h4 className="font-bold text-gray-800">Vista Previa</h4>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">
            {data.length} registros
          </span>
          {assignedRows.size > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">
              {assignedRows.size} asignados
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 font-medium flex items-center gap-1"
          >
            <MdSelectAll size={16} /> Todos
          </button>
          <button
            onClick={onDeselectAll}
            className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-300 font-medium"
          >
            Limpiar
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0 border-b">
            <tr>
              <th className="px-3 py-2 text-left font-bold text-gray-600 w-12">
                <input
                  type="checkbox"
                  checked={selectedRows.size === data.length}
                  onChange={() => selectedRows.size === data.length ? onDeselectAll() : onSelectAll()}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-3 py-2 text-left font-bold text-gray-600 w-16">#</th>
              <th className="px-3 py-2 text-left font-bold text-gray-600 w-48">Asignación</th>
              {headers.map(h => (
                <th key={h} className="px-3 py-2 text-left font-bold text-gray-600 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {previewData.map((row, idx) => {
              const isAssigned = assignedRows.has(idx + 1);
              const assignment = rowAssignments.get(idx + 1);
              const isSelected = selectedRows.has(idx);
              
              return (
                <tr 
                  key={idx} 
                  className={`cursor-pointer transition ${
                    isSelected ? 'bg-blue-50' : 
                    isAssigned ? 'bg-green-50' : 
                    'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => onRowToggle(idx)}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onRowToggle(idx)}
                      className="rounded border-gray-300"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-3 py-2 text-gray-500 font-mono font-bold">{idx + 1}</td>
                  <td className="px-3 py-2">
                    {isAssigned && assignment ? (
                      <div className="space-y-1">
                        {assignment.responsable && (
                          <div className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            R: {assignment.responsable}
                          </div>
                        )}
                        {assignment.inventariador && (
                          <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            I: {assignment.inventariador}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold">
                        Sin asignar
                      </span>
                    )}
                  </td>
                  {headers.map(h => (
                    <td key={h} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                      {String(row[h] || '').substring(0, 30)}
                      {String(row[h] || '').length > 30 ? '...' : ''}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {data.length > 100 && (
        <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 border-t flex items-center gap-2">
          <MdInfo size={16} />
          Mostrando primeras 100 filas de {data.length} totales
        </div>
      )}
    </div>
  );
}