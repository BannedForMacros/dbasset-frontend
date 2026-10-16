'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MdAdd, MdRemoveCircleOutline, MdAttachFile, MdVisibility, MdUploadFile, MdInsertDriveFile } from 'react-icons/md';
import Select from '@/app/components/Select';
import BuscadorActivo from '@/app/components/rfid/BuscadorActivo';
import { PageHeader, Card, Boton, Campo, ModalBase, Tabla, tdCls, Pastilla, Epc, inputCls, inputStyle, useAviso, COLORES } from '@/app/components/rfid/ui';
import { bajaService, Baja, MotivoBaja, MOTIVOS_BAJA, ETIQUETA_MOTIVO, ACCEPT_ADJUNTOS } from '@/app/services/baja.service';
import { Activo } from '@/app/services/activo.service';
import { fmtFecha, fmtFechaHora, mensajeError } from '@/app/utils/exportar';

const hoy = () => new Date().toISOString().slice(0, 10);
const tamano = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default function BajasPage() {
  const { mostrar, nodo } = useAviso();
  const [lista, setLista] = useState<Baja[]>([]);
  const [cargando, setCargando] = useState(true);
  const [rango, setRango] = useState({ desde: '', hasta: '' });

  const [nueva, setNueva] = useState(false);
  const [activo, setActivo] = useState<Activo | null>(null);
  const [form, setForm] = useState({ motivo: '' as MotivoBaja | '', detalle: '', autorizadoPor: '', fechaBaja: hoy() });
  const [archivos, setArchivos] = useState<File[]>([]);
  const [guardando, setGuardando] = useState(false);

  const [detalle, setDetalle] = useState<Baja | null>(null);
  const adjuntoRef = useRef<HTMLInputElement>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try { setLista(await bajaService.listar({ desde: rango.desde || undefined, hasta: rango.hasta || undefined })); }
    catch (e) { mostrar('error', mensajeError(e, 'No se pudieron cargar las bajas')); }
    finally { setCargando(false); }
  }, [rango, mostrar]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirNueva = () => {
    setActivo(null); setArchivos([]);
    setForm({ motivo: '', detalle: '', autorizadoPor: '', fechaBaja: hoy() });
    setNueva(true);
  };

  const registrar = async () => {
    if (!activo?.id) { mostrar('error', 'Seleccione el activo'); return; }
    if (!form.motivo) { mostrar('error', 'Seleccione el motivo'); return; }
    if (!form.autorizadoPor.trim()) { mostrar('error', 'Indique quién autoriza la baja'); return; }
    if (!confirm(`¿Dar de baja ${activo.codActivo}? Quedará INACTIVO (no se elimina).`)) return;
    setGuardando(true);
    try {
      const b = await bajaService.crear({
        idActivo: activo.id, motivo: form.motivo, detalle: form.detalle || undefined,
        autorizadoPor: form.autorizadoPor.trim(), fechaBaja: form.fechaBaja || undefined,
      });
      if (archivos.length) {
        try { await bajaService.adjuntar(b.id, archivos); }
        catch (e) { mostrar('error', `Baja registrada, pero falló el adjunto: ${mensajeError(e)}. Puede adjuntarlo desde el detalle.`); }
      }
      mostrar('ok', `${activo.codActivo} dado de baja`);
      setNueva(false); cargar();
    } catch (e) { mostrar('error', mensajeError(e, 'No se pudo registrar la baja')); }
    finally { setGuardando(false); }
  };

  const verDetalle = async (b: Baja) => {
    try { setDetalle(await bajaService.obtener(b.id)); }
    catch (e) { mostrar('error', mensajeError(e)); }
  };

  const agregarAdjuntos = async (files: FileList | null) => {
    if (!detalle || !files?.length) return;
    try {
      await bajaService.adjuntar(detalle.id, Array.from(files));
      setDetalle(await bajaService.obtener(detalle.id));
      mostrar('ok', 'Adjunto agregado'); cargar();
    } catch (e) { mostrar('error', mensajeError(e, 'No se pudo adjuntar')); }
    if (adjuntoRef.current) adjuntoRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {nodo}
      <PageHeader titulo="Bajas de activos" subtitulo="El activo queda inactivo y conserva su historial"
        icono={<MdRemoveCircleOutline size={15} />}
        acciones={<Boton onClick={abrirNueva}><MdAdd size={19} /> Registrar baja</Boton>} />

      <Card>
        <div className="flex flex-wrap items-end gap-3 p-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <Campo etiqueta="Desde"><input type="date" value={rango.desde} onChange={e => setRango(r => ({ ...r, desde: e.target.value }))} className={inputCls} style={inputStyle} /></Campo>
          <Campo etiqueta="Hasta"><input type="date" value={rango.hasta} onChange={e => setRango(r => ({ ...r, hasta: e.target.value }))} className={inputCls} style={inputStyle} /></Campo>
          <span className="text-xs pb-3" style={{ color: COLORES.tenue }}>{lista.length} bajas</span>
        </div>
        <Tabla columnas={['Fecha', 'Activo', 'Motivo', 'Autorizó', 'Última ubicación', 'Sustento', '']} cargando={cargando} vacio={lista.length === 0}>
          {lista.map(b => (
            <tr key={b.id} style={{ borderBottom: '1px solid #f8fafc' }}>
              <td className={tdCls}>{fmtFecha(b.fechaBaja)}</td>
              <td className={tdCls}>
                <p className="font-semibold">{b.descripcionActivo}</p>
                <span className="text-xs font-mono" style={{ color: COLORES.suave }}>{b.codActivo}</span>
              </td>
              <td className={tdCls}><Pastilla texto={ETIQUETA_MOTIVO[b.motivo] ?? b.motivo} tono="error" /></td>
              <td className={tdCls}>{b.autorizadoPor}<p className="text-xs" style={{ color: COLORES.tenue }}>Registró: {b.registradoPor}</p></td>
              <td className={tdCls} style={{ color: COLORES.suave }}>{[b.area, b.oficina].filter(Boolean).join(' / ') || '—'}</td>
              <td className={tdCls}>
                {b.totalAdjuntos > 0
                  ? <span className="inline-flex items-center gap-1 text-xs" style={{ color: COLORES.brand }}><MdAttachFile /> {b.totalAdjuntos}</span>
                  : <span className="text-xs" style={{ color: '#f59e0b' }}>Sin sustento</span>}
              </td>
              <td className={tdCls}><Boton pequeno variante="secundario" onClick={() => verDetalle(b)}><MdVisibility /> Ver</Boton></td>
            </tr>
          ))}
        </Tabla>
      </Card>

      <ModalBase abierto={nueva} onCerrar={() => setNueva(false)} titulo="Registrar baja"
        subtitulo="El activo no se elimina: queda INACTIVO para la trazabilidad"
        pie={<>
          <Boton variante="secundario" onClick={() => setNueva(false)}>Cancelar</Boton>
          <Boton variante="peligro" onClick={registrar} disabled={guardando}>{guardando ? 'Registrando…' : 'Dar de baja'}</Boton>
        </>}>
        <Campo etiqueta="Activo" requerido>
          <BuscadorActivo valor={activo} onElegir={setActivo} />
        </Campo>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select label="Motivo" required value={form.motivo} onChange={v => setForm(f => ({ ...f, motivo: v as MotivoBaja }))}
            options={MOTIVOS_BAJA} />
          <Campo etiqueta="Fecha de baja" requerido>
            <input type="date" value={form.fechaBaja} max={hoy()} onChange={e => setForm(f => ({ ...f, fechaBaja: e.target.value }))} className={inputCls} style={inputStyle} />
          </Campo>
        </div>
        <Campo etiqueta="Autorizado por" requerido>
          <input value={form.autorizadoPor} onChange={e => setForm(f => ({ ...f, autorizadoPor: e.target.value }))}
            className={inputCls} style={inputStyle} placeholder="Nombre y cargo de quien autoriza" maxLength={200} />
        </Campo>
        <Campo etiqueta="Detalle">
          <textarea value={form.detalle} onChange={e => setForm(f => ({ ...f, detalle: e.target.value }))}
            rows={3} className={inputCls} style={inputStyle} maxLength={1000} />
        </Campo>
        <Campo etiqueta="Sustento (Word, PDF, imagen, correo .msg/.eml)">
          <input type="file" multiple accept={ACCEPT_ADJUNTOS} onChange={e => setArchivos(Array.from(e.target.files ?? []))}
            className="text-sm" />
          {archivos.length > 0 && (
            <ul className="text-xs space-y-1" style={{ color: COLORES.suave }}>
              {archivos.map(f => <li key={f.name}><MdInsertDriveFile className="inline" /> {f.name} ({tamano(f.size)})</li>)}
            </ul>
          )}
        </Campo>
      </ModalBase>

      <ModalBase abierto={!!detalle} onCerrar={() => setDetalle(null)} titulo={`Baja de ${detalle?.codActivo ?? ''}`}
        subtitulo={detalle?.descripcionActivo}
        pie={<Boton onClick={() => setDetalle(null)}>Cerrar</Boton>}>
        {detalle && (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Dato e="Motivo" v={ETIQUETA_MOTIVO[detalle.motivo] ?? detalle.motivo} />
              <Dato e="Fecha de baja" v={fmtFecha(detalle.fechaBaja)} />
              <Dato e="Autorizado por" v={detalle.autorizadoPor} />
              <Dato e="Registrado por" v={`${detalle.registradoPor ?? ''} · ${fmtFechaHora(detalle.fechaRegistro)}`} />
              <Dato e="Última ubicación" v={[detalle.area, detalle.oficina].filter(Boolean).join(' / ') || '—'} />
              <Dato e="Custodio" v={detalle.responsable ?? '—'} />
              <div className="col-span-2"><Dato e="EPC" v={<Epc valor={detalle.epc} />} /></div>
              {detalle.detalle && <div className="col-span-2"><Dato e="Detalle" v={detalle.detalle} /></div>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORES.tenue }}>Sustento adjunto</p>
                <input ref={adjuntoRef} type="file" multiple accept={ACCEPT_ADJUNTOS} className="hidden" onChange={e => agregarAdjuntos(e.target.files)} />
                <Boton pequeno variante="secundario" onClick={() => adjuntoRef.current?.click()}><MdUploadFile /> Agregar</Boton>
              </div>
              {(detalle.adjuntos ?? []).length === 0 && <p className="text-sm" style={{ color: COLORES.tenue }}>Sin archivos</p>}
              {(detalle.adjuntos ?? []).map(a => (
                <button key={a.id} onClick={() => bajaService.abrirAdjunto(a).catch(e => mostrar('error', mensajeError(e)))}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left"
                  style={{ border: `1.5px solid ${COLORES.borde}` }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <span className="flex items-center gap-2"><MdAttachFile style={{ color: COLORES.brand }} /> {a.nombreOriginal}</span>
                  <span className="text-xs" style={{ color: COLORES.tenue }}>{tamano(a.tamano)} · {fmtFechaHora(a.fechaRegistro)}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </ModalBase>
    </div>
  );
}

function Dato({ e, v }: { e: string; v: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs" style={{ color: COLORES.tenue }}>{e}</p>
      <div className="font-medium" style={{ color: COLORES.texto }}>{v}</div>
    </div>
  );
}
