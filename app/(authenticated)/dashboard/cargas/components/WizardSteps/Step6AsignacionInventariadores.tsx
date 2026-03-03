/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo } from 'react';
import DataPreview from '../DataPreview';
import AssignmentManager from '../AssignmentManager';
import { MdWarning, MdAssignmentInd, MdCheckCircle } from 'react-icons/md';

type ExcelRow = Record<string, string | number | boolean | null | undefined>;

interface InventariadorAssignment {
  inicio: number;
  fin: number;
  codInventariador?: number;
  nombre?: string;
}

interface ResponsableAssignment {
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

interface Step6Props {
  excelData: ExcelRow[];
  inventariadores: Person[];
  assignments: InventariadorAssignment[];
  onAssignmentsChange: (assignments: InventariadorAssignment[]) => void;
  selectedRows: Set<number>;
  onRowToggle: (index: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  responsableAssignments: ResponsableAssignment[];
}

export default function Step6AsignacionInventariadores({
  excelData,
  inventariadores,
  assignments,
  onAssignmentsChange,
  selectedRows,
  onRowToggle,
  onSelectAll,
  onDeselectAll,
  responsableAssignments
}: Step6Props) {
  
  // Memorizar cálculos para rendimiento (Progreso basado en inventariadores)
  const { assignedRows, rowAssignments, unassignedCount } = useMemo(() => {
    const assigned = new Set<number>();
    const mapping = new Map<number, { responsable?: string; inventariador?: string }>();

    // 1. Mostrar quién es el responsable (contexto visual)
    responsableAssignments.forEach(asig => {
      for (let i = asig.inicio; i <= asig.fin; i++) {
        const curr = mapping.get(i) || {};
        curr.responsable = asig.nombreResponsable;
        mapping.set(i, curr);
      }
    });

    // 2. Mostrar quién es el inventariador (nuestra tarea actual)
    assignments.forEach(asig => {
      for (let i = asig.inicio; i <= asig.fin; i++) {
        assigned.add(i);
        const curr = mapping.get(i) || {};
        curr.inventariador = asig.nombre;
        mapping.set(i, curr);
      }
    });

    const total = excelData.length;
    return {
      assignedRows: assigned,
      rowAssignments: mapping,
      unassignedCount: total - assigned.size
    };
  }, [assignments, responsableAssignments, excelData.length]);

  // Adaptador de campos del backend a la interfaz Person del componente
  const personsMapeadas = inventariadores.map((inv: any) => ({
    id: inv.id || inv.codInventariador || 0,
    name: inv.nombre || inv.name || "Sin nombre",
    subtitle: inv.dni || inv.usuario || ""
  }));

  return (
    <div className="flex flex-col h-full gap-5 animate-in fade-in duration-500">
      
      {/* 1. CABECERA E INDICADORES (KPIs) */}
      <div className="bg-white p-5 rounded-xl border border-gray-300 shadow-sm shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-lg shrink-0">
            <MdAssignmentInd size={28} />
          </div>
          <div>
            <h2 className="font-black text-gray-900 text-lg sm:text-xl">Paso 6: ¿Quién hará el inventario físico?</h2>
            <p className="text-sm text-gray-600">Asigna al personal que irá al campo a contar y verificar estos bienes. <b className="text-red-600">Este paso es obligatorio.</b></p>
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

      {/* ALERTA OBLIGATORIA (Aparece si no han asignado a nadie aún) */}
      {assignments.length === 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <MdWarning className="text-yellow-600" size={24} />
            <p className="text-yellow-800 text-sm">
              <span className="font-bold">Acción Requerida:</span> Aún no has asignado ningún inventariador. No podrás avanzar al Paso 7 hasta asignar al menos a una persona.
            </p>
          </div>
        </div>
      )}

      {/* 2. TABLA DE DATOS */}
      <div className="flex-1 min-h-[250px] bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="bg-gray-800 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider flex justify-between items-center">
          <span>Vista de Datos (Responsables e Inventariadores)</span>
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

      {/* 3. CONSOLA DE HERRAMIENTAS (Botones obvios y abajo) */}
      <div className="shrink-0">
        <AssignmentManager
          totalItems={excelData.length}
          persons={personsMapeadas}
          assignments={assignments}
          onAssignmentsChange={onAssignmentsChange}
          selectedRows={selectedRows}
          title="Panel de Control"
          mode="inventariador"
        />
      </div>

    </div>
  );
}