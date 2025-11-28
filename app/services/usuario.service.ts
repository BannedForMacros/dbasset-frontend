import api from './api';

const RESOURCE = '/usuarios';

export interface Usuario {
  codUsuario?: number;
  nombreUsuario: string;
  nombreCompleto: string;
  tipoUsu?: number;
}

export const usuarioService = {
  listarTodos: async (): Promise<Usuario[]> => {
    const response = await api.get<Usuario[]>(RESOURCE);
    return response.data;
  }
};