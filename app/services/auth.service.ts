import api from './api';

const RESOURCE = '/auth';

// --- TIPOS ---

export interface Empresa {
  codEmpresa: number;
  ruc: string;
  razonSocial: string;
  codRol?: number;
  rol: string;
  permisos?: string[];
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
  codPersona?: number;
  rol?: string;
  esSuperadmin?: boolean;
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

  // El superadmin crea empresas después de iniciar sesión: refresca la lista guardada
  actualizarEmpresas: (empresas: Empresa[]): void => {
    const data = authService.getUserData();
    if (data) {
      data.empresas = empresas;
      authService.saveSession(data);
    }
  },

  esSuperadmin: (): boolean => !!authService.getUserData()?.esSuperadmin,

  /** Empresa seleccionada actualmente (o undefined si no hay ninguna). */
  empresaActual: (): Empresa | undefined => {
    const data = authService.getUserData();
    if (!data || !data.currentCompanyId) return undefined;
    return data.empresas?.find(e => e.codEmpresa === data.currentCompanyId);
  },

  /** Permisos (módulo.acción) del rol del usuario en la empresa seleccionada. */
  permisos: (): string[] => authService.empresaActual()?.permisos ?? [],

  /** Vuelve a pedir al backend los permisos del rol en la empresa actual y actualiza la sesión. */
  refrescarPermisos: async (): Promise<void> => {
    const sesion = authService.getUserData();
    if (!sesion?.authHeader || !sesion.currentCompanyId) return;
    try {
      const { data } = await api.get<{ codEmpresa: number; codRol?: number; rol: string; permisos: string[] }>('/auth/permisos');
      const empresas = (sesion.empresas ?? []).map(e =>
        e.codEmpresa === data.codEmpresa ? { ...e, ...data } : e);
      authService.saveSession({ ...sesion, empresas });
    } catch {
      // Sin conexión o sesión vencida: se conservan los permisos ya guardados.
    }
  },

  /** true si el rol del usuario en la empresa actual incluye el permiso indicado. */
  puede: (codigo: string): boolean => {
    if (authService.esSuperadmin()) return false;
    const empresa = authService.empresaActual();
    // Sesión creada antes de existir los permisos: se deja pasar y el backend decide.
    if (!empresa || !Array.isArray(empresa.permisos)) return true;
    const permisos = empresa.permisos;
    return permisos.includes('*') || permisos.includes(codigo);
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