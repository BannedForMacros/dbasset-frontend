import api from './api';

// URL base relativa (api.ts ya tiene el host)
const RESOURCE = '/auth';

// --- TIPOS (Restauramos UserData para que no falle tu Dashboard) ---

export interface LoginRequest {
  username: string;
  password?: string;
}

export interface LoginResponse {
  mensaje: string;
  usuario: string;
  nombreCompleto: string;
  tipoUsu: number;
  authHeader?: string; 
}

// Re-exportamos UserData para compatibilidad con tu código anterior
export interface UserData {
  usuario: string;
  nombreCompleto: string;
  tipoUsu: number;
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(`${RESOURCE}/login`, credentials);
    
    if (response.data) {
      // Generar credencial Basic Auth
      const tokenBase64 = btoa(`${credentials.username}:${credentials.password}`);
      const authHeader = `Basic ${tokenBase64}`;

      const sessionData = {
        ...response.data,
        authHeader: authHeader
      };

      authService.saveSession(sessionData);
    }
    
    return response.data;
  },

  // CORRECCIÓN 1: Quitamos 'any' y usamos el tipo correcto
  saveSession: (data: LoginResponse): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dbasset_user', JSON.stringify(data));
    }
  },

  // CORRECCIÓN 2: Agregamos este método que tu Login.tsx estaba buscando
  saveUserData: (data: LoginResponse): void => {
    authService.saveSession(data);
  },

  getUserData: (): LoginResponse | null => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('dbasset_user');
      if (userStr) {
        return JSON.parse(userStr);
      }
    }
    return null;
  },

  isAuthenticated: (): boolean => {
    const user = authService.getUserData();
    return !!user && !!user.authHeader;
  },

  logout: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dbasset_user');
      window.location.href = '/login';
    }
  },
};