'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from './services/auth.service';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Verificamos si está autenticado usando el servicio que ya creamos
    if (authService.isAuthenticated()) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {/* Un spinner elegante de NextUI mientras decide */}
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}