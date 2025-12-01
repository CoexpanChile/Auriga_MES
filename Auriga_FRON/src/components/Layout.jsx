import React, { useState, useEffect, useCallback } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function Layout({ children, onLogout, userName, factories, selectedFactory, onFactoryChange, factoryCode, navigate }) {
  // Estado para controlar si el sidebar está visible
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    // Cargar preferencia desde localStorage
    const saved = localStorage.getItem('sidebarVisible')
    return saved !== null ? saved === 'true' : true
  })

  // Guardar preferencia en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('sidebarVisible', sidebarVisible.toString())
  }, [sidebarVisible])

  const toggleSidebar = useCallback(() => {
    setSidebarVisible(prev => !prev)
  }, [])

  // Atajo de teclado: Ctrl+B para toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <Header 
        onLogout={onLogout}
        userName={userName}
        factories={factories}
        selectedFactory={selectedFactory}
        onFactoryChange={onFactoryChange}
        factoryCode={factoryCode}
        navigate={navigate}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex relative">
        {/* Botón para ocultar/mostrar sidebar */}
        <button
          onClick={toggleSidebar}
          className={`absolute top-4 z-50 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-r-lg p-2.5 shadow-lg transition-all duration-300 hover:scale-105 ${
            sidebarVisible ? 'left-64' : 'left-0'
          }`}
          title={sidebarVisible ? 'Ocultar menú (Ctrl+B)' : 'Mostrar menú (Ctrl+B)'}
          aria-label={sidebarVisible ? 'Ocultar menú' : 'Mostrar menú'}
        >
          {sidebarVisible ? (
            <ChevronLeft size={18} className="text-gray-300" />
          ) : (
            <ChevronRight size={18} className="text-gray-300" />
          )}
        </button>

        {/* Sidebar */}
        <div className={`transition-all duration-300 ease-in-out flex-shrink-0 ${
          sidebarVisible ? 'w-64' : 'w-0'
        } overflow-hidden`}>
          <Sidebar 
            selectedFactory={selectedFactory} 
            factoryCode={factoryCode}
            isVisible={sidebarVisible}
          />
        </div>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout