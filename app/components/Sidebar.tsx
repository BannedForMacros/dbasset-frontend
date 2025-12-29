'use client';

import { useRouter, usePathname } from 'next/navigation';
import { authService } from '../services/auth.service';
import { useState } from 'react';
import { 
  MdDashboard, MdLogout, MdMenu, MdClose,
  MdPeople, MdInfo, MdQrCode, MdLocalShipping, MdSettings, MdSwapHoriz,
  MdExpandMore, MdExpandLess, MdBuild, MdColorLens, MdBrandingWatermark,
  MdAssignmentInd // ✅ NUEVO ICONO para Inventariadores
} from 'react-icons/md';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [mantenedorOpen, setMantenedorOpen] = useState(false);
  
  const companyInfo = (() => {
    if (typeof window === 'undefined') {
      return { ruc: '', razonSocial: '' };
    }
    
    const user = authService.getUserData();
    if (user?.empresas && user.currentCompanyId) {
      const empresa = user.empresas.find(e => e.codEmpresa === user.currentCompanyId);
      if (empresa) {
        return {
          ruc: empresa.ruc,
          razonSocial: empresa.razonSocial
        };
      }
    }
    return { ruc: '', razonSocial: '' };
  })();

  const handleLogout = () => {
    authService.logout();
  };
  
  const handleChangeCompany = () => {
    router.push('/select-company');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: MdDashboard },
    { name: 'Activos', path: '/dashboard/activos', icon: MdQrCode },
    { name: 'Cargas', path: '/dashboard/cargas', icon: MdLocalShipping },
    { name: 'Configuración', path: '/dashboard/config-organizacional', icon: MdSettings },
    { name: 'Custodios', path: '/dashboard/responsables', icon: MdPeople },
    { name: 'Inventariadores', path: '/dashboard/inventariador', icon: MdAssignmentInd }, // ✅ NUEVO
  ];

  const mantenedorItems = [
    { name: 'Colores', path: '/dashboard/colores', icon: MdColorLens },
    { name: 'Marcas', path: '/dashboard/marcas', icon: MdBrandingWatermark },
    { name: 'Estados', path: '/dashboard/estados', icon: MdInfo },
  ];

  // Verificar si alguna ruta de mantenedor está activa
  const isMantenedorActive = mantenedorItems.some(item => pathname === item.path);

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg"
      >
        {isOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
      </button>

      <div className={`fixed top-0 left-0 h-full bg-gray-900 text-white transition-transform duration-300 z-40 shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 w-64 flex flex-col`}>
        
        <div className="p-6 border-b border-gray-800 bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shrink-0">
              <span className="text-xl font-bold text-white">DB</span>
            </div>
            <div className="overflow-hidden">
              <h2 
                className="font-bold text-sm tracking-tight truncate w-40" 
                title={companyInfo.razonSocial || ''}
                suppressHydrationWarning
              >
                {companyInfo.razonSocial || 'Cargando...'}
              </h2>
              <p className="text-xs text-gray-400 font-medium font-mono" suppressHydrationWarning>
                RUC: {companyInfo.ruc || '---'}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
          {/* Menú principal */}
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={22} />
                <span className="font-medium text-sm">{item.name}</span>
              </button>
            );
          })}

          {/* Menú desplegable de Mantenedor */}
          <div>
            <button
              onClick={() => setMantenedorOpen(!mantenedorOpen)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isMantenedorActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <MdBuild size={22} />
                <span className="font-medium text-sm">Mantenedor</span>
              </div>
              {mantenedorOpen ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
            </button>

            {/* Submenú */}
            <div className={`overflow-hidden transition-all duration-300 ${mantenedorOpen ? 'max-h-48' : 'max-h-0'}`}>
              <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-800 pl-4">
                {mantenedorItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => router.push(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                        isActive 
                          ? 'bg-blue-500/20 text-blue-400 font-medium' 
                          : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800 bg-gray-900 space-y-2">
          <button 
            onClick={handleChangeCompany} 
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-blue-400 transition-all text-sm"
          >
            <MdSwapHoriz size={20} />
            <span>Cambiar Empresa</span>
          </button>
          
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-all text-sm"
          >
            <MdLogout size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {isOpen && <div onClick={() => setIsOpen(false)} className="lg:hidden fixed inset-0 bg-black/60 z-30" />}
    </>
  );
}