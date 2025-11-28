'use client';

import { useEffect, useState, useRef } from 'react';
import { cargaService, Carga } from '../../../services/carga.service';
import { usuarioService, Usuario } from '../../../services/usuario.service';
import { 
  MdAdd, 
  MdAssignmentInd, 
  MdCloudUpload,
  MdInsertDriveFile,
  MdCheckCircle
} from 'react-icons/md';

export default function CargasPage() {
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Estados de formularios
  const [descripcion, setDescripcion] = useState('');
  const [selectedCarga, setSelectedCarga] = useState<Carga | null>(null);
  const [selectedUsuario, setSelectedUsuario] = useState('');

  // Estados para subida de archivo
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const openUploadModal = (carga: Carga) => {
    setSelectedCarga(carga);
    setSelectedFile(null);
    setShowUploadModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCarga?.codCarga) return;

    setUploading(true);
    try {
      await cargaService.subirArchivo(selectedCarga.codCarga, selectedFile);
      
      alert('¡Archivo procesado exitosamente!');
      setShowUploadModal(false);
      cargarDatos();
    } catch (error) {
      console.error(error);
      alert('Error al subir el archivo. Verifique el formato.');
    } finally {
      setUploading(false);
    }
  };

  const openAssignModal = async (carga: Carga) => {
    try {
      if (usuarios.length === 0) {
        const users = await usuarioService.listarTodos();
        setUsuarios(users);
      }
      setSelectedCarga(carga);
      setSelectedUsuario('');
      setShowAssignModal(true);
    } catch (error) {
      alert('Error al cargar usuarios');
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarga?.codCarga || !selectedUsuario) return;

    try {
      await cargaService.asignar(selectedCarga.codCarga, Number(selectedUsuario));
      setShowAssignModal(false);
      cargarDatos();
      alert('Carga asignada correctamente');
    } catch (error) {
      console.error(error);
      alert('Error al asignar la carga');
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
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Cargas</h1>
          <p className="text-gray-500">Lotes de inventario y asignación</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md font-medium">
          <MdAdd size={20} /> Nueva Carga
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-10 text-gray-500">Cargando cargas...</div>
        ) : cargas.map((carga) => (
          <div key={carga.codCarga} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition duration-200">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 text-blue-600 font-mono text-xs px-2 py-1 rounded border border-blue-100 font-bold">
                  ID: {carga.codCarga}
                </div>
                {renderEstado(carga.estado || 'C')}
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-1" title={carga.descripcion}>{carga.descripcion}</h3>
              <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                📅 {carga.fecha || 'Sin fecha'}
              </p>
            </div>

            <div className="border-t pt-4 flex flex-col gap-2">
              {carga.estado === 'C' && (
                <button 
                  onClick={() => openUploadModal(carga)}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-2.5 rounded-lg hover:bg-emerald-100 transition text-sm font-medium border border-emerald-100"
                >
                  <MdCloudUpload size={18} /> Importar Excel/XML
                </button>
              )}

              {carga.estado !== 'T' && (
                <button 
                  onClick={() => openAssignModal(carga)}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 py-2.5 rounded-lg hover:bg-indigo-100 transition text-sm font-medium border border-indigo-100"
                >
                  <MdAssignmentInd size={18} /> Asignar Usuario
                </button>
              )}
              
              {carga.estado === 'T' && (
                 <div className="text-center text-sm text-green-600 font-medium py-2 flex items-center justify-center gap-1">
                    <MdCheckCircle/> Inventario Completado
                 </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CREAR */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between">
              <h3 className="font-bold text-lg text-gray-800">Nueva Carga</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input 
                  type="text" required autoFocus
                  value={descripcion} 
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Ej: Inventario Sede Norte - 2025"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Crear</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUBIR ARCHIVO */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-emerald-900 flex items-center gap-2">
                <MdCloudUpload /> Carga Masiva de Datos
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-emerald-400 hover:text-emerald-600 text-2xl">&times;</button>
            </div>
            
            <div className="p-8 space-y-6">
              <p className="text-sm text-gray-600">
                Seleccione el archivo <strong>Excel (.xlsx)</strong> o <strong>XML</strong> para poblar la carga: 
                <span className="font-semibold block text-gray-800 mt-1">{selectedCarga?.descripcion}</span>
              </p>

              <div 
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-emerald-500 hover:bg-emerald-50 transition cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls, .xml"
                  className="hidden" 
                />
                
                {selectedFile ? (
                  <div className="flex flex-col items-center text-emerald-600">
                    <MdInsertDriveFile size={48} className="mb-2" />
                    <span className="font-medium text-lg">{selectedFile.name}</span>
                    <span className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-400 group-hover:text-emerald-600">
                    <MdCloudUpload size={48} className="mb-2" />
                    <span className="font-medium">Haga clic para seleccionar archivo</span>
                    <span className="text-xs mt-1">Soporta .xlsx y .xml</span>
                  </div>
                )}
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-gray-600">
                    <span>Procesando archivo...</span>
                    <span>Por favor espere</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-emerald-500 h-2.5 rounded-full animate-pulse w-full"></div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowUploadModal(false)} 
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || uploading}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Subiendo...' : 'Procesar Carga'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ASIGNAR */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100">
              <h3 className="font-bold text-lg text-indigo-900">Asignar Inventariador</h3>
              <p className="text-xs text-indigo-600 mt-0.5">Carga: {selectedCarga?.descripcion}</p>
            </div>
            <form onSubmit={handleAssign} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario *</label>
                <select required value={selectedUsuario} onChange={e => setSelectedUsuario(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none bg-white">
                  <option value="">-- Seleccionar --</option>
                  {usuarios.map(u => <option key={u.codUsuario} value={u.codUsuario}>{u.nombreCompleto}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg">Asignar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}