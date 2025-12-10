import axios from 'axios'

// Crear instancia de axios con configuración base
const httpClient = axios.create({
  baseURL: 'http://18.213.58.26:8081',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para logging en desarrollo
if (import.meta.env.DEV) {
  httpClient.interceptors.request.use(
    config => {
      console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data
      })
      return config
    },
    error => {
      console.error('❌ Request error:', error)
      return Promise.reject(error)
    }
  )
}

// Interceptor para manejo de respuestas y errores
httpClient.interceptors.response.use(
  response => {
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      })
    }
    return response
  },
  async error => {
    const originalRequest = error.config

    // Manejo de 401 (Unauthorized)
    if (error.response?.status === 401) {
      // Evitar múltiples redirecciones
      if (originalRequest._retry) {
        return Promise.reject(error)
      }
      
      originalRequest._retry = true
      
      console.warn('🔐 401 Unauthorized - Verificando sesión...')
      
      try {
        // Verificar si la sesión es válida
        const authCheck = await fetch('http://18.213.58.26:8081/api/auth/check', {
          credentials: 'include'
        })
        
        if (!authCheck.ok) {
          console.error('❌ Sesión inválida, redirigiendo a login...')
          // Evitar múltiples redirecciones
          if (!window._redirectingToLogin) {
            window._redirectingToLogin = true
            setTimeout(() => {
              window.location.href = '/login'
            }, 500)
          }
          return Promise.reject(error)
        }
        
        // Si la sesión es válida pero aún recibimos 401, puede ser un problema de permisos
        console.warn('⚠️ Sesión válida pero recibiendo 401 - puede ser un problema de permisos')
        return Promise.reject(error)
      } catch (authError) {
        console.error('❌ Error verificando autenticación:', authError)
        // Evitar múltiples redirecciones
        if (!window._redirectingToLogin) {
          window._redirectingToLogin = true
          setTimeout(() => {
            window.location.href = '/login'
          }, 500)
        }
        return Promise.reject(error)
      }
    }

    // Manejo de 403 (Forbidden)
    if (error.response?.status === 403) {
      console.error('🚫 403 Forbidden - Sin permisos para este recurso')
    }

    // Manejo de 500 (Internal Server Error)
    if (error.response?.status === 500) {
      console.error('💥 500 Internal Server Error:', error.response?.data)
    }

    // Log de errores en desarrollo
    if (import.meta.env.DEV) {
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
    }

    return Promise.reject(error)
  }
)

export default httpClient






