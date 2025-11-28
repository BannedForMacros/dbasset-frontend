'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, UserData } from '../../services/auth.service';

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (!authService.isAuthenticated()) {
        router.push('/login');
        return;
      }

      const data = authService.getUserData();
      setUserData(data);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      <div className="space-y-4">
        <div className="p-6 bg-white rounded-lg shadow">
          <p className="text-sm text-gray-600">Bienvenido</p>
          <p className="text-2xl font-bold text-gray-800">{userData.nombreCompleto}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-600">Usuario</p>
            <p className="text-lg font-semibold text-gray-800">{userData.usuario}</p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-600">Tipo de Usuario</p>
            <p className="text-lg font-semibold text-gray-800">{userData.tipoUsu}</p>
          </div>
        </div>
      </div>
    </div>
  );
}