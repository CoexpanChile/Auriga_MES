import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { TenantProvider } from './context/TenantContext'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import PermissionRoute from './components/PermissionRoute.jsx'
import Layout from './components/Layout.jsx'

// Páginas Generales
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Profile from './pages/Profile.jsx'

// Gestión Productiva
import OrdenesFabricacion from './pages/produccion/OrdenesFabricacion.jsx'
import Programacion from './pages/produccion/Programacion.jsx'
import OEEMetricas from './pages/produccion/OEEMetricas.jsx'
import MaterialesConsumos from './pages/produccion/MaterialesConsumos.jsx'
import LotesTrazabilidad from './pages/produccion/LotesTrazabilidad.jsx'

// Gestión de Personas
import Turnos from './pages/personas/Turnos.jsx'
import Empleados from './pages/personas/Empleados.jsx'
import TurnosAsignados from './pages/personas/TurnosAsignados.jsx'
import HorariosTrabajo from './pages/personas/HorariosTrabajo.jsx'
import Asistencia from './pages/personas/Asistencia.jsx'
import Asignaciones from './pages/personas/Asignaciones.jsx'
import AsignacionPersonal from './pages/personas/AsignacionPersonal.jsx'
import SalidasEspeciales from './pages/personas/SalidasEspeciales.jsx'
import Evaluaciones from './pages/personas/Evaluaciones.jsx'

// Gestión de Calidad
import PlanesInspeccion from './pages/calidad/PlanesInspeccion.jsx'
import AutocontrolCalidad from './pages/calidad/AutocontrolCalidad.jsx'
import RegistrosAutocontrol from './pages/calidad/RegistrosAutocontrol.jsx'
import CaracteristicasCalidad from './pages/calidad/CaracteristicasCalidad.jsx'
import Defectos from './pages/calidad/Defectos.jsx'
import ControlEstadistico from './pages/calidad/ControlEstadistico.jsx'
import AccionesCorrectivas from './pages/calidad/AccionesCorrectivas.jsx'
import Certificados from './pages/calidad/Certificados.jsx'

// Gestión de Procesos
import DatosMaestrosProcesos from './pages/procesos/DatosMaestrosProcesos.jsx'
import ParametrosProcesos from './pages/procesos/ParametrosProcesos.jsx'
import BOMRutas from './pages/procesos/BOMRutas.jsx'
import InstruccionesTrabajo from './pages/procesos/InstruccionesTrabajo.jsx'
import ControlProceso from './pages/procesos/ControlProceso.jsx'
import ProcesosAutomaticos from './pages/procesos/ProcesosAutomaticos.jsx'

// Gestión de Activos
import JerarquiaActivos from './pages/activos/JerarquiaActivos.jsx'
import Lineas from './pages/activos/Lineas.jsx'
import LineAssets from './pages/activos/lines/LineAssets.jsx'
import EstadosDisponibilidad from './pages/activos/EstadosDisponibilidad.jsx'
import EspecificacionesTecnicas from './pages/activos/EspecificacionesTecnicas.jsx'

// Seguridad y Salud
import Riesgos from './pages/seguridad/Riesgos.jsx'
import InspeccionesSeguridad from './pages/seguridad/InspeccionesSeguridad.jsx'
import Accidentes from './pages/seguridad/Accidentes.jsx'
import Capacitaciones from './pages/seguridad/Capacitaciones.jsx'
import EPP from './pages/seguridad/EPP.jsx'
import SaludOcupacional from './pages/seguridad/SaludOcupacional.jsx'

// Configuración
import ConfigEmpresa from './pages/configuracion/ConfigEmpresa.jsx'
import ConfigPlantas from './pages/configuracion/ConfigPlantas.jsx'
import ConfigCalendario from './pages/configuracion/ConfigCalendario.jsx'
import ConfigTurnos from './pages/configuracion/ConfigTurnos.jsx'
import ConfigZonasHorarias from './pages/configuracion/ConfigZonasHorarias.jsx'
import ConfigUnidades from './pages/configuracion/ConfigUnidades.jsx'
import ConfigMonedas from './pages/configuracion/ConfigMonedas.jsx'

// Administración
import Seguridad from './pages/administracion/Seguridad.jsx'
import Usuarios from './pages/administracion/Usuarios.jsx'
import Roles from './pages/administracion/Roles.jsx'
import RolesPermisos from './pages/administracion/RolesPermisos.jsx'

