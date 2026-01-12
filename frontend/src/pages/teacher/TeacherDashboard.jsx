/**
 * TeacherDashboard.jsx
 *
 * ZONA PROFESOR: Dashboard principal
 * Muestra los talleres donde el profesor ha sido asignado como referente
 * y las próximas sesiones del día
 * Diseño "Mobile First" con botones grandes y listas simples
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import client from "../../api/client";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [workshops, setWorkshops] = useState([]);
  const [todaySessions, setTodaySessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Carga los talleres y sesiones del profesor
   */
  /**
   * Carga los talleres y sesiones del profesor
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener talleres asignados al profesor
      const workshopsRes = await client.get("/teachers/my-workshops");
      const data = workshopsRes.data;
      setWorkshops(data);

      if (data.length > 0) {
        // Para cada taller, obtener las sesiones de hoy/próximas en paralelo
        const today = new Date().toISOString().split("T")[0];

        const sessionsPromises = data.map((w) =>
          client
            .get(`/sessions/${w.edition_id}`)
            .then((res) => ({ workshop: w, sessions: res.data }))
            .catch(() => ({ workshop: w, sessions: [] }))
        );

        const results = await Promise.all(sessionsPromises);
        const allSessions = [];

        results.forEach(({ workshop, sessions }) => {
          // Filtrar sesiones de hoy o futuras
          const relevantSessions = sessions
            .filter((s) => s.date >= today && !s.is_cancelled)
            .slice(0, 3) // Solo las próximas 3
            .map((s) => ({
              ...s,
              workshop_title: workshop.workshop_title,
              day_of_week: workshop.day_of_week,
            }));
          allSessions.push(...relevantSessions);
        });

        // Ordenar por fecha
        allSessions.sort((a, b) => new Date(a.date) - new Date(b.date));
        setTodaySessions(allSessions.slice(0, 5)); // Top 5 sesiones próximas
      } else {
        setWorkshops([]);
      }
    } catch (err) {
      setError(
        "Error cargando datos: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtiene el color según el día de la semana
   */
  const getDayColor = (day) => {
    return day === "TUESDAY" ? "bg-blue-500" : "bg-purple-500";
  };

  /**
   * Traduce el día
   */
  const getDayLabel = (day) => {
    return day === "TUESDAY" ? "Martes" : "Jueves";
  };

  /**
   * Comprueba si una fecha es hoy
   */
  const isToday = (dateStr) => {
    const today = new Date().toISOString().split("T")[0];
    return dateStr === today;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <p className="text-gray-500 text-center mt-8">
          Cargando tus talleres...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Mobile */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
        <h1 className="text-2xl font-bold">👨‍🏫 Mis Talleres</h1>
        <p className="text-green-100 mt-1">
          Hola, {user?.full_name || "Profesor"}
        </p>
      </div>

      {/* Contenido */}
      <div className="p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Sesiones de Hoy / Próximas */}
        {todaySessions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              📅 Próximas Sesiones
            </h2>
            <div className="space-y-2">
              {todaySessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => navigate(`/teacher/workshop/${session.id}`)}
                  className={`w-full text-left bg-white rounded-xl shadow-sm p-4 border-l-4 ${
                    isToday(session.date)
                      ? "border-green-500"
                      : "border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-800">
                        {session.workshop_title}
                      </div>
                      <div className="text-sm text-gray-500">
                        Sesión #{session.session_number} -{" "}
                        {new Date(session.date).toLocaleDateString("es-ES")}
                      </div>
                    </div>
                    {isToday(session.date) && (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                        HOY
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Talleres */}
        {workshops.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              No tienes talleres asignados
            </h2>
            <p className="text-gray-500">
              Cuando el administrador te asigne como referente de un taller,
              aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              🎓 Tus Talleres
            </h2>
            {workshops.map((workshop) => (
              <div
                key={workshop.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <div
                  className={`${getDayColor(
                    workshop.day_of_week
                  )} text-white px-4 py-2 text-sm font-medium`}
                >
                  {getDayLabel(workshop.day_of_week)} - {workshop.start_time} a{" "}
                  {workshop.end_time}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {workshop.workshop_title}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {workshop.is_main_referent
                      ? "📌 Referente Principal"
                      : "👥 Referente de Apoyo"}
                  </p>

                  {/* Botones de acción - Mobile First */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      onClick={() =>
                        navigate(
                          `/teacher/workshop/${workshop.edition_id}/evaluate`
                        )
                      }
                      className="bg-blue-600 text-white py-3 px-4 rounded-lg font-medium text-center hover:bg-blue-700 transition"
                    >
                      ⭐ Evaluar
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/admin/catalog/${workshop.edition_id}`)
                      }
                      className="bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium text-center hover:bg-gray-300 transition"
                    >
                      👁️ Ver Detalle
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info rápida */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3">
            📊 Resumen Rápido
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {workshops.length}
              </div>
              <div className="text-sm text-green-700">Talleres</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {todaySessions.length}
              </div>
              <div className="text-sm text-blue-700">Sesiones Próximas</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
