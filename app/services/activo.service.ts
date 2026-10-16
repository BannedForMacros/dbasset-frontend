import api from './api';
import { Local } from './local.service';
import { Area } from './area.service';
import { Oficina } from './oficina.service';
import { Responsable } from './responsable.service';
import { Estado } from './estado.service';

const RESOURCE = '/activos';

export interface Activo {
  id?: number;
  codActivo: string; // Código de barras / Placa
  codInterno?: string;
  descripcion: string;
  marca?: string;
  modelo?: string;
  serie?: string;
  anio?: string;
  color?: string;
  fechaCompra?: string;
  
  // Relaciones (Para POST basta con el ID, para GET viene el objeto)
  local: Local | { codLocal: number };
  area: Area | { codArea: number };
  oficina: Oficina | { codOficina: number };
  responsable: Responsable | { codResponsable: number };
  estado: Estado | { codEstado: number };

  activo?: boolean;

  // RFID
  epc?: string | null;
  categoria?: string;
  situacion?: 'ACTIVO' | 'INACTIVO';
  createdAt?: string;
}

export interface ActivoFoto {
  id: number;
  idActivo: number;
  nombreOriginal: string;
  tipoMime: string;
  tamano: number;
  registradoPor?: string;
  fechaRegistro: string;
}

export interface FichaActivo {
  activo: Activo;
  fotos: ActivoFoto[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transferencias: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  baja: any | null;
  reubicaciones: {
    id: number; codCarga?: number; fechaReubicacion?: string; fechaRegistro?: string; observacion?: string;
    codAreaAnterior?: number; codAreaNuevo?: number; codOficinaAnterior?: number; codOficinaaNuevo?: number;
  }[];
  inventarios: { idSesion: number; descripcion: string; estado: string; fechaCreacion: string; resultado: string; ultimaLectura?: string }[];
}

export const activoRfidService = {
  sinEpc: async (): Promise<Activo[]> => (await api.get<Activo[]>(`${RESOURCE}/sin-epc`)).data,

  porEpc: async (epc: string): Promise<Activo> =>
    (await api.get<Activo>(`${RESOURCE}/epc/${encodeURIComponent(epc)}`)).data,

  vincularEpc: async (id: number, epc: string): Promise<Activo> =>
    (await api.put<Activo>(`${RESOURCE}/${id}/epc`, { epc })).data,

  desvincularEpc: async (id: number): Promise<Activo> =>
    (await api.delete<Activo>(`${RESOURCE}/${id}/epc`)).data,

  buscar: async (q: string, incluirBajas = true): Promise<Activo[]> =>
    (await api.get<Activo[]>(`${RESOURCE}/busqueda`, { params: { q, incluirBajas } })).data,

  ficha: async (id: number): Promise<FichaActivo> =>
    (await api.get<FichaActivo>(`${RESOURCE}/${id}/ficha`)).data,

  subirFoto: async (id: number, archivo: File): Promise<ActivoFoto> => {
    const fd = new FormData();
    fd.append('file', archivo);
    return (await api.post<ActivoFoto>(`${RESOURCE}/${id}/fotos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
  },

  urlFoto: async (idFoto: number): Promise<string> => {
    const r = await api.get(`${RESOURCE}/fotos/${idFoto}/archivo`, { responseType: 'blob' });
    return URL.createObjectURL(r.data);
  },

  eliminarFoto: async (idFoto: number): Promise<void> => {
    await api.delete(`${RESOURCE}/fotos/${idFoto}`);
  },
};

export const activoService = {
  listarTodos: async (): Promise<Activo[]> => {
    const response = await api.get<Activo[]>(RESOURCE);
    return response.data;
  },

  obtenerPorId: async (id: number): Promise<Activo> => {
    const response = await api.get<Activo>(`${RESOURCE}/${id}`);
    return response.data;
  },

  buscarPorCodigo: async (codigo: string): Promise<Activo> => {
    const response = await api.get<Activo>(`${RESOURCE}/buscar/${codigo}`);
    return response.data;
  },

  crear: async (activo: Activo): Promise<Activo> => {
    const response = await api.post<Activo>(RESOURCE, activo);
    return response.data;
  },

  actualizar: async (id: number, activo: Activo): Promise<Activo> => {
    const response = await api.put<Activo>(`${RESOURCE}/${id}`, activo);
    return response.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`${RESOURCE}/${id}`);
  },

  //AHORA (con axios como los demás métodos)
  listarPorCarga: async (codCarga: number): Promise<Activo[]> => {
    const response = await api.get<Activo[]>(`${RESOURCE}/carga/${codCarga}`);
    return response.data;
  },
};