import api from './api';
import { Area } from './area.service';

const RESOURCE = '/oficinas';

export interface Oficina {
  codOficina?: number;
  codEmpresa?: number;
  nombreOficina: string;
  observacion: string;
  codInterno: string;
  codLocal?: number;
  activo?: boolean;
  area: Area | { codArea: number }; 
}

export const oficinaService = {
  listarActivos: async (): Promise<Oficina[]> => {
    const response = await api.get<Oficina[]>(RESOURCE);
    return response.data;
  },

  listarPorArea: async (codArea: number): Promise<Oficina[]> => {
    const response = await api.get<Oficina[]>(`${RESOURCE}/por-area/${codArea}`);
    return response.data;
  },

  crear: async (oficina: Oficina): Promise<Oficina> => {
    const response = await api.post<Oficina>(RESOURCE, oficina);
    return response.data;
  },

  actualizar: async (id: number, oficina: Oficina): Promise<Oficina> => {
    const response = await api.put<Oficina>(`${RESOURCE}/${id}`, oficina);
    return response.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`${RESOURCE}/${id}`);
  }
};