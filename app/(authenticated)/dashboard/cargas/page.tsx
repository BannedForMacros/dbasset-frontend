'use client';
import React, { ReactElement } from 'react';
import { useEffect, useState, useRef } from 'react';
import { cargaService, Carga, RangoDistribucion } from '../../../services/carga.service'; 
import { responsableService, Responsable } from '../../../services/responsable.service';
import { configuracionService, CampoConfig } from '../../../services/configuracion.service'; 
import * as XLSX from 'xlsx';
import { 
  MdAdd, MdAssignmentInd, MdCloudUpload, MdInsertDriveFile, 
  MdCheckCircle, MdArrowForward, MdLink, MdClose,
  MdVisibility, MdVisibilityOff, MdPriorityHigh, MdCheck,
  MdDelete, MdEdit, MdWarning, MdInfo, MdError, MdSearch,
  MdFilterList, MdSelectAll, MdLightbulb, MdPerson, MdSwapVert, MdInbox
} from 'react-icons/md';

// ==================== UTILIDADES ====================
// Función para formatear rangos de manera inteligente
const formatearRangos = (inicio: number, fin: number): string => {
  if (inicio === fin) {
    return `#${inicio}`;
  }
  return `#${inicio}-${fin}`;
};

// Función para agrupar números consecutivos
const agruparNumeros = (numeros: number[]): string => {
  if (numeros.length === 0) return '';
  
  const sorted = [...numeros].sort((a, b) => a - b);
  const grupos: string[] = [];
  let inicio = sorted[0];
  let fin = sorted[0];
  
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === fin + 1) {
      fin = sorted[i];
    } else {
      grupos.push(inicio === fin ? `${inicio}` : `${inicio}-${fin}`);
      inicio = sorted[i];
      fin = sorted[i];
    }
  }
  grupos.push(inicio === fin ? `${inicio}` : `${inicio}-${fin}`);
  
  return grupos.join(', ');
};
const mostrarListaInteligente = (numeros: number[], maxMostrar: number = 5): ReactElement => {
  if (numeros.length === 0) return <></>;
  
  if (numeros.length <= maxMostrar) {
    return <span>{agruparNumeros(numeros)}</span>;
  }
  
  const primeros = numeros.slice(0, maxMostrar);
  const restantes = numeros.slice(maxMostrar);
  
  return (
    <div className="space-y-2">
      <div className="text-sm">
        {agruparNumeros(primeros)}
      </div>
      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
        <span className="font-bold">+{restantes.length} más:</span>
        <div className="mt-1 max-h-20 overflow-y-auto">
          {agruparNumeros(restantes)}
        </div>
      </div>
    </div>
  );
};

type ExcelRow = Record<string, string | number | boolean | null | undefined>;


// ==================== COMPONENTE TOAST ====================
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  onClose: () => void;
}

