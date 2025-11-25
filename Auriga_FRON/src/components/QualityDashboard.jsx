import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Dashboard para usuarios del departamento de Quality
 * Requiere: Factory CXC, Department Quality, Role Supervisor o Manager
 */
const QualityDashboard = () => {
  const { permissions, checkRole, checkFactoryAccess } = usePermissions();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard de Calidad</h1>
      
      {permissions && (
        <div style={{
          background: '#e8f5e8',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h2>Información de Permisos</h2>
          <p><strong>Fábricas:</strong> {permissions.permissions?.factories?.join(', ') || 'N/A'}</p>
          <p><strong>Roles:</strong> {permissions.permissions?.roles?.join(', ') || 'N/A'}</p>
          <p><strong>Departamentos:</strong> {permissions.permissions?.departments?.join(', ') || 'N/A'}</p>
          
          <div style={{ marginTop: '15px' }}>
            <h3>Verificaciones de Acceso:</h3>
            <ul>
              <li>Acceso a CXC: {checkFactoryAccess('CXC') ? '✅ Sí' : '❌ No'}</li>
              <li>Rol Supervisor en CXC/Quality: {checkRole('Supervisor', 'CXC', 'Quality') ? '✅ Sí' : '❌ No'}</li>
              <li>Rol Manager en CXM/Quality: {checkRole('Manager', 'CXM', 'Quality') ? '✅ Sí' : '❌ No'}</li>
            </ul>
          </div>
        </div>
      )}

      <div style={{
        background: '#e3f2fd',
        padding: '15px',
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <h2>Funcionalidades de Calidad</h2>
        <ul>
          <li>Gestión de inspecciones</li>
          <li>Control de calidad</li>
          <li>Reportes de no conformidades</li>
          <li>Análisis de tendencias</li>
        </ul>
      </div>
    </div>
  );
};

export default QualityDashboard;






