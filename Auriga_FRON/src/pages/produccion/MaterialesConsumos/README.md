# MaterialesConsumos - Arquitectura Refactorizada

## 📁 Estructura de Carpetas

```
MaterialesConsumos/
├── MaterialesConsumos.jsx          # Componente principal (refactorizado)
├── README.md                        # Este archivo
├── hooks/                           # Custom hooks reutilizables
│   ├── index.js                    # Exportaciones centralizadas
│   ├── useNotifications.js         # Manejo de mensajes error/éxito
│   ├── useFactorySync.js           # Sincronización con fábrica seleccionada
│   └── useOrderManagement.js       # Gestión de órdenes de fabricación
├── components/                      # Componentes React
│   ├── LineSelector/               # Selección de líneas
│   │   └── LineCard.jsx            # Tarjeta de línea optimizada
│   ├── OrderManager/               # Gestión de órdenes
│   ├── RecipeViewer/               # Visualización de recetas
│   ├── DoserManager/               # Gestión de dosificadores
│   │   └── DoserCard.jsx           # Tarjeta de dosificador optimizada
│   └── shared/                     # Componentes compartidos
│       ├── Notifications.jsx       # Mensajes de error/éxito
│       ├── LoadingState.jsx        # Estados de carga
│       └── PageHeader.jsx          # Encabezado de página
└── utils/                          # Utilidades y helpers
```

## 🎯 Hooks Personalizados

### useNotifications()

Maneja mensajes de error y éxito de forma centralizada.

**Retorna:**
- `error`: Mensaje de error actual
- `success`: Mensaje de éxito actual
- `showError(message, duration?)`: Muestra mensaje de error
- `showSuccess(message, duration?)`: Muestra mensaje de éxito
- `clearError()`: Limpia mensaje de error
- `clearSuccess()`: Limpia mensaje de éxito
- `clearAll()`: Limpia todos los mensajes

**Ejemplo:**
```javascript
const { error, success, showError, showSuccess } = useNotifications()

// Mostrar error con auto-cierre en 5 segundos
showError('Error al cargar datos', 5000)

// Mostrar éxito con auto-cierre por defecto (3 segundos)
showSuccess('Datos guardados exitosamente')
```

### useFactorySync()

Sincroniza la fábrica seleccionada desde localStorage sin polling.

**Retorna:**
- `currentFactory`: Fábrica actual seleccionada
- `isGlobalView`: Boolean indicando si es vista global
- `setCurrentFactory(factory)`: Actualiza fábrica manualmente

**Ejemplo:**
```javascript
const { currentFactory, isGlobalView } = useFactorySync()

if (isGlobalView) {
  return <GlobalView />
} else {
  return <FactoryView factory={currentFactory} />
}
```

### useOrderManagement()

Gestiona selección, inicio, fin y edición de órdenes de fabricación.

**Parámetros:**
- `selectedLine`: Línea de producción seleccionada
- `refetchOrders`: Función para recargar órdenes
- `refetchRecipe`: Función para recargar receta

**Retorna:**
- `selectedOrder`: Orden seleccionada actualmente
- `editingDates`: Orden cuyas fechas se están editando
- `dateEdit`: Objeto con fechas { start, end }
- `tempDates`: Fechas temporales por orden
- `updatingOrder`: ID de orden siendo actualizada
- `handleSelectOrder(order)`: Selecciona una orden
- `handleStartFinish(orderNumber, action, onSuccess, onError)`: Inicia/finaliza orden
- `handleEditDates(order)`: Habilita edición de fechas
- `handleIniciar(orderNumber, onSuccess, onError)`: Guarda fecha de inicio
- `handleFin(orderNumber, onSuccess)`: Guarda fecha de fin
- `handleCancelEditDates()`: Cancela edición de fechas
- `handleSaveAll(onSuccess, onError)`: Guarda todo (fechas + asignaciones)
- `setDateEdit`: Setter para fechas en edición

