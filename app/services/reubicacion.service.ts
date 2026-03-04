import api from './api';

const RESOURCE = '/inventariador-v2/reubicaciones';

export interface Reubicacion {
  id?: number;
  codCarga?: number;
  codActivo?: string;
  codInventariador?: number;
  codLocalAnterior?: number;
  codAreaAnterior?: number;
  codOficinaAnterior?: number;
  codRespAnterior?: number;
  codLocalNuevo?: number;
  codAreaNuevo?: number;
  codOficinaaNuevo?: number;
  codRespNuevo?: number;
  estado?: string;
  observacion?: string;
  fechaReubicacion?: string;
  fechaRegistro?: string;
}

export const reubicacionService = {
  listarPorActivo: async (codActivo: string): Promise<Reubicacion[]> => {
    const response = await api.get<Reubicacion[]>(`${RESOURCE}/por-activo/${codActivo}`);
    return response.data;
  },
};