'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MdManageSearch, MdSearch, MdPhotoCamera, MdDelete, MdGpsFixed, MdCompareArrows, MdRemoveCircleOutline,
  MdSensors, MdSwapHoriz, MdAddAPhoto, MdAttachFile,
} from 'react-icons/md';
import { PageHeader, Card, Boton, Tabla, tdCls, Pastilla, Epc, inputCls, inputStyle, useAviso, COLORES } from '@/app/components/rfid/ui';
import { Activo, ActivoFoto, FichaActivo, activoRfidService } from '@/app/services/activo.service';
import { Local } from '@/app/services/local.service';
import { Area, areaService } from '@/app/services/area.service';
import { Oficina, oficinaService } from '@/app/services/oficina.service';
import { Responsable } from '@/app/services/responsable.service';
import { Estado } from '@/app/services/estado.service';
import { bajaService, ETIQUETA_MOTIVO, BajaAdjunto } from '@/app/services/baja.service';
import { fmtFecha, fmtFechaHora, mensajeError } from '@/app/utils/exportar';

export default function BusquedaPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm" style={{ color: COLORES.tenue }}>Cargando…</div>}>
      <Busqueda />
    </Suspense>
  );
}

function Busqueda() {
  const params = useSearchParams();
  const router = useRouter();
  const { mostrar, nodo } = useAviso();
  const [texto, setTexto] = useState('');
  const [incluirBajas, setIncluirBajas] = useState(true);
  const [resultados, setResultados] = useState<Activo[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [ficha, setFicha] = useState<FichaActivo | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [oficinas, setOficinas] = useState<Oficina[]>([]);

  const abrirFicha = useCallback(async (id: number) => {
    try { setFicha(await activoRfidService.ficha(id)); }
    catch (e) { mostrar('error', mensajeError(e, 'No se pudo cargar la ficha')); }
  }, [mostrar]);

  useEffect(() => {
    const id = Number(params.get('id'));
    if (id) abrirFicha(id);
  }, [params, abrirFicha]);

  useEffect(() => {
    Promise.all([areaService.listarActivos(), oficinaService.listarActivos()])
      .then(([a, o]) => { setAreas(a); setOficinas(o); }).catch(() => undefined);
  }, []);

  const buscar = async () => {
    if (texto.trim().length < 2) { mostrar('error', 'Escriba al menos 2 caracteres'); return; }
    setBuscando(true);
    try {
      const r = await activoRfidService.buscar(texto.trim(), incluirBajas);
      setResultados(r);
      if (r.length === 1) { router.replace(`/dashboard/busqueda?id=${r[0].id}`); abrirFicha(r[0].id!); }
    } catch (e) { mostrar('error', mensajeError(e)); }
    finally { setBuscando(false); }
  };

  const nombreArea = (cod?: number) => areas.find(a => a.codArea === cod)?.nombreArea ?? (cod ? `Área ${cod}` : '—');
  const nombreOficina = (cod?: number) => oficinas.find(o => o.codOficina === cod)?.nombreOficina ?? (cod ? `Oficina ${cod}` : '');

  return (
    <div className="space-y-6">
      {nodo}
      <PageHeader titulo="Búsqueda de activos" subtitulo="Por código interno, descripción, número de serie o EPC" icono={<MdManageSearch size={15} />} />

      <Card className="p-5">
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <div className="relative flex-1">
            <MdSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORES.tenue }} />
            <input value={texto} onChange={e => setTexto(e.target.value)} autoFocus
              onKeyDown={e => { if (e.key === 'Enter') buscar(); }}
              placeholder="Ej.: ACT-0001, laptop, 5CD1234, E2000017…" className={`${inputCls} pl-10`} style={inputStyle} />
          </div>
          <label className="flex items-center gap-2 text-sm px-2" style={{ color: COLORES.suave }}>
            <input type="checkbox" checked={incluirBajas} onChange={e => setIncluirBajas(e.target.checked)} /> Incluir dados de baja
          </label>
          <Boton onClick={buscar} disabled={buscando}>{buscando ? 'Buscando…' : 'Buscar'}</Boton>
        </div>
      </Card>

      {resultados && !ficha && (
        <Card>
          <Tabla columnas={['Código', 'Descripción', 'Serie', 'EPC', 'Ubicación', 'Situación']} vacio={resultados.length === 0}>
            {resultados.map(a => (
              <tr key={a.id} className="cursor-pointer" style={{ borderBottom: '1px solid #f8fafc' }}
                onClick={() => { router.replace(`/dashboard/busqueda?id=${a.id}`); abrirFicha(a.id!); }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fbff')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td className={`${tdCls} font-mono text-xs`} style={{ color: COLORES.brand }}>{a.codActivo}</td>
                <td className={`${tdCls} font-semibold`}>{a.descripcion}</td>
                <td className={`${tdCls} font-mono text-xs`}>{a.serie ?? '—'}</td>
                <td className={tdCls}><Epc valor={a.epc} /></td>
                <td className={tdCls} style={{ color: COLORES.suave }}>{[(a.area as Area)?.nombreArea, (a.oficina as Oficina)?.nombreOficina].filter(Boolean).join(' / ') || '—'}</td>
                <td className={tdCls}><Pastilla texto={a.situacion === 'INACTIVO' ? 'Inactivo (baja)' : 'Activo'} tono={a.situacion === 'INACTIVO' ? 'error' : 'ok'} /></td>
              </tr>
            ))}
          </Tabla>
        </Card>
      )}

      {ficha && (
        <Ficha ficha={ficha} nombreArea={nombreArea} nombreOficina={nombreOficina}
          onVolver={() => { setFicha(null); router.replace('/dashboard/busqueda'); }}
          onRecargar={() => abrirFicha(ficha.activo.id!)} mostrar={mostrar} />
      )}
    </div>
  );
}

