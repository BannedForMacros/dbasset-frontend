import api from './api';

export interface Marca {
  codMarca?: number;
  nombreMarca: string;
}

export const marcaService = {
  listarTodos: async (): Promise<Marca[]> => {
    const response = await api.get('/marcas');
    return response.data;
  },

  obtenerPorId: async (id: number): Promise<Marca> => {
    const response = await api.get(`/marcas/${id}`);
    return response.data;
  },

  crear: async (marca: Marca): Promise<Marca> => {
    const response = await api.post('/marcas', marca);
    return response.data;
  },

  actualizar: async (id: number, marca: Marca): Promise<Marca> => {
    const response = await api.put(`/marcas/${id}`, marca);
    return response.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/marcas/${id}`);
  }
};