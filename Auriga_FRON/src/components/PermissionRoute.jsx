import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Componente para proteger rutas basadas en permisos
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componente a renderizar si tiene permisos
 * @param {string} props.factory - Fábrica requerida (opcional)
 * @param {string} props.department - Departamento requerido (opcional)
 * @param {string} props.role - Rol requerido (opcional)
 * @param {string} props.group - Grupo requerido (opcional)
 * @param {string} props.redirectTo - Ruta de redirección si no tiene permisos (default: /dashboard)
 * @param {React.ReactNode} props.fallback - Componente a mostrar mientras carga o si no tiene permisos
 */
const PermissionRoute = ({
  children,
  factory,
  department,
  role,
  group,
  redirectTo = '/dashboard',
  fallback = null,
}) => {
  const { permissions, isLoading, checkPermission } = usePermissions();

  // Mostrar loading mientras se cargan los permisos
  if (isLoading) {
    return fallback || (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no hay permisos cargados, redirigir
  if (!permissions) {
    return <Navigate to={redirectTo} replace />;
  }

  // Verificar permisos
  const hasAccess = checkPermission({ factory, department, role, group });

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }

    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        background: '#fff3cd',
        color: '#856404',
        borderRadius: '5px',
        margin: '20px'
      }}>
        <h2>Acceso Denegado</h2>
        <p>No tienes permisos para acceder a esta sección.</p>
        <p style={{ fontSize: '12px', marginTop: '10px' }}>
          Requisitos:
          {factory && <span> Fábrica: {factory}</span>}
          {department && <span> | Departamento: {department}</span>}
          {role && <span> | Rol: {role}</span>}
          {group && <span> | Grupo: {group}</span>}
        </p>
        <button
          onClick={() => window.location.href = redirectTo}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return children;
};

export default PermissionRoute;






