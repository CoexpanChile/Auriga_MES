import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Dashboard para administradores
 * Requiere: Grupo GrAuriga
 */
const AdminDashboard = () => {
  const { permissions, checkGroup } = usePermissions();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard de Administración</h1>
      
      {permissions && (
        <div style={{
          background: '#ffebee',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h2>Información de Permisos</h2>
          <p><strong>Grupos:</strong> {permissions.user?.groups?.join(', ') || 'N/A'}</p>
          <p><strong>Fábricas:</strong> {permissions.permissions?.factories?.join(', ') || 'N/A'}</p>
          <p><strong>Roles:</strong> {permissions.permissions?.roles?.join(', ') || 'N/A'}</p>
          
          <div style={{ marginTop: '15px' }}>
            <h3>Verificaciones de Acceso:</h3>
            <ul>
              <li>Grupo GrAuriga: {checkGroup('GrAuriga') ? '✅ Sí' : '❌ No'}</li>
            </ul>
          </div>
        </div>
      )}

      <div style={{
        background: '#e0f2f1',
        padding: '15px',
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <h2>Funcionalidades de Administración</h2>
        <ul>
          <li>Gestión de usuarios</li>
          <li>Configuración del sistema</li>
          <li>Reportes administrativos</li>
          <li>Auditoría y logs</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminDashboard;






