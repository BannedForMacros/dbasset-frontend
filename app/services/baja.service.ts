import api from './api';

const RESOURCE = '/bajas';

export type MotivoBaja = 'OBSOLESCENCIA' | 'PERDIDA' | 'VENTA' | 'DESTRUCCION' | 'OTRO';

export const MOTIVOS_BAJA: { value: MotivoBaja; label: string }[] = [
  { value: 'OBSOLESCENCIA', label: 'Obsolescencia' },
  { value: 'PERDIDA', label: 'Pérdida' },
  { value: 'VENTA', label: 'Venta' },
  { value: 'DESTRUCCION', label: 'Destrucción' },
  { value: 'OTRO', label: 'Otro' },
];

export const ETIQUETA_MOTIVO: Record<string, string> = Object.fromEntries(MOTIVOS_BAJA.map(m => [m.value, m.label]));

// Extensiones que acepta el backend (ArchivoService.EXT_ADJUNTO)
export const ACCEPT_ADJUNTOS = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.gif,.msg,.eml,.txt';

export interface BajaAdjunto {
  id: number;
  idBaja: number;
  nombreOriginal: string;
  tipoMime: string;
  tamano: number;
  fechaRegistro: string;
}

export interface Baja {
  id: number;
  idActivo: number;
  codActivo: string;
  descripcionActivo?: string;
  serie?: string;
  epc?: string;
  motivo: MotivoBaja;
  detalle?: string;
  autorizadoPor: string;
  registradoPor?: string;
  fechaBaja: string;
  fechaRegistro: string;
  local?: string; area?: string; oficina?: string; responsable?: string;
  totalAdjuntos: number;
  adjuntos?: BajaAdjunto[];
}

export const bajaService = {
  listar: async (filtro: { desde?: string; hasta?: string } = {}): Promise<Baja[]> =>
    (await api.get<Baja[]>(RESOURCE, { params: filtro })).data,

  obtener: async (id: number): Promise<Baja> => (await api.get<Baja>(`${RESOURCE}/${id}`)).data,

  crear: async (datos: { idActivo: number; motivo: MotivoBaja; detalle?: string; autorizadoPor: string; fechaBaja?: string }): Promise<Baja> =>
    (await api.post<Baja>(RESOURCE, datos)).data,

  adjuntar: async (idBaja: number, archivos: File[]): Promise<BajaAdjunto[]> => {
    const fd = new FormData();
    archivos.forEach(a => fd.append('files', a));
    return (await api.post<BajaAdjunto[]>(`${RESOURCE}/${idBaja}/adjuntos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
  },

  /** Abre el adjunto (PDF/imagen en otra pestaña; Word/Excel/correo se descargan). */
  abrirAdjunto: async (adj: BajaAdjunto): Promise<void> => {
    const r = await api.get(`${RESOURCE}/adjuntos/${adj.id}/archivo`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([r.data], { type: adj.tipoMime }));
    const enLinea = /^(application\/pdf|image\/|text\/plain)/.test(adj.tipoMime);
    if (enLinea) {
      window.open(url, '_blank', 'noopener');
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = adj.nombreOriginal;
      a.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
};
