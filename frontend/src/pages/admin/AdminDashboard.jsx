/**
 * AdminDashboard.jsx
 * 
 * ZONA ADMIN: Dashboard principal
 * Panel de control con estadísticas, estado de convocatoria y accesos rápidos
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    activePeriod: null,
    totalWorkshops: 0,
    totalRequests: 0,
    totalAllocations: 0,
    pendingValidations: 0
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
      const periodsRes = await fetch(`${API_URL}/enrollment/periods`, { headers });
      if (periodsRes.ok) {
        const periods = await periodsRes.json();
        const active = periods.find(p => p.status !== "CLOSED");
        setStats(prev => ({ ...prev, activePeriod: active }));
      }

      // Cargar talleres
      const workshopsRes = await fetch(`${API_URL}/catalog/workshops`, { headers });
      if (workshopsRes.ok) {
        const workshops = await workshopsRes.json();
        setStats(prev => ({ ...prev, totalWorkshops: workshops.length }));
      }

      // Cargar solicitudes
      const requestsRes = await fetch(`${API_URL}/requests`, { headers });
      if (requestsRes.ok) {
        const requests = await requestsRes.json();
        setStats(prev => ({ ...prev, totalRequests: requests.length }));
      }

      // Cargar asignaciones
      const allocationsRes = await fetch(`${API_URL}/allocation`, { headers });
      if (allocationsRes.ok) {
        const allocations = await allocationsRes.json();
        setStats(prev => ({ ...prev, totalAllocations: allocations.length }));
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
      return { color: "bg-gray-500", text: "Sin período activo", icon: "⏸️" };
    }
    switch (stats.activePeriod.status) {
      case "OPEN":
        return { color: "bg-green-500", text: "CONVOCATORIA ABIERTA", icon: "✅" };
      case "PROCESSING":
        return { color: "bg-yellow-500", text: "EN PROCESO", icon: "⏳" };
      case "PUBLISHED":
        return { color: "bg-blue-500", text: "RESULTADOS PUBLICADOS", icon: "📢" };
      default:
        return { color: "bg-gray-500", text: "CERRADA", icon: "🔒" };
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📊 Panel de Administración</h1>
        <p className="text-gray-500">Gestiona la plataforma Enginy</p>
      </div>

      {/* Estado de la convocatoria (grande y prominente) */}
      <div className={`${periodStatus.color} text-white rounded-xl p-6 mb-6 shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{periodStatus.icon}</span>
            <div>
              <div className="text-sm opacity-75">Estado de la Convocatoria</div>
              <h2 className="text-2xl font-bold">{periodStatus.text}</h2>
              {stats.activePeriod && (
                <p className="opacity-75 mt-1">{stats.activePeriod.name}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate("/admin/enrollment")}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
          >
            Gestionar períodos →
          </button>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="text-3xl font-bold text-blue-600">{stats.totalWorkshops}</div>
          <div className="text-gray-500">Talleres en catálogo</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="text-3xl font-bold text-yellow-600">{stats.totalRequests}</div>
          <div className="text-gray-500">Solicitudes recibidas</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="text-3xl font-bold text-green-600">{stats.totalAllocations}</div>
          <div className="text-gray-500">Plazas asignadas</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <div className="text-3xl font-bold text-purple-600">{stats.pendingValidations}</div>
          <div className="text-gray-500">Validaciones pendientes</div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">🚀 Acciones rápidas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => navigate("/admin/enrollment")}
          className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md transition group"
        >
          <span className="text-3xl mb-3 block group-hover:scale-110 transition">📅</span>
          <h3 className="font-semibold text-gray-800">Períodos</h3>
          <p className="text-sm text-gray-500">Abrir/cerrar convocatorias</p>
        </button>

        <button
          onClick={() => navigate("/admin/catalog")}
          className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md transition group"
        >
          <span className="text-3xl mb-3 block group-hover:scale-110 transition">📚</span>
          <h3 className="font-semibold text-gray-800">Catálogo</h3>
          <p className="text-sm text-gray-500">Gestionar talleres y ediciones</p>
        </button>

        <button
          onClick={() => navigate("/admin/requests")}
          className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md transition group"
        >
          <span className="text-3xl mb-3 block group-hover:scale-110 transition">📋</span>
          <h3 className="font-semibold text-gray-800">Solicitudes</h3>
          <p className="text-sm text-gray-500">Monitor de demanda</p>
        </button>

        <button
          onClick={() => navigate("/admin/allocation")}
          className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md transition group"
        >
          <span className="text-3xl mb-3 block group-hover:scale-110 transition">🎯</span>
          <h3 className="font-semibold text-gray-800">Asignación</h3>
          <p className="text-sm text-gray-500">Ejecutar algoritmo y publicar</p>
        </button>
      </div>

      {/* Alertas/Acciones pendientes */}
      {stats.activePeriod?.status === "PROCESSING" && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800">Acción requerida</h3>
              <p className="text-yellow-600 text-sm">
                El período está en proceso. Ejecuta el algoritmo de asignación y publica los resultados.
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/allocation")}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-600"
            >
              Ir a Asignación
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
