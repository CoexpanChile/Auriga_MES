import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Dashboard para usuarios del departamento de Maintenance
 * Requiere: Factory CXC, Department Maintenance, Role Planner
 */
const MaintenanceDashboard = () => {
  const { permissions, checkRole, checkFactoryAccess } = usePermissions();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard de Mantenimiento</h1>
      
      {permissions && (
        <div style={{
          background: '#fff3e0',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h2>Información de Permisos</h2>
          <p><strong>Fábricas:</strong> {permissions.permissions?.factories?.join(', ') || 'N/A'}</p>
          <p><strong>Roles:</strong> {permissions.permissions?.roles?.join(', ') || 'N/A'}</p>
          
          <div style={{ marginTop: '15px' }}>
            <h3>Verificaciones de Acceso:</h3>
            <ul>
              <li>Acceso a CXC: {checkFactoryAccess('CXC') ? '✅ Sí' : '❌ No'}</li>
              <li>Rol Planner en CXC/Maintenance: {checkRole('Planner', 'CXC', 'Maintenance') ? '✅ Sí' : '❌ No'}</li>
            </ul>
          </div>
        </div>
      )}

      <div style={{
        background: '#f3e5f5',
        padding: '15px',
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <h2>Funcionalidades de Mantenimiento</h2>
        <ul>
          <li>Planificación de mantenimiento</li>
          <li>Órdenes de trabajo</li>
          <li>Gestión de equipos</li>
          <li>Historial de mantenimientos</li>
        </ul>
      </div>
    </div>
  );
};

export default MaintenanceDashboard;






