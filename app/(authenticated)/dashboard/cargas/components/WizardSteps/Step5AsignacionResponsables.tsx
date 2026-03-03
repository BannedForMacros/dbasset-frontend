'use client';

import { useMemo } from 'react';
import DataPreview from '../DataPreview';
import AssignmentManager from '../AssignmentManager';
import { MdPeople, MdCheckCircle, MdWarning } from 'react-icons/md';

type ExcelRow = Record<string, string | number | boolean | null | undefined>;

interface Assignment {
  inicio: number;
  fin: number;
  codResponsable?: number;
  nombreResponsable?: string;
}

interface Person {
  id: number;
  name: string;
  subtitle?: string;
}

interface Step5Props {
  excelData: ExcelRow[];
  responsables: Person[];
  assignments: Assignment[];
  onAssignmentsChange: (assignments: Assignment[]) => void;
  selectedRows: Set<number>;
  onRowToggle: (index: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export default function Step5AsignacionResponsables({
  excelData,
  responsables,
  assignments,
  onAssignmentsChange,
  selectedRows,
  onRowToggle,
  onSelectAll,
  onDeselectAll
}: Step5Props) {
  
  const { assignedRows, rowAssignments, unassignedCount } = useMemo(() => {
    const assigned = new Set<number>();
    const mapping = new Map<number, { responsable?: string }>();

    assignments.forEach(asig => {
      for (let i = asig.inicio; i <= asig.fin; i++) {
        assigned.add(i);
        mapping.set(i, { responsable: asig.nombreResponsable });
      }
    });

    return {
      assignedRows: assigned,
      rowAssignments: mapping,
      unassignedCount: excelData.length - assigned.size
    };
  }, [assignments, excelData.length]);

  return (
    <div className="flex flex-col h-full gap-5 animate-in fade-in duration-500">
      
      {/* 1. CABECERA E INDICADORES (KPIs) - Ahora son grandes y claros */}
      <div className="bg-white p-5 rounded-xl border border-gray-300 shadow-sm shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-lg shrink-0">
            <MdPeople size={28} />
          </div>
          <div>
            <h2 className="font-black text-gray-900 text-lg sm:text-xl">Paso 5: ¿Quién es el responsable de cada bien?</h2>
            <p className="text-sm text-gray-600">Revisa la lista y asigna a las personas encargadas. Puedes hacerlo uno por uno, por grupos o que el sistema lo reparta.</p>
          </div>
        </div>

        {/* Tarjetas de progreso */}
        <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total de Bienes</p>
            <p className="text-2xl font-black text-gray-800">{excelData.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200 flex flex-col items-center">
            <p className="text-xs font-bold text-green-700 uppercase mb-1 flex items-center gap-1"><MdCheckCircle /> Ya Asignados</p>
            <p className="text-2xl font-black text-green-700">{assignedRows.size}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200 flex flex-col items-center">
            <p className="text-xs font-bold text-orange-700 uppercase mb-1 flex items-center gap-1"><MdWarning /> Faltan Asignar</p>
            <p className="text-2xl font-black text-orange-700">{unassignedCount}</p>
          </div>
        </div>
      </div>

      {/* 2. TABLA DE DATOS - El usuario ve primero los datos */}
      <div className="flex-1 min-h-[250px] bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="bg-gray-800 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider flex justify-between items-center">
          <span>Vista de Datos</span>
          {selectedRows.size > 0 && (
            <span className="bg-blue-500 text-white px-2 py-1 rounded text-[10px]">{selectedRows.size} seleccionados</span>
          )}
        </div>
        <DataPreview
          data={excelData}
          selectedRows={selectedRows}
          onRowToggle={onRowToggle}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
          assignedRows={assignedRows}
          rowAssignments={rowAssignments}
        />
      </div>

      {/* 3. CONSOLA DE HERRAMIENTAS - Con diseño obvio y botones reales */}
      <div className="shrink-0">
        <AssignmentManager
          totalItems={excelData.length}
          persons={responsables}
          assignments={assignments}
          onAssignmentsChange={onAssignmentsChange}
          selectedRows={selectedRows}
          title="Panel de Control"
          mode="responsable"
        />
      </div>

    </div>
  );
}