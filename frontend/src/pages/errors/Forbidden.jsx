/**
 * Forbidden.jsx
 * 
 * Página 403 - Acceso denegado
 */
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Forbidden = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleGoHome = () => {
    // Redirigir según el rol
    if (user?.role === "ADMIN") {
      navigate("/admin");
    } else if (user?.role === "CENTER_COORD") {
      navigate("/center");
    } else if (user?.role === "TEACHER") {
      navigate("/teacher");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl mb-4">🚫</div>
        <h1 className="text-6xl font-bold text-red-300 mb-2">403</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Acceso denegado
        </h2>
        <p className="text-gray-500 mb-8 max-w-md">
          No tienes permiso para acceder a esta página. 
          {user && (
            <span className="block mt-2">
              Tu rol actual es: <strong>{user.role}</strong>
            </span>
          )}
        </p>
        <button
          onClick={handleGoHome}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition mr-3"
        >
          Ir a mi zona
        </button>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default Forbidden;
