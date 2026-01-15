import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  FileText,
  Target,
  Home,
  Search,
  PlusCircle,
  FileStack,
  CheckCircle,
  GraduationCap,
  LogOut,
  Briefcase,
  Building2,
  Users,
} from "lucide-react";

/**
 * Sidebar Component
 * Panel lateral de navegación con enlaces descriptivos y diseño profesional.
 */
const Sidebar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isCenter = user?.role === "CENTER_COORD";
  const isTeacher = user?.role === "TEACHER";

  // Helper para clases de NavLink
  const getLinkClass = ({ isActive }) => {
    // Cambio a estilo de alto contraste para estado activo
    // Inactivo: Texto gris, hover blanco/azul
    // Activo: Fondo blanco (resalta sobre gris), texto azul fuerte, borde azul
    const base =
      "group flex items-center justify-between px-6 py-5 rounded-2xl text-base font-medium transition-all duration-200 mb-3 border-l-4";

    return isActive
      ? "bg-white border-blue-600 text-blue-700 shadow-sm" // Activo: Fondo blanco + Borde izquierdo azul
      : "border-transparent text-gray-600 hover:bg-white/50 hover:text-blue-700"; // Inactivo
  };

  const getIconClass = (isActive) => {
    return isActive
      ? "text-blue-600"
      : "text-gray-400 group-hover:text-blue-600";
  };

  return (
    // Sticky top-20 para compensar la Navbar de 80px (h-20)
    <aside className="w-96 bg-gray-50 border-r border-gray-200 flex flex-col h-[calc(100vh-5rem)] sticky top-20 overflow-hidden shadow-xl z-20">
      {/* Contenido scrolleable - Aumentado espaciado vertical */}
      <nav className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-thin scrollbar-thumb-gray-200">
        {!isAuthenticated ? (
          <div>
            <h3 className="px-6 text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">
              Acceso
            </h3>
            <NavLink to="/login" className={getLinkClass}>
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-5">
                    <LogOut size={28} className={getIconClass(isActive)} />
                    <span className="text-lg">Iniciar Sesión</span>
                  </div>
                </>
              )}
            </NavLink>
          </div>
        ) : (
          <>
            {/* ==================== ZONA ADMIN ==================== */}
            {isAdmin && (
              <div>
                <h3 className="px-6 text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">
                  Administración
                </h3>

                <NavLink to="/admin" end className={getLinkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-5">
                        <LayoutDashboard
                          size={28}
                          className={getIconClass(isActive)}
                        />
                        <span className="text-lg">Panel de Control</span>
                      </div>
                    </>
                  )}
                </NavLink>

                <NavLink to="/admin/enrollment" className={getLinkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-5">
                        <CalendarDays
                          size={28}
                          className={getIconClass(isActive)}
                        />
                        <span className="text-lg">Convocatorias</span>
                      </div>
                    </>
                  )}
                </NavLink>

                <NavLink to="/admin/catalog" className={getLinkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-5">
                        <BookOpen
                          size={28}
                          className={getIconClass(isActive)}
                        />
                        <span className="text-lg">Gestión de Catálogo</span>
                      </div>
                    </>
                  )}
                </NavLink>

                <NavLink to="/admin/providers" className={getLinkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-5">
                        <Briefcase
                          size={28}
                          className={getIconClass(isActive)}
                        />
                        <span className="text-lg">Gestión de Proveedores</span>
                      </div>
                    </>
                  )}
                </NavLink>

                <NavLink to="/admin/centers" className={getLinkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-5">
                        <Building2
                          size={28}
                          className={getIconClass(isActive)}
                        />
                        <span className="text-lg">Gestión de Centros</span>
                      </div>
                    </>
                  )}
                </NavLink>

                <NavLink to="/admin/requests" className={getLinkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-5">
                        <FileText
                          size={28}
                          className={getIconClass(isActive)}
                        />
                        <span className="text-lg">Monitor de Solicitudes</span>
                      </div>
                    </>
                  )}
                </NavLink>

                <NavLink to="/admin/allocation" className={getLinkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-5">
                        <Target size={28} className={getIconClass(isActive)} />
                        <span className="text-lg">Asignación de Plazas</span>
                      </div>
                    </>
                  )}
                </NavLink>
              </div>
            )}

            {/* ==================== ZONA CENTRO ==================== */}
            {isCenter && (
              <div>
                <h3 className="px-6 text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">
                  Centro Educativo
                </h3>

                <NavLink to="/center" end className={getLinkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-5">
                        <Home size={28} className={getIconClass(isActive)} />
                        <span className="text-lg">Inicio</span>
                      </div>
                    </>
                  )}
                </NavLink>

                <NavLink to="/center/catalog" className={getLinkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-5">
                        <Search size={28} className={getIconClass(isActive)} />
                        <span className="text-lg">Catálogo de Talleres</span>
                      </div>
                    </>
                  )}
                </NavLink>

                <NavLink to="/center/request" className={getLinkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-5">
                        <PlusCircle
                          size={28}
                          className={getIconClass(isActive)}
                        />
                        <span className="text-lg">Realizar Solicitud</span>
                      </div>
                    </>
                  )}
                </NavLink>

                <NavLink to="/center/requests" className={getLinkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-5">
                        <FileStack
                          size={28}
                          className={getIconClass(isActive)}
                        />
                        <span className="text-lg">Historial Solicitudes</span>
                      </div>
                    </>
                  )}
                </NavLink>

                <NavLink to="/center/allocations" className={getLinkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-5">
                        <CheckCircle
                          size={28}
                          className={getIconClass(isActive)}
                        />
                        <span className="text-lg">Plazas Asignadas</span>
                      </div>
                    </>
                  )}
                </NavLink>

                <NavLink to="/center/students" className={getLinkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-5">
                        <Users size={28} className={getIconClass(isActive)} />
                        <span className="text-lg">Mis Alumnos</span>
                      </div>
                    </>
                  )}
                </NavLink>

                <NavLink to="/center/teachers" className={getLinkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-5">
                        <GraduationCap size={28} className={getIconClass(isActive)} />
                        <span className="text-lg">Profesores</span>
                      </div>
                    </>
                  )}
                </NavLink>
              </div>
            )}

            {/* ==================== ZONA PROFESOR ==================== */}
            {isTeacher && (
              <div>
                <h3 className="px-6 text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">
                  Docencia
                </h3>
                <NavLink to="/teacher" className={getLinkClass}>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-5">
                        <GraduationCap
                          size={28}
                          className={getIconClass(isActive)}
                        />
                        <span className="text-lg">Mis Talleres</span>
                      </div>
                    </>
                  )}
                </NavLink>
              </div>
            )}
          </>
        )}
      </nav>

      {/* Footer del Sidebar: Usuario */}
      {isAuthenticated && user && (
        <div className="p-8 border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div
            onClick={logout}
            className="flex items-center gap-5 p-5 rounded-2xl hover:bg-red-50 border border-gray-100 hover:border-red-100 cursor-pointer group transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
              {user.email.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="font-bold text-gray-900 truncate text-lg leading-tight">
                {user.full_name || user.email}
              </div>
              <div className="text-sm text-gray-500 font-medium mt-1">
                {user.role}
              </div>
            </div>
            <div className="text-gray-400 group-hover:text-red-500 transition-colors">
              <LogOut size={28} />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
