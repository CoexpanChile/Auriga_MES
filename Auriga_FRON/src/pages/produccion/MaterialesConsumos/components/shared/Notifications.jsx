import { AlertCircle, CheckCircle2, X } from 'lucide-react'

/**
 * Componente para mostrar notificaciones de error y éxito
 * Incluye accesibilidad y mejor UX
 */
export function Notifications({ error, success, onClearError, onClearSuccess }) {
  if (!error && !success) return null

  return (
    <div className="mb-6 space-y-3">
      {error && (
        <div
          className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-start gap-3"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-red-400 flex-1">{error}</span>
          {onClearError && (
            <button
              onClick={onClearError}
              className="p-1 hover:bg-red-900/30 rounded transition-colors"
              aria-label="Cerrar mensaje de error"
            >
              <X className="w-4 h-4 text-red-400" />
            </button>
          )}
        </div>
      )}

      {success && (
        <div
          className="bg-green-900/20 border border-green-500 rounded-lg p-4 flex items-start gap-3"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <span className="text-green-400 flex-1">{success}</span>
          {onClearSuccess && (
            <button
              onClick={onClearSuccess}
              className="p-1 hover:bg-green-900/30 rounded transition-colors"
              aria-label="Cerrar mensaje de éxito"
            >
              <X className="w-4 h-4 text-green-400" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
