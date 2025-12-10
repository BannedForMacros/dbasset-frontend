'use client';

import { useEffect, useState } from 'react';
import { oficinaService, Oficina } from '../../../services/oficina.service';
import { areaService, Area } from '../../../services/area.service';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';

export default function OficinasPage() {
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [areas, setAreas] = useState<Area[]>([]); // Para el selector
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const initialFormState = {
    nombreOficina: '',
    observacion: '',
    codInterno: '',
    codArea: '' // ID del área seleccionada
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      // Cargamos oficinas y áreas en paralelo
      const [oficinasData, areasData] = await Promise.all([
        oficinaService.listarActivos(),
        areaService.listarActivos()
      ]);
      setOficinas(oficinasData);
      setAreas(areasData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codArea) {
      alert('Debe seleccionar un Área');
      return;
    }

    const payload: Oficina = {
      nombreOficina: formData.nombreOficina,
      observacion: formData.observacion,
      codInterno: formData.codInterno,
      area: { codArea: Number(formData.codArea) }
    };

    try {
      if (editingId) {
        await oficinaService.actualizar(editingId, payload);
      } else {
        await oficinaService.crear(payload);
      }
      closeModal();
      cargarDatos();
    } catch (error) {
      console.error(error);
      alert('Error al guardar');
    }
  };

  const handleEdit = (oficina: Oficina) => {
    setEditingId(oficina.codOficina || null);
    setFormData({
      nombreOficina: oficina.nombreOficina,
      observacion: oficina.observacion || '',
      codInterno: oficina.codInterno || '',
      codArea: (oficina.area as Area).codArea?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar esta oficina?')) {
      try {
        await oficinaService.eliminar(id);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Oficinas</h1>
          <p className="text-gray-500">Gestión de oficinas por área</p>
        </div>
        <button onClick={openNewModal} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md font-medium">
          <MdAdd size={20} /> Nueva Oficinaaaaaa
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Oficina</th>
                <th className="px-6 py-4">Área Perteneciente</th>
                <th className="px-6 py-4">Cód. Interno</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center">Cargando...</td></tr>
              ) : oficinas.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No hay oficinas registradas</td></tr>
              ) : (
                oficinas.map((ofi) => (
                  <tr key={ofi.codOficina} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium">{ofi.codOficina}</td>
                    <td className="px-6 py-4">{ofi.nombreOficina}</td>
                    <td className="px-6 py-4">
                      <span className="bg-purple-100 text-purple-800 py-1 px-2 rounded-full text-xs font-medium">
                        {(ofi.area as Area)?.nombreArea || 'Sin Área'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{ofi.codInterno}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(ofi)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><MdEdit size={18} /></button>
                        <button onClick={() => ofi.codOficina && handleDelete(ofi.codOficina)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><MdDelete size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">{editingId ? 'Editar Oficina' : 'Nueva Oficina'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Selector de Área */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área *</label>
                <select
                  value={formData.codArea}
                  onChange={(e) => setFormData({ ...formData, codArea: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">-- Seleccione un Área --</option>
                  {areas.map((area) => (
                    <option key={area.codArea} value={area.codArea}>
                      {area.nombreArea}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Oficina *</label>
                <input type="text" value={formData.nombreOficina} onChange={(e) => setFormData({ ...formData, nombreOficina: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código Interno</label>
                <input type="text" value={formData.codInterno} onChange={(e) => setFormData({ ...formData, codInterno: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
                <textarea value={formData.observacion} onChange={(e) => setFormData({ ...formData, observacion: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}