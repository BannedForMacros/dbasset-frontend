'use client';

import { useEffect, useState } from 'react';
import { responsableService, Responsable } from '../../../services/responsable.service';
import { oficinaService, Oficina } from '../../../services/oficina.service';
import { Area } from '../../../services/area.service'; // Necesario para el tipado en el render
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';

export default function ResponsablesPage() {
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [oficinas, setOficinas] = useState<Oficina[]>([]); // Para el selector
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const initialFormState = {
    nombreResponsable: '',
    cargo: '',
    codInterno: '',
    codOficina: '' // ID de la oficina seleccionada
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      // Carga paralela
      const [respData, ofiData] = await Promise.all([
        responsableService.listarActivos(),
        oficinaService.listarActivos()
      ]);
      setResponsables(respData);
      setOficinas(ofiData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codOficina) {
      alert('Debe seleccionar una Oficina');
      return;
    }

    const payload: Responsable = {
      nombreResponsable: formData.nombreResponsable,
      cargo: formData.cargo,
      codInterno: formData.codInterno,
      oficina: { codOficina: Number(formData.codOficina) }
    };

    try {
      if (editingId) {
        await responsableService.actualizar(editingId, payload);
      } else {
        await responsableService.crear(payload);
      }
      closeModal();
      cargarDatos();
    } catch (error) {
      console.error(error);
      alert('Error al guardar');
    }
  };

  const handleEdit = (resp: Responsable) => {
    setEditingId(resp.codResponsable || null);
    setFormData({
      nombreResponsable: resp.nombreResponsable,
      cargo: resp.cargo,
      codInterno: resp.codInterno,
      codOficina: (resp.oficina as Oficina).codOficina?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar este responsable?')) {
      try {
        await responsableService.eliminar(id);
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
          <h1 className="text-3xl font-bold text-gray-800">Responsables</h1>
          <p className="text-gray-500">Personal custodio de activos</p>
        </div>
        <button onClick={openNewModal} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md font-medium">
          <MdAdd size={20} /> Nuevo Responsable
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Cargo</th>
                <th className="px-6 py-4">Oficina Asignada</th>
                <th className="px-6 py-4">Cód. Interno</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center">Cargando...</td></tr>
              ) : responsables.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No hay responsables registrados</td></tr>
              ) : (
                responsables.map((resp) => (
                  <tr key={resp.codResponsable} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium">{resp.nombreResponsable}</td>
                    <td className="px-6 py-4">{resp.cargo}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800">
                          {(resp.oficina as Oficina)?.nombreOficina}
                        </span>
                        <span className="text-xs text-gray-500">
                          {((resp.oficina as Oficina)?.area as Area)?.nombreArea || 'Sin Área'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{resp.codInterno}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(resp)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><MdEdit size={18} /></button>
                        <button onClick={() => resp.codResponsable && handleDelete(resp.codResponsable)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><MdDelete size={18} /></button>
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
              <h3 className="font-bold text-lg text-gray-800">{editingId ? 'Editar Responsable' : 'Nuevo Responsable'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Selector de Oficina */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Oficina *</label>
                <select
                  value={formData.codOficina}
                  onChange={(e) => setFormData({ ...formData, codOficina: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">-- Seleccione una Oficina --</option>
                  {oficinas.map((ofi) => (
                    <option key={ofi.codOficina} value={ofi.codOficina}>
                      {ofi.nombreOficina} - {(ofi.area as Area)?.nombreArea}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                <input type="text" value={formData.nombreResponsable} onChange={(e) => setFormData({ ...formData, nombreResponsable: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                <input type="text" value={formData.cargo} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código Interno (DNI/Cod)</label>
                <input type="text" value={formData.codInterno} onChange={(e) => setFormData({ ...formData, codInterno: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
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