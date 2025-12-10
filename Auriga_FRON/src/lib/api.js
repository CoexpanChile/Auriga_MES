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
        // Evitar múltiples redirecciones
        if (window._redirectingToLogin) {
          throw new Error('Unauthorized - Sesión expirada')
        }
        
        window._redirectingToLogin = true
        
        // Verificar si hay una sesión activa
        try {
          const authCheck = await fetch(`${API_BASE_URL}/api/auth/check`, {
            credentials: 'include'
          })
          
          if (!authCheck.ok) {
            // Si la verificación falla, redirigir a login
            console.warn('🔐 Sesión expirada, redirigiendo a login...')
            setTimeout(() => {
              window.location.href = '/login'
            }, 500)
            throw new Error('Unauthorized - Sesión expirada')
          }
        } catch (authError) {
          // Si falla la verificación, redirigir a login
          console.warn('🔐 Error verificando autenticación, redirigiendo a login...')
          setTimeout(() => {
            window.location.href = '/login'
          }, 500)
          throw new Error('Unauthorized - Sesión expirada')
        }
        
        // Si la verificación es exitosa pero aún recibimos 401, puede ser un problema de permisos
        console.warn('⚠️ Sesión válida pero recibiendo 401 - puede ser un problema de permisos')
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.ok) {
        // Intentar obtener el mensaje de error del body
        let errorMessage = `HTTP error! status: ${response.status}`
        let errorData = null
        try {
          const text = await response.text()
          if (text) {
            try {
              errorData = JSON.parse(text)
              if (errorData.message) {
                errorMessage = errorData.message
              } else if (errorData.error) {
                errorMessage = errorData.error
              }
            } catch (e) {
              // Si no es JSON, usar el texto como mensaje
              errorMessage = text || errorMessage
            }
          }
        } catch (e) {
          // Si no se puede leer el body, usar el mensaje por defecto
        }
        const error = new Error(errorMessage)
        error.status = response.status
        error.response = { 
          status: response.status,
          data: errorData
        }
        throw error
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Para endpoints que pueden fallar silenciosamente (como /sap/orderConsump/add),
      // solo loguear como warning en lugar de error
      if (endpoint.includes('/sap/orderConsump/add')) {
        console.warn(`⚠️ El backend no pudo procesar ${endpoint} (esto es esperado por ahora):`, error.message);
      } else {
      console.error(`Error en GET ${endpoint}:`, error);
      }
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
        // Evitar múltiples redirecciones
        if (window._redirectingToLogin) {
          throw new Error('Unauthorized - Sesión expirada')
        }
        
        window._redirectingToLogin = true
        
        try {
          const authCheck = await fetch(`${API_BASE_URL}/api/auth/check`, {
            credentials: 'include'
          })
          
          if (!authCheck.ok) {
            console.warn('🔐 Sesión expirada, redirigiendo a login...')
            setTimeout(() => {
              window.location.href = '/login'
            }, 500)
            throw new Error('Unauthorized - Sesión expirada')
          }
        } catch (authError) {
          console.warn('🔐 Error verificando autenticación, redirigiendo a login...')
          setTimeout(() => {
            window.location.href = '/login'
          }, 500)
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






