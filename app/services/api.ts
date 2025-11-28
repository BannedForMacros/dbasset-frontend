import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- INTERCEPTOR DE SOLICITUD (Aquí inyectamos la clave) ---
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('dbasset_user');
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        
        // VERIFICACIÓN: Si tenemos el header guardado, lo usamos
        if (user.authHeader) {
          // console.log('🔑 Inyectando credencial:', user.authHeader); // Descomenta si quieres depurar
          config.headers.Authorization = user.authHeader;
        } else {
          console.warn('⚠️ Usuario encontrado en storage pero SIN authHeader');
        }
      } catch (e) {
        console.error('Error al leer usuario del storage', e);
      }
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- INTERCEPTOR DE RESPUESTA (Manejo de expulsión) ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el backend dice 401 (No autorizado) o 403 (Prohibido)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Solo redirigir si NO estamos ya en el login para evitar bucles infinitos
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        console.error('⛔ Sesión caducada o inválida. Redirigiendo al login...');
        localStorage.removeItem('dbasset_user'); // Limpiamos la basura
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;