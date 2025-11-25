// Utilidades para manejar autenticación y cookies
// Importar función de limpieza completa desde clearSession.js para evitar duplicación
import { clearEverything } from './clearSession.js';

const API_BASE_URL = ''; // Usar rutas relativas por el proxy

export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

export const getUserSession = () => {
  try {
    const cookie = getCookie('user_data');
    if (cookie) {
      const decoded = atob(cookie);
      return JSON.parse(decoded);
    }
  } catch (error) {
    console.error('Error reading user session:', error);
  }
  return null;
};

export const isAuthenticated = () => {
  const sessionActive = getCookie('session_active') === 'true';
  const authToken = getCookie('auth_token');
  return !!(sessionActive && authToken);
};

export const getCurrentUser = () => {
  const session = getUserSession();
  return session || null;
};

export const checkServerAuth = async () => {
  try {
    console.log('🔍 [checkServerAuth] Iniciando verificación de autenticación...')
    const url = '/api/auth/check'
    console.log('🔍 [checkServerAuth] URL:', url)
    console.log('🔍 [checkServerAuth] Credentials disponibles:', document.cookie)
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch(fetchError => {
      console.error('❌ [checkServerAuth] Error de red:', fetchError)
      throw fetchError
    });

    console.log('🔍 [checkServerAuth] Status:', response.status)
    console.log('🔍 [checkServerAuth] OK:', response.ok)
    console.log('🔍 [checkServerAuth] Status text:', response.statusText)

    if (!response.ok) {
      let errorText = ''
      try {
        errorText = await response.text()
        console.error('❌ [checkServerAuth] Error HTTP:', response.status, errorText)
      } catch (textError) {
        console.error('❌ [checkServerAuth] No se pudo leer el texto de error:', textError)
      }
      // No lanzar error, solo retornar no autenticado
      return { authenticated: false, message: `HTTP ${response.status}` };
    }

    const data = await response.json();
    console.log('✅ [checkServerAuth] Datos recibidos:', data)
    return data;
  } catch (error) {
    // Logging detallado del error
    console.error('❌ [checkServerAuth] Error completo:', error);
    console.error('❌ [checkServerAuth] Tipo de error:', error.name);
    console.error('❌ [checkServerAuth] Mensaje:', error.message);
    console.error('❌ [checkServerAuth] Causa:', error.cause);
    if (error.stack) {
      console.error('❌ [checkServerAuth] Stack:', error.stack);
    }
    
    // Mostrar error completo en consola para debugging
    const errorInfo = {
      name: error.name,
      message: error.message,
      cause: error.cause,
      stack: error.stack
    };
    console.error('❌ [checkServerAuth] Información completa del error:', JSON.stringify(errorInfo, null, 2));
    
    // Retornar no autenticado con información del error
    return { 
      authenticated: false, 
      error: error.message || 'Error desconocido',
      errorDetails: errorInfo
    };
  }
};

export const logout = async () => {
  try {
    // Llamar al endpoint de logout del servidor
    const response = await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch(error => {
      // Continuar con la limpieza local incluso si el servidor falla
      console.warn('Logout server call failed, continuing with local cleanup:', error);
      return null;
    });

    // Limpiar cookies, storage y cache del lado del cliente ANTES de redirigir
    await clearEverything();

    // Si el servidor retornó una URL de logout de Authentik, redirigir allí
    if (response && response.ok) {
      try {
        const data = await response.json();
        if (data.logout_url && data.redirect) {
          // Redirigir a Authentik para cerrar sesión allí también
          console.log('Redirecting to Authentik logout:', data.logout_url);
          window.location.href = data.logout_url;
          return; // No continuar con el código siguiente
        }
      } catch (jsonError) {
        console.warn('Failed to parse logout response, redirecting to login:', jsonError);
      }
    }

    // Si no hay URL de logout de Authentik, redirigir directamente al login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout error:', error);
    // En caso de error, limpiar localmente y redirigir
    await clearEverything();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
};

// API calls
export const apiRequest = async (endpoint, options = {}) => {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`/api${endpoint}`, {
      ...defaultOptions,
      ...options,
    });

    if (response.status === 401) {
      // No autenticado
      window.location.href = '/login';
      return null;
    }

    if (response.status === 403) {
      throw new Error('No tienes permisos para acceder a este recurso');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export const fetchUserData = () => apiRequest('/users/me');
export const fetchTokenInfo = () => apiRequest('/token-info');
export const fetchMyGroups = () => apiRequest('/my-groups');
export const fetchProtectedData = () => apiRequest('/protected-data');