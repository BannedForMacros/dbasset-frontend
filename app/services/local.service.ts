import api from './api';
import { authService } from './auth.service';

const RESOURCE = '/locales';

export interface Local {
  codLocal?: number;
  nombreLocal: string;
  direccion: string;
  codInterno: string;
  codEmpresa?: number;
  activo?: boolean;
}

// ✅ Helper para obtener el codEmpresa actual
const getCodEmpresa = (): number => {
  const user = authService.getUserData();
  if (!user || !user.currentCompanyId) {
    throw new Error('No hay empresa seleccionada');
  }
  return user.currentCompanyId;
};

export const localService = {
  // ✅ Ahora envía codEmpresa como parámetro
  listarActivos: async (): Promise<Local[]> => {
    const codEmpresa = getCodEmpresa();
    const response = await api.get<Local[]>(`${RESOURCE}/activos`, {
      params: { codEmpresa }
    });
    return response.data;
  },

  listarTodos: async (): Promise<Local[]> => {
    const codEmpresa = getCodEmpresa();
    const response = await api.get<Local[]>(`${RESOURCE}`, {
      params: { codEmpresa }
    });
    return response.data;
  },

  obtenerPorId: async (id: number): Promise<Local> => {
    const response = await api.get<Local>(`${RESOURCE}/${id}`);
    return response.data;
  },

  // ✅ Envía codEmpresa en el body o como parámetro según tu backend
  crear: async (local: Local): Promise<Local> => {
    const codEmpresa = getCodEmpresa();
    const response = await api.post<Local>(`${RESOURCE}`, local, {
      params: { codEmpresa } // o incluirlo en el body si prefieres
    });
    return response.data;
  },

  actualizar: async (id: number, local: Local): Promise<Local> => {
    const response = await api.put<Local>(`${RESOURCE}/${id}`, local);
    return response.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`${RESOURCE}/${id}`);
  },
};