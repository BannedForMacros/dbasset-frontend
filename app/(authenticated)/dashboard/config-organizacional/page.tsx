'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../../services/auth.service';
import { localService, Local } from '../../../services/local.service';
import { areaService, Area } from '../../../services/area.service';
import { oficinaService, Oficina } from '../../../services/oficina.service';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdBusiness,
  MdLayers,
  MdMeetingRoom,
  MdChevronRight,
  MdViewList,
  MdAccountTree,
  MdPlace,
  MdUnfoldMore,
  MdUnfoldLess,
} from 'react-icons/md';
import Select from '@/app/components/Select';
import Input from '@/app/components/Input';
import IconButton from '@/app/components/IconButton';
import {
  PageHeader, Boton, Campo, ModalBase, Indicador, Buscador, TablaVacia,
  COLORES, inputCls, inputStyle, useAviso,
} from '@/app/components/rfid/ui';
import { mensajeError } from '@/app/utils/exportar';

type EntityType = 'local' | 'area' | 'oficina';

interface FormState {
  nombre: string;
  codInterno: string;
  observacion: string;
  direccion: string;
  codLocal: string;
  codArea: string;
}

interface ExpandedState {
  [key: string]: boolean;
}

const FORM_VACIO: FormState = { nombre: '', codInterno: '', observacion: '', direccion: '', codLocal: '', codArea: '' };

/* Cada nivel de la jerarquía con su color dentro de la paleta del panel */
const NIVEL = {
  local:   { nombre: 'Local',   plural: 'Locales',  icono: MdBusiness,    color: '#1e4786', fondo: 'rgba(30,71,134,0.08)' },
  area:    { nombre: 'Área',    plural: 'Áreas',    icono: MdLayers,      color: '#0f9b76', fondo: 'rgba(34,196,161,0.12)' },
  oficina: { nombre: 'Oficina', plural: 'Oficinas', icono: MdMeetingRoom, color: '#64748b', fondo: '#f1f5f9' },
} as const;

