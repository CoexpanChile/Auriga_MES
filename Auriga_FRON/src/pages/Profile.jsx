import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { useLanguage } from '../context/LanguageContext';
import { logout } from '../utils/auth';

const Profile = () => {
  const auth = useAuth();
  const { permissions } = usePermissions();
  const { t } = useLanguage();


  if (auth.isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p>{t.common?.loading || 'Cargando...'}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Perfil de Usuario</h1>

      {auth?.user && (
        <div style={{
          background: '#e8f5e8',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h2 style={{ marginBottom: '15px' }}>{auth.user.name || 'Usuario'}</h2>
          <p><strong>Email:</strong> {auth.user.email || 'N/A'}</p>
          <p><strong>ID:</strong> {auth.user.id || 'N/A'}</p>
        </div>
      )}

      {permissions && permissions.organization && (
        <div style={{
          background: '#e3f2fd',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginBottom: '15px' }}>Información de Organización</h3>
          <p><strong>Organización:</strong> {permissions.organization.name || 'N/A'}</p>
          <p><strong>Departamento:</strong> {permissions.organization.departamento || 'N/A'}</p>
          <p><strong>Cargo:</strong> {permissions.organization.cargo || 'N/A'}</p>
          <p><strong>Estado:</strong> {permissions.organization.status || 'N/A'}</p>
        </div>
      )}

      {permissions && (
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginBottom: '15px' }}>Permisos y Accesos</h3>
          <p><strong>Fábricas:</strong> {permissions.permissions?.factories?.join(', ') || 'Ninguna'}</p>
          <p><strong>Roles:</strong> {permissions.permissions?.roles?.join(', ') || 'Ninguno'}</p>
          <p><strong>Departamentos:</strong> {permissions.permissions?.departments?.join(', ') || 'Ninguno'}</p>
          <p><strong>Grupos:</strong> {permissions.user?.groups?.join(', ') || 'Ninguno'}</p>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={logout}
          style={{
            background: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {t.common?.logout || 'Cerrar Sesión'}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Profile;

