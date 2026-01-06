import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const hasAuthHeader =
      (config.headers && ('Authorization' in config.headers)) ||
      (config.headers as any)?.authorization;
    if (token && !hasAuthHeader) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores y redirección automática
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('[API Response Error]', error.message, error.response?.status, error.config?.url);
    
    // Manejar error 401 (No autorizado - token expirado o inválido)
    if (error.response?.status === 401) {
      // Limpiar datos de sesión
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirigir a login solo si estamos en el cliente
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

