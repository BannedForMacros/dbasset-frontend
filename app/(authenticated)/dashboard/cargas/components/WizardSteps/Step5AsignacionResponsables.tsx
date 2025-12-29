'use client';

import DataPreview from '../DataPreview';
import AssignmentManager from '../AssignmentManager';

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

interface Step5AsignacionResponsablesProps {
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
}: Step5AsignacionResponsablesProps) {
  // Calcular filas asignadas para el preview
  const assignedRows = new Set<number>();
  const rowAssignments = new Map<number, { responsable?: string }>();

  assignments.forEach(assignment => {
    for (let i = assignment.inicio; i <= assignment.fin; i++) {
      assignedRows.add(i);
      rowAssignments.set(i, { responsable: assignment.nombreResponsable });
    }
  });

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-bold text-gray-800 mb-1">Paso 1: Asignar Responsables (Opcional)</h3>
        <p className="text-sm text-gray-600">
          Los responsables son las personas a cargo de los activos. Puede asignarlos ahora o dejarlo pendiente.
        </p>
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

      <div className="border-t-2 border-gray-200 pt-6">
        <AssignmentManager
          totalItems={excelData.length}
          persons={responsables}
          assignments={assignments}
          onAssignmentsChange={onAssignmentsChange}
          selectedRows={selectedRows}
          title="Asignar Responsables"
          mode="responsable"
        />
      </div>
    </div>
  );
}