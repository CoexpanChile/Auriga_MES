import '../styles/Card.css'

function FactoriesCard({ factories, permissions }) {
  const factoryInfo = {
    'CXB': { name: 'Brasil - Jundiai', country: '🇧🇷', color: '#10b981' },
    'CXC': { name: 'Chile - Quilicura', country: '🇨🇱', color: '#3b82f6' },
    'CXD': { name: 'Alemania - Bad Kreuznach', country: '🇩🇪', color: '#f59e0b' },
    'CXE': { name: 'España - Alcalá de Henares', country: '🇪🇸', color: '#ef4444' },
    'CXF': { name: 'Francia - Beaucouzé', country: '🇫🇷', color: '#8b5cf6' },
    'CXM': { name: 'México - El Marques', country: '🇲🇽', color: '#06b6d4' },
    'EXT': { name: 'Rusia - Naro-Fominsk', country: '🇷🇺', color: '#ec4899' },
    'FSP': { name: 'Francia - Roye', country: '🇫🇷', color: '#8b5cf6' },
    'FPC': { name: 'Francia - Chantrans', country: '🇫🇷', color: '#8b5cf6' },
    'FPL': { name: 'Francia - Beaucouzé', country: '🇫🇷', color: '#8b5cf6' },
    'MNT': { name: 'Italia - Sumirago', country: '🇮🇹', color: '#10b981' },
    'RTP': { name: 'España - El Campillo', country: '🇪🇸', color: '#ef4444' },
    'ITC': { name: 'España - Alcalá de Henares', country: '🇪🇸', color: '#ef4444' }
  }

  const isGlobalAccess = permissions?.assignments?.some(a => a.scope === 'Global') || false
  const totalFactories = Object.keys(factoryInfo).length

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon" style={{ backgroundColor: '#f59e0b' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" fill="currentColor"/>
          </svg>
        </div>
        <h2>Fábricas Accesibles</h2>
      </div>

      <div className="card-content">
        {isGlobalAccess && (
          <div className="access-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#10b981"/>
            </svg>
            <span>Tienes acceso global a todas las fábricas ({totalFactories})</span>
          </div>
        )}

        {factories && factories.length > 0 ? (
          <div className="factories-grid">
            {factories.map((factoryCode) => {
              const info = factoryInfo[factoryCode] || { 
                name: factoryCode, 
                country: '🏭', 
                color: '#6b7280' 
              }
              
              return (
                <div key={factoryCode} className="factory-card">
                  <div 
                    className="factory-icon"
                    style={{ backgroundColor: info.color }}
                  >
                    <span className="factory-country">{info.country}</span>
                  </div>
                  <div className="factory-info">
                    <h3 className="factory-code">{factoryCode}</h3>
                    <p className="factory-name">{info.name}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" fill="#9ca3af"/>
            </svg>
            <p>No tienes acceso a ninguna fábrica específica</p>
            <p className="small-text">Contacta con tu administrador para obtener permisos</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default FactoriesCard