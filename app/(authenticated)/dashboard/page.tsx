'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, UserData } from '../../services/auth.service';
import { activoService, Activo } from '../../services/activo.service';
import { Carga, cargaService } from '../../services/carga.service';
import { responsableService } from '../../services/responsable.service';
import { Estado } from '../../services/estado.service';
import {
  MdInventory, MdPeople, MdCheckCircle, MdWarning,
  MdTrendingUp, MdLocalShipping, MdArrowForward,
  MdDashboard, MdInsights
} from 'react-icons/md';
import Link from 'next/link';

interface DashboardStats {
  totalActivos: number;
  activosAsignados: number;
  totalResponsables: number;
  totalCargas: number;
  cargasPendientes: number;
  estadosBuenos: number;
  estadosRegulares: number;
  estadosMalos: number;
}

/* ─── Paleta data_business ─── */
const c = {
  brand:    '#1e4786',
  accent:   '#22c4a1',
  darkBg:   '#003366',
  surface:  '#f8fafc',
  textBold: '#0f172a',
};

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalActivos: 0,
    activosAsignados: 0,
    totalResponsables: 0,
    totalCargas: 0,
    cargasPendientes: 0,
    estadosBuenos: 0,
    estadosRegulares: 0,
    estadosMalos: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const getTipoUsuarioTexto = (tipoUsu: string): string => {
    switch (tipoUsu) {
      case '1': return 'Administrador';
      case '2': return 'Auditor';
      default:  return 'Usuario';
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const [activos, responsables, cargas] = await Promise.all([
        activoService.listarTodos(),
        responsableService.listarActivos(),
        cargaService.listarTodas(),
      ]);

      const activosAsignados  = activos.filter((a: Activo) => a.responsable).length;
      const cargasPendientes = cargas.filter((c: Carga) => c.estado !== 'T').length;

      const estadosBuenos   = activos.filter((a: Activo) => {
        const nombre = (a.estado as Estado | undefined)?.nombreEstado?.toLowerCase() || '';
        return nombre.includes('bueno') || nombre.includes('nuevo') || nombre.includes('excelente');
      }).length;

      const estadosRegulares = activos.filter((a: Activo) => {
        const nombre = (a.estado as Estado | undefined)?.nombreEstado?.toLowerCase() || '';
        return nombre.includes('regular') || nombre.includes('medio');
      }).length;

      const estadosMalos = activos.filter((a: Activo) => {
        const nombre = (a.estado as Estado | undefined)?.nombreEstado?.toLowerCase() || '';
        return nombre.includes('malo') || nombre.includes('deteriorado');
      }).length;

      setStats({
        totalActivos: activos.length,
        activosAsignados,
        totalResponsables: responsables.length,
        totalCargas: cargas.length,
        cargasPendientes,
        estadosBuenos,
        estadosRegulares,
        estadosMalos,
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (!authService.isAuthenticated()) { router.push('/login'); return; }
      setUserData(authService.getUserData());
      await cargarEstadisticas();
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  if (isLoading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: c.surface }}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: c.brand }} />
          <p className="font-medium" style={{ color: c.brand }}>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const porcentajeAsignacion = stats.totalActivos > 0
    ? Math.round((stats.activosAsignados / stats.totalActivos) * 100)
    : 0;

  const empresaActiva = userData.empresas?.find(
    (e) => e.codEmpresa === userData.currentCompanyId
  )?.razonSocial || 'N/A';

  return (
    <div className="space-y-8 pb-10" style={{ backgroundColor: c.surface, minHeight: '100vh', padding: '2rem' }}>

      {/* ── HEADER bienvenida ── */}
      <div
        className="rounded-2xl p-8 text-white shadow-xl relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${c.darkBg} 0%, ${c.brand} 100%)` }}
      >
        {/* Decoración accent top-right */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: c.accent, transform: 'translate(30%, -30%)' }}
        />
        <div
          className="absolute bottom-0 right-32 w-32 h-32 rounded-full opacity-10"
          style={{ background: c.accent, transform: 'translateY(50%)' }}
        />

        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'rgba(34,196,161,0.2)', border: `1px solid rgba(34,196,161,0.3)` }}
              >
                <MdDashboard size={26} style={{ color: c.accent }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Bienvenido de vuelta
                </p>
                <h1 className="text-2xl font-bold text-white">{userData.nombreCompleto}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
                style={{ backgroundColor: 'rgba(34,196,161,0.2)', color: c.accent, border: `1px solid rgba(34,196,161,0.4)` }}
              >
                {getTipoUsuarioTexto(String(userData.tipoUsu))}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>•</span>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{userData.usuario}</span>
            </div>
          </div>

          <div className="hidden md:block text-right">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Empresa Activa
            </p>
            <p className="text-base font-bold text-white">{empresaActiva}</p>
            {/* Guión acento debajo del nombre */}
            <div className="mt-1 ml-auto" style={{ width: '40px', height: '3px', backgroundColor: c.accent, borderRadius: '2px' }} />
          </div>
        </div>
      </div>

      {/* ── MÉTRICAS PRINCIPALES ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Total Activos */}
        <MetricCard
          icon={<MdInventory size={26} />}
          label="Total Activos"
          value={stats.totalActivos}
          sub="Inventario general"
          href="/dashboard/activos"
          iconBg={c.brand}
        />

        {/* Asignados */}
        <div
          className="rounded-2xl p-6 shadow-sm border"
          style={{ backgroundColor: '#fff', borderColor: 'rgba(34,196,161,0.2)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(34,196,161,0.12)' }}>
              <MdCheckCircle size={26} style={{ color: c.accent }} />
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>Asignados</p>
              <p className="text-3xl font-bold mt-1" style={{ color: c.textBold }}>{stats.activosAsignados}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span style={{ color: '#64748b' }}>{porcentajeAsignacion}% del total</span>
              <span className="font-bold" style={{ color: c.accent }}>
                {stats.activosAsignados}/{stats.totalActivos}
              </span>
            </div>
            <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: '#e2e8f0' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${porcentajeAsignacion}%`, backgroundColor: c.accent }}
              />
            </div>
          </div>
        </div>

        {/* Responsables */}
        <MetricCard
          icon={<MdPeople size={26} />}
          label="Responsables"
          value={stats.totalResponsables}
          sub="Custodios activos"
          href="/dashboard/responsables"
          iconBg={c.brand}
        />

        {/* Cargas */}
        <div
          className="rounded-2xl p-6 shadow-sm border"
          style={{ backgroundColor: '#fff', borderColor: '#e2e8f0' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: `rgba(30,71,134,0.1)` }}>
              <MdLocalShipping size={26} style={{ color: c.brand }} />
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>Cargas</p>
              <p className="text-3xl font-bold mt-1" style={{ color: c.textBold }}>{stats.totalCargas}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            {stats.cargasPendientes > 0 ? (
              <span className="font-bold" style={{ color: '#f59e0b' }}>
                {stats.cargasPendientes} pendientes
              </span>
            ) : (
              <span className="font-bold" style={{ color: c.accent }}>Todo al día ✓</span>
            )}
            <Link href="/dashboard/cargas" className="flex items-center gap-1 font-medium hover:underline" style={{ color: c.brand }}>
              Ver <MdArrowForward size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── ANÁLISIS + ACCESOS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Condición de Activos */}
        <div
          className="rounded-2xl p-6 shadow-sm border"
          style={{ backgroundColor: '#fff', borderColor: '#e2e8f0' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `rgba(30,71,134,0.08)` }}>
              <MdInsights size={22} style={{ color: c.brand }} />
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ color: c.textBold }}>Condición de Activos</h3>
              <p className="text-sm" style={{ color: '#94a3b8' }}>Distribución por estado físico</p>
            </div>
          </div>

          <div className="space-y-5">
            <CondicionBar
              label="Buen Estado"
              value={stats.estadosBuenos}
              total={stats.totalActivos}
              color={c.accent}
            />
            <CondicionBar
              label="Estado Regular"
              value={stats.estadosRegulares}
              total={stats.totalActivos}
              color="#f59e0b"
            />
            <CondicionBar
              label="Mal Estado"
              value={stats.estadosMalos}
              total={stats.totalActivos}
              color="#ef4444"
            />
          </div>
        </div>

        {/* Accesos Rápidos */}
        <div
          className="rounded-2xl p-6 shadow-sm border"
          style={{ backgroundColor: '#fff', borderColor: '#e2e8f0' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `rgba(30,71,134,0.08)` }}>
              <MdTrendingUp size={22} style={{ color: c.brand }} />
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ color: c.textBold }}>Accesos Rápidos</h3>
              <p className="text-sm" style={{ color: '#94a3b8' }}>Navegación directa</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {[
              { href: '/dashboard/activos',               icon: <MdInventory size={20} />,     label: 'Gestionar Activos'   },
              { href: '/dashboard/cargas',                icon: <MdLocalShipping size={20} />, label: 'Nueva Carga'         },
              { href: '/dashboard/responsables',          icon: <MdPeople size={20} />,        label: 'Ver Responsables'    },
              { href: '/dashboard/config-organizacional', icon: <MdWarning size={20} />,       label: 'Configuración'       },
            ].map(({ href, icon, label }) => (
              <QuickLink key={href} href={href} icon={icon} label={label} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-componentes ─── */

function MetricCard({
  icon, label, value, sub, href, iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  href: string;
  iconBg: string;
}) {
  return (
    <div
      className="rounded-2xl p-6 shadow-sm border"
      style={{ backgroundColor: '#fff', borderColor: '#e2e8f0' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl text-white" style={{ backgroundColor: iconBg }}>
          {icon}
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>{label}</p>
          <p className="text-3xl font-bold mt-1" style={{ color: '#0f172a' }}>{value}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: '#64748b' }}>{sub}</span>
        <Link href={href} className="flex items-center gap-1 font-medium hover:underline" style={{ color: '#1e4786' }}>
          Ver <MdArrowForward size={14} />
        </Link>
      </div>
    </div>
  );
}

function CondicionBar({ label, value, total, color }: {
  label: string; value: number; total: number; color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-medium" style={{ color: '#334155' }}>{label}</span>
        </div>
        <span className="text-sm font-bold" style={{ color: '#0f172a' }}>{value}</span>
      </div>
      <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: '#f1f5f9' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-3.5 rounded-xl transition-all duration-150 group border"
      style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#1e4786';
        (e.currentTarget as HTMLAnchorElement).style.borderColor = '#1e4786';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#f8fafc';
        (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e2e8f0';
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="p-1.5 rounded-lg transition-all duration-150"
          style={{ backgroundColor: 'rgba(30,71,134,0.1)', color: '#1e4786' }}
        >
          {icon}
        </div>
        <span className="font-medium text-sm" style={{ color: '#1e4786' }}>{label}</span>
      </div>
      <MdArrowForward size={18} style={{ color: '#94a3b8' }} />
    </Link>
  );
}