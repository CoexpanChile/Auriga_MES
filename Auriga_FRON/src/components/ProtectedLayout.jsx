import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import ProtectedRoute from './ProtectedRoute';
import PermissionRoute from './PermissionRoute';

/**
 * Layout wrapper que incluye Header y protección de rutas
 */
const ProtectedLayout = ({ 
  children, 
  requireAuth = true,
  permission,
  factory,
  department,
  role,
  group
}) => {
  const location = useLocation();
  
  // No mostrar header en login
  const showHeader = location.pathname !== '/login' && !location.pathname.startsWith('/auth/');

  let content = children;

  // Aplicar protecciones si se requieren
  if (requireAuth) {
    content = <ProtectedRoute>{content}</ProtectedRoute>;
  }

  if (permission || factory || department || role || group) {
    content = (
      <ProtectedRoute>
        <PermissionRoute
          permission={permission}
          factory={factory}
          department={department}
          role={role}
          group={group}
          redirectTo="/dashboard"
        >
          {content}
        </PermissionRoute>
      </ProtectedRoute>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {showHeader && <Header />}
      <main>
        {content}
      </main>
    </div>
  );
};

export default ProtectedLayout;




