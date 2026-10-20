'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  MdBusiness, MdPeople, MdAdd, MdEdit, MdLogout, MdSearch, MdShield, MdVpnKey,
} from 'react-icons/md';
import { Card, Boton, Campo, ModalBase, Tabla, tdCls, Pastilla, inputCls, inputStyle, useAviso, COLORES } from '@/app/components/rfid/ui';
import { authService } from '@/app/services/auth.service';
import {
  superadminService, EmpresaAdmin, UsuarioAdmin, UsuarioForm, RolEmpresa, ROLES_EMPRESA,
} from '@/app/services/superadmin.service';
import { fmtFecha, mensajeError } from '@/app/utils/exportar';

type Pestana = 'empresas' | 'usuarios';

const empresaVacia = { ruc: '', razonSocial: '', activo: true };
const usuarioVacio: UsuarioForm = { nombreUsuario: '', clave: '', nombreCompleto: '', descripcion: '', esSuperadmin: false, activo: true };

export default function SuperAdminPage() {
  const router = useRouter();
  const { mostrar, nodo } = useAviso();
  const [listo, setListo] = useState(false);
  const [miId, setMiId] = useState<number | undefined>();
  const [pestana, setPestana] = useState<Pestana>('empresas');
  const [empresas, setEmpresas] = useState<EmpresaAdmin[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');

  // Empresa en edición (null = cerrado, codEmpresa undefined = nueva)
  const [empresaEdit, setEmpresaEdit] = useState<{ codEmpresa?: number; ruc: string; razonSocial: string; activo: boolean } | null>(null);
  // Usuario en edición
  const [usuarioEdit, setUsuarioEdit] = useState<(UsuarioForm & { codUsuario?: number }) | null>(null);
  const [asignaciones, setAsignaciones] = useState<Record<number, RolEmpresa>>({});
  const [guardando, setGuardando] = useState(false);

  // Solo superadministradores
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
      const [e, u] = await Promise.all([superadminService.empresas(), superadminService.usuarios()]);
      setEmpresas(e); setUsuarios(u);
    } catch (err) { mostrar('error', mensajeError(err, 'No se pudo cargar la información')); }
    finally { setCargando(false); }
  }, [mostrar]);

  useEffect(() => { if (listo) cargar(); }, [listo, cargar]);

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

  // ── Usuarios ──────────────────────────────────────────────────────────
  const abrirUsuario = (u?: UsuarioAdmin) => {
    if (u) {
      setUsuarioEdit({
        codUsuario: u.codUsuario, nombreUsuario: u.nombreUsuario, clave: '', nombreCompleto: u.nombreCompleto ?? '',
        descripcion: u.descripcion ?? '', esSuperadmin: u.esSuperadmin, activo: u.activo,
      });
      setAsignaciones(Object.fromEntries(u.empresas.map(a => [a.codEmpresa, a.rol === 'AUDITOR' ? 'AUDITOR' : 'ADMIN'])));
    } else {
      setUsuarioEdit({ ...usuarioVacio });
      setAsignaciones({});
    }
  };

  const guardarUsuario = async () => {
    if (!usuarioEdit) return;
    const nuevo = !usuarioEdit.codUsuario;
    if (!usuarioEdit.nombreUsuario.trim()) { mostrar('error', 'Indique el usuario'); return; }
    if (!usuarioEdit.nombreCompleto.trim()) { mostrar('error', 'Indique el nombre completo'); return; }
    if (nuevo && (usuarioEdit.clave ?? '').length < 6) { mostrar('error', 'La contraseña debe tener al menos 6 caracteres'); return; }
    if (!nuevo && usuarioEdit.clave && usuarioEdit.clave.length < 6) { mostrar('error', 'La nueva contraseña debe tener al menos 6 caracteres'); return; }
    setGuardando(true);
    try {
      const datos: UsuarioForm = { ...usuarioEdit, nombreUsuario: usuarioEdit.nombreUsuario.trim(), nombreCompleto: usuarioEdit.nombreCompleto.trim() };
      const u = nuevo
        ? await superadminService.crearUsuario(datos)
        : await superadminService.actualizarUsuario(usuarioEdit.codUsuario!, datos);
      await superadminService.asignarEmpresas(u.codUsuario, datos.esSuperadmin ? []
        : Object.entries(asignaciones).map(([codEmpresa, rol]) => ({ codEmpresa: Number(codEmpresa), rol })));
      mostrar('ok', nuevo ? `Usuario ${u.nombreUsuario} creado` : 'Usuario actualizado');
      setUsuarioEdit(null);
      await cargar();
    } catch (err) { mostrar('error', mensajeError(err, 'No se pudo guardar el usuario')); }
    finally { setGuardando(false); }
  };

  const alternarEmpresa = (codEmpresa: number) => setAsignaciones(a => {
    const c = { ...a };
    if (c[codEmpresa]) delete c[codEmpresa]; else c[codEmpresa] = 'ADMIN';
    return c;
  });

  const empresasFiltradas = useMemo(() => {
    const t = filtro.trim().toLowerCase();
    return t ? empresas.filter(e => e.razonSocial.toLowerCase().includes(t) || e.ruc.includes(t)) : empresas;
  }, [empresas, filtro]);

  const usuariosFiltrados = useMemo(() => {
    const t = filtro.trim().toLowerCase();
    return t ? usuarios.filter(u => [u.nombreUsuario, u.nombreCompleto, ...u.empresas.map(e => e.razonSocial)]
      .some(v => (v ?? '').toLowerCase().includes(t))) : usuarios;
  }, [usuarios, filtro]);

  if (!listo) return null;

  const editandoAMiMismo = !!usuarioEdit?.codUsuario && usuarioEdit.codUsuario === miId;

  return (
    <div className="min-h-screen bg-gray-100">
      {nodo}
      <header className="flex flex-wrap items-center justify-between gap-3 px-8 py-4" style={{ backgroundColor: '#002a55' }}>
        <div className="flex items-center gap-4">
          <Image src="/db2.png" alt="data_business" width={120} height={44} style={{ objectFit: 'contain' }} priority />
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
            style={{ backgroundColor: 'rgba(34,196,161,0.15)', color: '#22c4a1' }}>
            <MdShield size={14} /> SUPERADMINISTRADOR
          </span>
        </div>
        <div className="flex gap-2">
          <Boton variante="peligro" onClick={() => authService.logout()}><MdLogout /> Salir</Boton>
        </div>
      </header>

      <main className="p-8 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: COLORES.texto }}>Administración del sistema</h1>
          <p className="text-sm mt-0.5" style={{ color: COLORES.tenue }}>Empresas, usuarios y a qué empresas entra cada usuario</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: '#e2e8f0' }}>
            {([['empresas', 'Empresas', <MdBusiness key="e" />, empresas.length], ['usuarios', 'Usuarios', <MdPeople key="u" />, usuarios.length]] as const)
              .map(([clave, texto, icono, n]) => (
                <button key={clave} onClick={() => { setPestana(clave); setFiltro(''); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: pestana === clave ? '#fff' : 'transparent', color: pestana === clave ? COLORES.brand : COLORES.suave }}>
                  {icono} {texto} ({n})
                </button>
              ))}
          </div>
          <div className="flex gap-2">
            <div className="relative w-64">
              <MdSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORES.tenue }} />
              <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Filtrar…" className={`${inputCls} pl-9`} style={inputStyle} />
            </div>
            {pestana === 'empresas'
              ? <Boton onClick={() => setEmpresaEdit({ ...empresaVacia })}><MdAdd size={18} /> Nueva empresa</Boton>
              : <Boton onClick={() => abrirUsuario()}><MdAdd size={18} /> Nuevo usuario</Boton>}
          </div>
        </div>

        {pestana === 'empresas' ? (
          <Card>
            <Tabla columnas={['RUC', 'Razón social', 'Usuarios', 'Creada', 'Estado', '']} cargando={cargando} vacio={empresasFiltradas.length === 0}>
              {empresasFiltradas.map(e => (
                <tr key={e.codEmpresa} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td className={`${tdCls} font-mono`}>{e.ruc}</td>
                  <td className={`${tdCls} font-semibold`}>{e.razonSocial}</td>
                  <td className={tdCls}>{e.totalUsuarios}</td>
                  <td className={tdCls} style={{ color: COLORES.suave }}>{fmtFecha(e.createdAt)}</td>
                  <td className={tdCls}><Pastilla texto={e.activo ? 'Activa' : 'Inactiva'} tono={e.activo ? 'ok' : 'neutro'} /></td>
                  <td className={tdCls}>
                    <Boton pequeno variante="secundario" onClick={() => setEmpresaEdit({ codEmpresa: e.codEmpresa, ruc: e.ruc, razonSocial: e.razonSocial, activo: e.activo })}>
                      <MdEdit /> Editar
                    </Boton>
                  </td>
                </tr>
              ))}
            </Tabla>
          </Card>
        ) : (
          <Card>
            <Tabla columnas={['Usuario', 'Nombre', 'Empresas asignadas', 'Estado', '']} cargando={cargando} vacio={usuariosFiltrados.length === 0}>
              {usuariosFiltrados.map(u => (
                <tr key={u.codUsuario} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td className={tdCls}>
                    <span className="font-mono font-semibold">{u.nombreUsuario}</span>
                    {u.esSuperadmin && <span className="ml-2"><Pastilla texto="Superadmin" tono="marca" /></span>}
                  </td>
                  <td className={tdCls}>{u.nombreCompleto}<p className="text-xs" style={{ color: COLORES.tenue }}>{u.descripcion}</p></td>
                  <td className={tdCls}>
                    {u.esSuperadmin
                      ? <span className="text-xs" style={{ color: COLORES.suave }}>No aplica (solo administra)</span>
                      : u.empresas.length === 0
                        ? <span className="text-xs" style={{ color: '#f59e0b' }}>Sin empresas: no podrá entrar</span>
                        : <div className="flex flex-wrap gap-1">{u.empresas.map(a => (
                            <Pastilla key={a.codEmpresa} texto={`${a.razonSocial} · ${a.rol === 'AUDITOR' ? 'Auditor' : 'Admin'}`} tono={a.empresaActiva ? 'neutro' : 'error'} />
                          ))}</div>}
                  </td>
                  <td className={tdCls}><Pastilla texto={u.activo ? 'Activo' : 'Inactivo'} tono={u.activo ? 'ok' : 'neutro'} /></td>
                  <td className={tdCls}><Boton pequeno variante="secundario" onClick={() => abrirUsuario(u)}><MdEdit /> Editar</Boton></td>
                </tr>
              ))}
            </Tabla>
          </Card>
        )}
      </main>

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

      <ModalBase abierto={!!usuarioEdit} onCerrar={() => setUsuarioEdit(null)} ancho="max-w-3xl"
        titulo={usuarioEdit?.codUsuario ? `Editar usuario ${usuarioEdit.nombreUsuario}` : 'Nuevo usuario'}
        subtitulo="Datos de acceso y empresas a las que puede entrar"
        pie={<>
          <Boton variante="secundario" onClick={() => setUsuarioEdit(null)}>Cancelar</Boton>
          <Boton onClick={guardarUsuario} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Boton>
        </>}>
        {usuarioEdit && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Campo etiqueta="Usuario" requerido>
                <input value={usuarioEdit.nombreUsuario} onChange={e => setUsuarioEdit(x => x && ({ ...x, nombreUsuario: e.target.value }))}
                  className={`${inputCls} font-mono`} style={inputStyle} placeholder="jperez" autoComplete="off" />
              </Campo>
              <Campo etiqueta={usuarioEdit.codUsuario ? 'Nueva contraseña (opcional)' : 'Contraseña'} requerido={!usuarioEdit.codUsuario}>
                <div className="relative">
                  <MdVpnKey size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORES.tenue }} />
                  <input type="password" value={usuarioEdit.clave ?? ''} autoComplete="new-password"
                    onChange={e => setUsuarioEdit(x => x && ({ ...x, clave: e.target.value }))}
                    className={`${inputCls} pl-9`} style={inputStyle} placeholder={usuarioEdit.codUsuario ? 'Dejar vacío para no cambiarla' : 'Mínimo 6 caracteres'} />
                </div>
              </Campo>
              <Campo etiqueta="Nombre completo" requerido>
                <input value={usuarioEdit.nombreCompleto} onChange={e => setUsuarioEdit(x => x && ({ ...x, nombreCompleto: e.target.value }))}
                  className={inputCls} style={inputStyle} />
              </Campo>
              <Campo etiqueta="Cargo / descripción">
                <input value={usuarioEdit.descripcion ?? ''} onChange={e => setUsuarioEdit(x => x && ({ ...x, descripcion: e.target.value }))}
                  className={inputCls} style={inputStyle} />
              </Campo>
            </div>
            <div className="flex flex-wrap gap-6 text-sm" style={{ color: COLORES.texto }}>
              <label className="flex items-center gap-2" title={editandoAMiMismo ? 'No puede desactivarse a sí mismo' : ''}>
                <input type="checkbox" checked={usuarioEdit.activo} disabled={editandoAMiMismo}
                  onChange={e => setUsuarioEdit(x => x && ({ ...x, activo: e.target.checked }))} /> Usuario activo
              </label>
              <label className="flex items-center gap-2" title={editandoAMiMismo ? 'No puede quitarse su propio rol' : ''}>
                <input type="checkbox" checked={usuarioEdit.esSuperadmin} disabled={editandoAMiMismo}
                  onChange={e => setUsuarioEdit(x => x && ({ ...x, esSuperadmin: e.target.checked }))} /> Superadministrador
              </label>
            </div>

            {usuarioEdit.esSuperadmin ? (
              <p className="text-sm p-3 rounded-xl" style={{ backgroundColor: 'rgba(30,71,134,0.05)', color: COLORES.suave }}>
                El superadministrador no entra a ninguna empresa: solo administra empresas y usuarios.
              </p>
            ) : (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORES.tenue }}>
                Empresas asignadas ({Object.keys(asignaciones).length})
              </p>
              <div className="rounded-xl overflow-hidden" style={{ border: `1.5px solid ${COLORES.borde}` }}>
                {empresas.length === 0 && <p className="p-4 text-sm" style={{ color: COLORES.tenue }}>Primero cree una empresa.</p>}
                {empresas.map(e => {
                  const rol = asignaciones[e.codEmpresa];
                  return (
                    <div key={e.codEmpresa} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5"
                      style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: rol ? 'rgba(34,196,161,0.04)' : 'transparent' }}>
                      <label className="flex items-center gap-3 text-sm cursor-pointer flex-1">
                        <input type="checkbox" checked={!!rol} onChange={() => alternarEmpresa(e.codEmpresa)} />
                        <span>
                          <span className="font-semibold">{e.razonSocial}</span>
                          <span className="ml-2 font-mono text-xs" style={{ color: COLORES.tenue }}>{e.ruc}</span>
                          {!e.activo && <span className="ml-2"><Pastilla texto="Inactiva" tono="neutro" /></span>}
                        </span>
                      </label>
                      {rol && (
                        // select nativo: el desplegable propio quedaba recortado dentro de la lista
                        <select value={rol} aria-label={`Rol en ${e.razonSocial}`}
                          onChange={ev => setAsignaciones(a => ({ ...a, [e.codEmpresa]: ev.target.value as RolEmpresa }))}
                          className="w-44 px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                          {ROLES_EMPRESA.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            )}
          </>
        )}
      </ModalBase>
    </div>
  );
}