const normalizar = (t?: string | null) =>
  (t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const codLocalDe = (a: Area) => (a.local as Local)?.codLocal;
const codAreaDe = (o: Oficina) => (o.area as Area)?.codArea;

function IconoNivel({ tipo, size = 'md' }: { tipo: EntityType; size?: 'sm' | 'md' }) {
  const n = NIVEL[tipo];
  const Icono = n.icono;
  const dim = size === 'md' ? 'w-10 h-10' : 'w-8 h-8';
  return (
    <div className={`${dim} rounded-xl flex items-center justify-center shrink-0`} style={{ backgroundColor: n.fondo, color: n.color }}>
      <Icono size={size === 'md' ? 21 : 17} />
    </div>
  );
}

function Chevron({ abierto, onClick, deshabilitado, titulo }: {
  abierto: boolean; onClick: () => void; deshabilitado: boolean; titulo: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deshabilitado}
      title={titulo}
      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${deshabilitado ? '' : 'hover:bg-slate-100'}`}
      style={{ color: deshabilitado ? '#e2e8f0' : COLORES.suave, cursor: deshabilitado ? 'default' : 'pointer' }}
    >
      <MdChevronRight size={22} className="transition-transform duration-200" style={{ transform: abierto ? 'rotate(90deg)' : 'none' }} />
    </button>
  );
}

function Contador({ valor, singular, plural }: { valor: number; singular: string; plural: string }) {
  return (
    <span className="text-xs whitespace-nowrap" style={{ color: COLORES.tenue }}>
      <b style={{ color: COLORES.suave }}>{valor}</b> {valor === 1 ? singular : plural}
    </span>
  );
}

export default function ConfigOrganizacionalPage() {
  const router = useRouter();
  const { mostrar, nodo } = useAviso();
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [locales, setLocales] = useState<Local[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [oficinas, setOficinas] = useState<Oficina[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLocales, setExpandedLocales] = useState<ExpandedState>({});
  const [expandedAreas, setExpandedAreas] = useState<ExpandedState>({});

  // Estados para vista de tabla
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [tableEntityType, setTableEntityType] = useState<EntityType>('local');
  const [filtroLocalTabla, setFiltroLocalTabla] = useState<string>('');
  const [filtroAreaTabla, setFiltroAreaTabla] = useState<string>('');

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<EntityType>('local');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [parentContext, setParentContext] = useState<{ localId?: number; areaId?: number }>({});
  const [formData, setFormData] = useState<FormState>(FORM_VACIO);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    cargarTodosDatos(true);
  }, [router]);

  const cargarTodosDatos = async (inicial = false) => {
    try {
      setLoading(true);
      const [localesData, areasData, oficinasData] = await Promise.all([
        localService.listarActivos(),
        areaService.listarActivos(),
        oficinaService.listarActivos()
      ]);
      setLocales(localesData);
      setAreas(areasData);
      setOficinas(oficinasData);
      // La primera vez se muestran las áreas de cada local
      if (inicial) {
        const abiertos: ExpandedState = {};
        localesData.forEach(l => { if (l.codLocal) abiertos[l.codLocal] = true; });
        setExpandedLocales(abiertos);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      mostrar('error', 'No se pudo cargar la estructura organizacional');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(FORM_VACIO);
    setIsEditing(false);
    setEditingId(null);
    setParentContext({});
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!formData.nombre.trim() || !formData.codInterno.trim()) {
      mostrar('error', 'Complete el nombre y el código interno');
      return;
    }
    if (modalType === 'local' && !formData.direccion.trim()) {
      mostrar('error', 'Ingrese la dirección del local');
      return;
    }
    if (modalType !== 'local' && !formData.codLocal) {
      mostrar('error', 'Seleccione el local');
      return;
    }
    if (modalType === 'oficina' && !formData.codArea) {
      mostrar('error', 'Seleccione el área');
      return;
    }

    setGuardando(true);
    try {
      if (modalType === 'local') {
        const payload: Local = {
          nombreLocal: formData.nombre,
          direccion: formData.direccion,
          codInterno: formData.codInterno
        };
        if (isEditing && editingId) {
          await localService.actualizar(editingId, payload);
        } else {
          await localService.crear(payload);
        }
      } else if (modalType === 'area') {
        const payload: Area = {
          nombreArea: formData.nombre,
          observacion: formData.observacion,
          codInterno: formData.codInterno,
          local: { codLocal: Number(formData.codLocal) }
        };
        if (isEditing && editingId) {
          await areaService.actualizar(editingId, payload);
        } else {
          await areaService.crear(payload);
        }
      } else if (modalType === 'oficina') {
        const payload: Oficina = {
          nombreOficina: formData.nombre,
          observacion: formData.observacion,
          codInterno: formData.codInterno,
          area: { codArea: Number(formData.codArea) }
        };
        if (isEditing && editingId) {
          await oficinaService.actualizar(editingId, payload);
        } else {
          await oficinaService.crear(payload);
        }
      }

      mostrar('ok', `${NIVEL[modalType].nombre} ${isEditing ? 'actualizado' : 'registrado'} correctamente`);
      closeModal();
      cargarTodosDatos();
    } catch (error) {
      console.error('Error al guardar:', error);
      mostrar('error', mensajeError(error, 'No se pudo guardar'));
    } finally {
      setGuardando(false);
    }
  };

  const handleDelete = async (type: EntityType, id: number, nombre: string) => {
    if (!confirm(`¿Eliminar ${NIVEL[type].nombre.toLowerCase()} "${nombre}"?`)) return;

    try {
      if (type === 'local') {
        await localService.eliminar(id);
      } else if (type === 'area') {
        await areaService.eliminar(id);
      } else {
        await oficinaService.eliminar(id);
      }
      mostrar('ok', `${NIVEL[type].nombre} eliminado`);
      cargarTodosDatos();
    } catch (error) {
      console.error('Error al eliminar:', error);
      mostrar('error', mensajeError(error, 'No se pudo eliminar; verifique que no tenga elementos o activos asociados'));
    }
  };

  const openNewModal = (type: EntityType, context?: { localId?: number; areaId?: number }) => {
    resetForm();
    setModalType(type);
    setParentContext(context || {});
    setFormData({
      ...FORM_VACIO,
      codLocal: context?.localId !== undefined ? context.localId.toString() : '',
      codArea: context?.areaId !== undefined ? context.areaId.toString() : '',
    });
    setShowModal(true);
  };

  const openEditModal = (type: EntityType, entity: Local | Area | Oficina) => {
    setIsEditing(true);
    setModalType(type);

    if (type === 'local') {
      const local = entity as Local;
      setEditingId(local.codLocal || null);
      setFormData({ ...FORM_VACIO, nombre: local.nombreLocal, direccion: local.direccion, codInterno: local.codInterno });
    } else if (type === 'area') {
      const area = entity as Area;
      setEditingId(area.codArea || null);
      setFormData({
        ...FORM_VACIO,
        nombre: area.nombreArea,
        observacion: area.observacion || '',
        codInterno: area.codInterno || '',
        codLocal: codLocalDe(area)?.toString() || '',
      });
    } else {
      const oficina = entity as Oficina;
      setEditingId(oficina.codOficina || null);
      const areaRelacionada = areas.find(a => a.codArea === codAreaDe(oficina));
      setFormData({
        ...FORM_VACIO,
        nombre: oficina.nombreOficina,
        observacion: oficina.observacion || '',
        codInterno: oficina.codInterno || '',
        codLocal: areaRelacionada ? codLocalDe(areaRelacionada)?.toString() || '' : '',
        codArea: codAreaDe(oficina)?.toString() || '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const toggleLocal = (localId: number) => {
    setExpandedLocales(prev => ({ ...prev, [localId]: !prev[localId] }));
  };

  const toggleArea = (areaId: number) => {
    setExpandedAreas(prev => ({ ...prev, [areaId]: !prev[areaId] }));
  };

  const expandAll = () => {
    const newExpandedLocales: ExpandedState = {};
    const newExpandedAreas: ExpandedState = {};
    locales.forEach(local => { if (local.codLocal) newExpandedLocales[local.codLocal] = true; });
    areas.forEach(area => { if (area.codArea) newExpandedAreas[area.codArea] = true; });
    setExpandedLocales(newExpandedLocales);
    setExpandedAreas(newExpandedAreas);
  };

  const collapseAll = () => {
    setExpandedLocales({});
    setExpandedAreas({});
  };

  /* ── Índices por padre ── */
  const areasPorLocal = useMemo(() => {
    const m = new Map<number, Area[]>();
    areas.forEach(a => {
      const id = codLocalDe(a);
      if (id == null) return;
      m.set(id, [...(m.get(id) ?? []), a]);
    });
    return m;
  }, [areas]);

  const oficinasPorArea = useMemo(() => {
    const m = new Map<number, Oficina[]>();
    oficinas.forEach(o => {
      const id = codAreaDe(o);
      if (id == null) return;
      m.set(id, [...(m.get(id) ?? []), o]);
    });
    return m;
  }, [oficinas]);

  const oficinasDeLocal = (localId: number) =>
    (areasPorLocal.get(localId) ?? []).reduce((acc, a) => acc + (oficinasPorArea.get(a.codArea!)?.length ?? 0), 0);

  /* ── Búsqueda: un nivel se muestra si coincide él o algún descendiente;
        si coincide un padre se muestran todos sus hijos ── */
  const termino = normalizar(searchTerm.trim());
  const buscando = termino.length > 0;
  const coincide = (...textos: (string | undefined | null)[]) => textos.some(t => normalizar(t).includes(termino));

  const arbol = useMemo(() => {
    return locales.map(local => {
      const localCoincide = !buscando || coincide(local.nombreLocal, local.direccion, local.codInterno);
      const hijos = (areasPorLocal.get(local.codLocal!) ?? []).map(area => {
        const areaCoincide = localCoincide || coincide(area.nombreArea, area.codInterno, area.observacion);
        const ofis = (oficinasPorArea.get(area.codArea!) ?? []).filter(o =>
          areaCoincide || coincide(o.nombreOficina, o.codInterno, o.observacion));
        return { area, oficinas: ofis, visible: areaCoincide || ofis.length > 0 };
      }).filter(h => h.visible);
      return { local, areas: hijos, visible: localCoincide || hijos.length > 0 };
    }).filter(n => n.visible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locales, areasPorLocal, oficinasPorArea, termino]);

  const getModalTitle = () => `${isEditing ? 'Editar' : 'Nuevo'} ${NIVEL[modalType].nombre.toLowerCase()}`;

  const areasFiltradas_Form = formData.codLocal
    ? areas.filter(a => codLocalDe(a) === Number(formData.codLocal))
    : [];

  // Datos de la vista de tabla
  const tablaLocales = locales.filter(l => !buscando || coincide(l.nombreLocal, l.direccion, l.codInterno));
  const tablaAreas = areas.filter(area =>
    (!filtroLocalTabla || codLocalDe(area) === Number(filtroLocalTabla))
    && (!buscando || coincide(area.nombreArea, area.codInterno, area.observacion, (area.local as Local)?.nombreLocal)));
  const tablaOficinas = oficinas.filter(oficina => {
    const areaRelacionada = areas.find(a => a.codArea === codAreaDe(oficina));
    const localId = areaRelacionada ? codLocalDe(areaRelacionada) : undefined;
    if (filtroLocalTabla && localId !== Number(filtroLocalTabla)) return false;
    if (filtroAreaTabla && codAreaDe(oficina) !== Number(filtroAreaTabla)) return false;
    return !buscando || coincide(oficina.nombreOficina, oficina.codInterno, oficina.observacion, (oficina.area as Area)?.nombreArea);
  });
  const totalTabla = tableEntityType === 'local' ? tablaLocales.length : tableEntityType === 'area' ? tablaAreas.length : tablaOficinas.length;
  const totalEntidad = tableEntityType === 'local' ? locales.length : tableEntityType === 'area' ? areas.length : oficinas.length;

  // Áreas filtradas por local para el select en oficinas
  const areasParaTablaOficinas = filtroLocalTabla
    ? areas.filter(a => codLocalDe(a) === Number(filtroLocalTabla))
    : areas;

  const nombreLocal = (id?: string) => locales.find(l => l.codLocal === Number(id))?.nombreLocal;
  const nombreArea = (id?: string) => areas.find(a => a.codArea === Number(id))?.nombreArea;

  const acciones = (tipo: EntityType, entidad: Local | Area | Oficina, id: number, nombre: string, extra?: ReactNode) => (
    <div className="flex items-center justify-end gap-1.5">
      {extra}
      <IconButton variant="edit" icon={<MdEdit size={17} />} title={`Editar ${NIVEL[tipo].nombre.toLowerCase()}`}
        onClick={() => openEditModal(tipo, entidad)} />
      <IconButton variant="delete" icon={<MdDelete size={17} />} title={`Eliminar ${NIVEL[tipo].nombre.toLowerCase()}`}
        onClick={() => handleDelete(tipo, id, nombre)} />
    </div>
  );

  return (
    <div className="space-y-6">
      {nodo}

      <PageHeader
        titulo="Estructura organizacional"
        subtitulo="Locales, áreas y oficinas donde se ubican los activos"
        icono={<MdAccountTree size={15} />}
        acciones={<Boton onClick={() => openNewModal('local')}><MdAdd size={19} /> Nuevo local</Boton>}
      />

      {/* Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Indicador etiqueta="Locales" valor={loading ? '—' : locales.length} icono={<MdBusiness size={22} />} tono="marca"
          detalle="Sedes, almacenes y sucursales" />
        <Indicador etiqueta="Áreas" valor={loading ? '—' : areas.length} icono={<MdLayers size={22} />} tono="acento"
          detalle={locales.length ? `${(areas.length / locales.length).toFixed(1)} por local en promedio` : undefined} />
        <Indicador etiqueta="Oficinas" valor={loading ? '—' : oficinas.length} icono={<MdMeetingRoom size={22} />} tono="neutro"
          detalle="Ubicación final del activo" />
      </div>

      <div className="tabla-marco">
        {/* Barra de herramientas */}
        <div className="tabla-barra">
          <Buscador valor={searchTerm} onCambio={setSearchTerm} placeholder="Buscar local, área u oficina…" className="sm:max-w-sm" />

          <div className="flex flex-wrap items-center gap-2">
            {viewMode === 'tree' && (
              <>
                <Boton pequeno variante="secundario" onClick={expandAll} title="Expandir todo"><MdUnfoldMore size={16} /> Expandir</Boton>
                <Boton pequeno variante="secundario" onClick={collapseAll} title="Contraer todo"><MdUnfoldLess size={16} /> Contraer</Boton>
              </>
            )}
            <div className="segmentado">
              <button type="button" data-activo={viewMode === 'tree'} onClick={() => setViewMode('tree')}>
                <MdAccountTree size={16} /> Jerarquía
              </button>
              <button type="button" data-activo={viewMode === 'table'} onClick={() => setViewMode('table')}>
                <MdViewList size={16} /> Tabla
              </button>
            </div>
          </div>
        </div>

        {/* Selector de entidad y filtros de la vista de tabla */}
        {viewMode === 'table' && (
          <div className="tabla-barra" style={{ backgroundColor: '#fafafa' }}>
            <div className="segmentado" style={{ backgroundColor: '#eef2f6' }}>
              {(['local', 'area', 'oficina'] as EntityType[]).map(tipo => {
                const Icono = NIVEL[tipo].icono;
                return (
                  <button key={tipo} type="button" data-activo={tableEntityType === tipo}
                    onClick={() => {
                      setTableEntityType(tipo);
                      if (tipo === 'local') setFiltroLocalTabla('');
                      setFiltroAreaTabla('');
                    }}>
                    <Icono size={15} /> {NIVEL[tipo].plural}
                  </button>
                );
              })}
            </div>

            {tableEntityType !== 'local' && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-56">
                  <Select
                    value={filtroLocalTabla}
                    onChange={(v) => { setFiltroLocalTabla(v); setFiltroAreaTabla(''); }}
                    placeholder="Todos los locales"
                    size="sm"
                    options={locales.map((loc) => ({ value: loc.codLocal ?? '', label: loc.nombreLocal }))}
                  />
                </div>
                {tableEntityType === 'oficina' && (
                  <div className="w-56">
                    <Select
                      value={filtroAreaTabla}
                      onChange={(v) => setFiltroAreaTabla(v)}
                      placeholder="Todas las áreas"
                      size="sm"
                      options={areasParaTablaOficinas.map((area) => ({ value: area.codArea ?? '', label: area.nombreArea }))}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent" style={{ borderColor: COLORES.brand, borderTopColor: 'transparent' }} />
          </div>
        ) : viewMode === 'tree' ? (
          /* ───────────── VISTA JERÁRQUICA ───────────── */
          arbol.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#f1f5f9', color: '#94a3b8' }}>
                <MdBusiness size={30} />
              </div>
              <p className="font-semibold" style={{ color: COLORES.texto }}>
                {buscando ? 'No se encontraron resultados' : 'Aún no hay locales registrados'}
              </p>
              <p className="text-sm mt-1 mb-5" style={{ color: COLORES.tenue }}>
                {buscando ? 'Pruebe con otro nombre o código' : 'Empiece creando la sede principal de la empresa'}
              </p>
              {!buscando && (
                <div className="inline-flex"><Boton onClick={() => openNewModal('local')}><MdAdd size={19} /> Crear primer local</Boton></div>
              )}
            </div>
          ) : (
            <div>
              {arbol.map(({ local, areas: hijos }) => {
                const localId = local.codLocal!;
                const totalAreas = areasPorLocal.get(localId)?.length ?? 0;
                const abierto = buscando || !!expandedLocales[localId];

                return (
                  <div key={localId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {/* Fila del local */}
                    <div className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#f8fbff]">
                      <Chevron abierto={abierto} onClick={() => toggleLocal(localId)} deshabilitado={totalAreas === 0}
                        titulo={totalAreas ? 'Mostrar u ocultar áreas' : 'Sin áreas'} />
                      <IconoNivel tipo="local" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold truncate" style={{ color: COLORES.texto }}>{local.nombreLocal}</h3>
                          <span className="codigo">{local.codInterno}</span>
                        </div>
                        <p className="text-sm mt-0.5 flex items-center gap-1 truncate" style={{ color: COLORES.suave }}>
                          <MdPlace size={14} className="shrink-0" style={{ color: COLORES.tenue }} />
                          <span className="truncate">{local.direccion || 'Sin dirección'}</span>
                        </p>
                      </div>
                      <div className="hidden md:flex items-center gap-4 mr-2">
                        <Contador valor={totalAreas} singular="área" plural="áreas" />
                        <Contador valor={oficinasDeLocal(localId)} singular="oficina" plural="oficinas" />
                      </div>
                      {acciones('local', local, localId, local.nombreLocal,
                        <Boton pequeno variante="exito" title="Agregar área" onClick={() => openNewModal('area', { localId })}>
                          <MdAdd size={15} /> Área
                        </Boton>
                      )}
                    </div>

                    {/* Áreas del local */}
                    {abierto && hijos.length > 0 && (
                      <div className="pb-2">
                        {hijos.map(({ area, oficinas: ofis }) => {
                          const areaId = area.codArea!;
                          const totalOficinas = oficinasPorArea.get(areaId)?.length ?? 0;
                          const areaAbierta = buscando || !!expandedAreas[areaId];

                          return (
                            <div key={areaId} className="ml-[3.25rem] mr-4" style={{ borderLeft: '2px solid #e2e8f0' }}>
                              <div className="flex items-center gap-3 pl-3 pr-0 py-2.5 rounded-r-xl transition-colors hover:bg-[#f8fbff]">
                                <Chevron abierto={areaAbierta} onClick={() => toggleArea(areaId)} deshabilitado={totalOficinas === 0}
                                  titulo={totalOficinas ? 'Mostrar u ocultar oficinas' : 'Sin oficinas'} />
                                <IconoNivel tipo="area" size="sm" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-semibold text-sm truncate" style={{ color: COLORES.texto }}>{area.nombreArea}</h4>
                                    {area.codInterno && <span className="codigo">{area.codInterno}</span>}
                                  </div>
                                  {area.observacion && (
                                    <p className="text-xs mt-0.5 truncate" style={{ color: COLORES.tenue }}>{area.observacion}</p>
                                  )}
                                </div>
                                <div className="hidden md:block mr-2">
                                  <Contador valor={totalOficinas} singular="oficina" plural="oficinas" />
                                </div>
                                {acciones('area', area, areaId, area.nombreArea,
                                  <Boton pequeno variante="secundario" title="Agregar oficina"
                                    onClick={() => openNewModal('oficina', { localId, areaId })}>
                                    <MdAdd size={15} /> Oficina
                                  </Boton>
                                )}
                              </div>

                              {/* Oficinas del área */}
                              {areaAbierta && ofis.length > 0 && (
                                <div className="ml-[2.6rem] mb-1.5" style={{ borderLeft: '2px solid #f1f5f9' }}>
                                  {ofis.map(oficina => (
                                    <div key={oficina.codOficina}
                                      className="group/ofi flex items-center gap-3 pl-3 py-2 rounded-r-xl transition-colors hover:bg-[#f8fbff]">
                                      <MdMeetingRoom size={16} className="shrink-0" style={{ color: COLORES.tenue }} />
                                      <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                        <span className="text-sm font-medium" style={{ color: COLORES.texto }}>{oficina.nombreOficina}</span>
                                        {oficina.codInterno && <span className="codigo">{oficina.codInterno}</span>}
                                        {oficina.observacion && (
                                          <span className="text-xs" style={{ color: COLORES.tenue }}>· {oficina.observacion}</span>
                                        )}
                                      </div>
                                      <div className="opacity-0 group-hover/ofi:opacity-100 focus-within:opacity-100 transition-opacity">
                                        {acciones('oficina', oficina, oficina.codOficina!, oficina.nombreOficina)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* ───────────── VISTA DE TABLA ───────────── */
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  {tableEntityType === 'local' && (
                    <>
                      <th>Local</th>
                      <th>Dirección</th>
                      <th>Código</th>
                      <th className="col-centro">Áreas</th>
                      <th className="col-centro">Oficinas</th>
                      <th className="col-acciones">Acciones</th>
                    </>
                  )}
                  {tableEntityType === 'area' && (
                    <>
                      <th>Área</th>
                      <th>Local</th>
                      <th>Código</th>
                      <th>Observación</th>
                      <th className="col-centro">Oficinas</th>
                      <th className="col-acciones">Acciones</th>
                    </>
                  )}
                  {tableEntityType === 'oficina' && (
                    <>
                      <th>Oficina</th>
                      <th>Área</th>
                      <th>Local</th>
                      <th>Código</th>
                      <th>Observación</th>
                      <th className="col-acciones">Acciones</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {totalTabla === 0 ? (
                  <TablaVacia
                    columnas={6}
                    icono={(() => { const Icono = NIVEL[tableEntityType].icono; return <Icono size={40} />; })()}
                    texto={buscando || filtroLocalTabla || filtroAreaTabla
                      ? 'No hay resultados con los filtros aplicados'
                      : `No hay ${NIVEL[tableEntityType].plural.toLowerCase()} registrados`}
                  />
                ) : tableEntityType === 'local' ? (
                  tablaLocales.map((local) => (
                    <tr key={local.codLocal}>
                      <td>
                        <div className="flex items-center gap-3">
                          <IconoNivel tipo="local" size="sm" />
                          <span className="font-semibold">{local.nombreLocal}</span>
                        </div>
                      </td>
                      <td className="col-tenue">{local.direccion}</td>
                      <td><span className="codigo">{local.codInterno}</span></td>
                      <td className="col-centro font-semibold">{areasPorLocal.get(local.codLocal!)?.length ?? 0}</td>
                      <td className="col-centro font-semibold">{oficinasDeLocal(local.codLocal!)}</td>
                      <td className="col-acciones">{acciones('local', local, local.codLocal!, local.nombreLocal)}</td>
                    </tr>
                  ))
                ) : tableEntityType === 'area' ? (
                  tablaAreas.map((area) => (
                    <tr key={area.codArea}>
                      <td>
                        <div className="flex items-center gap-3">
                          <IconoNivel tipo="area" size="sm" />
                          <span className="font-semibold">{area.nombreArea}</span>
                        </div>
                      </td>
                      <td className="col-tenue">{(area.local as Local)?.nombreLocal || 'Sin local'}</td>
                      <td><span className="codigo">{area.codInterno || '—'}</span></td>
                      <td className="col-tenue">{area.observacion || '—'}</td>
                      <td className="col-centro font-semibold">{oficinasPorArea.get(area.codArea!)?.length ?? 0}</td>
                      <td className="col-acciones">{acciones('area', area, area.codArea!, area.nombreArea)}</td>
                    </tr>
                  ))
                ) : (
                  tablaOficinas.map((oficina) => {
                    const areaRelacionada = areas.find(a => a.codArea === codAreaDe(oficina));
                    const localRelacionado = areaRelacionada ? locales.find(l => l.codLocal === codLocalDe(areaRelacionada)) : null;
                    return (
                      <tr key={oficina.codOficina}>
                        <td>
                          <div className="flex items-center gap-3">
                            <IconoNivel tipo="oficina" size="sm" />
                            <span className="font-semibold">{oficina.nombreOficina}</span>
                          </div>
                        </td>
                        <td className="col-tenue">{(oficina.area as Area)?.nombreArea || 'Sin área'}</td>
                        <td className="col-tenue">{localRelacionado?.nombreLocal || 'Sin local'}</td>
                        <td><span className="codigo">{oficina.codInterno || '—'}</span></td>
                        <td className="col-tenue">{oficina.observacion || '—'}</td>
                        <td className="col-acciones">{acciones('oficina', oficina, oficina.codOficina!, oficina.nombreOficina)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && viewMode === 'table' && totalTabla > 0 && (
          <div className="tabla-pie">
            <span>
              {totalTabla === totalEntidad
                ? `${totalEntidad} ${totalEntidad === 1 ? NIVEL[tableEntityType].nombre.toLowerCase() : NIVEL[tableEntityType].plural.toLowerCase()}`
                : `${totalTabla} de ${totalEntidad} ${NIVEL[tableEntityType].plural.toLowerCase()}`}
            </span>
          </div>
        )}
      </div>

      {/* Modal de alta / edición */}
      <ModalBase
        abierto={showModal}
        onCerrar={closeModal}
        ancho="max-w-lg"
        titulo={getModalTitle()}
        subtitulo={
          modalType === 'local' ? 'Sede, almacén o sucursal de la empresa'
            : modalType === 'area' ? 'División dentro de un local'
            : 'Ambiente dentro de un área, donde se ubican los activos'
        }
        pie={<>
          <Boton variante="secundario" onClick={closeModal} disabled={guardando}>Cancelar</Boton>
          <Boton onClick={() => handleSubmit()} disabled={guardando}>
            {guardando ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Registrar'}
          </Boton>
        </>}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ubicación dentro de la jerarquía */}
          {modalType !== 'local' && formData.codLocal && (
            <div className="flex flex-wrap items-center gap-1.5 text-sm rounded-xl px-3 py-2.5"
              style={{ backgroundColor: '#f8fafc', border: `1px solid ${COLORES.borde}`, color: COLORES.suave }}>
              <MdBusiness size={16} style={{ color: NIVEL.local.color }} />
              <span className="font-medium" style={{ color: COLORES.texto }}>{nombreLocal(formData.codLocal)}</span>
              {modalType === 'oficina' && formData.codArea && (
                <>
                  <MdChevronRight size={16} style={{ color: COLORES.tenue }} />
                  <MdLayers size={16} style={{ color: NIVEL.area.color }} />
                  <span className="font-medium" style={{ color: COLORES.texto }}>{nombreArea(formData.codArea)}</span>
                </>
              )}
            </div>
          )}

          {modalType !== 'local' && (
            <Select
              label="Local"
              required
              value={formData.codLocal}
              onChange={(v) => setFormData({ ...formData, codLocal: v, codArea: '' })}
              disabled={!!parentContext.localId || isEditing}
              placeholder="Seleccione un local"
              options={locales.map((loc) => ({ value: loc.codLocal ?? '', label: `${loc.nombreLocal} (${loc.codInterno})` }))}
            />
          )}

          {modalType === 'oficina' && (
            <Select
              label="Área"
              required
              value={formData.codArea}
              onChange={(v) => setFormData({ ...formData, codArea: v })}
              disabled={!formData.codLocal || !!parentContext.areaId || isEditing}
              placeholder={formData.codLocal ? 'Seleccione un área' : 'Primero seleccione un local'}
              options={areasFiltradas_Form.map((area) => ({ value: area.codArea ?? '', label: `${area.nombreArea} (${area.codInterno})` }))}
            />
          )}

          {isEditing && modalType !== 'local' && (
            <p className="text-xs -mt-2" style={{ color: COLORES.tenue }}>
              La ubicación dentro de la estructura no se puede cambiar al editar.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              containerClassName="sm:col-span-2"
              label="Nombre"
              required
              autoFocus
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder={modalType === 'local' ? 'Ej: Sede Central' : modalType === 'area' ? 'Ej: Recursos Humanos' : 'Ej: Oficina 101'}
            />
            <Input
              label="Código"
              required
              value={formData.codInterno}
              onChange={(e) => setFormData({ ...formData, codInterno: e.target.value })}
              placeholder={modalType === 'local' ? 'LOC-001' : modalType === 'area' ? 'ARE-001' : 'OFI-001'}
              className="font-mono"
            />
          </div>

          {modalType === 'local' && (
            <Input
              label="Dirección"
              required
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Ej: Av. Principal 123, Lima"
            />
          )}

          {modalType !== 'local' && (
            <Campo etiqueta="Observación">
              <textarea
                value={formData.observacion}
                onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                placeholder="Descripción adicional (opcional)"
                rows={3}
                className={`${inputCls} resize-none`}
                style={inputStyle}
              />
            </Campo>
          )}

          {/* Enter en un campo envía el formulario */}
          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>
      </ModalBase>
    </div>
  );
}
