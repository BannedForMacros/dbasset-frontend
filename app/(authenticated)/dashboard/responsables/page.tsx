'use client';

import { useEffect, useState, useMemo } from 'react';
import { responsableService, Responsable } from '../../../services/responsable.service';
import { oficinaService, Oficina } from '../../../services/oficina.service';
import { areaService, Area } from '../../../services/area.service';
import { localService, Local } from '../../../services/local.service';
import { 
  MdAdd, MdEdit, MdDelete, MdPerson, MdBusiness, 
  MdLocationOn, MdFilterList, MdClose, MdSave,
  MdSearch, MdClear, MdLayers, MdMeetingRoom
} from 'react-icons/md';

// --- COMPONENTE AUXILIAR: AVATAR ---
const UserAvatar = ({ name }: { name: string }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  
  const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500'];
  const colorIndex = name.length % colors.length;

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${colors[colorIndex]}`}>
      {initials}
    </div>
  );
};

export default function ResponsablesPage() {
  // --- ESTADOS ---
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroLocal, setFiltroLocal] = useState('');
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroOficina, setFiltroOficina] = useState('');

  // Formulario
  const initialFormState = {
    nombreResponsable: '',
    cargo: '',
    codInterno: '',
    codLocal: '',
    codArea: '',
    codOficina: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- CARGA DE DATOS ---
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [respData, locData, areaData, ofiData] = await Promise.all([
        responsableService.listarActivos(),
        localService.listarActivos(),
        areaService.listarActivos(),
        oficinaService.listarActivos()
      ]);
      setResponsables(respData);
      setLocales(locData);
      setAreas(areaData);
      setOficinas(ofiData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCIÓN AUXILIAR: OBTENER JERARQUÍA COMPLETA ---
  const getJerarquia = (responsable: Responsable) => {
    const ofiId = (responsable.oficina as Oficina)?.codOficina;
    const oficina = oficinas.find(o => o.codOficina === ofiId);
    const areaId = (oficina?.area as Area)?.codArea;
    const area = areas.find(a => a.codArea === areaId);
    const localId = (area?.local as Local)?.codLocal;
    const local = locales.find(l => l.codLocal === localId);

    return {
      oficina: oficina?.nombreOficina || 'Sin Oficina',
      area: area?.nombreArea || 'Sin Área',
      local: local?.nombreLocal || 'Sin Local',
      oficinaId: ofiId,
      areaId,
      localId
    };
  };

  // --- LÓGICA DE FILTRADO PARA LA TABLA ---
  const responsablesFiltrados = useMemo(() => {
    let filtered = responsables;

    // Filtrar por Local
    if (filtroLocal) {
      filtered = filtered.filter(resp => {
        const jerarquia = getJerarquia(resp);
        return jerarquia.localId === Number(filtroLocal);
      });
    }

    // Filtrar por Área
    if (filtroArea) {
      filtered = filtered.filter(resp => {
        const jerarquia = getJerarquia(resp);
        return jerarquia.areaId === Number(filtroArea);
      });
    }

    // Filtrar por Oficina
    if (filtroOficina) {
      filtered = filtered.filter(resp => {
        const jerarquia = getJerarquia(resp);
        return jerarquia.oficinaId === Number(filtroOficina);
      });
    }

    // Filtrar por búsqueda de texto
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(resp => {
        const jerarquia = getJerarquia(resp);
        return (
          resp.nombreResponsable.toLowerCase().includes(term) ||
          (resp.cargo || '').toLowerCase().includes(term) ||
          (resp.codInterno || '').toLowerCase().includes(term) ||
          jerarquia.oficina.toLowerCase().includes(term) ||
          jerarquia.area.toLowerCase().includes(term) ||
          jerarquia.local.toLowerCase().includes(term)
        );
      });
    }

    return filtered;
  }, [responsables, filtroLocal, filtroArea, filtroOficina, searchTerm, oficinas, areas, locales]);

  // --- LÓGICA PARA FILTROS EN CASCADA ---
  const areasDisponiblesFiltro = filtroLocal
    ? areas.filter(a => (a.local as Local)?.codLocal === Number(filtroLocal))
    : areas;

  const oficinasDisponiblesFiltro = filtroArea
    ? oficinas.filter(o => (o.area as Area)?.codArea === Number(filtroArea))
    : filtroLocal
    ? oficinas.filter(o => {
        const area = areas.find(a => a.codArea === (o.area as Area)?.codArea);
        return (area?.local as Local)?.codLocal === Number(filtroLocal);
      })
    : oficinas;

  // --- LÓGICA PARA EL FORMULARIO (CASCADA) ---
  const areasFiltradasForm = formData.codLocal 
    ? areas.filter(a => (a.local as Local)?.codLocal === Number(formData.codLocal))
    : [];
  const oficinasFiltradasForm = formData.codArea
    ? oficinas.filter(o => (o.area as Area)?.codArea === Number(formData.codArea))
    : [];

  // --- HANDLERS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codOficina) { 
      alert('Seleccione Oficina'); 
      return; 
    }

    const oficinaSelec = oficinas.find(o => o.codOficina === Number(formData.codOficina));
    const areaSelec = areas.find(a => a.codArea === (oficinaSelec?.area as Area)?.codArea);
    const localSelec = locales.find(l => l.codLocal === (areaSelec?.local as Local)?.codLocal);

    const payload = {
      nombreResponsable: formData.nombreResponsable,
      cargo: formData.cargo,
      codInterno: formData.codInterno,
      oficina: { codOficina: Number(formData.codOficina) },
      codArea: areaSelec?.codArea || Number(formData.codArea), 
      codLocal: localSelec?.codLocal || Number(formData.codLocal)
    } as unknown as Responsable; 

    try {
      if (editingId) await responsableService.actualizar(editingId, payload);
      else await responsableService.crear(payload);
      closeModal();
      cargarDatos();
    } catch (error) { 
      console.error(error); 
      alert('Error al guardar'); 
    }
  };

  const handleEdit = (resp: Responsable) => {
    setEditingId(resp.codResponsable || null);
    
    const oficinaId = (resp.oficina as Oficina)?.codOficina;
    const oficinaActual = oficinas.find(o => o.codOficina === oficinaId);
    const areaId = (oficinaActual?.area as Area)?.codArea; 
    const areaActual = areas.find(a => a.codArea === areaId);
    const localId = (areaActual?.local as Local)?.codLocal;

    setFormData({
      nombreResponsable: resp.nombreResponsable,
      cargo: resp.cargo,
      codInterno: resp.codInterno,
      codLocal: localId?.toString() || '',
      codArea: areaId?.toString() || '',
      codOficina: oficinaId?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar este responsable?')) {
      try { 
        await responsableService.eliminar(id); 
        cargarDatos(); 
      } catch (e) { 
        console.error(e);
        alert('Error al eliminar'); 
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

  const limpiarFiltros = () => {
    setFiltroLocal('');
    setFiltroArea('');
    setFiltroOficina('');
    setSearchTerm('');
  };

  const hayFiltrosActivos = filtroLocal || filtroArea || filtroOficina || searchTerm;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Custodios</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <MdPerson className="text-gray-400" size={18}/>
            Gestión de personal y asignaciones por ubicación
          </p>
        </div>
        <button 
          onClick={openNewModal} 
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg font-medium"
        >
          <MdAdd size={22} />
          <span>Nuevo Custodio</span>
        </button>
      </div>

      {/* Stats - Solo Total Custodios */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm w-fit">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
            <MdPerson size={28}/>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Total de Custodios</p>
            <p className="text-3xl font-bold text-gray-900">{responsables.length}</p>
          </div>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
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
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Filtro por Local */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">
              <div className="flex items-center gap-1.5">
                <MdBusiness size={14} className="text-blue-600" />
                Local (Sede)
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
              <option value="">Todos los Locales</option>
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
              <option value="">Todas las Áreas</option>
              {areasDisponiblesFiltro.map(a => (
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
              <option value="">Todas las Oficinas</option>
              {oficinasDisponiblesFiltro.map(o => (
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
                Búsqueda General
              </div>
            </label>
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, cargo, código..."
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

        {/* Resumen de Filtros Activos */}
        {hayFiltrosActivos && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-gray-600 font-medium">Mostrando:</span>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-semibold">
              {responsablesFiltrados.length} de {responsables.length} custodios
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
        ) : responsablesFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <MdPerson className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {hayFiltrosActivos ? 'No se encontraron custodios' : 'No hay custodios registrados'}
            </h3>
            <p className="text-gray-500 mb-6">
              {hayFiltrosActivos 
                ? 'Intenta ajustar los filtros o realizar otra búsqueda'
                : 'Comienza registrando tu primer custodio'
              }
            </p>
            {!hayFiltrosActivos && (
              <button
                onClick={openNewModal}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                <MdAdd size={20} />
                Crear Primer Custodio
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Custodio
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {responsablesFiltrados.map((resp) => {
                  const jerarquia = getJerarquia(resp);

                  return (
                    <tr key={resp.codResponsable} className="hover:bg-indigo-50/30 transition-colors">
                      {/* Custodio y Cargo */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <UserAvatar name={resp.nombreResponsable} />
                          <div>
                            <p className="font-bold text-gray-900">
                              {resp.nombreResponsable}
                            </p>
                            <p className="text-sm text-gray-600 mt-0.5">
                              {resp.cargo || 'Sin cargo especificado'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Ubicación Jerárquica */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm">
                            <MdBusiness className="text-blue-600" size={16} />
                            <span className="font-semibold text-gray-900">{jerarquia.local}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MdLayers className="text-purple-600" size={16} />
                            <span className="text-gray-700">{jerarquia.area}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MdMeetingRoom className="text-green-600" size={16} />
                            <span className="text-gray-700">{jerarquia.oficina}</span>
                          </div>
                        </div>
                      </td>

                      {/* Código */}
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 font-mono">
                          {resp.codInterno || 'N/A'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(resp)} 
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Editar"
                          >
                            <MdEdit size={20} />
                          </button>
                          <button 
                            onClick={() => resp.codResponsable && handleDelete(resp.codResponsable)} 
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 border-b flex justify-between items-center rounded-t-xl flex-shrink-0">
              <div className="flex items-center gap-3">
                <MdPerson className="text-white" size={24} />
                <div>
                  <h3 className="font-bold text-xl text-white">
                    {editingId ? 'Editar Custodio' : 'Nuevo Custodio'}
                  </h3>
                  <p className="text-sm text-indigo-100">
                    Complete la información del personal
                  </p>
                </div>
              </div>
              <button 
                onClick={closeModal} 
                className="text-white/80 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>
            
            {/* Form */}
            <form id="form-responsable" onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Sección: Información Personal */}
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <div className="w-1 h-4 bg-indigo-600 rounded"></div>
                  Información Personal
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre Completo <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={formData.nombreResponsable} 
                      onChange={(e) => setFormData({ ...formData, nombreResponsable: e.target.value })} 
                      required 
                      placeholder="Ej. Juan Carlos Pérez López"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cargo
                    </label>
                    <input 
                      type="text" 
                      value={formData.cargo} 
                      onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} 
                      placeholder="Ej. Analista de TI"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Código Interno / DNI
                    </label>
                    <input 
                      type="text" 
                      value={formData.codInterno} 
                      onChange={(e) => setFormData({ ...formData, codInterno: e.target.value })} 
                      placeholder="EMP-001"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Sección: Asignación de Ubicación */}
              <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                <h4 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-600 rounded"></div>
                  Asignación de Ubicación
                </h4>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Local */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <div className="flex items-center gap-1.5">
                          <MdBusiness className="text-blue-600" size={16} />
                          Local (Sede) <span className="text-red-500">*</span>
                        </div>
                      </label>
                      <select 
                        value={formData.codLocal} 
                        onChange={(e) => setFormData({ ...formData, codLocal: e.target.value, codArea: '', codOficina: '' })} 
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      >
                        <option value="">-- Seleccionar Local --</option>
                        {locales.map(l => (
                          <option key={l.codLocal} value={l.codLocal}>
                            {l.nombreLocal}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Área */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <div className="flex items-center gap-1.5">
                          <MdLayers className="text-purple-600" size={16} />
                          Área <span className="text-red-500">*</span>
                        </div>
                      </label>
                      <select 
                        value={formData.codArea} 
                        onChange={(e) => setFormData({ ...formData, codArea: e.target.value, codOficina: '' })} 
                        disabled={!formData.codLocal}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {formData.codLocal ? '-- Seleccionar Área --' : '-- Primero seleccione un Local --'}
                        </option>
                        {areasFiltradasForm.map(a => (
                          <option key={a.codArea} value={a.codArea}>
                            {a.nombreArea}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Oficina */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <div className="flex items-center gap-1.5">
                        <MdMeetingRoom className="text-green-600" size={16} />
                        Oficina <span className="text-red-500">*</span>
                      </div>
                    </label>
                    <select 
                      value={formData.codOficina} 
                      onChange={(e) => setFormData({ ...formData, codOficina: e.target.value })} 
                      disabled={!formData.codArea}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {formData.codArea ? '-- Seleccionar Oficina --' : '-- Primero seleccione un Área --'}
                      </option>
                      {oficinasFiltradasForm.map(o => (
                        <option key={o.codOficina} value={o.codOficina}>
                          {o.nombreOficina}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0 rounded-b-xl">
              <button 
                type="button"
                onClick={closeModal} 
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="form-responsable" 
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-md flex items-center gap-2"
              >
                <MdSave size={20}/>
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}