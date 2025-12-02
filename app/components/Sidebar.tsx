'use client';

import { useRouter, usePathname } from 'next/navigation';
import { authService } from '../services/auth.service';
import { useState } from 'react';
import { 
  MdDashboard, MdLogout, MdMenu, MdClose,
  MdPeople, MdInfo, MdQrCode, MdLocalShipping, MdSettings, MdSwapHoriz
} from 'react-icons/md';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  
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
    { name: 'Configuración', path: '/dashboard/config-organizacional', icon: MdSettings }, // ✅ Nuevo menú consolidado
    { name: 'Responsables', path: '/dashboard/responsables', icon: MdPeople },
    { name: 'Estados', path: '/dashboard/estados', icon: MdInfo },
    { name: 'Activos', path: '/dashboard/activos', icon: MdQrCode },
    { name: 'Cargas', path: '/dashboard/cargas', icon: MdLocalShipping },
  ];

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