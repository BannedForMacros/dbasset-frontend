import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dbasset-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('dbasset_user');
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          
          // 1. Auth Basic (Obligatorio para entrar)
          if (user.authHeader) {
            config.headers.Authorization = user.authHeader;
          }

          // 2. Tenant ID (Obligatorio para saber qué empresa ver)
          if (user.currentCompanyId) {
            config.headers['X-Tenant-ID'] = user.currentCompanyId;
          }

          // 3. Usuario que hace la acción (auditoría de bajas, transferencias, inventarios)
          if (user.codPersona && user.rol === 'ADMIN') {
            config.headers['X-User-ID'] = user.codPersona;
          }

        } catch (e) {
          console.error('Error leyendo sesión:', e);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Manejo de errores (la sesión muere solo con 401; un 403 es falta de permisos y se muestra en pantalla)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('dbasset_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;