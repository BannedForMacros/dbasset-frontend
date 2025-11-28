import api from './api';
import { Local } from './local.service'; // Importamos Local para usarlo en el tipo

const RESOURCE = '/areas';

export interface Area {
  codArea?: number;
  nombreArea: string;
  observacion: string;
  codInterno: string;
  activo?: boolean;
  // El backend devuelve el objeto completo en GET, pero en POST podemos enviar solo { codLocal: X }
  local: Local | { codLocal: number }; 
}

export const areaService = {
  listarActivos: async (): Promise<Area[]> => {
    const response = await api.get<Area[]>(RESOURCE);
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
  },
  
  // Extra: Listar por local (útil para futuros filtros)
  listarPorLocal: async (codLocal: number): Promise<Area[]> => {
    const response = await api.get<Area[]>(`${RESOURCE}/por-local/${codLocal}`);
    return response.data;
  }
};