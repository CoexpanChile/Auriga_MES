// Cliente API base para todas las peticiones
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://18.213.58.26:8081';

export const api = {
  async get(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        method: 'GET',
        headers: {
          // No incluir Content-Type en GET requests (no tienen body)
          ...options.headers,
        },
        credentials: 'include', // Incluir cookies
      });

      // Si recibimos 401, intentar verificar autenticación y redirigir si es necesario
      if (response.status === 401) {
        // Verificar si hay una sesión activa
        const authCheck = await fetch(`${API_BASE_URL}/api/auth/check`, {
          credentials: 'include'
        })
        
        if (!authCheck.ok) {
          // Si la verificación falla, redirigir a login
          console.warn('Sesión expirada, redirigiendo a login...')
          window.location.href = '/login'
          throw new Error('Unauthorized - Sesión expirada')
        }
        
        // Si la verificación es exitosa pero aún recibimos 401, lanzar error
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error en GET ${endpoint}:`, error);
      throw error;
    }
  },

  async post(endpoint, body, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      // Si recibimos 401, verificar autenticación y redirigir si es necesario
      if (response.status === 401) {
        const authCheck = await fetch(`${API_BASE_URL}/api/auth/check`, {
          credentials: 'include'
        })
        
        if (!authCheck.ok) {
          console.warn('Sesión expirada, redirigiendo a login...')
          window.location.href = '/login'
          throw new Error('Unauthorized - Sesión expirada')
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error en POST ${endpoint}:`, error);
      throw error;
    }
  },

  async put(endpoint, body, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error en PUT ${endpoint}:`, error);
      throw error;
    }
  },

  async delete(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        method: 'DELETE',
        headers: {
          // No incluir Content-Type en DELETE requests (no tienen body)
          ...options.headers,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error en DELETE ${endpoint}:`, error);
      throw error;
    }
  },
};

export default api;






