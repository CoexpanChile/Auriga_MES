/**
 * Utilidades para limpiar completamente la sesión, cookies y caché
 */

/**
 * Limpia todas las cookies relacionadas con autenticación
 * Intenta múltiples variantes de dominio y path para asegurar limpieza completa
 */
export const clearAllAuthCookies = () => {
  const cookiesToClear = ['auth_token', 'user_data', 'session_active'];
  const hostname = window.location.hostname;
  const hostnameParts = hostname.split('.');
  
  // Variantes de dominio a probar
  const domainVariants = [
    hostname,                    // dominio completo con puerto
    hostname.split(':')[0],     // dominio sin puerto
    `.${hostname.split(':')[0]}`, // dominio con punto inicial
    ...(hostnameParts.length > 1 ? [
      hostnameParts.slice(-2).join('.'), // dominio de segundo nivel
      `.${hostnameParts.slice(-2).join('.')}`, // dominio de segundo nivel con punto
    ] : []),
  ];
  
  // Paths a probar
  const paths = ['/', '/auth', '/dashboard', '/login'];
  
  cookiesToClear.forEach(cookieName => {
    // Limpiar para cada variante de dominio
    domainVariants.forEach(domain => {
      paths.forEach(path => {
        // Método 1: expires en el pasado
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
        // Método 2: maxAge = 0
        document.cookie = `${cookieName}=; max-age=0; path=${path}; domain=${domain};`;
        // Método 3: sin dominio (para cookies sin dominio específico)
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
        document.cookie = `${cookieName}=; max-age=0; path=${path};`;
      });
    });
    
    // Intentar limpiar sin especificar dominio ni path
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    document.cookie = `${cookieName}=; max-age=0;`;
  });
  
  // Limpiar todas las cookies visibles
  const allCookies = document.cookie.split(';');
  allCookies.forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    if (name && (name.includes('auth') || name.includes('session') || name.includes('token'))) {
      domainVariants.forEach(domain => {
        paths.forEach(path => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
          document.cookie = `${name}=; max-age=0; path=${path}; domain=${domain};`;
        });
      });
    }
  });
  
  console.log('🧹 [clearAllAuthCookies] Todas las cookies de autenticación limpiadas');
};

/**
 * Limpia localStorage y sessionStorage completamente
 */
export const clearAllStorage = () => {
  try {
    // Limpiar localStorage
    localStorage.clear();
    // Intentar limpiar claves específicas también
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach(key => {
      if (key.includes('auth') || key.includes('session') || key.includes('token') || key.includes('user')) {
        localStorage.removeItem(key);
      }
    });
    
    // Limpiar sessionStorage
    sessionStorage.clear();
    // Intentar limpiar claves específicas también
    const sessionStorageKeys = Object.keys(sessionStorage);
    sessionStorageKeys.forEach(key => {
      if (key.includes('auth') || key.includes('session') || key.includes('token') || key.includes('user')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('🧹 [clearAllStorage] localStorage y sessionStorage limpiados');
  } catch (error) {
    console.warn('⚠️ [clearAllStorage] Error al limpiar storage:', error);
  }
};

/**
 * Limpia el caché del navegador de forma exhaustiva
 */
export const clearAllCache = async () => {
  try {
    // Limpiar Cache API
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log(`🗑️ [clearAllCache] Eliminando cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
      console.log('🧹 [clearAllCache] Todos los caches eliminados');
    }
    
    // Limpiar service workers si existen
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => {
          console.log(`🗑️ [clearAllCache] Desregistrando service worker`);
          return registration.unregister();
        })
      );
    }
    
    // Forzar recarga sin caché (usando meta tag o headers)
    if (window.location.reload) {
      // Esto se hará después de limpiar todo
    }
  } catch (error) {
    console.warn('⚠️ [clearAllCache] Error al limpiar cache:', error);
  }
};

/**
 * Limpia TODO: cookies, storage y cache
 * Retorna una promesa que se resuelve cuando todo está limpio
 */
export const clearEverything = async () => {
  console.log('🧹 [clearEverything] Iniciando limpieza completa...');
  
  // 1. Limpiar cookies
  clearAllAuthCookies();
  
  // 2. Limpiar storage
  clearAllStorage();
  
  // 3. Limpiar cache (async)
  await clearAllCache();
  
  // 4. Pequeño delay para asegurar que todo se procese
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('✅ [clearEverything] Limpieza completa finalizada');
  
  // Verificar que las cookies se limpiaron
  const remainingCookies = document.cookie;
  if (remainingCookies) {
    console.warn('⚠️ [clearEverything] Aún quedan cookies:', remainingCookies);
  } else {
    console.log('✅ [clearEverything] Todas las cookies eliminadas');
  }
};





