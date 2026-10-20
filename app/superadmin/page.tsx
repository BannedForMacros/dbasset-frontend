'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MdBusiness, MdPeople, MdAdd, MdEdit, MdSearch, MdShield, MdVpnKey,
  MdSettings, MdPersonAdd, MdDeleteOutline, MdOutlineAdminPanelSettings, MdInfo,
} from 'react-icons/md';
import { Card, Boton, Campo, ModalBase, Tabla, tdCls, Pastilla, inputCls, inputStyle, useAviso, COLORES } from '@/app/components/rfid/ui';
import AdminHeader from './components/AdminHeader';
import { authService } from '@/app/services/auth.service';
import {
  superadminService, EmpresaAdmin, UsuarioAdmin, UsuarioForm, RolAdmin,
  UsuarioEmpresa, UsuarioDisponible,
} from '@/app/services/superadmin.service';
import { fmtFecha, mensajeError } from '@/app/utils/exportar';

type EmpresaForm = { codEmpresa?: number; ruc: string; razonSocial: string; activo: boolean };

const empresaVacia: EmpresaForm = { ruc: '', razonSocial: '', activo: true };
const usuarioVacio: UsuarioForm = { nombreUsuario: '', clave: '', nombreCompleto: '', descripcion: '', esSuperadmin: false, activo: true };

export default function SuperAdminPage() {
  const router = useRouter();
  const { mostrar, nodo } = useAviso();
  const [listo, setListo] = useState(false);
  const [miId, setMiId] = useState<number | undefined>();
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');

  const [empresas, setEmpresas] = useState<EmpresaAdmin[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [roles, setRoles] = useState<RolAdmin[]>([]);

  // Empresa en creación/edición
  const [empresaEdit, setEmpresaEdit] = useState<EmpresaForm | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Empresa en gestión (usuarios de esa empresa)
  const [gestion, setGestion] = useState<EmpresaAdmin | null>(null);
  const [usuariosEmpresa, setUsuariosEmpresa] = useState<UsuarioEmpresa[]>([]);
  const [disponibles, setDisponibles] = useState<UsuarioDisponible[]>([]);
  const [cargandoGestion, setCargandoGestion] = useState(false);
  const [panelAsignar, setPanelAsignar] = useState(false);
  const [panelCrear, setPanelCrear] = useState(false);
  const [asignacion, setAsignacion] = useState<{ codUsuario: number | ''; codRol: number | '' }>({ codUsuario: '', codRol: '' });
  const [nuevoUsuario, setNuevoUsuario] = useState<UsuarioForm>(usuarioVacio);
  const [rolNuevo, setRolNuevo] = useState<number | ''>('');

  // Superadministradores
  const [verSuperadmins, setVerSuperadmins] = useState(false);
  const [superEdit, setSuperEdit] = useState<(UsuarioForm & { codUsuario?: number }) | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const u = authService.getUserData();
      if (!u?.authHeader) { router.replace('/login'); return; }
      if (!u.esSuperadmin) { router.replace('/select-company'); return; }
      setMiId(u.codPersona);
      setListo(true);
    }, 0);
    return () => clearTimeout(t);
  }, [router]);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [e, u, r] = await Promise.all([
        superadminService.empresas(), superadminService.usuarios(), superadminService.roles(),
      ]);
      setEmpresas(e); setUsuarios(u); setRoles(r);
    } catch (err) { mostrar('error', mensajeError(err, 'No se pudo cargar la información')); }
    finally { setCargando(false); }
  }, [mostrar]);

  useEffect(() => { if (listo) cargar(); }, [listo, cargar]);

  const rolesActivos = useMemo(() => roles.filter(r => r.activo), [roles]);
  const superadmins = useMemo(() => usuarios.filter(u => u.esSuperadmin), [usuarios]);
  const empresasFiltradas = useMemo(() => {
    const t = filtro.trim().toLowerCase();
    return t
      ? empresas.filter(e => e.razonSocial.toLowerCase().includes(t) || e.ruc.includes(t))
      : empresas;
  }, [empresas, filtro]);

  // ── Empresas ──────────────────────────────────────────────────────────
  const guardarEmpresa = async () => {
    if (!empresaEdit) return;
    if (!/^\d{11}$/.test(empresaEdit.ruc.trim())) { mostrar('error', 'El RUC debe tener 11 dígitos'); return; }
    if (!empresaEdit.razonSocial.trim()) { mostrar('error', 'Indique la razón social'); return; }
    setGuardando(true);
    try {
      const datos = { ruc: empresaEdit.ruc.trim(), razonSocial: empresaEdit.razonSocial.trim(), activo: empresaEdit.activo };
      if (empresaEdit.codEmpresa) await superadminService.actualizarEmpresa(empresaEdit.codEmpresa, datos);
      else await superadminService.crearEmpresa(datos);
      mostrar('ok', empresaEdit.codEmpresa ? 'Empresa actualizada' : 'Empresa creada');
      setEmpresaEdit(null);
      await cargar();
    } catch (err) { mostrar('error', mensajeError(err, 'No se pudo guardar la empresa')); }
    finally { setGuardando(false); }
  };

  // ── Gestión de usuarios de una empresa ────────────────────────────────
  const abrirGestion = async (empresa: EmpresaAdmin) => {
    setGestion(empresa);
    setUsuariosEmpresa([]);
    setDisponibles([]);
    setPanelAsignar(false);
    setPanelCrear(false);
    setAsignacion({ codUsuario: '', codRol: rolesActivos[0]?.codRol ?? '' });
    setNuevoUsuario(usuarioVacio);
    setRolNuevo(rolesActivos[0]?.codRol ?? '');
    setCargandoGestion(true);
    try {
      const [asignados, libres] = await Promise.all([
        superadminService.empresaUsuarios(empresa.codEmpresa),
        superadminService.empresaUsuariosDisponibles(empresa.codEmpresa),
      ]);
      setUsuariosEmpresa(asignados); setDisponibles(libres);
    } catch (err) { mostrar('error', mensajeError(err, 'No se pudieron cargar los usuarios de la empresa')); }
    finally { setCargandoGestion(false); }
  };

  const refrescarGestion = async () => {
    if (!gestion) return;
    const [asignados, libres] = await Promise.all([
      superadminService.empresaUsuarios(gestion.codEmpresa),
      superadminService.empresaUsuariosDisponibles(gestion.codEmpresa),
    ]);
    setUsuariosEmpresa(asignados); setDisponibles(libres);
    setEmpresas(prev => prev.map(e => e.codEmpresa === gestion.codEmpresa
      ? { ...e, totalUsuarios: asignados.filter(u => u.activo).length }
      : e));
  };

  const cambiarRol = async (usuario: UsuarioEmpresa, codRol: number) => {
    if (!gestion) return;
    try {
      const lista = await superadminService.actualizarUsuarioEmpresa(gestion.codEmpresa, usuario.codUsuario, {
        codRol, activo: usuario.activo,
      });
      setUsuariosEmpresa(lista);
      mostrar('ok', `Rol de ${usuario.nombreUsuario} actualizado`);
    } catch (err) { mostrar('error', mensajeError(err, 'No se pudo cambiar el rol')); }
  };

  const alternarEstado = async (usuario: UsuarioEmpresa) => {
    if (!gestion) return;
    try {
      const lista = await superadminService.actualizarUsuarioEmpresa(gestion.codEmpresa, usuario.codUsuario, {
        codRol: usuario.codRol ?? rolesActivos[0]?.codRol ?? 0, activo: !usuario.activo,
      });
      setUsuariosEmpresa(lista);
      mostrar('ok', usuario.activo ? 'Acceso a la empresa desactivado' : 'Acceso a la empresa activado');
    } catch (err) { mostrar('error', mensajeError(err, 'No se pudo cambiar el estado')); }
  };

  const quitarUsuario = async (usuario: UsuarioEmpresa) => {
    if (!gestion) return;
    if (!window.confirm(`¿Quitar a ${usuario.nombreCompleto} de ${gestion.razonSocial}?`)) return;
    try {
      const lista = await superadminService.quitarUsuarioEmpresa(gestion.codEmpresa, usuario.codUsuario);
      await refrescarGestion();
      setUsuariosEmpresa(lista);
      mostrar('ok', 'Usuario quitado de la empresa');
    } catch (err) { mostrar('error', mensajeError(err, 'No se pudo quitar el usuario')); }
  };

  const asignarExistente = async () => {
    if (!gestion) return;
    if (!asignacion.codUsuario) { mostrar('error', 'Seleccione un usuario'); return; }
    if (!asignacion.codRol) { mostrar('error', 'Seleccione un rol'); return; }
    setGuardando(true);
    try {
      const lista = await superadminService.asignarUsuarioEmpresa(gestion.codEmpresa, {
        codUsuario: Number(asignacion.codUsuario), codRol: Number(asignacion.codRol),
      });
      setUsuariosEmpresa(lista);
      await refrescarGestion();
      setAsignacion({ codUsuario: '', codRol: asignacion.codRol });
      setPanelAsignar(false);
      mostrar('ok', 'Usuario asignado a la empresa');
    } catch (err) { mostrar('error', mensajeError(err, 'No se pudo asignar el usuario')); }
    finally { setGuardando(false); }
  };

  const crearUsuarioEnEmpresa = async () => {
    if (!gestion) return;
    if (!nuevoUsuario.nombreUsuario.trim()) { mostrar('error', 'Indique el usuario'); return; }
    if (!nuevoUsuario.nombreCompleto.trim()) { mostrar('error', 'Indique el nombre completo'); return; }
    if ((nuevoUsuario.clave ?? '').length < 6) { mostrar('error', 'La contraseña debe tener al menos 6 caracteres'); return; }
    if (!rolNuevo) { mostrar('error', 'Seleccione un rol'); return; }
    setGuardando(true);
    try {
      await superadminService.crearUsuarioEmpresa(gestion.codEmpresa, {
        usuario: { ...nuevoUsuario, nombreUsuario: nuevoUsuario.nombreUsuario.trim(), nombreCompleto: nuevoUsuario.nombreCompleto.trim(), esSuperadmin: false, activo: true },
        codRol: Number(rolNuevo),
      });
      await refrescarGestion();
      setNuevoUsuario(usuarioVacio);
      setPanelCrear(false);
      mostrar('ok', 'Usuario creado y asignado a la empresa');
    } catch (err) { mostrar('error', mensajeError(err, 'No se pudo crear el usuario')); }
    finally { setGuardando(false); }
  };

  // ── Superadministradores ──────────────────────────────────────────────
  const abrirFormSuper = (u?: UsuarioAdmin) => {
    setVerSuperadmins(false);
    setSuperEdit(u
      ? { codUsuario: u.codUsuario, nombreUsuario: u.nombreUsuario, clave: '', nombreCompleto: u.nombreCompleto ?? '',
          descripcion: u.descripcion ?? '', esSuperadmin: true, activo: u.activo }
      : { ...usuarioVacio, esSuperadmin: true });
  };

  const guardarSuper = async () => {
    if (!superEdit) return;
    const nuevo = !superEdit.codUsuario;
    if (!superEdit.nombreUsuario.trim()) { mostrar('error', 'Indique el usuario'); return; }
    if (!superEdit.nombreCompleto.trim()) { mostrar('error', 'Indique el nombre completo'); return; }
    if (nuevo && (superEdit.clave ?? '').length < 6) { mostrar('error', 'La contraseña debe tener al menos 6 caracteres'); return; }
    if (!nuevo && superEdit.clave && superEdit.clave.length < 6) { mostrar('error', 'La nueva contraseña debe tener al menos 6 caracteres'); return; }
    setGuardando(true);
    try {
      const datos: UsuarioForm = {
        ...superEdit, esSuperadmin: true,
        nombreUsuario: superEdit.nombreUsuario.trim(), nombreCompleto: superEdit.nombreCompleto.trim(),
      };
      if (nuevo) await superadminService.crearUsuario(datos);
      else await superadminService.actualizarUsuario(superEdit.codUsuario!, datos);
      mostrar('ok', nuevo ? 'Superadministrador creado' : 'Superadministrador actualizado');
      setSuperEdit(null);
      await cargar();
      setVerSuperadmins(true);
    } catch (err) { mostrar('error', mensajeError(err, 'No se pudo guardar el superadministrador')); }
    finally { setGuardando(false); }
  };

  if (!listo) return null;

  const editandoAMiMismo = !!superEdit?.codUsuario && superEdit.codUsuario === miId;

  return (
    <div className="min-h-screen bg-gray-100">
      {nodo}
      <AdminHeader>
        <Boton variante="secundario" onClick={() => setVerSuperadmins(true)}>
          <MdShield /> Superadministradores ({superadmins.length})
        </Boton>
        <Boton variante="secundario" onClick={() => router.push('/superadmin/roles')}>
          <MdSettings /> Roles y permisos ({roles.length})
        </Boton>
      </AdminHeader>

      <main className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: COLORES.texto }}>Empresas</h1>
            <p className="text-sm mt-0.5" style={{ color: COLORES.tenue }}>
              Un solo listado. Use <strong>Gestionar</strong> para ver y administrar los usuarios de cada empresa.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-64">
              <MdSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORES.tenue }} />
              <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Filtrar por RUC o razón social…"
                className={`${inputCls} pl-9`} style={inputStyle} />
            </div>
            <Boton onClick={() => setEmpresaEdit({ ...empresaVacia })}><MdAdd size={18} /> Nueva empresa</Boton>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Pastilla texto={`${empresas.length} empresa(s)`} tono="marca" />
          <Pastilla texto={`${empresas.filter(e => e.activo).length} activa(s)`} tono="ok" />
          <Pastilla texto={`${empresas.reduce((n, e) => n + e.totalUsuarios, 0)} usuario(s) asignado(s)`} tono="neutro" />
        </div>

        <Card>
          <Tabla columnas={['RUC', 'Razón social', 'Usuarios', 'Creada', 'Estado', 'Acciones']}
            cargando={cargando} vacio={empresasFiltradas.length === 0}>
            {empresasFiltradas.map(e => (
              <tr key={e.codEmpresa} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td className={`${tdCls} font-mono`}>{e.ruc}</td>
                <td className={`${tdCls} font-semibold`}>
                  <span className="flex items-center gap-2"><MdBusiness size={16} style={{ color: COLORES.brand }} />{e.razonSocial}</span>
                </td>
                <td className={tdCls}>
                  <span className="inline-flex items-center gap-1.5"><MdPeople size={16} style={{ color: COLORES.tenue }} />{e.totalUsuarios}</span>
                </td>
                <td className={tdCls} style={{ color: COLORES.suave }}>{fmtFecha(e.createdAt)}</td>
                <td className={tdCls}><Pastilla texto={e.activo ? 'Activa' : 'Inactiva'} tono={e.activo ? 'ok' : 'neutro'} /></td>
                <td className={tdCls}>
                  <div className="flex flex-wrap gap-2">
                    <Boton pequeno onClick={() => abrirGestion(e)}><MdOutlineAdminPanelSettings /> Gestionar</Boton>
                    <Boton pequeno variante="secundario"
                      onClick={() => setEmpresaEdit({ codEmpresa: e.codEmpresa, ruc: e.ruc, razonSocial: e.razonSocial, activo: e.activo })}>
                      <MdEdit /> Editar
                    </Boton>
                  </div>
                </td>
              </tr>
            ))}
          </Tabla>
        </Card>
      </main>

      {/* ── Modal empresa ── */}
      <ModalBase abierto={!!empresaEdit} onCerrar={() => setEmpresaEdit(null)} ancho="max-w-lg"
        titulo={empresaEdit?.codEmpresa ? 'Editar empresa' : 'Nueva empresa'}
        subtitulo="Al crearla se cargan los campos del asistente de importación de activos"
        pie={<>
          <Boton variante="secundario" onClick={() => setEmpresaEdit(null)}>Cancelar</Boton>
          <Boton onClick={guardarEmpresa} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Boton>
        </>}>
        {empresaEdit && (
          <>
            <Campo etiqueta="RUC" requerido>
              <input value={empresaEdit.ruc} maxLength={11} inputMode="numeric"
                onChange={e => setEmpresaEdit(x => x && ({ ...x, ruc: e.target.value.replace(/\D/g, '') }))}
                className={`${inputCls} font-mono`} style={inputStyle} placeholder="20xxxxxxxxx" autoFocus />
            </Campo>
            <Campo etiqueta="Razón social" requerido>
              <input value={empresaEdit.razonSocial} onChange={e => setEmpresaEdit(x => x && ({ ...x, razonSocial: e.target.value }))}
                className={inputCls} style={inputStyle} maxLength={255} />
            </Campo>
            <label className="flex items-center gap-2 text-sm" style={{ color: COLORES.texto }}>
              <input type="checkbox" checked={empresaEdit.activo} onChange={e => setEmpresaEdit(x => x && ({ ...x, activo: e.target.checked }))} />
              Empresa activa (si se desactiva, sus usuarios ya no la verán al iniciar sesión)
            </label>
          </>
        )}
      </ModalBase>

      {/* ── Modal: gestionar usuarios de la empresa ── */}
      <ModalBase abierto={!!gestion} onCerrar={() => setGestion(null)} ancho="max-w-5xl"
        titulo={gestion ? gestion.razonSocial : ''}
        subtitulo={gestion ? `RUC ${gestion.ruc} · ${usuariosEmpresa.length} usuario(s) · se administran los accesos y roles de esta empresa` : ''}
        pie={<Boton variante="secundario" onClick={() => setGestion(null)}>Cerrar</Boton>}>
        {gestion && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORES.tenue }}>
                Usuarios de la empresa
              </p>
              <div className="flex flex-wrap gap-2">
                <Boton pequeno variante="secundario" onClick={() => { setPanelAsignar(v => !v); setPanelCrear(false); }}>
                  <MdPersonAdd /> Asignar existente
                </Boton>
                <Boton pequeno onClick={() => { setPanelCrear(v => !v); setPanelAsignar(false); }}>
                  <MdAdd /> Crear usuario
                </Boton>
              </div>
            </div>

            {panelAsignar && (
              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#f8fafc', border: `1.5px solid ${COLORES.borde}` }}>
                <p className="text-sm font-semibold" style={{ color: COLORES.texto }}>Asignar un usuario que ya existe</p>
                {disponibles.length === 0
                  ? <p className="text-sm" style={{ color: COLORES.tenue }}>No hay usuarios activos sin asignar a esta empresa.</p>
                  : (
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-2 items-end">
                      <Campo etiqueta="Usuario">
                        <select value={asignacion.codUsuario}
                          onChange={e => setAsignacion(a => ({ ...a, codUsuario: e.target.value ? Number(e.target.value) : '' }))}
                          className={inputCls} style={inputStyle}>
                          <option value="">Seleccione…</option>
                          {disponibles.map(u => <option key={u.codUsuario} value={u.codUsuario}>{u.nombreCompleto} ({u.nombreUsuario})</option>)}
                        </select>
                      </Campo>
                      <Campo etiqueta="Rol">
                        <select value={asignacion.codRol}
                          onChange={e => setAsignacion(a => ({ ...a, codRol: e.target.value ? Number(e.target.value) : '' }))}
                          className={inputCls} style={inputStyle}>
                          <option value="">Seleccione…</option>
                          {rolesActivos.map(r => <option key={r.codRol} value={r.codRol}>{r.nombre}</option>)}
                        </select>
                      </Campo>
                      <Boton onClick={asignarExistente} disabled={guardando}>Asignar</Boton>
                    </div>
                  )}
              </div>
            )}

            {panelCrear && (
              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#f8fafc', border: `1.5px solid ${COLORES.borde}` }}>
                <p className="text-sm font-semibold" style={{ color: COLORES.texto }}>Crear usuario y asignarlo a {gestion.razonSocial}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Campo etiqueta="Usuario" requerido>
                    <input value={nuevoUsuario.nombreUsuario} autoComplete="off"
                      onChange={e => setNuevoUsuario(u => ({ ...u, nombreUsuario: e.target.value }))}
                      className={`${inputCls} font-mono`} style={inputStyle} placeholder="jperez" />
                  </Campo>
                  <Campo etiqueta="Contraseña" requerido>
                    <div className="relative">
                      <MdVpnKey size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORES.tenue }} />
                      <input type="password" value={nuevoUsuario.clave ?? ''} autoComplete="new-password"
                        onChange={e => setNuevoUsuario(u => ({ ...u, clave: e.target.value }))}
                        className={`${inputCls} pl-9`} style={inputStyle} placeholder="Mínimo 6 caracteres" />
                    </div>
                  </Campo>
                  <Campo etiqueta="Nombre completo" requerido>
                    <input value={nuevoUsuario.nombreCompleto}
                      onChange={e => setNuevoUsuario(u => ({ ...u, nombreCompleto: e.target.value }))}
                      className={inputCls} style={inputStyle} />
                  </Campo>
                  <Campo etiqueta="Cargo / descripción">
                    <input value={nuevoUsuario.descripcion ?? ''}
                      onChange={e => setNuevoUsuario(u => ({ ...u, descripcion: e.target.value }))}
                      className={inputCls} style={inputStyle} />
                  </Campo>
                  <Campo etiqueta="Rol en la empresa" requerido>
                    <select value={rolNuevo} onChange={e => setRolNuevo(e.target.value ? Number(e.target.value) : '')}
                      className={inputCls} style={inputStyle}>
                      <option value="">Seleccione…</option>
                      {rolesActivos.map(r => <option key={r.codRol} value={r.codRol}>{r.nombre}</option>)}
                    </select>
                  </Campo>
                </div>
                <div className="flex justify-end gap-2">
                  <Boton pequeno variante="secundario" onClick={() => setPanelCrear(false)}>Cancelar</Boton>
                  <Boton pequeno onClick={crearUsuarioEnEmpresa} disabled={guardando}>
                    {guardando ? 'Creando…' : 'Crear y asignar'}
                  </Boton>
                </div>
              </div>
            )}

            <Tabla columnas={['Usuario', 'Nombre', 'Rol', 'Acceso', '']} cargando={cargandoGestion} vacio={usuariosEmpresa.length === 0}>
              {usuariosEmpresa.map(u => (
                <tr key={u.codUsuario} style={{ borderBottom: '1px solid #f8fafc', opacity: u.usuarioActivo ? 1 : 0.55 }}>
                  <td className={tdCls}>
                    <span className="font-mono font-semibold">{u.nombreUsuario}</span>
                    {!u.usuarioActivo && <span className="ml-2"><Pastilla texto="Inactivo" tono="neutro" /></span>}
                  </td>
                  <td className={tdCls}>
                    {u.nombreCompleto}
                    {u.descripcion && <p className="text-xs" style={{ color: COLORES.tenue }}>{u.descripcion}</p>}
                  </td>
                  <td className={tdCls}>
                    <select value={u.codRol ?? ''} aria-label={`Rol de ${u.nombreUsuario}`}
                      onChange={e => cambiarRol(u, Number(e.target.value))}
                      className="w-44 px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                      {!u.codRol && <option value="">{u.rol || 'Sin rol'}</option>}
                      {roles.map(r => <option key={r.codRol} value={r.codRol}>{r.nombre}{r.activo ? '' : ' (inactivo)'}</option>)}
                    </select>
                  </td>
                  <td className={tdCls}>
                    <div className="flex flex-col gap-1">
                      <Pastilla texto={u.activo ? 'Habilitado' : 'Deshabilitado'} tono={u.activo ? 'ok' : 'error'} />
                      <button onClick={() => alternarEstado(u)} className="text-xs font-semibold text-left"
                        style={{ color: u.activo ? '#b45309' : '#0f9b76' }}>
                        {u.activo ? 'Deshabilitar acceso' : 'Habilitar acceso'}
                      </button>
                    </div>
                  </td>
                  <td className={tdCls}>
                    <Boton pequeno variante="peligro" onClick={() => quitarUsuario(u)} title="Quitar de la empresa">
                      <MdDeleteOutline /> Quitar
                    </Boton>
                  </td>
                </tr>
              ))}
            </Tabla>
          </>
        )}
      </ModalBase>

      {/* ── Modal: superadministradores ── */}
      <ModalBase abierto={verSuperadmins} onCerrar={() => setVerSuperadmins(false)} ancho="max-w-3xl"
        titulo="Superadministradores"
        subtitulo="Cuentas globales: administran todas las empresas y no entran a ninguna"
        pie={<>
          <Boton variante="secundario" onClick={() => setVerSuperadmins(false)}>Cerrar</Boton>
          <Boton onClick={() => abrirFormSuper()}><MdAdd /> Nuevo superadministrador</Boton>
        </>}>
        <Tabla columnas={['Usuario', 'Nombre', 'Estado', '']} cargando={cargando} vacio={superadmins.length === 0}>
          {superadmins.map(u => (
            <tr key={u.codUsuario} style={{ borderBottom: '1px solid #f8fafc' }}>
              <td className={tdCls}><span className="font-mono font-semibold">{u.nombreUsuario}</span></td>
              <td className={tdCls}>{u.nombreCompleto}<p className="text-xs" style={{ color: COLORES.tenue }}>{u.descripcion}</p></td>
              <td className={tdCls}><Pastilla texto={u.activo ? 'Activo' : 'Inactivo'} tono={u.activo ? 'ok' : 'neutro'} /></td>
              <td className={tdCls}>
                <Boton pequeno variante="secundario" onClick={() => abrirFormSuper(u)}><MdEdit /> Editar</Boton>
              </td>
            </tr>
          ))}
        </Tabla>
      </ModalBase>

      {/* ── Modal: alta/edición de superadministrador ── */}
      <ModalBase abierto={!!superEdit} onCerrar={() => setSuperEdit(null)} ancho="max-w-2xl"
        titulo={superEdit?.codUsuario ? `Editar ${superEdit.nombreUsuario}` : 'Nuevo superadministrador'}
        subtitulo="Solo administra empresas, usuarios, roles y permisos"
        pie={<>
          <Boton variante="secundario" onClick={() => { setSuperEdit(null); setVerSuperadmins(true); }}>Cancelar</Boton>
          <Boton onClick={guardarSuper} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Boton>
        </>}>
        {superEdit && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Campo etiqueta="Usuario" requerido>
                <input value={superEdit.nombreUsuario} autoComplete="off"
                  onChange={e => setSuperEdit(x => x && ({ ...x, nombreUsuario: e.target.value }))}
                  className={`${inputCls} font-mono`} style={inputStyle} placeholder="jperez" />
              </Campo>
              <Campo etiqueta={superEdit.codUsuario ? 'Nueva contraseña (opcional)' : 'Contraseña'} requerido={!superEdit.codUsuario}>
                <div className="relative">
                  <MdVpnKey size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORES.tenue }} />
                  <input type="password" value={superEdit.clave ?? ''} autoComplete="new-password"
                    onChange={e => setSuperEdit(x => x && ({ ...x, clave: e.target.value }))}
                    className={`${inputCls} pl-9`} style={inputStyle}
                    placeholder={superEdit.codUsuario ? 'Dejar vacío para no cambiarla' : 'Mínimo 6 caracteres'} />
                </div>
              </Campo>
              <Campo etiqueta="Nombre completo" requerido>
                <input value={superEdit.nombreCompleto}
                  onChange={e => setSuperEdit(x => x && ({ ...x, nombreCompleto: e.target.value }))}
                  className={inputCls} style={inputStyle} />
              </Campo>
              <Campo etiqueta="Cargo / descripción">
                <input value={superEdit.descripcion ?? ''}
                  onChange={e => setSuperEdit(x => x && ({ ...x, descripcion: e.target.value }))}
                  className={inputCls} style={inputStyle} />
              </Campo>
            </div>
            <label className="flex items-center gap-2 text-sm" style={{ color: COLORES.texto }}
              title={editandoAMiMismo ? 'No puede desactivarse a sí mismo' : ''}>
              <input type="checkbox" checked={superEdit.activo} disabled={editandoAMiMismo}
                onChange={e => setSuperEdit(x => x && ({ ...x, activo: e.target.checked }))} /> Usuario activo
            </label>
            <p className="text-xs p-3 rounded-xl" style={{ backgroundColor: 'rgba(30,71,134,0.05)', color: COLORES.suave }}>
              <MdInfo className="inline mr-1" size={14} />
              El superadministrador no se asigna a empresas: solo administra empresas, usuarios y roles.
            </p>
          </>
        )}
      </ModalBase>
    </div>
  );
}
