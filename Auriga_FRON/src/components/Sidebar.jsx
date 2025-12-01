import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard,
  Factory,
  Users,
  Settings,
  Shield,
  ChevronRight,
  ChevronDown,
  Package,
  Calendar,
  BarChart3,
  BoxSelect,
  Search,
  TreePine,
  Zap,
  FileText,
  Clock,
  UserCheck,
  CalendarDays,
  ClipboardList,
  UserPlus,
  DoorOpen,
  CheckSquare,
  Database,
  Sliders,
  GitBranch,
  BookOpen,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Award,
  ShieldAlert,
  ScrollText,
  AlertOctagon,
  GraduationCap,
  HardHat,
  Heart,
  Building2,
  MapPin,
  Timer,
  Globe,
  Ruler,
  DollarSign,
  RefreshCw,
  Monitor,
  User
} from 'lucide-react'
import { cn } from '../lib/utils'

function Sidebar({ selectedFactory, factoryCode, isVisible = true }) {
  const [expandedMenus, setExpandedMenus] = useState({})

  const toggleMenu = (menuName) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }))
  }

  // Rutas sin prefijo de fábrica (normalizadas)
  // La fábrica seleccionada se maneja vía localStorage y no aparece en la URL

  const menuStructure = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Production Management',
      icon: Package,
      submenu: [
        { name: 'Manufacturing Orders', path: '/ordenes-fabricacion', icon: Package },
        { name: 'Scheduling', path: '/programacion', icon: Calendar },
        { name: 'OEE and Metrics', path: '/oee-metricas', icon: BarChart3 },
        { name: 'Materials and Consumables', path: '/materiales-consumos', icon: BoxSelect },
        { name: 'Batches and Traceability', path: '/lotes-trazabilidad', icon: Search },
      ]
    },
    {
      name: 'Asset Management',
      icon: Factory,
      submenu: [
        { name: 'Hierarchy of Assets', path: '/jerarquia-activos', icon: TreePine },
        { name: 'Production Lines', path: '/lineas', icon: Factory },
        { name: 'Status and Availability', path: '/estados-disponibilidad', icon: Zap },
        { name: 'Technical Specifications', path: '/especificaciones-tecnicas', icon: FileText },
      ]
    },
    {
      name: 'People Management',
      icon: Users,
      submenu: [
        { name: 'Shifts', path: '/turnos', icon: Clock },
        { name: 'Employees', path: '/empleados', icon: UserCheck },
        { name: 'Assigned Shifts', path: '/turnos-asignados', icon: CalendarDays },
        { name: 'Work Schedules', path: '/horarios-trabajo', icon: Clock },
        { name: 'Attendance', path: '/asistencia', icon: ClipboardList },
        { name: 'Assignments', path: '/asignaciones', icon: UserPlus },
        { name: 'Special Outings', path: '/salidas-especiales', icon: DoorOpen },
        { name: 'Evaluations', path: '/evaluaciones', icon: CheckSquare },
      ]
    },
    {
      name: 'Process Management',
      icon: GitBranch,
      submenu: [
        { name: 'Process Master Data', path: '/datos-maestros-procesos', icon: Database },
        { name: 'Process Parameters', path: '/parametros-procesos', icon: Sliders },
        { name: 'BOM and Routes', path: '/bom-rutas', icon: GitBranch },
        { name: 'Work Instructions', path: '/instrucciones-trabajo', icon: BookOpen },
        { name: 'Process Control', path: '/control-proceso', icon: Gauge },
      ]
    },
    {
      name: 'Quality Management',
      icon: Award,
      submenu: [
        { name: 'Inspection Plans', path: '/planes-inspeccion', icon: CheckCircle2 },
        { name: 'Quality Characteristics', path: '/caracteristicas-calidad', icon: CheckCircle2 },
        { name: 'Defects and Nonconformities', path: '/defectos', icon: AlertTriangle },
        { name: 'Statistical Process Control', path: '/control-estadistico', icon: TrendingUp },
        { name: 'Corrective Actions', path: '/acciones-correctivas', icon: AlertTriangle },
        { name: 'Certificates and Compliance', path: '/certificados', icon: Award },
      ]
    },
    {
      name: 'Prevention and Safety',
      icon: ShieldAlert,
      submenu: [
        { name: 'Risks and Hazards', path: '/riesgos', icon: AlertTriangle },
        { name: 'Safety Inspections', path: '/inspecciones-seguridad', icon: ScrollText },
        { name: 'Accidents and Incidents', path: '/accidentes', icon: AlertOctagon },
        { name: 'Training', path: '/capacitaciones', icon: GraduationCap },
        { name: 'Personal Protective Equipment (PPE)', path: '/epp', icon: HardHat },
        { name: 'Occupational Health', path: '/salud-ocupacional', icon: Heart },
      ]
    },
    {
      name: 'General Configuration',
      icon: Settings,
      submenu: [
        { name: 'Company Information', path: '/config-empresa', icon: Building2 },
        { name: 'Plants and Locations', path: '/config-plantas', icon: MapPin },
        { name: 'Work Calendar', path: '/config-calendario', icon: Calendar },
        { name: 'Shift Definition', path: '/config-turnos', icon: Clock },
        { name: 'Time Zones', path: '/config-zonas-horarias', icon: Globe },
        { name: 'Units of Measurement', path: '/config-unidades', icon: Ruler },
        { name: 'Currencies', path: '/config-monedas', icon: DollarSign },
        { name: 'Automated Processes', path: '/procesos-automaticos', icon: RefreshCw },
      ]
    },
    {
      name: 'System',
      icon: Shield,
      submenu: [
        { name: 'Monitor', path: '/seguridad', icon: Monitor },
        { name: 'Users', path: '/usuarios', icon: User },
      ]
    },
  ]

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
      {/* Navegación Principal */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuStructure.map((item) => {
          const Icon = item.icon
          const isExpanded = expandedMenus[item.name]
          
          // Si tiene submenú
          if (item.submenu) {
            return (
              <div key={item.name}>
                {/* Parent Menu Item */}
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium',
                    'text-gray-300 hover:bg-gray-700 hover:text-white'
                  )}
                >
                  <Icon size={18} />
                  <span className="flex-1 text-left">{item.name}</span>
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                </button>

                {/* Submenu Items */}
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.submenu.map((subitem) => {
                      const SubIcon = subitem.icon
                      return (
                        <NavLink
                          key={subitem.path}
                          to={subitem.path}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs font-medium',
                              isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                            )
                          }
                        >
                          <SubIcon size={16} />
                          <span className="truncate">{subitem.name}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }
          
          // Si es un item simple (sin submenú)
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} />
                  <span>{item.name}</span>
                  {isActive && <ChevronRight size={16} className="ml-auto" />}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar