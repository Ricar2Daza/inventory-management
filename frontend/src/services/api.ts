import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores y redirección automática
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar error 401 (No autorizado - token expirado o inválido)
    if (error.response?.status === 401) {
      // Limpiar datos de sesión
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirigir a login solo si estamos en el cliente
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    // Manejar error 403 (Prohibido - sin permisos)
    // Se mantiene el error para que el componente pueda manejarlo
    // (mostrar mensaje, etc.)
    
    return Promise.reject(error);
  }
);

export default api;
