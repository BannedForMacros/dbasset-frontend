'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, UserData } from '../../services/auth.service';
import { activoService, Activo } from '../../services/activo.service';
import { cargaService } from '../../services/carga.service';
import { responsableService } from '../../services/responsable.service';
import { estadoService, Estado } from '../../services/estado.service';
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
    estadosMalos: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Función para convertir tipoUsu a texto legible
  const getTipoUsuarioTexto = (tipoUsu: string): string => {
    switch (tipoUsu) {
      case '1':
        return 'Administrador';
      case '2':
        return 'Auditor';
      default:
        return 'Usuario';
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const [activos, responsables, cargas] = await Promise.all([
        activoService.listarTodos(),
        responsableService.listarActivos(),
        cargaService.listarTodas()
      ]);

      const activosAsignados = activos.filter(a => a.responsable).length;
      const cargasPendientes = cargas.filter(c => c.estado !== 'T').length;

      const estadosBuenos = activos.filter((a: Activo) => {
        const estado = a.estado as Estado | undefined;
        const nombreEstado = estado?.nombreEstado?.toLowerCase() || '';
        return nombreEstado.includes('bueno') || nombreEstado.includes('nuevo') || nombreEstado.includes('excelente');
      }).length;

      const estadosRegulares = activos.filter((a: Activo) => {
        const estado = a.estado as Estado | undefined;
        const nombreEstado = estado?.nombreEstado?.toLowerCase() || '';
        return nombreEstado.includes('regular') || nombreEstado.includes('medio');
      }).length;

      const estadosMalos = activos.filter((a: Activo) => {
        const estado = a.estado as Estado | undefined;
        const nombreEstado = estado?.nombreEstado?.toLowerCase() || '';
        return nombreEstado.includes('malo') || nombreEstado.includes('deteriorado');
      }).length;

      setStats({
        totalActivos: activos.length,
        activosAsignados,
        totalResponsables: responsables.length,
        totalCargas: cargas.length,
        cargasPendientes,
        estadosBuenos,
        estadosRegulares,
        estadosMalos
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (!authService.isAuthenticated()) {
        router.push('/login');
        return;
      }

      const data = authService.getUserData();
      setUserData(data);
      
      await cargarEstadisticas();
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
          <p className="text-slate-600 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const porcentajeAsignacion = stats.totalActivos > 0 
    ? Math.round((stats.activosAsignados / stats.totalActivos) * 100) 
    : 0;

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      
      {/* Header de Bienvenida */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <MdDashboard size={28} />
              </div>
              <div>
                <p className="text-slate-300 text-sm font-medium">Bienvenido de vuelta</p>
                <h1 className="text-3xl font-bold">{userData.nombreCompleto}</h1>
              </div>
            </div>
            {/* ✅ Mostrar tipo de usuario legible */}
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
                {getTipoUsuarioTexto(String(userData.tipoUsu))}
              </span>
              <span className="text-slate-400 text-sm">•</span>
              <span className="text-slate-400 text-sm">{userData.usuario}</span>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-slate-400 text-sm mb-1">Empresa Activa</p>
              <p className="text-lg font-bold">
                {userData.empresas?.find(e => e.codEmpresa === userData.currentCompanyId)?.razonSocial || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Activos */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-slate-900 transition-colors">
              <MdInventory className="text-slate-700 group-hover:text-white transition-colors" size={28} />
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Total Activos</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalActivos}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Inventario general</span>
            <Link href="/dashboard/activos" className="text-slate-900 hover:underline flex items-center gap-1">
              Ver <MdArrowForward size={14} />
            </Link>
          </div>
        </div>

        {/* Activos Asignados */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-600 transition-colors">
              <MdCheckCircle className="text-emerald-600 group-hover:text-white transition-colors" size={28} />
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Asignados</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.activosAsignados}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">{porcentajeAsignacion}% del total</span>
              <span className="text-emerald-600 font-bold">{stats.activosAsignados}/{stats.totalActivos}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${porcentajeAsignacion}%` }}
              />
            </div>
          </div>
        </div>

        {/* Responsables */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-600 transition-colors">
              <MdPeople className="text-blue-600 group-hover:text-white transition-colors" size={28} />
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Responsables</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalResponsables}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Custodios activos</span>
            <Link href="/dashboard/responsables" className="text-slate-900 hover:underline flex items-center gap-1">
              Ver <MdArrowForward size={14} />
            </Link>
          </div>
        </div>

        {/* Cargas */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-100 rounded-xl group-hover:bg-amber-600 transition-colors">
              <MdLocalShipping className="text-amber-600 group-hover:text-white transition-colors" size={28} />
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Cargas</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalCargas}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              {stats.cargasPendientes > 0 ? (
                <span className="text-amber-600 font-bold">{stats.cargasPendientes} pendientes</span>
              ) : (
                <span className="text-emerald-600 font-bold">Todo al día</span>
              )}
            </span>
            <Link href="/dashboard/cargas" className="text-slate-900 hover:underline flex items-center gap-1">
              Ver <MdArrowForward size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Análisis de Estados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Estado de Activos */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 rounded-lg">
              <MdInsights className="text-slate-700" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Condición de Activos</h3>
              <p className="text-slate-500 text-sm">Distribución por estado físico</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Buenos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                  <span className="text-sm font-medium text-slate-700">Buen Estado</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{stats.estadosBuenos}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.totalActivos > 0 ? (stats.estadosBuenos / stats.totalActivos) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Regulares */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-600"></div>
                  <span className="text-sm font-medium text-slate-700">Estado Regular</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{stats.estadosRegulares}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-amber-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.totalActivos > 0 ? (stats.estadosRegulares / stats.totalActivos) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Malos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-600"></div>
                  <span className="text-sm font-medium text-slate-700">Mal Estado</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{stats.estadosMalos}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-red-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.totalActivos > 0 ? (stats.estadosMalos / stats.totalActivos) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Accesos Rápidos */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 rounded-lg">
              <MdTrendingUp className="text-slate-700" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Accesos Rápidos</h3>
              <p className="text-slate-500 text-sm">Navegación directa</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Link 
              href="/dashboard/activos" 
              className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-900 rounded-xl transition-all group border border-slate-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg group-hover:bg-slate-800 transition-colors">
                  <MdInventory className="text-slate-700 group-hover:text-white transition-colors" size={20} />
                </div>
                <span className="font-medium text-slate-900 group-hover:text-white transition-colors">
                  Gestionar Activos
                </span>
              </div>
              <MdArrowForward className="text-slate-400 group-hover:text-white transition-colors" size={20} />
            </Link>

            <Link 
              href="/dashboard/cargas" 
              className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-900 rounded-xl transition-all group border border-slate-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg group-hover:bg-slate-800 transition-colors">
                  <MdLocalShipping className="text-slate-700 group-hover:text-white transition-colors" size={20} />
                </div>
                <span className="font-medium text-slate-900 group-hover:text-white transition-colors">
                  Nueva Carga
                </span>
              </div>
              <MdArrowForward className="text-slate-400 group-hover:text-white transition-colors" size={20} />
            </Link>

            <Link 
              href="/dashboard/responsables" 
              className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-900 rounded-xl transition-all group border border-slate-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg group-hover:bg-slate-800 transition-colors">
                  <MdPeople className="text-slate-700 group-hover:text-white transition-colors" size={20} />
                </div>
                <span className="font-medium text-slate-900 group-hover:text-white transition-colors">
                  Ver Responsables
                </span>
              </div>
              <MdArrowForward className="text-slate-400 group-hover:text-white transition-colors" size={20} />
            </Link>

            <Link 
              href="/dashboard/config-organizacional" 
              className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-900 rounded-xl transition-all group border border-slate-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg group-hover:bg-slate-800 transition-colors">
                  <MdWarning className="text-slate-700 group-hover:text-white transition-colors" size={20} />
                </div>
                <span className="font-medium text-slate-900 group-hover:text-white transition-colors">
                  Configuración
                </span>
              </div>
              <MdArrowForward className="text-slate-400 group-hover:text-white transition-colors" size={20} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}