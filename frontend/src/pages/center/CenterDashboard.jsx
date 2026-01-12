/**
 * CenterDashboard.jsx
 *
 * ZONA CENTRO: Dashboard principal
 * Muestra estado de la convocatoria, avisos y accesos rápidos
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Home,
  Search,
  PlusCircle,
  FileStack,
  CheckCircle,
  AlertCircle,
  Clock,
  Lock,
  PauseCircle,
  Megaphone,
  BookOpen,
  Calendar,
} from "lucide-react";
import client from "../../api/client";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const CenterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    activePeriod: null,
    myRequests: 0,
    myAllocations: 0,
    pendingDocuments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Usar Promise.all para cargar en paralelo
      const [periodsRes, requestsRes, allocationsRes] = await Promise.all([
        client.get("/enrollment/periods?status=OPEN"),
        client.get("/requests"),
        client.get("/allocation"),
      ]);

      // Procesar periodos
      const periods = periodsRes.data;
      if (periods.length > 0) {
        setStats((prev) => ({ ...prev, activePeriod: periods[0] }));
      }

      // Procesar mis solicitudes
      setStats((prev) => ({ ...prev, myRequests: requestsRes.data.length }));

      // Procesar mis asignaciones
      setStats((prev) => ({
        ...prev,
        myAllocations: allocationsRes.data.length,
      }));
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
      return {
        color: "bg-gray-100 text-gray-600 border-gray-200",
        text: "Sin convocatoria activa",
        icon: <PauseCircle size={40} />,
      };
    }
    switch (stats.activePeriod.status) {
      case "OPEN":
        return {
          color: "bg-green-50 text-green-800 border-green-200",
          text: "Convocatoria Abierta",
          icon: <CheckCircle size={40} />,
        };
      case "PROCESSING":
        return {
          color: "bg-yellow-50 text-yellow-800 border-yellow-200",
          text: "En Proceso",
          icon: <Clock size={40} />,
        };
      case "PUBLISHED":
        return {
          color: "bg-blue-50 text-blue-800 border-blue-200",
          text: "Resultados Publicados",
          icon: <Megaphone size={40} />,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-600 border-gray-200",
          text: "Cerrada",
          icon: <Lock size={40} />,
        };
    }
  };

  const periodStatus = getPeriodStatus();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Bienvenida */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <span className="text-4xl">👋</span> Bienvenido/a,{" "}
          {user?.full_name || "Coordinador/a"}
        </h1>
        <p className="text-lg text-gray-500 mt-2">
          Panel de control del centro educativo
        </p>
      </div>

      {/* Estado de la convocatoria */}
      <div
        className={`${periodStatus.color} rounded-2xl p-8 border-2 shadow-xs transition-transform hover:scale-[1.01]`}
      >
        <div className="flex items-center gap-6">
          <div className="p-2 bg-white/40 rounded-full backdrop-blur-sm">
            {periodStatus.icon}
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">{periodStatus.text}</h2>
            {stats.activePeriod && (
              <p className="opacity-80 font-medium flex items-center gap-2">
                <Calendar size={18} />
                {stats.activePeriod.name} — Hasta:{" "}
                {new Date(
                  stats.activePeriod.end_date_requests
                ).toLocaleDateString("es-ES")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Avisos */}
      {stats.pendingDocuments > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="text-orange-500 bg-orange-100 p-3 rounded-full">
              <AlertCircle size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-orange-800">
                Documentos pendientes
              </h3>
              <p className="text-orange-700">
                Tienes <strong>{stats.pendingDocuments}</strong> alumno(s) sin
                documentación completa.
              </p>
            </div>
            <button
              onClick={() => navigate("/center/allocations")}
              className="ml-auto bg-orange-500 text-white px-6 py-2.5 rounded-xl font-medium shadow-sm hover:bg-orange-600 transition"
            >
              Revisar ahora
            </button>
          </div>
        </div>
      )}

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="text-4xl font-bold text-blue-600">
              {stats.myRequests}
            </div>
            <FileStack className="text-blue-100" size={32} />
          </div>
          <div className="text-gray-500 font-medium">Solicitudes enviadas</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="text-4xl font-bold text-green-600">
              {stats.myAllocations}
            </div>
            <CheckCircle className="text-green-100" size={32} />
          </div>
          <div className="text-gray-500 font-medium">Talleres asignados</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="text-4xl font-bold text-purple-600">
              {stats.activePeriod ? "1" : "0"}
            </div>
            <Calendar className="text-purple-100" size={32} />
          </div>
          <div className="text-gray-500 font-medium">Período activo</div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => navigate("/center/catalog")}
            className="group bg-white rounded-2xl shadow-sm p-6 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-blue-100"
          >
            <div className="bg-blue-50 text-blue-600 p-4 rounded-xl w-fit mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Search size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
              Ver Catálogo
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Explora los talleres disponibles
            </p>
          </button>

          <button
            onClick={() => navigate("/center/request")}
            disabled={
              !stats.activePeriod || stats.activePeriod.status !== "OPEN"
            }
            className={`group bg-white rounded-2xl shadow-sm p-6 text-left transition-all duration-300 border border-transparent 
                ${
                  !stats.activePeriod || stats.activePeriod.status !== "OPEN"
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:shadow-xl hover:-translate-y-1 hover:border-green-100"
                }`}
          >
            <div
              className={`bg-green-50 text-green-600 p-4 rounded-xl w-fit mb-4 ${
                !stats.activePeriod || stats.activePeriod.status !== "OPEN"
                  ? ""
                  : "group-hover:bg-green-600 group-hover:text-white transition-colors"
              }`}
            >
              <PlusCircle size={32} />
            </div>
            <h3
              className={`text-lg font-bold text-gray-900 ${
                !stats.activePeriod || stats.activePeriod.status !== "OPEN"
                  ? ""
                  : "group-hover:text-green-700 transition-colors"
              }`}
            >
              Nueva Solicitud
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              {stats.activePeriod?.status === "OPEN"
                ? "Solicitar talleres"
                : "No hay convocatoria abierta"}
            </p>
          </button>

          <button
            onClick={() => navigate("/center/requests")}
            className="group bg-white rounded-2xl shadow-sm p-6 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-purple-100"
          >
            <div className="bg-purple-50 text-purple-600 p-4 rounded-xl w-fit mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <FileStack size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
              Mis Solicitudes
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Ver historial de solicitudes
            </p>
          </button>

          <button
            onClick={() => navigate("/center/allocations")}
            className="group bg-white rounded-2xl shadow-sm p-6 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-teal-100"
          >
            <div className="bg-teal-50 text-teal-600 p-4 rounded-xl w-fit mb-4 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-700 transition-colors">
              Mis Asignaciones
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Talleres asignados y checklist
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CenterDashboard;
