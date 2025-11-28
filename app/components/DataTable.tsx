'use client';

import { useState, useMemo } from 'react';
import { 
  MdSearch, 
  MdFilterList, 
  MdArrowUpward, 
  MdArrowDownward 
} from 'react-icons/md';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: (item: T) => React.ReactNode;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

export default function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  actions,
  onRowClick,
  emptyMessage = 'No hay datos disponibles',
  loading = false,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Función para obtener valor anidado
  const getNestedValue = (obj: T, path: string): unknown => {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  };

  // Función para ordenar
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Función para filtrar
  const handleFilterChange = (columnKey: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [columnKey]: value,
    }));
  };

  // Datos procesados (filtrados, buscados y ordenados)
  const processedData = useMemo(() => {
    let result = [...data];

    // Búsqueda global
    if (searchTerm) {
      result = result.filter((item) =>
        columns.some((col) => {
          const value = getNestedValue(item, col.key);
          return String(value || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        })
      );
    }

    // Filtros por columna
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((item) => {
          const itemValue = getNestedValue(item, key);
          return String(itemValue || '')
            .toLowerCase()
            .includes(value.toLowerCase());
        });
      }
    });

    // Ordenamiento
    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        const aValue = getNestedValue(a, sortColumn);
        const bValue = getNestedValue(b, sortColumn);

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const aStr = String(aValue);
        const bStr = String(bValue);

        // Intentar comparar como números
        const aNum = Number(aValue);
        const bNum = Number(bValue);

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }

        // Comparar como strings
        if (sortDirection === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    return result;
  }, [data, searchTerm, filters, sortColumn, sortDirection, columns]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center justify-center">
          <div className="text-lg text-gray-600">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Barra de herramientas */}
      <div className="p-4 border-b bg-gray-50 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Buscador */}
          <div className="relative flex-1 w-full md:max-w-md">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Botón de filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              showFilters
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MdFilterList size={20} />
            Filtros
          </button>
        </div>

        {/* Filtros por columna */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            {columns
              .filter((col) => col.filterable !== false)
              .map((col) => (
                <div key={col.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {col.label}
                  </label>
                  <input
                    type="text"
                    placeholder={`Filtrar por ${col.label.toLowerCase()}`}
                    value={filters[col.key] || ''}
                    onChange={(e) => handleFilterChange(col.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
          </div>
        )}

        {/* Contador de resultados */}
        <div className="text-sm text-gray-600">
          Mostrando {processedData.length} de {data.length} registros
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    col.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {col.sortable !== false && sortColumn === col.key && (
                      <span>
                        {sortDirection === 'asc' ? (
                          <MdArrowUpward size={16} className="text-blue-600" />
                        ) : (
                          <MdArrowDownward size={16} className="text-blue-600" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              processedData.map((item, index) => (
                <tr
                  key={index}
                  onClick={() => onRowClick?.(item)}
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-sm text-gray-900">
                      {col.render
                        ? col.render(item)
                        : String(getNestedValue(item, col.key) ?? '')}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {actions(item)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}