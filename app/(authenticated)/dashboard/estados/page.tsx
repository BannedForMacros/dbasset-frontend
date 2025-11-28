'use client';

import { useEffect, useState } from 'react';
import { estadoService, Estado } from '../../../services/estado.service';
import { MdAdd, MdEdit, MdDelete, MdInfoOutline } from 'react-icons/md';

export default function EstadosPage() {
  const [estados, setEstados] = useState<Estado[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombreEstado, setNombreEstado] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await estadoService.listarTodos();
      setEstados(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { nombreEstado };
      
      if (editingId) {
        await estadoService.actualizar(editingId, payload);
      } else {
        await estadoService.crear(payload);
      }
      closeModal();
      cargarDatos();
    } catch (error) {
      console.error(error);
      alert('Error al guardar el estado');
    }
  };

  const handleEdit = (estado: Estado) => {
    setEditingId(estado.codEstado || null);
    setNombreEstado(estado.nombreEstado);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar este estado?')) {
      try {
        await estadoService.eliminar(id);
        cargarDatos();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setNombreEstado('');
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  // Función para asignar color según el estado (UX visual)
  const getBadgeColor = (nombre: string) => {
    const n = nombre.toLowerCase();
    if (n.includes('bueno') || n.includes('nuevo')) return 'bg-green-100 text-green-800';
    if (n.includes('regular')) return 'bg-yellow-100 text-yellow-800';
    if (n.includes('malo') || n.includes('baja')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Estados de Activo</h1>
          <p className="text-gray-500">Catálogo de condiciones físicas</p>
        </div>
        <button onClick={openNewModal} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md font-medium">
          <MdAdd size={20} /> Nuevo Estado
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-500">Cargando estados...</div>
        ) : estados.map((estado) => (
          <div key={estado.codEstado} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getBadgeColor(estado.nombreEstado)}`}>
                <MdInfoOutline size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{estado.nombreEstado}</h3>
                <p className="text-xs text-gray-400">ID: {estado.codEstado}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => handleEdit(estado)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                <MdEdit size={20} />
              </button>
              <button onClick={() => estado.codEstado && handleDelete(estado.codEstado)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                <MdDelete size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="font-bold text-lg text-gray-800">{editingId ? 'Editar Estado' : 'Nuevo Estado'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={nombreEstado}
                  onChange={(e) => setNombreEstado(e.target.value)}
                  required
                  placeholder="Ej: Bueno, Malo..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div className="flex gap-3 pt-2">
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