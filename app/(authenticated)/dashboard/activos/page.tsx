/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState, useMemo } from 'react';
import { activoService, Activo } from '../../../services/activo.service';
import { cargaService, Carga } from '../../../services/carga.service';
import { localService, Local } from '../../../services/local.service';
import { areaService, Area } from '../../../services/area.service';
import { oficinaService, Oficina } from '../../../services/oficina.service';
import { responsableService, Responsable } from '../../../services/responsable.service';
import { estadoService, Estado } from '../../../services/estado.service';
import {
  MdAdd, MdBusiness, MdPerson, MdCheckCircle,
  MdInventory, MdFilterList, MdSearch, MdClear,
  MdLayers, MdMeetingRoom, MdInsertDriveFile, MdInfo,
  MdVisibility, MdDelete, MdLocationOn
} from 'react-icons/md';

import Select from '../../../components/Select';
import IconButton from '../../../components/IconButton';
import Badge from '../../../components/Badge';
import StatCard from '../../../components/StatCard';
import { FormData as ActivoFormData } from './components/ModalActivo';
import ModalActivo from './components/ModalActivo';
import ModalDetalle from './components/ModalDetalle';

interface DetalleCarga { idDetalle?: number; carga?: Carga; activo?: Activo; codActivo?: string; }
interface ActivoConCarga extends Activo { detalleCarga?: DetalleCarga; }

function getEstadoBadgeType(nombre: string): 'good' | 'regular' | 'bad' | 'neutral' {
  const n = nombre.toLowerCase();
  if (n.includes('bueno') || n.includes('nuevo') || n.includes('excelente')) return 'good';
  if (n.includes('regular') || n.includes('medio')) return 'regular';
  if (n.includes('malo') || n.includes('dañado') || n.includes('deteriorado')) return 'bad';
  return 'neutral';
}

