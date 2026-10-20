import api from './api';

const RESOURCE = '/superadmin';

export interface EmpresaAdmin {
  codEmpresa: number;
  ruc: string;
  razonSocial: string;
  activo: boolean;
  createdAt?: string;
  totalUsuarios: number;
}

export interface AsignacionEmpresa {
  codEmpresa: number;
  codRol?: number | null;
  rol: string;
  razonSocial?: string;
  ruc?: string;
  empresaActiva?: boolean;
}

export interface UsuarioAdmin {
  codUsuario: number;
  nombreUsuario: string;
  nombreCompleto: string;
  descripcion?: string;
  tipoUsu?: number;
  esSuperadmin: boolean;
  activo: boolean;
  empresas: AsignacionEmpresa[];
}

export interface UsuarioForm {
  nombreUsuario: string;
  clave?: string;
  nombreCompleto: string;
  descripcion?: string;
  esSuperadmin: boolean;
  activo: boolean;
}

// ── Roles y permisos ─────────────────────────────────────────────────────

export interface RolAdmin {
  codRol: number;
  nombre: string;
  descripcion?: string;
  esSistema: boolean;
  activo: boolean;
  totalUsuarios: number;
  permisos: string[];
}

export interface PermisoAdmin {
  codPermiso: number;
  codigo: string;
  modulo: string;
  accion: string;
  descripcion?: string;
  orden: number;
}

// ── Usuarios dentro de una empresa ───────────────────────────────────────

export interface UsuarioEmpresa {
  codUsuario: number;
  nombreUsuario: string;
  nombreCompleto: string;
  descripcion?: string;
  usuarioActivo: boolean;
  activo: boolean;
  codRol?: number | null;
  rol: string;
}

export interface UsuarioDisponible {
  codUsuario: number;
  nombreUsuario: string;
  nombreCompleto: string;
}

export const superadminService = {
  // Empresas
  empresas: async (): Promise<EmpresaAdmin[]> => (await api.get<EmpresaAdmin[]>(`${RESOURCE}/empresas`)).data,

  crearEmpresa: async (datos: { ruc: string; razonSocial: string; activo: boolean }) =>
    (await api.post(`${RESOURCE}/empresas`, datos)).data,

  actualizarEmpresa: async (id: number, datos: { ruc: string; razonSocial: string; activo: boolean }) =>
    (await api.put(`${RESOURCE}/empresas/${id}`, datos)).data,

  // Usuarios de una empresa
  empresaUsuarios: async (id: number): Promise<UsuarioEmpresa[]> =>
    (await api.get<UsuarioEmpresa[]>(`${RESOURCE}/empresas/${id}/usuarios`)).data,

  empresaUsuariosDisponibles: async (id: number): Promise<UsuarioDisponible[]> =>
    (await api.get<UsuarioDisponible[]>(`${RESOURCE}/empresas/${id}/usuarios-disponibles`)).data,

  asignarUsuarioEmpresa: async (id: number, datos: { codUsuario: number; codRol: number; activo?: boolean }): Promise<UsuarioEmpresa[]> =>
    (await api.post<UsuarioEmpresa[]>(`${RESOURCE}/empresas/${id}/usuarios`, datos)).data,

  crearUsuarioEmpresa: async (id: number, datos: { usuario: UsuarioForm; codRol: number }) =>
    (await api.post(`${RESOURCE}/empresas/${id}/usuarios/nuevo`, datos)).data,

  actualizarUsuarioEmpresa: async (id: number, codUsuario: number, datos: { codRol: number; activo?: boolean }): Promise<UsuarioEmpresa[]> =>
    (await api.put<UsuarioEmpresa[]>(`${RESOURCE}/empresas/${id}/usuarios/${codUsuario}`, datos)).data,

  quitarUsuarioEmpresa: async (id: number, codUsuario: number): Promise<UsuarioEmpresa[]> =>
    (await api.delete<UsuarioEmpresa[]>(`${RESOURCE}/empresas/${id}/usuarios/${codUsuario}`)).data,

  // Usuarios globales (superadministradores)
  usuarios: async (): Promise<UsuarioAdmin[]> => (await api.get<UsuarioAdmin[]>(`${RESOURCE}/usuarios`)).data,

  crearUsuario: async (datos: UsuarioForm): Promise<UsuarioAdmin> =>
    (await api.post<UsuarioAdmin>(`${RESOURCE}/usuarios`, { ...datos, tipoUsu: 1 })).data,

  actualizarUsuario: async (id: number, datos: UsuarioForm): Promise<UsuarioAdmin> =>
    (await api.put<UsuarioAdmin>(`${RESOURCE}/usuarios/${id}`, { ...datos, clave: datos.clave || undefined })).data,

  asignarEmpresas: async (id: number, asignaciones: { codEmpresa: number; codRol?: number | null; rol?: string }[]): Promise<AsignacionEmpresa[]> =>
    (await api.put<AsignacionEmpresa[]>(`${RESOURCE}/usuarios/${id}/empresas`, asignaciones)).data,

  // Roles y permisos
  roles: async (): Promise<RolAdmin[]> => (await api.get<RolAdmin[]>(`${RESOURCE}/roles`)).data,

  permisos: async (): Promise<PermisoAdmin[]> => (await api.get<PermisoAdmin[]>(`${RESOURCE}/permisos`)).data,

  crearRol: async (datos: { nombre: string; descripcion?: string; activo?: boolean }): Promise<RolAdmin> =>
    (await api.post<RolAdmin>(`${RESOURCE}/roles`, datos)).data,

  actualizarRol: async (id: number, datos: { nombre?: string; descripcion?: string; activo?: boolean }): Promise<RolAdmin> =>
    (await api.put<RolAdmin>(`${RESOURCE}/roles/${id}`, datos)).data,

  eliminarRol: async (id: number) => (await api.delete(`${RESOURCE}/roles/${id}`)).data,

  actualizarPermisosRol: async (id: number, permisos: string[]): Promise<RolAdmin> =>
    (await api.put<RolAdmin>(`${RESOURCE}/roles/${id}/permisos`, permisos)).data,
};
