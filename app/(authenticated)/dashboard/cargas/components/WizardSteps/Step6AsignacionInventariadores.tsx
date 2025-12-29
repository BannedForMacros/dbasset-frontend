'use client';

import DataPreview from '../DataPreview';
import AssignmentManager from '../AssignmentManager';
import { MdWarning } from 'react-icons/md';

type ExcelRow = Record<string, string | number | boolean | null | undefined>;

interface InventariadorAssignment {
  inicio: number;
  fin: number;
  codInventariador?: number;
  nombreInventariador?: string;
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

interface Step6AsignacionInventariadoresProps {
  excelData: ExcelRow[];
  inventariadores: Person[];
  assignments: InventariadorAssignment[];
  onAssignmentsChange: (assignments: InventariadorAssignment[]) => void;
  selectedRows: Set<number>;
  onRowToggle: (index: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  responsableAssignments: ResponsableAssignment[]; // ✅ Tipado correcto
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
}: Step6AsignacionInventariadoresProps) {
  // Calcular filas asignadas
  const assignedRows = new Set<number>();
  const rowAssignments = new Map<number, { responsable?: string; inventariador?: string }>();

  // ✅ Agregar responsables (ya tipado correctamente)
  responsableAssignments.forEach(assignment => {
    for (let i = assignment.inicio; i <= assignment.fin; i++) {
      const current = rowAssignments.get(i) || {};
      current.responsable = assignment.nombreResponsable; // ✅ Sin 'as any'
      rowAssignments.set(i, current);
    }
  });

  // Agregar inventariadores
  assignments.forEach(assignment => {
    for (let i = assignment.inicio; i <= assignment.fin; i++) {
      assignedRows.add(i);
      const current = rowAssignments.get(i) || {};
      current.inventariador = assignment.nombreInventariador;
      rowAssignments.set(i, current);
    }
  });

  return (
    <div className="space-y-6">
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h3 className="font-bold text-gray-800 mb-1">Paso 2: Asignar Inventariadores (Obligatorio)</h3>
        <p className="text-sm text-gray-600">
          Los inventariadores realizarán el inventario físico. Es obligatorio asignar al menos un inventariador para continuar.
        </p>
      </div>

      {assignments.length === 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 flex items-start gap-3">
          <MdWarning className="text-amber-600 shrink-0 mt-0.5" size={24} />
          <div className="text-sm text-amber-800">
            <p className="font-bold mb-1">⚠️ Sin inventariadores asignados</p>
            <p>
              Debe asignar al menos un inventariador antes de continuar. 
              Los inventariadores son obligatorios para realizar el inventario físico.
            </p>
          </div>
        </div>
      )}

      <DataPreview
        data={excelData}
        selectedRows={selectedRows}
        onRowToggle={onRowToggle}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
        assignedRows={assignedRows}
        rowAssignments={rowAssignments}
      />

      <div className="border-t-2 border-gray-200 pt-6">
        <AssignmentManager
          totalItems={excelData.length}
          persons={inventariadores}
          assignments={assignments}
          onAssignmentsChange={onAssignmentsChange}
          selectedRows={selectedRows}
          title="Asignar Inventariadores"
          mode="inventariador"
        />
      </div>
    </div>
  );
}