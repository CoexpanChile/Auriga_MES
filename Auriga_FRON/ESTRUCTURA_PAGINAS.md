# Estructura de Páginas del Sistema MES

## 📁 Organización

```
src/pages/
├── Dashboard.jsx
├── Login.jsx
├── Profile.jsx
│
├── produccion/
│   ├── OrdenesFabricacion.jsx
│   ├── Programacion.jsx
│   ├── OEEMetricas.jsx
│   ├── MaterialesConsumos.jsx
│   └── LotesTrazabilidad.jsx
│
├── personas/
│   ├── Turnos.jsx
│   ├── Empleados.jsx
│   ├── TurnosAsignados.jsx
│   ├── HorariosTrabajo.jsx
│   ├── Asistencia.jsx
│   ├── Asignaciones.jsx
│   ├── SalidasEspeciales.jsx
│   └── Evaluaciones.jsx
│
├── calidad/
│   ├── PlanesInspeccion.jsx
│   ├── AutocontrolCalidad.jsx
│   ├── RegistrosAutocontrol.jsx
│   ├── CaracteristicasCalidad.jsx
│   ├── Defectos.jsx
│   ├── ControlEstadistico.jsx
│   ├── AccionesCorrectivas.jsx
│   └── Certificados.jsx
│
├── procesos/
│   ├── DatosMaestrosProcesos.jsx
│   ├── ParametrosProcesos.jsx
│   ├── BOMRutas.jsx
│   ├── InstruccionesTrabajo.jsx
│   ├── ControlProceso.jsx
│   └── ProcesosAutomaticos.jsx
│
├── activos/
│   ├── JerarquiaActivos.jsx
│   ├── Lineas.jsx
│   ├── lines/
│   │   └── LineAssets.jsx
│   ├── EstadosDisponibilidad.jsx
│   └── EspecificacionesTecnicas.jsx
│
├── seguridad/
│   ├── Riesgos.jsx
│   ├── InspeccionesSeguridad.jsx
│   ├── Accidentes.jsx
│   ├── Capacitaciones.jsx
│   ├── EPP.jsx
│   └── SaludOcupacional.jsx
│
├── configuracion/
│   └── ConfiguracionGeneral.jsx (reutilizable)
│
├── administracion/
│   ├── Seguridad.jsx
│   ├── Usuarios.jsx
│   ├── Roles.jsx
│   └── RolesPermisos.jsx
│
└── mobile/
    └── ScanQR.jsx
```

## 🔐 Sistema de Permisos

Todas las rutas están protegidas con el sistema de permisos basado en:
- Factory (Fábrica)
- Department (Departamento)
- Role (Rol)
- Group (Grupo)

Ver: `src/config/routePermissions.js`

## 🌍 Multiidioma

Todas las páginas soportan 6 idiomas:
- 🇪🇸 Español (es)
- 🇬🇧 English (en)
- 🇩🇪 Deutsch (de)
- 🇫🇷 Français (fr)
- 🇮🇹 Italiano (it)
- 🇷🇺 Русский (ru)

