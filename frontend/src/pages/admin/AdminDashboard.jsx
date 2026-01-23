/**
 * AdminDashboard.jsx
 *
 * ZONA ADMIN: Dashboard principal
 * Panel de control con estadísticas, estado de convocatoria y accesos rápidos
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  FileText,
  Target,
  AlertTriangle,
  Clock,
  CheckCircle,
  Megaphone,
  Lock,
  PauseCircle,
  BarChart3,
  Users,
  Briefcase,
  Building2,
} from "lucide-react";

import client from "../../api/client";
// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    activePeriod: null,
    totalWorkshops: 0,
    totalRequests: 0,
    totalAllocations: 0,
    pendingValidations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  /*
   * Carga los datos usando el cliente centralizado que maneja el token automáticamente
   */
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Usamos Promise.all para cargar todo en paralelo y aprovechar el interceptor de client.js
      const [periodsRes, workshopsRes, requestsRes, allocationsRes] =
        await Promise.all([
          client.get("/enrollment/periods"),
          client.get("/catalog/workshops"),
          client.get("/requests"),
          client.get("/allocation"),
        ]);

      // Procesar periodos
      const periods = periodsRes.data;
      const active = periods.find((p) => p.status === "ACTIVE");
      setStats((prev) => ({ ...prev, activePeriod: active }));

      // Procesar talleres
      setStats((prev) => ({
        ...prev,
        totalWorkshops: workshopsRes.data.length,
      }));

      // Procesar solicitudes
      setStats((prev) => ({ ...prev, totalRequests: requestsRes.data.length }));

      // Procesar asignaciones
      setStats((prev) => ({
        ...prev,
        totalAllocations: allocationsRes.data.length,
      }));
    } catch (err) {
      console.error("Error cargando dashboard:", err);
      // Fallback silencioso o mostrar notificación si fuera necesario
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene el color y texto según el estado y fase del período
   */
  const getPeriodStatus = () => {
    if (!stats.activePeriod) {
      return {
        color: "bg-gray-500",
        text: "Sin período activo",
        icon: <PauseCircle size={48} />,
      };
    }

    const { status, current_phase } = stats.activePeriod;

    if (status === "DRAFT") {
      return {
        color: "bg-gray-500",
        text: "BORRADOR",
        icon: <Clock size={48} />,
      };
    }

    if (status === "CLOSED") {
      return {
        color: "bg-gray-500",
        text: "CERRADA",
        icon: <Lock size={48} />,
      };
    }

    // Status ACTIVE - mostrar según fase
    const phaseConfig = {
      SOLICITUDES: {
        color: "bg-green-600",
        text: "FASE: SOLICITUDES",
        icon: <CheckCircle size={48} />,
      },
      ASIGNACION: {
        color: "bg-yellow-500",
        text: "FASE: ASIGNACIÓN",
        icon: <Clock size={48} />,
      },
      PUBLICACION: {
        color: "bg-blue-600",
        text: "FASE: PUBLICACIÓN",
        icon: <Megaphone size={48} />,
      },
      EJECUCION: {
        color: "bg-teal-600",
        text: "FASE: EJECUCIÓN",
        icon: <Target size={48} />,
      },
    };

    return phaseConfig[current_phase] || {
      color: "bg-green-600",
      text: "CONVOCATORIA ACTIVA",
      icon: <CheckCircle size={48} />,
    };
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <LayoutDashboard size={32} className="text-blue-600" /> Panel de
          Administración
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Gestiona la plataforma Enginy, monitoriza la actividad y controla las
          convocatorias.
        </p>
      </div>

      {/* Estado de la convocatoria (grande y prominente) */}
      <div
        className={`${periodStatus.color} text-white rounded-2xl p-8 shadow-xl transition-all hover:scale-[1.01]`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="bg-white/20 p-4 rounded-full">
              {periodStatus.icon}
            </div>
            <div>
              <div className="text-sm font-medium opacity-90 uppercase tracking-widest mb-1">
                Estado de la Convocatoria
              </div>
              <h2 className="text-3xl font-bold">{periodStatus.text}</h2>
              {stats.activePeriod && (
                <p className="opacity-90 mt-2 text-lg font-medium bg-black/10 inline-block px-3 py-1 rounded-lg">
                  {stats.activePeriod.name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate("/admin/enrollment")}
            className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl transition font-semibold text-lg flex items-center gap-2"
          >
            Gestionar períodos <Calendar size={20} />
          </button>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="text-3xl font-bold text-blue-600">
              {stats.totalWorkshops}
            </div>
            <BookOpen className="text-blue-200" size={24} />
          </div>
          <div className="text-gray-600 font-medium">Talleres en catálogo</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="text-3xl font-bold text-yellow-600">
              {stats.totalRequests}
            </div>
            <FileText className="text-yellow-200" size={24} />
          </div>
          <div className="text-gray-600 font-medium">Solicitudes recibidas</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-green-500 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="text-3xl font-bold text-green-600">
              {stats.totalAllocations}
            </div>
            <Target className="text-green-200" size={24} />
          </div>
          <div className="text-gray-600 font-medium">Plazas asignadas</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-purple-500 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="text-3xl font-bold text-purple-600">
              {stats.pendingValidations}
            </div>
            <Users className="text-purple-200" size={24} />
          </div>
          <div className="text-gray-600 font-medium">
            Validaciones pendientes
          </div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => navigate("/admin/enrollment")}
            className="group bg-white rounded-2xl shadow-sm p-6 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-blue-100"
          >
            <div className="bg-blue-50 text-blue-600 p-4 rounded-xl w-fit mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Calendar size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
              Períodos
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Abrir/cerrar convocatorias y plazos
            </p>
          </button>

          <button
            onClick={() => navigate("/admin/catalog")}
            className="group bg-white rounded-2xl shadow-sm p-6 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-blue-100"
          >
            <div className="bg-purple-50 text-purple-600 p-4 rounded-xl w-fit mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <BookOpen size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
              Catálogo
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Gestionar talleres, ediciones y plazas
            </p>
          </button>

          <button
            onClick={() => navigate("/admin/requests")}
            className="group bg-white rounded-2xl shadow-sm p-6 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-blue-100"
          >
            <div className="bg-yellow-50 text-yellow-600 p-4 rounded-xl w-fit mb-4 group-hover:bg-yellow-600 group-hover:text-white transition-colors">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-yellow-700 transition-colors">
              Solicitudes
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Monitorizar la demanda de los centros
            </p>
          </button>

          <button
            onClick={() => navigate("/admin/allocation")}
            className="group bg-white rounded-2xl shadow-sm p-6 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-blue-100"
          >
            <div className="bg-teal-50 text-teal-600 p-4 rounded-xl w-fit mb-4 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Target size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-700 transition-colors">
              Asignación
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Ejecutar algoritmo y publicar resultados
            </p>
          </button>

          <button
            onClick={() => navigate("/admin/providers")}
            className="group bg-white rounded-2xl shadow-sm p-6 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-blue-100"
          >
            <div className="bg-orange-50 text-orange-600 p-4 rounded-xl w-fit mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <Briefcase size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-700 transition-colors">
              Proveedores
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Gestionar empresas y colaboradores
            </p>
          </button>

          <button
            onClick={() => navigate("/admin/centers")}
            className="group bg-white rounded-2xl shadow-sm p-6 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-blue-100"
          >
            <div className="bg-indigo-50 text-indigo-600 p-4 rounded-xl w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Building2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
              Centros
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Administrar centros educativos
            </p>
          </button>
        </div>
      </div>

      {/* Alertas/Acciones pendientes */}
      {stats.activePeriod?.current_phase === "ASIGNACION" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
          <div className="bg-yellow-100 p-4 rounded-full text-yellow-600">
            <AlertTriangle size={32} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-yellow-800">
              Acción Requerida: Asignación Pendiente
            </h3>
            <p className="text-yellow-700 mt-1">
              El período <strong>{stats.activePeriod.name}</strong> está en fase
              de asignación. Es necesario ejecutar el algoritmo de asignación
              y revisar los resultados antes de publicarlos.
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/allocation")}
            className="bg-yellow-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-yellow-700 transition shadow-sm hover:shadow-md whitespace-nowrap"
          >
            Ir a Asignación
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
