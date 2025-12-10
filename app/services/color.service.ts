import api from './api';

export interface Color {
  codColor?: number;
  nombreColor: string;
}

export const colorService = {
  listarTodos: async (): Promise<Color[]> => {
    const response = await api.get('/colores');
    return response.data;
  },

  obtenerPorId: async (id: number): Promise<Color> => {
    const response = await api.get(`/colores/${id}`);
    return response.data;
  },

  crear: async (color: Color): Promise<Color> => {
    const response = await api.post('/colores', color);
    return response.data;
  },

  actualizar: async (id: number, color: Color): Promise<Color> => {
    const response = await api.put(`/colores/${id}`, color);
    return response.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/colores/${id}`);
  }
};