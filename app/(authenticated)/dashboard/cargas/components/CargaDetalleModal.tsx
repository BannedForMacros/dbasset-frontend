'use client';

import { useEffect, useState, useCallback } from 'react';
import { MdPerson, MdAssignmentInd, MdLocationOn, MdQrCode, MdInventory2, MdFactCheck } from 'react-icons/md';
import { cargaService, DetalleCarga } from '../../../../services/carga.service';
import { ModalBase, Boton, Buscador, Indicador, Pastilla, TablaVacia, COLORES } from '@/app/components/rfid/ui';

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
      detalle.inventariador?.nombre?.toLowerCase().includes(searchTerm)
    );
  });

  const totalActivos = detalles.length;
  const inventariados = detalles.filter(d => d.inventariado?.trim() === '1').length;
  const conResponsable = detalles.filter(d => d.responsable).length;
  const avance = totalActivos > 0 ? Math.round((inventariados / totalActivos) * 100) : 0;

  return (
    <ModalBase
      abierto
      onCerrar={onClose}
      ancho="max-w-6xl"
      titulo="Detalle de la carga"
      subtitulo={descripcion}
      pie={<>
        <span className="mr-auto self-center text-sm" style={{ color: COLORES.suave }}>
          Mostrando {detallesFiltrados.length} de {totalActivos} activos
        </span>
        <Boton onClick={onClose}>Cerrar</Boton>
      </>}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Indicador etiqueta="Activos" valor={totalActivos} icono={<MdInventory2 size={22} />} tono="marca" />
        <Indicador etiqueta="Inventariados" valor={`${inventariados}`} icono={<MdFactCheck size={22} />} tono="acento"
          detalle={`${avance}% de avance`} />
        <Indicador etiqueta="Con custodio" valor={conResponsable} icono={<MdPerson size={22} />} tono="neutro" />
      </div>

      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#f1f5f9' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${avance}%`, backgroundColor: '#22c4a1' }} />
      </div>

      <div className="tabla-marco">
        <div className="tabla-barra">
          <Buscador valor={filtro} onCambio={setFiltro} placeholder="Buscar por código, descripción, custodio…" className="sm:max-w-md" />
        </div>
        <div className="tabla-scroll max-h-[45vh] overflow-y-auto">
          <table className="tabla tabla-fija">
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th>Código</th>
                <th>Descripción</th>
                <th>Ubicación</th>
                <th>Custodio</th>
                <th>Inventariador</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TablaVacia columnas={7} texto="Cargando activos…" />
              ) : detallesFiltrados.length === 0 ? (
                <TablaVacia columnas={7} icono={<MdQrCode size={36} />} texto="No se encontraron activos" />
              ) : (
                detallesFiltrados.map((detalle, idx) => (
                  <tr key={detalle.id}>
                    <td className="col-num font-mono" style={{ color: COLORES.tenue }}>{idx + 1}</td>
                    <td><span className="codigo">{detalle.codActivo || '—'}</span></td>
                    <td>{detalle.activo?.descripcion || '—'}</td>
                    <td>
                      {detalle.activo?.oficina ? (
                        <span className="flex items-center gap-1 text-xs" style={{ color: COLORES.suave }}>
                          <MdLocationOn size={14} style={{ color: COLORES.tenue }} />
                          {detalle.activo.oficina.nombreOficina}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: COLORES.tenue }}>Sin ubicación</span>
                      )}
                    </td>
                    <td>
                      {detalle.responsable ? (
                        <span className="flex items-center gap-1.5">
                          <MdPerson size={15} style={{ color: COLORES.brand }} />
                          {detalle.responsable.nombreResponsable}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: COLORES.tenue }}>Sin asignar</span>
                      )}
                    </td>
                    <td>
                      {detalle.inventariador ? (
                        <span className="flex items-center gap-1.5">
                          <MdAssignmentInd size={15} style={{ color: COLORES.accent }} />
                          {detalle.inventariador.nombre}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: COLORES.tenue }}>Sin asignar</span>
                      )}
                    </td>
                    <td>
                      {detalle.inventariado?.trim() === '1'
                        ? <Pastilla texto="Inventariado" tono="ok" />
                        : <Pastilla texto="Pendiente" tono="neutro" />}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ModalBase>
  );
}
