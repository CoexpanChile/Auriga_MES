/**
 * Utilidad para forzar el logout de Authentik desde el frontend
 * Esto ayuda a cerrar la sesión de Authentik cuando hay un usuario bloqueado
 */

/**
 * Fuerza el logout de Authentik usando un iframe oculto
 * Esto cierra la sesión de Authentik sin redirigir la página principal
 */
export const forceAuthentikLogout = (authentikBaseURL, appSlug = 'cx-auriga') => {
  return new Promise((resolve, reject) => {
    try {
      // Construir la URL del endpoint end-session de Authentik
      const issuerBase = authentikBaseURL.endsWith('/') 
        ? authentikBaseURL.slice(0, -1) 
        : authentikBaseURL;
      
      const endSessionURL = `${issuerBase}/application/o/${appSlug}/end-session/`;
      
      console.log('🚪 [forceAuthentikLogout] Forzando logout de Authentik:', endSessionURL);
      
      // Crear un iframe oculto para forzar el logout
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      
      // Configurar el src del iframe para que apunte al logout
      iframe.src = endSessionURL;
      
      // Agregar event listeners
      iframe.onload = () => {
        console.log('✅ [forceAuthentikLogout] Iframe de logout cargado');
        // Esperar un momento para que el logout se procese
        setTimeout(() => {
          document.body.removeChild(iframe);
          console.log('✅ [forceAuthentikLogout] Logout de Authentik forzado');
          resolve();
        }, 500);
      };
      
      iframe.onerror = (error) => {
        console.warn('⚠️ [forceAuthentikLogout] Error al cargar iframe de logout:', error);
        document.body.removeChild(iframe);
        // Continuar de todas formas
        resolve();
      };
      
      // Agregar el iframe al DOM
      document.body.appendChild(iframe);
      
      // Timeout de seguridad
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        console.log('✅ [forceAuthentikLogout] Timeout alcanzado, continuando');
        resolve();
      }, 2000);
      
    } catch (error) {
      console.error('❌ [forceAuthentikLogout] Error:', error);
      reject(error);
    }
  });
};

/**
 * Fuerza el logout de Authentik usando window.open y luego lo cierra
 */
export const forceAuthentikLogoutWithWindow = (authentikBaseURL, appSlug = 'cx-auriga') => {
  return new Promise((resolve) => {
    try {
      const issuerBase = authentikBaseURL.endsWith('/') 
        ? authentikBaseURL.slice(0, -1) 
        : authentikBaseURL;
      
      const endSessionURL = `${issuerBase}/application/o/${appSlug}/end-session/`;
      
      console.log('🚪 [forceAuthentikLogoutWithWindow] Abriendo ventana de logout:', endSessionURL);
      
      // Abrir una ventana pequeña para el logout
      const logoutWindow = window.open(
        endSessionURL,
        'authentik_logout',
        'width=1,height=1,left=-1000,top=-1000'
      );
      
      if (logoutWindow) {
        // Cerrar la ventana después de un momento
        setTimeout(() => {
          try {
            logoutWindow.close();
            console.log('✅ [forceAuthentikLogoutWithWindow] Ventana de logout cerrada');
          } catch (e) {
            console.warn('⚠️ [forceAuthentikLogoutWithWindow] No se pudo cerrar la ventana:', e);
          }
          resolve();
        }, 1000);
      } else {
        console.warn('⚠️ [forceAuthentikLogoutWithWindow] No se pudo abrir ventana de logout (puede estar bloqueado por popup blocker)');
        resolve();
      }
    } catch (error) {
      console.error('❌ [forceAuthentikLogoutWithWindow] Error:', error);
      resolve(); // Continuar de todas formas
    }
  });
};






