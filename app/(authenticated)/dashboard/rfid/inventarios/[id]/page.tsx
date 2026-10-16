'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  MdArrowBack, MdSensors, MdCheckCircle, MdErrorOutline, MdHelpOutline, MdInventory,
  MdFileUpload, MdDownload, MdPictureAsPdf, MdLock, MdLockOpen, MdDelete, MdLink, MdSearch, MdRefresh,
} from 'react-icons/md';
import StatCard from '@/app/components/StatCard';
import BuscadorActivo from '@/app/components/rfid/BuscadorActivo';
import { PageHeader, Card, Boton, ModalBase, Tabla, tdCls, Pastilla, Epc, inputCls, inputStyle, useAviso, COLORES } from '@/app/components/rfid/ui';
import {
  rfidService, ResultadoInventario, ItemInventario, RespuestaLote,
  ETIQUETA_RESULTADO, ETIQUETA_DETALLE, ETIQUETA_ALCANCE,
} from '@/app/services/rfid.service';
import { Activo, activoRfidService } from '@/app/services/activo.service';
import { exportarExcel, imprimirPdf, extraerEpcsDeTexto, fmtFechaHora, mensajeError, Seccion } from '@/app/utils/exportar';

type Pestana = 'TODOS' | 'ENCONTRADO' | 'NO_ENCONTRADO' | 'INESPERADO';

const tonoResultado = (r: string) => (r === 'ENCONTRADO' ? 'ok' : r === 'NO_ENCONTRADO' ? 'error' : 'alerta') as 'ok' | 'error' | 'alerta';

