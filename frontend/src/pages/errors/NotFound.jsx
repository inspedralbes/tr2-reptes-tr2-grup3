/**
 * NotFound.jsx
 * 
 * Página 404 - Recurso no encontrado
 */
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl mb-4">🔍</div>
        <h1 className="text-6xl font-bold text-gray-300 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Página no encontrada
        </h2>
        <p className="text-gray-500 mb-8 max-w-md">
          La página que buscas no existe o ha sido movida a otra ubicación.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition mr-3"
        >
          ← Volver atrás
        </button>
        <button
          onClick={() => navigate("/")}
          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
        >
          Ir al inicio
        </button>
      </div>
    </div>
  );
};

export default NotFound;