function Ficha({ ficha, nombreArea, nombreOficina, onVolver, onRecargar, mostrar }: {
  ficha: FichaActivo; nombreArea: (c?: number) => string; nombreOficina: (c?: number) => string;
  onVolver: () => void; onRecargar: () => void; mostrar: (t: 'ok' | 'error' | 'info', m: string) => void;
}) {
  const router = useRouter();
  const a = ficha.activo;
  const inactivo = a.situacion === 'INACTIVO';

  type Evento = { fecha: string; tipo: string; texto: string; icono: React.ReactNode };
  const eventos: Evento[] = [
    ...(a.createdAt ? [{ fecha: a.createdAt, tipo: 'Alta', texto: 'Registro del activo en el sistema', icono: <MdAddAPhoto /> }] : []),
    ...ficha.transferencias.map(t => ({
      fecha: t.fechaEnvio, tipo: `Transferencia (${String(t.estado).toLowerCase()})`,
      texto: `${t.areaOrigen ?? '—'} → ${t.areaDestino}${t.oficinaDestino ? ` / ${t.oficinaDestino}` : ''}${t.recibidoPor ? ` · recibió ${t.recibidoPor}` : ''}`,
      icono: <MdCompareArrows />,
    })),
    ...ficha.reubicaciones.map(r => ({
      fecha: r.fechaRegistro ?? '', tipo: 'Reubicación (app)',
      texto: `${nombreArea(r.codAreaAnterior)} → ${nombreArea(r.codAreaNuevo)} ${nombreOficina(r.codOficinaaNuevo)}${r.observacion ? ` · ${r.observacion}` : ''}`,
      icono: <MdSwapHoriz />,
    })),
    ...ficha.inventarios.map(i => ({
      fecha: i.ultimaLectura ?? i.fechaCreacion, tipo: 'Inventario RFID',
      texto: `${i.descripcion}: ${i.resultado === 'ENCONTRADO' ? 'encontrado' : i.resultado === 'NO_ENCONTRADO' ? 'no encontrado' : 'leído fuera de su ubicación'}`,
      icono: <MdSensors />,
    })),
    ...(ficha.baja ? [{
      fecha: ficha.baja.fechaRegistro, tipo: 'Baja',
      texto: `${ETIQUETA_MOTIVO[ficha.baja.motivo] ?? ficha.baja.motivo} · autorizó ${ficha.baja.autorizadoPor}`, icono: <MdRemoveCircleOutline />,
    }] : []),
  ].sort((x, y) => (y.fecha ?? '').localeCompare(x.fecha ?? ''));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Boton variante="secundario" onClick={onVolver}>← Nueva búsqueda</Boton>
        <div className="flex flex-wrap gap-2">
          <Boton variante="secundario" disabled title="Requiere la app móvil con el RFD8500 (modo localizar por proximidad)">
            <MdGpsFixed /> Localizar activo
          </Boton>
          {!inactivo && <Boton variante="secundario" onClick={() => router.push('/dashboard/transferencias')}><MdCompareArrows /> Transferir</Boton>}
          {!inactivo && <Boton variante="peligro" onClick={() => router.push('/dashboard/bajas')}><MdRemoveCircleOutline /> Dar de baja</Boton>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xl font-bold" style={{ color: COLORES.texto }}>{a.descripcion}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: '#f1f5f9', color: COLORES.suave }}>{a.codActivo}</span>
                <Epc valor={a.epc} />
              </div>
            </div>
            <Pastilla texto={inactivo ? 'Inactivo (baja)' : 'Activo'} tono={inactivo ? 'error' : 'ok'} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <Dato e="Categoría" v={a.categoria} />
            <Dato e="Código interno" v={a.codInterno} />
            <Dato e="N.º de serie" v={a.serie} />
            <Dato e="Marca / modelo" v={[a.marca, a.modelo].filter(Boolean).join(' ')} />
            <Dato e="Fecha de adquisición" v={a.fechaCompra} />
            <Dato e="Estado físico" v={(a.estado as Estado)?.nombreEstado} />
            <Dato e="Local" v={(a.local as Local)?.nombreLocal} />
            <Dato e="Área" v={(a.area as Area)?.nombreArea} />
            <Dato e="Oficina" v={(a.oficina as Oficina)?.nombreOficina} />
            <Dato e="Custodio" v={(a.responsable as Responsable)?.nombreResponsable} />
          </div>
          {ficha.baja && <BajaResumen baja={ficha.baja} mostrar={mostrar} />}
        </Card>

        <Fotos idActivo={a.id!} fotos={ficha.fotos} onCambio={onRecargar} mostrar={mostrar} />
      </div>

      <Card>
        <p className="px-5 pt-4 pb-2 text-sm font-semibold" style={{ color: COLORES.texto }}>Historial de movimientos</p>
        <Tabla columnas={['Fecha', 'Movimiento', 'Detalle']} vacio={eventos.length === 0}>
          {eventos.map((ev, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
              <td className={`${tdCls} whitespace-nowrap`} style={{ color: COLORES.suave }}>{fmtFechaHora(ev.fecha)}</td>
              <td className={`${tdCls} font-semibold`}><span className="inline-flex items-center gap-2"><span style={{ color: COLORES.accent }}>{ev.icono}</span>{ev.tipo}</span></td>
              <td className={tdCls}>{ev.texto}</td>
            </tr>
          ))}
        </Tabla>
      </Card>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BajaResumen({ baja, mostrar }: { baja: any; mostrar: (t: 'ok' | 'error' | 'info', m: string) => void }) {
  return (
    <div className="p-3 rounded-xl space-y-2" style={{ backgroundColor: 'rgba(239,68,68,0.05)', border: '1.5px solid rgba(239,68,68,0.2)' }}>
      <p className="text-sm font-semibold" style={{ color: '#b91c1c' }}>
        Dado de baja el {fmtFecha(baja.fechaBaja)} · {ETIQUETA_MOTIVO[baja.motivo] ?? baja.motivo} · autorizó {baja.autorizadoPor}
      </p>
      {baja.detalle && <p className="text-xs" style={{ color: COLORES.suave }}>{baja.detalle}</p>}
      <div className="flex flex-wrap gap-2">
        {(baja.adjuntos ?? []).map((adj: BajaAdjunto) => (
          <Boton key={adj.id} pequeno variante="secundario" onClick={() => bajaService.abrirAdjunto(adj).catch(e => mostrar('error', mensajeError(e)))}>
            <MdAttachFile /> {adj.nombreOriginal}
          </Boton>
        ))}
      </div>
    </div>
  );
}

function Fotos({ idActivo, fotos, onCambio, mostrar }: {
  idActivo: number; fotos: ActivoFoto[]; onCambio: () => void; mostrar: (t: 'ok' | 'error' | 'info', m: string) => void;
}) {
  const [urls, setUrls] = useState<Record<number, string>>({});
  const [subiendo, setSubiendo] = useState(false);
  const [grande, setGrande] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let vivo = true;
    const creadas: string[] = [];
    Promise.all(fotos.map(async f => {
      try { const u = await activoRfidService.urlFoto(f.id); creadas.push(u); return [f.id, u] as const; }
      catch { return null; }
    })).then(pares => {
      if (vivo) setUrls(Object.fromEntries(pares.filter((p): p is readonly [number, string] => p !== null)));
    });
    return () => { vivo = false; creadas.forEach(u => URL.revokeObjectURL(u)); };
  }, [fotos]);

  const subir = async (f?: File) => {
    if (!f) return;
    setSubiendo(true);
    try { await activoRfidService.subirFoto(idActivo, f); mostrar('ok', 'Foto agregada'); onCambio(); }
    catch (e) { mostrar('error', mensajeError(e, 'No se pudo subir la foto')); }
    finally { setSubiendo(false); if (ref.current) ref.current.value = ''; }
  };

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    try { await activoRfidService.eliminarFoto(id); onCambio(); }
    catch (e) { mostrar('error', mensajeError(e)); }
  };

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: COLORES.texto }}>Fotos ({fotos.length})</p>
        {/* capture abre la cámara en celulares/tablets */}
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={e => subir(e.target.files?.[0])} />
        <Boton pequeno variante="secundario" onClick={() => ref.current?.click()} disabled={subiendo}><MdPhotoCamera /> {subiendo ? 'Subiendo…' : 'Agregar'}</Boton>
      </div>
      {fotos.length === 0 && <p className="text-sm" style={{ color: COLORES.tenue }}>Sin fotos de evidencia.</p>}
      <div className="grid grid-cols-2 gap-2">
        {fotos.map(f => (
          <div key={f.id} className="relative group rounded-lg overflow-hidden" style={{ border: `1px solid ${COLORES.borde}`, aspectRatio: '1' }}>
            {urls[f.id]
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={urls[f.id]} alt={f.nombreOriginal} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setGrande(urls[f.id])} />
              : <div className="w-full h-full animate-pulse" style={{ backgroundColor: '#f1f5f9' }} />}
            <button onClick={() => eliminar(f.id)} title="Eliminar"
              className="absolute top-1 right-1 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: 'rgba(239,68,68,0.9)', color: '#fff' }}><MdDelete size={14} /></button>
            <p className="absolute bottom-0 inset-x-0 px-1.5 py-0.5 text-[10px] text-white" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
              {fmtFechaHora(f.fechaRegistro)}
            </p>
          </div>
        ))}
      </div>
      {grande && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 cursor-zoom-out" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }} onClick={() => setGrande(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={grande} alt="Foto del activo" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </Card>
  );
}

function Dato({ e, v }: { e: string; v?: string | null }) {
  return (
    <div>
      <p className="text-xs" style={{ color: COLORES.tenue }}>{e}</p>
      <p className="font-medium" style={{ color: v ? COLORES.texto : '#cbd5e1' }}>{v || '—'}</p>
    </div>
  );
}
