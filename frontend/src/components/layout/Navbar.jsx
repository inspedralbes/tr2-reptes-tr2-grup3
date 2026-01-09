import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white shadow-sm">
      <Link to="/" className="flex items-center no-underline">
        <img src="/CEB_logo_blau.png" alt="Consorci d’Educació de Barcelona" className="h-12" />
      </Link>
      <nav className="flex gap-4 items-center">
        {!isAuthenticated && (
          <Link to="/login" className="text-primary hover:text-blue-800 font-medium transition-colors">Login</Link>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
