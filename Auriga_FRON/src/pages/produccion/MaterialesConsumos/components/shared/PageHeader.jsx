import { useNavigate } from 'react-router-dom'
import { BoxSelect, Home, ChevronRight } from 'lucide-react'

/**
 * Componente de encabezado de página con breadcrumbs
 */
export function PageHeader({ currentFactory, isGlobalView, lastUpdate }) {
  const navigate = useNavigate()

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <BoxSelect className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Materiales y Consumibles</h1>
            <p className="text-gray-400 mt-1">
              {isGlobalView ? 'Todas las fábricas' : `Fábrica: ${currentFactory}`}
            </p>
          </div>
        </div>
        {lastUpdate && (
          <div className="text-sm text-gray-400">
            Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
          </div>
        )}
      </div>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4" aria-label="Breadcrumb">
        <button
          onClick={() => navigate('/dashboard')}
          className="hover:text-white transition-colors flex items-center gap-1"
        >
          <Home className="w-4 h-4" />
          Dashboard
        </button>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white">Materiales y Consumibles</span>
      </nav>
    </div>
  )
}
