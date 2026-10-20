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

export type RolEmpresa = 'ADMIN' | 'AUDITOR';

export interface AsignacionEmpresa {
  codEmpresa: number;
  rol: RolEmpresa;
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

export const ROLES_EMPRESA: { value: RolEmpresa; label: string }[] = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'AUDITOR', label: 'Auditor' },
];

export const superadminService = {
  empresas: async (): Promise<EmpresaAdmin[]> => (await api.get<EmpresaAdmin[]>(`${RESOURCE}/empresas`)).data,

  crearEmpresa: async (datos: { ruc: string; razonSocial: string; activo: boolean }) =>
    (await api.post(`${RESOURCE}/empresas`, datos)).data,

  actualizarEmpresa: async (id: number, datos: { ruc: string; razonSocial: string; activo: boolean }) =>
    (await api.put(`${RESOURCE}/empresas/${id}`, datos)).data,

  usuarios: async (): Promise<UsuarioAdmin[]> => (await api.get<UsuarioAdmin[]>(`${RESOURCE}/usuarios`)).data,

  crearUsuario: async (datos: UsuarioForm): Promise<UsuarioAdmin> =>
    (await api.post<UsuarioAdmin>(`${RESOURCE}/usuarios`, { ...datos, tipoUsu: 1 })).data,

  actualizarUsuario: async (id: number, datos: UsuarioForm): Promise<UsuarioAdmin> =>
    (await api.put<UsuarioAdmin>(`${RESOURCE}/usuarios/${id}`, { ...datos, clave: datos.clave || undefined })).data,

  asignarEmpresas: async (id: number, asignaciones: { codEmpresa: number; rol: RolEmpresa }[]): Promise<AsignacionEmpresa[]> =>
    (await api.put<AsignacionEmpresa[]>(`${RESOURCE}/usuarios/${id}/empresas`, asignaciones)).data,

};