// Móvil
import ScanQR from './pages/mobile/ScanQR.jsx'

// Componentes legacy (mantener por compatibilidad)
import QualityDashboard from './components/QualityDashboard.jsx'
import MaintenanceDashboard from './components/MaintenanceDashboard.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'

import './App.css'

// Nota: La interceptación de /auth/* se maneja en:
// 1. index.html (script inline) - se ejecuta antes de que React se cargue
// 2. Verificación en App() antes de montar Router - como medida de seguridad

function App() {
  // Nota: La interceptación de /auth/* se maneja en index.html (script inline)
  // Este código es solo una medida de seguridad por si acaso
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/')) {
    const hostname = window.location.hostname
    const backendURL = hostname === '18.213.58.26'
      ? 'http://18.213.58.26:8081'
      : 'http://localhost:8081'
    
    const fullURL = `${backendURL}${window.location.pathname}${window.location.search}${window.location.hash}`
    window.location.replace(fullURL)
    
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Redirigiendo...</p>
      </div>
    )
  }
  
  return (
    <TenantProvider>
      <LanguageProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
      <div className="App">
        <Routes>
          {/* Páginas públicas sin Layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/mobile/scan" element={<ScanQR />} />
          
          {/* Rutas con Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Rutas protegidas */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />

            {/* Gestión Productiva */}
            <Route 
              path="/ordenes-fabricacion" 
              element={
                <ProtectedRoute>
                  <OrdenesFabricacion />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/programacion" 
              element={
                <ProtectedRoute>
                  <Programacion />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/oee-metricas" 
              element={
                <ProtectedRoute>
                  <OEEMetricas />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/materiales-consumos" 
              element={
                <ProtectedRoute>
                  <MaterialesConsumos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lotes-trazabilidad" 
              element={
                <ProtectedRoute>
                  <LotesTrazabilidad />
                </ProtectedRoute>
              } 
            />

            {/* Gestión de Personas */}
            <Route 
              path="/turnos" 
              element={
                <ProtectedRoute>
                  <Turnos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/empleados" 
              element={
                <ProtectedRoute>
                  <Empleados />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/turnos-asignados" 
              element={
                <ProtectedRoute>
                  <TurnosAsignados />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/horarios-trabajo" 
              element={
                <ProtectedRoute>
                  <HorariosTrabajo />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/asistencia" 
              element={
                <ProtectedRoute>
                  <Asistencia />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/asignaciones" 
              element={
                <ProtectedRoute>
                  <Asignaciones />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/asignacion-personal" 
              element={
                <ProtectedRoute>
                  <AsignacionPersonal />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/salidas-especiales" 
              element={
                <ProtectedRoute>
                  <SalidasEspeciales />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/evaluaciones" 
              element={
                <ProtectedRoute>
                  <Evaluaciones />
                </ProtectedRoute>
              } 
            />

            {/* Gestión de Calidad - Protegidas por permisos */}
            <Route 
              path="/planes-inspeccion" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    factory="CXC"
                    department="Quality"
                    role="Supervisor"
                    redirectTo="/dashboard"
                  >
                    <PlanesInspeccion />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/autocontrol-calidad/:planId" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    factory="CXC"
                    department="Quality"
                    role="Supervisor"
                    redirectTo="/dashboard"
                  >
                    <AutocontrolCalidad />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/registros-autocontrol" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    factory="CXC"
                    department="Quality"
                    role="Supervisor"
                    redirectTo="/dashboard"
                  >
                    <RegistrosAutocontrol />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/caracteristicas-calidad" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    factory="CXC"
                    department="Quality"
                    role="Supervisor"
                    redirectTo="/dashboard"
                  >
                    <CaracteristicasCalidad />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/defectos" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    factory="CXC"
                    department="Quality"
                    role="Supervisor"
                    redirectTo="/dashboard"
                  >
                    <Defectos />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/control-estadistico" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    factory="CXC"
                    department="Quality"
                    role="Supervisor"
                    redirectTo="/dashboard"
                  >
                    <ControlEstadistico />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/acciones-correctivas" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    factory="CXC"
                    department="Quality"
                    role="Supervisor"
                    redirectTo="/dashboard"
                  >
                    <AccionesCorrectivas />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/certificados" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    factory="CXC"
                    department="Quality"
                    role="Supervisor"
                    redirectTo="/dashboard"
                  >
                    <Certificados />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />

            {/* Gestión de Procesos */}
            <Route 
              path="/datos-maestros-procesos" 
              element={
                <ProtectedRoute>
                  <DatosMaestrosProcesos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/parametros-procesos" 
              element={
                <ProtectedRoute>
                  <ParametrosProcesos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bom-rutas" 
              element={
                <ProtectedRoute>
                  <BOMRutas />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instrucciones-trabajo" 
              element={
                <ProtectedRoute>
                  <InstruccionesTrabajo />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/control-proceso" 
              element={
                <ProtectedRoute>
                  <ControlProceso />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/procesos-automaticos" 
              element={
                <ProtectedRoute>
                  <ProcesosAutomaticos />
                </ProtectedRoute>
              } 
            />

            {/* Gestión de Activos */}
            <Route 
              path="/jerarquia-activos" 
              element={
                <ProtectedRoute>
                  <JerarquiaActivos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lineas" 
              element={
                <ProtectedRoute>
                  <Lineas />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lines/:lineId/assets" 
              element={
                <ProtectedRoute>
                  <LineAssets />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/estados-disponibilidad" 
              element={
                <ProtectedRoute>
                  <EstadosDisponibilidad />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/especificaciones-tecnicas" 
              element={
                <ProtectedRoute>
                  <EspecificacionesTecnicas />
                </ProtectedRoute>
              } 
            />

            {/* Seguridad y Salud */}
            <Route 
              path="/riesgos" 
              element={
                <ProtectedRoute>
                  <Riesgos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/inspecciones-seguridad" 
              element={
                <ProtectedRoute>
                  <InspeccionesSeguridad />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/accidentes" 
              element={
                <ProtectedRoute>
                  <Accidentes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/capacitaciones" 
              element={
                <ProtectedRoute>
                  <Capacitaciones />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/epp" 
              element={
                <ProtectedRoute>
                  <EPP />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/salud-ocupacional" 
              element={
                <ProtectedRoute>
                  <SaludOcupacional />
                </ProtectedRoute>
              } 
            />

            {/* Configuración - Protegidas por grupo GrAuriga */}
            <Route 
              path="/config-empresa" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    group="GrAuriga"
                    redirectTo="/dashboard"
                  >
                    <ConfigEmpresa />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/config-plantas" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    group="GrAuriga"
                    redirectTo="/dashboard"
                  >
                    <ConfigPlantas />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/config-calendario" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    group="GrAuriga"
                    redirectTo="/dashboard"
                  >
                    <ConfigCalendario />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/config-turnos" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    group="GrAuriga"
                    redirectTo="/dashboard"
                  >
                    <ConfigTurnos />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/config-zonas-horarias" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    group="GrAuriga"
                    redirectTo="/dashboard"
                  >
                    <ConfigZonasHorarias />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/config-unidades" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    group="GrAuriga"
                    redirectTo="/dashboard"
                  >
                    <ConfigUnidades />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/config-monedas" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    group="GrAuriga"
                    redirectTo="/dashboard"
                  >
                    <ConfigMonedas />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />

            {/* Administración - Protegidas por grupo GrAuriga */}
            <Route 
              path="/seguridad" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    group="GrAuriga"
                    redirectTo="/dashboard"
                  >
                    <Seguridad />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/usuarios" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    group="GrAuriga"
                    redirectTo="/dashboard"
                  >
                    <Usuarios />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/roles" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    group="GrAuriga"
                    redirectTo="/dashboard"
                  >
                    <Roles />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/roles-permisos" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    group="GrAuriga"
                    redirectTo="/dashboard"
                  >
                    <RolesPermisos />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />

            {/* Rutas legacy - Mantener por compatibilidad */}
            <Route 
              path="/quality" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    factory="CXC"
                    department="Quality"
                    role="Supervisor"
                    redirectTo="/dashboard"
                  >
                    <QualityDashboard />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/maintenance" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    factory="CXC"
                    department="Maintenance"
                    role="Planner"
                    redirectTo="/dashboard"
                  >
                    <MaintenanceDashboard />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <PermissionRoute
                    group="GrAuriga"
                    redirectTo="/dashboard"
                  >
                    <AdminDashboard />
                  </PermissionRoute>
                </ProtectedRoute>
              } 
            />
          </Route>
        </Routes>
      </div>
        </Router>
      </LanguageProvider>
    </TenantProvider>
  );
}

export default App;
