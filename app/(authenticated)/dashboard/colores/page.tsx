'use client';

import { useEffect, useState } from 'react';
import { colorService, Color } from '../../../services/color.service';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import { DataTable } from '../../../components/common/DataTable';
import IconButton from '../../../components/IconButton';
import { useTableSearch } from '../../../hooks/useTableSearch';

export default function ColoresPage() {
  const [colores, setColores] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombreColor, setNombreColor] = useState('');

  const { searchTerm, setSearchTerm, filteredData } = useTableSearch(colores);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await colorService.listarTodos();
      setColores(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { nombreColor };
      
      if (editingId) {
        await colorService.actualizar(editingId, payload);
      } else {
        await colorService.crear(payload);
      }
      closeModal();
      cargarDatos();
    } catch (error) {
      console.error(error);
      alert('Error al guardar el color');
    }
  };

  const handleEdit = (color: Color) => {
    setEditingId(color.codColor || null);
    setNombreColor(color.nombreColor);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este color?')) {
      try {
        await colorService.eliminar(id);
        cargarDatos();
      } catch (error) {
        console.error(error);
        alert('Error al eliminar el color');
      }
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setNombreColor('');
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Colores</h1>
          <p className="text-gray-600 mt-1">Gestión de colores de productos</p>
        </div>
        <button 
          onClick={openNewModal} 
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg font-medium"
        >
          <MdAdd size={22} /> Nuevo Color
        </button>
      </div>

      {/* Tabla */}
      <DataTable
        data={filteredData}
        columns={[
          { header: 'Color' },
          { header: 'Acciones', className: 'col-acciones' }
        ]}
        renderRow={(color: Color, index: number) => (
          <tr key={color.codColor || index}>
            <td className="font-semibold">{color.nombreColor}</td>
            <td className="col-acciones">
              <div className="flex justify-end gap-1.5">
                <IconButton variant="edit" icon={<MdEdit size={17} />} title="Editar" onClick={() => handleEdit(color)} />
                <IconButton variant="delete" icon={<MdDelete size={17} />} title="Eliminar"
                  onClick={() => color.codColor && handleDelete(color.codColor)} />
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
                {editingId ? 'Editar Color' : 'Nuevo Color'}
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
                  Nombre del Color <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nombreColor}
                  onChange={(e) => setNombreColor(e.target.value)}
                  required
                  autoFocus
                  placeholder="Ej: Negro, Blanco, Rojo..."
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