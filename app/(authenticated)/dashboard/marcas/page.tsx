'use client';

import { useEffect, useState } from 'react';
import { marcaService, Marca } from '../../../services/marca.service';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import { DataTable } from '../../../components/common/DataTable';
import { useTableSearch } from '../../../hooks/useTableSearch';

export default function MarcasPage() {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombreMarca, setNombreMarca] = useState('');

  const { searchTerm, setSearchTerm, filteredData } = useTableSearch(marcas);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await marcaService.listarTodos();
      setMarcas(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { nombreMarca };
      
      if (editingId) {
        await marcaService.actualizar(editingId, payload);
      } else {
        await marcaService.crear(payload);
      }
      closeModal();
      cargarDatos();
    } catch (error) {
      console.error(error);
      alert('Error al guardar la marca');
    }
  };

  const handleEdit = (marca: Marca) => {
    setEditingId(marca.codMarca || null);
    setNombreMarca(marca.nombreMarca);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar esta marca?')) {
      try {
        await marcaService.eliminar(id);
        cargarDatos();
      } catch (error) {
        console.error(error);
        alert('Error al eliminar la marca');
      }
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setNombreMarca('');
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Marcas</h1>
          <p className="text-gray-600 mt-1">Gestión de marcas de productos</p>
        </div>
        <button 
          onClick={openNewModal} 
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg font-medium"
        >
          <MdAdd size={22} /> Nueva Marca
        </button>
      </div>

      {/* Tabla */}
      <DataTable
        data={filteredData}
        columns={[
          { header: 'Marca' },
          { header: 'Acciones', className: 'text-right w-32' }
        ]}
        renderRow={(marca: Marca, index: number) => (
          <tr key={marca.codMarca || index} className="hover:bg-gray-50 transition">
            <td className="px-6 py-4">
              <span className="font-semibold text-gray-900">{marca.nombreMarca}</span>
            </td>
            <td className="px-6 py-4 text-right">
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => handleEdit(marca)} 
                  className="p-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition"
                  title="Editar"
                >
                  <MdEdit size={20} />
                </button>
                <button 
                  onClick={() => marca.codMarca && handleDelete(marca.codMarca)} 
                  className="p-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition"
                  title="Eliminar"
                >
                  <MdDelete size={20} />
                </button>
              </div>
            </td>
          </tr>
        )}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex justify-between items-center">
              <h3 className="font-bold text-xl text-white">
                {editingId ? 'Editar Marca' : 'Nueva Marca'}
              </h3>
              <button 
                onClick={closeModal} 
                className="text-white/80 hover:text-white text-2xl transition"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nombre de la Marca <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nombreMarca}
                  onChange={(e) => setNombreMarca(e.target.value)}
                  required
                  autoFocus
                  placeholder="Ej: Samsung, HP, Dell..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="flex-1 px-5 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium shadow-lg transition"
                >
                  {editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}