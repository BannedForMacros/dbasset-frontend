'use client';

import { useEffect, useState, useMemo } from 'react';
import { activoService, Activo } from '../../../services/activo.service';
import { localService, Local } from '../../../services/local.service';
import { areaService, Area } from '../../../services/area.service';
import { oficinaService, Oficina } from '../../../services/oficina.service';
import { responsableService, Responsable } from '../../../services/responsable.service';
import { estadoService, Estado } from '../../../services/estado.service';
import { 
  MdAdd, MdEdit, MdDelete, MdQrCode, MdBusiness, 
  MdLocationOn, MdPerson, MdCheckCircle, MdInventory, MdFilterList, MdClose, MdSave 
} from 'react-icons/md';

// Imports Reutilizables
import { DataTable } from '../../../components/common/DataTable';
import { useTableSearch } from '../../../hooks/useTableSearch';

export default function ActivosPage() {
  // --- ESTADOS ---
  const [activos, setActivos] = useState<Activo[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Filtros
  const [filtroLocal, setFiltroLocal] = useState('');
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroOficina, setFiltroOficina] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

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

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [activosData, locData, areaData, ofiData, respData, estData] = await Promise.all([
        activoService.listarTodos(),
        localService.listarActivos(),
        areaService.listarActivos(),
        oficinaService.listarActivos(),
        responsableService.listarActivos(),
        estadoService.listarTodos()
      ]);

      // Nota: Si ya actualizaste el backend, activosData vendrá ordenado.
      // Si no, puedes ordenarlo aquí también:
      // activosData.sort((a, b) => (b.id || 0) - (a.id || 0));
      
      setActivos(activosData);
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

  // --- LÓGICA DE FILTRADO ---
  const activosFiltradosSelects = useMemo(() => {
    return activos.filter(item => {
      const idLocal = (item.local as Local)?.codLocal;
      const idArea = (item.area as Area)?.codArea;
      const idOficina = (item.oficina as Oficina)?.codOficina;
      const idEstado = (item.estado as Estado)?.codEstado;

      if (filtroLocal && idLocal !== Number(filtroLocal)) return false;
      if (filtroArea && idArea !== Number(filtroArea)) return false;
      if (filtroOficina && idOficina !== Number(filtroOficina)) return false;
      if (filtroEstado && idEstado !== Number(filtroEstado)) return false;

      return true;
    });
  }, [activos, filtroLocal, filtroArea, filtroOficina, filtroEstado]);

  const { searchTerm, setSearchTerm, filteredData } = useTableSearch(activosFiltradosSelects);

  // --- LÓGICA CASCADA PARA SELECTS ---
  const areasParaFiltro = filtroLocal ? areas.filter(a => (a.local as Local)?.codLocal === Number(filtroLocal)) : areas;
  const oficinasParaFiltro = filtroArea ? oficinas.filter(o => (o.area as Area)?.codArea === Number(filtroArea)) : oficinas;

  const areasParaForm = formData.codLocal ? areas.filter(a => (a.local as Local)?.codLocal === Number(formData.codLocal)) : [];
  const oficinasParaForm = formData.codArea ? oficinas.filter(o => (o.area as Area)?.codArea === Number(formData.codArea)) : [];

  // --- HANDLERS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codLocal || !formData.codArea || !formData.codOficina || !formData.codResponsable || !formData.codEstado) {
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
      } catch (error) { console.error(error); }
    }
  };

  const openNewModal = () => { setEditingId(null); setFormData(initialFormState); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setFormData(initialFormState); };

  // --- COLUMNAS (Incluyendo #) ---
  const columns = [
    { header: '#', className: 'text-center w-12 text-gray-400' }, // ✅ COLUMNA DE NUMERACIÓN
    { header: 'Bien / Código' },
    { header: 'Detalles' },
    { header: 'Custodio' },
    { header: 'Ubicación' },
    { header: 'Estado' },
    { header: 'Acciones', className: 'text-right' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1600px] mx-auto pb-10">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Activos Fijos</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <MdInventory className="text-gray-400"/> Inventario general
          </p>
        </div>
        <button onClick={openNewModal} className="group flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-xl transform hover:-translate-y-0.5">
          <MdAdd size={22} className="group-hover:rotate-90 transition-transform"/> 
          <span className="font-semibold">Nuevo Activo</span>
        </button>
      </div>

      {/* ✅ STATS CARDS ARREGLADAS: grid-cols-2 en vez de 4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
         <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><MdInventory size={32}/></div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Activos</p>
                <p className="text-3xl font-bold text-gray-800">{activos.length}</p>
              </div>
            </div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl"><MdCheckCircle size={32}/></div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Asignados</p>
                <div className="flex items-baseline gap-2">
                   <p className="text-3xl font-bold text-gray-800">{activos.filter(a => a.responsable).length}</p>
                   <p className="text-sm text-gray-400 font-medium">/ {activos.length}</p>
                </div>
              </div>
            </div>
            <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden hidden sm:block">
               <div className="bg-green-500 h-full" style={{width: `${(activos.length > 0 ? (activos.filter(a => a.responsable).length / activos.length) * 100 : 0)}%`}}></div>
            </div>
         </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <DataTable
          data={filteredData}
          columns={columns}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          
          filters={
            <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-1.5 rounded-lg border border-gray-200">
              <div className="text-gray-400 px-2"><MdFilterList/></div>
              <select value={filtroLocal} onChange={(e) => { setFiltroLocal(e.target.value); setFiltroArea(''); setFiltroOficina(''); }} className="bg-transparent text-sm font-medium text-gray-700 py-1.5 px-2 focus:outline-none cursor-pointer hover:text-indigo-600 max-w-[150px]">
                <option value="">Todas las Sedes</option>
                {locales.map(l => <option key={l.codLocal} value={l.codLocal}>{l.nombreLocal}</option>)}
              </select>
              <div className="w-px h-4 bg-gray-300"></div>
              <select value={filtroArea} onChange={(e) => { setFiltroArea(e.target.value); setFiltroOficina(''); }} className="bg-transparent text-sm font-medium text-gray-700 py-1.5 px-2 focus:outline-none cursor-pointer hover:text-indigo-600 max-w-[150px]">
                <option value="">Todas las Áreas</option>
                {areasParaFiltro.map(a => <option key={a.codArea} value={a.codArea}>{a.nombreArea}</option>)}
              </select>
              <div className="w-px h-4 bg-gray-300"></div>
              <select value={filtroOficina} onChange={(e) => setFiltroOficina(e.target.value)} className="bg-transparent text-sm font-medium text-gray-700 py-1.5 px-2 focus:outline-none cursor-pointer hover:text-indigo-600 max-w-[150px]">
                <option value="">Todas las Oficinas</option>
                {oficinasParaFiltro.map(o => <option key={o.codOficina} value={o.codOficina}>{o.nombreOficina}</option>)}
              </select>
              <div className="w-px h-4 bg-gray-300"></div>
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="bg-transparent text-sm font-medium text-gray-700 py-1.5 px-2 focus:outline-none cursor-pointer hover:text-indigo-600">
                <option value="">Todos los Estados</option>
                {estados.map(e => <option key={e.codEstado} value={e.codEstado}>{e.nombreEstado}</option>)}
              </select>
            </div>
          }

          // ✅ RENDER ROW CON ÍNDICE Y DISEÑO MEJORADO
          renderRow={(item, index) => (
            <tr key={item.id} className="group hover:bg-indigo-50/50 transition-colors border-b border-gray-100 last:border-0">
              
              {/* Columna: # (Numeración) */}
              <td className="px-6 py-4 text-center font-mono text-xs text-gray-400 font-bold">
                {index + 1}
              </td>

              {/* Columna: Bien */}
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{item.descripcion}</span>
                  <span className="font-mono text-xs text-gray-500 bg-gray-100 w-fit px-1.5 py-0.5 rounded border border-gray-200 mt-1">
                    {item.codActivo}
                  </span>
                </div>
              </td>

              {/* Columna: Detalles */}
              <td className="px-6 py-4 text-sm text-gray-600">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold">{item.marca}</span>
                  <span className="text-xs text-gray-500">{item.modelo}</span>
                  {item.serie && <span className="text-[10px] text-gray-400 font-mono">SN: {item.serie}</span>}
                </div>
              </td>

              {/* Columna: Responsable */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-500 rounded-full"><MdPerson size={14}/></div>
                  <span className="text-sm font-medium text-gray-700">
                    {(item.responsable as Responsable)?.nombreResponsable || 'No Asignado'}
                  </span>
                </div>
              </td>

              {/* Columna: Ubicación */}
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-sm text-gray-800 font-semibold">
                    <MdBusiness className="text-indigo-400"/>
                    {(item.oficina as Oficina)?.nombreOficina}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-5">
                    {(item.local as Local)?.nombreLocal}
                  </div>
                </div>
              </td>

              {/* Columna: Estado */}
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  (item.estado as Estado)?.nombreEstado?.toLowerCase().includes('bueno') 
                    ? 'bg-green-50 text-green-700 border-green-100' 
                    : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                }`}>
                  {(item.estado as Estado)?.nombreEstado}
                </span>
              </td>

              {/* Columna: Acciones */}
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(item)} className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 rounded-lg shadow-sm transition-all" title="Editar">
                    <MdEdit size={18} />
                  </button>
                  <button onClick={() => item.id && handleDelete(item.id)} className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-lg shadow-sm transition-all" title="Eliminar">
                    <MdDelete size={18} />
                  </button>
                </div>
              </td>
            </tr>
          )}
        />
      </div>

      {/* Modal Grande para Formulario (Con ID para submit limpio) */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] scale-100 animate-scaleIn">
            
            <div className="bg-white px-8 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-xl text-gray-800">{editingId ? 'Editar Activo' : 'Nuevo Activo'}</h3>
                <p className="text-sm text-gray-500">Complete la ficha técnica del bien</p>
              </div>
              <button onClick={closeModal} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                <MdClose size={20}/>
              </button>
            </div>
            
            <form id="form-activo" onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto bg-gray-50/50">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* COLUMNA 1: Datos Técnicos */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider border-b pb-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Identificación del Bien
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Código Activo <span className="text-red-500">*</span></label>
                        <input type="text" required value={formData.codActivo} onChange={(e) => setFormData({...formData, codActivo: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all font-mono" placeholder="Ej. ACT-001" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Código Interno</label>
                        <input type="text" value={formData.codInterno} onChange={(e) => setFormData({...formData, codInterno: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all font-mono" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Descripción <span className="text-red-500">*</span></label>
                      <input type="text" required value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all" placeholder="Ej. Laptop HP ProBook" />
                    </div>
                  </div>

                  {/* Resto de campos técnicos... (Igual que tu código anterior pero con estilos) */}
                  {/* He resumido esta parte para que el código no sea tan extenso, usa el mismo estilo que el bloque anterior */}
                  {/* ... */}
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider border-b pb-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-teal-500"></span> Detalles Técnicos
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Marca, Modelo, Serie, Color, Año, Fecha Compra */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Marca</label>
                        <input type="text" value={formData.marca} onChange={(e) => setFormData({...formData, marca: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Modelo</label>
                        <input type="text" value={formData.modelo} onChange={(e) => setFormData({...formData, modelo: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Serie</label>
                        <input type="text" value={formData.serie} onChange={(e) => setFormData({...formData, serie: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white outline-none font-mono" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Color</label>
                        <input type="text" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Año</label>
                        <input type="text" value={formData.anio} onChange={(e) => setFormData({...formData, anio: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Fecha Compra</label>
                        <input type="date" value={formData.fechaCompra} onChange={(e) => setFormData({...formData, fechaCompra: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white outline-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMNA 2: Ubicación y Asignación */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full -mr-10 -mt-10 z-0"></div>
                    <h4 className="relative z-10 text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider border-b pb-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span> Ubicación Física
                    </h4>

                    <div className="space-y-4 relative z-10">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Local (Sede) <span className="text-red-500">*</span></label>
                        <select required value={formData.codLocal} onChange={(e) => setFormData({...formData, codLocal: e.target.value, codArea: '', codOficina: ''})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none cursor-pointer">
                          <option value="">-- Seleccionar --</option>
                          {locales.map(l => <option key={l.codLocal} value={l.codLocal}>{l.nombreLocal}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Área <span className="text-red-500">*</span></label>
                        <select required value={formData.codArea} onChange={(e) => setFormData({...formData, codArea: e.target.value, codOficina: ''})} disabled={!formData.codLocal} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none disabled:bg-gray-100 cursor-pointer">
                          <option value="">{formData.codLocal ? '-- Seleccionar --' : '-- Elija Local --'}</option>
                          {areasParaForm.map(a => <option key={a.codArea} value={a.codArea}>{a.nombreArea}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Oficina <span className="text-red-500">*</span></label>
                        <select required value={formData.codOficina} onChange={(e) => setFormData({...formData, codOficina: e.target.value})} disabled={!formData.codArea} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none disabled:bg-gray-100 cursor-pointer">
                          <option value="">{formData.codArea ? '-- Seleccionar --' : '-- Elija Área --'}</option>
                          {oficinasParaForm.map(o => <option key={o.codOficina} value={o.codOficina}>{o.nombreOficina}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider border-b pb-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span> Asignación
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Responsable (Custodio) <span className="text-red-500">*</span></label>
                        <select required value={formData.codResponsable} onChange={(e) => setFormData({...formData, codResponsable: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none cursor-pointer">
                          <option value="">-- Seleccionar --</option>
                          {responsables.map(r => <option key={r.codResponsable} value={r.codResponsable}>{r.nombreResponsable}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Estado Físico <span className="text-red-500">*</span></label>
                        <select required value={formData.codEstado} onChange={(e) => setFormData({...formData, codEstado: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none cursor-pointer">
                          <option value="">-- Seleccionar --</option>
                          {estados.map(e => <option key={e.codEstado} value={e.codEstado}>{e.nombreEstado}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </form>

            <div className="bg-white p-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button onClick={closeModal} className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
              <button 
                type="submit" 
                form="form-activo" 
                className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <MdSave size={20}/> Guardar Activo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}