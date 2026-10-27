'use client';

import { ReactNode } from 'react';
import { MdLink, MdLocationOn, MdWarning, MdCheckCircle, MdTableRows, MdPlace } from 'react-icons/md';
import Select from '@/app/components/Select';
import { CampoConfig } from '../../../../../services/configuracion.service';
import { PasoEncabezado, AvisoPaso } from '../PasoEncabezado';

interface Step3MapeoProps {
  campos: CampoConfig[];
  excelHeaders: string[];
  mapeo: Record<string, string>;
  modoUbicacion: 'excel' | 'unica' | null;
  onModoChange: (modo: 'excel' | 'unica') => void;
  onMapeoChange: (campo: string, columna: string) => void;
  onCampoToggle: (id: number, key: 'esVisible' | 'esObligatorio') => void;
}

function Interruptor({ activo, onClick, color, etiqueta }: { activo: boolean; onClick: () => void; color: string; etiqueta: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      title={etiqueta}
      onClick={onClick}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
      style={{ backgroundColor: activo ? color : '#cbd5e1' }}
    >
      <span className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
        style={{ transform: activo ? 'translateX(1.1rem)' : 'translateX(0.2rem)' }} />
    </button>
  );
}

function OpcionModo({ activo, onClick, icono, titulo, texto }: {
  activo: boolean; onClick: () => void; icono: ReactNode; titulo: string; texto: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left p-4 rounded-xl transition-all flex items-start gap-3"
      style={{
        backgroundColor: activo ? 'rgba(30,71,134,0.04)' : '#fff',
        border: `1.5px solid ${activo ? '#1e4786' : '#e2e8f0'}`,
        boxShadow: activo ? '0 0 0 3px rgba(30,71,134,0.1)' : 'none',
      }}
    >
      <span className="w-5 h-5 mt-0.5 rounded-full shrink-0 flex items-center justify-center"
        style={{ border: `2px solid ${activo ? '#1e4786' : '#cbd5e1'}` }}>
        {activo && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#1e4786' }} />}
      </span>
      <span>
        <span className="font-semibold flex items-center gap-1.5" style={{ color: '#0f172a' }}>
          <span style={{ color: '#1e4786' }}>{icono}</span>{titulo}
        </span>
        <span className="block text-sm mt-1" style={{ color: '#64748b' }}>{texto}</span>
      </span>
    </button>
  );
}

export default function Step3Mapeo({
  campos,
  excelHeaders,
  mapeo,
  modoUbicacion,
  onModoChange,
  onMapeoChange,
  onCampoToggle
}: Step3MapeoProps) {
  // Campos de ubicación (no están en configuración dinámica)
  const camposUbicacion = [
    { key: 'cod_local', label: 'Local / Sede' },
    { key: 'cod_area', label: 'Área' },
    { key: 'cod_oficina', label: 'Oficina' }
  ];

  const tieneUbicacion = camposUbicacion.every(cu => mapeo[cu.key]);
  const opcionesColumnas = excelHeaders.map((h) => ({ value: h, label: h }));
  const mapeados = campos.filter(c => mapeo[c.nombreCampoBd]).length;
  const obligatoriosFaltantes = campos.filter(c => c.esObligatorio && !mapeo[c.nombreCampoBd]).length;

  return (
    <div className="space-y-5">
      <PasoEncabezado
        icono={<MdLink size={24} />}
        titulo="Relacione las columnas del Excel"
        descripcion={`Se detectaron ${excelHeaders.length} columnas. Las que coinciden por nombre ya vienen relacionadas.`}
      />

      {/* MODO DE UBICACIÓN (obligatorio) */}
      <section className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: '#fff', border: '1.5px solid #e2e8f0' }}>
        <div className="flex items-center gap-2">
          <MdLocationOn size={18} style={{ color: '#1e4786' }} />
          <h4 className="font-semibold" style={{ color: '#0f172a' }}>¿Cómo se asigna la ubicación?</h4>
          <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>Obligatorio</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <OpcionModo
            activo={modoUbicacion === 'unica'}
            onClick={() => onModoChange('unica')}
            icono={<MdPlace size={17} />}
            titulo="Una sola ubicación para toda la carga"
            texto="Todos los activos del Excel van al mismo local, área y oficina. Se elige en el siguiente paso."
          />
          <OpcionModo
            activo={modoUbicacion === 'excel'}
            onClick={() => onModoChange('excel')}
            icono={<MdTableRows size={17} />}
            titulo="La ubicación viene en el Excel"
            texto="Cada activo trae su local, área y oficina en columnas del archivo."
          />
        </div>

        {modoUbicacion === 'unica' && (
          <AvisoPaso tono="ok" icono={<MdCheckCircle size={18} />}>
            Elegirá <b>local, área y oficina</b> para toda la carga en el siguiente paso. No necesita columnas de ubicación.
          </AvisoPaso>
        )}

        {modoUbicacion === 'excel' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {camposUbicacion.map((campo) => (
                <Select
                  key={campo.key}
                  label={campo.label}
                  required
                  value={mapeo[campo.key] || ''}
                  onChange={(v) => onMapeoChange(campo.key, v)}
                  placeholder="Seleccionar columna"
                  estado={!mapeo[campo.key] ? 'error' : 'ok'}
                  options={opcionesColumnas}
                />
              ))}
            </div>
            {tieneUbicacion ? (
              <AvisoPaso tono="ok" icono={<MdCheckCircle size={18} />}>
                Ubicación completa: cada activo tomará su ubicación del Excel.
              </AvisoPaso>
            ) : (
              <AvisoPaso tono="alerta" icono={<MdWarning size={18} />}>
                Relacione las columnas de <b>Local</b>, <b>Área</b> y <b>Oficina</b>.
              </AvisoPaso>
            )}
          </div>
        )}
      </section>

      {/* CAMPOS DEL ACTIVO */}
      <section className="tabla-marco">
        <div className="tabla-barra">
          <div>
            <h4 className="font-semibold" style={{ color: '#0f172a' }}>Campos del activo</h4>
            <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
              {mapeados} de {campos.length} campos relacionados
            </p>
          </div>
          {obligatoriosFaltantes > 0 ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#dc2626' }}>
              {obligatoriosFaltantes} obligatorio{obligatoriosFaltantes !== 1 ? 's' : ''} sin relacionar
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(34,196,161,0.12)', color: '#0f9b76' }}>
              Obligatorios completos
            </span>
          )}
        </div>

        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>Campo del sistema</th>
                <th style={{ minWidth: '16rem' }}>Columna del Excel</th>
                <th className="col-centro">Visible</th>
                <th className="col-centro">Obligatorio</th>
              </tr>
            </thead>
            <tbody>
              {campos.map((campo) => {
                const columna = mapeo[campo.nombreCampoBd];
                const falta = campo.esObligatorio && !columna;
                return (
                  <tr key={campo.id}>
                    <td>
                      <p className="font-semibold flex items-center gap-1.5">
                        {campo.etiquetaUsuario}
                        {campo.esObligatorio && <span style={{ color: '#ef4444' }}>*</span>}
                      </p>
                      <p className="text-xs font-mono" style={{ color: '#94a3b8' }}>{campo.nombreCampoBd}</p>
                    </td>
                    <td>
                      <Select
                        size="sm"
                        value={columna || ''}
                        onChange={(v) => onMapeoChange(campo.nombreCampoBd, v)}
                        placeholder="Sin relacionar"
                        estado={falta ? 'error' : columna ? 'ok' : undefined}
                        options={opcionesColumnas}
                      />
                    </td>
                    <td className="col-centro">
                      <Interruptor activo={campo.esVisible} color="#1e4786" etiqueta="Visible"
                        onClick={() => onCampoToggle(campo.id, 'esVisible')} />
                    </td>
                    <td className="col-centro">
                      <Interruptor activo={campo.esObligatorio} color="#ef4444" etiqueta="Obligatorio"
                        onClick={() => onCampoToggle(campo.id, 'esObligatorio')} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
