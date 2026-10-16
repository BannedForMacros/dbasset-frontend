'use client';

import { useEffect, useState } from 'react';
import { MdAssessment, MdDownload, MdPictureAsPdf, MdSensors, MdCompareArrows, MdSwapVert } from 'react-icons/md';
import Select from '@/app/components/Select';
import { PageHeader, Card, Boton, Campo, inputCls, inputStyle, useAviso, COLORES } from '@/app/components/rfid/ui';
import { rfidService, SesionInventario, ETIQUETA_RESULTADO, ETIQUETA_DETALLE, ETIQUETA_ALCANCE } from '@/app/services/rfid.service';
import { reporteService } from '@/app/services/reporte.service';
import { ETIQUETA_MOTIVO } from '@/app/services/baja.service';
import { exportarExcel, imprimirPdf, fmtFecha, fmtFechaHora, mensajeError, Seccion } from '@/app/utils/exportar';

const primeroDelMes = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); };
const hoy = () => new Date().toISOString().slice(0, 10);

type Formato = 'excel' | 'pdf';

export default function ReportesPage() {
  const { mostrar, nodo } = useAviso();
  const [sesiones, setSesiones] = useState<SesionInventario[]>([]);
  const [sesion, setSesion] = useState('');
  const [rango, setRango] = useState({ desde: primeroDelMes(), hasta: hoy() });
  const [estadoTr, setEstadoTr] = useState('');
  const [ocupado, setOcupado] = useState('');

  useEffect(() => {
    rfidService.listar().then(s => { setSesiones(s); if (s[0]) setSesion(String(s[0].id)); })
      .catch(e => mostrar('error', mensajeError(e, 'No se pudieron cargar las sesiones')));
  }, [mostrar]);

  const salida = (formato: Formato, archivo: string, titulo: string, encabezado: string[], secciones: Seccion[], firmas?: string[]) => {
    if (formato === 'excel') exportarExcel(archivo, secciones, [titulo, ...encabezado]);
    else imprimirPdf(titulo, encabezado, secciones, firmas);
  };

  const ejecutar = async (clave: string, fn: () => Promise<void>) => {
    setOcupado(clave);
    try { await fn(); } catch (e) { mostrar('error', mensajeError(e, 'No se pudo generar el reporte')); }
    finally { setOcupado(''); }
  };

  const reporteInventario = (formato: Formato, soloDiferencias: boolean) => ejecutar(`inv-${soloDiferencias}-${formato}`, async () => {
    if (!sesion) { mostrar('error', 'Seleccione una sesión de inventario'); return; }
    const r = await rfidService.resultado(Number(sesion));
    const s = r.sesion; const t = r.totales;
    const encabezado = [
      `Sesión #${s.id}: ${s.descripcion} (${s.estado === 'ABIERTA' ? 'abierta' : 'cerrada'})`,
      `Alcance: ${ETIQUETA_ALCANCE[s.alcance]}${s.alcance !== 'COMPLETO' ? ` — ${[s.local, s.area, s.oficina].filter(Boolean).join(' / ')}` : ''}`,
      `Esperados ${t.esperados} · Encontrados ${t.encontrados} (${t.avance}%) · Faltantes ${t.faltantes} · Sobrantes ${t.inesperados}`,
    ];
    const resumen: Seccion = {
      titulo: 'Resumen por área', columnas: ['Local', 'Área', 'Esperados', 'Encontrados', 'Faltantes', 'Sobrantes'],
      filas: r.resumenAreas.map(a => [a.local, a.area, a.esperados, a.encontrados, a.faltantes, a.sobrantes]),
    };
    const cols = ['Resultado', 'Observación', 'Código', 'Descripción', 'Serie', 'EPC', 'Local', 'Área', 'Oficina', 'Custodio', 'Lecturas', 'Última lectura'];
    const fila = (i: (typeof r.items)[number]) => [ETIQUETA_RESULTADO[i.resultado], i.detalle ? ETIQUETA_DETALLE[i.detalle] ?? i.detalle : '',
      i.codActivo, i.descripcion, i.serie, i.epc, i.local, i.area, i.oficina, i.responsable, i.conteo ?? '', fmtFechaHora(i.ultimaLectura)];
    if (soloDiferencias) {
      salida(formato, `faltantes_sobrantes_${s.id}`, 'Reporte de faltantes y sobrantes por área', encabezado, [
        resumen,
        { titulo: 'Faltantes', columnas: cols, filas: r.items.filter(i => i.resultado === 'NO_ENCONTRADO').map(fila) },
        { titulo: 'Sobrantes', columnas: cols, filas: r.items.filter(i => i.resultado === 'INESPERADO').map(fila) },
      ]);
    } else {
      salida(formato, `inventario_${s.id}`, 'Reporte de inventario completo', encabezado,
        [resumen, { titulo: 'Detalle de activos', columnas: cols, filas: r.items.map(fila) }]);
    }
  });

  const reporteTransferencias = (formato: Formato) => ejecutar(`tr-${formato}`, async () => {
    const r = await reporteService.transferencias(rango.desde, rango.hasta, estadoTr);
    salida(formato, 'transferencias', 'Reporte de transferencias', [`Período: ${fmtFecha(r.desde)} al ${fmtFecha(r.hasta)}${estadoTr ? ` · Estado: ${estadoTr}` : ''}`], [{
      titulo: 'Transferencias',
      columnas: ['N.º', 'Fecha envío', 'Código', 'Activo', 'Área origen', 'Área destino', 'Oficina destino', 'Recibe', 'Estado', 'Recibido por', 'Fecha recepción', 'Registró', 'Motivo'],
      filas: r.transferencias.map(t => [t.id, fmtFechaHora(t.fechaEnvio), t.codActivo, t.descripcionActivo, t.areaOrigen, t.areaDestino,
        t.oficinaDestino, t.responsableDestino, t.estado, t.recibidoPor, fmtFechaHora(t.fechaRecepcion), t.registradoPor, t.motivo]),
    }]);
  });

  const reporteAltasBajas = (formato: Formato) => ejecutar(`ab-${formato}`, async () => {
    const r = await reporteService.altasBajas(rango.desde, rango.hasta);
    salida(formato, 'altas_bajas', 'Reporte de altas y bajas', [`Período: ${fmtFecha(r.desde)} al ${fmtFecha(r.hasta)}`,
      `Altas: ${r.altas.length} · Bajas: ${r.bajas.length}`], [
      { titulo: 'Altas', columnas: ['Fecha alta', 'Código', 'Descripción', 'Categoría', 'Serie', 'EPC', 'Área', 'Oficina', 'Custodio', 'Situación actual'],
        filas: r.altas.map(a => [fmtFechaHora(a.fechaAlta), a.codActivo, a.descripcion, a.categoria, a.serie, a.epc, a.area, a.oficina, a.responsable, a.situacion]) },
      { titulo: 'Bajas', columnas: ['Fecha baja', 'Código', 'Descripción', 'Motivo', 'Detalle', 'Autorizó', 'Registró', 'Última área', 'Adjuntos'],
        filas: r.bajas.map(b => [fmtFecha(b.fechaBaja), b.codActivo, b.descripcionActivo, ETIQUETA_MOTIVO[b.motivo] ?? b.motivo, b.detalle,
          b.autorizadoPor, b.registradoPor, b.area, b.totalAdjuntos]) },
    ]);
  });

  const botones = (clave: string, fn: (f: Formato) => void) => (
    <div className="flex gap-2">
      <Boton variante="secundario" onClick={() => fn('excel')} disabled={!!ocupado}><MdDownload /> {ocupado === `${clave}-excel` ? '…' : 'Excel'}</Boton>
      <Boton variante="secundario" onClick={() => fn('pdf')} disabled={!!ocupado}><MdPictureAsPdf /> {ocupado === `${clave}-pdf` ? '…' : 'PDF'}</Boton>
    </div>
  );

  return (
    <div className="space-y-6">
      {nodo}
      <PageHeader titulo="Reportes y conciliación" subtitulo="Exportación a Excel y PDF (el PDF se guarda desde el diálogo de impresión)" icono={<MdAssessment size={15} />} />

      <Card className="p-5 space-y-4">
        <Titulo icono={<MdSensors />} texto="Inventario" />
        <div className="max-w-xl">
          <Select label="Sesión de inventario" value={sesion} onChange={setSesion} placeholder="Seleccionar…"
            options={sesiones.map(s => ({ value: s.id, label: `#${s.id} · ${s.descripcion} (${s.estado === 'ABIERTA' ? 'abierta' : 'cerrada'})` }))} />
        </div>
        <Fila texto="Reporte de inventario completo con el estado de cada activo">{botones('inv-false', f => reporteInventario(f, false))}</Fila>
        <Fila texto="Reporte de faltantes y sobrantes por área">{botones('inv-true', f => reporteInventario(f, true))}</Fila>
      </Card>

      <Card className="p-5 space-y-4">
        <Titulo icono={<MdSwapVert />} texto="Reportes del período" />
        <div className="flex flex-wrap items-end gap-3">
          <Campo etiqueta="Desde"><input type="date" value={rango.desde} onChange={e => setRango(r => ({ ...r, desde: e.target.value }))} className={inputCls} style={inputStyle} /></Campo>
          <Campo etiqueta="Hasta"><input type="date" value={rango.hasta} onChange={e => setRango(r => ({ ...r, hasta: e.target.value }))} className={inputCls} style={inputStyle} /></Campo>
          <div className="w-56">
            <Select label="Estado de transferencias" value={estadoTr} onChange={setEstadoTr} placeholder="Todos"
              options={['PENDIENTE', 'RECIBIDA', 'RECHAZADA', 'ANULADA'].map(e => ({ value: e, label: e.charAt(0) + e.slice(1).toLowerCase() }))} />
          </div>
        </div>
        <Fila texto={<span className="inline-flex items-center gap-2"><MdCompareArrows style={{ color: COLORES.accent }} /> Transferencias del período</span>}>
          {botones('tr', reporteTransferencias)}
        </Fila>
        <Fila texto="Altas y bajas del período">{botones('ab', reporteAltasBajas)}</Fila>
      </Card>
    </div>
  );
}

function Titulo({ icono, texto }: { icono: React.ReactNode; texto: string }) {
  return <p className="text-sm font-bold flex items-center gap-2" style={{ color: COLORES.texto }}><span style={{ color: COLORES.brand }}>{icono}</span>{texto}</p>;
}

function Fila({ texto, children }: { texto: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl" style={{ backgroundColor: '#fafafa', border: '1px solid #f1f5f9' }}>
      <span className="text-sm" style={{ color: COLORES.texto }}>{texto}</span>
      {children}
    </div>
  );
}
