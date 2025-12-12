'use client';

import { useEffect, useState } from 'react';
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
  MdExpandMore,
  MdChevronRight,
  MdSearch,
  MdClear,
  MdViewList,
  MdAccountTree,
  MdFilterList
} from 'react-icons/md';

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

export default function ConfigOrganizacionalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

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
  
  const [formData, setFormData] = useState<FormState>({
    nombre: '',
    codInterno: '',
    observacion: '',
    direccion: '',
    codLocal: '',
    codArea: ''
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    cargarTodosDatos();
  }, [router]);

  const cargarTodosDatos = async () => {
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
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      codInterno: '',
      observacion: '',
      direccion: '',
      codLocal: '',
      codArea: ''
    });
    setIsEditing(false);
    setEditingId(null);
    setParentContext({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      closeModal();
      cargarTodosDatos();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar');
    }
  };

  const handleDelete = async (type: EntityType, id: number) => {
    const entityNames = { local: 'Local', area: 'Área', oficina: 'Oficina' };
    if (!confirm(`¿Está seguro de eliminar este ${entityNames[type]}?`)) return;

    try {
      if (type === 'local') {
        await localService.eliminar(id);
      } else if (type === 'area') {
        await areaService.eliminar(id);
      } else {
        await oficinaService.eliminar(id);
      }
      cargarTodosDatos();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar');
    }
  };

  const openNewModal = (type: EntityType, context?: { localId?: number; areaId?: number }) => {
    resetForm();
    setModalType(type);
    setParentContext(context || {});
    if (context?.localId !== undefined) {
      setFormData(prev => ({ ...prev, codLocal: context.localId!.toString() }));
    }
    if (context?.areaId !== undefined) {
      setFormData(prev => ({ ...prev, codArea: context.areaId!.toString() }));
    }
    setShowModal(true);
  };

  const openEditModal = (type: EntityType, entity: Local | Area | Oficina) => {
    setIsEditing(true);
    setModalType(type);

    if (type === 'local') {
      const local = entity as Local;
      setEditingId(local.codLocal || null);
      setFormData({
        nombre: local.nombreLocal,
        direccion: local.direccion,
        codInterno: local.codInterno,
        observacion: '',
        codLocal: '',
        codArea: ''
      });
    } else if (type === 'area') {
      const area = entity as Area;
      setEditingId(area.codArea || null);
      setFormData({
        nombre: area.nombreArea,
        observacion: area.observacion || '',
        codInterno: area.codInterno || '',
        direccion: '',
        codLocal: (area.local as Local)?.codLocal?.toString() || '',
        codArea: ''
      });
    } else {
      const oficina = entity as Oficina;
      setEditingId(oficina.codOficina || null);
      const areaRelacionada = areas.find(a => a.codArea === (oficina.area as Area)?.codArea);
      const localId = (areaRelacionada?.local as Local)?.codLocal?.toString() || '';
      setFormData({
        nombre: oficina.nombreOficina,
        observacion: oficina.observacion || '',
        codInterno: oficina.codInterno || '',
        direccion: '',
        codLocal: localId,
        codArea: (oficina.area as Area)?.codArea?.toString() || ''
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
    locales.forEach(local => {
      if (local.codLocal) newExpandedLocales[local.codLocal] = true;
    });
    areas.forEach(area => {
      if (area.codArea) newExpandedAreas[area.codArea] = true;
    });
    setExpandedLocales(newExpandedLocales);
    setExpandedAreas(newExpandedAreas);
  };

  const collapseAll = () => {
    setExpandedLocales({});
    setExpandedAreas({});
  };

  // Filtrado por búsqueda
  const filteredData = () => {
    if (!searchTerm.trim()) {
      return { locales, areas, oficinas };
    }

    const term = searchTerm.toLowerCase();
    
    const filteredLocales = locales.filter(local => 
      local.nombreLocal.toLowerCase().includes(term) ||
      local.direccion.toLowerCase().includes(term) ||
      local.codInterno.toLowerCase().includes(term)
    );

    const filteredAreas = areas.filter(area =>
      area.nombreArea.toLowerCase().includes(term) ||
      (area.codInterno || '').toLowerCase().includes(term) ||
      (area.local as Local)?.nombreLocal.toLowerCase().includes(term)
    );

    const filteredOficinas = oficinas.filter(oficina =>
      oficina.nombreOficina.toLowerCase().includes(term) ||
      (oficina.codInterno || '').toLowerCase().includes(term) ||
      (oficina.area as Area)?.nombreArea.toLowerCase().includes(term)
    );

    return {
      locales: filteredLocales,
      areas: filteredAreas,
      oficinas: filteredOficinas
    };
  };

  const { locales: visibleLocales, areas: visibleAreas, oficinas: visibleOficinas } = filteredData();

  const getAreasForLocal = (localId: number) => {
    return visibleAreas.filter(area => (area.local as Local)?.codLocal === localId);
  };

  const getOficinasForArea = (areaId: number) => {
    return visibleOficinas.filter(oficina => (oficina.area as Area)?.codArea === areaId);
  };

  const getModalTitle = () => {
    const action = isEditing ? 'Editar' : 'Nuevo';
    const entity = modalType === 'local' ? 'Local' : modalType === 'area' ? 'Área' : 'Oficina';
    return `${action} ${entity}`;
  };

  const areasFiltradas_Form = formData.codLocal 
    ? areas.filter(a => (a.local as Local)?.codLocal === Number(formData.codLocal))
    : [];

  const totalCount = locales.length + areas.length + oficinas.length;

  // Función para obtener datos de tabla filtrados
  const getTableData = () => {
    if (tableEntityType === 'local') {
      return visibleLocales;
    } else if (tableEntityType === 'area') {
      return visibleAreas.filter(area => {
        if (!filtroLocalTabla) return true;
        return (area.local as Local)?.codLocal === Number(filtroLocalTabla);
      });
    } else {
      return visibleOficinas.filter(oficina => {
        const areaRelacionada = areas.find(a => a.codArea === (oficina.area as Area)?.codArea);
        const localId = (areaRelacionada?.local as Local)?.codLocal;

        if (filtroLocalTabla && localId !== Number(filtroLocalTabla)) return false;
        if (filtroAreaTabla && (oficina.area as Area)?.codArea !== Number(filtroAreaTabla)) return false;
        
        return true;
      });
    }
  };

  const tableData = getTableData();

  // Áreas filtradas por local para el select en oficinas
  const areasParaTablaOficinas = filtroLocalTabla 
    ? areas.filter(a => (a.local as Local)?.codLocal === Number(filtroLocalTabla))
    : areas;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Estructura Organizacional</h1>
          <p className="text-gray-600 mt-1">Vista jerárquica de Locales, Áreas y Oficinas</p>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg">
                <MdBusiness className="text-blue-600" size={18} />
                <span className="font-semibold text-blue-900">{locales.length}</span>
                <span className="text-blue-700">Locales</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-lg">
                <MdLayers className="text-purple-600" size={18} />
                <span className="font-semibold text-purple-900">{areas.length}</span>
                <span className="text-purple-700">Áreas</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg">
                <MdMeetingRoom className="text-green-600" size={18} />
                <span className="font-semibold text-green-900">{oficinas.length}</span>
                <span className="text-green-700">Oficinas</span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => openNewModal('local')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg font-medium"
        >
          <MdAdd size={22} />
          <span>Nuevo Local</span>
        </button>
      </div>

      {/* Barra de búsqueda y controles */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en toda la estructura organizacional..."
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <MdClear size={20} />
              </button>
            )}
          </div>
          
          {/* Toggle de Vista */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition font-medium text-sm ${
                viewMode === 'tree'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MdAccountTree size={18} />
              Jerárquica
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition font-medium text-sm ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MdViewList size={18} />
              Tabla
            </button>
          </div>

          {viewMode === 'tree' && (
            <>
              <button
                onClick={expandAll}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
              >
                Expandir Todo
              </button>
              <button
                onClick={collapseAll}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
              >
                Contraer Todo
              </button>
            </>
          )}
        </div>

        {/* Selector de Entidad y Filtros para Vista de Tabla */}
        {viewMode === 'table' && (
          <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Mostrar:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setTableEntityType('local');
                    setFiltroLocalTabla('');
                    setFiltroAreaTabla('');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition text-sm font-medium ${
                    tableEntityType === 'local'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MdBusiness size={16} />
                  Locales
                </button>
                <button
                  onClick={() => {
                    setTableEntityType('area');
                    setFiltroAreaTabla('');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition text-sm font-medium ${
                    tableEntityType === 'area'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MdLayers size={16} />
                  Áreas
                </button>
                <button
                  onClick={() => setTableEntityType('oficina')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition text-sm font-medium ${
                    tableEntityType === 'oficina'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MdMeetingRoom size={16} />
                  Oficinas
                </button>
              </div>
            </div>

            {/* Filtros */}
            {tableEntityType !== 'local' && (
              <div className="flex items-center gap-2 ml-auto">
                <MdFilterList className="text-gray-500" size={18} />
                <select
                  value={filtroLocalTabla}
                  onChange={(e) => {
                    setFiltroLocalTabla(e.target.value);
                    if (tableEntityType === 'oficina') {
                      setFiltroAreaTabla('');
                    }
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">Todos los Locales</option>
                  {locales.map((loc) => (
                    <option key={loc.codLocal} value={loc.codLocal}>
                      {loc.nombreLocal}
                    </option>
                  ))}
                </select>

                {tableEntityType === 'oficina' && (
                  <select
                    value={filtroAreaTabla}
                    onChange={(e) => setFiltroAreaTabla(e.target.value)}
                    disabled={!filtroLocalTabla}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white disabled:bg-gray-100"
                  >
                    <option value="">Todas las Áreas</option>
                    {areasParaTablaOficinas.map((area) => (
                      <option key={area.codArea} value={area.codArea}>
                        {area.nombreArea}
                      </option>
                    ))}
                  </select>
                )}

                {(filtroLocalTabla || filtroAreaTabla) && (
                  <button
                    onClick={() => {
                      setFiltroLocalTabla('');
                      setFiltroAreaTabla('');
                    }}
                    className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vista Jerárquica o Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : viewMode === 'tree' ? (
          /* VISTA JERÁRQUICA */
          visibleLocales.length === 0 ? (
            <div className="text-center py-20">
              <MdBusiness className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchTerm ? 'No se encontraron resultados' : 'No hay locales registrados'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza creando tu primer local'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => openNewModal('local')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  <MdAdd size={20} />
                  Crear Primer Local
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {visibleLocales.map((local) => {
                const localAreas = getAreasForLocal(local.codLocal!);
                const isExpanded = expandedLocales[local.codLocal!];
                const hasAreas = localAreas.length > 0;

                return (
                  <div key={local.codLocal} className="hover:bg-gray-50/50 transition">
                    {/* Local Row */}
                    <div className="flex items-center px-6 py-4 gap-3">
                      <button
                        onClick={() => toggleLocal(local.codLocal!)}
                        className={`p-2 rounded-lg border transition-all duration-200 transform hover:scale-105 ${
                          hasAreas 
                            ? 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 text-blue-600 cursor-pointer' 
                            : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!hasAreas}
                        title={hasAreas ? "Click para expandir/contraer áreas" : "No tiene áreas para mostrar"}
                      >
                        {isExpanded ? (
                          <MdExpandMore size={22} className="transition-transform duration-200" />
                        ) : (
                          <MdChevronRight size={22} className="transition-transform duration-200" />
                        )}
                      </button>

                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <MdBusiness className="text-blue-600" size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-gray-900 text-lg">{local.nombreLocal}</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 font-mono">
                              {local.codInterno}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5">{local.direccion}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <MdLayers size={14} />
                              {localAreas.length} {localAreas.length === 1 ? 'área' : 'áreas'}
                            </span>
                            <span className="flex items-center gap-1">
                              <MdMeetingRoom size={14} />
                              {localAreas.reduce((acc, area) => acc + getOficinasForArea(area.codArea!).length, 0)} oficinas
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openNewModal('area', { localId: local.codLocal })}
                          className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition text-sm font-medium flex items-center gap-1.5"
                          title="Agregar Área"
                        >
                          <MdAdd size={18} />
                          Área
                        </button>
                        <button
                          onClick={() => openEditModal('local', local)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Editar Local"
                        >
                          <MdEdit size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete('local', local.codLocal!)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Eliminar Local"
                        >
                          <MdDelete size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Áreas del Local */}
                    {isExpanded && hasAreas && (
                      <div className="bg-gradient-to-r from-purple-50/30 to-transparent">
                        {localAreas.map((area) => {
                          const areaOficinas = getOficinasForArea(area.codArea!);
                          const isAreaExpanded = expandedAreas[area.codArea!];
                          const hasOficinas = areaOficinas.length > 0;

                          return (
                            <div key={area.codArea} className="border-l-2 border-purple-200 ml-12">
                              {/* Area Row */}
                              <div className="flex items-center px-6 py-3 gap-3">
                                <button
                                  onClick={() => toggleArea(area.codArea!)}
                                  className={`p-1.5 rounded-lg border transition-all duration-200 transform hover:scale-105 ${
                                    hasOficinas 
                                      ? 'border-purple-300 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 text-purple-600 cursor-pointer' 
                                      : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                  }`}
                                  disabled={!hasOficinas}
                                  title={hasOficinas ? "Click para expandir/contraer oficinas" : "No tiene oficinas para mostrar"}
                                >
                                  {isAreaExpanded ? (
                                    <MdExpandMore size={20} className="transition-transform duration-200" />
                                  ) : (
                                    <MdChevronRight size={20} className="transition-transform duration-200" />
                                  )}
                                </button>

                                <div className="flex items-center gap-3 flex-1">
                                  <div className="p-1.5 bg-purple-100 rounded-lg">
                                    <MdLayers className="text-purple-600" size={20} />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-gray-900">{area.nombreArea}</h4>
                                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 font-mono">
                                        {area.codInterno}
                                      </span>
                                    </div>
                                    {area.observacion && (
                                      <p className="text-sm text-gray-600 mt-0.5">{area.observacion}</p>
                                    )}
                                    <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                                      <MdMeetingRoom size={14} />
                                      {areaOficinas.length} {areaOficinas.length === 1 ? 'oficina' : 'oficinas'}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openNewModal('oficina', { 
                                      localId: local.codLocal, 
                                      areaId: area.codArea 
                                    })}
                                    className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition text-sm font-medium flex items-center gap-1.5"
                                    title="Agregar Oficina"
                                  >
                                    <MdAdd size={16} />
                                    Oficina
                                  </button>
                                  <button
                                    onClick={() => openEditModal('area', area)}
                                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                    title="Editar Área"
                                  >
                                    <MdEdit size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete('area', area.codArea!)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Eliminar Área"
                                  >
                                    <MdDelete size={18} />
                                  </button>
                                </div>
                              </div>

                              {/* Oficinas del Área */}
                              {isAreaExpanded && hasOficinas && (
                                <div className="bg-gradient-to-r from-green-50/30 to-transparent">
                                  {areaOficinas.map((oficina) => (
                                    <div key={oficina.codOficina} className="border-l-2 border-green-200 ml-12">
                                      <div className="flex items-center px-6 py-3 gap-3">
                                        <div className="w-5" /> {/* Spacer */}
                                        
                                        <div className="flex items-center gap-3 flex-1">
                                          <div className="p-1.5 bg-green-100 rounded-lg">
                                            <MdMeetingRoom className="text-green-600" size={18} />
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <h5 className="font-medium text-gray-900">{oficina.nombreOficina}</h5>
                                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 font-mono">
                                                {oficina.codInterno}
                                              </span>
                                            </div>
                                            {oficina.observacion && (
                                              <p className="text-sm text-gray-600 mt-0.5">{oficina.observacion}</p>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => openEditModal('oficina', oficina)}
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                            title="Editar Oficina"
                                          >
                                            <MdEdit size={18} />
                                          </button>
                                          <button
                                            onClick={() => handleDelete('oficina', oficina.codOficina!)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                            title="Eliminar Oficina"
                                          >
                                            <MdDelete size={18} />
                                          </button>
                                        </div>
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
          /* VISTA DE TABLA */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${
                tableEntityType === 'local' ? 'bg-blue-50 border-b-2 border-blue-200' :
                tableEntityType === 'area' ? 'bg-purple-50 border-b-2 border-purple-200' :
                'bg-green-50 border-b-2 border-green-200'
              }`}>
                <tr>
                  {tableEntityType === 'local' && (
                    <>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Nombre del Local</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Dirección</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Código</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Áreas</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Oficinas</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Acciones</th>
                    </>
                  )}
                  {tableEntityType === 'area' && (
                    <>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Nombre del Área</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Local</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Código</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Observación</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Oficinas</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Acciones</th>
                    </>
                  )}
                  {tableEntityType === 'oficina' && (
                    <>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Nombre de Oficina</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Área</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Local</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Código</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Observación</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Acciones</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        {tableEntityType === 'local' && <MdBusiness size={48} className="mb-3 text-gray-300" />}
                        {tableEntityType === 'area' && <MdLayers size={48} className="mb-3 text-gray-300" />}
                        {tableEntityType === 'oficina' && <MdMeetingRoom size={48} className="mb-3 text-gray-300" />}
                        <p className="text-lg font-semibold">
                          {searchTerm || filtroLocalTabla || filtroAreaTabla
                            ? 'No se encontraron resultados con los filtros aplicados'
                            : `No hay ${tableEntityType === 'local' ? 'locales' : tableEntityType === 'area' ? 'áreas' : 'oficinas'} registradas`
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : tableEntityType === 'local' ? (
                  (tableData as Local[]).map((local) => {
                    const localAreas = getAreasForLocal(local.codLocal!);
                    const totalOficinas = localAreas.reduce((acc, area) => acc + getOficinasForArea(area.codArea!).length, 0);
                    return (
                      <tr key={local.codLocal} className="hover:bg-blue-50/30 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MdBusiness className="text-blue-600" size={20} />
                            <span className="font-semibold text-gray-900">{local.nombreLocal}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{local.direccion}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 font-mono">
                            {local.codInterno}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
                            {localAreas.length}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                            {totalOficinas}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal('local', local)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Editar"
                            >
                              <MdEdit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete('local', local.codLocal!)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Eliminar"
                            >
                              <MdDelete size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : tableEntityType === 'area' ? (
                  (tableData as Area[]).map((area) => {
                    const areaOficinas = getOficinasForArea(area.codArea!);
                    return (
                      <tr key={area.codArea} className="hover:bg-purple-50/30 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MdLayers className="text-purple-600" size={20} />
                            <span className="font-semibold text-gray-900">{area.nombreArea}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MdBusiness className="text-blue-600" size={16} />
                            <span className="text-gray-700">{(area.local as Local)?.nombreLocal || 'Sin Local'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 font-mono">
                            {area.codInterno}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{area.observacion || '-'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                            {areaOficinas.length}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal('area', area)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                              title="Editar"
                            >
                              <MdEdit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete('area', area.codArea!)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Eliminar"
                            >
                              <MdDelete size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  (tableData as Oficina[]).map((oficina) => {
                    const areaRelacionada = areas.find(a => a.codArea === (oficina.area as Area)?.codArea);
                    const localRelacionado = areaRelacionada ? locales.find(l => l.codLocal === (areaRelacionada.local as Local)?.codLocal) : null;
                    return (
                      <tr key={oficina.codOficina} className="hover:bg-green-50/30 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MdMeetingRoom className="text-green-600" size={20} />
                            <span className="font-semibold text-gray-900">{oficina.nombreOficina}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MdLayers className="text-purple-600" size={16} />
                            <span className="text-gray-700">{(oficina.area as Area)?.nombreArea || 'Sin Área'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MdBusiness className="text-blue-600" size={16} />
                            <span className="text-gray-700">{localRelacionado?.nombreLocal || 'Sin Local'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 font-mono">
                            {oficina.codInterno}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{oficina.observacion || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal('oficina', oficina)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Editar"
                            >
                              <MdEdit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete('oficina', oficina.codOficina!)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Eliminar"
                            >
                              <MdDelete size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dinámico */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg my-8 max-h-[90vh] flex flex-col">
            <div className={`px-6 py-4 border-b flex justify-between items-center rounded-t-xl flex-shrink-0 ${
              modalType === 'local' ? 'bg-gradient-to-r from-blue-600 to-blue-700' :
              modalType === 'area' ? 'bg-gradient-to-r from-purple-600 to-purple-700' :
              'bg-gradient-to-r from-green-600 to-green-700'
            }`}>
              <div className="flex items-center gap-3">
                {modalType === 'local' && <MdBusiness className="text-white" size={24} />}
                {modalType === 'area' && <MdLayers className="text-white" size={24} />}
                {modalType === 'oficina' && <MdMeetingRoom className="text-white" size={24} />}
                <h2 className="text-xl font-bold text-white">{getModalTitle()}</h2>
              </div>
              <button onClick={closeModal} className="text-white/80 hover:text-white text-2xl">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* Contexto Visual */}
              {(modalType === 'area' || modalType === 'oficina') && (
                <div className={`p-4 rounded-lg border-2 ${
                  modalType === 'area' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'
                }`}>
                  <div className="text-sm font-semibold text-gray-700 mb-2">Estructura:</div>
                  <div className="space-y-1">
                    {modalType === 'area' && formData.codLocal && (
                      <div className="flex items-center gap-2 text-sm">
                        <MdBusiness className="text-blue-600" size={16} />
                        <span className="font-medium text-gray-900">
                          {locales.find(l => l.codLocal === Number(formData.codLocal))?.nombreLocal}
                        </span>
                      </div>
                    )}
                    {modalType === 'oficina' && formData.codLocal && (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <MdBusiness className="text-blue-600" size={16} />
                          <span className="font-medium text-gray-900">
                            {locales.find(l => l.codLocal === Number(formData.codLocal))?.nombreLocal}
                          </span>
                        </div>
                        {formData.codArea && (
                          <div className="flex items-center gap-2 text-sm ml-4">
                            <MdLayers className="text-purple-600" size={16} />
                            <span className="font-medium text-gray-900">
                              {areas.find(a => a.codArea === Number(formData.codArea))?.nombreArea}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Selección de Local (para Áreas y Oficinas) */}
              {(modalType === 'area' || modalType === 'oficina') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <MdBusiness className="text-blue-600" size={18} />
                      Local (Sede) <span className="text-red-500">*</span>
                      {isEditing && (modalType === 'area' || modalType === 'oficina') && (
                        <span className="text-xs text-gray-500 font-normal ml-2">(No editable)</span>
                      )}
                    </div>
                  </label>
                  <select
                    value={formData.codLocal}
                    onChange={(e) => setFormData({ ...formData, codLocal: e.target.value, codArea: '' })}
                    required
                    disabled={!!parentContext.localId || (isEditing && (modalType === 'area' || modalType === 'oficina'))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Seleccione un Local --</option>
                    {locales.map((loc) => (
                      <option key={loc.codLocal} value={loc.codLocal}>
                        {loc.nombreLocal} ({loc.codInterno})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selección de Área (solo para Oficinas) */}
              {modalType === 'oficina' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <MdLayers className="text-purple-600" size={18} />
                      Área <span className="text-red-500">*</span>
                      {isEditing && (
                        <span className="text-xs text-gray-500 font-normal ml-2">(No editable)</span>
                      )}
                    </div>
                  </label>
                  <select
                    value={formData.codArea}
                    onChange={(e) => setFormData({ ...formData, codArea: e.target.value })}
                    required
                    disabled={!formData.codLocal || !!parentContext.areaId || isEditing}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {formData.codLocal ? '-- Seleccione un Área --' : '-- Primero seleccione un Local --'}
                    </option>
                    {areasFiltradas_Form.map((area) => (
                      <option key={area.codArea} value={area.codArea}>
                        {area.nombreArea} ({area.codInterno})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de {modalType === 'local' ? 'Local' : modalType === 'area' ? 'Área' : 'Oficina'} 
                  <span className="text-red-500"> *</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder={`Ej: ${
                    modalType === 'local' ? 'Sede Central' : 
                    modalType === 'area' ? 'Recursos Humanos' : 
                    'Oficina 101'
                  }`}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Dirección (solo para Locales) */}
              {modalType === 'local' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dirección <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    required
                    placeholder="Ej: Av. Principal 123, Lima"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              {/* Código Interno */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Código Interno <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.codInterno}
                  onChange={(e) => setFormData({ ...formData, codInterno: e.target.value })}
                  required
                  placeholder="Ej: LOC-001, ARE-001, OFI-001"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              {/* Observación (para Áreas y Oficinas) */}
              {modalType !== 'local' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Observación
                  </label>
                  <textarea
                    value={formData.observacion}
                    onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                    placeholder="Descripción adicional (opcional)"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                  />
                </div>
              )}

              {/* Footer con botones - fijo en la parte inferior */}
              <div className="flex gap-3 pt-4 border-t border-gray-100 flex-shrink-0 bg-white sticky bottom-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2.5 text-white font-medium rounded-lg transition shadow-md ${
                    modalType === 'local' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' :
                    modalType === 'area' ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800' :
                    'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                  }`}
                >
                  {isEditing ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}