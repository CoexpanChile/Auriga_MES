import React, { useEffect, useState } from 'react'
import { checkServerAuth } from '../utils/auth'

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null)

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        console.log('🔍 [ProtectedRoute] Verificando autenticación...')
        const auth = await checkServerAuth()
        console.log('🔍 [ProtectedRoute] Respuesta de autenticación:', auth)
        setIsAuthenticated(auth.authenticated)
        
        if (!auth.authenticated) {
          console.warn('⚠️ [ProtectedRoute] No autenticado, redirigiendo a /login')
          window.location.href = '/login'
        } else {
          console.log('✅ [ProtectedRoute] Usuario autenticado')
        }
      } catch (error) {
        // Logging detallado del error
        console.error('❌ [ProtectedRoute] Error verificando autenticación:', error)
        console.error('❌ [ProtectedRoute] Tipo de error:', error?.name || 'Unknown')
        console.error('❌ [ProtectedRoute] Mensaje:', error?.message || 'Error sin mensaje')
        console.error('❌ [ProtectedRoute] Stack:', error?.stack || 'Sin stack')
        
        // Mostrar información completa del error
        const errorInfo = {
          name: error?.name || 'Unknown',
          message: error?.message || 'Error desconocido',
          stack: error?.stack || 'Sin stack trace',
          fullError: error
        };
        console.error('❌ [ProtectedRoute] Información completa del error:', JSON.stringify(errorInfo, null, 2));
        
        setIsAuthenticated(false)
        // Redirigir después de un breve delay para permitir que se vean los logs
        setTimeout(() => {
        window.location.href = '/login'
        }, 100)
      }
    }

    verifyAuth()
  }, [])

  if (isAuthenticated === null) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Ya se redirigió a login
  }

  return children
}

export default ProtectedRoute