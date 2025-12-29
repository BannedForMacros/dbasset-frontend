import api from './api';

const RESOURCE = '/inventariadores';

export interface Inventariador {
  codInventariador?: number;
  nombreInventariador: string;
  dni?: string;
  telefono?: string;
  email?: string;
  codInterno?: string;
  codEmpresa?: number;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventariadorCreateRequest {
  nombreInventariador: string;
  dni?: string;
  telefono?: string;
  email?: string;
  codInterno?: string;
}

export interface InventariadorUpdateRequest {
  nombreInventariador?: string;
  dni?: string;
  telefono?: string;
  email?: string;
  codInterno?: string;
}

export const inventariadorService = {
  /**
   * Listar todos los inventariadores activos de la empresa
   */
  listarActivos: async (): Promise<Inventariador[]> => {
    const response = await api.get<Inventariador[]>(RESOURCE);
    return response.data;
  },

  /**
   * Obtener un inventariador por ID
   */
  obtenerPorId: async (codInventariador: number): Promise<Inventariador> => {
    const response = await api.get<Inventariador>(`${RESOURCE}/${codInventariador}`);
    return response.data;
  },

  /**
   * Crear un nuevo inventariador
   */
  crear: async (inventariador: InventariadorCreateRequest): Promise<Inventariador> => {
    const response = await api.post<Inventariador>(RESOURCE, inventariador);
    return response.data;
  },

  /**
   * Actualizar un inventariador existente
   */
  actualizar: async (
    codInventariador: number,
    inventariador: InventariadorUpdateRequest
  ): Promise<Inventariador> => {
    const response = await api.put<Inventariador>(
      `${RESOURCE}/${codInventariador}`,
      inventariador
    );
    return response.data;
  },

  /**
   * Eliminar (soft delete) un inventariador
   */
  eliminar: async (codInventariador: number): Promise<void> => {
    await api.delete(`${RESOURCE}/${codInventariador}`);
  },

  /**
   * Buscar inventariadores por nombre (búsqueda local en el cliente)
   * Para búsquedas más complejas, considera agregar un endpoint en el backend
   */
  buscarPorNombre: async (nombre: string): Promise<Inventariador[]> => {
    const inventariadores = await inventariadorService.listarActivos();
    return inventariadores.filter(inv =>
      inv.nombreInventariador.toLowerCase().includes(nombre.toLowerCase())
    );
  },

  /**
   * Validar si un DNI ya existe (búsqueda local)
   * Considera agregar un endpoint específico en el backend si lo necesitas
   */
  validarDniDuplicado: async (dni: string, excluirId?: number): Promise<boolean> => {
    const inventariadores = await inventariadorService.listarActivos();
    return inventariadores.some(
      inv => inv.dni === dni && inv.codInventariador !== excluirId
    );
  }
};