'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService, LoginResponse, Empresa } from '../services/auth.service';
import { MdBusiness, MdArrowForward } from 'react-icons/md';

export default function SelectCompanyPage() {
  const router = useRouter();

  // ✅ SOLUCIÓN: Obtener datos directamente, sin useState ni isMounted
  const user: LoginResponse | null = typeof window !== 'undefined' 
    ? authService.getUserData() 
    : null;

  // ✅ Verificar autenticación solo una vez al montar
  useEffect(() => {
    if (!user || !user.authHeader) {
      router.replace('/login');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

const handleSelect = useCallback((empresa: Empresa) => {
  console.log('🏢 Seleccionando empresa:', empresa.codEmpresa);
  authService.selectCompany(empresa.codEmpresa);
  
  // ✅ Verificar que se guardó correctamente
  const updated = authService.getUserData();
  console.log('✅ Empresa guardada:', updated?.currentCompanyId);
  
  router.push('/dashboard');
}, [router]);

  // Si no hay usuario, no renderizar nada (ya está redirigiendo)
  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Seleccione una Empresa</h1>
          <p className="text-gray-600 mt-2">
            Hola, <span className="font-semibold">{user.nombreCompleto}</span>. Tienes acceso a los siguientes RUCs:
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {user.empresas && user.empresas.map((emp) => (
            <button
              key={emp.codEmpresa}
              onClick={() => handleSelect(emp)}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-500 transition-all text-left group flex flex-col gap-2"
            >
              <div className="flex items-center justify-between w-full">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <MdBusiness size={24} />
                </div>
                <MdArrowForward className="text-gray-300 group-hover:text-blue-500" size={24} />
              </div>
              
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{emp.razonSocial}</h3>
                <p className="text-sm text-gray-500 font-mono">RUC: {emp.ruc}</p>
                <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded border">
                  Rol: {emp.rol}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={() => { authService.logout(); }}
            className="text-sm text-red-500 hover:text-red-700 underline"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}