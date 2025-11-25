import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';
import { useFactories } from '../hooks/useFactories';
import { usePlants } from '../hooks/usePlants';
import { logout } from '../utils/auth';
import LanguageSelector from './LanguageSelector';

const TopBar = () => {
  const auth = useAuth();
  const { tenant, selectFactory, selectHierarchicalLevel } = useTenant();
  const { factories, loading: factoriesLoading } = useFactories();
  const { plants, loading: plantsLoading } = usePlants();
  const [showFactoryMenu, setShowFactoryMenu] = useState(false);
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [showPlantMenu, setShowPlantMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Separar CX (visibilidad completa) de las fábricas específicas
  const corporateFactory = factories.find(f => f.code === 'CX');
  const specificFactories = factories.filter(f => f.code !== 'CX');
  
  // Debug: Verificar qué fábricas se están recibiendo
  useEffect(() => {
    console.log('[TopBar] Factories recibidas:', factories);
    console.log('[TopBar] Corporate factory:', corporateFactory);
    console.log('[TopBar] Specific factories:', specificFactories);
    console.log('[TopBar] Loading:', factoriesLoading);
  }, [factories, corporateFactory, specificFactories, factoriesLoading]);
  
  // Factory seleccionada - es global
  // Si es "CX" = visibilidad completa (hierarchical_level null)
  // Si es una fábrica específica = nivel 0 del hierarchical_level
  const selectedFactory = tenant?.factory || tenant?.hierarchicalLevel0 || 'CX';
  const isFullVisibility = selectedFactory === 'CX' || !tenant?.hierarchicalLevel || tenant?.hierarchicalLevel.length === 0;
  
  // Planta seleccionada (nivel 1 del hierarchical_level)
  const selectedPlant = tenant?.hierarchicalLevel && tenant.hierarchicalLevel.length > 1 
    ? tenant.hierarchicalLevel[1] 
    : null;
  
  // Determinar si mostrar el selector de planta
  // Solo se muestra si hay una fábrica seleccionada (no CX) y hay plantas disponibles
  const showPlantSelector = !isFullVisibility && plants.length > 0;
  
  // Si solo hay una planta disponible, no mostrar dropdown, solo el texto
  const hasMultiplePlants = plants.length > 1;
  
  // Actualizar cuando cambie la fábrica desde otro lugar
  useEffect(() => {
    const handleFactoryChange = (event) => {
      // La fábrica ya se actualizó en el contexto
      // Solo necesitamos cerrar los menús si están abiertos
      setShowFactoryMenu(false);
      setShowCountryMenu(false);
      setShowPlantMenu(false);
    };
    
    window.addEventListener('factoryChanged', handleFactoryChange);
    return () => window.removeEventListener('factoryChanged', handleFactoryChange);
  }, []);

  const handleFactorySelect = (factory) => {
    // Si se selecciona "CX" = visibilidad completa (hierarchical_level null)
    // Si se selecciona una fábrica específica = hierarchical_level nivel 0 [factory]
    selectFactory(factory);
    setShowFactoryMenu(false);
    setShowCountryMenu(false);
    setShowPlantMenu(false);
  };
  
  const handlePlantSelect = (plantCode) => {
    // Actualizar el hierarchical_level completo con la planta seleccionada
    if (selectedFactory && selectedFactory !== 'CX') {
      const newHierarchicalLevel = [selectedFactory, plantCode];
      selectHierarchicalLevel(newHierarchicalLevel);
    }
    setShowPlantMenu(false);
  };

  const handleCountrySelect = () => {
    // Seleccionar "CX" = visibilidad completa
    selectFactory('CX');
    setShowCountryMenu(false);
  };

  const currentLocation = {
    country: 'CX',
    countryName: isFullVisibility ? 'Chile (Visibilidad Completa)' : `Chile (${selectedFactory})`
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed top-0 left-64 right-0 z-40 flex items-center justify-between px-6">
      {/* Left: Location Selectors */}
      <div className="flex items-center gap-3">
        {/* Factory/Country Button - Selección global de fábrica CX (nivel 0) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowCountryMenu(!showCountryMenu);
              setShowFactoryMenu(false);
              setShowPlantMenu(false);
            }}
            className="px-3 py-1.5 bg-blue-600 dark:bg-blue-700 text-white text-sm rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition flex items-center gap-1"
          >
            <span>{isFullVisibility ? 'CX' : selectedFactory}</span>
            <span className="text-xs">▼</span>
          </button>
          {showCountryMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2 min-w-[220px] z-50 max-h-[500px] overflow-y-auto">
              
              {/* Opción CX - Visibilidad Completa */}
              {corporateFactory && (
                <button
                  onClick={handleCountrySelect}
                  className={`w-full px-3 py-2 text-sm text-left rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition mb-2 border-b border-gray-200 dark:border-gray-700 ${
                    isFullVisibility
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{corporateFactory.displayName}</span>
                    {isFullVisibility && (
                      <span className="text-blue-600 dark:text-blue-400">✓</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Todas las fábricas
                  </div>
                </button>
              )}

              {/* Lista de fábricas específicas */}
              {factoriesLoading ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  Cargando fábricas...
                </div>
              ) : (
                specificFactories.map((factory) => (
                  <button
                    key={factory.code}
                    onClick={() => handleFactorySelect(factory.code)}
                    className={`w-full px-3 py-2 text-sm text-left rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                      selectedFactory === factory.code && !isFullVisibility
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{factory.displayName}</span>
                      {selectedFactory === factory.code && !isFullVisibility && (
                        <span className="text-blue-600 dark:text-blue-400">✓</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Planta Principal {factory.code}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        
        {/* Plant Selector - Solo se muestra si hay una fábrica seleccionada y hay plantas disponibles */}
        {showPlantSelector && (
          <div className="relative">
            {hasMultiplePlants ? (
              // Si hay múltiples plantas, mostrar dropdown
              <>
                <button
                  onClick={() => {
                    setShowPlantMenu(!showPlantMenu);
                    setShowCountryMenu(false);
                    setShowFactoryMenu(false);
                  }}
                  className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-1"
                >
                  <span>{selectedPlant || plants[0]?.code || 'Planta'}</span>
                  <span className="text-xs">▼</span>
                </button>
                {showPlantMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2 min-w-[200px] z-50 max-h-[400px] overflow-y-auto">
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Seleccionar Planta
                    </div>
                    {plantsLoading ? (
                      <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                        Cargando plantas...
                      </div>
                    ) : (
                      plants.map((plant) => (
                        <button
                          key={plant.code}
                          onClick={() => handlePlantSelect(plant.code)}
                          className={`w-full px-3 py-2 text-sm text-left rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                            selectedPlant === plant.code
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{plant.displayName}</span>
                            {selectedPlant === plant.code && (
                              <span className="text-blue-600 dark:text-blue-400">✓</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {plant.factoryCode} - {plant.location}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            ) : (
              // Si solo hay una planta, mostrar solo el texto sin dropdown
              <div className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-md flex items-center gap-1">
                <span>{plants[0]?.displayName || plants[0]?.code || 'Planta'}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: User Info and Actions */}
      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          title="Toggle dark mode"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        {/* User Info */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {auth?.user?.name || auth?.apiUserData?.name || 'admin'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
              {auth?.user?.role || auth?.apiUserData?.role || 'ADMIN'}
            </span>
          </div>
        </div>

        {/* User Icon */}
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>

        {/* Logout Icon */}
        <button
          onClick={logout}
          className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition"
          title="Cerrar Sesión"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>

        {/* User Menu Dropdown */}
        {showUserMenu && (
          <div className="absolute top-16 right-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg min-w-[200px] z-50">
            <div className="py-2">
              <button
                onClick={logout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}

        {/* Language Selector */}
        <LanguageSelector />
      </div>
    </header>
  );
};

export default TopBar;

