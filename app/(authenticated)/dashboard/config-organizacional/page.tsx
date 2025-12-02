'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../../services/auth.service';
import { localService, Local } from '../../../services/local.service';
import { areaService, Area } from '../../../services/area.service';
import { oficinaService, Oficina } from '../../../services/oficina.service';
import { MdAdd, MdEdit, MdDelete, MdBusiness, MdLayers, MdMeetingRoom } from 'react-icons/md';

type TabType = 'locales' | 'areas' | 'oficinas';

interface FormState {
  nombre: string;
  codInterno: string;
  observacion: string;
  direccion: string;
  codLocal: string;
  codArea: string;
}

export default function ConfigOrganizacionalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('locales');
  const [loading, setLoading] = useState(true);

  // Estados para cada entidad
  const [locales, setLocales] = useState<Local[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [oficinas, setOficinas] = useState<Oficina[]>([]);

  // Modal y formulario
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<FormState>({
    nombre: '',
    codInterno: '',
    observacion: '',
    direccion: '',
    codLocal: '',
    codArea: ''
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    cargarTodosDatos();
  }, [router]);

  const cargarTodosDatos = async () => {
    try {
      setLoading(true);
      const [localesData, areasData, oficinasData] = await Promise.all([
        localService.listarActivos(),
        areaService.listarActivos(),
        oficinaService.listarActivos()
      ]);
      setLocales(localesData);
      setAreas(areasData);
      setOficinas(oficinasData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      codInterno: '',
      observacion: '',
      direccion: '',
      codLocal: '',
      codArea: ''
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (activeTab === 'locales') {
        const payload: Local = {
          nombreLocal: formData.nombre,
          direccion: formData.direccion,
          codInterno: formData.codInterno
        };
        if (isEditing && editingId) {
          await localService.actualizar(editingId, payload);
        } else {
          await localService.crear(payload);
        }
      } else if (activeTab === 'areas') {
        if (!formData.codLocal) {
          alert('Debe seleccionar un Local');
          return;
        }
        const payload: Area = {
          nombreArea: formData.nombre,
          observacion: formData.observacion,
          codInterno: formData.codInterno,
          local: { codLocal: Number(formData.codLocal) }
        };
        if (isEditing && editingId) {
          await areaService.actualizar(editingId, payload);
        } else {
          await areaService.crear(payload);
        }
      } else if (activeTab === 'oficinas') {
        if (!formData.codArea) {
          alert('Debe seleccionar un Área');
          return;
        }
        const payload: Oficina = {
          nombreOficina: formData.nombre,
          observacion: formData.observacion,
          codInterno: formData.codInterno,
          area: { codArea: Number(formData.codArea) }
        };
        if (isEditing && editingId) {
          await oficinaService.actualizar(editingId, payload);
        } else {
          await oficinaService.crear(payload);
        }
      }

      closeModal();
      cargarTodosDatos();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar');
    }
  };

  const handleEditLocal = (local: Local) => {
    setIsEditing(true);
    setEditingId(local.codLocal || null);
    setFormData({
      nombre: local.nombreLocal,
      direccion: local.direccion,
      codInterno: local.codInterno,
      observacion: '',
      codLocal: '',
      codArea: ''
    });
    setShowModal(true);
  };

  const handleEditArea = (area: Area) => {
    setIsEditing(true);
    setEditingId(area.codArea || null);
    setFormData({
      nombre: area.nombreArea,
      observacion: area.observacion || '',
      codInterno: area.codInterno || '',
      direccion: '',
      codLocal: (area.local as Local).codLocal?.toString() || '',
      codArea: ''
    });
    setShowModal(true);
  };

  const handleEditOficina = (oficina: Oficina) => {
    setIsEditing(true);
    setEditingId(oficina.codOficina || null);
    setFormData({
      nombre: oficina.nombreOficina,
      observacion: oficina.observacion || '',
      codInterno: oficina.codInterno || '',
      direccion: '',
      codLocal: '',
      codArea: (oficina.area as Area).codArea?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este registro?')) return;

    try {
      if (activeTab === 'locales') {
        await localService.eliminar(id);
      } else if (activeTab === 'areas') {
        await areaService.eliminar(id);
      } else {
        await oficinaService.eliminar(id);
      }
      cargarTodosDatos();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar');
    }
  };

  const handleNew = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const tabs = [
    { id: 'locales' as TabType, label: 'Locales', icon: MdBusiness, count: locales.length },
    { id: 'areas' as TabType, label: 'Áreas', icon: MdLayers, count: areas.length },
    { id: 'oficinas' as TabType, label: 'Oficinas', icon: MdMeetingRoom, count: oficinas.length }
  ];

  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-500">Cargando...</div>
        </div>
      );
    }

    const currentData = activeTab === 'locales' ? locales : activeTab === 'areas' ? areas : oficinas;

    if (currentData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p className="text-lg font-medium mb-2">No hay registros</p>
          <p className="text-sm">Crea uno nuevo para comenzar</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Nombre</th>
              {activeTab === 'locales' && (
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Dirección</th>
              )}
              {activeTab === 'areas' && (
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Local</th>
              )}
              {activeTab === 'oficinas' && (
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Área</th>
              )}
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Código</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activeTab === 'locales' && locales.map((local) => (
              <tr key={local.codLocal} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm text-gray-500 font-mono">{local.codLocal}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{local.nombreLocal}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{local.direccion}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 font-mono">
                    {local.codInterno}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEditLocal(local)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <MdEdit size={20} />
                    </button>
                    <button onClick={() => local.codLocal && handleDelete(local.codLocal)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <MdDelete size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {activeTab === 'areas' && areas.map((area) => (
              <tr key={area.codArea} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm text-gray-500 font-mono">{area.codArea}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{area.nombreArea}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {(area.local as Local)?.nombreLocal || 'Sin Local'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 font-mono">
                    {area.codInterno}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEditArea(area)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <MdEdit size={20} />
                    </button>
                    <button onClick={() => area.codArea && handleDelete(area.codArea)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <MdDelete size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {activeTab === 'oficinas' && oficinas.map((oficina) => (
              <tr key={oficina.codOficina} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm text-gray-500 font-mono">{oficina.codOficina}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{oficina.nombreOficina}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {(oficina.area as Area)?.nombreArea || 'Sin Área'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 font-mono">
                    {oficina.codInterno}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEditOficina(oficina)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <MdEdit size={20} />
                    </button>
                    <button onClick={() => oficina.codOficina && handleDelete(oficina.codOficina)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <MdDelete size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const getModalTitle = () => {
    const action = isEditing ? 'Editar' : 'Nuevo';
    const entity = activeTab === 'locales' ? 'Local' : activeTab === 'areas' ? 'Área' : 'Oficina';
    return `${action} ${entity}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Configuración Organizacional</h1>
          <p className="text-gray-600 mt-1">Gestión unificada de estructura empresarial</p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg font-medium"
        >
          <MdAdd size={22} />
          <span>Nuevo Registro</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tabla */}
        {renderTable()}
      </div>

      {/* Modal Dinámico */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">{getModalTitle()}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Campo Nombre (común para todos) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Dirección (solo Locales) */}
              {activeTab === 'locales' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Dirección <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              {/* Selector de Local (solo Áreas) */}
              {activeTab === 'areas' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Local <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.codLocal}
                    onChange={(e) => setFormData({ ...formData, codLocal: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">-- Seleccione un Local --</option>
                    {locales.map((loc) => (
                      <option key={loc.codLocal} value={loc.codLocal}>
                        {loc.nombreLocal}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selector de Área (solo Oficinas) */}
              {activeTab === 'oficinas' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Área <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.codArea}
                    onChange={(e) => setFormData({ ...formData, codArea: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">-- Seleccione un Área --</option>
                    {areas.map((area) => (
                      <option key={area.codArea} value={area.codArea}>
                        {area.nombreArea} ({(area.local as Local)?.nombreLocal})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Código Interno */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Código Interno <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.codInterno}
                  onChange={(e) => setFormData({ ...formData, codInterno: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Observación (no para Locales) */}
              {activeTab !== 'locales' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Observación</label>
                  <textarea
                    value={formData.observacion}
                    onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                  />
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-md"
                >
                  {isEditing ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}