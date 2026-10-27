import React from 'react';
import { MdInbox } from 'react-icons/md';
import { Buscador, TablaVacia } from '../rfid/ui';

interface DataTableProps<T> {
  data: T[];
  columns: { header: string; className?: string }[];
  // renderRow recibe (item, index) y devuelve un <tr> con <td> sin estilos propios:
  // el aspecto lo dan las clases .tabla de globals.css
  renderRow: (item: T, index: number) => React.ReactNode;
  loading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters?: React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  renderRow,
  loading,
  searchTerm,
  onSearchChange,
  filters
}: DataTableProps<T>) {

  return (
    <div className="tabla-marco">
      <div className="tabla-barra">
        <Buscador valor={searchTerm} onCambio={onSearchChange} />
        {filters && (
          <div className="flex flex-wrap gap-2 justify-end">
            {filters}
          </div>
        )}
      </div>

      <div className="tabla-scroll">
        <table className="tabla">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={col.className || ''}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TablaVacia columnas={columns.length} texto="Cargando datos…" />
            ) : data.length === 0 ? (
              <TablaVacia columnas={columns.length} icono={<MdInbox size={40} />} texto="No se encontraron registros" />
            ) : (
              data.map((item, index) => renderRow(item, index))
            )}
          </tbody>
        </table>
      </div>

      {!loading && data.length > 0 && (
        <div className="tabla-pie">
          <span>{data.length} registro{data.length !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}
