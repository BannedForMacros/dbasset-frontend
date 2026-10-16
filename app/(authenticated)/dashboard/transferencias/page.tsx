'use client';

import { useCallback, useEffect, useState } from 'react';
import { MdAdd, MdCompareArrows, MdCheck, MdClose, MdBlock, MdArrowForward } from 'react-icons/md';
import Select from '@/app/components/Select';
import BuscadorActivo from '@/app/components/rfid/BuscadorActivo';
import { PageHeader, Card, Boton, Campo, ModalBase, Tabla, tdCls, Pastilla, inputCls, inputStyle, useAviso, COLORES } from '@/app/components/rfid/ui';
import { transferenciaService, Transferencia } from '@/app/services/transferencia.service';
import { Activo } from '@/app/services/activo.service';
import { areaService, Area } from '@/app/services/area.service';
import { oficinaService, Oficina } from '@/app/services/oficina.service';
import { responsableService, Responsable } from '@/app/services/responsable.service';
import { Local } from '@/app/services/local.service';
import { fmtFechaHora, mensajeError } from '@/app/utils/exportar';

const TONO: Record<string, 'ok' | 'alerta' | 'error' | 'neutro'> = {
  PENDIENTE: 'alerta', RECIBIDA: 'ok', RECHAZADA: 'error', ANULADA: 'neutro',
};
const ETIQUETA: Record<string, string> = {
  PENDIENTE: 'Pendiente de recepción', RECIBIDA: 'Recibida', RECHAZADA: 'Rechazada', ANULADA: 'Anulada',
};

