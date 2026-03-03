'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/auth.service';
import { AxiosError } from 'axios';
import Image from 'next/image';
// Importamos los iconos de Lucide
import { User, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

interface ErrorResponse {
  error: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ username, password });
      if (response.currentCompanyId) {
        router.replace('/dashboard');
      } else {
        router.replace('/select-company');
      }
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMessage = axiosError.response?.data?.error || 'Error de conexión con el servidor';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0052a5] via-[#003366] to-[#001a33] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/20">
        
        {/* Línea decorativa Turquesa Data Business */}
        <div className="h-1.5 bg-[#22c4a1]"></div>

        <div className="p-8">
          {/* Logo y Título */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-56 h-14 mb-4">
              <Image 
                src="/db.png" 
                alt="Data Business" 
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-[#1e4786] tracking-tight">SISTEMA DBASSET</h1>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Gestión de Activos</p>
            </div>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Campo Usuario */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#1e4786] flex items-center gap-2">
                <User size={16} className="text-[#22c4a1]" />
                Nombre de Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22c4a1] focus:border-transparent outline-none transition-all text-gray-700"
              />
            </div>
            
            {/* Campo Contraseña */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#1e4786] flex items-center gap-2">
                <Lock size={16} className="text-[#22c4a1]" />
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#22c4a1] focus:border-transparent outline-none transition-all text-gray-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1e4786] p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Alerta de Error en Español */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium animate-in fade-in zoom-in duration-300">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Botón Principal */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1e4786] hover:bg-[#163564] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  Iniciando sesión...
                </span>
              ) : (
                'INGRESAR AL SISTEMA'
              )}
            </button>
          </form>

          {/* Footer Localizado */}
          <div className="mt-10 pt-6 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
              Desarrollado por <span className="text-[#22c4a1]">Data Business S.A.C.</span>
            </p>
            <p className="text-[10px] text-gray-400 mt-1">Lima - Perú</p>
          </div>
        </div>
      </div>
    </div>
  );
}