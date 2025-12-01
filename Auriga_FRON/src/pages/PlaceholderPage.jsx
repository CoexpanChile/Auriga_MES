import React from 'react'
import { useLocation } from 'react-router-dom'
import { Construction } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

function PlaceholderPage({ title, icon: Icon, description }) {
  const location = useLocation()
  const { t } = useLanguage()
  
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {Icon && <Icon className="w-8 h-8 text-blue-400" />}
            <h1 className="text-3xl font-bold text-white">
              {title || t('module.inDevelopment') || 'Módulo en Desarrollo'}
            </h1>
          </div>
          <p className="text-gray-400">
            {t('route') || 'Ruta'}: <span className="text-blue-400 font-mono">{location.pathname}</span>
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-6">
              <Construction className="w-12 h-12 text-yellow-400" />
            </div>
            
            <h2 className="text-2xl font-semibold text-white mb-3">
              {t('module.underConstruction') || 'Módulo en Construcción'}
            </h2>
            
            <p className="text-gray-400 max-w-md mb-6">
              {description || t('module.comingSoon') || 'Este módulo está en desarrollo. Pronto estará disponible con todas sus funcionalidades.'}
            </p>

            <div className="bg-gray-700 rounded-lg p-4 w-full max-w-md">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">
                {t('module.information') || 'Información del Módulo'}:
              </h3>
              <div className="space-y-2 text-left text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('name') || 'Nombre'}:</span>
                  <span className="text-white font-medium">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('status') || 'Estado'}:</span>
                  <span className="text-yellow-400 font-medium">{t('module.inDevelopment') || 'En Desarrollo'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('version') || 'Versión'}:</span>
                  <span className="text-white font-medium">v1.0 ({t('module.comingSoon') || 'próximamente'})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlaceholderPage








