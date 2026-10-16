'use client';

import { useState } from 'react';
import { MdSearch, MdClose } from 'react-icons/md';
import { Activo, activoRfidService } from '@/app/services/activo.service';
import { Area } from '@/app/services/area.service';
import { Oficina } from '@/app/services/oficina.service';
import { Epc, inputCls, inputStyle, Pastilla, COLORES } from './ui';
import { mensajeError } from '@/app/utils/exportar';

/**
 * Busca un activo por código, descripción, serie o EPC (escrito o con un lector en modo teclado)
 * y devuelve el elegido. soloVigentes oculta los dados de baja.
 */
export default function BuscadorActivo({ valor, onElegir, soloVigentes = true }: {
  valor: Activo | null; onElegir: (a: Activo | null) => void; soloVigentes?: boolean;
}) {
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<Activo[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');

  const buscar = async () => {
    if (texto.trim().length < 2) { setError('Escriba al menos 2 caracteres'); return; }
    setBuscando(true); setError('');
    try {
      const r = await activoRfidService.buscar(texto.trim(), !soloVigentes);
      setResultados(r);
      if (r.length === 0) setError('Sin resultados');
      if (r.length === 1) { onElegir(r[0]); setResultados([]); }
    } catch (e) { setError(mensajeError(e)); }
    finally { setBuscando(false); }
  };

  if (valor) {
    return (
      <div className="flex items-start justify-between gap-3 p-3 rounded-xl"
        style={{ backgroundColor: 'rgba(30,71,134,0.04)', border: '1.5px solid rgba(30,71,134,0.15)' }}>
        <div className="space-y-1">
          <p className="font-semibold text-sm" style={{ color: COLORES.texto }}>{valor.descripcion}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: '#f1f5f9', color: COLORES.suave }}>{valor.codActivo}</span>
            <Epc valor={valor.epc} />
            {valor.situacion === 'INACTIVO' && <Pastilla texto="Dado de baja" tono="error" />}
          </div>
          <p className="text-xs" style={{ color: COLORES.tenue }}>
            Ubicación actual: {(valor.area as Area)?.nombreArea ?? '—'}{(valor.oficina as Oficina)?.nombreOficina ? ` / ${(valor.oficina as Oficina).nombreOficina}` : ''}
          </p>
        </div>
        <button type="button" onClick={() => onElegir(null)} title="Cambiar activo" style={{ color: COLORES.tenue }}><MdClose size={18} /></button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input value={texto} onChange={e => setTexto(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); buscar(); } }}
          placeholder="Código, descripción, serie o EPC (Enter)"
          className={inputCls} style={inputStyle} autoFocus />
        <button type="button" onClick={buscar} disabled={buscando}
          className="px-3 rounded-lg text-white flex items-center" style={{ backgroundColor: COLORES.brand }}>
          <MdSearch size={20} />
        </button>
      </div>
      {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}
      {resultados.length > 1 && (
        <div className="rounded-lg overflow-y-auto" style={{ border: `1.5px solid ${COLORES.borde}`, maxHeight: 220 }}>
          {resultados.map(a => (
            <button type="button" key={a.id} onClick={() => { onElegir(a); setResultados([]); }}
              className="w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2"
              style={{ borderBottom: '1px solid #f1f5f9' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(34,196,161,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              <span><span className="font-mono text-xs mr-2" style={{ color: COLORES.suave }}>{a.codActivo}</span>{a.descripcion}</span>
              {a.situacion === 'INACTIVO' && <Pastilla texto="Baja" tono="error" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
