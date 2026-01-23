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
  X,
} from "lucide-react";

/**
 * Sidebar Component
 * Panel lateral con navegación. 
 * - Mobile: overlay drawer que se abre desde la izquierda
 * - Desktop (lg+): sidebar fijo a la izquierda del contenido
 */
const Sidebar = ({ isOpen, onClose }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isCenter = user?.role === "CENTER_COORD";
  const isTeacher = user?.role === "TEACHER";

  // Estilos para NavLink
  const getLinkClass = ({ isActive }) => {
    const base = "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200";
    return isActive
      ? `${base} bg-blue-600 text-white shadow-md`
      : `${base} text-gray-600 hover:bg-gray-100 hover:text-gray-900`;
  };

  const getIconClass = (isActive) => {
    return isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600";
  };

  const handleNavClick = () => {
    // Close sidebar on mobile after clicking a link
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop for mobile - covers entire screen when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 shadow-xl
          transform transition-transform duration-300 ease-out
          lg:static lg:translate-x-0 lg:shadow-none lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Mobile header with close button */}
          <div className="lg:hidden flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-gray-50">
            <span className="font-bold text-gray-800">Menú</span>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X size={22} />
            </button>
          </div>

          {/* Navigation content */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {!isAuthenticated ? (
              <div>
                <h3 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Accés
                </h3>
                <NavLink to="/login" className={getLinkClass} onClick={handleNavClick}>
                  {({ isActive }) => (
                    <>
                      <LogOut size={20} className={getIconClass(isActive)} />
                      <span>Iniciar Sessió</span>
                    </>
                  )}
                </NavLink>
              </div>
            ) : (
              <>
                {/* ADMIN SECTION */}
                {isAdmin && (
                  <div>
                    <h3 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Administració
                    </h3>
                    <div className="space-y-1">
                      <NavLink to="/admin" end className={getLinkClass} onClick={handleNavClick}>
                        {({ isActive }) => (
                          <>
                            <LayoutDashboard size={20} className={getIconClass(isActive)} />
                            <span>Tauler de Control</span>
                          </>
                        )}
                      </NavLink>
                      <NavLink to="/admin/enrollment" className={getLinkClass} onClick={handleNavClick}>
                        {({ isActive }) => (
                          <>
                            <CalendarDays size={20} className={getIconClass(isActive)} />
                            <span>Convocatòries</span>
                          </>
                        )}
                      </NavLink>
                      <NavLink to="/admin/catalog" className={getLinkClass} onClick={handleNavClick}>
                        {({ isActive }) => (
                          <>
                            <BookOpen size={20} className={getIconClass(isActive)} />
                            <span>Catàleg</span>
                          </>
                        )}
                      </NavLink>
                      <NavLink to="/admin/providers" className={getLinkClass} onClick={handleNavClick}>
                        {({ isActive }) => (
                          <>
                            <Briefcase size={20} className={getIconClass(isActive)} />
                            <span>Proveïdors</span>
                          </>
                        )}
                      </NavLink>
                      <NavLink to="/admin/centers" className={getLinkClass} onClick={handleNavClick}>
                        {({ isActive }) => (
                          <>
                            <Building2 size={20} className={getIconClass(isActive)} />
                            <span>Centres</span>
                          </>
                        )}
                      </NavLink>
                      <NavLink to="/admin/requests" className={getLinkClass} onClick={handleNavClick}>
                        {({ isActive }) => (
                          <>
                            <FileText size={20} className={getIconClass(isActive)} />
                            <span>Sol·licituds</span>
                          </>
                        )}
                      </NavLink>
                      <NavLink to="/admin/allocation" className={getLinkClass} onClick={handleNavClick}>
                        {({ isActive }) => (
                          <>
                            <Target size={20} className={getIconClass(isActive)} />
                            <span>Assignació</span>
                          </>
                        )}
                      </NavLink>
                    </div>
                  </div>
                )}

                {/* CENTER SECTION */}
                {isCenter && (
                  <div>
                    <h3 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Centre Educatiu
                    </h3>
                    <div className="space-y-1">
                      <NavLink to="/center" end className={getLinkClass} onClick={handleNavClick}>
                        {({ isActive }) => (
                          <>
                            <Home size={20} className={getIconClass(isActive)} />
                            <span>Inici</span>
                          </>
                        )}
                      </NavLink>
                      <NavLink to="/center/catalog" className={getLinkClass} onClick={handleNavClick}>
                        {({ isActive }) => (
                          <>
                            <Search size={20} className={getIconClass(isActive)} />
                            <span>Catàleg</span>
                          </>
                        )}
                      </NavLink>
                      <NavLink to="/center/request" className={getLinkClass} onClick={handleNavClick}>
                        {({ isActive }) => (
                          <>
                            <PlusCircle size={20} className={getIconClass(isActive)} />
                            <span>Sol·licitud</span>
                          </>
                        )}
                      </NavLink>
                      <NavLink to="/center/requests" className={getLinkClass} onClick={handleNavClick}>
                        {({ isActive }) => (
                          <>
                            <FileStack size={20} className={getIconClass(isActive)} />
                            <span>Historial</span>
                          </>
                        )}
                      </NavLink>
                      <NavLink to="/center/allocations" className={getLinkClass} onClick={handleNavClick}>
                        {({ isActive }) => (
                          <>
                            <CheckCircle size={20} className={getIconClass(isActive)} />
                            <span>Assignacions</span>
                          </>
                        )}
                      </NavLink>
                      <NavLink to="/center/students" className={getLinkClass} onClick={handleNavClick}>
                        {({ isActive }) => (
                          <>
                            <Users size={20} className={getIconClass(isActive)} />
                            <span>Alumnes</span>
                          </>
                        )}
                      </NavLink>
                      <NavLink to="/center/teachers" className={getLinkClass} onClick={handleNavClick}>
                        {({ isActive }) => (
                          <>
                            <GraduationCap size={20} className={getIconClass(isActive)} />
                            <span>Professors</span>
                          </>
                        )}
                      </NavLink>
                    </div>
                  </div>
                )}

                {/* TEACHER SECTION */}
                {isTeacher && (
                  <div>
                    <h3 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Docència
                    </h3>
                    <div className="space-y-1">
                      <NavLink to="/teacher" end className={getLinkClass} onClick={handleNavClick}>
                        {({ isActive }) => (
                          <>
                            <BookOpen size={20} className={getIconClass(isActive)} />
                            <span>El Meu Taller</span>
                          </>
                        )}
                      </NavLink>
                      <NavLink to="/teacher/students" className={getLinkClass} onClick={handleNavClick}>
                        {({ isActive }) => (
                          <>
                            <Users size={20} className={getIconClass(isActive)} />
                            <span>Els Meus Alumnes</span>
                          </>
                        )}
                      </NavLink>
                    </div>
                  </div>
                )}
              </>
            )}
          </nav>

          {/* Mobile-only user footer */}
          {isAuthenticated && user && (
            <div className="lg:hidden border-t border-gray-200 bg-gray-50 p-4">
              <div
                onClick={() => { logout(); onClose(); }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 cursor-pointer group transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                  {user.email.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate text-sm">
                    {user.full_name || user.email}
                  </div>
                  <div className="text-xs text-gray-500">{user.role}</div>
                </div>
                <LogOut size={20} className="text-gray-400 group-hover:text-red-500 transition-colors" />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
