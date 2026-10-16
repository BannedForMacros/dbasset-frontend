import api from './api';

const RESOURCE = '/transferencias';

export type EstadoTransferencia = 'PENDIENTE' | 'RECIBIDA' | 'RECHAZADA' | 'ANULADA';

export interface Transferencia {
  id: number;
  idActivo: number;
  codActivo: string;
  descripcionActivo?: string;
  estado: EstadoTransferencia;
  localOrigen?: string; areaOrigen?: string; oficinaOrigen?: string; responsableOrigen?: string;
  localDestino?: string; areaDestino?: string; oficinaDestino?: string; responsableDestino?: string;
  codAreaDestino: number;
  motivo?: string;
  registradoPor?: string;
  origenRegistro?: 'WEB' | 'APP';
  fechaEnvio: string;
  recibidoPor?: string;
  fechaRecepcion?: string;
  observacionRecepcion?: string;
}

export interface NuevaTransferencia {
  idActivo: number;
  codAreaDestino: number;
  codOficinaDestino?: number;
  codRespDestino?: number;
  motivo?: string;
}

export const transferenciaService = {
  listar: async (filtro: { estado?: string; desde?: string; hasta?: string } = {}): Promise<Transferencia[]> =>
    (await api.get<Transferencia[]>(RESOURCE, { params: filtro })).data,

  crear: async (datos: NuevaTransferencia): Promise<Transferencia> =>
    (await api.post<Transferencia>(RESOURCE, datos)).data,

  confirmar: async (id: number, recibidoPor?: string, observacion?: string): Promise<Transferencia> =>
    (await api.post<Transferencia>(`${RESOURCE}/${id}/confirmar`, { recibidoPor, observacion })).data,

  rechazar: async (id: number, observacion?: string): Promise<Transferencia> =>
    (await api.post<Transferencia>(`${RESOURCE}/${id}/rechazar`, { observacion })).data,

  anular: async (id: number): Promise<Transferencia> =>
    (await api.post<Transferencia>(`${RESOURCE}/${id}/anular`)).data,
};
