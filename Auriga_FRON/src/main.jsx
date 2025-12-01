import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Nota: La interceptación de /auth/* se maneja en index.html (script inline)
// que se ejecuta ANTES de que React se cargue. Este archivo solo monta React.

// Filtrar errores de extensiones del navegador que no afectan la aplicación
const originalError = window.console.error
window.console.error = (...args) => {
  const errorMessage = args.join(' ')
  
  // Filtrar errores comunes de extensiones del navegador
  if (
    errorMessage.includes('message channel closed') ||
    errorMessage.includes('asynchronous response') ||
    errorMessage.includes('Extension context invalidated') ||
    errorMessage.includes('Receiving end does not exist')
  ) {
    // Ignorar estos errores silenciosamente
    return
  }
  
  // Mostrar otros errores normalmente
  originalError.apply(console, args)
}

// Manejar errores no capturados de promesas
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message || String(event.reason || '')
  
  // Filtrar errores comunes de extensiones del navegador
  if (
    errorMessage.includes('message channel closed') ||
    errorMessage.includes('asynchronous response') ||
    errorMessage.includes('Extension context invalidated') ||
    errorMessage.includes('Receiving end does not exist')
  ) {
    // Prevenir que el error se muestre en la consola
    event.preventDefault()
    return
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)