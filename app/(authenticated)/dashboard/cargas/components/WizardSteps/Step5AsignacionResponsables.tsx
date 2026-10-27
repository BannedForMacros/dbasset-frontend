'use client';

import { useMemo } from 'react';
import DataPreview from '../DataPreview';
import AssignmentManager from '../AssignmentManager';
import { PasoEncabezado } from '../PasoEncabezado';
import { Indicador } from '@/app/components/rfid/ui';
import { MdPeople, MdCheckCircle, MdPendingActions, MdInventory2 } from 'react-icons/md';

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
    <div className="flex flex-col gap-5">
      <PasoEncabezado
        icono={<MdPeople size={24} />}
        titulo="Custodio de cada activo"
        descripcion="Asigne la persona responsable de los bienes: por selección, por rango de filas o repartiendo entre varias. Es opcional."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Indicador etiqueta="Total de activos" valor={excelData.length} icono={<MdInventory2 size={22} />} tono="marca" />
        <Indicador etiqueta="Con custodio" valor={assignedRows.size} icono={<MdCheckCircle size={22} />} tono="acento" />
        <Indicador etiqueta="Sin custodio" valor={unassignedCount} icono={<MdPendingActions size={22} />}
          tono={unassignedCount > 0 ? 'alerta' : 'neutro'} />
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

      <AssignmentManager
        totalItems={excelData.length}
        persons={responsables}
        assignments={assignments}
        onAssignmentsChange={onAssignmentsChange}
        selectedRows={selectedRows}
        title="Asignar custodios"
        mode="responsable"
      />
    </div>
  );
}
