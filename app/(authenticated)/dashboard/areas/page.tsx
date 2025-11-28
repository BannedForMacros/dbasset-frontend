'use client';

import { useEffect, useState } from 'react';
import { areaService, Area } from '../../../services/area.service';
import { localService, Local } from '../../../services/local.service'; // Necesitamos esto para llenar el Select
import { MdAdd, MdEdit, MdDelete, MdSearch } from 'react-icons/md';

export default function AreasPage() {
  // Datos principales
  const [areas, setAreas] = useState<Area[]>([]);
  const [locales, setLocales] = useState<Local[]>([]); // Para el Combo Box
  const [loading, setLoading] = useState(true);

  // Estado del Modal y Formulario
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Formulario inicial
  const initialFormState = {
    nombreArea: '',
    observacion: '',
    codInterno: '',
    codLocal: '' // Manejamos el ID del local como string temporalmente en el form
  };
  const [formData, setFormData] = useState(initialFormState);

  // Cargar datos al inicio
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      // Cargamos ambas listas en paralelo
      const [areasData, localesData] = await Promise.all([
        areaService.listarActivos(),
        localService.listarActivos()
      ]);
      setAreas(areasData);
      setLocales(localesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que haya seleccionado un local
    if (!formData.codLocal) {
      alert('Debe seleccionar un Local');
      return;
    }

    // Armar el objeto como lo espera el Backend Java
    const areaPayload: Area = {
      nombreArea: formData.nombreArea,
      observacion: formData.observacion,
      codInterno: formData.codInterno,
      local: { codLocal: Number(formData.codLocal) } // Objeto anidado
    };

    try {
      if (editingId) {
        await areaService.actualizar(editingId, areaPayload);
      } else {
        await areaService.crear(areaPayload);
      }
      closeModal();
      cargarDatos(); // Recargar tabla
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Ocurrió un error al guardar');
    }
  };

  const handleEdit = (area: Area) => {
    setEditingId(area.codArea || null);
    setFormData({
      nombreArea: area.nombreArea,
      observacion: area.observacion || '',
      codInterno: area.codInterno || '',
      // Extraemos el ID del objeto local anidado si existe
      codLocal: (area.local as Local).codLocal?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar esta área?')) {
      try {
        await areaService.eliminar(id);
        cargarDatos();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Áreas</h1>
          <p className="text-gray-500">Gestión de áreas por local</p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md font-medium"
        >
          <MdAdd size={20} /> Nuevo
        </button>
      </div>

      {/* Tabla Simple (Sin DataTable complejo) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Nombre Área</th>
                <th className="px-6 py-4">Local Perteneciente</th>
                <th className="px-6 py-4">Cód. Interno</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center">Cargando datos...</td></tr>
              ) : areas.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No hay áreas registradas</td></tr>
              ) : (
                areas.map((area) => (
                  <tr key={area.codArea} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium">{area.codArea}</td>
                    <td className="px-6 py-4">{area.nombreArea}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-full text-xs font-medium">
                        {(area.local as Local)?.nombreLocal || 'Sin Local'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{area.codInterno}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(area)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <MdEdit size={18} />
                        </button>
                        <button onClick={() => area.codArea && handleDelete(area.codArea)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                          <MdDelete size={18} />
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

      {/* Modal Simple */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">{editingId ? 'Editar Área' : 'Nueva Área'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Selector de Local */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Local *</label>
                <select
                  value={formData.codLocal}
                  onChange={(e) => setFormData({ ...formData, codLocal: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                >
                  <option value="">-- Seleccione un Local --</option>
                  {locales.map((loc) => (
                    <option key={loc.codLocal} value={loc.codLocal}>
                      {loc.nombreLocal}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Área *</label>
                <input
                  type="text"
                  value={formData.nombreArea}
                  onChange={(e) => setFormData({ ...formData, nombreArea: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Ej: Recursos Humanos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código Interno</label>
                <input
                  type="text"
                  value={formData.codInterno}
                  onChange={(e) => setFormData({ ...formData, codInterno: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Ej: RH-01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
                <textarea
                  value={formData.observacion}
                  onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition h-24 resize-none"
                  placeholder="Detalles adicionales..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-md">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}