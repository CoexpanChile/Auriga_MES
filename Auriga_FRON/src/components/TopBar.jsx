import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';
import { logout } from '../utils/auth';
import LanguageSelector from './LanguageSelector';

const TopBar = () => {
  const auth = useAuth();
  const { tenant } = useTenant();
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [showPlantMenu, setShowPlantMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const currentLocation = {
    country: 'CX',
    countryName: 'Chile (CXC)',
    plant: 'Planta Principal CXC (63 líneas)',
    full: 'Chile - Planta Principal CXC'
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed top-0 left-64 right-0 z-40 flex items-center justify-between px-6">
      {/* Left: Location Selectors */}
      <div className="flex items-center gap-3">
        {/* Country Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowCountryMenu(!showCountryMenu);
              setShowPlantMenu(false);
            }}
            className="px-3 py-1.5 bg-blue-600 dark:bg-blue-700 text-white text-sm rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition flex items-center gap-1"
          >
            <span>{currentLocation.country}</span>
            <span className="text-xs">▼</span>
          </button>
          {showCountryMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2 min-w-[180px] z-50">
              <div className="px-3 py-2 text-sm">
                <div className="font-medium text-gray-900 dark:text-white">{currentLocation.countryName}</div>
              </div>
            </div>
          )}
        </div>

        {/* Plant Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowPlantMenu(!showPlantMenu);
              setShowCountryMenu(false);
            }}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-1"
          >
            <span>{currentLocation.plant}</span>
            <span className="text-xs">▼</span>
          </button>
          {showPlantMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2 min-w-[250px] z-50">
              <div className="px-3 py-2 text-sm">
                <div className="font-medium text-gray-900 dark:text-white">{currentLocation.plant}</div>
              </div>
            </div>
          )}
        </div>

        {/* Full Location Button */}
        <button className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition">
          {currentLocation.full}
        </button>
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

