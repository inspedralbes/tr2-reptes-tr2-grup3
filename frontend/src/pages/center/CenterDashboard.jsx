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
  User,
  Users,
  Send,
  Cog,
  Eye,
  Rocket,
} from "lucide-react";
import client from "../../api/client";
import { PHASE_LABELS } from "../../services/enrollment.service";

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

      // Cargar periodos primero para saber en qué fase estamos
      const periodsRes = await client.get("/enrollment/periods?status=ACTIVE");
      const periods = periodsRes.data;

      let activePeriod = null;
      if (periods.length > 0) {
        activePeriod = periods[0];
      }

      // Cargar solicitudes siempre (historial)
      let requestsCount = 0;
      try {
        const requestsRes = await client.get("/requests");
        requestsCount = requestsRes.data.length;
      } catch (err) {
        console.log("No se pudieron cargar solicitudes:", err);
      }

      // Cargar asignaciones solo si estamos en PUBLICACION o EJECUCION
      let allocationsCount = 0;
      if (activePeriod && (activePeriod.current_phase === 'PUBLICACION' || activePeriod.current_phase === 'EJECUCION')) {
        try {
          const allocationsRes = await client.get("/allocation");
          allocationsCount = allocationsRes.data.length;
        } catch (err) {
          console.log("No se pudieron cargar asignaciones (fase incorrecta):", err);
        }
      }

      setStats({
        activePeriod,
        myRequests: requestsCount,
        myAllocations: allocationsCount,
        pendingDocuments: 0,
      });

    } catch (err) {
      console.error("Error cargando dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene el color, texto e icono según la fase actual del período
   */
  const getPeriodStatus = () => {
    if (!stats.activePeriod) {
      return {
        color: "bg-gray-100 text-gray-600 border-gray-200",
        text: "Sense convocatòria activa",
        icon: <PauseCircle size={40} />,
        description: null,
      };
    }

    const { status, current_phase } = stats.activePeriod;

    // Si el período está cerrado o en borrador
    if (status === "CLOSED") {
      return {
        color: "bg-gray-100 text-gray-600 border-gray-200",
        text: "Convocatòria Tancada",
        icon: <Lock size={40} />,
        description: null,
      };
    }

    if (status === "DRAFT") {
      return {
        color: "bg-gray-100 text-gray-600 border-gray-200",
        text: "Convocatòria en Preparació",
        icon: <Clock size={40} />,
        description: null,
      };
    }

    // Período activo - mostrar según la fase actual
    const phaseConfig = {
      SOLICITUDES: {
        color: "bg-green-50 text-green-800 border-green-200",
        text: "Convocatòria Oberta - Sol·licituds",
        icon: <Send size={40} />,
        description: "Podeu enviar les vostres sol·licituds de tallers",
      },
      ASIGNACION: {
        color: "bg-yellow-50 text-yellow-800 border-yellow-200",
        text: "En Procés d'Assignació",
        icon: <Cog size={40} />,
        description: "Estem processant les sol·licituds rebudes",
      },
      PUBLICACION: {
        color: "bg-blue-50 text-blue-800 border-blue-200",
        text: "Resultats Publicats",
        icon: <Eye size={40} />,
        description: "Ja podeu consultar els resultats de l'assignació",
      },
      EJECUCION: {
        color: "bg-teal-50 text-teal-800 border-teal-200",
        text: "Tallers en Execució",
        icon: <Rocket size={40} />,
        description: "Els tallers s'estan realitzant",
      },
    };

    return phaseConfig[current_phase] || {
      color: "bg-gray-100 text-gray-600 border-gray-200",
      text: "Convocatòria Activa",
      icon: <CheckCircle size={40} />,
      description: null,
    };
  };

  /**
   * Obtiene la fecha de fin de la fase actual
   */
  const getCurrentPhaseEndDate = () => {
    if (!stats.activePeriod || !stats.activePeriod.current_phase) return null;

    const phaseEndFields = {
      SOLICITUDES: 'phase_solicitudes_end',
      PUBLICACION: 'phase_publicacion_end',
      EJECUCION: 'phase_ejecucion_end',
    };

    const field = phaseEndFields[stats.activePeriod.current_phase];
    return field ? stats.activePeriod[field] : null;
  };

  const periodStatus = getPeriodStatus();
  const currentPhaseEndDate = getCurrentPhaseEndDate();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
          Benvingut/da, {user?.full_name || "Coordinador/a"}
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-500 mt-1">
          Panell de control del centre educatiu
        </p>
      </div>

      {/* Estado de la convocatoria */}
      <div
        className={`${periodStatus.color} rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border-2 shadow-sm`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="p-2 bg-white/40 rounded-full backdrop-blur-sm shrink-0">
            {periodStatus.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 break-words">{periodStatus.text}</h2>
            {stats.activePeriod && (
              <div className="opacity-80 font-medium text-sm sm:text-base">
                <p className="flex flex-wrap items-center gap-2">
                  <Calendar size={18} />
                  <span className="break-words">{stats.activePeriod.name}</span>
                  {currentPhaseEndDate && (
                    <span>
                      {" "}— Fins al:{" "}
                      {new Date(currentPhaseEndDate).toLocaleDateString("ca-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </p>
                {periodStatus.description && (
                  <p className="text-sm mt-1 opacity-75">{periodStatus.description}</p>
                )}
              </div>
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
                Documentació pendent
              </h3>
              <p className="text-orange-700">
                Tens <strong>{stats.pendingDocuments}</strong> alumne(s) sense
                documentació completa.
              </p>
            </div>
            <button
              onClick={() => navigate("/center/allocations")}
              className="ml-auto bg-orange-500 text-white px-6 py-2.5 rounded-xl font-medium shadow-sm hover:bg-orange-600 transition"
            >
              Revisar ara
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
          <div className="text-gray-500 font-medium">Sol·licituds enviades</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="text-4xl font-bold text-green-600">
              {stats.myAllocations}
            </div>
            <CheckCircle className="text-green-100" size={32} />
          </div>
          <div className="text-gray-500 font-medium">Tallers assignats</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="text-4xl font-bold text-purple-600">
              {stats.activePeriod ? "1" : "0"}
            </div>
            <Calendar className="text-purple-100" size={32} />
          </div>
          <div className="text-gray-500 font-medium">Període actiu</div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          Accessos ràpids
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => navigate("/center/catalog")}
            className="group bg-white rounded-2xl shadow-sm p-6 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 hover:border-blue-100"
          >
            <div className="bg-blue-50 text-blue-600 p-4 rounded-xl w-fit mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Search size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
              Veure Catàleg
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Explora els tallers disponibles
            </p>
          </button>

          {/* Gestió Alumnes - Solo disponible en PUBLICACION o EJECUCION */}
          <button
            onClick={() => {
              if (stats.activePeriod?.current_phase === 'PUBLICACION' || stats.activePeriod?.current_phase === 'EJECUCION') {
                navigate("/center/students");
              }
            }}
            disabled={stats.activePeriod?.current_phase !== 'PUBLICACION' && stats.activePeriod?.current_phase !== 'EJECUCION'}
            className={`group bg-white rounded-2xl shadow-sm p-6 text-left transition-all duration-300 border border-gray-100 ${stats.activePeriod?.current_phase === 'PUBLICACION' || stats.activePeriod?.current_phase === 'EJECUCION'
              ? 'hover:shadow-xl hover:-translate-y-1 hover:border-orange-100'
              : 'opacity-60 cursor-not-allowed'
              }`}
          >
            <div className={`p-4 rounded-xl w-fit mb-4 transition-colors ${stats.activePeriod?.current_phase === 'PUBLICACION' || stats.activePeriod?.current_phase === 'EJECUCION'
              ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white'
              : 'bg-gray-100 text-gray-400'
              }`}>
              <Users size={32} />
            </div>
            <h3 className={`text-lg font-bold transition-colors ${stats.activePeriod?.current_phase === 'PUBLICACION' || stats.activePeriod?.current_phase === 'EJECUCION'
              ? 'text-gray-900 group-hover:text-orange-700'
              : 'text-gray-500'
              }`}>
              Gestió Alumnes
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              {stats.activePeriod?.current_phase === 'PUBLICACION' || stats.activePeriod?.current_phase === 'EJECUCION'
                ? 'Administrar llistat d\'alumnes'
                : 'Disponible després de la publicació'
              }
            </p>
          </button>

          <button
            onClick={() => navigate("/center/teachers")}
            className="group bg-white rounded-2xl shadow-sm p-6 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 hover:border-indigo-100"
          >
            <div className="bg-indigo-50 text-indigo-600 p-4 rounded-xl w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <User size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
              Gestió Professors
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Administrar equip docent
            </p>
          </button>

          <button
            onClick={() => navigate("/center/requests")}
            className="group bg-white rounded-2xl shadow-sm p-6 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 hover:border-purple-100"
          >
            <div className="bg-purple-50 text-purple-600 p-4 rounded-xl w-fit mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <FileStack size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
              Les Meves Sol·licituds
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Veure historial de sol·licituds
            </p>
          </button>

          {/* Assignacions - Solo disponible en PUBLICACION o EJECUCION */}
          <button
            onClick={() => {
              if (stats.activePeriod?.current_phase === 'PUBLICACION' || stats.activePeriod?.current_phase === 'EJECUCION') {
                navigate("/center/allocations");
              }
            }}
            disabled={stats.activePeriod?.current_phase !== 'PUBLICACION' && stats.activePeriod?.current_phase !== 'EJECUCION'}
            className={`group bg-white rounded-2xl shadow-sm p-6 text-left transition-all duration-300 border border-gray-100 ${stats.activePeriod?.current_phase === 'PUBLICACION' || stats.activePeriod?.current_phase === 'EJECUCION'
              ? 'hover:shadow-xl hover:-translate-y-1 hover:border-teal-100'
              : 'opacity-60 cursor-not-allowed'
              }`}
          >
            <div className={`p-4 rounded-xl w-fit mb-4 transition-colors ${stats.activePeriod?.current_phase === 'PUBLICACION' || stats.activePeriod?.current_phase === 'EJECUCION'
              ? 'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white'
              : 'bg-gray-100 text-gray-400'
              }`}>
              <CheckCircle size={32} />
            </div>
            <h3 className={`text-lg font-bold transition-colors ${stats.activePeriod?.current_phase === 'PUBLICACION' || stats.activePeriod?.current_phase === 'EJECUCION'
              ? 'text-gray-900 group-hover:text-teal-700'
              : 'text-gray-500'
              }`}>
              Les Meves Assignacions
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              {stats.activePeriod?.current_phase === 'PUBLICACION' || stats.activePeriod?.current_phase === 'EJECUCION'
                ? 'Tallers assignats i checklist'
                : 'Disponible després de la publicació'
              }
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CenterDashboard;
