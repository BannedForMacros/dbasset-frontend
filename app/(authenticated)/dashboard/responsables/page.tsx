'use client';

import { useEffect, useState, useMemo } from 'react';
import { responsableService, Responsable } from '../../../services/responsable.service';
import { oficinaService, Oficina } from '../../../services/oficina.service';
import { areaService, Area } from '../../../services/area.service';
import { localService, Local } from '../../../services/local.service';
import { 
  MdAdd, MdEdit, MdDelete, MdPerson, MdBusiness, 
  MdLocationOn, MdFilterList, MdClose, MdSave,
  MdSearch, MdClear, MdLayers, MdMeetingRoom, MdDomain
} from 'react-icons/md';

// --- COMPONENTE AVATAR SIMPLE ---
const UserAvatar = ({ name }: { name: string }) => {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200">
      {initials}
    </div>
  );
};

export default function ResponsablesPage() {
  // --- DATOS MAESTROS ---
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // --- FILTROS TABLA ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroLocal, setFiltroLocal] = useState('');

  // --- FORMULARIO (ESTADO) ---
  const initialFormState = {
    nombreResponsable: '',
    cargo: '',
    codInterno: '',
    // Estos son temporales para los selectores de agregar
    tempLocal: '',
    tempArea: '',
    tempOficina: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  
  // ✅ ESTADO CRÍTICO: Lista de Oficinas seleccionadas (Many-to-Many)
  const [oficinasSeleccionadas, setOficinasSeleccionadas] = useState<Oficina[]>([]);

  // --- CARGA INICIAL ---
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

  // --- LÓGICA FILTRADO TABLA ---
  const responsablesFiltrados = useMemo(() => {
    let filtered = responsables;

    // Filtro Local (Busca si ALGUNA oficina del responsable pertenece al local)
    if (filtroLocal) {
      filtered = filtered.filter(resp => 
        resp.oficinas?.some(ofi => {
          const ofiFull = oficinas.find(o => o.codOficina === ofi.codOficina);
          const areaFull = areas.find(a => a.codArea === (ofiFull?.area as Area)?.codArea);
          return (areaFull?.local as Local)?.codLocal === Number(filtroLocal);
        })
      );
    }

    // Búsqueda Texto
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(resp => 
        resp.nombreResponsable.toLowerCase().includes(term) ||
        (resp.codInterno || '').toLowerCase().includes(term) ||
        (resp.cargo || '').toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [responsables, filtroLocal, searchTerm, oficinas, areas]);

  // --- CASCADAS PARA EL FORMULARIO (Solo visuales para seleccionar) ---
  const areasParaForm = formData.tempLocal 
    ? areas.filter(a => (a.local as Local)?.codLocal === Number(formData.tempLocal))
    : [];
  
  const oficinasParaForm = formData.tempArea
    ? oficinas.filter(o => (o.area as Area)?.codArea === Number(formData.tempArea))
    : [];

  // --- HANDLERS DE OFICINAS (AGREGAR / QUITAR) ---
  const handleAddOficina = () => {
    if (!formData.tempOficina) return;
    
    // Verificar si ya existe
    const exists = oficinasSeleccionadas.some(o => o.codOficina === Number(formData.tempOficina));
    if (exists) {
      alert('Esta oficina ya está asignada.');
      return;
    }

    const oficinaObj = oficinas.find(o => o.codOficina === Number(formData.tempOficina));
    if (oficinaObj) {
      setOficinasSeleccionadas([...oficinasSeleccionadas, oficinaObj]);
      // Resetear selectores temporales para agregar otra rápidamente
      setFormData({ ...formData, tempOficina: '' }); 
    }
  };

  const handleRemoveOficina = (codOficina: number) => {
    setOficinasSeleccionadas(prev => prev.filter(o => o.codOficina !== codOficina));
  };

  // --- CRUD HANDLERS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (oficinasSeleccionadas.length === 0) { 
      alert('Debe asignar al menos una Oficina al custodio.'); 
      return; 
    }

    // Construir payload con la lista de oficinas
    const payload = {
      nombreResponsable: formData.nombreResponsable,
      cargo: formData.cargo,
      codInterno: formData.codInterno,
      oficinas: oficinasSeleccionadas.map(o => ({ codOficina: o.codOficina }))
    } as unknown as Responsable; 

    try {
      if (editingId) await responsableService.actualizar(editingId, payload);
      else await responsableService.crear(payload);
      closeModal();
      cargarDatos();
    } catch (error) { 
      console.error(error); 
      alert('Error al guardar.'); 
    }
  };

  const handleEdit = (resp: Responsable) => {
    setEditingId(resp.codResponsable || null);
    
    // Cargar oficinas existentes (asegurando que sean objetos completos buscando en el catálogo)
    const oficinasDelResponsable = (resp.oficinas || []).map(ofi => 
      oficinas.find(o => o.codOficina === ofi.codOficina) || ofi
    ) as Oficina[];

    setOficinasSeleccionadas(oficinasDelResponsable);

    setFormData({
      ...initialFormState,
      nombreResponsable: resp.nombreResponsable,
      cargo: resp.cargo,
      codInterno: resp.codInterno,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar este custodio?')) {
      try { 
        await responsableService.eliminar(id); 
        cargarDatos(); 
      } catch (e) { console.error(e); }
    }
  };

  const openNewModal = () => { 
    setEditingId(null); 
    setFormData(initialFormState);
    setOficinasSeleccionadas([]);
    setShowModal(true); 
  };
  
  const closeModal = () => { 
    setShowModal(false); 
    setFormData(initialFormState);
    setOficinasSeleccionadas([]);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto pb-10">
      
      {/* Header Limpio */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Custodios</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <MdPerson className="text-blue-600"/> Gestión de personal y asignaciones múltiples
          </p>
        </div>
        <button 
          onClick={openNewModal} 
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md font-medium"
        >
          <MdAdd size={20} /> Nuevo Custodio
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o código..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <MdFilterList className="text-gray-400"/>
          <select 
            value={filtroLocal}
            onChange={e => setFiltroLocal(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500"
          >
            <option value="">Todas las Sedes</option>
            {locales.map(l => <option key={l.codLocal} value={l.codLocal}>{l.nombreLocal}</option>)}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase font-bold tracking-wider text-left">
              <tr>
                <th className="px-6 py-4">Custodio</th>
                <th className="px-6 py-4">Oficinas Asignadas</th>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">Cargando...</td></tr>
              ) : responsablesFiltrados.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">No se encontraron registros</td></tr>
              ) : (
                responsablesFiltrados.map((resp) => (
                  <tr key={resp.codResponsable} className="hover:bg-blue-50/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={resp.nombreResponsable} />
                        <div>
                          <p className="font-bold text-gray-900">{resp.nombreResponsable}</p>
                          <p className="text-xs text-gray-500">{resp.cargo || 'Sin cargo'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {resp.oficinas && resp.oficinas.length > 0 ? (
                          resp.oficinas.map((ofi, idx) => {
                            // Buscar nombre completo si falta (en caso de lazy load issues)
                            const ofiName = oficinas.find(o => o.codOficina === ofi.codOficina)?.nombreOficina || 'Oficina';
                            return (
                              <span key={idx} className="flex items-center gap-1.5 text-gray-700">
                                <MdMeetingRoom className="text-blue-400" size={14}/> {ofiName}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-gray-400 italic">Sin asignación</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono text-xs font-bold border border-gray-200">
                        {resp.codInterno || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(resp)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"><MdEdit size={18}/></button>
                        <button onClick={() => resp.codResponsable && handleDelete(resp.codResponsable)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"><MdDelete size={18}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-right text-xs text-gray-500">
          Total: {responsablesFiltrados.length} registros
        </div>
      </div>

      {/* Modal - Diseño Sólido y Limpio */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="bg-blue-600 px-6 py-4 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <MdPerson className="text-blue-200"/> {editingId ? 'Editar Custodio' : 'Nuevo Custodio'}
              </h3>
              <button onClick={closeModal} className="text-white hover:bg-blue-700 p-1 rounded-full transition"><MdClose size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              
              {/* Datos Personales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo <span className="text-red-500">*</span></label>
                  <input 
                    type="text" required value={formData.nombreResponsable} 
                    onChange={e => setFormData({...formData, nombreResponsable: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Cargo</label>
                  <input 
                    type="text" value={formData.cargo} 
                    onChange={e => setFormData({...formData, cargo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Código Interno</label>
                  <input 
                    type="text" value={formData.codInterno} 
                    onChange={e => setFormData({...formData, codInterno: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Asignación de Oficinas */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <MdBusiness className="text-blue-600"/> Asignación de Ubicaciones
                </h4>
                
                {/* Selectores Cascada para AGREGAR */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">1. Local</label>
                      <select 
                        value={formData.tempLocal}
                        onChange={e => setFormData({...formData, tempLocal: e.target.value, tempArea: '', tempOficina: ''})}
                        className="w-full px-2 py-2 border border-gray-300 rounded text-sm outline-none focus:border-blue-500"
                      >
                        <option value="">Seleccionar Local</option>
                        {locales.map(l => <option key={l.codLocal} value={l.codLocal}>{l.nombreLocal}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">2. Área</label>
                      <select 
                        value={formData.tempArea}
                        onChange={e => setFormData({...formData, tempArea: e.target.value, tempOficina: ''})}
                        disabled={!formData.tempLocal}
                        className="w-full px-2 py-2 border border-gray-300 rounded text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Seleccionar Área</option>
                        {areasParaForm.map(a => <option key={a.codArea} value={a.codArea}>{a.nombreArea}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">3. Oficina</label>
                      <select 
                        value={formData.tempOficina}
                        onChange={e => setFormData({...formData, tempOficina: e.target.value})}
                        disabled={!formData.tempArea}
                        className="w-full px-2 py-2 border border-gray-300 rounded text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Seleccionar Oficina</option>
                        {oficinasParaForm.map(o => <option key={o.codOficina} value={o.codOficina}>{o.nombreOficina}</option>)}
                      </select>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddOficina}
                    disabled={!formData.tempOficina}
                    className="w-full py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    + Agregar esta Oficina
                  </button>
                </div>

                {/* Lista de Oficinas Seleccionadas */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Oficinas Asignadas ({oficinasSeleccionadas.length})</label>
                  {oficinasSeleccionadas.length === 0 ? (
                    <p className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded border border-dashed border-gray-300 text-center">
                      No hay oficinas asignadas. Utilice los selectores de arriba para agregar.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                      {oficinasSeleccionadas.map((ofi, idx) => {
                        // Reconstruir contexto para mostrar (Local > Area)
                        const area = areas.find(a => a.codArea === (ofi.area as Area)?.codArea);
                        const local = locales.find(l => l.codLocal === (area?.local as Local)?.codLocal);
                        
                        return (
                          <div key={idx} className="flex justify-between items-center p-3 bg-blue-50 border border-blue-100 rounded-lg group">
                            <div>
                              <p className="font-bold text-blue-900 text-sm">{ofi.nombreOficina}</p>
                              <p className="text-xs text-blue-600 flex items-center gap-1">
                                <MdDomain size={12}/> {local?.nombreLocal} / {area?.nombreArea}
                              </p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleRemoveOficina(ofi.codOficina!)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition"
                              title="Quitar"
                            >
                              <MdDelete size={18}/>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </form>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition">Cancelar</button>
              <button type="submit" onClick={handleSubmit} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow flex items-center gap-2">
                <MdSave size={18}/> Guardar Custodio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}