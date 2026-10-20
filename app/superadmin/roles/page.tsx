'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MdAdd, MdCheck, MdDeleteOutline, MdEdit, MdLock, MdSave, MdSettings,
} from 'react-icons/md';
import {
  Card, Boton, Campo, ModalBase, Pastilla, inputCls, inputStyle, useAviso, COLORES,
} from '@/app/components/rfid/ui';
import AdminHeader from '../components/AdminHeader';
import { authService } from '@/app/services/auth.service';
import { superadminService, RolAdmin, PermisoAdmin } from '@/app/services/superadmin.service';
import { mensajeError } from '@/app/utils/exportar';

const NOMBRES_MODULO: Record<string, string> = {
  dashboard: 'Dashboard',
  activos: 'Activos',
  cargas: 'Cargas',
  configuracion: 'Configuración organizacional',
  responsables: 'Custodios',
  inventariadores: 'Inventariadores',
  rfid: 'RFID',
  transferencias: 'Transferencias',
  bajas: 'Bajas',
  busqueda: 'Búsqueda',
  reportes: 'Reportes',
  mantenedores: 'Mantenedores',
};

const ACCIONES: { valor: string; label: string }[] = [
  { valor: 'ver', label: 'Ver' },
  { valor: 'crear', label: 'Crear' },
  { valor: 'editar', label: 'Editar' },
  { valor: 'eliminar', label: 'Eliminar' },
];

