// src/services/local.service.ts

import api from './api'; // <--- ESTO ES LO VITAL (Tu archivo api.ts)

// Definimos el tipo aquí mismo como pediste
export interface Local {
  codLocal?: number; 
  nombreLocal: string;
  direccion: string;
  codInterno: string;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const RESOURCE = '/locales'; 

export const localService = {
  // 1. Listar solo activos (Para la tabla principal)
  listarActivos: async (): Promise<Local[]> => {
    try {
      // Usamos 'api' (que ya tiene el token) en vez de 'axios'
      const response = await api.get<Local[]>(RESOURCE);
      return response.data;
    } catch (error) {
      console.error('Error al listar locales activos:', error);
      throw error; // Lanzamos el error para que la UI sepa que falló
    }
  },

  // 2. Listar todos (Histórico)
  listarTodos: async (): Promise<Local[]> => {
    const response = await api.get<Local[]>(`${RESOURCE}/all`);
    return response.data;
  },

  // 3. Obtener uno por ID
  obtenerPorId: async (id: number): Promise<Local> => {
    const response = await api.get<Local>(`${RESOURCE}/${id}`);
    return response.data;
  },

  // 4. Crear
  crear: async (local: Local): Promise<Local> => {
    const response = await api.post<Local>(RESOURCE, local);
    return response.data;
  },

  // 5. Actualizar
  actualizar: async (id: number, local: Local): Promise<Local> => {
    const response = await api.put<Local>(`${RESOURCE}/${id}`, local);
    return response.data;
  },

  // 6. Eliminar
  eliminar: async (id: number): Promise<void> => {
    await api.delete(`${RESOURCE}/${id}`);
  },
};