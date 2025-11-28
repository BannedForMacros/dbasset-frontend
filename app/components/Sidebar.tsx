'use client';

import { useRouter, usePathname } from 'next/navigation';
import { authService } from '../services/auth.service';
import { useState } from 'react';
import { 
  MdDashboard, 
  MdBusiness, 
  MdLogout, 
  MdMenu, 
  MdClose,
  MdMeetingRoom,
  MdPeople,
  MdInfo,
  MdQrCode,
  MdLocalShipping,
  MdLayers // 1. Importamos el ícono para Áreas
} from 'react-icons/md';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: MdDashboard },
    // 2. Ajustamos las rutas para que coincidan con la carpeta /dashboard
    { name: 'Locales', path: '/dashboard/local', icon: MdBusiness },
    { name: 'Áreas', path: '/dashboard/areas', icon: MdLayers }, // 3. Nueva opción
    { name: 'Oficinas', path: '/dashboard/oficinas', icon: MdMeetingRoom }, // <--- NUEVO
    { name: 'Responsables', path: '/dashboard/responsables', icon: MdPeople }, // <--- NUEVO
    { name: 'Estados', path: '/dashboard/estados', icon: MdInfo },
    { name: 'Activos', path: '/dashboard/activos', icon: MdQrCode },
    { name: 'Cargas', path: '/dashboard/cargas', icon: MdLocalShipping },
  ];

  return (
    <>
      {/* Botón hamburguesa para móvil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg"
      >
        {isOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-gray-900 text-white transition-transform duration-300 z-40 shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64 flex flex-col`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800 bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <span className="text-xl font-bold text-white">DB</span>
            </div>
            <div>
              <h2 className="font-bold text-lg tracking-tight">DBAsset</h2>
              <p className="text-xs text-gray-400 font-medium">Data Business S.A.C</p>
            </div>
          </div>
        </div>

        {/* Menu Items - Usamos flex-1 para que ocupe el espacio disponible */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={22} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-white transition-colors'} />
                <span className="font-medium text-sm">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer - Logout */}
        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200 group"
          >
            <MdLogout size={22} className="group-hover:text-red-500 transition-colors" />
            <span className="font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Overlay para móvil */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-sm transition-opacity"
        />
      )}
    </>
  );
}