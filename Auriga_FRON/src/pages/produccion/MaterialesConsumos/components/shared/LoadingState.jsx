import { Loader2 } from 'lucide-react'

/**
 * Componente para estados de carga consistentes
 */
export function LoadingState({ message = 'Cargando...', fullScreen = false }) {
  const containerClass = fullScreen
    ? 'min-h-screen bg-gray-900 p-6 flex items-center justify-center'
    : 'p-12 text-center'

  return (
    <div className={containerClass}>
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-400">{message}</p>
      </div>
    </div>
  )
}

/**
 * Componente para estados vacíos consistentes
 */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="p-12 text-center">
      {Icon && <Icon className="w-16 h-16 text-gray-600 mx-auto mb-4" />}
      <p className="text-gray-400 text-lg mb-2">{title}</p>
      {description && <p className="text-gray-500 text-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
