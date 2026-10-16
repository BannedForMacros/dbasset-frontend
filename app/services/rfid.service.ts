import api from './api';

const RESOURCE = '/rfid/inventarios';

export type Alcance = 'COMPLETO' | 'LOCAL' | 'AREA' | 'OFICINA';
export type ResultadoItem = 'ENCONTRADO' | 'NO_ENCONTRADO' | 'INESPERADO';

export interface SesionInventario {
  id: number;
  descripcion: string;
  alcance: Alcance;
  codLocal?: number; local?: string;
  codArea?: number; area?: string;
  codOficina?: number; oficina?: string;
  estado: 'ABIERTA' | 'CERRADA';
  totalEsperados: number;
  epcLeidos?: number;
  creadoPor?: string;
  fechaCreacion: string;
  cerradoPor?: string;
  fechaCierre?: string;
}

export interface ItemInventario {
  resultado: ResultadoItem;
  // NO_LEIDO | SIN_EPC | OTRA_UBICACION | DADO_DE_BAJA | NO_REGISTRADO
  detalle: string | null;
  idActivo: number | null;
  codActivo: string | null;
  descripcion: string | null;
  serie: string | null;
  epc: string | null;
  local?: string; area?: string; oficina?: string; responsable?: string;
  conteo?: number;
  ultimaLectura?: string;
  origen?: string;
  areaLectura?: string;
}

export interface ResumenArea {
  codArea: number | null;
  area: string;
  local?: string;
  esperados: number;
  encontrados: number;
  faltantes: number;
  sobrantes: number;
}

export interface ResultadoInventario {
  sesion: SesionInventario;
  totales: {
    esperados: number; encontrados: number; faltantes: number; faltantesSinEpc: number;
    inesperados: number; noRegistrados: number; epcLeidos: number; avance: number;
  };
  resumenAreas: ResumenArea[];
  items: ItemInventario[];
}

export interface RespuestaLote {
  duplicado: boolean;
  mensaje?: string;
  recibidas?: number;
  epcValidos?: number;
  invalidos?: string[];
  lecturas?: { epc: string; resultado: ResultadoItem; detalle: string | null; codActivo: string | null; descripcion: string | null }[];
}

export const rfidService = {
  listar: async (estado?: string): Promise<SesionInventario[]> =>
    (await api.get<SesionInventario[]>(RESOURCE, { params: estado ? { estado } : {} })).data,

  crear: async (datos: { descripcion: string; alcance: Alcance; codLocal?: number; codArea?: number; codOficina?: number }): Promise<SesionInventario> =>
    (await api.post<SesionInventario>(RESOURCE, datos)).data,

  resultado: async (id: number): Promise<ResultadoInventario> =>
    (await api.get<ResultadoInventario>(`${RESOURCE}/${id}/resultado`)).data,

  // origen: MANUAL (escrito / lector como teclado) o ARCHIVO (TXT/CSV exportado del lector)
  registrarEpcs: async (id: number, epcs: string[], origen: 'MANUAL' | 'ARCHIVO', codAreaLectura?: number): Promise<RespuestaLote> =>
    (await api.post<RespuestaLote>(`${RESOURCE}/${id}/lecturas`, { epcs, codAreaLectura }, { params: { origen } })).data,

  quitarLectura: async (id: number, epc: string): Promise<void> => {
    await api.delete(`${RESOURCE}/${id}/lecturas/${encodeURIComponent(epc)}`);
  },

  cerrar: async (id: number): Promise<SesionInventario> => (await api.post<SesionInventario>(`${RESOURCE}/${id}/cerrar`)).data,

  reabrir: async (id: number): Promise<SesionInventario> => (await api.post<SesionInventario>(`${RESOURCE}/${id}/reabrir`)).data,
};

export const ETIQUETA_RESULTADO: Record<string, string> = {
  ENCONTRADO: 'Encontrado',
  NO_ENCONTRADO: 'No encontrado',
  INESPERADO: 'Inesperado',
};

export const ETIQUETA_DETALLE: Record<string, string> = {
  NO_LEIDO: 'No leído',
  SIN_EPC: 'Sin tag (sin EPC)',
  OTRA_UBICACION: 'Registrado en otra ubicación',
  DADO_DE_BAJA: 'Dado de baja',
  NO_REGISTRADO: 'EPC no registrado',
};

export const ETIQUETA_ALCANCE: Record<string, string> = {
  COMPLETO: 'Completo', LOCAL: 'Por local', AREA: 'Por área', OFICINA: 'Por oficina',
};
