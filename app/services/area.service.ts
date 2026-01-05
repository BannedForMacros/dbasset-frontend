import api from './api';
import { Local } from './local.service';

const RESOURCE = '/areas';

export interface Area {
  codArea?: number;
  codEmpresa?: number;
  nombreArea: string;
  observacion: string;
  codInterno: string;
  activo?: boolean;
  local: Local | { codLocal: number }; 
}

export const areaService = {
  listarActivos: async (): Promise<Area[]> => {
    const response = await api.get<Area[]>(RESOURCE);
    return response.data;
  },

  listarPorLocal: async (codLocal: number): Promise<Area[]> => {
    const response = await api.get<Area[]>(`${RESOURCE}/por-local/${codLocal}`);
    return response.data;
  },

  crear: async (area: Area): Promise<Area> => {
    const response = await api.post<Area>(RESOURCE, area);
    return response.data;
  },

  actualizar: async (id: number, area: Area): Promise<Area> => {
    const response = await api.put<Area>(`${RESOURCE}/${id}`, area);
    return response.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`${RESOURCE}/${id}`);
  }
};