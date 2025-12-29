'use client';

import { useEffect, useState, useCallback } from 'react';
import { MdClose, MdPerson, MdAssignmentInd, MdLocationOn, MdQrCode } from 'react-icons/md';
import { cargaService, DetalleCarga } from '../../../../services/carga.service';

interface CargaDetalleModalProps {
  codCarga: number;
  descripcion: string;
  onClose: () => void;
}

export default function CargaDetalleModal({ codCarga, descripcion, onClose }: CargaDetalleModalProps) {
  const [detalles, setDetalles] = useState<DetalleCarga[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  const cargarDetalles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cargaService.obtenerDetalle(codCarga);
      setDetalles(data);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      setDetalles([]);
    } finally {
      setLoading(false);
    }
  }, [codCarga]);

  useEffect(() => {
    cargarDetalles();
  }, [cargarDetalles]);

  const detallesFiltrados = detalles.filter(detalle => {
    if (!filtro) return true;
    const searchTerm = filtro.toLowerCase();
    return (
      detalle.codActivo?.toLowerCase().includes(searchTerm) ||
      detalle.activo?.descripcion?.toLowerCase().includes(searchTerm) ||
      detalle.responsable?.nombreResponsable?.toLowerCase().includes(searchTerm) ||
      detalle.inventariador?.nombreInventariador?.toLowerCase().includes(searchTerm)
    );
  });

  const totalActivos = detalles.length;
  const conResponsable = detalles.filter(d => d.responsable).length;
  const conInventariador = detalles.filter(d => d.inventariador).length;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        
        <div className="bg-blue-600 px-6 py-4 rounded-t-xl flex justify-between items-center">
          <div>
            <h3 className="font-bold text-white text-lg">Detalles de Carga</h3>
            <p className="text-blue-100 text-sm">{descripcion}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 p-2 rounded-full transition"
          >
            <MdClose size={24} />
          </button>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-b grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-xs font-bold text-blue-600 mb-1">TOTAL ACTIVOS</p>
            <p className="text-2xl font-bold text-gray-800">{totalActivos}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-xs font-bold text-green-600 mb-1">CON RESPONSABLE</p>
            <p className="text-2xl font-bold text-gray-800">{conResponsable}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <p className="text-xs font-bold text-purple-600 mb-1">CON INVENTARIADOR</p>
            <p className="text-2xl font-bold text-gray-800">{conInventariador}</p>
          </div>
        </div>

        <div className="px-6 py-4 border-b">
          <div className="relative">
            <MdQrCode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por código, descripción, responsable..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : detallesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MdQrCode size={48} className="mb-2 text-gray-300" />
              <p>No se encontraron activos</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">#</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Código</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Descripción</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Ubicación</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Responsable</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Inventariador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {detallesFiltrados.map((detalle, idx) => (
                  <tr key={detalle.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 font-mono">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-blue-600 font-bold">
                        {detalle.codActivo || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-800">
                        {detalle.activo?.descripcion || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {detalle.activo?.oficina ? (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <MdLocationOn size={14} className="text-gray-400" />
                          <span>{detalle.activo.oficina.nombreOficina}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Sin ubicación</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {detalle.responsable ? (
                        <div className="flex items-center gap-2">
                          <MdPerson className="text-blue-600" size={16} />
                          <span className="text-gray-800 font-medium">
                            {detalle.responsable.nombreResponsable}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {detalle.inventariador ? (
                        <div className="flex items-center gap-2">
                          <MdAssignmentInd className="text-green-600" size={16} />
                          <span className="text-gray-800 font-medium">
                            {detalle.inventariador.nombreInventariador}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Sin asignar</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t rounded-b-xl flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Mostrando {detallesFiltrados.length} de {totalActivos} activos
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}