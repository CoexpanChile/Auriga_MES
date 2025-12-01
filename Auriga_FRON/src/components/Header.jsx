import { useState } from 'react'
import { LogOut, ChevronDown, Factory } from 'lucide-react'
import { cn } from '../lib/utils'

function Header({ onLogout, userName, factories, selectedFactory, onFactoryChange, factoryCode, navigate }) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showFactoriesMenu, setShowFactoriesMenu] = useState(false)

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu)
  }

  const toggleFactoriesMenu = () => {
    setShowFactoriesMenu(!showFactoriesMenu)
  }

  // Orden fijo de fábricas (orden descendente de prioridad)
  const FACTORY_ORDER = [
    'FPC', 'FPL', 'FSP', 'CXM', 'CXF', 'CXE', 'CXD', 'CXC', 'CXB', 
    'EXT', 'MNT', 'RTP', 'ITC'
  ]

  const handleFactorySelect = (factory) => {
    // "CX" = Coexpan Global (todas las fábricas)
    // Solo permitir CX si el usuario tiene acceso (está en la lista de factories)
    let newFactory = factory
    if (!factory && factories && factories.includes('CX')) {
      newFactory = 'CX'
    } else if (!factory) {
      // Si no hay factory seleccionada y no tiene acceso a CX, usar la primera del orden fijo
      for (const orderedFactory of FACTORY_ORDER) {
        if (factories && factories.includes(orderedFactory)) {
          newFactory = orderedFactory
          break
        }
      }
      // Si no encuentra ninguna del orden, usar la primera disponible
      if (!newFactory && factories && factories.length > 0) {
        newFactory = factories[0]
      }
    }
    
    // Actualizar la fábrica seleccionada sin cambiar la URL
    if (onFactoryChange && newFactory) {
      onFactoryChange(newFactory)
    }
    // Guardar en localStorage
    if (newFactory) {
      localStorage.setItem('selectedFactory', newFactory)
    } else {
      localStorage.removeItem('selectedFactory')
    }
    // Disparar evento personalizado para notificar a otros componentes
    window.dispatchEvent(new CustomEvent('factoryChanged', { 
      detail: { factory: newFactory } 
    }))
    setShowFactoriesMenu(false)
    // No navegar - mantener la ruta actual
  }

  const getFactoryFlag = (factoryCode) => {
    const flags = {
      'CXB': '🇧🇷', 'CXC': '🇨🇱', 'CXD': '🇩🇪', 'CXE': '🇪🇸',
      'CXF': '🇫🇷', 'CXM': '🇲🇽', 'EXT': '🇷🇺', 'FSP': '🇫🇷',
      'FPC': '🇫🇷', 'FPL': '🇫🇷', 'MNT': '🇮🇹', 'RTP': '🇪🇸', 'ITC': '🇪🇸'
    }
    return flags[factoryCode] || '🏭'
  }

  const handleLogout = async () => {
    setShowUserMenu(false)
    if (onLogout) {
      await onLogout()
    }
  }

  return (
    <header className="sticky top-0 z-40 h-16 bg-gray-800 border-b border-gray-700 shadow-sm">
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        {/* Logo y Título */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none" className="flex-shrink-0">
              <rect width="100" height="100" rx="15" fill="#2563eb"/>
              <path d="M30 70L50 30L70 70H30Z" fill="white" stroke="white" strokeWidth="4"/>
              <circle cx="50" cy="50" r="8" fill="white"/>
            </svg>
            <span className="text-xl font-bold text-white">Auriga</span>
          </div>

          {/* Dropdown de Fábricas */}
          <div className="relative">
            <button
              onClick={toggleFactoriesMenu}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <Factory size={18} className="text-blue-400" />
              <span className="text-sm font-medium text-white">
                {selectedFactory ? (
                  <>
                    <span className="mr-1">{getFactoryFlag(selectedFactory)}</span>
                    {selectedFactory}
                  </>
                ) : (
                  <>
                    <span className="mr-1">🌐</span>
                    Todas
                  </>
                )}
              </span>
              <ChevronDown 
                size={16} 
                className={`text-gray-400 transition-transform ${showFactoriesMenu ? 'rotate-180' : ''}`}
              />
            </button>

            {showFactoriesMenu && (
              <>
                {/* Overlay */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowFactoriesMenu(false)}
                />
                
                {/* Dropdown de Fábricas */}
                <div className="absolute left-0 mt-2 w-72 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 max-h-96 overflow-y-auto">
                  {/* Header */}
                  <div className="p-3 border-b border-gray-700">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Seleccionar Fábrica
                    </p>
                  </div>
                  
                  {/* Opción "Todas" - Solo mostrar si el usuario tiene acceso a CX */}
                  {factories && factories.includes('CX') && (
                    <>
                      <div className="p-2">
                        <button
                          onClick={() => handleFactorySelect(null)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm",
                            !selectedFactory
                              ? "bg-blue-600 text-white"
                              : "text-gray-300 hover:bg-gray-700 hover:text-white"
                          )}
                        >
                          <span className="text-lg">🌐</span>
                          <span className="font-medium">Todas las Fábricas</span>
                        </button>
                      </div>

                      {/* Separador */}
                      <div className="h-px bg-gray-700 mx-2" />
                    </>
                  )}

                  {/* Lista de Fábricas - Ordenadas según FACTORY_ORDER */}
                  <div className="p-2 space-y-1">
                    {factories && factories.length > 0 ? (
                      (() => {
                        // Ordenar fábricas según FACTORY_ORDER
                        const sortedFactories = [...factories].sort((a, b) => {
                          const indexA = FACTORY_ORDER.indexOf(a)
                          const indexB = FACTORY_ORDER.indexOf(b)
                          // Si ambas están en el orden, usar el índice
                          if (indexA !== -1 && indexB !== -1) return indexA - indexB
                          // Si solo una está en el orden, ponerla primero
                          if (indexA !== -1) return -1
                          if (indexB !== -1) return 1
                          // Si ninguna está en el orden, mantener orden alfabético
                          return a.localeCompare(b)
                        })
                        
                        return sortedFactories.map(factory => (
                          <button
                            key={factory}
                            onClick={() => handleFactorySelect(factory)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm",
                              selectedFactory === factory
                                ? "bg-blue-600 text-white"
                                : "text-gray-300 hover:bg-gray-700 hover:text-white"
                            )}
                          >
                            <span className="text-lg">{getFactoryFlag(factory)}</span>
                            <span>{factory}</span>
                          </button>
                        ))
                      })()
                    ) : (
                      <div className="px-3 py-4 text-xs text-gray-500 text-center">
                        Cargando fábricas...
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={toggleUserMenu}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
              {userName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="text-sm font-medium text-gray-100 hidden sm:block">{userName}</span>
            <ChevronDown 
              size={16} 
              className={`text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {showUserMenu && (
            <>
              {/* Overlay para cerrar el menu */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowUserMenu(false)}
              />
              
              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
                {/* Header del menu */}
                <div className="p-4 border-b border-gray-700">
                  <p className="text-sm font-semibold text-white">{userName}</p>
                  <p className="text-xs text-gray-400 mt-1">Usuario del Sistema</p>
                </div>
                
                {/* Opciones */}
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors"
                  >
                    <LogOut size={18} />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header