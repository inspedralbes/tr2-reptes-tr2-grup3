import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { Menu, LogOut, ChevronLeft } from "lucide-react";

/**
 * Navbar Component
 * Barra de navegación superior con menú hamburguesa para móvil.
 */
const Navbar = ({ onMenuClick, isSidebarOpen }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left side: menu + logo */}
        <div className="flex items-center gap-3">
          {/* Hamburger menu - only visible on mobile when authenticated and not on login */}
          {isAuthenticated && !isLoginPage && (
            <button
              onClick={onMenuClick}
              className="lg:hidden flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {isSidebarOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
            </button>
          )}

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="/CEB_logo_blau.png"
              alt="Consorci d'Educació de Barcelona"
              className="h-8 lg:h-10"
            />
          </Link>
        </div>

        {/* Right side: user info + logout on desktop */}
        {isAuthenticated && user && (
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {user.full_name || user.email}
              </div>
              <div className="text-xs text-gray-500">{user.role}</div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
