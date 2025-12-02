'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from './services/auth.service';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 1. Si no está logueado → Login
    if (!authService.isLoggedIn()) {
      router.replace('/login');
      return;
    }

    // 2. Si está logueado pero no tiene empresa → Selector
    if (!authService.hasCompanySelected()) {
      router.replace('/select-company');
      return;
    }

    // 3. Si tiene todo → Dashboard
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}