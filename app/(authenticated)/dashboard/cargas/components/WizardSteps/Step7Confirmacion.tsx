'use client';

import { ReactNode } from 'react';
import { MdCheckCircle, MdWarning, MdPerson, MdAssignmentInd, MdFactCheck, MdInventory2, MdError } from 'react-icons/md';
import { Carga } from '../../../../../services/carga.service';
import { Indicador } from '@/app/components/rfid/ui';
import { PasoEncabezado, AvisoPaso } from '../PasoEncabezado';

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

const formatRange = (inicio: number, fin: number): string =>
  inicio === fin ? `${inicio}` : `${inicio} – ${fin}`;

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

const filasCubiertas = (asignaciones: Assignment[]) => {
  const filas = new Set<number>();
  asignaciones.forEach(a => { for (let i = a.inicio; i <= a.fin; i++) filas.add(i); });
  return filas;
};

function TablaAsignaciones({ titulo, icono, asignaciones, nombre, pendientes, total, obligatorio }: {
  titulo: string; icono: ReactNode; asignaciones: Assignment[]; nombre: (a: Assignment) => string | undefined;
  pendientes: number[]; total: number; obligatorio?: boolean;
}) {
  return (
    <section className="tabla-marco">
      <div className="tabla-barra">
        <div className="flex items-center gap-2">
          <span style={{ color: '#1e4786' }}>{icono}</span>
          <h4 className="font-semibold" style={{ color: '#0f172a' }}>{titulo}</h4>
        </div>
        <span className="text-xs" style={{ color: '#94a3b8' }}>{total - pendientes.length} de {total} filas</span>
      </div>

      <div className="tabla-scroll max-h-60 overflow-y-auto">
        <table className="tabla tabla-compacta tabla-fija">
          <thead>
            <tr>
              <th>Filas</th>
              <th className="col-num">Cantidad</th>
              <th>Persona</th>
            </tr>
          </thead>
          <tbody>
            {asignaciones.length === 0 ? (
              <tr><td colSpan={3} className="tabla-vacio" style={{ padding: '1.5rem 1rem' }}>Sin asignaciones</td></tr>
            ) : asignaciones.map((a, idx) => (
              <tr key={idx}>
                <td><span className="codigo">{formatRange(a.inicio, a.fin)}</span></td>
                <td className="col-num">{a.fin - a.inicio + 1}</td>
                <td className="font-semibold">{nombre(a)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pendientes.length > 0 && (
        <div className="tabla-pie justify-start" style={{
          backgroundColor: obligatorio ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.06)',
          color: obligatorio ? '#b91c1c' : '#92400e',
        }}>
          <span>
            <b>{pendientes.length} filas sin asignar:</b>{' '}
            <span className="font-mono">
              {groupNumbers(pendientes.slice(0, 20))}
              {pendientes.length > 20 && ` y ${pendientes.length - 20} más`}
            </span>
          </span>
        </div>
      )}
    </section>
  );
}

export default function Step7Confirmacion({
  carga,
  totalRegistros,
  responsableAssignments,
  inventariadorAssignments
}: Step7ConfirmacionProps) {
  const responsableRows = filasCubiertas(responsableAssignments);
  const inventariadorRows = filasCubiertas(inventariadorAssignments);

  const unassignedRespItems: number[] = [];
  const unassignedInvItems: number[] = [];
  for (let i = 1; i <= totalRegistros; i++) {
    if (!responsableRows.has(i)) unassignedRespItems.push(i);
    if (!inventariadorRows.has(i)) unassignedInvItems.push(i);
  }

  const unassignedResponsables = unassignedRespItems.length;
  const unassignedInventariadores = unassignedInvItems.length;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <PasoEncabezado
        icono={<MdFactCheck size={24} />}
        titulo="Revisión final"
        descripcion="Verifique la información antes de importar los activos."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Indicador etiqueta="Carga" valor={<span className="text-base">{carga.descripcion}</span>} icono={<MdInventory2 size={22} />} tono="marca" />
        <Indicador etiqueta="Activos a importar" valor={totalRegistros} icono={<MdCheckCircle size={22} />} tono="acento" />
        <Indicador etiqueta="Asignaciones" valor={responsableAssignments.length + inventariadorAssignments.length}
          icono={<MdAssignmentInd size={22} />} tono="neutro"
          detalle={`${responsableAssignments.length} de custodios · ${inventariadorAssignments.length} de inventariadores`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TablaAsignaciones
          titulo="Custodios"
          icono={<MdPerson size={18} />}
          asignaciones={responsableAssignments}
          nombre={a => a.nombreResponsable}
          pendientes={unassignedRespItems}
          total={totalRegistros}
        />
        <TablaAsignaciones
          titulo="Inventariadores"
          icono={<MdAssignmentInd size={18} />}
          asignaciones={inventariadorAssignments}
          nombre={a => a.nombre ?? a.nombreResponsable}
          pendientes={unassignedInvItems}
          total={totalRegistros}
          obligatorio
        />
      </div>

      {unassignedInventariadores > 0 ? (
        <AvisoPaso tono="error" icono={<MdError size={18} />}>
          <b>No se puede importar todavía.</b> Faltan {unassignedInventariadores} filas sin inventariador; vuelva al paso anterior para asignarlas.
        </AvisoPaso>
      ) : (
        <>
          {unassignedResponsables > 0 && (
            <AvisoPaso tono="alerta" icono={<MdWarning size={18} />}>
              Hay {unassignedResponsables} filas sin custodio. Puede continuar y asignarlos después.
            </AvisoPaso>
          )}
          <AvisoPaso tono="ok" icono={<MdCheckCircle size={18} />}>
            Al confirmar se importarán <b>{totalRegistros} activos</b> con las asignaciones indicadas.
          </AvisoPaso>
        </>
      )}
    </div>
  );
}
