import api from './api';
import { Local } from './local.service';
import { Area } from './area.service';
import { Oficina } from './oficina.service';
import { Responsable } from './responsable.service';
import { Estado } from './estado.service';

const RESOURCE = '/activos';

export interface Activo {
  id?: number;
  codActivo: string; // Código de barras / Placa
  codInterno?: string;
  descripcion: string;
  marca?: string;
  modelo?: string;
  serie?: string;
  anio?: string;
  color?: string;
  fechaCompra?: string;
  
  // Relaciones (Para POST basta con el ID, para GET viene el objeto)
  local: Local | { codLocal: number };
  area: Area | { codArea: number };
  oficina: Oficina | { codOficina: number };
  responsable: Responsable | { codResponsable: number };
  estado: Estado | { codEstado: number };
  
  activo?: boolean;
}

export const activoService = {
  listarTodos: async (): Promise<Activo[]> => {
    const response = await api.get<Activo[]>(RESOURCE);
    return response.data;
  },

  obtenerPorId: async (id: number): Promise<Activo> => {
    const response = await api.get<Activo>(`${RESOURCE}/${id}`);
    return response.data;
  },

  buscarPorCodigo: async (codigo: string): Promise<Activo> => {
    const response = await api.get<Activo>(`${RESOURCE}/buscar/${codigo}`);
    return response.data;
  },

  crear: async (activo: Activo): Promise<Activo> => {
    const response = await api.post<Activo>(RESOURCE, activo);
    return response.data;
  },

  actualizar: async (id: number, activo: Activo): Promise<Activo> => {
    const response = await api.put<Activo>(`${RESOURCE}/${id}`, activo);
    return response.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`${RESOURCE}/${id}`);
  }
};