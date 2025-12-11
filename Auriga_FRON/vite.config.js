import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5826,
    host: '0.0.0.0',
    // Middleware para interceptar /auth/* antes de servir archivos
    middlewareMode: false,
    proxy: {
      // Proxy para /auth/* - DEBE estar primero para tener prioridad
      '/auth': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // No reescribir la ruta
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Auth proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Auth proxy - Sending Request to Backend:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Auth proxy - Received Response from Backend:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        // Reescribir rutas: /api/asset -> /asset, /api/sap -> /sap, etc.
        // Pero mantener /api/auth, /api/admin, /api/users como están (el backend las usa con /api)
        rewrite: (path) => {
          // Mantener estas rutas sin cambios (el backend las usa con prefijo /api)
          if (path.startsWith('/api/auth') || 
              path.startsWith('/api/admin') || 
              path.startsWith('/api/users') ||
              path.startsWith('/api/my-groups') ||
              path.startsWith('/api/token-info') ||
              path.startsWith('/api/protected-data')) {
            return path;
          }
          // Para otras rutas, quitar el prefijo /api
          // /api/asset/list -> /asset/list
          // /api/sap/orders -> /sap/orders
          return path.replace(/^\/api/, '');
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('API proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('API proxy - Sending Request to Backend:', req.method, req.url);
            // Asegurar que las cookies se pasen al backend
            if (req.headers.cookie) {
              proxyReq.setHeader('Cookie', req.headers.cookie);
              console.log('✅ [PROXY] Cookie header pasado al backend');
            } else {
              console.log('⚠️ [PROXY] No hay cookies en la petición');
            }
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('API proxy - Received Response from Backend:', proxyRes.statusCode, req.url);
            // Asegurar que las cookies de respuesta se pasen al frontend
            if (proxyRes.headers['set-cookie']) {
              _res.setHeader('Set-Cookie', proxyRes.headers['set-cookie']);
            }
          });
        },
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  // Configurar para que el proxy tenga prioridad sobre el servidor de archivos estáticos
  preview: {
    port: 5826,
    host: '0.0.0.0',
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('API proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('API proxy - Sending Request to Backend:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('API proxy - Received Response from Backend:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/auth': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Auth proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Auth proxy - Sending Request to Backend:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Auth proxy - Received Response from Backend:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  }
})