/* ── Tooltip de ubicación ── */
function UbicacionTooltip({ local, area, oficina }: {
  local?: Local; area?: Area; oficina?: Oficina;
}) {
  const [visible, setVisible] = useState(false);

  if (!local?.nombreLocal) {
    return <span style={{ color: '#e2e8f0' }}>—</span>;
  }

  return (
    <div className="relative inline-flex" style={{ zIndex: visible ? 50 : 'auto' }}>
      <button
        type="button"
        className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-150"
        style={{
          backgroundColor: visible ? 'rgba(30,71,134,0.1)' : 'transparent',
          color: visible ? '#1e4786' : '#94a3b8',
          border: `1px solid ${visible ? 'rgba(30,71,134,0.2)' : 'transparent'}`,
        }}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        <MdLocationOn size={14} />
        <span className="text-xs font-medium truncate max-w-[80px]">{local.nombreLocal}</span>
      </button>

      {visible && (
        <div
          className="absolute left-0 bottom-full mb-2 rounded-xl p-3 min-w-[180px]"
          style={{
            backgroundColor: '#fff',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            pointerEvents: 'none',
          }}
        >
          {/* Flecha */}
          <div style={{
            position: 'absolute', bottom: '-6px', left: '16px',
            width: '10px', height: '10px', backgroundColor: '#fff',
            border: '1.5px solid #e2e8f0', borderTop: 'none', borderLeft: 'none',
            transform: 'rotate(45deg)',
          }} />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MdBusiness size={13} style={{ color: '#1e4786', flexShrink: 0 }} />
              <span className="text-xs font-semibold" style={{ color: '#0f172a' }}>
                {local.nombreLocal}
              </span>
            </div>
            {area?.nombreArea && (
              <div className="flex items-center gap-2">
                <MdLayers size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <span className="text-xs" style={{ color: '#64748b' }}>{area.nombreArea}</span>
              </div>
            )}
            {oficina?.nombreOficina && (
              <div className="flex items-center gap-2">
                <MdMeetingRoom size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <span className="text-xs" style={{ color: '#64748b' }}>{oficina.nombreOficina}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Componente de fila ── */
function ActivoRow({
  item, index, onView, onDelete,
}: {
  item: ActivoConCarga;
  index: number;
  onView: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const estado     = item.estado as Estado | undefined;
  const local      = item.local as Local | undefined;
  const area       = item.area as Area | undefined;
  const oficina    = item.oficina as Oficina | undefined;
  const resp       = item.responsable as Responsable | undefined;

  return (
    <tr
      style={{
        borderBottom: '1px solid #f8fafc',
        backgroundColor: hovered ? '#f8fbff' : 'transparent',
        transition: 'background-color 0.1s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* # */}
      <td className="px-5 py-3.5 text-xs font-mono font-bold w-10" style={{ color: '#cbd5e1' }}>
        {index + 1}
      </td>

      {/* Bien */}
      <td className="px-5 py-3.5" style={{ minWidth: '200px' }}>
        <p className="font-semibold text-sm leading-tight" style={{ color: '#0f172a' }}>
          {item.descripcion}
        </p>
        <span
          className="text-xs font-mono px-1.5 py-0.5 rounded mt-1 inline-block"
          style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
        >
          {item.codActivo}
        </span>
      </td>

      {/* Custodio */}
      <td className="px-5 py-3.5" style={{ minWidth: '140px' }}>
        {resp ? (
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
              style={{ backgroundColor: '#1e4786' }}
            >
              {resp.nombreResponsable.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm" style={{ color: '#0f172a' }}>{resp.nombreResponsable}</span>
          </div>
        ) : (
          <span className="text-xs" style={{ color: '#e2e8f0' }}>Sin asignar</span>
        )}
      </td>

      {/* Ubicación — tooltip */}
      <td className="px-5 py-3.5">
        <UbicacionTooltip local={local} area={area} oficina={oficina} />
      </td>

      {/* Estado */}
      <td className="px-5 py-3.5">
        {estado?.nombreEstado ? (
          <Badge label={estado.nombreEstado} type={getEstadoBadgeType(estado.nombreEstado)} />
        ) : (
          <span className="text-xs" style={{ color: '#000000' }}>Sin Estado</span>
        )}
      </td>

      {/* Acciones */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1">
          <IconButton variant="view"   icon={<MdVisibility size={17} />} title="Ver detalles" onClick={onView} />
          <IconButton variant="delete" icon={<MdDelete size={17} />}     title="Eliminar"     onClick={onDelete} />
        </div>
      </td>
    </tr>
  );
}

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export default function ActivosPage() {
  const [activos, setActivos]           = useState<ActivoConCarga[]>([]);
  const [cargas, setCargas]             = useState<Carga[]>([]);
  const [locales, setLocales]           = useState<Local[]>([]);
  const [areas, setAreas]               = useState<Area[]>([]);
  const [oficinas, setOficinas]         = useState<Oficina[]>([]);
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [estados, setEstados]           = useState<Estado[]>([]);
  const [loading, setLoading]           = useState(true);

  const [showModal, setShowModal]           = useState(false);
  const [showDetail, setShowDetail]         = useState(false);
  const [editingActivo, setEditingActivo]   = useState<ActivoConCarga | null>(null);
  const [selectedActivo, setSelectedActivo] = useState<ActivoConCarga | null>(null);

  const [searchTerm,        setSearchTerm]        = useState('');
  const [filtroCarga,       setFiltroCarga]        = useState('');
  const [filtroLocal,       setFiltroLocal]        = useState('');
  const [filtroArea,        setFiltroArea]         = useState('');
  const [filtroOficina,     setFiltroOficina]      = useState('');
  const [filtroEstado,      setFiltroEstado]       = useState('');
  const [filtroResponsable, setFiltroResponsable]  = useState('');

  useEffect(() => { cargarDatosIniciales(); }, []);
  useEffect(() => {
    if (filtroCarga && cargas.length > 0) cargarActivosPorCarga(Number(filtroCarga));
  }, [filtroCarga]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [act, car, loc, are, ofi, res, est] = await Promise.all([
        activoService.listarTodos(),    cargaService.listarTodas(),
        localService.listarActivos(),   areaService.listarActivos(),
        oficinaService.listarActivos(), responsableService.listarActivos(),
        estadoService.listarTodos(),
      ]);
      setActivos(act);
      setCargas(car.sort((a: Carga, b: Carga) => (b.codCarga || 0) - (a.codCarga || 0)));
      setLocales(loc); setAreas(are); setOficinas(ofi);
      setResponsables(res); setEstados(est);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const cargarActivosPorCarga = async (codCarga: number) => {
    try {
      setLoading(true);
      setActivos(await activoService.listarPorCarga(codCarga));
    } catch { setActivos([]); }
    finally { setLoading(false); }
  };

  const activosFiltrados = useMemo(() => {
    let f = activos;
    if (filtroLocal)       f = f.filter(i => (i.local as Local)?.codLocal === Number(filtroLocal));
    if (filtroArea)        f = f.filter(i => (i.area as Area)?.codArea === Number(filtroArea));
    if (filtroOficina)     f = f.filter(i => (i.oficina as Oficina)?.codOficina === Number(filtroOficina));
    if (filtroEstado)      f = f.filter(i => (i.estado as Estado)?.codEstado === Number(filtroEstado));
    if (filtroResponsable) f = f.filter(i => (i.responsable as Responsable)?.codResponsable === Number(filtroResponsable));
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      f = f.filter(i =>
        i.codActivo.toLowerCase().includes(t) ||
        i.descripcion.toLowerCase().includes(t) ||
        (i.marca || '').toLowerCase().includes(t) ||
        (i.modelo || '').toLowerCase().includes(t) ||
        (i.serie || '').toLowerCase().includes(t)
      );
    }
    return f;
  }, [activos, filtroLocal, filtroArea, filtroOficina, filtroEstado, filtroResponsable, searchTerm]);

  const areasDisponibles    = filtroLocal ? areas.filter(a => (a.local as Local)?.codLocal === Number(filtroLocal)) : areas;
  const oficinasDisponibles = filtroArea  ? oficinas.filter(o => (o.area as Area)?.codArea === Number(filtroArea))  : oficinas;

  const hayFiltros = searchTerm || filtroCarga || filtroLocal || filtroArea || filtroOficina || filtroEstado || filtroResponsable;

  const limpiarFiltros = () => {
    setSearchTerm(''); setFiltroCarga(''); setFiltroLocal('');
    setFiltroArea(''); setFiltroOficina(''); setFiltroEstado('');
    setFiltroResponsable(''); cargarDatosIniciales();
  };

  const handleSave = async (formData: ActivoFormData, editingId: number | null) => {
    const payload = {
      codActivo: formData.codActivo,       codInterno: formData.codInterno,
      descripcion: formData.descripcion,   marca: formData.marca,
      modelo: formData.modelo,             serie: formData.serie,
      color: formData.color,               anio: formData.anio,
      fechaCompra: formData.fechaCompra,   codCarga: Number(formData.codCarga),
      local:       { codLocal:       Number(formData.codLocal) },
      area:        { codArea:        Number(formData.codArea) },
      oficina:     { codOficina:     Number(formData.codOficina) },
      responsable: { codResponsable: Number(formData.codResponsable) },
      estado:      { codEstado:      Number(formData.codEstado) },
    } as unknown as Activo;
    try {
      if (editingId) await activoService.actualizar(editingId, payload);
      else           await activoService.crear(payload);
      setShowModal(false);
      setEditingActivo(null);
      setActivos(await activoService.listarTodos());
    } catch { alert('Error al guardar.'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este activo?')) return;
    try {
      await activoService.eliminar(id);
      setActivos(await activoService.listarTodos());
    } catch (e) { console.error(e); }
  };

  const totalAsignados = activos.filter(a => a.responsable).length;

  /* ── headers de tabla ── */
  const HEADERS = ['#', 'Bien', 'Custodio', 'Ubicación', 'Estado', 'Acciones'];

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Activos Fijos</h1>
          <p className="text-sm mt-0.5 flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
            <MdInventory size={15} /> Inventario general de bienes
          </p>
        </div>
        <button
          onClick={() => { setEditingActivo(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ backgroundColor: '#1e4786' }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#163564'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1e4786'}
        >
          <MdAdd size={19} /> Nuevo Activo
        </button>
      </div>

      {/* FILTROS */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: '#fff', border: '1.5px solid #e2e8f0' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MdFilterList size={17} style={{ color: '#1e4786' }} />
            <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>Filtros</span>
            {hayFiltros && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: 'rgba(34,196,161,0.12)', color: '#0f9b76' }}>
                {activosFiltrados.length} resultados
              </span>
            )}
          </div>
          {hayFiltros && (
            <button
              onClick={limpiarFiltros}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.06)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.12)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.06)'}
            >
              <MdClear size={13} /> Limpiar
            </button>
          )}
        </div>

        {/* Fila 1 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
          <div className="md:col-span-4">
            <Select label="Carga" icon={<MdInsertDriveFile size={13}/>}
              value={filtroCarga} placeholder="Todas las cargas"
              onChange={v => { setFiltroCarga(v); if (!v) cargarDatosIniciales(); }}
              options={cargas.map(c => ({ value: c.codCarga!, label: `#${c.codCarga} · ${c.descripcion}` }))} />
          </div>
          <div className="md:col-span-3">
            <Select label="Estado" icon={<MdInfo size={13}/>}
              value={filtroEstado} placeholder="Todos"
              onChange={setFiltroEstado}
              options={estados.map(e => ({ value: e.codEstado!, label: e.nombreEstado }))} />
          </div>
          <div className="md:col-span-3">
            <Select label="Custodio" icon={<MdPerson size={13}/>}
              value={filtroResponsable} placeholder="Todos"
              onChange={setFiltroResponsable}
              options={responsables.map(r => ({ value: r.codResponsable!, label: r.nombreResponsable }))} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
              <span className="flex items-center gap-1"><MdSearch size={13} style={{ color: '#1e4786' }}/>Búsqueda</span>
            </label>
            <div className="relative">
              <MdSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Código, descripción..."
                className="w-full pl-9 pr-8 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{ border: '1.5px solid #e2e8f0', color: '#0f172a', backgroundColor: '#fff' }}
                onFocus={e => { e.target.style.borderColor = '#1e4786'; e.target.style.boxShadow = '0 0 0 3px rgba(30,71,134,0.08)'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <MdClear size={15} style={{ color: '#94a3b8' }} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Fila 2: Ubicación */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select label="Local" icon={<MdBusiness size={13}/>}
            value={filtroLocal} placeholder="Todos"
            onChange={v => { setFiltroLocal(v); setFiltroArea(''); setFiltroOficina(''); }}
            options={locales.map(l => ({ value: l.codLocal!, label: l.nombreLocal }))} />
          <Select label="Área" icon={<MdLayers size={13}/>}
            value={filtroArea} placeholder="Todas" disabled={!filtroLocal}
            onChange={v => { setFiltroArea(v); setFiltroOficina(''); }}
            options={areasDisponibles.map(a => ({ value: a.codArea!, label: a.nombreArea }))} />
          <Select label="Oficina" icon={<MdMeetingRoom size={13}/>}
            value={filtroOficina} placeholder="Todas" disabled={!filtroArea}
            onChange={setFiltroOficina}
            options={oficinasDisponibles.map(o => ({ value: o.codOficina!, label: o.nombreOficina }))} />
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<MdInventory size={22}/>}      label="Total Activos"  value={activos.length}                              sub="En inventario" />
        <StatCard icon={<MdCheckCircle size={22}/>}    label="Asignados"      value={`${totalAsignados} / ${activos.length}`}     accent />
        <StatCard icon={<MdInsertDriveFile size={22}/>} label="Cargas Activas" value={cargas.length} />
      </div>

      {/* TABLA */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff', border: '1.5px solid #e2e8f0' }}>

        {/* Skeleton */}
        {loading && (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                {HEADERS.map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ color: '#94a3b8', backgroundColor: '#fafafa' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                  {Array.from({ length: HEADERS.length }).map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3.5 rounded-md animate-pulse"
                        style={{ backgroundColor: '#f1f5f9', width: j === 1 ? '70%' : j === 0 ? '30%' : '55%' }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Empty */}
        {!loading && activosFiltrados.length === 0 && (
          <div className="text-center py-24">
            <MdInventory size={44} style={{ color: '#e2e8f0', margin: '0 auto 10px' }} />
            <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>
              {hayFiltros ? 'Sin resultados para estos filtros' : 'No hay activos registrados'}
            </p>
          </div>
        )}

        {/* Datos */}
        {!loading && activosFiltrados.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  {HEADERS.map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider"
                      style={{ color: '#94a3b8', backgroundColor: '#fafafa' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activosFiltrados.map((item, index) => (
                  <ActivoRow
                    key={item.id ?? index}
                    item={item}
                    index={index}
                    onView={() => { setSelectedActivo(item); setShowDetail(true); }}
                    onDelete={() => item.id && handleDelete(item.id)}
                  />
                ))}
              </tbody>
            </table>

            {/* Footer */}
            <div className="px-5 py-3 flex items-center justify-between"
              style={{ borderTop: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}>
              <p className="text-xs" style={{ color: '#94a3b8' }}>
                {activosFiltrados.length === activos.length
                  ? `${activos.length} registro${activos.length !== 1 ? 's' : ''}`
                  : `${activosFiltrados.length} de ${activos.length} registros`
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MODALES */}
      <ModalActivo
        open={showModal}
        onClose={() => { setShowModal(false); setEditingActivo(null); }}
        onSave={handleSave}
        editingActivo={editingActivo}
        cargas={cargas} locales={locales} areas={areas}
        oficinas={oficinas} responsables={responsables} estados={estados}
      />
      <ModalDetalle
        open={showDetail}
        onClose={() => { setShowDetail(false); setSelectedActivo(null); }}
        activo={selectedActivo}
      />
    </div>
  );
}