**Ejemplo:**
```javascript
const orderManagement = useOrderManagement(
  selectedLine,
  refetchOrders,
  refetchRecipe
)

const { selectedOrder, handleSelectOrder, handleStartFinish } = orderManagement

// Seleccionar orden
handleSelectOrder(order)

// Iniciar orden
handleStartFinish(
  order.OrderNumber,
  'Start',
  (msg) => showSuccess(msg),
  (msg) => showError(msg)
)
```

## 🧩 Componentes Compartidos

### Notifications

Componente para mostrar mensajes de error y éxito con accesibilidad.

**Props:**
- `error`: Mensaje de error a mostrar
- `success`: Mensaje de éxito a mostrar
- `onClearError`: Callback al cerrar error
- `onClearSuccess`: Callback al cerrar éxito

**Ejemplo:**
```javascript
<Notifications
  error={error}
  success={success}
  onClearError={clearError}
  onClearSuccess={clearSuccess}
/>
```

### LoadingState

Estados de carga consistentes.

**Props:**
- `message`: Mensaje a mostrar (default: "Cargando...")
- `fullScreen`: Boolean para pantalla completa (default: false)

**Ejemplo:**
```javascript
{isLoading && <LoadingState message="Cargando líneas..." />}
```

### EmptyState

Estados vacíos consistentes.

**Props:**
- `icon`: Componente de ícono Lucide
- `title`: Título principal
- `description`: Descripción opcional
- `action`: Elemento React para acción opcional

**Ejemplo:**
```javascript
<EmptyState
  icon={Factory}
  title="No hay líneas disponibles"
  description="Selecciona una fábrica primero"
/>
```

### PageHeader

Encabezado de página con breadcrumbs.

**Props:**
- `currentFactory`: Fábrica actual
- `isGlobalView`: Vista global o específica
- `lastUpdate`: Fecha de última actualización

### LineCard

Tarjeta optimizada para mostrar línea de producción.

**Props:**
- `line`: Objeto con datos de la línea
- `onClick`: Callback al hacer clic

**Optimizaciones:**
- Comparación eficiente en `memo`
- Sin uso de `JSON.stringify`

### DoserCard

Tarjeta optimizada para mostrar dosificador.

**Props:**
- `doser`: Objeto con datos del dosificador
- `assignedHoppers`: Array de hoppers asignados
- `onAddHopper`: Callback para agregar hopper
- `onDeleteAssignment`: Callback para eliminar asignación

**Optimizaciones:**
- Comparación eficiente de arrays
- Accesibilidad mejorada

## 🚀 Mejoras Implementadas

### ✅ Rendimiento
- Eliminado polling innecesario (cada 3 segundos)
- Comparaciones memo optimizadas sin `JSON.stringify`
- Componentes memoizados correctamente

### ✅ Mantenibilidad
- Código modular y reutilizable
- Separación de responsabilidades
- Hooks personalizados para lógica de negocio

### ✅ Accesibilidad
- Roles ARIA en notificaciones
- Labels descriptivos en botones
- Navegación por teclado mejorada

### ✅ UX
- Mensajes de error con botón de cierre
- Estados de carga más descriptivos
- Feedback visual consistente

## 📋 Próximos Pasos

1. **Migrar componente principal**: Actualizar `MaterialesConsumos.jsx` para usar los nuevos hooks y componentes
2. **Extraer componentes restantes**: OrderManager, RecipeViewer
3. **Agregar tests**: Tests unitarios para hooks y componentes
4. **Optimizar queries**: Implementar paginación para líneas
5. **Error boundary**: Agregar manejo de errores a nivel de componente

## 🐛 Código Eliminado

- ❌ `loadRecipe()` - Función obsoleta (React Query lo maneja)
- ❌ `loadConsumptions()` - Función obsoleta (React Query lo maneja)
- ❌ Polling de `setInterval` cada 3 segundos
- ❌ Código comentado y sin usar

## 📖 Convenciones de Código

- Componentes en PascalCase
- Hooks en camelCase con prefijo `use`
- Archivos de componentes exportan default
- Archivos de hooks exportan named
- JSDoc en funciones complejas
- PropTypes o TypeScript (futuro)
