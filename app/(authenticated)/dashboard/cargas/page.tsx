'use client';

import { useEffect, useState, useRef } from 'react';
import { cargaService, Carga, RangoDistribucion } from '../../../services/carga.service'; 
// ✅ CAMBIO: Usamos ResponsableService en lugar de UsuarioService
import { responsableService, Responsable } from '../../../services/responsable.service';
import { configuracionService, CampoConfig } from '../../../services/configuracion.service'; 
import * as XLSX from 'xlsx';
import { 
  MdAdd, MdAssignmentInd, MdCloudUpload, MdInsertDriveFile, 
  MdCheckCircle, MdArrowForward, MdLink,
  MdVisibility, MdVisibilityOff, MdPriorityHigh, MdCheck,
  MdDelete 
} from 'react-icons/md';

export default function CargasPage() {
  const [cargas, setCargas] = useState<Carga[]>([]);
  // ✅ Estado para Responsables (Juan Perez, Jesus Rojas...)
  const [responsables, setResponsables] = useState<Responsable[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [camposDinamicos, setCamposDinamicos] = useState<CampoConfig[]>([]);

  // Modales y Estados
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Estados para Importación
  const [step, setStep] = useState(1);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [mapeo, setMapeo] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [descripcion, setDescripcion] = useState('');
  const [selectedCarga, setSelectedCarga] = useState<Carga | null>(null);

  // ✅ ESTADOS PARA DISTRIBUCIÓN DE RESPONSABLES
  const [totalItems, setTotalItems] = useState(0);
  const [distribuciones, setDistribuciones] = useState<(RangoDistribucion & { nombreResponsable: string })[]>([]);
  const [rangoActual, setRangoActual] = useState({ inicio: 1, fin: 0 });
  const [responsableSelec, setResponsableSelec] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await cargaService.listarTodas();
      setCargas(data.sort((a, b) => (b.codCarga || 0) - (a.codCarga || 0)));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await cargaService.crear(descripcion);
      setShowCreateModal(false);
      setDescripcion('');
      cargarDatos();
    } catch (error) {
      alert('Error al crear la carga');
    }
  };

  // --- LÓGICA DE IMPORTACIÓN DINÁMICA ---
  const openUploadModal = async (carga: Carga) => {
    try {
      const campos = await configuracionService.obtenerCampos();
      setCamposDinamicos(campos.filter(c => c.esVisible));
      
      setSelectedCarga(carga);
      setSelectedFile(null);
      setStep(1);
      setMapeo({});
      setShowUploadModal(true);
    } catch (error) {
      console.error(error);
      alert('Error al cargar la configuración de campos.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length > 0) {
        const headers = jsonData[0] as string[];
        setExcelHeaders(headers);
        
        const autoMap: Record<string, string> = {};
        camposDinamicos.forEach(campo => {
           const match = headers.find(h => h.toLowerCase().includes(campo.etiquetaUsuario.toLowerCase().split(' ')[0]));
           if (match) autoMap[campo.nombreCampoBd] = match;
        });
        setMapeo(autoMap);
        setStep(2);
      }
    }
  };

  const toggleConfig = (idCampo: number, key: 'esVisible' | 'esObligatorio') => {
    setCamposDinamicos(prev => prev.map(campo => {
      if (campo.id === idCampo) return { ...campo, [key]: !campo[key] };
      return campo;
    }));
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCarga?.codCarga) return;

    const faltantes = camposDinamicos.filter(c => c.esObligatorio && !mapeo[c.nombreCampoBd]);
    if (faltantes.length > 0) {
      alert(`Faltan mapear columnas OBLIGATORIAS: ${faltantes.map(f => f.etiquetaUsuario).join(', ')}`);
      return;
    }

    setUploading(true);
    try {
      const res = await cargaService.subirArchivoConMapeo(
          selectedCarga.codCarga, 
          selectedFile, 
          mapeo,
          camposDinamicos 
      );
      
      alert(`¡Importación Exitosa!\nProcesados: ${res.totalProcesados}\n${res.errores?.length ? 'Errores: ' + res.errores.length : ''}`);
      setShowUploadModal(false);
      cargarDatos();
    } catch (error) {
      console.error(error);
      alert('Error en el servidor al procesar el archivo.');
    } finally {
      setUploading(false);
    }
  };

  // --- 🔥 LÓGICA DE DISTRIBUCIÓN DE RESPONSABLES ---

  const openAssignModal = async (carga: Carga) => {
    try {
      // 1. Cargar RESPONSABLES (Juan Perez, etc.)
      if (responsables.length === 0) {
        const data = await responsableService.listarActivos();
        setResponsables(data); // Asegúrate que responsableService devuelva Responsable[]
      }

      // 2. Obtener total de filas de la carga
      const total = await cargaService.obtenerConteo(carga.codCarga!); 
      
      setTotalItems(total);
      setDistribuciones([]);
      setRangoActual({ inicio: 1, fin: total });
      setResponsableSelec('');
      
      setSelectedCarga(carga);
      setShowAssignModal(true);
    } catch (error) {
      console.error(error);
      alert('Error al cargar datos para asignación. Verifique conexión.');
    }
  };

  const agregarRango = () => {
    if (!responsableSelec) return alert("Selecciona un responsable");
    if (rangoActual.fin > totalItems) return alert(`No puedes superar el total de ${totalItems} ítems`);
    if (rangoActual.inicio > rangoActual.fin) return alert("El inicio no puede ser mayor al fin");

    // Buscar el objeto responsable completo para obtener su nombre
    const respObj = responsables.find(r => r.codResponsable === Number(responsableSelec));

    const nuevaDist = {
      inicio: rangoActual.inicio,
      fin: rangoActual.fin,
      codResponsable: Number(responsableSelec), // ✅ Usamos codResponsable
      nombreResponsable: respObj?.nombreResponsable || 'Desconocido' // ✅ Mostramos nombre
    };

    setDistribuciones([...distribuciones, nuevaDist]);
    
    // Cálculo inteligente siguiente rango
    if (rangoActual.fin < totalItems) {
      setRangoActual({
        inicio: rangoActual.fin + 1,
        fin: totalItems 
      });
      setResponsableSelec(''); 
    } else {
      setRangoActual({ inicio: 0, fin: 0 }); 
    }
  };

  const eliminarUltimoRango = () => {
    if (distribuciones.length === 0) return;
    const nuevaLista = [...distribuciones];
    const eliminado = nuevaLista.pop();
    setDistribuciones(nuevaLista);
    
    if (eliminado) {
      setRangoActual({ inicio: eliminado.inicio, fin: totalItems });
    }
  };

  const guardarDistribucion = async () => {
    if (!selectedCarga?.codCarga) return;
    try {
      // Enviamos solo lo que el Backend (DTO) necesita: { inicio, fin, codResponsable }
      const payload = distribuciones.map(({ inicio, fin, codResponsable }) => ({ inicio, fin, codResponsable }));
      
      await cargaService.distribuir(selectedCarga.codCarga, payload);
      
      alert("¡Responsables asignados correctamente!");
      setShowAssignModal(false);
      cargarDatos();
    } catch (error) {
      console.error(error);
      alert("Error al guardar la distribución");
    }
  };

  const renderEstado = (estado: string) => {
    switch (estado) {
      case 'C': return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold border border-gray-200">Creada</span>;
      case 'A': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold border border-blue-200">Asignada</span>;
      case 'T': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold border border-green-200">Terminada</span>;
      default: return estado;
    }
  };

  return (
    <div className="space-y-6">
       
       <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Cargas</h1>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md font-medium">
          <MdAdd size={20} /> Nueva Carga
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-10 text-gray-500">Cargando...</div>
        ) : cargas.map((carga) => (
          <div key={carga.codCarga} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 text-blue-600 font-mono text-xs px-2 py-1 rounded border border-blue-100 font-bold">ID: {carga.codCarga}</div>
                {renderEstado(carga.estado || 'C')}
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-1">{carga.descripcion}</h3>
              <p className="text-sm text-gray-500 mb-4">📅 {carga.fecha}</p>
            </div>
            <div className="border-t pt-4 flex flex-col gap-2">
              
              {carga.estado?.trim() === 'C' && (
                <button 
                  onClick={() => openUploadModal(carga)}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-2.5 rounded-lg hover:bg-emerald-100 transition text-sm font-medium border border-emerald-100"
                >
                  <MdCloudUpload size={18} /> Importar Excel
                </button>
              )}

              {carga.estado?.trim() !== 'T' && (
                <button 
                  onClick={() => openAssignModal(carga)}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 py-2.5 rounded-lg hover:bg-indigo-100 transition text-sm font-medium border border-indigo-100"
                >
                  <MdAssignmentInd size={18} /> Asignar Responsable
                </button>
              )}
              
              {carga.estado?.trim() === 'T' && (
                 <div className="text-center text-sm text-green-600 font-medium py-2 flex items-center justify-center gap-1">
                    <MdCheckCircle/> Inventario Completado
                 </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL DE IMPORTACIÓN --- */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-emerald-900 flex items-center gap-2">
                <MdCloudUpload /> Importación Masiva
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-emerald-400 hover:text-emerald-600 text-2xl">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {step === 1 && (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-emerald-500 hover:bg-emerald-50 transition cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />
                  <div className="flex flex-col items-center text-gray-400 group-hover:text-emerald-600">
                    <MdInsertDriveFile size={64} className="mb-4" />
                    <span className="font-medium text-lg">Seleccionar Excel (.xlsx)</span>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 flex items-start gap-2">
                    <MdLink className="mt-1" size={18}/>
                    <div>
                        <p className="font-bold">Configuración de Importación</p>
                        <p>Relacione las columnas y configure qué datos serán visibles en la App.</p>
                    </div>
                  </div>

                  <div className="space-y-3 pr-2">
                    {camposDinamicos.map((campo) => (
                      <div key={campo.id} className="flex flex-col md:flex-row items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition bg-white shadow-sm">
                        
                        <div className="w-full md:w-1/3">
                          <p className="font-bold text-gray-800 text-sm flex items-center gap-2">{campo.etiquetaUsuario}</p>
                          <p className="text-xs text-gray-400 font-mono">DB: {campo.nombreCampoBd}</p>
                        </div>
                        
                        <div className="w-full md:w-1/3">
                          <select
                            value={mapeo[campo.nombreCampoBd] || ''}
                            onChange={(e) => setMapeo({...mapeo, [campo.nombreCampoBd]: e.target.value})}
                            className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition focus:ring-2 ${campo.esObligatorio && !mapeo[campo.nombreCampoBd] ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-emerald-500 bg-white'}`}
                          >
                            <option value="">-- Ignorar --</option>
                            {excelHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                          </select>
                          {campo.esObligatorio && !mapeo[campo.nombreCampoBd] && (
                            <p className="text-[10px] text-red-500 mt-1 font-bold">⚠️ Requerido</p>
                          )}
                        </div>

                        <div className="w-full md:w-1/3 flex justify-end gap-6">
                          <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => toggleConfig(campo.id, 'esVisible')}>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Visible</span>
                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${campo.esVisible ? 'bg-blue-600' : 'bg-gray-200'}`}>
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${campo.esVisible ? 'translate-x-6' : 'translate-x-1'}`} />
                            </div>
                            <span className={`text-[10px] font-medium ${campo.esVisible ? 'text-blue-600' : 'text-gray-400'}`}>{campo.esVisible ? 'SÍ' : 'NO'}</span>
                          </div>

                          <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => toggleConfig(campo.id, 'esObligatorio')}>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Obligatorio</span>
                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${campo.esObligatorio ? 'bg-red-500' : 'bg-gray-200'}`}>
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${campo.esObligatorio ? 'translate-x-6' : 'translate-x-1'}`} />
                            </div>
                            <span className={`text-[10px] font-medium ${campo.esObligatorio ? 'text-red-600' : 'text-gray-400'}`}>{campo.esObligatorio ? 'SÍ' : 'NO'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 shrink-0 flex gap-3">
              {step === 2 && <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">Atrás</button>}
              <div className="flex-1"></div>
              <button onClick={() => setShowUploadModal(false)} className="px-6 py-2 bg-white border text-gray-700 rounded-lg hover:bg-gray-100 font-medium">Cancelar</button>
              {step === 2 && (
                <button onClick={handleUpload} disabled={uploading} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-md disabled:opacity-50">
                  {uploading ? 'Procesando...' : 'Confirmar Importación'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- 🔥 NUEVO MODAL DE DISTRIBUCIÓN DE RESPONSABLES --- */}
      {showAssignModal && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
               
               <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center shrink-0 rounded-t-xl">
                  <div>
                    <h3 className="font-bold text-lg text-white flex items-center gap-2">
                       <MdAssignmentInd className="text-indigo-200"/> Asignar Responsables
                    </h3>
                    <p className="text-indigo-200 text-xs mt-0.5">Asigne quién es el responsable (custodio) de cada bloque de activos.</p>
                  </div>
                  <button onClick={() => setShowAssignModal(false)} className="text-white hover:text-indigo-200 text-2xl">&times;</button>
               </div>
               
               <div className="p-6 overflow-y-auto space-y-6">
                  
                  {/* Barra de Progreso */}
                  <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
                        <span>Progreso de Asignación</span>
                        <span>{distribuciones.length > 0 ? distribuciones[distribuciones.length - 1].fin : 0} / {totalItems} ítems</span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                       <div className="bg-indigo-600 h-3 rounded-full transition-all duration-500" style={{ width: `${Math.min(((distribuciones.length > 0 ? distribuciones[distribuciones.length - 1].fin : 0) / totalItems) * 100, 100)}%` }}></div>
                    </div>
                  </div>

                  {/* Panel de Acción */}
                  {rangoActual.inicio <= totalItems ? (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                         
                         <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Desde</label>
                            <input type="text" value={rangoActual.inicio} disabled className="w-full p-2.5 text-center font-bold text-gray-500 bg-gray-200 rounded-lg border border-gray-300 cursor-not-allowed"/>
                         </div>

                         <div className="md:col-span-3">
                            <label className="text-[10px] font-bold text-indigo-600 uppercase">Hasta (Fila)</label>
                            <input type="number" min={rangoActual.inicio} max={totalItems} value={rangoActual.fin} onChange={(e) => setRangoActual({ ...rangoActual, fin: Number(e.target.value) })} className="w-full p-2.5 text-center font-bold text-gray-800 bg-white rounded-lg border-2 border-indigo-200 focus:border-indigo-500 outline-none"/>
                         </div>

                         <div className="md:col-span-5">
                            <label className="text-[10px] font-bold text-indigo-600 uppercase">Responsable (Custodio)</label>
                            <select 
                               value={responsableSelec} 
                               onChange={(e) => setResponsableSelec(e.target.value)}
                               className="w-full p-2.5 font-medium text-gray-700 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                               <option value="">-- Seleccionar --</option>
                               {/* ✅ ITERAMOS RESPONSABLES */}
                               {responsables.map(r => (
                                 <option key={r.codResponsable} value={r.codResponsable}>
                                    {r.nombreResponsable} {r.cargo ? `(${r.cargo})` : ''}
                                 </option>
                               ))}
                            </select>
                         </div>

                         <div className="md:col-span-2">
                            <button onClick={agregarRango} className="w-full p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md flex justify-center"><MdAdd size={24}/></button>
                         </div>
                      </div>
                  ) : (
                      <div className="bg-green-100 text-green-800 p-4 rounded-xl border border-green-200 flex items-center justify-center gap-2 font-bold">
                          <MdCheckCircle size={24}/> ¡Todos los ítems asignados!
                      </div>
                  )}

                  {/* Tabla de Resultados */}
                  {distribuciones.length > 0 && (
                     <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                           <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                              <tr>
                                 <th className="px-4 py-3">Rango</th>
                                 <th className="px-4 py-3">Cant.</th>
                                 <th className="px-4 py-3">Responsable Asignado</th>
                                 <th className="px-4 py-3 text-right">Acción</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100">
                              {distribuciones.map((d, idx) => (
                                 <tr key={idx} className="bg-white hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono text-indigo-600 font-bold">#{d.inicio} ➔ #{d.fin}</td>
                                    <td className="px-4 py-3 text-gray-600">{d.fin - d.inicio + 1}</td>
                                    <td className="px-4 py-3 font-bold text-gray-800">{d.nombreResponsable}</td>
                                    <td className="px-4 py-3 text-right">
                                       {idx === distribuciones.length - 1 && (
                                          <button onClick={eliminarUltimoRango} className="text-red-400 hover:text-red-600 p-1"><MdDelete size={20}/></button>
                                       )}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  )}
               </div>

               <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                   <button onClick={() => setShowAssignModal(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">Cancelar</button>
                   <button onClick={guardarDistribucion} disabled={distribuciones.length === 0} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg disabled:opacity-50">Confirmar</button>
               </div>
            </div>
         </div>
      )}

       {/* ... Modal Crear ... */}
       {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
              <h3 className="font-bold text-lg mb-4">Nueva Carga</h3>
              <form onSubmit={handleCreate}>
                  <input type="text" required autoFocus value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción" className="w-full border p-2 rounded mb-4" />
                  <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-100 rounded">Cancelar</button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Crear</button>
                  </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}