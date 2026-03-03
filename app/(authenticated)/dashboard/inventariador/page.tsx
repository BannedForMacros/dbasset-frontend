'use client';

import { useEffect, useState, useMemo } from 'react';
import { AxiosError } from 'axios';
import { inventariadorService, Inventariador } from '../../../services/inventariador.service';
import { 
  MdAdd, MdEdit, MdDelete, MdSearch, 
  MdClose, MdSave, MdAssignmentInd, MdEmail, 
  MdPhone, MdBadge, MdLock, MdVisibility, MdVisibilityOff
} from 'react-icons/md';

// --- COMPONENTE AVATAR ---
const UserAvatar = ({ name }: { name: string }) => {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-700 text-xs font-bold border border-green-200">
      {initials}
    </div>
  );
};

export default function InventariadoresPage() {
  // --- ESTADO ---
  const [inventariadores, setInventariadores] = useState<Inventariador[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // --- FORMULARIO ---
  const initialFormState = {
    nombre: '',
    dni: '',
    telefono: '',
    email: '',
    codInterno: '',
    password: '' // ✅ Solo visual, no se envía
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- CARGA INICIAL ---
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await inventariadorService.listarActivos();
      setInventariadores(data);
    } catch (error) {
      console.error('Error al cargar inventariadores:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- FILTRADO ---
  const inventariadoresFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return inventariadores;
    
    const term = searchTerm.toLowerCase();
    return inventariadores.filter(inv => 
      inv.nombre.toLowerCase().includes(term) ||
      (inv.dni || '').toLowerCase().includes(term) ||
      (inv.codInterno || '').toLowerCase().includes(term) ||
      (inv.email || '').toLowerCase().includes(term)
    );
  }, [inventariadores, searchTerm]);

  // --- CRUD HANDLERS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    // ✅ No enviamos password al backend
    const payload = {
      nombre: formData.nombre,
      dni: formData.dni || undefined,
      telefono: formData.telefono || undefined,
      email: formData.email || undefined,
      codInterno: formData.codInterno || undefined
    };

    try {
      if (editingId) {
        await inventariadorService.actualizar(editingId, payload);
      } else {
        await inventariadorService.crear(payload);
      }
      closeModal();
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar:', error);
      
      const axiosError = error as AxiosError<{ mensaje?: string }>;
      const mensaje = axiosError.response?.data?.mensaje 
        || axiosError.message 
        || 'Error al guardar el inventariador';
      
      alert(mensaje);
    }
  };

  const handleEdit = (inv: Inventariador) => {
    setEditingId(inv.codInventariador || null);
    setFormData({
      nombre: inv.nombre,
      dni: inv.dni || '',
      telefono: inv.telefono || '',
      email: inv.email || '',
      codInterno: inv.codInterno || '',
      password: '' // Vacío al editar
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este inventariador?')) return;

    try {
      await inventariadorService.eliminar(id);
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar el inventariador');
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
    setEditingId(null);
    setShowPassword(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Inventariadores</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <MdAssignmentInd className="text-green-600"/> Personal encargado del inventario
          </p>
        </div>
        <button 
          onClick={openNewModal} 
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition shadow-md font-medium"
        >
          <MdAdd size={20} /> Nuevo Inventariador
        </button>
      </div>

      {/* Barra de Búsqueda */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, DNI, código..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase font-bold tracking-wider text-left">
              <tr>
                <th className="px-6 py-4">Inventariador</th>
                <th className="px-6 py-4">DNI</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : inventariadoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No se encontraron registros
                  </td>
                </tr>
              ) : (
                inventariadoresFiltrados.map((inv) => (
                  <tr key={inv.codInventariador} className="hover:bg-green-50/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={inv.nombre} />
                        <div>
                          <p className="font-bold text-gray-900">{inv.nombre}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MdAssignmentInd size={12}/> Inventariador
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-gray-700">
                        <MdBadge className="text-gray-400" size={16}/>
                        {inv.dni || <span className="text-gray-400 italic">No registrado</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {inv.telefono && (
                          <span className="flex items-center gap-1.5 text-gray-700 text-xs">
                            <MdPhone className="text-green-500" size={14}/> {inv.telefono}
                          </span>
                        )}
                        {inv.email && (
                          <span className="flex items-center gap-1.5 text-gray-700 text-xs">
                            <MdEmail className="text-blue-500" size={14}/> {inv.email}
                          </span>
                        )}
                        {!inv.telefono && !inv.email && (
                          <span className="text-gray-400 italic text-xs">Sin contacto</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono text-xs font-bold border border-gray-200">
                        {inv.codInterno || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(inv)} 
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          title="Editar"
                        >
                          <MdEdit size={18}/>
                        </button>
                        <button 
                          onClick={() => inv.codInventariador && handleDelete(inv.codInventariador)} 
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                          title="Eliminar"
                        >
                          <MdDelete size={18}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-right text-xs text-gray-500">
          Total: {inventariadoresFiltrados.length} registros
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Header Modal */}
            <div className="bg-green-600 px-6 py-4 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <MdAssignmentInd className="text-green-200"/> 
                {editingId ? 'Editar Inventariador' : 'Nuevo Inventariador'}
              </h3>
              <button 
                onClick={closeModal} 
                className="text-white hover:bg-green-700 p-1 rounded-full transition"
              >
                <MdClose size={20}/>
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              
              {/* Nombre Completo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  value={formData.nombre} 
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Ej: Juan Pérez López"
                />
              </div>

              {/* DNI y Código Interno */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    DNI
                  </label>
                  <input 
                    type="text" 
                    value={formData.dni} 
                    onChange={e => setFormData({...formData, dni: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="12345678"
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Código Interno
                  </label>
                  <input 
                    type="text" 
                    value={formData.codInterno} 
                    onChange={e => setFormData({...formData, codInterno: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono"
                    placeholder="INV-001"
                  />
                </div>
              </div>

              {/* Teléfono y Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input 
                    type="tel" 
                    value={formData.telefono} 
                    onChange={e => setFormData({...formData, telefono: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="987654321"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Email
                  </label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="inventariador@email.com"
                  />
                </div>
              </div>

              {/* ✅ CAMPO DE CONTRASEÑA (SOLO VISUAL) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                  <MdLock size={16} className="text-gray-500" />
                  Contraseña <span className="text-xs font-normal text-gray-500"></span>
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                  </button>
                </div>
              </div>

            </form>

            {/* Footer Modal */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={closeModal} 
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                onClick={handleSubmit} 
                className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow flex items-center gap-2"
              >
                <MdSave size={18}/> Guardar Inventariador
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}