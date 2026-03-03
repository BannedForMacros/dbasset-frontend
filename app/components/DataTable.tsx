/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useMemo } from 'react';
import {
  MdSearch, MdClear, MdArrowUpward, MdArrowDownward, MdInbox
} from 'react-icons/md';

/* ─────────────────────────────────────────────
   TIPOS
───────────────────────────────────────────── */
export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: (item: T) => React.ReactNode;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  rowKey?: (item: T, index: number) => string | number;
  /** Slot para colocar botones/filtros extra encima de la tabla */
  toolbar?: React.ReactNode;
  /** Número de filas del skeleton loader */
  skeletonRows?: number;
}

type SortDir = 'asc' | 'desc' | null;

/* ─────────────────────────────────────────────
   COMPONENTE
───────────────────────────────────────────── */
export default function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  actions,
  onRowClick,
  emptyMessage = 'No hay registros disponibles',
  emptyIcon,
  loading = false,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  rowKey,
  toolbar,
  skeletonRows = 6,
}: DataTableProps<T>) {
  const [search, setSearch]     = useState('');
  const [sortCol, setSortCol]   = useState<string | null>(null);
  const [sortDir, setSortDir]   = useState<SortDir>(null);

  /* ── helpers ── */
  const getVal = (obj: T, path: string): unknown =>
    path.split('.').reduce((cur: unknown, k) =>
      cur && typeof cur === 'object' ? (cur as Record<string, unknown>)[k] : undefined
    , obj);

  const handleSort = (key: string) => {
    if (sortCol === key) {
      if (sortDir === 'asc')  { setSortDir('desc'); return; }
      if (sortDir === 'desc') { setSortDir(null); setSortCol(null); return; }
    }
    setSortCol(key);
    setSortDir('asc');
  };

  /* ── datos procesados ── */
  const rows = useMemo(() => {
    let r = [...data];

    if (search.trim()) {
      const t = search.toLowerCase();
      r = r.filter(item =>
        columns.some(col => String(getVal(item, col.key) ?? '').toLowerCase().includes(t))
      );
    }

    if (sortCol && sortDir) {
      r.sort((a, b) => {
        const av = getVal(a, sortCol);
        const bv = getVal(b, sortCol);
        if (av == null) return 1;
        if (bv == null) return -1;
        const an = Number(av), bn = Number(bv);
        if (!isNaN(an) && !isNaN(bn)) return sortDir === 'asc' ? an - bn : bn - an;
        return sortDir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }

    return r;
  }, [data, search, sortCol, sortDir, columns]);

  const colSpan = columns.length + (actions ? 1 : 0);
  const alignClass = (a?: string) =>
    a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : 'text-left';

  /* ─────────────────────── RENDER ─────────────────────── */
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ backgroundColor: '#fff', border: '1.5px solid #e2e8f0' }}
    >

      {/* ── TOOLBAR ── */}
      {(searchable || toolbar) && (
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}
        >
          {/* Búsqueda */}
          {searchable && (
            <div className="relative w-full sm:max-w-xs">
              <MdSearch
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: '#94a3b8' }}
              />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-8 py-2 rounded-lg text-sm outline-none transition-all"
                style={{ border: '1.5px solid #e2e8f0', color: '#0f172a', backgroundColor: '#fff' }}
                onFocus={e => {
                  e.target.style.borderColor = '#1e4786';
                  e.target.style.boxShadow = '0 0 0 3px rgba(30,71,134,0.08)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <MdClear size={16} style={{ color: '#94a3b8' }} />
                </button>
              )}
            </div>
          )}

          {/* Slot externo (botones, filtros, etc.) */}
          <div className="flex items-center gap-2 flex-wrap">
            {toolbar}
            {/* Contador */}
            {search && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(34,196,161,0.1)', color: '#0f9b76' }}
              >
                {rows.length} de {data.length}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── TABLA ── */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full">

          {/* HEAD */}
          <thead>
            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
              {columns.map(col => {
                const isSorted = sortCol === col.key;
                return (
                  <th
                    key={col.key}
                    style={{
                      width: col.width,
                      backgroundColor: '#fafafa',
                      cursor: col.sortable !== false ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                    className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider ${alignClass(col.align)}`}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span style={{ color: isSorted ? '#1e4786' : '#94a3b8' }}>{col.label}</span>
                      {col.sortable !== false && (
                        <span style={{ opacity: isSorted ? 1 : 0.3 }}>
                          {isSorted && sortDir === 'desc'
                            ? <MdArrowDownward size={13} style={{ color: '#22c4a1' }} />
                            : <MdArrowUpward   size={13} style={{ color: isSorted ? '#22c4a1' : '#94a3b8' }} />
                          }
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
              {actions && (
                <th
                  className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-right"
                  style={{ backgroundColor: '#fafafa', color: '#94a3b8' }}
                >
                  Acciones
                </th>
              )}
            </tr>
          </thead>

          {/* BODY */}
          <tbody>

            {/* Loading skeleton */}
            {loading && Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={`sk-${i}`} style={{ borderBottom: '1px solid #f8fafc' }}>
                {Array.from({ length: colSpan }).map((__, j) => (
                  <td key={j} className="px-5 py-4">
                    <div
                      className="rounded-md animate-pulse"
                      style={{
                        height: '14px',
                        width: j === 0 ? '40%' : j === 1 ? '70%' : '55%',
                        backgroundColor: '#f1f5f9',
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}

            {/* Empty */}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    {emptyIcon ?? <MdInbox size={44} style={{ color: '#e2e8f0' }} />}
                    <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {/* Filas */}
            {!loading && rows.map((item, idx) => {
              const key = rowKey ? rowKey(item, idx) : idx;
              return (
                <TableRow
                  key={key}
                  item={item}
                  columns={columns}
                  actions={actions}
                  index={idx}
                  onClick={onRowClick}
                  getVal={getVal}
                  alignClass={alignClass}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── FOOTER ── */}
      {!loading && rows.length > 0 && (
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderTop: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}
        >
          <p className="text-xs" style={{ color: '#94a3b8' }}>
            {rows.length === data.length
              ? `${data.length} registro${data.length !== 1 ? 's' : ''}`
              : `${rows.length} de ${data.length} registros`
            }
          </p>
          {sortCol && (
            <button
              onClick={() => { setSortCol(null); setSortDir(null); }}
              className="text-xs flex items-center gap-1 transition-colors"
              style={{ color: '#94a3b8' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#1e4786')}
              onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
            >
              <MdClear size={13} /> Quitar orden
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   FILA — componente separado para evitar re-renders
───────────────────────────────────────────── */
function TableRow<T extends Record<string, unknown>>({
  item, columns, actions, index, onClick, getVal, alignClass,
}: {
  item: T;
  columns: Column<T>[];
  actions?: (item: T) => React.ReactNode;
  index: number;
  onClick?: (item: T) => void;
  getVal: (obj: T, path: string) => unknown;
  alignClass: (a?: string) => string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <tr
      style={{
        borderBottom: '1px solid #f8fafc',
        backgroundColor: hovered ? '#f8fbff' : 'transparent',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.1s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick?.(item)}
    >
      {columns.map(col => (
        <td
          key={col.key}
          className={`px-5 py-4 text-sm ${alignClass(col.align)}`}
          style={{ color: '#0f172a' }}
        >
          {col.render
            ? col.render(item, index)
            : String(getVal(item, col.key) ?? '—')
          }
        </td>
      ))}
      {actions && (
        <td
          className="px-5 py-4 text-right"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-end gap-1">
            {actions(item)}
          </div>
        </td>
      )}
    </tr>
  );
}