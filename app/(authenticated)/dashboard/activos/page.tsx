'use client';

import { useEffect, useState } from 'react';
import { activoService, Activo } from '../../../services/activo.service';
import { localService, Local } from '../../../services/local.service';
import { areaService, Area } from '../../../services/area.service';
import { oficinaService, Oficina } from '../../../services/oficina.service';
import { responsableService, Responsable } from '../../../services/responsable.service';
import { estadoService, Estado } from '../../../services/estado.service';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdQrCode } from 'react-icons/md';

export default function ActivosPage() {
  // Datos principales
  const [activos, setActivos] = useState<Activo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Catálogos para selectores
  const [locales, setLocales] = useState<Local[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);

  // Modal y Formulario
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Estado inicial del formulario
  const initialFormState = {
    codActivo: '',
    codInterno: '',
    descripcion: '',
    marca: '',
    modelo: '',
    serie: '',
    color: '',
    anio: '',
    fechaCompra: '',
    codLocal: '',
    codArea: '',
    codOficina: '',
    codResponsable: '',
    codEstado: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      // Carga masiva de todos los datos necesarios
      const [activosData, locData, areaData, ofiData, respData, estData] = await Promise.all([
        activoService.listarTodos(),
        localService.listarActivos(),
        areaService.listarActivos(),
        oficinaService.listarActivos(),
        responsableService.listarActivos(),
        estadoService.listarTodos()
      ]);

      setActivos(activosData);
      setLocales(locData);
      setAreas(areaData);
      setOficinas(ofiData);
      setResponsables(respData);
      setEstados(estData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.codLocal || !formData.codArea || !formData.codOficina || !formData.codResponsable || !formData.codEstado) {
      alert('Por favor complete todos los campos de ubicación y estado.');
      return;
    }

    const payload: Activo = {
      codActivo: formData.codActivo,
      codInterno: formData.codInterno,
      descripcion: formData.descripcion,
      marca: formData.marca,
      modelo: formData.modelo,
      serie: formData.serie,
      color: formData.color,
      anio: formData.anio,
      fechaCompra: formData.fechaCompra,
      local: { codLocal: Number(formData.codLocal) },
      area: { codArea: Number(formData.codArea) },
      oficina: { codOficina: Number(formData.codOficina) },
      responsable: { codResponsable: Number(formData.codResponsable) },
      estado: { codEstado: Number(formData.codEstado) }
    };

    try {
      if (editingId) {
        await activoService.actualizar(editingId, payload);
      } else {
        await activoService.crear(payload);
      }
      closeModal();
      // Recargamos solo la lista de activos
      const data = await activoService.listarTodos();
      setActivos(data);
    } catch (error) {
      console.error(error);
      alert('Error al guardar el activo. Verifique que el código no esté duplicado.');
    }
  };

  const handleEdit = (activo: Activo) => {
    setEditingId(activo.id || null);
    setFormData({
      codActivo: activo.codActivo,
      codInterno: activo.codInterno || '',
      descripcion: activo.descripcion,
      marca: activo.marca || '',
      modelo: activo.modelo || '',
      serie: activo.serie || '',
      color: activo.color || '',
      anio: activo.anio || '',
      fechaCompra: activo.fechaCompra || '',
      codLocal: (activo.local as Local)?.codLocal?.toString() || '',
      codArea: (activo.area as Area)?.codArea?.toString() || '',
      codOficina: (activo.oficina as Oficina)?.codOficina?.toString() || '',
      codResponsable: (activo.responsable as Responsable)?.codResponsable?.toString() || '',
      codEstado: (activo.estado as Estado)?.codEstado?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este activo?')) {
      try {
        await activoService.eliminar(id);
        const data = await activoService.listarTodos();
        setActivos(data);
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
          <h1 className="text-3xl font-bold text-gray-800">Activos Fijos</h1>
          <p className="text-gray-500">Inventario general de bienes</p>
        </div>
        <button onClick={openNewModal} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md font-medium">
          <MdAdd size={20} /> Nuevo Activo
        </button>
      </div>

      {/* Tabla de Activos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Marca / Modelo</th>
                <th className="px-4 py-3">Responsable</th>
                <th className="px-4 py-3">Ubicación</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center">Cargando inventario...</td></tr>
              ) : activos.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No hay activos registrados</td></tr>
              ) : (
                activos.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono font-medium text-blue-600">{item.codActivo}</td>
                    <td className="px-4 py-3">{item.descripcion}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {item.marca} <br/> {item.modelo}
                    </td>
                    <td className="px-4 py-3">
                      {(item.responsable as Responsable)?.nombreResponsable}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-medium">{(item.oficina as Oficina)?.nombreOficina}</div>
                      <div className="text-gray-400">{(item.local as Local)?.nombreLocal}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-700 py-1 px-2 rounded-full text-xs border border-gray-200">
                        {(item.estado as Estado)?.nombreEstado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><MdEdit size={18} /></button>
                        <button onClick={() => item.id && handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><MdDelete size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Grande para Activos */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center rounded-t-xl">
              <h3 className="font-bold text-lg text-gray-800">{editingId ? 'Editar Activo' : 'Nuevo Activo'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* COLUMNA 1: Datos Técnicos */}
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-700 border-b pb-2 flex items-center gap-2">
                    <MdQrCode /> Datos del Bien
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Código Activo *</label>
                      <input type="text" required value={formData.codActivo} onChange={(e) => setFormData({...formData, codActivo: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Código Interno</label>
                      <input type="text" value={formData.codInterno} onChange={(e) => setFormData({...formData, codInterno: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Descripción *</label>
                    <input type="text" required value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Marca</label>
                      <input type="text" value={formData.marca} onChange={(e) => setFormData({...formData, marca: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Modelo</label>
                      <input type="text" value={formData.modelo} onChange={(e) => setFormData({...formData, modelo: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Serie</label>
                      <input type="text" value={formData.serie} onChange={(e) => setFormData({...formData, serie: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                      <input type="text" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Año</label>
                        <input type="text" value={formData.anio} onChange={(e) => setFormData({...formData, anio: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Compra</label>
                        <input type="date" value={formData.fechaCompra} onChange={(e) => setFormData({...formData, fechaCompra: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </div>

                {/* COLUMNA 2: Ubicación y Estado */}
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-700 border-b pb-2 flex items-center gap-2">
                    📍 Ubicación y Responsable
                  </h4>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Local *</label>
                    <select required value={formData.codLocal} onChange={(e) => setFormData({...formData, codLocal: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">-- Seleccionar --</option>
                      {locales.map(l => <option key={l.codLocal} value={l.codLocal}>{l.nombreLocal}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Área *</label>
                    <select required value={formData.codArea} onChange={(e) => setFormData({...formData, codArea: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">-- Seleccionar --</option>
                      {areas.map(a => <option key={a.codArea} value={a.codArea}>{a.nombreArea}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Oficina *</label>
                    <select required value={formData.codOficina} onChange={(e) => setFormData({...formData, codOficina: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">-- Seleccionar --</option>
                      {oficinas.map(o => <option key={o.codOficina} value={o.codOficina}>{o.nombreOficina}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Responsable *</label>
                    <select required value={formData.codResponsable} onChange={(e) => setFormData({...formData, codResponsable: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">-- Seleccionar --</option>
                      {responsables.map(r => <option key={r.codResponsable} value={r.codResponsable}>{r.nombreResponsable}</option>)}
                    </select>
                  </div>

                  <div className="pt-4 border-t mt-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Estado Físico *</label>
                    <select required value={formData.codEstado} onChange={(e) => setFormData({...formData, codEstado: e.target.value})} className="w-full px-3 py-2 border-2 border-blue-100 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">-- Seleccionar Estado --</option>
                      {estados.map(e => <option key={e.codEstado} value={e.codEstado}>{e.nombreEstado}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 mt-6 border-t">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md">Guardar Activo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}