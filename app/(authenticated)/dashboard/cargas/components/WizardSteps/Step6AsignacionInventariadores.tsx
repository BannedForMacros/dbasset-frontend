/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo } from 'react';
import DataPreview from '../DataPreview';
import AssignmentManager from '../AssignmentManager';
import { PasoEncabezado, AvisoPaso } from '../PasoEncabezado';
import { Indicador } from '@/app/components/rfid/ui';
import { MdWarning, MdAssignmentInd, MdCheckCircle, MdPendingActions, MdInventory2 } from 'react-icons/md';

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

  // Progreso basado en inventariadores; el custodio se muestra como contexto
  const { assignedRows, rowAssignments, unassignedCount } = useMemo(() => {
    const assigned = new Set<number>();
    const mapping = new Map<number, { responsable?: string; inventariador?: string }>();

    responsableAssignments.forEach(asig => {
      for (let i = asig.inicio; i <= asig.fin; i++) {
        const curr = mapping.get(i) || {};
        curr.responsable = asig.nombreResponsable;
        mapping.set(i, curr);
      }
    });

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
    <div className="flex flex-col gap-5">
      <PasoEncabezado
        icono={<MdAssignmentInd size={24} />}
        titulo="Inventariador de cada activo"
        descripcion={<>Asigne al personal que hará el conteo físico. <b style={{ color: '#dc2626' }}>Todas las filas deben tener inventariador.</b></>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Indicador etiqueta="Total de activos" valor={excelData.length} icono={<MdInventory2 size={22} />} tono="marca" />
        <Indicador etiqueta="Con inventariador" valor={assignedRows.size} icono={<MdCheckCircle size={22} />} tono="acento" />
        <Indicador etiqueta="Pendientes" valor={unassignedCount} icono={<MdPendingActions size={22} />}
          tono={unassignedCount > 0 ? 'error' : 'neutro'} />
      </div>

      {assignments.length === 0 && (
        <AvisoPaso tono="alerta" icono={<MdWarning size={18} />}>
          Aún no hay inventariadores asignados. No podrá revisar la carga hasta cubrir todas las filas.
        </AvisoPaso>
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

      <AssignmentManager
        totalItems={excelData.length}
        persons={personsMapeadas}
        assignments={assignments}
        onAssignmentsChange={onAssignmentsChange}
        selectedRows={selectedRows}
        title="Asignar inventariadores"
        mode="inventariador"
      />
    </div>
  );
}
