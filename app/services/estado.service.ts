import api from './api';

const RESOURCE = '/estados';

export interface Estado {
  codEstado?: number;
  nombreEstado: string;
}

export const estadoService = {
  listarTodos: async (): Promise<Estado[]> => {
    const response = await api.get<Estado[]>(RESOURCE);
    return response.data;
  },

  crear: async (estado: Estado): Promise<Estado> => {
    const response = await api.post<Estado>(RESOURCE, estado);
    return response.data;
  },

  // Nota: Si tu backend tiene update/delete para estados, agrégalos aquí.
  // Si no, con listar y crear basta para empezar.
  // Asumiré que sí agregamos los métodos básicos en el controller Java.
  actualizar: async (id: number, estado: Estado): Promise<Estado> => {
    const response = await api.put<Estado>(`${RESOURCE}/${id}`, estado);
    return response.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`${RESOURCE}/${id}`);
  }
};