export default function TransferenciasPage() {
  const { mostrar, nodo } = useAviso();
  const [lista, setLista] = useState<Transferencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [estado, setEstado] = useState('PENDIENTE');

  const [areas, setAreas] = useState<Area[]>([]);
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [responsables, setResponsables] = useState<Responsable[]>([]);

  const [nueva, setNueva] = useState(false);
  const [activo, setActivo] = useState<Activo | null>(null);
  const [form, setForm] = useState({ codArea: '', codOficina: '', codResp: '', motivo: '' });
  const [guardando, setGuardando] = useState(false);

  const [recibiendo, setRecibiendo] = useState<Transferencia | null>(null);
  const [recepcion, setRecepcion] = useState({ recibidoPor: '', observacion: '' });

  const cargar = useCallback(async () => {
    setCargando(true);
    try { setLista(await transferenciaService.listar(estado ? { estado } : {})); }
    catch (e) { mostrar('error', mensajeError(e, 'No se pudieron cargar las transferencias')); }
    finally { setCargando(false); }
  }, [estado, mostrar]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    Promise.all([areaService.listarActivos(), oficinaService.listarActivos(), responsableService.listarActivos()])
      .then(([a, o, r]) => { setAreas(a); setOficinas(o); setResponsables(r); })
      .catch(e => mostrar('error', mensajeError(e, 'No se pudieron cargar las ubicaciones')));
  }, [mostrar]);

  const oficinasDelArea = form.codArea ? oficinas.filter(o => (o.area as Area)?.codArea === Number(form.codArea)) : [];

  const abrirNueva = () => {
    setActivo(null);
    setForm({ codArea: '', codOficina: '', codResp: '', motivo: '' });
    setNueva(true);
  };

  const registrar = async () => {
    if (!activo?.id) { mostrar('error', 'Seleccione el activo'); return; }
    if (!form.codArea) { mostrar('error', 'Seleccione el área destino'); return; }
    setGuardando(true);
    try {
      await transferenciaService.crear({
        idActivo: activo.id, codAreaDestino: Number(form.codArea),
        codOficinaDestino: form.codOficina ? Number(form.codOficina) : undefined,
        codRespDestino: form.codResp ? Number(form.codResp) : undefined,
        motivo: form.motivo || undefined,
      });
      mostrar('ok', 'Transferencia registrada: queda pendiente de recepción');
      setNueva(false);
      cargar();
    } catch (e) { mostrar('error', mensajeError(e, 'No se pudo registrar')); }
    finally { setGuardando(false); }
  };

  const confirmar = async () => {
    if (!recibiendo) return;
    try {
      await transferenciaService.confirmar(recibiendo.id, recepcion.recibidoPor || undefined, recepcion.observacion || undefined);
      mostrar('ok', `Recepción confirmada: ${recibiendo.codActivo} ahora está en ${recibiendo.areaDestino}`);
      setRecibiendo(null); cargar();
    } catch (e) { mostrar('error', mensajeError(e)); }
  };

  const rechazar = async () => {
    if (!recibiendo) return;
    if (!recepcion.observacion.trim()) { mostrar('error', 'Indique el motivo del rechazo en la observación'); return; }
    try {
      await transferenciaService.rechazar(recibiendo.id, recepcion.observacion);
      mostrar('ok', 'Transferencia rechazada; el activo sigue en su ubicación'); setRecibiendo(null); cargar();
    } catch (e) { mostrar('error', mensajeError(e)); }
  };

  const anular = async (t: Transferencia) => {
    if (!confirm(`¿Anular la transferencia de ${t.codActivo}?`)) return;
    try { await transferenciaService.anular(t.id); mostrar('ok', 'Transferencia anulada'); cargar(); }
    catch (e) { mostrar('error', mensajeError(e)); }
  };

  const ubic = (area?: string, oficina?: string) => [area, oficina].filter(Boolean).join(' / ') || '—';

  return (
    <div className="space-y-6">
      {nodo}
      <PageHeader titulo="Transferencias" subtitulo="Movimiento de activos entre áreas con confirmación de recepción"
        icono={<MdCompareArrows size={15} />}
        acciones={<Boton onClick={abrirNueva}><MdAdd size={19} /> Nueva transferencia</Boton>} />

      <Card>
        <div className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div className="w-60">
            <Select value={estado} onChange={setEstado} placeholder="Todas"
              options={Object.entries(ETIQUETA).map(([v, l]) => ({ value: v, label: l }))} />
          </div>
          <span className="text-xs" style={{ color: COLORES.tenue }}>{lista.length} transferencias</span>
        </div>
        <Tabla columnas={['#', 'Activo', 'Origen', '', 'Destino', 'Recibe', 'Envío', 'Estado', '']} cargando={cargando} vacio={lista.length === 0}>
          {lista.map(t => (
            <tr key={t.id} style={{ borderBottom: '1px solid #f8fafc' }}>
              <td className={tdCls} style={{ color: '#cbd5e1' }}>{t.id}</td>
              <td className={tdCls}>
                <p className="font-semibold">{t.descripcionActivo}</p>
                <span className="text-xs font-mono" style={{ color: COLORES.suave }}>{t.codActivo}</span>
              </td>
              <td className={tdCls} style={{ color: COLORES.suave }}>{ubic(t.areaOrigen, t.oficinaOrigen)}<p className="text-xs">{t.responsableOrigen}</p></td>
              <td className={tdCls}><MdArrowForward style={{ color: COLORES.accent }} /></td>
              <td className={tdCls}><span className="font-semibold">{ubic(t.areaDestino, t.oficinaDestino)}</span></td>
              <td className={tdCls} style={{ color: COLORES.suave }}>
                {t.responsableDestino ?? '—'}
                {t.recibidoPor && <p className="text-xs">Confirmó: {t.recibidoPor} · {fmtFechaHora(t.fechaRecepcion)}</p>}
              </td>
              <td className={tdCls} style={{ color: COLORES.suave }}>
                {fmtFechaHora(t.fechaEnvio)}<p className="text-xs">{t.registradoPor}{t.origenRegistro === 'APP' ? ' (app)' : ''}</p>
              </td>
              <td className={tdCls}>
                <Pastilla texto={ETIQUETA[t.estado]} tono={TONO[t.estado]} />
                {t.observacionRecepcion && <p className="text-xs mt-1" style={{ color: COLORES.tenue }}>{t.observacionRecepcion}</p>}
              </td>
              <td className={tdCls}>
                {t.estado === 'PENDIENTE' && (
                  <div className="flex gap-1 justify-end">
                    <Boton pequeno variante="exito" onClick={() => { setRecibiendo(t); setRecepcion({ recibidoPor: t.responsableDestino ?? '', observacion: '' }); }}>
                      <MdCheck /> Recepción
                    </Boton>
                    <Boton pequeno variante="secundario" title="Anular" onClick={() => anular(t)}><MdBlock /></Boton>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </Tabla>
      </Card>

      <ModalBase abierto={nueva} onCerrar={() => setNueva(false)} titulo="Nueva transferencia"
        subtitulo="El activo cambia de ubicación cuando el área destino confirma la recepción"
        pie={<>
          <Boton variante="secundario" onClick={() => setNueva(false)}>Cancelar</Boton>
          <Boton onClick={registrar} disabled={guardando}>{guardando ? 'Registrando…' : 'Registrar'}</Boton>
        </>}>
        <Campo etiqueta="Activo a transferir" requerido>
          <BuscadorActivo valor={activo} onElegir={setActivo} />
        </Campo>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select label="Área destino" required value={form.codArea}
            onChange={v => setForm(f => ({ ...f, codArea: v, codOficina: '' }))}
            options={areas.map(a => ({ value: a.codArea!, label: `${a.nombreArea}${(a.local as Local)?.nombreLocal ? ` (${(a.local as Local).nombreLocal})` : ''}` }))} />
          <Select label="Oficina destino" value={form.codOficina} disabled={!form.codArea}
            placeholder={form.codArea ? 'Opcional' : 'Primero el área'}
            onChange={v => setForm(f => ({ ...f, codOficina: v }))}
            options={oficinasDelArea.map(o => ({ value: o.codOficina!, label: o.nombreOficina }))} />
        </div>
        <Select label="Responsable de la recepción" value={form.codResp} placeholder="Opcional (mantiene el custodio)"
          onChange={v => setForm(f => ({ ...f, codResp: v }))}
          options={responsables.map(r => ({ value: r.codResponsable!, label: r.nombreResponsable }))} />
        <Campo etiqueta="Motivo">
          <textarea value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
            rows={2} className={inputCls} style={inputStyle} maxLength={500} />
        </Campo>
      </ModalBase>

      <ModalBase abierto={!!recibiendo} onCerrar={() => setRecibiendo(null)} titulo="Confirmar recepción"
        subtitulo={recibiendo ? `${recibiendo.codActivo} · ${recibiendo.descripcionActivo ?? ''}` : ''}
        pie={<>
          <Boton variante="peligro" onClick={rechazar}><MdClose /> Rechazar</Boton>
          <Boton variante="secundario" onClick={() => setRecibiendo(null)}>Cancelar</Boton>
          <Boton onClick={confirmar}><MdCheck /> Confirmar recepción</Boton>
        </>}>
        <p className="text-sm" style={{ color: COLORES.suave }}>
          Destino: <b>{recibiendo && ubic(recibiendo.areaDestino, recibiendo.oficinaDestino)}</b>
        </p>
        <Campo etiqueta="Recibido por">
          <input value={recepcion.recibidoPor} onChange={e => setRecepcion(r => ({ ...r, recibidoPor: e.target.value }))}
            className={inputCls} style={inputStyle} placeholder="Nombre de quien recibe" />
        </Campo>
        <Campo etiqueta="Observación">
          <textarea value={recepcion.observacion} onChange={e => setRecepcion(r => ({ ...r, observacion: e.target.value }))}
            rows={2} className={inputCls} style={inputStyle} maxLength={500} placeholder="Obligatoria si se rechaza" />
        </Campo>
      </ModalBase>
    </div>
  );
}
