'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MdLink, MdSearch, MdSave, MdLinkOff } from 'react-icons/md';
import BuscadorActivo from '@/app/components/rfid/BuscadorActivo';
import { PageHeader, Card, Boton, Tabla, tdCls, Epc, inputCls, inputStyle, useAviso, COLORES } from '@/app/components/rfid/ui';
import { Activo, activoRfidService } from '@/app/services/activo.service';
import { Area } from '@/app/services/area.service';
import { Oficina } from '@/app/services/oficina.service';
import { mensajeError } from '@/app/utils/exportar';

/**
 * Vinculación de activos existentes con su tag RFID.
 * Cada fila acepta el EPC escrito o leído con un lector en modo teclado (Enter guarda y pasa a la siguiente).
 */
export default function VincularEpcPage() {
  const { mostrar, nodo } = useAviso();
  const [activos, setActivos] = useState<Activo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [epcs, setEpcs] = useState<Record<number, string>>({});
  const [guardando, setGuardando] = useState<number | null>(null);

  const [elegido, setElegido] = useState<Activo | null>(null);
  const [nuevoEpc, setNuevoEpc] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    try { setActivos(await activoRfidService.sinEpc()); }
    catch (e) { mostrar('error', mensajeError(e, 'No se pudo cargar la lista')); }
    finally { setCargando(false); }
  }, [mostrar]);

  useEffect(() => { cargar(); }, [cargar]);

  const lista = useMemo(() => {
    const t = filtro.trim().toLowerCase();
    if (!t) return activos;
    return activos.filter(a => [a.codActivo, a.descripcion, a.serie, (a.area as Area)?.nombreArea]
      .some(v => (v ?? '').toLowerCase().includes(t)));
  }, [activos, filtro]);

  const guardar = async (a: Activo, indice: number) => {
    const epc = (epcs[a.id!] ?? '').trim();
    if (!epc || guardando === a.id) return;
    setGuardando(a.id!);
    try {
      await activoRfidService.vincularEpc(a.id!, epc);
      mostrar('ok', `EPC vinculado a ${a.codActivo}`);
      setActivos(prev => prev.filter(x => x.id !== a.id));
      setEpcs(prev => { const c = { ...prev }; delete c[a.id!]; return c; });
      // El foco pasa a la siguiente fila para seguir escaneando
      setTimeout(() => document.getElementById(`epc-${lista[indice + 1]?.id}`)?.focus(), 50);
    } catch (e) { mostrar('error', mensajeError(e, 'No se pudo vincular')); }
    finally { setGuardando(null); }
  };

  const cambiarEpc = async () => {
    if (!elegido?.id || !nuevoEpc.trim()) return;
    try {
      const a = await activoRfidService.vincularEpc(elegido.id, nuevoEpc.trim());
      mostrar('ok', `EPC de ${a.codActivo} actualizado`);
      setElegido(a); setNuevoEpc('');
      cargar();
    } catch (e) { mostrar('error', mensajeError(e, 'No se pudo actualizar')); }
  };

  const quitarEpc = async () => {
    if (!elegido?.id || !confirm(`¿Quitar el EPC de ${elegido.codActivo}?`)) return;
    try {
      const a = await activoRfidService.desvincularEpc(elegido.id);
      mostrar('ok', 'EPC quitado'); setElegido(a); cargar();
    } catch (e) { mostrar('error', mensajeError(e)); }
  };

  return (
    <div className="space-y-6">
      {nodo}
      <PageHeader titulo="Vincular EPC" subtitulo="Asociar tags RFID a activos ya registrados" icono={<MdLink size={15} />} />

      <Card className="p-5 space-y-3">
        <p className="text-sm font-semibold" style={{ color: COLORES.texto }}>Cambiar o quitar el EPC de un activo</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BuscadorActivo valor={elegido} onElegir={a => { setElegido(a); setNuevoEpc(''); }} />
          {elegido && (
            <div className="space-y-2">
              <p className="text-xs" style={{ color: COLORES.suave }}>EPC actual: <Epc valor={elegido.epc} /></p>
              <div className="flex gap-2">
                <input value={nuevoEpc} onChange={e => setNuevoEpc(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); cambiarEpc(); } }}
                  placeholder="Nuevo EPC" className={`${inputCls} font-mono`} style={inputStyle} />
                <Boton onClick={cambiarEpc} disabled={!nuevoEpc.trim()}><MdSave /> Guardar</Boton>
                {elegido.epc && <Boton variante="peligro" onClick={quitarEpc} title="Quitar EPC"><MdLinkOff /></Boton>}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <p className="text-sm font-semibold" style={{ color: COLORES.texto }}>
            Activos sin tag <span className="font-normal" style={{ color: COLORES.tenue }}>({activos.length})</span>
          </p>
          <div className="relative w-full md:w-72">
            <MdSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORES.tenue }} />
            <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Filtrar…" className={`${inputCls} pl-9`} style={inputStyle} />
          </div>
        </div>
        <Tabla columnas={['Código', 'Descripción', 'Serie', 'Ubicación', 'EPC (escriba o escanee + Enter)']}
          cargando={cargando} vacio={lista.length === 0}>
          {lista.slice(0, 500).map((a, i) => (
            <tr key={a.id} style={{ borderBottom: '1px solid #f8fafc' }}>
              <td className={`${tdCls} font-mono text-xs`} style={{ color: COLORES.suave }}>{a.codActivo}</td>
              <td className={`${tdCls} font-semibold`}>{a.descripcion}</td>
              <td className={`${tdCls} font-mono text-xs`}>{a.serie ?? '—'}</td>
              <td className={tdCls} style={{ color: COLORES.suave }}>
                {[(a.area as Area)?.nombreArea, (a.oficina as Oficina)?.nombreOficina].filter(Boolean).join(' / ') || '—'}
              </td>
              <td className={tdCls}>
                <div className="flex gap-2 min-w-[300px]">
                  <input id={`epc-${a.id}`} value={epcs[a.id!] ?? ''}
                    onChange={e => setEpcs(p => ({ ...p, [a.id!]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); guardar(a, i); } }}
                    className={`${inputCls} font-mono`} style={inputStyle} placeholder="E200…" />
                  <Boton pequeno onClick={() => guardar(a, i)} disabled={!epcs[a.id!]?.trim() || guardando === a.id}><MdSave /></Boton>
                </div>
              </td>
            </tr>
          ))}
        </Tabla>
        {lista.length > 500 && (
          <p className="px-5 py-3 text-xs" style={{ color: COLORES.tenue }}>Mostrando 500 de {lista.length}. Use el filtro para acotar.</p>
        )}
      </Card>
    </div>
  );
}
