'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../../services/auth.service';
import { localService, Local } from '../../../services/local.service';
import { AxiosError } from 'axios';
import { MdEdit, MdDelete, MdAdd } from 'react-icons/md';

export default function LocalesPage() {
  const router = useRouter();
  const [locales, setLocales] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocal, setEditingLocal] = useState<Local | null>(null);
  const [formData, setFormData] = useState<Local>({
    nombreLocal: '',
    direccion: '',
    codInterno: '',
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    cargarLocales();
  }, [router]);

  const cargarLocales = async () => {
    try {
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
    try {
      if (editingLocal && editingLocal.codLocal) {
        await localService.actualizar(editingLocal.codLocal, formData);
      } else {
        await localService.crear(formData);
      }
      setShowModal(false);
      setFormData({ nombreLocal: '', direccion: '', codInterno: '' });
      setEditingLocal(null);
      cargarLocales();
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error al guardar:', axiosError);
      alert('Error al guardar el local');
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
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Locales</h1>
          <p className="text-gray-600 mt-1">Gestión de locales del sistema</p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
        >
          <MdAdd size={22} />
          <span className="font-medium">Nuevo Local</span>
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dirección</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {locales.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No hay locales registrados. Crea uno nuevo para comenzar.
                </td>
              </tr>
            ) : (
              locales.map((local) => (
                <tr key={local.codLocal} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{local.codLocal}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{local.nombreLocal}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{local.direccion}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{local.codInterno}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center justify-center gap-2">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-xl">
              <h2 className="text-2xl font-bold text-white">
                {editingLocal ? 'Editar Local' : 'Nuevo Local'}
              </h2>
            </div>

            {/* Body del Modal */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del Local <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombreLocal}
                  onChange={(e) => setFormData({ ...formData, nombreLocal: e.target.value })}
                  required
                  placeholder="Ej: Local Central"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dirección <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  required
                  placeholder="Ej: Av. Principal 123"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Código Interno <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.codInterno}
                  onChange={(e) => setFormData({ ...formData, codInterno: e.target.value })}
                  required
                  placeholder="Ej: LC-001"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Footer del Modal */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg"
                >
                  {editingLocal ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}