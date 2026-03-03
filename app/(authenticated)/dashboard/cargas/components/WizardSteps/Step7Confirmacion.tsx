'use client';

import { MdCheckCircle, MdWarning, MdPerson, MdAssignmentInd } from 'react-icons/md';
import { Carga } from '../../../../../services/carga.service';

interface Assignment {
  inicio: number;
  fin: number;
  codResponsable?: number;
  nombreResponsable?: string;
  codInventariador?: number;
  nombre?: string;
}

interface Step7ConfirmacionProps {
  carga: Carga;
  totalRegistros: number;
  responsableAssignments: Assignment[];
  inventariadorAssignments: Assignment[];
}

export default function Step7Confirmacion({ 
  carga, 
  totalRegistros, 
  responsableAssignments,
  inventariadorAssignments
}: Step7ConfirmacionProps) {
  // Calcular estadísticas de responsables
  const responsableRows = new Set<number>();
  responsableAssignments.forEach(assignment => {
    for (let i = assignment.inicio; i <= assignment.fin; i++) {
      responsableRows.add(i);
    }
  });

  // Calcular estadísticas de inventariadores
  const inventariadorRows = new Set<number>();
  inventariadorAssignments.forEach(assignment => {
    for (let i = assignment.inicio; i <= assignment.fin; i++) {
      inventariadorRows.add(i);
    }
  });

  const unassignedResponsables = totalRegistros - responsableRows.size;
  const unassignedInventariadores = totalRegistros - inventariadorRows.size;

  const formatRange = (inicio: number, fin: number): string => {
    return inicio === fin ? `#${inicio}` : `#${inicio}-${fin}`;
  };

  const groupNumbers = (numbers: number[]): string => {
    if (numbers.length === 0) return '';
    const sorted = [...numbers].sort((a, b) => a - b);
    const groups: string[] = [];
    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        groups.push(start === end ? `${start}` : `${start}-${end}`);
        start = sorted[i];
        end = sorted[i];
      }
    }
    groups.push(start === end ? `${start}` : `${start}-${end}`);
    return groups.join(', ');
  };

  // Ítems sin responsable
  const unassignedRespItems: number[] = [];
  for (let i = 1; i <= totalRegistros; i++) {
    if (!responsableRows.has(i)) unassignedRespItems.push(i);
  }

  // Ítems sin inventariador
  const unassignedInvItems: number[] = [];
  for (let i = 1; i <= totalRegistros; i++) {
    if (!inventariadorRows.has(i)) unassignedInvItems.push(i);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <MdCheckCircle className="text-green-600 mx-auto mb-4" size={80} />
        <h3 className="text-3xl font-bold text-gray-800 mb-2">¡Revisión Final!</h3>
        <p className="text-gray-600 text-lg">Verifique la información antes de confirmar</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <p className="text-sm font-bold text-blue-600 mb-2">CARGA</p>
          <p className="text-xl font-bold text-gray-800">{carga.descripcion}</p>
        </div>
        
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <p className="text-sm font-bold text-green-600 mb-2">REGISTROS</p>
          <p className="text-xl font-bold text-gray-800">{totalRegistros} ítems</p>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <p className="text-sm font-bold text-gray-600 mb-2">ASIGNACIONES</p>
          <p className="text-xl font-bold text-gray-800">
            {responsableAssignments.length + inventariadorAssignments.length} totales
          </p>
        </div>
      </div>

      {/* Sección Responsables */}
      <div className="border border-blue-200 rounded-lg overflow-hidden">
        <div className="bg-blue-100 px-4 py-3 border-b border-blue-200 flex items-center gap-2">
          <MdPerson className="text-blue-600" size={20} />
          <h4 className="font-bold text-gray-800">Responsables Asignados</h4>
        </div>

        {responsableAssignments.length > 0 ? (
          <div className="max-h-60 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Rango</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Cantidad</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {responsableAssignments.map((assignment, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-blue-600 font-bold">
                      {formatRange(assignment.inicio, assignment.fin)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {assignment.fin - assignment.inicio + 1} ítems
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-800">
                      {assignment.nombreResponsable}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">No hay responsables asignados</p>
          </div>
        )}

        {unassignedResponsables > 0 && (
          <div className="bg-amber-50 border-t border-amber-200 p-3">
            <p className="text-sm text-amber-800">
              <span className="font-bold">⚠️ {unassignedResponsables} ítems sin responsable:</span>
              <span className="ml-2 font-mono text-xs">
                {groupNumbers(unassignedRespItems.slice(0, 20))}
                {unassignedRespItems.length > 20 && ` +${unassignedRespItems.length - 20} más`}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Sección Inventariadores */}
      <div className="border border-green-200 rounded-lg overflow-hidden">
        <div className="bg-green-100 px-4 py-3 border-b border-green-200 flex items-center gap-2">
          <MdAssignmentInd className="text-green-600" size={20} />
          <h4 className="font-bold text-gray-800">Inventariadores Asignados</h4>
        </div>

        {inventariadorAssignments.length > 0 ? (
          <div className="max-h-60 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Rango</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Cantidad</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Inventariador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventariadorAssignments.map((assignment, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-green-600 font-bold">
                      {formatRange(assignment.inicio, assignment.fin)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {assignment.fin - assignment.inicio + 1} ítems
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-800">
                      {assignment.nombre}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 text-center text-red-500">
            <p className="text-sm font-bold">❌ No hay inventariadores asignados</p>
          </div>
        )}

        {unassignedInventariadores > 0 && (
          <div className="bg-red-50 border-t border-red-300 p-3">
            <p className="text-sm text-red-800">
              <span className="font-bold">❌ {unassignedInventariadores} ítems sin inventariador:</span>
              <span className="ml-2 font-mono text-xs">
                {groupNumbers(unassignedInvItems.slice(0, 20))}
                {unassignedInvItems.length > 20 && ` +${unassignedInvItems.length - 20} más`}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Validaciones Finales */}
      {unassignedInventariadores > 0 ? (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 flex items-start gap-3">
          <MdWarning className="text-red-600 shrink-0 mt-0.5" size={24} />
          <div className="text-sm text-red-800">
            <p className="font-bold mb-1">❌ No puede continuar</p>
            <p>
              Debe asignar inventariadores a TODOS los ítems antes de confirmar. 
              Faltan {unassignedInventariadores} ítems por asignar.
            </p>
          </div>
        </div>
      ) : (
        <>
          {unassignedResponsables > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
              <MdWarning className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-amber-800">
                <p className="font-bold mb-1">⚠️ Advertencia</p>
                <p>
                  Hay {unassignedResponsables} ítems sin responsable asignado. 
                  Puede continuar, pero se recomienda asignar responsables posteriormente.
                </p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 text-sm text-blue-800">
            <MdCheckCircle className="shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-bold mb-1">Confirmación Final</p>
              <p>
                Al confirmar se importarán {totalRegistros} registros con las asignaciones realizadas.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}