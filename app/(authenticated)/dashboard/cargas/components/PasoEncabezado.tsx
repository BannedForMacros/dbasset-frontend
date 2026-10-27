import { ReactNode } from 'react';

/* Encabezado común de cada paso del asistente de carga */
export function PasoEncabezado({ icono, titulo, descripcion, extra }: {
  icono: ReactNode; titulo: string; descripcion?: ReactNode; extra?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'rgba(30,71,134,0.08)', color: '#1e4786' }}>
          {icono}
        </div>
        <div>
          <h3 className="text-lg font-bold" style={{ color: '#0f172a' }}>{titulo}</h3>
          {descripcion && <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{descripcion}</p>}
        </div>
      </div>
      {extra}
    </div>
  );
}

/* Caja de aviso dentro de un paso */
export function AvisoPaso({ tono = 'info', icono, children }: {
  tono?: 'info' | 'ok' | 'alerta' | 'error'; icono?: ReactNode; children: ReactNode;
}) {
  const t = {
    info:   { bg: 'rgba(30,71,134,0.05)',  borde: 'rgba(30,71,134,0.14)',  color: '#1e4786' },
    ok:     { bg: 'rgba(34,196,161,0.08)', borde: 'rgba(34,196,161,0.3)',  color: '#0f9b76' },
    alerta: { bg: 'rgba(245,158,11,0.08)', borde: 'rgba(245,158,11,0.3)',  color: '#b45309' },
    error:  { bg: 'rgba(239,68,68,0.06)',  borde: 'rgba(239,68,68,0.25)',  color: '#dc2626' },
  }[tono];
  return (
    <div className="rounded-xl p-3.5 flex items-start gap-3 text-sm"
      style={{ backgroundColor: t.bg, border: `1px solid ${t.borde}`, color: '#334155' }}>
      {icono && <span className="shrink-0 mt-0.5" style={{ color: t.color }}>{icono}</span>}
      <div className="flex-1">{children}</div>
    </div>
  );
}
