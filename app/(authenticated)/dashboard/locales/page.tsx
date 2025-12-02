'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../../services/auth.service'; // Ajusta la ruta si es necesario con @/
import { localService, Local } from '../../../services/local.service';
import { AxiosError } from 'axios';
import { MdEdit, MdDelete, MdAdd } from 'react-icons/md';

export default function LocalesPage() {
  const router = useRouter();
  const [locales, setLocales] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // Estado para el botón guardar
  
  // Modales
  const [showModal, setShowModal] = useState(false);
  const [editingLocal, setEditingLocal] = useState<Local | null>(null);
  
  // Formulario: No necesitamos codEmpresa, el backend lo pone solo.
  const [formData, setFormData] = useState({
    nombreLocal: '',
    direccion: '',
    codInterno: '',
  });

  useEffect(() => {
    // Validación de seguridad
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    cargarLocales();
  }, [router]);

  const cargarLocales = async () => {
    try {
      setLoading(true);
      const data = await localService.listarActivos();
      setLocales(data);
    } catch (error) {
      console.error('Error al cargar locales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Preparamos el objeto a enviar
      const payload: Local = {
        nombreLocal: formData.nombreLocal,
        direccion: formData.direccion,
        codInterno: formData.codInterno
      };

      if (editingLocal && editingLocal.codLocal) {
        await localService.actualizar(editingLocal.codLocal, payload);
      } else {
        await localService.crear(payload);
      }
      
      closeModal();
      cargarLocales(); // Recargar la tabla para ver el nuevo local
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error al guardar:', axiosError);
      alert('Error al guardar el local');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (local: Local) => {
    setEditingLocal(local);
    setFormData({
      nombreLocal: local.nombreLocal,
      direccion: local.direccion,
      codInterno: local.codInterno,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este local?')) {
      try {
        await localService.eliminar(id);
        cargarLocales();
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar el local');
      }
    }
  };

  const handleNew = () => {
    setEditingLocal(null);
    setFormData({ nombreLocal: '', direccion: '', codInterno: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLocal(null);
    setFormData({ nombreLocal: '', direccion: '', codInterno: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-500 font-medium">Cargando locales...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Locales</h1>
          <p className="text-gray-600 mt-1">Gestión de sedes de la empresa</p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl font-medium"
        >
          <MdAdd size={22} />
          <span>Nuevo Local</span>
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Dirección</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {locales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <p className="text-lg font-medium mb-1">No hay locales registrados</p>
                    <p className="text-sm">Crea uno nuevo para comenzar.</p>
                  </td>
                </tr>
              ) : (
                locales.map((local) => (
                  <tr key={local.codLocal} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{local.codLocal}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{local.nombreLocal}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{local.direccion}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 font-mono">
                        {local.codInterno}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(local)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Editar"
                        >
                          <MdEdit size={20} />
                        </button>
                        <button
                          onClick={() => local.codLocal && handleDelete(local.codLocal)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Eliminar"
                        >
                          <MdDelete size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all scale-100">
            {/* Header del Modal */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-xl flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {editingLocal ? 'Editar Local' : 'Nuevo Local'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl font-light">&times;</button>
            </div>

            {/* Body del Modal */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nombre del Local <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombreLocal}
                  onChange={(e) => setFormData({ ...formData, nombreLocal: e.target.value })}
                  required
                  autoFocus
                  placeholder="Ej: Sede Central"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Dirección <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  required
                  placeholder="Ej: Av. Principal 123"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Código Interno <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.codInterno}
                  onChange={(e) => setFormData({ ...formData, codInterno: e.target.value })}
                  required
                  placeholder="Ej: LOC-001"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              {/* Footer del Modal */}
              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Guardando...' : (editingLocal ? 'Actualizar' : 'Guardar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}