'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MdAdd, MdSensors, MdChevronRight, MdInfoOutline } from 'react-icons/md';
import Select from '@/app/components/Select';
import { PageHeader, Card, Boton, Campo, ModalBase, Tabla, tdCls, Pastilla, inputCls, inputStyle, useAviso, COLORES } from '@/app/components/rfid/ui';
import { rfidService, SesionInventario, Alcance, ETIQUETA_ALCANCE } from '@/app/services/rfid.service';
import { localService, Local } from '@/app/services/local.service';
import { areaService, Area } from '@/app/services/area.service';
import { oficinaService, Oficina } from '@/app/services/oficina.service';
import { fmtFechaHora, mensajeError } from '@/app/utils/exportar';

export default function InventariosRfidPage() {
  const router = useRouter();
  const { mostrar, nodo } = useAviso();
  const [sesiones, setSesiones] = useState<SesionInventario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');

  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [locales, setLocales] = useState<Local[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [form, setForm] = useState({ descripcion: '', alcance: 'AREA' as Alcance, codLocal: '', codArea: '', codOficina: '' });

  const cargar = useCallback(async () => {
    setCargando(true);
    try { setSesiones(await rfidService.listar(filtro || undefined)); }
    catch (e) { mostrar('error', mensajeError(e, 'No se pudieron cargar las sesiones')); }
    finally { setCargando(false); }
  }, [filtro, mostrar]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirNueva = async () => {
    setForm({ descripcion: '', alcance: 'AREA', codLocal: '', codArea: '', codOficina: '' });
    setAbierto(true);
    if (locales.length === 0) {
      try {
        const [l, a, o] = await Promise.all([localService.listarActivos(), areaService.listarActivos(), oficinaService.listarActivos()]);
        setLocales(l); setAreas(a); setOficinas(o);
      } catch (e) { mostrar('error', mensajeError(e, 'No se pudieron cargar las ubicaciones')); }
    }
  };

  const areasDelLocal = form.codLocal ? areas.filter(a => (a.local as Local)?.codLocal === Number(form.codLocal)) : areas;
  const oficinasDelArea = form.codArea ? oficinas.filter(o => (o.area as Area)?.codArea === Number(form.codArea)) : [];

  const crear = async () => {
    if (!form.descripcion.trim()) { mostrar('error', 'Escriba una descripción'); return; }
    const faltaUbicacion =
      (form.alcance === 'LOCAL' && !form.codLocal) || (form.alcance === 'AREA' && !form.codArea) ||
      (form.alcance === 'OFICINA' && !form.codOficina);
    if (faltaUbicacion) { mostrar('error', 'Seleccione la ubicación del inventario'); return; }
    setGuardando(true);
    try {
      const s = await rfidService.crear({
        descripcion: form.descripcion.trim(), alcance: form.alcance,
        codLocal: form.codLocal ? Number(form.codLocal) : undefined,
        codArea: form.codArea ? Number(form.codArea) : undefined,
        codOficina: form.codOficina ? Number(form.codOficina) : undefined,
      });
      setAbierto(false);
      router.push(`/dashboard/rfid/inventarios/${s.id}`);
    } catch (e) { mostrar('error', mensajeError(e, 'No se pudo crear la sesión')); }
    finally { setGuardando(false); }
  };

  const ubicacion = (s: SesionInventario) =>
    s.alcance === 'COMPLETO' ? 'Toda la empresa' : [s.local, s.area, s.oficina].filter(Boolean).join(' / ');

  return (
    <div className="space-y-6">
      {nodo}
      <PageHeader titulo="Inventario RFID" subtitulo="Sesiones de inventario con lectura masiva de tags (RFD8500)"
        icono={<MdSensors size={15} />}
        acciones={<Boton onClick={abrirNueva}><MdAdd size={19} /> Nueva sesión</Boton>} />

      <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
        style={{ backgroundColor: 'rgba(30,71,134,0.05)', border: '1.5px solid rgba(30,71,134,0.12)', color: '#334155' }}>
        <MdInfoOutline size={16} style={{ color: COLORES.brand, flexShrink: 0, marginTop: 1 }} />
        <span>
          El barrido con el RFD8500 lo hace la app móvil y envía los EPC a la sesión abierta. Mientras tanto, en cada sesión
          puede registrar EPC a mano, con un lector en modo teclado o importando el TXT/CSV que exporta el lector.
        </span>
      </div>

      <Card>
        <div className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div className="w-48">
            <Select value={filtro} onChange={setFiltro} placeholder="Todas"
              options={[{ value: 'ABIERTA', label: 'Abiertas' }, { value: 'CERRADA', label: 'Cerradas' }]} />
          </div>
          <span className="text-xs" style={{ color: COLORES.tenue }}>{sesiones.length} sesiones</span>
        </div>
        <Tabla columnas={['#', 'Descripción', 'Alcance', 'Ubicación', 'Esperados', 'EPC leídos', 'Estado', 'Creada', '']}
          cargando={cargando} vacio={sesiones.length === 0}>
          {sesiones.map(s => (
            <tr key={s.id} className="cursor-pointer" style={{ borderBottom: '1px solid #f8fafc' }}
              onClick={() => router.push(`/dashboard/rfid/inventarios/${s.id}`)}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fbff')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              <td className={tdCls} style={{ color: '#cbd5e1' }}>{s.id}</td>
              <td className={`${tdCls} font-semibold`} style={{ color: COLORES.texto }}>{s.descripcion}</td>
              <td className={tdCls}>{ETIQUETA_ALCANCE[s.alcance]}</td>
              <td className={tdCls} style={{ color: COLORES.suave }}>{ubicacion(s) || '—'}</td>
              <td className={tdCls}>{s.totalEsperados}</td>
              <td className={tdCls}>{s.epcLeidos ?? 0}</td>
              <td className={tdCls}><Pastilla texto={s.estado === 'ABIERTA' ? 'Abierta' : 'Cerrada'} tono={s.estado === 'ABIERTA' ? 'ok' : 'neutro'} /></td>
              <td className={tdCls} style={{ color: COLORES.suave }}>{fmtFechaHora(s.fechaCreacion)}<br /><span className="text-xs">{s.creadoPor}</span></td>
              <td className={tdCls}><MdChevronRight size={20} style={{ color: COLORES.tenue }} /></td>
            </tr>
          ))}
        </Tabla>
      </Card>

      <ModalBase abierto={abierto} onCerrar={() => setAbierto(false)} titulo="Nueva sesión de inventario"
        subtitulo="Se toma la lista de activos vigentes de la ubicación elegida como «esperados»"
        pie={<>
          <Boton variante="secundario" onClick={() => setAbierto(false)}>Cancelar</Boton>
          <Boton onClick={crear} disabled={guardando}>{guardando ? 'Creando…' : 'Crear sesión'}</Boton>
        </>}>
        <Campo etiqueta="Descripción" requerido>
          <input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            placeholder="Inventario anual – Administración" className={inputCls} style={inputStyle} autoFocus />
        </Campo>
        <Select label="Alcance" required value={form.alcance}
          onChange={v => setForm(f => ({ ...f, alcance: (v || 'AREA') as Alcance, codLocal: '', codArea: '', codOficina: '' }))}
          options={(['COMPLETO', 'LOCAL', 'AREA', 'OFICINA'] as Alcance[]).map(a => ({ value: a, label: ETIQUETA_ALCANCE[a] }))} />
        {form.alcance !== 'COMPLETO' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select label="Local" required={form.alcance === 'LOCAL'} value={form.codLocal} placeholder="Todos"
              onChange={v => setForm(f => ({ ...f, codLocal: v, codArea: '', codOficina: '' }))}
              options={locales.map(l => ({ value: l.codLocal!, label: l.nombreLocal }))} />
            {form.alcance !== 'LOCAL' && (
              <Select label="Área" required={form.alcance === 'AREA'} value={form.codArea}
                onChange={v => setForm(f => ({ ...f, codArea: v, codOficina: '' }))}
                options={areasDelLocal.map(a => ({ value: a.codArea!, label: a.nombreArea }))} />
            )}
            {form.alcance === 'OFICINA' && (
              <Select label="Oficina" required value={form.codOficina} disabled={!form.codArea}
                placeholder={form.codArea ? 'Seleccionar…' : 'Primero el área'}
                onChange={v => setForm(f => ({ ...f, codOficina: v }))}
                options={oficinasDelArea.map(o => ({ value: o.codOficina!, label: o.nombreOficina }))} />
            )}
          </div>
        )}
      </ModalBase>
    </div>
  );
}
