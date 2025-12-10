'use client';

import { useEffect, useState, useMemo } from 'react';
import { responsableService, Responsable } from '../../../services/responsable.service';
import { oficinaService, Oficina } from '../../../services/oficina.service';
import { areaService, Area } from '../../../services/area.service';
import { localService, Local } from '../../../services/local.service';
import { 
  MdAdd, MdEdit, MdDelete, MdPerson, MdBusiness, 
  MdLocationOn, MdFilterList, MdClose, MdSave 
} from 'react-icons/md';

// Componentes y Hooks
import { DataTable } from '../../../components/common/DataTable';
import { useTableSearch } from '../../../hooks/useTableSearch';

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

  // Filtros de Tabla
  const [filtroLocal, setFiltroLocal] = useState('');
  const [filtroArea, setFiltroArea] = useState('');

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

  // --- LÓGICA DE FILTRADO PARA LA TABLA ---
  const responsablesFiltradosSelects = useMemo(() => {
    return responsables.filter(resp => {
      const ofi = oficinas.find(o => o.codOficina === (resp.oficina as Oficina)?.codOficina);
      const ar = areas.find(a => a.codArea === (ofi?.area as Area)?.codArea);
      const loc = locales.find(l => l.codLocal === (ar?.local as Local)?.codLocal);

      if (filtroLocal && loc?.codLocal !== Number(filtroLocal)) return false;
      if (filtroArea && ar?.codArea !== Number(filtroArea)) return false;
      return true;
    });
  }, [responsables, filtroLocal, filtroArea, oficinas, areas, locales]);

  // Hook de búsqueda
  const { searchTerm, setSearchTerm, filteredData } = useTableSearch(responsablesFiltradosSelects);

  // --- LÓGICA PARA EL FORMULARIO (CASCADA) ---
  const areasFiltradasForm = formData.codLocal 
    ? areas.filter(a => (a.local as Local)?.codLocal === Number(formData.codLocal))
    : [];
  const oficinasFiltradasForm = formData.codArea
    ? oficinas.filter(o => (o.area as Area)?.codArea === Number(formData.codArea))
    : [];

  // --- HANDLERS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // ✅ Ahora esto funcionará correctamente con el botón vinculado
    
    if (!formData.codOficina) { 
      alert('Seleccione Oficina'); 
      return; 
    }

    const oficinaSelec = oficinas.find(o => o.codOficina === Number(formData.codOficina));
    const areaSelec = areas.find(a => a.codArea === (oficinaSelec?.area as Area)?.codArea);
    const localSelec = locales.find(l => l.codLocal === (areaSelec?.local as Local)?.codLocal);

    // Casting seguro para enviar campos extra sin error de 'any'
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
    
    // Recuperar IDs para pre-llenar selectores
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
    if (confirm('¿Eliminar?')) {
      try { await responsableService.eliminar(id); cargarDatos(); } 
      catch (e) { console.error(e); }
    }
  };

  const openNewModal = () => { setEditingId(null); setFormData(initialFormState); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setFormData(initialFormState); };

  // --- COLUMNAS TABLA ---
  const columns = [
    { header: 'Responsable / Cargo' },
    { header: 'Ubicación' },
    { header: 'ID Interno' },
    { header: 'Acciones', className: 'text-right' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-10">
      
      {/* Header Page */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Custodios</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <MdPerson className="text-gray-400"/> Gestión de personal y asignaciones
          </p>
        </div>
        <button 
          onClick={openNewModal} 
          className="group flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <MdAdd size={22} className="group-hover:rotate-90 transition-transform"/> 
          <span className="font-semibold">Nuevo Responsable</span>
        </button>
      </div>

      {/* Stats (Decorativo) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><MdPerson size={24}/></div>
            <div><p className="text-sm text-gray-500">Total Responsables</p><p className="text-xl font-bold text-gray-800">{responsables.length}</p></div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg"><MdBusiness size={24}/></div>
            <div><p className="text-sm text-gray-500">Oficinas Activas</p><p className="text-xl font-bold text-gray-800">{oficinas.length}</p></div>
         </div>
      </div>

      {/* Tabla Mejorada */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <DataTable
          data={filteredData}
          columns={columns}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          
          filters={
            <div className="flex gap-2 items-center bg-gray-50 p-1 rounded-lg border border-gray-200">
              <div className="text-gray-400 px-2"><MdFilterList/></div>
              <select 
                value={filtroLocal}
                onChange={(e) => { setFiltroLocal(e.target.value); setFiltroArea(''); }} 
                className="bg-transparent text-sm font-medium text-gray-700 py-1.5 px-2 focus:outline-none cursor-pointer hover:text-indigo-600"
              >
                <option value="">Todas las Sedes</option>
                {locales.map(l => <option key={l.codLocal} value={l.codLocal}>{l.nombreLocal}</option>)}
              </select>
              <div className="w-px h-4 bg-gray-300"></div>
              <select 
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 py-1.5 px-2 focus:outline-none cursor-pointer hover:text-indigo-600"
              >
                <option value="">Todas las Áreas</option>
                {areas
                  .filter(a => !filtroLocal || (a.local as Local)?.codLocal === Number(filtroLocal))
                  .map(a => <option key={a.codArea} value={a.codArea}>{a.nombreArea}</option>)}
              </select>
            </div>
          }

          renderRow={(resp) => {
            const ofiId = (resp.oficina as Oficina)?.codOficina;
            const oficinaCompleta = oficinas.find(o => o.codOficina === ofiId);
            const areaId = (oficinaCompleta?.area as Area)?.codArea;
            const areaCompleta = areas.find(a => a.codArea === areaId);
            
            const nombreOficina = oficinaCompleta?.nombreOficina || 'Sin Oficina';
            const nombreArea = areaCompleta?.nombreArea || 'Sin Área';

            return (
              <tr key={resp.codResponsable} className="group hover:bg-indigo-50/50 transition-colors border-b border-gray-100 last:border-0">
                
                {/* Nombre y Avatar */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <UserAvatar name={resp.nombreResponsable} />
                    <div>
                      <p className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {resp.nombreResponsable}
                      </p>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide bg-gray-100 w-fit px-2 py-0.5 rounded mt-1">
                        {resp.cargo || 'Sin Cargo'}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Ubicación */}
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                      <MdBusiness className="text-indigo-400"/>
                      <span className="font-semibold">{nombreOficina}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MdLocationOn className="text-gray-400"/>
                      <span>{nombreArea}</span>
                    </div>
                  </div>
                </td>

                {/* Código */}
                <td className="px-6 py-4">
                  <span className="font-mono text-xs font-bold text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded shadow-sm">
                    {resp.codInterno || 'N/A'}
                  </span>
                </td>

                {/* Acciones */}
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(resp)} 
                      className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 rounded-lg shadow-sm transition-all"
                      title="Editar"
                    >
                      <MdEdit size={18} />
                    </button>
                    <button 
                      onClick={() => resp.codResponsable && handleDelete(resp.codResponsable)} 
                      className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-lg shadow-sm transition-all"
                      title="Eliminar"
                    >
                      <MdDelete size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          }}
        />
      </div>

      {/* Modal Moderno con ID para el submit */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] scale-100 animate-scaleIn">
            
            <div className="bg-white px-8 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-xl text-gray-800">
                  {editingId ? 'Editar Custodio' : 'Nuevo Custodio'}
                </h3>
                <p className="text-sm text-gray-500">Complete la información del personal</p>
              </div>
              <button 
                onClick={closeModal} 
                className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <MdClose size={20}/>
              </button>
            </div>
            
            {/* ✅ AQUÍ ESTÁ LA MAGIA: ID EN EL FORMULARIO */}
            <form id="form-responsable" onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto bg-gray-50/50">
              
              {/* Sección 1 */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider border-b pb-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Información Personal
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nombre Completo <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.nombreResponsable} onChange={(e) => setFormData({ ...formData, nombreResponsable: e.target.value })} required placeholder="Ej. Juan Perez" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all font-medium text-gray-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Cargo</label>
                    <input type="text" value={formData.cargo} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} placeholder="Ej. Analista TI" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Código / DNI</label>
                    <input type="text" value={formData.codInterno} onChange={(e) => setFormData({ ...formData, codInterno: e.target.value })} placeholder="A-001" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all font-mono" />
                  </div>
                </div>
              </div>

              {/* Sección 2 */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 z-0"></div>
                <h4 className="relative z-10 text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider border-b pb-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Asignación de Sede
                </h4>

                <div className="grid grid-cols-1 gap-5 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Local (Sede)</label>
                      <select value={formData.codLocal} onChange={(e) => setFormData({ ...formData, codLocal: e.target.value, codArea: '', codOficina: '' })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none cursor-pointer">
                        <option value="">-- Seleccionar --</option>
                        {locales.map(l => <option key={l.codLocal} value={l.codLocal}>{l.nombreLocal}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Área</label>
                      <select value={formData.codArea} onChange={(e) => setFormData({ ...formData, codArea: e.target.value, codOficina: '' })} disabled={!formData.codLocal} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        <option value="">-- Seleccionar --</option>
                        {areasFiltradasForm.map(a => <option key={a.codArea} value={a.codArea}>{a.nombreArea}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-indigo-600 mb-1 uppercase">Oficina Final <span className="text-red-500">*</span></label>
                    <select value={formData.codOficina} onChange={(e) => setFormData({ ...formData, codOficina: e.target.value })} disabled={!formData.codArea} required className="w-full px-4 py-3 bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none cursor-pointer disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400">
                      <option value="">-- Seleccionar Oficina --</option>
                      {oficinasFiltradasForm.map(o => <option key={o.codOficina} value={o.codOficina}>{o.nombreOficina}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer con Botones Nativos */}
            <div className="bg-white p-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button onClick={closeModal} className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
              
              {/* ✅ BOTÓN DE SUBMIT VINCULADO POR ID AL FORMULARIO */}
              <button 
                type="submit" 
                form="form-responsable" 
                className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <MdSave size={20}/> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}