const Toast = ({ type, message, details, onClose }: ToastProps) => {
  const icons = {
    success: <MdCheckCircle size={24} />,
    error: <MdError size={24} />,
    warning: <MdWarning size={24} />,
    info: <MdInfo size={24} />
  };

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-[100] ${styles[type]} border-2 rounded-xl shadow-2xl p-4 max-w-md animate-slideIn`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0">{icons[type]}</div>
        <div className="flex-1">
          <p className="font-bold text-sm">{message}</p>
          {details && <p className="text-xs mt-1 opacity-80">{details}</p>}
        </div>
        <button onClick={onClose} className="shrink-0 hover:opacity-60">
          <MdClose size={20} />
        </button>
      </div>
    </div>
  );
};

// ==================== COMPONENTE DATA PREVIEW ====================
interface DataPreviewProps {
  data: ExcelRow[];
  selectedRows: Set<number>;
  onRowToggle: (index: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  assignedRows?: Set<number>;
  rowAssignments?: Map<number, string>;
}

const DataPreview = ({ 
  data, 
  selectedRows, 
  onRowToggle, 
  onSelectAll, 
  onDeselectAll,
  assignedRows = new Set(),
  rowAssignments = new Map()
}: DataPreviewProps) => {
  if (data.length === 0) return null;

  const headers = Object.keys(data[0]);
  const previewData = data.slice(0, 100);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MdVisibility className="text-indigo-600" size={20} />
          <h4 className="font-bold text-gray-800">Vista Previa de Datos</h4>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">
            {data.length} registros
          </span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
            ✓ {assignedRows.size} asignados
          </span>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">
            ⧗ {data.length - assignedRows.size} pendientes
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-1"
          >
            <MdSelectAll size={16} /> Todos
          </button>
          <button
            onClick={onDeselectAll}
            className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300 font-medium"
          >
            Limpiar
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
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
              <th className="px-3 py-2 text-left font-bold text-gray-600 w-32">Estado</th>
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
              const assignedTo = rowAssignments.get(idx + 1);
              const isSelected = selectedRows.has(idx);
              
              return (
                <tr 
                  key={idx} 
                  className={`cursor-pointer transition ${
                    isSelected ? 'bg-indigo-100' : 
                    isAssigned ? 'bg-green-50' : 
                    'bg-white hover:bg-indigo-50'
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
                    {isAssigned ? (
                      <div className="flex items-center gap-1">
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold border border-green-200">
                          ✓ Asignado
                        </span>
                        {assignedTo && (
                          <span className="text-[10px] text-gray-500 truncate max-w-[100px]" title={assignedTo}>
                            {assignedTo}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200">
                        ⧗ Pendiente
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
};

// ==================== COMPONENTE ASSIGNMENT MANAGER ====================
interface AssignmentManagerProps {
  totalItems: number;
  responsables: Responsable[];
  distribuciones: (RangoDistribucion & { nombreResponsable: string })[];
  onDistribucionesChange: (dist: (RangoDistribucion & { nombreResponsable: string })[]) => void;
  selectedRows?: Set<number>;
  excelData: ExcelRow[];
}

const AssignmentManager = ({ 
  totalItems, 
  responsables, 
  distribuciones, 
  onDistribucionesChange,
  selectedRows,
  excelData 
}: AssignmentManagerProps) => {
  const [strategy, setStrategy] = useState<'equal' | 'manual' | 'selected'>('equal');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{ responsable: string; items: ExcelRow[] } | null>(null);
  const [selectedResponsables, setSelectedResponsables] = useState<Set<number>>(new Set());
  const [currentRange, setCurrentRange] = useState({ inicio: 1, fin: totalItems });
  const [selectedResp, setSelectedResp] = useState('');

  const filteredResponsables = responsables.filter(r => 
    r.nombreResponsable.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.cargo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular qué filas ya están asignadas y a quién
  const assignedRows = new Set<number>();
  const rowAssignments = new Map<number, string>();
  
  distribuciones.forEach(dist => {
    for (let i = dist.inicio; i <= dist.fin; i++) {
      assignedRows.add(i);
      rowAssignments.set(i, dist.nombreResponsable);
    }
  });

  const unassignedCount = totalItems - assignedRows.size;

  // Obtener filas pendientes agrupadas
  const getPendingRowsGrouped = (): string => {
    const pending: number[] = [];
    for (let i = 1; i <= totalItems; i++) {
      if (!assignedRows.has(i)) {
        pending.push(i);
      }
    }
    return agruparNumeros(pending);
  };

  const handleEqualDistribution = () => {
    const selectedResp = Array.from(selectedResponsables);
    if (selectedResp.length === 0) {
      alert('⚠️ Seleccione al menos un responsable');
      return;
    }

    const unassignedIndices = Array.from({ length: totalItems }, (_, i) => i + 1)
      .filter(idx => !assignedRows.has(idx));

    if (unassignedIndices.length === 0) {
      alert('⚠️ No hay ítems pendientes por asignar');
      return;
    }

    const itemsPerPerson = Math.floor(unassignedIndices.length / selectedResp.length);
    const remainder = unassignedIndices.length % selectedResp.length;

    const newDistributions: (RangoDistribucion & { nombreResponsable: string })[] = [];
    let currentIndex = 0;

    selectedResp.forEach((codResp, idx) => {
      const resp = responsables.find(r => r.codResponsable === codResp)!;
      const count = itemsPerPerson + (idx < remainder ? 1 : 0);
      
      const assignedIndices = unassignedIndices.slice(currentIndex, currentIndex + count);
      
      if (assignedIndices.length > 0) {
        let rangeStart = assignedIndices[0];
        let rangeEnd = assignedIndices[0];
        
        for (let i = 1; i < assignedIndices.length; i++) {
          if (assignedIndices[i] === rangeEnd + 1) {
            rangeEnd = assignedIndices[i];
          } else {
            newDistributions.push({
              inicio: rangeStart,
              fin: rangeEnd,
              codResponsable: codResp,
              nombreResponsable: resp.nombreResponsable
            });
            rangeStart = assignedIndices[i];
            rangeEnd = assignedIndices[i];
          }
        }
        
        newDistributions.push({
          inicio: rangeStart,
          fin: rangeEnd,
          codResponsable: codResp,
          nombreResponsable: resp.nombreResponsable
        });
      }

      currentIndex += count;
    });

    onDistribucionesChange([...distribuciones, ...newDistributions]);
    setSelectedResponsables(new Set());
  };

  const agregarRangoManual = () => {
    if (!selectedResp) {
      alert('⚠️ Seleccione un responsable');
      return;
    }
    if (currentRange.fin > totalItems || currentRange.inicio > currentRange.fin) {
      alert('⚠️ Rango inválido');
      return;
    }

    const overlap = distribuciones.some(dist => 
      (currentRange.inicio >= dist.inicio && currentRange.inicio <= dist.fin) ||
      (currentRange.fin >= dist.inicio && currentRange.fin <= dist.fin) ||
      (currentRange.inicio <= dist.inicio && currentRange.fin >= dist.fin)
    );

    if (overlap) {
      alert('⚠️ El rango se solapa con una asignación existente');
      return;
    }

    const resp = responsables.find(r => r.codResponsable === Number(selectedResp))!;
    const nuevoRango = {
      inicio: currentRange.inicio,
      fin: currentRange.fin,
      codResponsable: Number(selectedResp),
      nombreResponsable: resp.nombreResponsable
    };

    onDistribucionesChange([...distribuciones, nuevoRango]);

    const newAssignedRows = new Set(assignedRows);
    for (let i = currentRange.inicio; i <= currentRange.fin; i++) {
      newAssignedRows.add(i);
    }

    let nextStart = currentRange.fin + 1;
    while (nextStart <= totalItems && newAssignedRows.has(nextStart)) {
      nextStart++;
    }

    if (nextStart <= totalItems) {
      setCurrentRange({ inicio: nextStart, fin: totalItems });
      setSelectedResp('');
    }
  };

  const handleSelectedRowsAssignment = (codResponsable: number) => {
    if (!selectedRows || selectedRows.size === 0) {
      alert('⚠️ No hay filas seleccionadas');
      return;
    }

    const resp = responsables.find(r => r.codResponsable === codResponsable)!;
    const sortedIndices = Array.from(selectedRows).sort((a, b) => a - b).map(i => i + 1);

    const alreadyAssigned = sortedIndices.filter(idx => assignedRows.has(idx));
    if (alreadyAssigned.length > 0) {
      const reassign = confirm(
        `⚠️ Algunas filas ya están asignadas:\n${agruparNumeros(alreadyAssigned)}\n\n¿Desea REASIGNARLAS a ${resp.nombreResponsable}?`
      );
      
      if (!reassign) return;
      
      // Eliminar asignaciones previas de estas filas
      const newDistributions = distribuciones.filter(dist => {
        for (let i = dist.inicio; i <= dist.fin; i++) {
          if (alreadyAssigned.includes(i)) return false;
        }
        return true;
      });
      onDistribucionesChange(newDistributions);
    }

    const ranges: { inicio: number; fin: number }[] = [];
    let rangeStart = sortedIndices[0];
    let rangeEnd = sortedIndices[0];

    for (let i = 1; i < sortedIndices.length; i++) {
      if (sortedIndices[i] === rangeEnd + 1) {
        rangeEnd = sortedIndices[i];
      } else {
        ranges.push({ inicio: rangeStart, fin: rangeEnd });
        rangeStart = sortedIndices[i];
        rangeEnd = sortedIndices[i];
      }
    }
    ranges.push({ inicio: rangeStart, fin: rangeEnd });

    const newDistributions = ranges.map(range => ({
      ...range,
      codResponsable,
      nombreResponsable: resp.nombreResponsable
    }));

    onDistribucionesChange([...distribuciones, ...newDistributions]);
  };

  const handlePreviewItems = (dist: RangoDistribucion & { nombreResponsable: string }) => {
    const items = excelData.slice(dist.inicio - 1, dist.fin);
    setPreviewData({ responsable: dist.nombreResponsable, items });
    setShowPreview(true);
  };

  const handleDeleteAssignment = (index: number) => {
    if (confirm('¿Está seguro de eliminar esta asignación?')) {
      const newDistributions = distribuciones.filter((_, i) => i !== index);
      onDistribucionesChange(newDistributions);
    }
  };

  return (
    <div className="space-y-6">
      {/* Panel de Estado Global */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200">
          <p className="text-xs font-bold text-blue-600 mb-1">TOTAL ÍTEMS</p>
          <p className="text-3xl font-bold text-gray-800">{totalItems}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-200">
          <p className="text-xs font-bold text-green-600 mb-1">ASIGNADOS</p>
          <p className="text-3xl font-bold text-gray-800">{assignedRows.size}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border-2 border-amber-200">
          <p className="text-xs font-bold text-amber-600 mb-1">PENDIENTES</p>
          <p className="text-3xl font-bold text-gray-800">{unassignedCount}</p>
        </div>
      </div>

      {/* Barra de Progreso Visual */}
      <div className="bg-gray-100 p-4 rounded-xl border border-gray-200">
        <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
          <span>Progreso de Asignación</span>
          <span>{Math.round((assignedRows.size / totalItems) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${(assignedRows.size / totalItems) * 100}%` }}
          />
        </div>
        {unassignedCount > 0 && (
          <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
            <span className="font-bold">⧗ Filas pendientes:</span> {getPendingRowsGrouped()}
          </div>
        )}
      </div>

      {/* Tabla de Asignaciones Actuales */}
      {distribuciones.length > 0 && (
        <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MdCheckCircle className="text-indigo-600" size={20} />
              <h4 className="font-bold text-gray-800">Asignaciones Realizadas</h4>
              <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-bold">
                {distribuciones.length}
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Filas</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Cantidad</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Responsable</th>
                  <th className="px-4 py-3 text-right font-bold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {distribuciones.map((dist, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50 transition">
                    <td className="px-4 py-3 font-mono text-indigo-600 font-bold">
                      {formatearRangos(dist.inicio, dist.fin)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {dist.fin - dist.inicio + 1} {dist.fin - dist.inicio + 1 === 1 ? 'ítem' : 'ítems'}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-800">
                      {dist.nombreResponsable}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handlePreviewItems(dist)}
                          className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition"
                          title="Ver ítems"
                        >
                          <MdVisibility size={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(idx)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition"
                          title="Eliminar asignación"
                        >
                          <MdDelete size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Solo mostrar estrategias si hay ítems pendientes O si hay selección de filas */}
      {(unassignedCount > 0 || (selectedRows && selectedRows.size > 0)) && (
        <>
          <div className="border-t-2 border-dashed border-gray-300 pt-6">
            <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <MdAdd className="text-indigo-600" size={24} />
              Agregar Nueva Asignación
              {unassignedCount > 0 && (
                <span className="text-sm font-normal text-gray-500">
                  ({unassignedCount} ítems disponibles)
                </span>
              )}
            </h4>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <button
                onClick={() => setStrategy('equal')}
                disabled={unassignedCount === 0}
                className={`p-4 rounded-xl border-2 transition ${
                  strategy === 'equal'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <MdLightbulb size={24} />
                  <span className="font-bold text-sm">Distribución Equitativa</span>
                </div>
              </button>

              <button
                onClick={() => setStrategy('manual')}
                disabled={unassignedCount === 0}
                className={`p-4 rounded-xl border-2 transition ${
                  strategy === 'manual'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <MdEdit size={24} />
                  <span className="font-bold text-sm">Rangos Manuales</span>
                </div>
              </button>

              <button
                onClick={() => setStrategy('selected')}
                disabled={!selectedRows || selectedRows.size === 0}
                className={`p-4 rounded-xl border-2 transition ${
                  strategy === 'selected'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <MdFilterList size={24} />
                  <span className="font-bold text-sm">Filas Seleccionadas</span>
                  <span className="text-xs opacity-75">{selectedRows?.size || 0} marcadas</span>
                </div>
              </button>
            </div>

            <div className="relative mb-4">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar responsable..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {strategy === 'equal' && (
              <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800 flex items-start gap-2">
                  <MdInfo className="shrink-0 mt-0.5" size={18} />
                  <p>Seleccione responsables para dividir automáticamente los {unassignedCount} ítems pendientes.</p>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredResponsables.map(resp => (
                    <div
                      key={resp.codResponsable}
                      className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        const newSet = new Set(selectedResponsables);
                        if (newSet.has(resp.codResponsable!)) {
                          newSet.delete(resp.codResponsable!);
                        } else {
                          newSet.add(resp.codResponsable!);
                        }
                        setSelectedResponsables(newSet);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedResponsables.has(resp.codResponsable!)}
                        onChange={() => {}}
                        className="w-5 h-5 rounded"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{resp.nombreResponsable}</p>
                        {resp.cargo && <p className="text-xs text-gray-500">{resp.cargo}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleEqualDistribution}
                  disabled={selectedResponsables.size === 0}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <MdAdd size={20} />
                  Distribuir Equitativamente
                </button>
              </div>
            )}

            {strategy === 'manual' && (
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-3 items-end bg-indigo-50 p-4 rounded-xl">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Desde</label>
                    <input
                      type="number"
                      min={1}
                      max={totalItems}
                      value={currentRange.inicio}
                      onChange={(e) => setCurrentRange({ ...currentRange, inicio: Number(e.target.value) })}
                      className="w-full p-2 text-center font-bold bg-white rounded-lg border-2 border-indigo-300"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs font-bold text-indigo-600 mb-1 block">Hasta</label>
                    <input
                      type="number"
                      min={currentRange.inicio}
                      max={totalItems}
                      value={currentRange.fin}
                      onChange={(e) => setCurrentRange({ ...currentRange, fin: Number(e.target.value) })}
                      className="w-full p-2 text-center font-bold bg-white rounded-lg border-2 border-indigo-300"
                    />
                  </div>
                  <div className="col-span-5">
                    <label className="text-xs font-bold text-indigo-600 mb-1 block">Responsable</label>
                    <select
                      value={selectedResp}
                      onChange={(e) => setSelectedResp(e.target.value)}
                      className="w-full p-2 bg-white rounded-lg border border-gray-300"
                    >
                      <option value="">-- Seleccionar --</option>
                      {filteredResponsables.map(r => (
                        <option key={r.codResponsable} value={r.codResponsable}>
                          {r.nombreResponsable} {r.cargo ? `(${r.cargo})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <button
                      onClick={agregarRangoManual}
                      className="w-full p-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg"
                    >
                      <MdAdd size={24} className="mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {strategy === 'selected' && (
              <div className="space-y-3">
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-sm text-amber-800 flex items-start gap-2">
                  <MdInfo className="shrink-0 mt-0.5" size={18} />
                  <div>
                    <p>Asigne las <strong>{selectedRows?.size}</strong> filas seleccionadas a un responsable.</p>
                    {selectedRows && selectedRows.size > 0 && (
                      <p className="mt-1 text-xs font-mono">
                        Filas: {agruparNumeros(Array.from(selectedRows).map(i => i + 1))}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredResponsables.map(resp => (
                    <button
                      key={resp.codResponsable}
                      onClick={() => handleSelectedRowsAssignment(resp.codResponsable!)}
                      className="w-full flex items-center gap-3 p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-left"
                    >
                      <MdPerson className="text-indigo-600" size={24} />
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{resp.nombreResponsable}</p>
                        {resp.cargo && <p className="text-xs text-gray-500">{resp.cargo}</p>}
                      </div>
                      <MdArrowForward className="text-gray-400" size={20} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de Vista Previa */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-xl flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-lg">Vista Previa de Ítems</h3>
                <p className="text-blue-100 text-sm">Responsable: {previewData.responsable}</p>
              </div>
              <button onClick={() => setShowPreview(false)} className="text-white hover:text-blue-200">
                <MdClose size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <DataPreview
                data={previewData.items}
                selectedRows={new Set()}
                onRowToggle={() => {}}
                onSelectAll={() => {}}
                onDeselectAll={() => {}}
              />
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================
export default function CargasPage() {
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [loading, setLoading] = useState(true);
  const [camposDinamicos, setCamposDinamicos] = useState<CampoConfig[]>([]);

  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedCarga, setSelectedCarga] = useState<Carga | null>(null);
  
  const [descripcion, setDescripcion] = useState('');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [mapeo, setMapeo] = useState<Record<string, string>>({});
  
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [distribuciones, setDistribuciones] = useState<(RangoDistribucion & { nombreResponsable: string })[]>([]);
  
  const [uploading, setUploading] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string; details?: string } | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await cargaService.listarTodas();
      setCargas(data.sort((a, b) => (b.codCarga || 0) - (a.codCarga || 0)));
    } catch (error) {
      showToast('error', 'Error al cargar las cargas', 'No se pudieron recuperar los datos del servidor');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string, details?: string) => {
    setToast({ type, message, details });
  };

  const iniciarWizard = async () => {
    try {
      const campos = await configuracionService.obtenerCampos();
      setCamposDinamicos(campos.filter(c => c.esVisible));
      
      const resps = await responsableService.listarActivos();
      setResponsables(resps);

      setWizardStep(1);
      setDescripcion('');
      setSelectedFile(null);
      setMapeo({});
      setSelectedRows(new Set());
      setDistribuciones([]);
      setShowWizard(true);
    } catch (error) {
      showToast('error', 'Error al inicializar', 'No se pudo cargar la configuración necesaria');
    }
  };

  const handleStep1Next = async () => {
    if (!descripcion.trim()) {
      showToast('warning', 'Descripción requerida', 'Por favor ingrese una descripción para la carga');
      return;
    }

    try {
      const nuevaCarga = await cargaService.crear(descripcion);
      setSelectedCarga(nuevaCarga);
      setWizardStep(2);
      showToast('success', '¡Carga creada!', `Se creó la carga "${descripcion}" correctamente`);
    } catch (error) {
      showToast('error', 'Error al crear la carga', 'Verifique su conexión e intente nuevamente');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      showToast('error', 'Archivo no válido', 'Por favor seleccione un archivo Excel (.xlsx o .xls)');
      return;
    }

    setSelectedFile(file);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

      if (jsonData.length === 0) {
        showToast('error', 'Excel vacío', 'El archivo no contiene datos');
        return;
      }

      const headers = jsonData[0] as string[];
      const rows: ExcelRow[] = jsonData.slice(1).map((row: unknown[]) => {
        const obj: ExcelRow = {};
        headers.forEach((h, i) => { 
          obj[h] = row[i] as string | number | boolean | null | undefined;
        });
        return obj;
      }).filter(row => Object.values(row).some(v => v !== undefined && v !== ''));

      setExcelHeaders(headers);
      setExcelData(rows);

      const autoMap: Record<string, string> = {};
      camposDinamicos.forEach(campo => {
        const palabraClave = campo.etiquetaUsuario.toLowerCase().split(' ')[0];
        const match = headers.find(h => 
          h.toLowerCase().includes(palabraClave) || 
          palabraClave.includes(h.toLowerCase())
        );
        if (match) autoMap[campo.nombreCampoBd] = match;
      });
      setMapeo(autoMap);

      showToast('success', 'Excel cargado correctamente', `Se encontraron ${rows.length} registros válidos`);
      setWizardStep(3);
    } catch (error) {
      showToast('error', 'Error al leer el archivo', 'El archivo Excel está corrupto o tiene un formato no válido');
    }
  };

  const handleStep3Next = () => {
    const faltantes = camposDinamicos.filter(c => c.esObligatorio && !mapeo[c.nombreCampoBd]);
    
    if (faltantes.length > 0) {
      showToast('error', 'Campos obligatorios sin mapear', `Debe mapear: ${faltantes.map(f => f.etiquetaUsuario).join(', ')}`);
      return;
    }

    setSelectedRows(new Set(excelData.map((_, i) => i)));
    setWizardStep(4);
  };

  const handleConfirmarTodo = async () => {
    if (!selectedCarga?.codCarga || !selectedFile) return;

    setUploading(true);

    try {
      const resImport = await cargaService.subirArchivoConMapeo(
        selectedCarga.codCarga,
        selectedFile,
        mapeo,
        camposDinamicos
      );

      const payload = distribuciones.map(({ inicio, fin, codResponsable }) => ({ inicio, fin, codResponsable }));
      await cargaService.distribuir(selectedCarga.codCarga, payload);

      showToast('success', '¡Proceso completado exitosamente!', `${resImport.totalProcesados} registros importados y responsables asignados`);
      
      setShowWizard(false);
      cargarDatos();
    } catch (error) {
      showToast('error', 'Error en el proceso final', 'Hubo un problema al guardar los datos. Intente nuevamente.');
    } finally {
      setUploading(false);
    }
  };

  const toggleConfig = (idCampo: number, key: 'esVisible' | 'esObligatorio') => {
    setCamposDinamicos(prev => prev.map(campo => {
      if (campo.id === idCampo) return { ...campo, [key]: !campo[key] };
      return campo;
    }));
  };

const renderEstado = (estado: string) => {
  const estadoTrim = estado.trim();
  
  switch (estadoTrim) {
    case 'C': 
      return (
        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
          <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
          Creada
        </span>
      );
    case 'A': 
      return (
        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">
          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
          Asignada
        </span>
      );
    case 'T': 
      return (
        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
          <span className="w-2 h-2 bg-green-600 rounded-full"></span>
          Terminada
        </span>
      );
    default: 
      return (
        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
          {estado}
        </span>
      );
  }
};

  // Calcular assignedRows y rowAssignments para el DataPreview del step 4
  const assignedRows = new Set<number>();
  const rowAssignments = new Map<number, string>();
  
  distribuciones.forEach(dist => {
    for (let i = dist.inicio; i <= dist.fin; i++) {
      assignedRows.add(i);
      rowAssignments.set(i, dist.nombreResponsable);
    }
  });

return (
  <div className="space-y-6">
    {toast && (
      <Toast
        type={toast.type}
        message={toast.message}
        details={toast.details}
        onClose={() => setToast(null)}
      />
    )}

    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Cargas</h1>
        <p className="text-gray-600 mt-1">Administración de cargas de inventario</p>
      </div>
      <button
        onClick={iniciarWizard}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg font-bold"
      >
        <MdAdd size={22} /> Nueva Carga Completa
      </button>
    </div>

    {/* Tabla de Cargas */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Código</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Descripción</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <span>Cargando cargas...</span>
                  </div>
                </td>
              </tr>
            ) : cargas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <MdInbox size={48} className="mb-3 text-gray-300"/> 
                    <p className="font-medium">No hay cargas registradas</p>
                    <p className="text-sm text-gray-400 mt-1">Crea una nueva carga para comenzar</p>
                  </div>
                </td>
              </tr>
            ) : (
              cargas.map((carga) => (
                <tr key={carga.codCarga} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-bold text-indigo-600">
                      #{carga.codCarga}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">{carga.descripcion}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{carga.fecha}</span>
                  </td>
                  <td className="px-6 py-4">
                    {renderEstado(carga.estado || 'C')}
                  </td>
                    <td className="px-6 py-4 text-right">
                      {carga.estado?.trim() === 'T' ? (
                        <span className="text-sm text-gray-500 italic">Completada</span>
                      ) : (
                        <button 
                          onClick={() => {
                            setSelectedCarga(carga);
                            setWizardStep(carga.estado?.trim() === 'C' ? 2 : 4);
                            setShowWizard(true);
                          }}
                          className="p-2 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition"
                          title="Continuar proceso"
                        >
                          <MdArrowForward size={20} />
                        </button>
                      )}
                    </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {!loading && cargas.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-right">
          Total: {cargas.length} {cargas.length === 1 ? 'carga' : 'cargas'}
        </div>
      )}
    </div>

      {showWizard && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[95vh]">
            
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 rounded-t-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Proceso de Carga Completo</h2>
                <button
                  onClick={() => setShowWizard(false)}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  <MdClose />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                {[
                  { num: 1, label: 'Descripción' },
                  { num: 2, label: 'Cargar Excel' },
                  { num: 3, label: 'Mapeo' },
                  { num: 4, label: 'Asignación' },
                  { num: 5, label: 'Confirmar' }
                ].map((step, idx) => (
                  <div key={step.num} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                        wizardStep >= step.num
                          ? 'bg-white text-indigo-600'
                          : 'bg-indigo-400 text-white'
                      }`}>
                        {wizardStep > step.num ? <MdCheck size={24} /> : step.num}
                      </div>
                      <span className="text-xs text-white mt-1 font-medium">{step.label}</span>
                    </div>
                    {idx < 4 && (
                      <div className={`h-1 flex-1 mx-2 rounded ${
                        wizardStep > step.num ? 'bg-white' : 'bg-indigo-400'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              
              {wizardStep === 1 && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="text-center mb-8">
                    <MdInsertDriveFile className="text-indigo-600 mx-auto mb-4" size={64} />
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
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Ej: Inventario Oficina Central - Diciembre 2024"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 outline-none text-lg"
                      onKeyPress={(e) => e.key === 'Enter' && handleStep1Next()}
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3 text-sm text-blue-800">
                    <MdLightbulb className="shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-bold mb-1">Consejo</p>
                      <p>Use descripciones claras que incluyan ubicación, fecha o tipo de inventario para facilitar la identificación posterior.</p>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="text-center mb-6">
                    <MdCloudUpload className="text-indigo-600 mx-auto mb-4" size={64} />
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Cargar Archivo Excel</h3>
                    <p className="text-gray-600">Seleccione el archivo con los datos del inventario</p>
                  </div>

                  <div
                    className="border-4 border-dashed border-indigo-300 rounded-2xl p-16 text-center hover:border-indigo-500 hover:bg-indigo-50 transition cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".xlsx,.xls"
                      className="hidden"
                    />
                    <MdInsertDriveFile className="text-indigo-400 group-hover:text-indigo-600 mx-auto mb-4" size={80} />
                    <p className="text-xl font-bold text-gray-700 group-hover:text-indigo-600 mb-2">
                      Click para seleccionar archivo
                    </p>
                    <p className="text-sm text-gray-500">Formatos soportados: .xlsx, .xls</p>
                  </div>

                  {selectedFile && (
                    <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200 flex items-center gap-3">
                      <MdCheckCircle className="text-green-600" size={24} />
                      <div className="flex-1">
                        <p className="font-bold text-green-800">{selectedFile.name}</p>
                        <p className="text-xs text-green-600">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100">
                    <div className="flex items-start gap-3">
                      <MdLink className="text-indigo-600 shrink-0 mt-0.5" size={24} />
                      <div>
                        <h3 className="font-bold text-gray-800 mb-1">Configuración de Mapeo</h3>
                        <p className="text-sm text-gray-600">
                          Relacione las columnas del Excel con los campos del sistema y configure la visibilidad
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {camposDinamicos.map((campo) => (
                      <div
                        key={campo.id}
                        className="flex flex-col lg:flex-row items-start lg:items-center gap-4 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-300 transition"
                      >
                        <div className="w-full lg:w-1/3">
                          <p className="font-bold text-gray-800 flex items-center gap-2">
                            {campo.etiquetaUsuario}
                            {campo.esObligatorio && (
                              <span className="text-red-500 text-xs">*</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">DB: {campo.nombreCampoBd}</p>
                        </div>

                        <div className="w-full lg:w-1/3">
                          <select
                            value={mapeo[campo.nombreCampoBd] || ''}
                            onChange={(e) => setMapeo({ ...mapeo, [campo.nombreCampoBd]: e.target.value })}
                            className={`w-full px-3 py-2.5 border-2 rounded-lg outline-none transition ${
                              campo.esObligatorio && !mapeo[campo.nombreCampoBd]
                                ? 'border-red-300 bg-red-50 focus:border-red-500'
                                : 'border-gray-300 bg-white focus:border-indigo-500'
                            }`}
                          >
                            <option value="">-- Ignorar columna --</option>
                            {excelHeaders.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>

                        <div className="w-full lg:w-1/3 flex justify-end gap-8">
                          <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => toggleConfig(campo.id, 'esVisible')}>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Visible App</span>
                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${campo.esVisible ? 'bg-blue-600' : 'bg-gray-300'}`}>
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${campo.esVisible ? 'translate-x-6' : 'translate-x-1'}`} />
                            </div>
                          </div>

                          <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => toggleConfig(campo.id, 'esObligatorio')}>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Obligatorio</span>
                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${campo.esObligatorio ? 'bg-red-600' : 'bg-gray-300'}`}>
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${campo.esObligatorio ? 'translate-x-6' : 'translate-x-1'}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                    <h3 className="font-bold text-gray-800 mb-1">Vista Previa y Asignación de Responsables</h3>
                    <p className="text-sm text-gray-600">
                      Revise los datos importados y asigne responsables. Puede modificar las asignaciones antes de confirmar.
                    </p>
                  </div>

                  <DataPreview
                    data={excelData}
                    selectedRows={selectedRows}
                    onRowToggle={(idx) => {
                      const newSet = new Set(selectedRows);
                      if (newSet.has(idx)) newSet.delete(idx);
                      else newSet.add(idx);
                      setSelectedRows(newSet);
                    }}
                    onSelectAll={() => setSelectedRows(new Set(excelData.map((_, i) => i)))}
                    onDeselectAll={() => setSelectedRows(new Set())}
                    assignedRows={assignedRows}
                    rowAssignments={rowAssignments}
                  />

                  <div className="border-t-2 border-dashed border-gray-300 pt-6">
                    <AssignmentManager
                      totalItems={excelData.length}
                      responsables={responsables}
                      distribuciones={distribuciones}
                      onDistribucionesChange={setDistribuciones}
                      selectedRows={selectedRows}
                      excelData={excelData}
                    />
                  </div>
                </div>
              )}

              {wizardStep === 5 && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="text-center mb-8">
                    <MdCheckCircle className="text-green-600 mx-auto mb-4" size={80} />
                    <h3 className="text-3xl font-bold text-gray-800 mb-2">¡Todo Listo!</h3>
                    <p className="text-gray-600 text-lg">Revise el resumen antes de confirmar</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                      <p className="text-sm font-bold text-blue-600 mb-2">CARGA</p>
                      <p className="text-2xl font-bold text-gray-800">{selectedCarga?.descripcion}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                      <p className="text-sm font-bold text-green-600 mb-2">REGISTROS</p>
                      <p className="text-2xl font-bold text-gray-800">{excelData.length} ítems</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                      <p className="text-sm font-bold text-purple-600 mb-2">RESPONSABLES</p>
                      <p className="text-2xl font-bold text-gray-800">{distribuciones.length} asignados</p>
                    </div>
                  </div>

                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h4 className="font-bold text-gray-800">Distribución Final</h4>
                    </div>
                    <div className="max-h-96 overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left font-bold text-gray-600">Filas</th>
                            <th className="px-4 py-3 text-left font-bold text-gray-600">Cantidad</th>
                            <th className="px-4 py-3 text-left font-bold text-gray-600">Responsable</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {distribuciones.map((dist, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-mono text-indigo-600 font-bold">
                                {formatearRangos(dist.inicio, dist.fin)}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {dist.fin - dist.inicio + 1} ítems
                              </td>
                              <td className="px-4 py-3 font-bold text-gray-800">
                                {dist.nombreResponsable}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Validación de ítems sin asignar - AGREGAR DESPUÉS DE LA TABLA DE DISTRIBUCIÓN */}
                  {(() => {
                    // Calcular ítems sin asignar
                    const assignedRows = new Set<number>();
                    distribuciones.forEach(dist => {
                      for (let i = dist.inicio; i <= dist.fin; i++) {
                        assignedRows.add(i);
                      }
                    });

                    const unassignedItems: number[] = [];
                    for (let i = 1; i <= excelData.length; i++) {
                      if (!assignedRows.has(i)) {
                        unassignedItems.push(i);
                      }
                    }

                    return unassignedItems.length > 0 ? (
                      <div className="border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl overflow-hidden shadow-lg">
                        <div className="bg-amber-100 px-4 py-3 border-b border-amber-300 flex items-center gap-3">
                          <MdWarning className="text-amber-600 shrink-0" size={24} />
                          <div>
                            <h4 className="font-bold text-amber-800">¡Atención! Hay ítems sin asignar</h4>
                            <p className="text-sm text-amber-700">Hay {unassignedItems.length} ítems sin responsable asignado.</p>
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="shrink-0">
                              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                <span className="text-amber-600 font-bold text-sm">
                                  {unassignedItems.length}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">
                                ¿Está seguro que desea registrar la carga? Hay {unassignedItems.length} ítems sin responsable asignado.
                              </p>
                              
                              <div className="mt-3 p-3 bg-white border border-amber-200 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <p className="text-sm font-bold text-gray-700">
                                    Ítems sin asignar ({unassignedItems.length} total)
                                  </p>
                                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                                    {Math.min(unassignedItems.length, 5)} mostrados
                                  </span>
                                </div>
                                
                                <div className="space-y-1">
                                  {unassignedItems.slice(0, 5).map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm">
                                      <span className="w-5 h-5 flex items-center justify-center bg-amber-100 text-amber-700 rounded text-xs font-bold">
                                        {idx + 1}
                                      </span>
                                      <span className="font-mono text-gray-700">Fila #{item}</span>
                                    </div>
                                  ))}
                                  
                                  {unassignedItems.length > 5 && (
                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                      <div className="text-xs text-gray-600 font-medium mb-1">
                                        +{unassignedItems.length - 5} ítems adicionales
                                      </div>
                                      <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded text-xs">
                                        {agruparNumeros(unassignedItems.slice(5))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="mt-3 text-sm text-amber-700 flex items-center gap-2">
                                <MdInfo size={16} />
                                <p>
                                  <strong>Recomendación:</strong> Regrese al paso 4 para asignar estos ítems o continúe si desea registrarlos como pendientes.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-start gap-3">
                        <MdCheckCircle className="text-green-600 shrink-0 mt-0.5" size={24} />
                        <div className="text-sm text-green-800">
                          <p className="font-bold mb-1">✓ Todos los ítems están asignados</p>
                          <p>¡Perfecto! Todos los {excelData.length} ítems tienen un responsable asignado.</p>
                        </div>
                      </div>
                    );
                  })()}
                  {/* FIN DE LA VALIDACIÓN */}

                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <MdWarning className="text-amber-600 shrink-0 mt-0.5" size={24} />
                    <div className="text-sm text-amber-800">
                      <p className="font-bold mb-1">Confirmación Final</p>
                      <p>Al confirmar se importarán los datos y se asignarán los responsables. Esta acción no se puede deshacer fácilmente.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between rounded-b-2xl">
              <div>
                {wizardStep > 1 && (
                  <button
                    onClick={() => setWizardStep(wizardStep - 1)}
                    disabled={uploading}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition disabled:opacity-50"
                  >
                    ← Atrás
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowWizard(false)}
                  disabled={uploading}
                  className="px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition disabled:opacity-50"
                >
                  Cancelar
                </button>

                {wizardStep === 1 && (
                  <button
                    onClick={handleStep1Next}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg transition flex items-center gap-2"
                  >
                    Continuar <MdArrowForward />
                  </button>
                )}

                {wizardStep === 3 && (
                  <button
                    onClick={handleStep3Next}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg transition flex items-center gap-2"
                  >
                    Vista Previa <MdArrowForward />
                  </button>
                )}

                {wizardStep === 4 && (
                  <button
                    onClick={() => setWizardStep(5)}
                    disabled={distribuciones.length === 0}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg transition disabled:opacity-50 flex items-center gap-2"
                  >
                    Revisar y Confirmar <MdArrowForward />
                  </button>
                )}

                {wizardStep === 5 && (
                  <button
                    onClick={handleConfirmarTodo}
                    disabled={uploading}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-bold shadow-lg transition disabled:opacity-50 flex items-center gap-2 text-lg"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <MdCheckCircle size={24} />
                        Confirmar e Importar
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}