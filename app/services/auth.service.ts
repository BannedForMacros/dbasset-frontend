import api from './api';

const RESOURCE = '/auth';

// --- TIPOS ---

export interface Empresa {
  codEmpresa: number;
  ruc: string;
  razonSocial: string;
  rol: string;
}

export interface LoginRequest {
  username: string;
  password?: string;
}

export interface LoginResponse {
  mensaje: string;
  usuario: string;
  nombreCompleto: string;
  tipoUsu: number;
  empresas: Empresa[];
  authHeader?: string; 
  currentCompanyId?: number;
}

export type UserData = LoginResponse;

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(`${RESOURCE}/login`, credentials);
    
    if (response.data) {
      // 1. Generar credencial Basic Auth
      const tokenBase64 = btoa(`${credentials.username}:${credentials.password}`);
      const authHeader = `Basic ${tokenBase64}`;

      // Siempre dejamos currentCompanyId como undefined para forzar el selector

      // 3. Construir el objeto de sesión
      const sessionData: LoginResponse = {
        ...response.data,
        authHeader: authHeader,
        currentCompanyId: undefined // Siempre undefined al inicio
      };

      // 4. Guardar en Storage
      authService.saveSession(sessionData);
      return sessionData;
    }
    
    return response.data;
  },

  // Método para cambiar de empresa manualmente
  selectCompany: (codEmpresa: number): void => {
    const data = authService.getUserData();
    if (data) {
      data.currentCompanyId = codEmpresa;
      authService.saveSession(data);
    }
  },

  saveSession: (data: LoginResponse): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dbasset_user', JSON.stringify(data));
    }
  },

  // Método de compatibilidad (alias)
  saveUserData: (data: LoginResponse): void => {
    authService.saveSession(data);
  },

  getUserData: (): LoginResponse | null => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('dbasset_user');
      if (userStr) {
        return JSON.parse(userStr) as LoginResponse;
      }
    }
    return null;
  },

  // ✅ NUEVO: Verifica si está logueado (sin importar empresa)
  isLoggedIn: (): boolean => {
    const user = authService.getUserData();
    return !!(user && user.authHeader);
  },

  // ✅ Verifica si tiene empresa seleccionada
  hasCompanySelected: (): boolean => {
    const user = authService.getUserData();
    return !!(user && user.currentCompanyId);
  },

  // ✅ MODIFICADO: Ahora valida usuario + empresa
  isAuthenticated: (): boolean => {
    return authService.isLoggedIn() && authService.hasCompanySelected();
  },

  logout: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dbasset_user');
      window.location.href = '/login';
    }
  },
};