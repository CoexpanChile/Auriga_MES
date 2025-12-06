import { useState, useEffect } from 'react'

const isDev = import.meta.env.DEV
const debug = {
  log: isDev ? console.log.bind(console) : () => {}
}

/**
 * Hook para sincronizar la fábrica seleccionada desde localStorage
 * Elimina el polling innecesario y usa solo eventos de storage
 */
export function useFactorySync() {
  const [currentFactory, setCurrentFactory] = useState(() => {
    const saved = localStorage.getItem('selectedFactory')
    const factory = (saved && saved !== 'CX' && saved.trim() !== '') ? saved.trim() : null
    debug.log('🏭 Inicializando currentFactory desde localStorage:', { saved, factory })
    return factory
  })

  const isGlobalView = !currentFactory || currentFactory === 'CX'

  useEffect(() => {
    const handleFactoryChange = (event) => {
      const newFactory = event?.detail?.factory || localStorage.getItem('selectedFactory')
      const factoryValue = (newFactory && newFactory !== 'CX' && newFactory.trim() !== '') ? newFactory.trim() : null

      if (factoryValue !== currentFactory) {
        debug.log('🏭 Cambio de fábrica detectado (evento):', { newFactory, factoryValue })
        setCurrentFactory(factoryValue)
      }
    }

    const handleStorageChange = (e) => {
      if (e.key === 'selectedFactory') {
        const savedValue = e.newValue
        const factoryValue = (savedValue && savedValue !== 'CX' && savedValue.trim() !== '') ? savedValue.trim() : null

        if (factoryValue !== currentFactory) {
          debug.log('🏭 Cambio detectado en localStorage (storage event):', { savedValue, factoryValue })
          setCurrentFactory(factoryValue)
        }
      }
    }

    // Suscribirse a eventos
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('factoryChanged', handleFactoryChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('factoryChanged', handleFactoryChange)
    }
  }, [currentFactory])

  return {
    currentFactory,
    isGlobalView,
    setCurrentFactory
  }
}