export default function SesionInventarioPage() {
  const { id } = useParams<{ id: string }>();
  const idSesion = Number(id);
  const router = useRouter();
  const { mostrar, nodo } = useAviso();

  const [datos, setDatos] = useState<ResultadoInventario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pestana, setPestana] = useState<Pestana>('TODOS');
  const [filtro, setFiltro] = useState('');
  const [epcManual, setEpcManual] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [ultimoLote, setUltimoLote] = useState<RespuestaLote | null>(null);
  const [vinculando, setVinculando] = useState<ItemInventario | null>(null);
  const [activoVincular, setActivoVincular] = useState<Activo | null>(null);
  const archivoRef = useRef<HTMLInputElement>(null);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try { setDatos(await rfidService.resultado(idSesion)); }
    catch (e) { if (!silencioso) mostrar('error', mensajeError(e, 'No se pudo cargar la sesión')); }
    finally { if (!silencioso) setCargando(false); }
  }, [idSesion, mostrar]);

  useEffect(() => { cargar(); }, [cargar]);

  // Mientras la sesión está abierta, la app móvil puede estar enviando lecturas: refresco cada 10 s
  const abierta = datos?.sesion.estado === 'ABIERTA';
  useEffect(() => {
    if (!abierta) return;
    const t = setInterval(() => cargar(true), 10_000);
    return () => clearInterval(t);
  }, [abierta, cargar]);

  const enviarEpcs = async (epcs: string[], origen: 'MANUAL' | 'ARCHIVO') => {
    if (epcs.length === 0) { mostrar('error', 'No se encontró ningún EPC válido'); return; }
    setEnviando(true);
    try {
      const r = await rfidService.registrarEpcs(idSesion, epcs, origen);
      setUltimoLote(r);
      const inval = r.invalidos?.length ? ` · ${r.invalidos.length} inválidos` : '';
      mostrar('ok', `${r.epcValidos} EPC registrados${inval}`);
      await cargar(true);
    } catch (e) { mostrar('error', mensajeError(e, 'No se pudieron registrar las lecturas')); }
    finally { setEnviando(false); }
  };

  const registrarManual = async () => {
    const epcs = extraerEpcsDeTexto(epcManual);
    if (epcs.length === 0) { mostrar('error', 'EPC inválido: debe ser hexadecimal (mín. 8 caracteres)'); return; }
    // Se limpia antes de enviar: un lector en modo teclado puede mandar el siguiente EPC de inmediato
    setEpcManual('');
    await enviarEpcs(epcs, 'MANUAL');
  };

  const importarArchivo = async (f: File | undefined) => {
    if (!f) return;
    const texto = await f.text();
    await enviarEpcs(extraerEpcsDeTexto(texto), 'ARCHIVO');
    if (archivoRef.current) archivoRef.current.value = '';
  };

  const quitarLectura = async (epc: string) => {
    if (!confirm(`¿Quitar la lectura del EPC ${epc}?`)) return;
    try { await rfidService.quitarLectura(idSesion, epc); await cargar(true); mostrar('ok', 'Lectura eliminada'); }
    catch (e) { mostrar('error', mensajeError(e)); }
  };

  const vincular = async () => {
    if (!vinculando?.epc || !activoVincular?.id) return;
    try {
      await activoRfidService.vincularEpc(activoVincular.id, vinculando.epc);
      mostrar('ok', `EPC vinculado a ${activoVincular.codActivo}`);
      setVinculando(null); setActivoVincular(null);
      await cargar(true);
    } catch (e) { mostrar('error', mensajeError(e, 'No se pudo vincular')); }
  };

  const cambiarEstado = async () => {
    if (!datos) return;
    const cerrar = abierta;
    if (cerrar && !confirm('¿Cerrar la sesión? Ya no se aceptarán más lecturas.')) return;
    try {
      if (cerrar) await rfidService.cerrar(idSesion); else await rfidService.reabrir(idSesion);
      await cargar(true);
    } catch (e) { mostrar('error', mensajeError(e)); }
  };

  const items = useMemo(() => {
    let lista = datos?.items ?? [];
    if (pestana !== 'TODOS') lista = lista.filter(i => i.resultado === pestana);
    const t = filtro.trim().toLowerCase();
    if (t) lista = lista.filter(i => [i.codActivo, i.descripcion, i.epc, i.serie, i.area, i.responsable]
      .some(v => (v ?? '').toLowerCase().includes(t)));
    return lista;
  }, [datos, pestana, filtro]);

  // ── Exportación (acta) ──────────────────────────────────────────────────
  const secciones = (): Seccion[] => {
    const it = datos?.items ?? [];
    const fila = (i: ItemInventario) => [i.codActivo, i.descripcion, i.serie, i.epc, i.area, i.oficina, i.responsable,
      i.detalle ? ETIQUETA_DETALLE[i.detalle] ?? i.detalle : '', i.conteo ?? '', fmtFechaHora(i.ultimaLectura)];
    const cols = ['Código', 'Descripción', 'Serie', 'EPC', 'Área', 'Oficina', 'Custodio', 'Observación', 'Lecturas', 'Última lectura'];
    return [
      { titulo: 'Resumen por área', columnas: ['Local', 'Área', 'Esperados', 'Encontrados', 'Faltantes', 'Sobrantes'],
        filas: (datos?.resumenAreas ?? []).map(r => [r.local, r.area, r.esperados, r.encontrados, r.faltantes, r.sobrantes]) },
      { titulo: 'Encontrados', columnas: cols, filas: it.filter(i => i.resultado === 'ENCONTRADO').map(fila) },
      { titulo: 'Faltantes', columnas: cols, filas: it.filter(i => i.resultado === 'NO_ENCONTRADO').map(fila) },
      { titulo: 'Sobrantes (inesperados)', columnas: cols, filas: it.filter(i => i.resultado === 'INESPERADO').map(fila) },
    ];
  };

  const encabezado = (): string[] => {
    if (!datos) return [];
    const s = datos.sesion; const t = datos.totales;
    return [
      `Sesión #${s.id}: ${s.descripcion}`,
      `Alcance: ${ETIQUETA_ALCANCE[s.alcance]}${s.alcance !== 'COMPLETO' ? ` — ${[s.local, s.area, s.oficina].filter(Boolean).join(' / ')}` : ''}`,
      `Inicio: ${fmtFechaHora(s.fechaCreacion)} (${s.creadoPor ?? ''})${s.fechaCierre ? ` · Cierre: ${fmtFechaHora(s.fechaCierre)} (${s.cerradoPor ?? ''})` : ' · Sesión abierta'}`,
      `Esperados: ${t.esperados} · Encontrados: ${t.encontrados} (${t.avance}%) · Faltantes: ${t.faltantes} (sin tag: ${t.faltantesSinEpc}) · Sobrantes: ${t.inesperados}`,
    ];
  };

  if (cargando && !datos) return <div className="p-10 text-center text-sm" style={{ color: COLORES.tenue }}>Cargando…</div>;
  if (!datos) return (
    <div className="space-y-4">{nodo}
      <Boton variante="secundario" onClick={() => router.push('/dashboard/rfid/inventarios')}><MdArrowBack /> Volver</Boton>
    </div>
  );

  const { sesion, totales } = datos;
  const conteoPestana = (p: Pestana) => p === 'TODOS' ? datos.items.length : datos.items.filter(i => i.resultado === p).length;

  return (
    <div className="space-y-6">
      {nodo}
      <PageHeader
        titulo={sesion.descripcion}
        subtitulo={`Sesión #${sesion.id} · ${ETIQUETA_ALCANCE[sesion.alcance]}${sesion.alcance !== 'COMPLETO' ? ` · ${[sesion.local, sesion.area, sesion.oficina].filter(Boolean).join(' / ')}` : ''}`}
        icono={<MdSensors size={15} />}
        acciones={<>
          <Boton variante="secundario" onClick={() => router.push('/dashboard/rfid/inventarios')}><MdArrowBack size={17} /> Volver</Boton>
          <Boton variante="secundario" onClick={() => cargar()} title="Actualizar"><MdRefresh size={17} /></Boton>
          <Boton variante="secundario" onClick={() => exportarExcel(`acta_inventario_${sesion.id}`, secciones(), encabezado())}><MdDownload size={17} /> Excel</Boton>
          <Boton variante="secundario" onClick={() => imprimirPdf('Acta de inventario de activos', encabezado(), secciones(),
            ['Responsable del inventario', 'Jefe del área', 'Control patrimonial'])}><MdPictureAsPdf size={17} /> Acta PDF</Boton>
          <Boton variante={abierta ? 'peligro' : 'exito'} onClick={cambiarEstado}>
            {abierta ? <><MdLock size={17} /> Cerrar sesión</> : <><MdLockOpen size={17} /> Reabrir</>}
          </Boton>
        </>} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<MdInventory size={22} />} label="Esperados" value={totales.esperados} sub={`${totales.epcLeidos} EPC leídos`} />
        <StatCard icon={<MdCheckCircle size={22} />} label="Encontrados" value={totales.encontrados} sub={`${totales.avance}% de avance`} accent />
        <StatCard icon={<MdErrorOutline size={22} />} label="Faltantes" value={totales.faltantes} sub={`${totales.faltantesSinEpc} sin tag (sin EPC)`} />
        <StatCard icon={<MdHelpOutline size={22} />} label="Inesperados" value={totales.inesperados} sub={`${totales.noRegistrados} EPC no registrados`} />
      </div>

      {abierta ? (
        <Card className="p-5 space-y-3">
          <p className="text-sm font-semibold" style={{ color: COLORES.texto }}>Registrar lecturas</p>
          <div className="flex flex-col md:flex-row gap-2">
            <input value={epcManual} onChange={e => setEpcManual(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); registrarManual(); } }}
              placeholder="Escriba o escanee un EPC (con lector en modo teclado) y presione Enter"
              className={`${inputCls} font-mono`} style={inputStyle} autoFocus />
            <Boton onClick={registrarManual} disabled={!epcManual.trim()}>Registrar</Boton>
            <input ref={archivoRef} type="file" accept=".txt,.csv" className="hidden" onChange={e => importarArchivo(e.target.files?.[0])} />
            <Boton variante="secundario" onClick={() => archivoRef.current?.click()} disabled={enviando}><MdFileUpload size={17} /> Importar TXT/CSV</Boton>
          </div>
          <p className="text-xs" style={{ color: COLORES.tenue }}>
            Las lecturas de la app móvil (RFD8500) llegan solas a esta sesión; la pantalla se actualiza cada 10 segundos.
          </p>
          {ultimoLote?.lecturas && ultimoLote.lecturas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ultimoLote.lecturas.slice(0, 12).map(l => (
                <span key={l.epc} className="text-xs px-2 py-1 rounded-lg"
                  style={{ backgroundColor: l.resultado === 'ENCONTRADO' ? 'rgba(34,196,161,0.1)' : 'rgba(245,158,11,0.1)' }}>
                  <b>{ETIQUETA_RESULTADO[l.resultado]}</b> · {l.codActivo ?? l.epc}{l.detalle ? ` (${ETIQUETA_DETALLE[l.detalle] ?? l.detalle})` : ''}
                </span>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: '#f1f5f9', color: COLORES.suave }}>
          Sesión cerrada el {fmtFechaHora(sesion.fechaCierre)} por {sesion.cerradoPor}. Reábrala para registrar más lecturas.
        </div>
      )}

      <Card>
        <p className="px-5 pt-4 pb-2 text-sm font-semibold" style={{ color: COLORES.texto }}>Resumen por área</p>
        <Tabla columnas={['Local', 'Área', 'Esperados', 'Encontrados', 'Faltantes', 'Sobrantes', 'Avance']} vacio={datos.resumenAreas.length === 0}>
          {datos.resumenAreas.map(r => (
            <tr key={String(r.codArea)} style={{ borderBottom: '1px solid #f8fafc' }}>
              <td className={tdCls} style={{ color: COLORES.suave }}>{r.local ?? '—'}</td>
              <td className={`${tdCls} font-semibold`}>{r.area}</td>
              <td className={tdCls}>{r.esperados}</td>
              <td className={tdCls} style={{ color: '#0f9b76' }}>{r.encontrados}</td>
              <td className={tdCls} style={{ color: r.faltantes ? '#dc2626' : undefined }}>{r.faltantes}</td>
              <td className={tdCls} style={{ color: r.sobrantes ? '#b45309' : undefined }}>{r.sobrantes}</td>
              <td className={tdCls}>{r.esperados ? `${Math.round((r.encontrados / r.esperados) * 100)}%` : '—'}</td>
            </tr>
          ))}
        </Tabla>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div className="flex flex-wrap gap-1">
            {(['TODOS', 'ENCONTRADO', 'NO_ENCONTRADO', 'INESPERADO'] as Pestana[]).map(p => (
              <button key={p} onClick={() => setPestana(p)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: pestana === p ? COLORES.brand : '#f1f5f9', color: pestana === p ? '#fff' : COLORES.suave }}>
                {p === 'TODOS' ? 'Todos' : ETIQUETA_RESULTADO[p]} ({conteoPestana(p)})
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <MdSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORES.tenue }} />
            <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Filtrar…"
              className={`${inputCls} pl-9`} style={inputStyle} />
          </div>
        </div>
        <Tabla columnas={['Resultado', 'Activo', 'EPC', 'Ubicación registrada', 'Custodio', 'Lecturas', '']} vacio={items.length === 0}>
          {items.map((i, n) => (
            <tr key={`${i.idActivo ?? 'x'}-${i.epc ?? n}`} style={{ borderBottom: '1px solid #f8fafc' }}>
              <td className={tdCls}>
                <Pastilla texto={ETIQUETA_RESULTADO[i.resultado]} tono={tonoResultado(i.resultado)} />
                {i.detalle && <p className="text-xs mt-1" style={{ color: COLORES.tenue }}>{ETIQUETA_DETALLE[i.detalle] ?? i.detalle}</p>}
              </td>
              <td className={tdCls}>
                {i.codActivo ? (
                  <button className="text-left" onClick={() => router.push(`/dashboard/busqueda?id=${i.idActivo}`)}>
                    <p className="font-semibold" style={{ color: COLORES.texto }}>{i.descripcion}</p>
                    <span className="text-xs font-mono" style={{ color: COLORES.brand }}>{i.codActivo}</span>
                  </button>
                ) : <span className="text-xs" style={{ color: COLORES.tenue }}>No registrado en el sistema</span>}
              </td>
              <td className={tdCls}><Epc valor={i.epc} /></td>
              <td className={tdCls} style={{ color: COLORES.suave }}>
                {[i.area, i.oficina].filter(Boolean).join(' / ') || '—'}
                {i.areaLectura && i.resultado === 'INESPERADO' && <p className="text-xs">Leído en: {i.areaLectura}</p>}
              </td>
              <td className={tdCls} style={{ color: COLORES.suave }}>{i.responsable ?? '—'}</td>
              <td className={tdCls} style={{ color: COLORES.suave }}>
                {i.conteo ?? '—'}{i.ultimaLectura && <p className="text-xs">{fmtFechaHora(i.ultimaLectura)}</p>}
              </td>
              <td className={tdCls}>
                <div className="flex gap-1 justify-end">
                  {i.detalle === 'NO_REGISTRADO' && (
                    <Boton pequeno variante="exito" onClick={() => { setVinculando(i); setActivoVincular(null); }}><MdLink /> Vincular</Boton>
                  )}
                  {abierta && i.epc && i.resultado !== 'NO_ENCONTRADO' && (
                    <Boton pequeno variante="peligro" title="Quitar lectura" onClick={() => quitarLectura(i.epc!)}><MdDelete /></Boton>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Tabla>
      </Card>

      <ModalBase abierto={!!vinculando} onCerrar={() => setVinculando(null)} titulo="Vincular EPC a un activo"
        subtitulo={`EPC ${vinculando?.epc ?? ''}`}
        pie={<>
          <Boton variante="secundario" onClick={() => setVinculando(null)}>Cancelar</Boton>
          <Boton onClick={vincular} disabled={!activoVincular || !!activoVincular.epc}>Vincular</Boton>
        </>}>
        <p className="text-sm" style={{ color: COLORES.suave }}>
          Busque el activo al que pertenece este tag. Al vincularlo, la lectura se reclasifica automáticamente.
        </p>
        <BuscadorActivo valor={activoVincular} onElegir={setActivoVincular} />
        {activoVincular?.epc && (
          <p className="text-xs" style={{ color: '#dc2626' }}>
            Ese activo ya tiene el EPC {activoVincular.epc}. Para cambiarlo use «Vincular EPC» o la ficha del activo.
          </p>
        )}
      </ModalBase>
    </div>
  );
}
