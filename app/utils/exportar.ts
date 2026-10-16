import * as XLSX from 'xlsx';

export interface Seccion {
  titulo: string;
  columnas: string[];
  filas: (string | number | null | undefined)[][];
}

const fechaArchivo = () => new Date().toISOString().slice(0, 10);

/** Descarga un .xlsx con una hoja por sección. */
export function exportarExcel(nombreArchivo: string, secciones: Seccion[], encabezado?: string[]) {
  const wb = XLSX.utils.book_new();
  secciones.forEach((s, i) => {
    const aoa: (string | number | null | undefined)[][] = [];
    if (encabezado?.length) {
      encabezado.forEach(l => aoa.push([l]));
      aoa.push([]);
    }
    aoa.push(s.columnas, ...s.filas);
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = s.columnas.map((c, j) => ({
      wch: Math.min(50, Math.max(c.length, ...s.filas.slice(0, 200).map(f => String(f[j] ?? '').length)) + 2),
    }));
    // Excel limita el nombre de hoja a 31 caracteres y prohíbe : \ / ? * [ ]
    const nombreHoja = (s.titulo || `Hoja ${i + 1}`).replace(/[:\\/?*[\]]/g, ' ').slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
  });
  XLSX.writeFile(wb, `${nombreArchivo}_${fechaArchivo()}.xlsx`);
}

const esc = (v: unknown) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Abre el diálogo de impresión con un documento formal; desde ahí se elige «Guardar como PDF».
 * firmas: nombres de los cargos que firman al pie (para actas).
 */
export function imprimirPdf(titulo: string, encabezado: string[], secciones: Seccion[], firmas: string[] = []) {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(titulo)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; font-size: 11px; }
  h1 { font-size: 18px; margin: 0 0 4px; color: #003366; }
  .enc { margin: 0 0 14px; color: #475569; }
  .enc div { margin: 2px 0; }
  h2 { font-size: 13px; margin: 18px 0 6px; color: #1e4786; border-bottom: 2px solid #22c4a1; padding-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1e4786; color: #fff; text-align: left; padding: 5px; font-size: 10px; }
  td { border-bottom: 1px solid #e2e8f0; padding: 4px 5px; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  tr { page-break-inside: avoid; }
  .vacio { color: #94a3b8; font-style: italic; padding: 6px 0; }
  .firmas { display: flex; gap: 40px; margin-top: 60px; page-break-inside: avoid; }
  .firma { flex: 1; text-align: center; border-top: 1px solid #0f172a; padding-top: 6px; }
  .pie { margin-top: 18px; font-size: 9px; color: #94a3b8; }
</style></head><body>
<h1>${esc(titulo)}</h1>
<div class="enc">${encabezado.map(l => `<div>${esc(l)}</div>`).join('')}</div>
${secciones.map(s => `<h2>${esc(s.titulo)} (${s.filas.length})</h2>${s.filas.length === 0
    ? '<div class="vacio">Sin registros</div>'
    : `<table><thead><tr>${s.columnas.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${s.filas
        .map(f => `<tr>${f.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`}`).join('')}
${firmas.length ? `<div class="firmas">${firmas.map(f => `<div class="firma">${esc(f)}</div>`).join('')}</div>` : ''}
<div class="pie">Generado por DBAsset el ${esc(new Date().toLocaleString('es-PE'))}</div>
</body></html>`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => iframe.remove(), 1000);
  }, 250);
}

export const fmtFecha = (v?: string | null) => {
  if (!v) return '';
  const d = new Date(v.length === 10 ? `${v}T00:00:00` : v);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString('es-PE');
};

export const fmtFechaHora = (v?: string | null) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
};

/** Mensaje legible de un error de axios ({mensaje} del backend RFID o texto plano). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mensajeError(e: any, porDefecto = 'Ocurrió un error'): string {
  const d = e?.response?.data;
  if (typeof d === 'string' && d.trim()) return d;
  if (d?.mensaje) return d.mensaje;
  if (e?.response?.status === 404) return 'No encontrado';
  if (!e?.response) return 'No se pudo conectar con el servidor';
  return porDefecto;
}

/** Extrae EPC de un TXT/CSV exportado por el lector (uno por línea o en columnas). */
export function extraerEpcsDeTexto(texto: string): string[] {
  const vistos = new Set<string>();
  for (const token of texto.split(/[\r\n,;\t"]+/)) {
    const limpio = token.replace(/[\s:-]/g, '').toUpperCase();
    if (/^[0-9A-F]{8,128}$/.test(limpio)) vistos.add(limpio);
  }
  return [...vistos];
}
