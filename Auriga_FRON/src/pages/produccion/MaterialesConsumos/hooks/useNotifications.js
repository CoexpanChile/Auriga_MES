import { useState, useCallback } from 'react'

/**
 * Hook para manejar notificaciones de error y éxito
 * Centraliza la lógica de mensajes temporales
 */
export function useNotifications() {
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const showError = useCallback((message, duration = null) => {
    setError(message)
    if (duration) {
      setTimeout(() => setError(null), duration)
    }
  }, [])

  const showSuccess = useCallback((message, duration = 3000) => {
    setSuccess(message)
    if (duration) {
      setTimeout(() => setSuccess(null), duration)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearSuccess = useCallback(() => {
    setSuccess(null)
  }, [])

  const clearAll = useCallback(() => {
    setError(null)
    setSuccess(null)
  }, [])

  return {
    error,
    success,
    showError,
    showSuccess,
    clearError,
    clearSuccess,
    clearAll
  }
}
