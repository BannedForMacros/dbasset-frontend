'use client';

import { MdSelectAll, MdInfoOutline, MdTableChart } from 'react-icons/md';
import { Boton } from '@/app/components/rfid/ui';

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

const LIMITE_FILAS = 100;

function Etiqueta({ texto, tono }: { texto: string; tono: 'marca' | 'acento' | 'neutro' }) {
  const t = {
    marca:  { bg: 'rgba(30,71,134,0.08)',  color: '#1e4786' },
    acento: { bg: 'rgba(34,196,161,0.12)', color: '#0f766e' },
    neutro: { bg: '#f1f5f9',               color: '#94a3b8' },
  }[tono];
  return (
    <span className="inline-block max-w-[11rem] truncate px-2 py-0.5 rounded-md text-[11px] font-semibold align-middle"
      style={{ backgroundColor: t.bg, color: t.color }} title={texto}>
      {texto}
    </span>
  );
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
  const previewData = data.slice(0, LIMITE_FILAS);
  const todos = selectedRows.size === data.length;

  return (
    <div className="tabla-marco">
      <div className="tabla-barra">
        <div className="flex flex-wrap items-center gap-2">
          <MdTableChart size={18} style={{ color: '#1e4786' }} />
          <h4 className="font-semibold" style={{ color: '#0f172a' }}>Filas del Excel</h4>
          <Etiqueta texto={`${data.length} filas`} tono="neutro" />
          {assignedRows.size > 0 && <Etiqueta texto={`${assignedRows.size} asignadas`} tono="acento" />}
          {selectedRows.size > 0 && <Etiqueta texto={`${selectedRows.size} seleccionadas`} tono="marca" />}
        </div>
        <div className="flex gap-2">
          <Boton pequeno variante="secundario" onClick={onSelectAll}><MdSelectAll size={15} /> Seleccionar todas</Boton>
          <Boton pequeno variante="secundario" onClick={onDeselectAll} disabled={selectedRows.size === 0}>Quitar selección</Boton>
        </div>
      </div>

      <div className="tabla-scroll max-h-96 overflow-y-auto">
        <table className="tabla tabla-compacta tabla-fija">
          <thead>
            <tr>
              <th className="col-check">
                <input
                  type="checkbox"
                  checked={todos}
                  onChange={() => todos ? onDeselectAll() : onSelectAll()}
                  aria-label="Seleccionar todas las filas"
                  className="accent-[#1e4786]"
                />
              </th>
              <th className="col-num">#</th>
              <th>Asignación</th>
              {headers.map(h => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {previewData.map((row, idx) => {
              const isAssigned = assignedRows.has(idx + 1);
              const assignment = rowAssignments.get(idx + 1);
              const isSelected = selectedRows.has(idx);

              return (
                <tr
                  key={idx}
                  data-clic="true"
                  data-seleccionada={isSelected}
                  data-marcada={!isSelected && isAssigned}
                  onClick={() => onRowToggle(idx)}
                >
                  <td className="col-check">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onRowToggle(idx)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Seleccionar fila ${idx + 1}`}
                      className="accent-[#1e4786]"
                    />
                  </td>
                  <td className="col-num font-mono" style={{ color: '#94a3b8' }}>{idx + 1}</td>
                  <td>
                    {assignment?.responsable || assignment?.inventariador ? (
                      <div className="flex flex-col gap-1 items-start">
                        {assignment.responsable && <Etiqueta texto={assignment.responsable} tono="marca" />}
                        {assignment.inventariador && <Etiqueta texto={assignment.inventariador} tono="acento" />}
                      </div>
                    ) : (
                      <Etiqueta texto="Sin asignar" tono="neutro" />
                    )}
                  </td>
                  {headers.map(h => {
                    const valor = String(row[h] ?? '');
                    return (
                      <td key={h} className="whitespace-nowrap" title={valor.length > 30 ? valor : undefined}>
                        {valor.length > 30 ? `${valor.substring(0, 30)}…` : valor}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.length > LIMITE_FILAS && (
        <div className="tabla-pie justify-start gap-2">
          <MdInfoOutline size={15} />
          Se muestran las primeras {LIMITE_FILAS} filas de {data.length}. Las asignaciones por rango aplican a todas.
        </div>
      )}
    </div>
  );
}
