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
  MdAdd, MdEdit, MdDelete, MdQrCode, MdBusiness, 
  MdLocationOn, MdPerson, MdCheckCircle, MdInventory, MdFilterList, MdClose, MdSave,
  MdSearch, MdClear, MdLayers, MdMeetingRoom, MdInsertDriveFile, MdInfo, MdVisibility,
  MdVisibilityOff, MdDescription, MdBuild, MdDateRange, MdPalette
} from 'react-icons/md';

// Interface para DetalleCarga
interface DetalleCarga {
  idDetalle?: number;
  carga?: Carga;
  activo?: Activo;
  codActivo?: string;
}

// Extender Activo para incluir detalleCarga
interface ActivoConCarga extends Activo {
  detalleCarga?: DetalleCarga;
}

export default function ActivosPage() {
  // --- ESTADOS ---
  const [activos, setActivos] = useState<ActivoConCarga[]>([]);
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedActivo, setSelectedActivo] = useState<ActivoConCarga | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCarga, setFiltroCarga] = useState('');
  const [filtroLocal, setFiltroLocal] = useState('');
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroOficina, setFiltroOficina] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroResponsable, setFiltroResponsable] = useState('');

  // Formulario
  const initialFormState = {
    codActivo: '',
    codInterno: '',
    descripcion: '',
    marca: '',
    modelo: '',
    serie: '',
    color: '',
    anio: '',
    fechaCompra: '',
    codCarga: '',
    codLocal: '',
    codArea: '',
    codOficina: '',
    codResponsable: '',
    codEstado: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  // Efecto para filtrar por carga
  useEffect(() => {
    if (filtroCarga && cargas.length > 0) {
      cargarActivosPorCarga(Number(filtroCarga));
    }
  }, [filtroCarga]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [activosData, cargasData, locData, areaData, ofiData, respData, estData] = await Promise.all([
        activoService.listarTodos(),
        cargaService.listarTodas(),
        localService.listarActivos(),
        areaService.listarActivos(),
        oficinaService.listarActivos(),
        responsableService.listarActivos(),
        estadoService.listarTodos()
      ]);
      
      setActivos(activosData);
      setCargas(cargasData.sort((a, b) => (b.codCarga || 0) - (a.codCarga || 0)));
      setLocales(locData);
      setAreas(areaData);
      setOficinas(ofiData);
      setResponsables(respData);
      setEstados(estData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarActivosPorCarga = async (codCarga: number) => {
    try {
      setLoading(true);
      const activosData = await activoService.listarPorCarga(codCarga);
      setActivos(activosData);
    } catch (error) {
      console.error('Error cargando activos por carga:', error);
      setActivos([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener información de carga del activo
  const getCargaInfo = (activo: ActivoConCarga): Carga | undefined => {
    return activo.detalleCarga?.carga;
  };

  // --- LÓGICA DE FILTRADO (excepto carga que se maneja server-side) ---
  const activosFiltrados = useMemo(() => {
    let filtered = activos;

    // Filtro por Local
    if (filtroLocal) {
      filtered = filtered.filter(item => {
        const idLocal = (item.local as Local)?.codLocal;
        return idLocal === Number(filtroLocal);
      });
    }

    // Filtro por Área
    if (filtroArea) {
      filtered = filtered.filter(item => {
        const idArea = (item.area as Area)?.codArea;
        return idArea === Number(filtroArea);
      });
    }

    // Filtro por Oficina
    if (filtroOficina) {
      filtered = filtered.filter(item => {
        const idOficina = (item.oficina as Oficina)?.codOficina;
        return idOficina === Number(filtroOficina);
      });
    }

    // Filtro por Estado
    if (filtroEstado) {
      filtered = filtered.filter(item => {
        const idEstado = (item.estado as Estado)?.codEstado;
        return idEstado === Number(filtroEstado);
      });
    }

    // Filtro por Responsable
    if (filtroResponsable) {
      filtered = filtered.filter(item => {
        const idResp = (item.responsable as Responsable)?.codResponsable;
        return idResp === Number(filtroResponsable);
      });
    }

    // Filtro por búsqueda de texto
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.codActivo.toLowerCase().includes(term) ||
        item.descripcion.toLowerCase().includes(term) ||
        (item.marca || '').toLowerCase().includes(term) ||
        (item.modelo || '').toLowerCase().includes(term) ||
        (item.serie || '').toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [activos, filtroLocal, filtroArea, filtroOficina, filtroEstado, filtroResponsable, searchTerm]);

  // --- FILTROS EN CASCADA ---
  const areasDisponibles = filtroLocal
    ? areas.filter(a => (a.local as Local)?.codLocal === Number(filtroLocal))
    : areas;

  const oficinasDisponibles = filtroArea
    ? oficinas.filter(o => (o.area as Area)?.codArea === Number(filtroArea))
    : filtroLocal
    ? oficinas.filter(o => {
        const area = areas.find(a => a.codArea === (o.area as Area)?.codArea);
        return (area?.local as Local)?.codLocal === Number(filtroLocal);
      })
    : oficinas;

  // Para el formulario
  const areasParaForm = formData.codLocal 
    ? areas.filter(a => (a.local as Local)?.codLocal === Number(formData.codLocal)) 
    : [];
  
  const oficinasParaForm = formData.codArea 
    ? oficinas.filter(o => (o.area as Area)?.codArea === Number(formData.codArea)) 
    : [];

  // --- HANDLERS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codLocal || !formData.codArea || !formData.codOficina || !formData.codResponsable || !formData.codEstado || !formData.codCarga) {
      alert('Complete los campos obligatorios (*).');
      return;
    }

    const payload = {
      codActivo: formData.codActivo,
      codInterno: formData.codInterno,
      descripcion: formData.descripcion,
      marca: formData.marca,
      modelo: formData.modelo,
      serie: formData.serie,
      color: formData.color,
      anio: formData.anio,
      fechaCompra: formData.fechaCompra,
      codCarga: Number(formData.codCarga),
      local: { codLocal: Number(formData.codLocal) },
      area: { codArea: Number(formData.codArea) },
      oficina: { codOficina: Number(formData.codOficina) },
      responsable: { codResponsable: Number(formData.codResponsable) },
      estado: { codEstado: Number(formData.codEstado) }
    } as unknown as Activo;

    try {
      if (editingId) await activoService.actualizar(editingId, payload);
      else await activoService.crear(payload);
      
      closeModal();
      const data = await activoService.listarTodos();
      setActivos(data);
    } catch (error) {
      console.error(error);
      alert('Error al guardar.');
    }
  };

  const handleViewDetails = (activo: ActivoConCarga) => {
    setSelectedActivo(activo);
    setShowDetailModal(true);
  };

  const handleEdit = (activo: Activo) => {
    setEditingId(activo.id || null);
    setFormData({
      codActivo: activo.codActivo,
      codInterno: activo.codInterno || '',
      descripcion: activo.descripcion,
      marca: activo.marca || '',
      modelo: activo.modelo || '',
      serie: activo.serie || '',
      color: activo.color || '',
      anio: activo.anio || '',
      fechaCompra: activo.fechaCompra || '',
      codCarga: (activo as ActivoConCarga).detalleCarga?.carga?.codCarga?.toString() || '',
      codLocal: (activo.local as Local)?.codLocal?.toString() || '',
      codArea: (activo.area as Area)?.codArea?.toString() || '',
      codOficina: (activo.oficina as Oficina)?.codOficina?.toString() || '',
      codResponsable: (activo.responsable as Responsable)?.codResponsable?.toString() || '',
      codEstado: (activo.estado as Estado)?.codEstado?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar activo?')) {
      try {
        await activoService.eliminar(id);
        const data = await activoService.listarTodos();
        setActivos(data);
      } catch (error) { 
        console.error(error); 
      }
    }
  };

  const openNewModal = () => { 
    setEditingId(null); 
    setFormData(initialFormState); 
    setShowModal(true); 
  };
  
  const closeModal = () => { 
    setShowModal(false); 
    setFormData(initialFormState); 
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedActivo(null);
  };

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFiltroCarga('');
    setFiltroLocal('');
    setFiltroArea('');
    setFiltroOficina('');
    setFiltroEstado('');
    setFiltroResponsable('');
    // Recargar todos los activos
    cargarDatosIniciales();
  };

  const hayFiltrosActivos = searchTerm || filtroCarga || filtroLocal || filtroArea || filtroOficina || filtroEstado || filtroResponsable;

  // Función para renderizar ubicación
  const renderUbicacion = (activo: ActivoConCarga) => {
    const local = activo.local as Local;
    const area = activo.area as Area;
    const oficina = activo.oficina as Oficina;
    
    if (!local?.nombreLocal && !area?.nombreArea && !oficina?.nombreOficina) {
      return (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <MdLocationOn size={16} />
          <span>Sin ubicación</span>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {local?.nombreLocal && (
          <div className="flex items-center gap-2 text-sm">
            <MdBusiness className="text-blue-600" size={14} />
            <span className="text-gray-700">{local.nombreLocal}</span>
          </div>
        )}
        {area?.nombreArea && (
          <div className="flex items-center gap-2 text-xs">
            <MdLayers className="text-purple-600" size={12} />
            <span className="text-gray-600">{area.nombreArea}</span>
          </div>
        )}
        {oficina?.nombreOficina && (
          <div className="flex items-center gap-2 text-xs">
            <MdMeetingRoom className="text-green-600" size={12} />
            <span className="text-gray-600">{oficina.nombreOficina}</span>
          </div>
        )}
      </div>
    );
  };

  // Función para renderizar estado
  const renderEstado = (activo: ActivoConCarga) => {
    const estado = activo.estado as Estado;
    
    if (!estado?.nombreEstado) {
      return (
        <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
          Sin estado
        </span>
      );
    }

    // Definir colores según el estado
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-700';
    let borderColor = 'border-gray-200';

    if (estado.nombreEstado.toLowerCase().includes('bueno') || estado.nombreEstado.toLowerCase().includes('excelente')) {
      bgColor = 'bg-green-100';
      textColor = 'text-green-700';
      borderColor = 'border-green-200';
    } else if (estado.nombreEstado.toLowerCase().includes('regular') || estado.nombreEstado.toLowerCase().includes('medio')) {
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-700';
      borderColor = 'border-yellow-200';
    } else if (estado.nombreEstado.toLowerCase().includes('malo') || estado.nombreEstado.toLowerCase().includes('dañado')) {
      bgColor = 'bg-red-100';
      textColor = 'text-red-700';
      borderColor = 'border-red-200';
    }

    return (
      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${bgColor} ${textColor} border ${borderColor}`}>
        {estado.nombreEstado}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Activos Fijos</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <MdInventory className="text-gray-400" size={18}/>
            Inventario general de bienes por carga
          </p>
        </div>
        <button 
          onClick={openNewModal} 
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-lg font-medium"
        >
          <MdAdd size={22} />
          <span>Nuevo Activo</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
              <MdInventory size={28}/>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Activos</p>
              <p className="text-3xl font-bold text-gray-900">{activos.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <MdCheckCircle size={28}/>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Asignados</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">
                  {activos.filter(a => a.responsable).length}
                </p>
                <p className="text-sm text-gray-400">/ {activos.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <MdInsertDriveFile size={28}/>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Cargas Activas</p>
              <p className="text-3xl font-bold text-gray-900">{cargas.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-700">
            <MdFilterList size={20} className="text-gray-500" />
            <span className="font-semibold">Filtros de Búsqueda</span>
          </div>
          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
            >
              <MdClear size={16} />
              Limpiar Filtros
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Filtro por Carga - PRINCIPAL */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">
              <div className="flex items-center gap-1.5">
                <MdInsertDriveFile size={14} className="text-indigo-600" />
                Carga de Inventario
              </div>
            </label>
            <select
              value={filtroCarga}
              onChange={(e) => {
                const value = e.target.value;
                setFiltroCarga(value);
                if (!value) {
                  // Si se limpia el filtro, recargar todos los activos
                  cargarDatosIniciales();
                }
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
            >
              <option value="">Todas las Cargas</option>
              {cargas.map(c => (
                <option key={c.codCarga} value={c.codCarga}>
                  #{c.codCarga} - {c.descripcion} ({c.fecha})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Estado */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">
              <div className="flex items-center gap-1.5">
                <MdInfo size={14} className="text-gray-600" />
                Estado
              </div>
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none bg-white text-sm"
            >
              <option value="">Todos</option>
              {estados.map(e => (
                <option key={e.codEstado} value={e.codEstado}>
                  {e.nombreEstado}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Responsable */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">
              <div className="flex items-center gap-1.5">
                <MdPerson size={14} className="text-orange-600" />
                Custodio
              </div>
            </label>
            <select
              value={filtroResponsable}
              onChange={(e) => setFiltroResponsable(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-sm"
            >
              <option value="">Todos</option>
              {responsables.map(r => (
                <option key={r.codResponsable} value={r.codResponsable}>
                  {r.nombreResponsable}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Segunda fila de filtros: Ubicación */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Filtro por Local */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">
              <div className="flex items-center gap-1.5">
                <MdBusiness size={14} className="text-blue-600" />
                Local
              </div>
            </label>
            <select
              value={filtroLocal}
              onChange={(e) => {
                setFiltroLocal(e.target.value);
                setFiltroArea('');
                setFiltroOficina('');
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
            >
              <option value="">Todos</option>
              {locales.map(l => (
                <option key={l.codLocal} value={l.codLocal}>
                  {l.nombreLocal}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Área */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">
              <div className="flex items-center gap-1.5">
                <MdLayers size={14} className="text-purple-600" />
                Área
              </div>
            </label>
            <select
              value={filtroArea}
              onChange={(e) => {
                setFiltroArea(e.target.value);
                setFiltroOficina('');
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-sm"
            >
              <option value="">Todas</option>
              {areasDisponibles.map(a => (
                <option key={a.codArea} value={a.codArea}>
                  {a.nombreArea}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Oficina */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">
              <div className="flex items-center gap-1.5">
                <MdMeetingRoom size={14} className="text-green-600" />
                Oficina
              </div>
            </label>
            <select
              value={filtroOficina}
              onChange={(e) => setFiltroOficina(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white text-sm"
            >
              <option value="">Todas</option>
              {oficinasDisponibles.map(o => (
                <option key={o.codOficina} value={o.codOficina}>
                  {o.nombreOficina}
                </option>
              ))}
            </select>
          </div>

          {/* Búsqueda de Texto */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">
              <div className="flex items-center gap-1.5">
                <MdSearch size={14} className="text-indigo-600" />
                Búsqueda
              </div>
            </label>
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Código, descripción..."
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <MdClear size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Resumen de Filtros */}
        {hayFiltrosActivos && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-gray-600 font-medium">Mostrando:</span>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-semibold">
              {activosFiltrados.length} de {activos.length} activos
            </span>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : activosFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <MdInventory className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {hayFiltrosActivos ? 'No se encontraron activos' : 'No hay activos registrados'}
            </h3>
            <p className="text-gray-500 mb-6">
              {hayFiltrosActivos 
                ? 'Intenta ajustar los filtros'
                : 'Comienza registrando tu primer activo'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">#</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Bien</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Detalles</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Carga</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Custodio</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Ubicación</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Estado</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activosFiltrados.map((item, index) => {
                  const cargaInfo = getCargaInfo(item);
                  
                  return (
                    <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                      {/* # */}
                      <td className="px-6 py-4 text-center font-mono text-xs text-gray-400 font-bold">
                        {index + 1}
                      </td>

                      {/* Bien */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{item.descripcion}</span>
                          <span className="font-mono text-xs text-gray-500 bg-gray-100 w-fit px-2 py-0.5 rounded mt-1">
                            {item.codActivo}
                          </span>
                        </div>
                      </td>

                      {/* Detalles */}
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-gray-800">{item.marca}</span>
                          <span className="text-xs text-gray-500">{item.modelo}</span>
                          {item.serie && (
                            <span className="text-[10px] text-gray-400 font-mono">SN: {item.serie}</span>
                          )}
                        </div>
                      </td>

                      {/* Carga */}
                      <td className="px-6 py-4">
                        {cargaInfo ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                              #{cargaInfo.codCarga}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {cargaInfo.descripcion}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Sin carga</span>
                        )}
                      </td>

                      {/* Custodio */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-orange-50 text-orange-600 rounded-full">
                            <MdPerson size={14}/>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {(item.responsable as Responsable)?.nombreResponsable || 'No Asignado'}
                          </span>
                        </div>
                      </td>

                      {/* Ubicación - MODIFICADO */}
                      <td className="px-6 py-4">
                        {renderUbicacion(item)}
                      </td>

                      {/* Estado - MODIFICADO */}
                      <td className="px-6 py-4">
                        {renderEstado(item)}
                      </td>

                      {/* Acciones - MODIFICADO (cambio de ícono) */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleViewDetails(item)} 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Ver detalles"
                          >
                            <MdVisibility size={20} />
                          </button>
                          <button 
                            onClick={() => item.id && handleDelete(item.id)} 
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar"
                          >
                            <MdDelete size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Creación/Edición */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 rounded-t-xl flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-bold text-xl text-white">
                  {editingId ? 'Editar Activo' : 'Nuevo Activo'}
                </h3>
                <p className="text-sm text-indigo-100">Complete la ficha técnica del bien</p>
              </div>
              <button onClick={closeModal} className="text-white text-2xl">&times;</button>
            </div>
            
            {/* Form */}
            <form id="form-activo" onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Selector de Carga - DESTACADO */}
              <div className="bg-indigo-50 p-5 rounded-lg border-2 border-indigo-200">
                <label className="block text-sm font-bold text-indigo-900 mb-2">
                  <div className="flex items-center gap-2">
                    <MdInsertDriveFile size={18} />
                    Carga de Inventario <span className="text-red-500">*</span>
                  </div>
                </label>
                <select
                  value={formData.codCarga}
                  onChange={(e) => setFormData({...formData, codCarga: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                >
                  <option value="">-- Seleccionar Carga --</option>
                  {cargas.map(c => (
                    <option key={c.codCarga} value={c.codCarga}>
                      #{c.codCarga} - {c.descripcion} ({c.fecha})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* COLUMNA 1: Datos Técnicos */}
                <div className="space-y-5">
                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-800 mb-4">Identificación</h4>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Código <span className="text-red-500">*</span></label>
                          <input 
                            type="text" 
                            required 
                            value={formData.codActivo} 
                            onChange={(e) => setFormData({...formData, codActivo: e.target.value})} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm" 
                            placeholder="ACT-001"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Cód. Interno</label>
                          <input 
                            type="text" 
                            value={formData.codInterno} 
                            onChange={(e) => setFormData({...formData, codInterno: e.target.value})} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          required 
                          value={formData.descripcion} 
                          onChange={(e) => setFormData({...formData, descripcion: e.target.value})} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                          placeholder="Laptop HP ProBook"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-800 mb-4">Detalles Técnicos</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Marca</label>
                        <input 
                          type="text" 
                          value={formData.marca} 
                          onChange={(e) => setFormData({...formData, marca: e.target.value})} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Modelo</label>
                        <input 
                          type="text" 
                          value={formData.modelo} 
                          onChange={(e) => setFormData({...formData, modelo: e.target.value})} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Serie</label>
                        <input 
                          type="text" 
                          value={formData.serie} 
                          onChange={(e) => setFormData({...formData, serie: e.target.value})} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Color</label>
                        <input 
                          type="text" 
                          value={formData.color} 
                          onChange={(e) => setFormData({...formData, color: e.target.value})} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Año</label>
                        <input 
                          type="text" 
                          value={formData.anio} 
                          onChange={(e) => setFormData({...formData, anio: e.target.value})} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">F. Compra</label>
                        <input 
                          type="date" 
                          value={formData.fechaCompra} 
                          onChange={(e) => setFormData({...formData, fechaCompra: e.target.value})} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMNA 2: Ubicación y Asignación */}
                <div className="space-y-5">
                  <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-bold text-blue-900 mb-4">Ubicación Física</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          <div className="flex items-center gap-1.5">
                            <MdBusiness size={14} />
                            Local <span className="text-red-500">*</span>
                          </div>
                        </label>
                        <select 
                          value={formData.codLocal} 
                          onChange={(e) => setFormData({...formData, codLocal: e.target.value, codArea: '', codOficina: ''})} 
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">-- Seleccionar --</option>
                          {locales.map(l => (
                            <option key={l.codLocal} value={l.codLocal}>{l.nombreLocal}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          <div className="flex items-center gap-1.5">
                            <MdLayers size={14} />
                            Área <span className="text-red-500">*</span>
                          </div>
                        </label>
                        <select 
                          value={formData.codArea} 
                          onChange={(e) => setFormData({...formData, codArea: e.target.value, codOficina: ''})} 
                          disabled={!formData.codLocal}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm disabled:bg-gray-100"
                        >
                          <option value="">
                            {formData.codLocal ? '-- Seleccionar --' : '-- Primero Local --'}
                          </option>
                          {areasParaForm.map(a => (
                            <option key={a.codArea} value={a.codArea}>{a.nombreArea}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          <div className="flex items-center gap-1.5">
                            <MdMeetingRoom size={14} />
                            Oficina <span className="text-red-500">*</span>
                          </div>
                        </label>
                        <select 
                          value={formData.codOficina} 
                          onChange={(e) => setFormData({...formData, codOficina: e.target.value})} 
                          disabled={!formData.codArea}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
                        >
                          <option value="">
                            {formData.codArea ? '-- Seleccionar --' : '-- Primero Área --'}
                          </option>
                          {oficinasParaForm.map(o => (
                            <option key={o.codOficina} value={o.codOficina}>{o.nombreOficina}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-5 rounded-lg border border-orange-200">
                    <h4 className="text-sm font-bold text-orange-900 mb-4">Asignación</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          <div className="flex items-center gap-1.5">
                            <MdPerson size={14} />
                            Custodio <span className="text-red-500">*</span>
                          </div>
                        </label>
                        <select 
                          value={formData.codResponsable} 
                          onChange={(e) => setFormData({...formData, codResponsable: e.target.value})} 
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        >
                          <option value="">-- Seleccionar --</option>
                          {responsables.map(r => (
                            <option key={r.codResponsable} value={r.codResponsable}>
                              {r.nombreResponsable}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Estado <span className="text-red-500">*</span>
                        </label>
                        <select 
                          value={formData.codEstado} 
                          onChange={(e) => setFormData({...formData, codEstado: e.target.value})} 
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        >
                          <option value="">-- Seleccionar --</option>
                          {estados.map(e => (
                            <option key={e.codEstado} value={e.codEstado}>
                              {e.nombreEstado}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 flex-shrink-0 rounded-b-xl">
              <button 
                type="button"
                onClick={closeModal} 
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="form-activo" 
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-medium shadow-md flex items-center gap-2"
              >
                <MdSave size={20}/>
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ver Detalles - NUEVO */}
      {showDetailModal && selectedActivo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-xl flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-bold text-xl text-white">Detalles del Activo</h3>
                <p className="text-sm text-blue-100">Información completa del bien</p>
              </div>
              <button onClick={closeDetailModal} className="text-white text-2xl">&times;</button>
            </div>
            
            {/* Contenido */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Información de Carga (solo lectura) */}
              {selectedActivo.detalleCarga?.carga && (
                <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <MdInsertDriveFile className="text-blue-600" size={24} />
                    <h4 className="text-lg font-bold text-gray-800">Carga de Inventario</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Número de Carga</p>
                      <p className="text-lg font-bold text-blue-700">#{selectedActivo.detalleCarga.carga.codCarga}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Descripción</p>
                      <p className="text-gray-800">{selectedActivo.detalleCarga.carga.descripcion}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Fecha</p>
                      <p className="text-gray-800">{selectedActivo.detalleCarga.carga.fecha}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* COLUMNA 1: Identificación y Detalles */}
                <div className="space-y-5">
                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <MdDescription className="text-indigo-600" size={24} />
                      <h4 className="text-lg font-bold text-gray-800">Identificación</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1">Código</p>
                          <p className="font-mono font-bold text-gray-900 bg-gray-100 p-2 rounded">
                            {selectedActivo.codActivo}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1">Código Interno</p>
                          <p className="font-mono text-gray-800 bg-gray-50 p-2 rounded">
                            {selectedActivo.codInterno || 'No especificado'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Descripción</p>
                        <p className="text-lg font-bold text-gray-900 p-2 bg-gray-50 rounded">
                          {selectedActivo.descripcion}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <MdBuild className="text-gray-600" size={24} />
                      <h4 className="text-lg font-bold text-gray-800">Detalles Técnicos</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Marca</p>
                        <p className="text-gray-800 p-2 bg-white rounded border">
                          {selectedActivo.marca || 'No especificado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Modelo</p>
                        <p className="text-gray-800 p-2 bg-white rounded border">
                          {selectedActivo.modelo || 'No especificado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Número de Serie</p>
                        <p className="font-mono text-gray-800 p-2 bg-white rounded border">
                          {selectedActivo.serie || 'No especificado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Color</p>
                        <div className="flex items-center gap-2">
                          {selectedActivo.color ? (
                            <>
                              <MdPalette className="text-gray-500" size={16} />
                              <span className="text-gray-800 p-2 bg-white rounded border flex-1">
                                {selectedActivo.color}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-500 p-2 bg-white rounded border flex-1">No especificado</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Año</p>
                        <p className="text-gray-800 p-2 bg-white rounded border">
                          {selectedActivo.anio || 'No especificado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Fecha de Compra</p>
                        <div className="flex items-center gap-2">
                          {selectedActivo.fechaCompra ? (
                            <>
                              <MdDateRange className="text-gray-500" size={16} />
                              <span className="text-gray-800 p-2 bg-white rounded border flex-1">
                                {selectedActivo.fechaCompra}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-500 p-2 bg-white rounded border flex-1">No especificada</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMNA 2: Ubicación y Asignación */}
                <div className="space-y-5">
                  <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                      <MdLocationOn className="text-blue-600" size={24} />
                      <h4 className="text-lg font-bold text-gray-800">Ubicación Física</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Local</p>
                        <div className="flex items-center gap-2 p-2 bg-white rounded border">
                          <MdBusiness className="text-blue-600" size={18} />
                          <span className="text-gray-800">
                            {(selectedActivo.local as Local)?.nombreLocal || 'Sin asignar'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Área</p>
                        <div className="flex items-center gap-2 p-2 bg-white rounded border">
                          <MdLayers className="text-purple-600" size={18} />
                          <span className="text-gray-800">
                            {(selectedActivo.area as Area)?.nombreArea || 'Sin asignar'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Oficina</p>
                        <div className="flex items-center gap-2 p-2 bg-white rounded border">
                          <MdMeetingRoom className="text-green-600" size={18} />
                          <span className="text-gray-800">
                            {(selectedActivo.oficina as Oficina)?.nombreOficina || 'Sin asignar'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-5 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-3 mb-4">
                      <MdPerson className="text-orange-600" size={24} />
                      <h4 className="text-lg font-bold text-gray-800">Asignación</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Custodio</p>
                        <div className="flex items-center gap-2 p-2 bg-white rounded border">
                          <MdPerson className="text-orange-600" size={18} />
                          <span className="text-gray-800">
                            {(selectedActivo.responsable as Responsable)?.nombreResponsable || 'Sin asignar'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Estado</p>
                        <div className="p-2">
                          {renderEstado(selectedActivo)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 flex-shrink-0 rounded-b-xl">
              <button 
                type="button"
                onClick={closeDetailModal} 
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-md"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}