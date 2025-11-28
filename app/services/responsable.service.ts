import api from './api';
import { Oficina } from './oficina.service';

const RESOURCE = '/responsables';

export interface Responsable {
  codResponsable?: number;
  nombreResponsable: string;
  cargo: string;
  codInterno: string;
  activo?: boolean;
  // Relación: Al enviar (POST) basta con { codOficina: X }
  oficina: Oficina | { codOficina: number }; 
}

export const responsableService = {
  listarActivos: async (): Promise<Responsable[]> => {
    const response = await api.get<Responsable[]>(RESOURCE);
    return response.data;
  },

  crear: async (responsable: Responsable): Promise<Responsable> => {
    const response = await api.post<Responsable>(RESOURCE, responsable);
    return response.data;
  },

  actualizar: async (id: number, responsable: Responsable): Promise<Responsable> => {
    const response = await api.put<Responsable>(`${RESOURCE}/${id}`, responsable);
    return response.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`${RESOURCE}/${id}`);
  },

  listarPorOficina: async (codOficina: number): Promise<Responsable[]> => {
    const response = await api.get<Responsable[]>(`${RESOURCE}/por-oficina/${codOficina}`);
    return response.data;
  }
};