import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { clearEverything } from '../utils/clearSession';
import { forceAuthentikLogout } from '../utils/forceAuthentikLogout';

const Login = () => {
  const { t } = useLanguage();
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    // Verificar si hay un error en la URL (del callback)
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorMessageParam = urlParams.get('message');
    const logoutComplete = urlParams.get('_logout_complete') === '1';
    
    // Si hay un error de cuenta deshabilitada, limpiar TODAS las cookies y cache
    if (error === 'account_disabled') {
      console.log('🚫 [Login] Error de cuenta deshabilitada detectado');
      if (logoutComplete) {
        console.log('✅ [Login] Logout de Authentik completado, limpiando todo...');
      } else {
        console.log('🧹 [Login] Limpiando todo...');
      }
      
      // Limpiar TODO de forma asíncrona pero sin esperar
      clearEverything().then(() => {
        console.log('✅ [Login] Limpieza completa finalizada');
        if (logoutComplete) {
          console.log('✅ [Login] Sesión de Authentik cerrada y limpieza completada');
        }
      }).catch(err => {
        console.error('❌ [Login] Error en limpieza:', err);
      });
      
      setErrorMessage(errorMessageParam 
        ? decodeURIComponent(errorMessageParam)
        : (t.errors?.accountDisabled || 'Tu cuenta ha sido deshabilitada. Por favor, contacta a tu administrador.'));
    } else if (error === 'code_expired') {
      // También limpiar para códigos expirados
      clearEverything().catch(err => {
        console.error('❌ [Login] Error en limpieza:', err);
      });
      setErrorMessage(t.errors?.codeExpired || 'El código de autorización ha expirado. Por favor, intenta iniciar sesión nuevamente.');
    } else if (errorMessageParam) {
      // Decodificar el mensaje si viene codificado
      try {
        setErrorMessage(decodeURIComponent(errorMessageParam));
      } catch {
        setErrorMessage(errorMessageParam);
      }
    } else {
      // Solo verificar sesión activa si no hay error
      const sessionActive = document.cookie.includes('session_active=true');
      if (sessionActive) {
        window.location.href = '/dashboard';
      }
    }

    // Limpiar los parámetros de error de la URL
    if (error || errorMessageParam) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [t]);

  const handleLogin = async () => {
    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log('🔘 [Login] Botón de login presionado');
    }

    // Guardar si hay error ANTES de limpiar (necesario para construir URL)
    const hasError = !!errorMessage;
    const urlParams = new URLSearchParams(window.location.search);
    const hasClearedParam = urlParams.get('_cleared') === '1';
    const forceNewLogin = hasError || hasClearedParam;

    // Si hay un error previo, limpiar TODO y forzar logout de Authentik
    if (hasError) {
      console.log('🧹 [Login] Limpiando todo antes de nuevo intento de login...');
      console.log('🧹 [Login] Estado ANTES de limpieza - Cookies:', document.cookie);
      
      // Limpiar TODO y esperar a que termine
      try {
        await clearEverything();
        console.log('✅ [Login] Limpieza completa antes de redirigir');
        console.log('🧹 [Login] Estado DESPUÉS de limpieza - Cookies:', document.cookie);
        
        // Forzar logout de Authentik desde el frontend
        // Esto ayuda a cerrar la sesión de Authentik que puede estar causando el bucle
        const authentikBaseURL = 'http://18.232.248.24:38006'; // URL base de Authentik
        console.log('🚪 [Login] Forzando logout de Authentik desde frontend...');
        try {
          await forceAuthentikLogout(authentikBaseURL, 'cx-auriga');
          console.log('✅ [Login] Logout de Authentik forzado desde frontend');
        } catch (logoutError) {
          console.warn('⚠️ [Login] Error al forzar logout de Authentik:', logoutError);
          // Continuar de todas formas
        }
        
        // Pequeño delay adicional para asegurar que todo se procese
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error('❌ [Login] Error en limpieza:', err);
        // Continuar de todas formas
      }
    }

    // Limpiar cualquier mensaje de error previo
    setErrorMessage(null);

    // Detectar backend según hostname
    const hostname = window.location.hostname;
    
    let backendURL = hostname === '18.213.58.26'
      ? 'http://18.213.58.26:8081/auth/login'
      : 'http://localhost:8081/auth/login';
    
    // Si hay error, agregar parámetro para forzar nuevo login con selección de cuenta
    if (forceNewLogin) {
      backendURL += '?force_new_login=true';
      console.log('🔀 [Login] Agregando force_new_login=true para forzar nuevo login');
    }

    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log('🔀 [Login] Redirigiendo a:', backendURL);
      console.log('🔀 [Login] Hostname detectado:', hostname);
      console.log('🔀 [Login] force_new_login:', forceNewLogin);
      console.log('🧹 [Login] Estado final - Cookies:', document.cookie);
      console.log('🧹 [Login] Estado final - localStorage:', Object.keys(localStorage).length, 'items');
      console.log('🧹 [Login] Estado final - sessionStorage:', Object.keys(sessionStorage).length, 'items');
    }

    try {
      // Redirigir directamente al backend
      // Usar replace para evitar que el usuario pueda volver atrás al error
      // Agregar timestamp para evitar caché
      const urlWithTimestamp = `${backendURL}${backendURL.includes('?') ? '&' : '?'}_t=${Date.now()}&_nocache=1`;
      window.location.replace(urlWithTimestamp);
      if (typeof console !== 'undefined' && typeof console.log === 'function') {
        console.log('✅ [Login] Redirección iniciada');
      }
    } catch (error) {
      if (typeof console !== 'undefined' && typeof console.error === 'function') {
        console.error('❌ [Login] Error al redirigir:', error);
      }
      alert(t.errors?.accessDenied || 'Error al redirigir. Por favor, inténtalo de nuevo.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '10px',
        padding: '40px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        maxWidth: '450px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{
          marginBottom: '10px',
          color: '#333',
          fontSize: '28px',
          fontWeight: 'bold'
        }}>
          {t.login?.title || 'Iniciar Sesión'}
        </h1>
        <p style={{
          marginBottom: '30px',
          color: '#666',
          fontSize: '16px'
        }}>
          {t.login?.subtitle || 'Accede a tu cuenta'}
        </p>

        {errorMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            padding: '15px',
            marginBottom: '20px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            color: '#856404',
            textAlign: 'left'
          }}>
            <div style={{
              fontSize: '24px',
              marginRight: '12px',
              flexShrink: 0
            }}>
              ⚠️
            </div>
            <div style={{ flex: 1 }}>
              <strong style={{
                display: 'block',
                marginBottom: '5px',
                fontSize: '14px'
              }}>
                {t.errors?.authenticationError || 'Error de Autenticación'}
              </strong>
              <p style={{
                margin: 0,
                fontSize: '13px',
                lineHeight: '1.4',
                marginBottom: '10px'
              }}>
                {errorMessage}
              </p>
              <p style={{
                margin: 0,
                fontSize: '12px',
                fontStyle: 'italic',
                color: '#856404'
              }}>
                {t.login?.tryAnotherUser || 'Puedes intentar iniciar sesión con otro usuario haciendo clic en el botón de abajo.'}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '15px',
            background: errorMessage ? '#28a745' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background 0.3s',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            marginBottom: '10px'
          }}
          onMouseOver={(e) => e.target.style.background = errorMessage ? '#218838' : '#5568d3'}
          onMouseOut={(e) => e.target.style.background = errorMessage ? '#28a745' : '#667eea'}
        >
          {errorMessage 
            ? (t.login?.tryAgain || 'Intentar con Otro Usuario')
            : (t.login?.button || 'Iniciar Sesión con Authentik')
          }
        </button>
      </div>
    </div>
  );
};

export default Login;