export default function RolesPermisosPage() {
  const router = useRouter();
  const { mostrar, nodo } = useAviso();
  const [listo, setListo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [roles, setRoles] = useState<RolAdmin[]>([]);
  const [permisos, setPermisos] = useState<PermisoAdmin[]>([]);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());

  const [nuevoRol, setNuevoRol] = useState<{ nombre: string; descripcion: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const u = authService.getUserData();
      if (!u?.authHeader) { router.replace('/login'); return; }
      if (!u.esSuperadmin) { router.replace('/select-company'); return; }
      setListo(true);
    }, 0);
    return () => clearTimeout(t);
  }, [router]);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [r, p] = await Promise.all([superadminService.roles(), superadminService.permisos()]);
      setRoles(r); setPermisos(p);
      setSeleccionado(prev => prev ?? r[0]?.codRol ?? null);
    } catch (err) { mostrar('error', mensajeError(err, 'No se pudieron cargar los roles')); }
    finally { setCargando(false); }
  }, [mostrar]);

  useEffect(() => { if (listo) cargar(); }, [listo, cargar]);

  const rol = useMemo(() => roles.find(r => r.codRol === seleccionado) ?? null, [roles, seleccionado]);

  useEffect(() => {
    if (!rol) return;
    setNombre(rol.nombre);
    setDescripcion(rol.descripcion ?? '');
    setActivo(rol.activo);
    setMarcados(new Set(rol.permisos));
  }, [rol]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, PermisoAdmin[]>();
    for (const p of permisos) {
      if (!mapa.has(p.modulo)) mapa.set(p.modulo, []);
      mapa.get(p.modulo)!.push(p);
    }
    return [...mapa.entries()]
      .map(([modulo, lista]) => ({ modulo, lista: lista.sort((a, b) => a.orden - b.orden) }))
      .sort((a, b) => (a.lista[0]?.orden ?? 0) - (b.lista[0]?.orden ?? 0));
  }, [permisos]);

  const alternar = (codigo: string) => setMarcados(prev => {
    const s = new Set(prev);
    if (s.has(codigo)) s.delete(codigo); else s.add(codigo);
    return s;
  });

  const descartar = () => {
    if (!rol) return;
    setNombre(rol.nombre);
    setDescripcion(rol.descripcion ?? '');
    setActivo(rol.activo);
    setMarcados(new Set(rol.permisos));
  };

  const guardar = async () => {
    if (!rol) return;
    if (!nombre.trim()) { mostrar('error', 'Indique el nombre del rol'); return; }
    setGuardando(true);
    try {
      await superadminService.actualizarRol(rol.codRol, {
        nombre: nombre.trim(), descripcion: descripcion.trim(), activo,
      });
      await superadminService.actualizarPermisosRol(rol.codRol, [...marcados]);
      await cargar();
      mostrar('ok', 'Rol y permisos guardados');
    } catch (err) { mostrar('error', mensajeError(err, 'No se pudo guardar el rol')); }
    finally { setGuardando(false); }
  };

  const crear = async () => {
    if (!nuevoRol) return;
    if (!nuevoRol.nombre.trim()) { mostrar('error', 'Indique el nombre del rol'); return; }
    setGuardando(true);
    try {
      const creado = await superadminService.crearRol({
        nombre: nuevoRol.nombre.trim(), descripcion: nuevoRol.descripcion.trim(), activo: true,
      });
      setNuevoRol(null);
      await cargar();
      setSeleccionado(creado.codRol);
      mostrar('ok', `Rol ${creado.nombre} creado. Marque sus permisos y guarde.`);
    } catch (err) { mostrar('error', mensajeError(err, 'No se pudo crear el rol')); }
    finally { setGuardando(false); }
  };

  const eliminar = async () => {
    if (!rol) return;
    if (!window.confirm(`¿Eliminar el rol ${rol.nombre}? Esta acción no se puede deshacer.`)) return;
    setGuardando(true);
    try {
      await superadminService.eliminarRol(rol.codRol);
      setSeleccionado(null);
      await cargar();
      mostrar('ok', 'Rol eliminado');
    } catch (err) { mostrar('error', mensajeError(err, 'No se pudo eliminar el rol')); }
    finally { setGuardando(false); }
  };

  if (!listo) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {nodo}
      <AdminHeader volver={{ href: '/superadmin', texto: 'Empresas' }} />

      <main className="p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: COLORES.texto }}>
            <MdSettings /> Roles y permisos
          </h1>
          <p className="text-sm mt-0.5" style={{ color: COLORES.tenue }}>
            Catálogo global. Cada permiso es un módulo + una acción; el rol se asigna a cada usuario dentro de cada empresa.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
          {/* Lista de roles */}
          <Card>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1.5px solid ${COLORES.borde}` }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORES.tenue }}>
                Roles ({roles.length})
              </p>
              <Boton pequeno onClick={() => setNuevoRol({ nombre: '', descripcion: '' })}><MdAdd /> Nuevo</Boton>
            </div>
            <div className="p-2">
              {cargando && <p className="p-4 text-sm" style={{ color: COLORES.tenue }}>Cargando…</p>}
              {!cargando && roles.map(r => {
                const activoRol = r.codRol === seleccionado;
                return (
                  <button key={r.codRol} onClick={() => setSeleccionado(r.codRol)}
                    className="w-full text-left px-3 py-3 rounded-xl mb-1 transition-all"
                    style={{
                      backgroundColor: activoRol ? 'rgba(30,71,134,0.08)' : 'transparent',
                      border: `1.5px solid ${activoRol ? 'rgba(30,71,134,0.25)' : 'transparent'}`,
                    }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm flex items-center gap-1.5" style={{ color: COLORES.texto }}>
                        {r.esSistema && <MdLock size={13} style={{ color: COLORES.tenue }} />}
                        {r.nombre}
                      </span>
                      {!r.activo && <Pastilla texto="Inactivo" tono="neutro" />}
                    </div>
                    <p className="text-xs mt-1" style={{ color: COLORES.tenue }}>{r.descripcion || 'Sin descripción'}</p>
                    <p className="text-xs mt-1" style={{ color: COLORES.suave }}>
                      {r.permisos.length} permiso(s) · {r.totalUsuarios} usuario(s)
                    </p>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Detalle y matriz de permisos */}
          <Card>
            {!rol ? (
              <p className="p-8 text-center text-sm" style={{ color: COLORES.tenue }}>Seleccione un rol de la izquierda.</p>
            ) : (
              <div className="p-5 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold" style={{ color: COLORES.texto }}>{rol.nombre}</h2>
                    {rol.esSistema
                      ? <Pastilla texto="Rol del sistema" tono="marca" />
                      : <Pastilla texto="Personalizado" tono="neutro" />}
                  </div>
                  {!rol.esSistema && (
                    <Boton pequeno variante="peligro" onClick={eliminar} disabled={guardando}>
                      <MdDeleteOutline /> Eliminar rol
                    </Boton>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Campo etiqueta="Nombre" requerido>
                    <input value={nombre} disabled={rol.esSistema}
                      onChange={e => setNombre(e.target.value.toUpperCase())}
                      className={`${inputCls} font-mono`} style={{ ...inputStyle, backgroundColor: rol.esSistema ? '#f8fafc' : '#fff' }}
                      maxLength={50} />
                  </Campo>
                  <Campo etiqueta="Descripción">
                    <input value={descripcion} onChange={e => setDescripcion(e.target.value)}
                      className={inputCls} style={inputStyle} maxLength={255} placeholder="Para qué sirve este rol" />
                  </Campo>
                </div>

                <label className="flex items-center gap-2 text-sm" style={{ color: COLORES.texto }}>
                  <input type="checkbox" checked={activo} disabled={rol.esSistema}
                    onChange={e => setActivo(e.target.checked)} />
                  Rol activo (si se desactiva, sus usuarios pierden los permisos de este rol)
                </label>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORES.tenue }}>
                    Permisos ({marcados.size} de {permisos.length})
                  </p>
                  <div className="flex gap-2">
                    <Boton pequeno variante="secundario" onClick={() => setMarcados(new Set(permisos.map(p => p.codigo)))}>
                      <MdCheck /> Marcar todo
                    </Boton>
                    <Boton pequeno variante="secundario" onClick={() => setMarcados(new Set())}>Limpiar</Boton>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl" style={{ border: `1.5px solid ${COLORES.borde}` }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: '#fafafa', borderBottom: `1.5px solid ${COLORES.borde}` }}>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: COLORES.tenue }}>Módulo</th>
                        {ACCIONES.map(a => (
                          <th key={a.valor} className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: COLORES.tenue }}>
                            {a.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {grupos.map(({ modulo, lista }) => (
                        <tr key={modulo} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td className="px-4 py-2.5 text-sm font-semibold" style={{ color: COLORES.texto }}>
                            {NOMBRES_MODULO[modulo] ?? modulo}
                          </td>
                          {ACCIONES.map(a => {
                            const permiso = lista.find(p => p.accion === a.valor);
                            if (!permiso) return <td key={a.valor} className="px-4 py-2.5 text-center text-xs" style={{ color: '#cbd5e1' }}>—</td>;
                            return (
                              <td key={a.valor} className="px-4 py-2.5 text-center">
                                <input type="checkbox" checked={marcados.has(permiso.codigo)}
                                  onChange={() => alternar(permiso.codigo)}
                                  title={`${permiso.codigo}${permiso.descripcion ? ' · ' + permiso.descripcion : ''}`}
                                  className="w-4 h-4 cursor-pointer" style={{ accentColor: COLORES.brand }} />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap justify-end gap-2 pt-1">
                  <Boton variante="secundario" onClick={descartar} disabled={guardando}>
                    <MdEdit /> Descartar cambios
                  </Boton>
                  <Boton onClick={guardar} disabled={guardando}>
                    <MdSave /> {guardando ? 'Guardando…' : 'Guardar rol y permisos'}
                  </Boton>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* Nuevo rol */}
      <ModalBase abierto={!!nuevoRol} onCerrar={() => setNuevoRol(null)} ancho="max-w-lg"
        titulo="Nuevo rol"
        subtitulo="Después de crearlo, marque los módulos y acciones que puede usar"
        pie={<>
          <Boton variante="secundario" onClick={() => setNuevoRol(null)}>Cancelar</Boton>
          <Boton onClick={crear} disabled={guardando}>{guardando ? 'Creando…' : 'Crear rol'}</Boton>
        </>}>
        {nuevoRol && (
          <>
            <Campo etiqueta="Nombre" requerido>
              <input value={nuevoRol.nombre} autoFocus
                onChange={e => setNuevoRol(r => r && ({ ...r, nombre: e.target.value.toUpperCase() }))}
                className={`${inputCls} font-mono`} style={inputStyle} maxLength={50} placeholder="SUPERVISOR" />
            </Campo>
            <Campo etiqueta="Descripción">
              <input value={nuevoRol.descripcion}
                onChange={e => setNuevoRol(r => r && ({ ...r, descripcion: e.target.value }))}
                className={inputCls} style={inputStyle} maxLength={255} placeholder="Qué puede hacer este rol" />
            </Campo>
            <p className="text-xs" style={{ color: COLORES.tenue }}>
              Los roles del sistema (ADMIN y AUDITOR) no se pueden eliminar; sus permisos sí se pueden ajustar.
            </p>
          </>
        )}
      </ModalBase>
    </div>
  );
}
