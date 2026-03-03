'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService, LoginResponse, Empresa } from '../services/auth.service';
import Image from 'next/image';
import { LogOut, PlusCircle, LayoutDashboard, Loader2 } from 'lucide-react';

// Importamos tus componentes personalizados
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';

export default function SelectCompanyPage() {
  const router = useRouter();
  
  // Estado inicial
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNoCompanyModal, setShowNoCompanyModal] = useState(false);

  useEffect(() => {
    // Usamos setTimeout para mover la lógica al final de la pila de ejecución
    // y evitar el error de "synchronous setState" de ESLint.
    const timer = setTimeout(() => {
      const userData = authService.getUserData();

      if (!userData || !userData.authHeader) {
        router.replace('/login');
        return;
      }

      setUser(userData);
      
      // Verificamos si NO tiene empresas asignadas
      if (!userData.empresas || userData.empresas.length === 0) {
        setShowNoCompanyModal(true);
      }
      
      setLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [router]);

  const handleSelect = useCallback((empresa: Empresa) => {
    authService.selectCompany(empresa.codEmpresa);
    router.push('/dashboard');
  }, [router]);

  const handleLogout = () => {
    authService.logout();
    router.replace('/login');
  };

  const handleCreateCompany = () => {
    router.push('/create-company'); 
  };

  // Spinner de carga inicial elegante
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-[#1e4786]" size={40} />
      </div>
    );
  }

  // Si terminó de cargar y no hay usuario (redireccionando), no renderizamos nada
  if (!user) return null;

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-slate-50 overflow-hidden">
      
      {/* --- FONDO TECNOLÓGICO (Solución al espacio vacío) --- */}
      {/* 1. Degradado base suave */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 via-slate-50 to-white -z-20" />
      
      {/* 2. Patrón de Grilla (Grid) Sutil - Da estructura profesional */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] -z-10"></div>
      
      {/* 3. Mancha de luz central (Spotlight) detrás del contenido */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/10 blur-[100px] rounded-full -z-10 pointer-events-none"></div>


      {/* --- CONTENIDO PRINCIPAL (Centrado Verticalmente) --- */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 w-full animate-in fade-in zoom-in-95 duration-500">
        
        <div className="w-full max-w-4xl flex flex-col items-center">
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="relative w-48 h-16 mx-auto mb-6 transition-transform hover:scale-105 duration-500">
               <Image 
                 src="/db.png" 
                 alt="Data Business" 
                 fill 
                 className="object-contain" 
                 priority 
               />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1e4786] mb-3 tracking-tight">
              ¡Hola, {user.nombreCompleto?.split(' ')[0]}!
            </h1>
            <p className="text-slate-500 text-lg font-medium">
              Selecciona una empresa para gestionar tus activos
            </p>
          </div>

          {/* Grid de Empresas */}
          <div className="w-full grid gap-6 md:grid-cols-2 mb-10">
            {user.empresas?.map((emp) => (
              <Card
                key={emp.codEmpresa}
                title={emp.razonSocial}
                subtitle={emp.ruc}
                badge={emp.rol}
                onClick={() => handleSelect(emp)}
              />
            ))}
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg justify-center">
             <Button variant="flat-blue" fullWidth onClick={handleCreateCompany}>
                <PlusCircle size={20} />
                Crear Nueva Empresa
             </Button>

             <Button variant="flat-red" fullWidth onClick={handleLogout}>
                <LogOut size={20} />
                Cerrar Sesión
             </Button>
          </div>

        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 text-center relative z-10">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-[#22c4a1] transition-colors cursor-default">
          Desarrollado por Data Business S.A.C.
        </p>
      </footer>

      {/* --- MODAL: SIN EMPRESA --- */}
      <Modal isOpen={showNoCompanyModal}>
        <div className="flex flex-col items-center text-center p-2">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <LayoutDashboard size={40} className="text-[#1e4786]" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Aún no tienes empresas
          </h2>
          <p className="text-gray-600 mb-8 text-sm leading-relaxed px-4">
            Para acceder al panel de control y gestionar activos, es necesario que registres tu primera organización.
          </p>

          <div className="w-full space-y-3">
            <Button variant="primary" fullWidth onClick={handleCreateCompany}>
              Crear mi primera empresa
            </Button>
            
            <button 
              onClick={handleLogout}
              className="w-full py-3 text-sm text-gray-400 hover:text-red-500 transition-colors font-medium"
            >
              Cancelar y salir
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}