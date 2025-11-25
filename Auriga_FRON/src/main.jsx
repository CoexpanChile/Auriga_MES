import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Nota: La interceptación de /auth/* se maneja en index.html (script inline)
// que se ejecuta ANTES de que React se cargue. Este archivo solo monta React.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)