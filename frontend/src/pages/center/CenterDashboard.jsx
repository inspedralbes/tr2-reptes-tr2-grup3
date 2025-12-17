/**
 * CenterDashboard.jsx
 * 
 * ZONA CENTRO: Dashboard principal
 * Muestra estado de la convocatoria, avisos y accesos rápidos
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const CenterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    activePeriod: null,
    myRequests: 0,
    myAllocations: 0,
    pendingDocuments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { "Authorization": `Bearer ${token}` };

      // Cargar período activo
      const periodsRes = await fetch(`${API_URL}/enrollment/periods?status=OPEN`, { headers });
      if (periodsRes.ok) {
        const periods = await periodsRes.json();
        if (periods.length > 0) {
          setStats(prev => ({ ...prev, activePeriod: periods[0] }));
        }
      }

      // Cargar mis solicitudes
      const requestsRes = await fetch(`${API_URL}/requests`, { headers });
      if (requestsRes.ok) {
        const requests = await requestsRes.json();
        setStats(prev => ({ ...prev, myRequests: requests.length }));
      }

      // Cargar mis asignaciones
      const allocationsRes = await fetch(`${API_URL}/allocation`, { headers });
      if (allocationsRes.ok) {
        const allocations = await allocationsRes.json();
        setStats(prev => ({ ...prev, myAllocations: allocations.length }));
      }

    } catch (err) {
      console.error("Error cargando dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene el color y texto según el estado del período
   */
  const getPeriodStatus = () => {
    if (!stats.activePeriod) {
      return { color: "bg-gray-100 text-gray-600", text: "Sin convocatoria activa", icon: "⏸️" };
    }
    switch (stats.activePeriod.status) {
      case "OPEN":
        return { color: "bg-green-100 text-green-800", text: "Convocatoria Abierta", icon: "✅" };
      case "PROCESSING":
        return { color: "bg-yellow-100 text-yellow-800", text: "En Proceso", icon: "⏳" };
      case "PUBLISHED":
        return { color: "bg-blue-100 text-blue-800", text: "Resultados Publicados", icon: "📢" };
      default:
        return { color: "bg-gray-100 text-gray-600", text: "Cerrada", icon: "🔒" };
    }
  };

  const periodStatus = getPeriodStatus();

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Bienvenida */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          👋 Bienvenido/a, {user?.full_name || "Coordinador/a"}
        </h1>
        <p className="text-gray-500">Panel de control del centro educativo</p>
      </div>

      {/* Estado de la convocatoria */}
      <div className={`${periodStatus.color} rounded-xl p-6 mb-6`}>
        <div className="flex items-center gap-4">
          <span className="text-4xl">{periodStatus.icon}</span>
          <div>
            <h2 className="text-xl font-bold">{periodStatus.text}</h2>
            {stats.activePeriod && (
              <p className="opacity-75">
                {stats.activePeriod.name} - 
                Hasta: {new Date(stats.activePeriod.end_date_requests).toLocaleDateString("es-ES")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Avisos */}
      {stats.pendingDocuments > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-orange-800">Documentos pendientes</h3>
              <p className="text-orange-600 text-sm">
                Tienes {stats.pendingDocuments} alumno(s) sin documentación completa
              </p>
            </div>
            <button 
              onClick={() => navigate("/center/allocations")}
              className="ml-auto bg-orange-500 text-white px-4 py-2 rounded-lg text-sm"
            >
              Ver
            </button>
          </div>
        </div>
      )}

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-3xl font-bold text-blue-600">{stats.myRequests}</div>
          <div className="text-gray-500">Solicitudes enviadas</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-3xl font-bold text-green-600">{stats.myAllocations}</div>
          <div className="text-gray-500">Talleres asignados</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-3xl font-bold text-purple-600">
            {stats.activePeriod ? "1" : "0"}
          </div>
          <div className="text-gray-500">Período activo</div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">🚀 Accesos rápidos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => navigate("/center/catalog")}
          className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md transition"
        >
          <span className="text-3xl mb-3 block">📚</span>
          <h3 className="font-semibold text-gray-800">Ver Catálogo</h3>
          <p className="text-sm text-gray-500">Explora los talleres disponibles</p>
        </button>

        <button
          onClick={() => navigate("/center/request")}
          className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md transition"
          disabled={!stats.activePeriod || stats.activePeriod.status !== "OPEN"}
        >
          <span className="text-3xl mb-3 block">📝</span>
          <h3 className="font-semibold text-gray-800">Nueva Solicitud</h3>
          <p className="text-sm text-gray-500">
            {stats.activePeriod?.status === "OPEN" 
              ? "Solicitar talleres" 
              : "No hay convocatoria abierta"}
          </p>
        </button>

        <button
          onClick={() => navigate("/center/requests")}
          className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md transition"
        >
          <span className="text-3xl mb-3 block">📄</span>
          <h3 className="font-semibold text-gray-800">Mis Solicitudes</h3>
          <p className="text-sm text-gray-500">Ver historial de solicitudes</p>
        </button>

        <button
          onClick={() => navigate("/center/allocations")}
          className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md transition"
        >
          <span className="text-3xl mb-3 block">🎯</span>
          <h3 className="font-semibold text-gray-800">Mis Asignaciones</h3>
          <p className="text-sm text-gray-500">Ver talleres asignados y checklist</p>
        </button>
      </div>
    </div>
  );
};

export default CenterDashboard;
