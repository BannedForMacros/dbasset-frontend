'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '../services/auth.service';

/** Ruta -> permiso necesario. Se evalúa del prefijo más largo al más corto. */
const RUTAS: { prefijo: string; permiso: string }[] = [
  { prefijo: '/dashboard/activos', permiso: 'activos.ver' },
  { prefijo: '/dashboard/cargas', permiso: 'cargas.ver' },
  { prefijo: '/dashboard/config-organizacional', permiso: 'configuracion.ver' },
  { prefijo: '/dashboard/responsables', permiso: 'responsables.ver' },
  { prefijo: '/dashboard/inventariador', permiso: 'inventariadores.ver' },
  { prefijo: '/dashboard/rfid', permiso: 'rfid.ver' },
  { prefijo: '/dashboard/transferencias', permiso: 'transferencias.ver' },
  { prefijo: '/dashboard/bajas', permiso: 'bajas.ver' },
  { prefijo: '/dashboard/busqueda', permiso: 'busqueda.ver' },
  { prefijo: '/dashboard/reportes', permiso: 'reportes.ver' },
  { prefijo: '/dashboard/colores', permiso: 'mantenedores.ver' },
  { prefijo: '/dashboard/marcas', permiso: 'mantenedores.ver' },
  { prefijo: '/dashboard/estados', permiso: 'mantenedores.ver' },
];

/**
 * Si el rol del usuario en la empresa actual no tiene el permiso del módulo,
 * lo devuelve al panel principal. El backend valida lo mismo en cada endpoint.
 */
export default function PermisoRutaGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      if (!pathname || !authService.isAuthenticated()) return;
      const regla = RUTAS
        .filter(r => pathname === r.prefijo || pathname.startsWith(r.prefijo + '/'))
        .sort((a, b) => b.prefijo.length - a.prefijo.length)[0];
      if (regla && !authService.puede(regla.permiso)) {
        router.replace('/dashboard');
      }
    }, 0);
    return () => clearTimeout(t);
  }, [pathname, router]);

  return null;
}
