/**
 * TeacherDashboard.jsx
 *
 * ZONA PROFESOR: Dashboard principal
 * Muestra los talleres donde el profesor ha sido asignado como referente
 * y las próximas sesiones del día.
 * 
 * USO DE DATOS MOCK (INVENTADOS) PARA DEMOSTRACIÓN DE DISEÑO
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Users,
  ClipboardCheck,
  Star
} from "lucide-react";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // DATOS INVENTADOS (MOCK DATA)
  const MOCK_WORKSHOPS = [
    {
      id: "w1",
      edition_id: "fake-edition-1",
      title: "Robótica e IA Aplicada",
      location: "Laboratorio T1",
      day: "Martes",
      time: "16:00 - 17:30",
      role: "Principal",
      students_count: 14,
      next_session: {
        id: "s1",
        number: 3,
        date: new Date().toISOString().split('T')[0], // HOY
        is_today: true
      },
      image_gradient: "from-blue-600 to-indigo-600"
    },
    {
      id: "w2",
      edition_id: "fake-edition-2",
      title: "Cocina Mediterránea Creativa",
      location: "Aula Cocina 2",
      day: "Jueves",
      time: "17:45 - 19:15",
      role: "Apoyo",
      students_count: 12,
      next_session: {
        id: "s2",
        number: 5,
        date: "2025-02-20",
        is_today: false
      },
      image_gradient: "from-orange-500 to-red-500"
    },
    {
      id: "w3",
      edition_id: "fake-edition-3",
      title: "Teatro Urbano y Expresión",
      location: "Auditorio",
      day: "Martes",
      time: "18:00 - 19:30",
      role: "Principal",
      students_count: 18,
      next_session: {
        id: "s3",
        number: 2,
        date: new Date().toISOString().split('T')[0], // HOY
        is_today: true
      },
      image_gradient: "from-purple-600 to-pink-600"
    }
  ];

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-400 font-medium">Cargando tu agenda...</p>
        </div>
      </div>
    );
  }

  const todaySessions = MOCK_WORKSHOPS.filter(w => w.next_session.is_today);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header Premium */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-white/80">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Panel del Profesor
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Bienvenido, {user?.full_name || "Profesor"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              {user?.full_name?.charAt(0) || "P"}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* SECCIÓN: SESIONES DE HOY */}
        {todaySessions.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4 px-1">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide text-xs">
                Sesiones de Hoy
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {todaySessions.map((workshop) => (
                <div
                  key={workshop.id}
                  onClick={() => navigate(`/teacher/workshop/${workshop.next_session.id}`)}
                  className="group bg-white rounded-2xl p-0 shadow-md hover:shadow-xl transition-all duration-300 border border-transparent hover:border-blue-100 overflow-hidden cursor-pointer relative"
                >
                  <div className={`h-2 w-full bg-gradient-to-r ${workshop.image_gradient}`}></div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {workshop.title}
                        </h3>
                        <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                          <MapPin size={14} /> {workshop.location}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase rounded-full border border-blue-100">
                        Sesión {workshop.next_session.number}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-6">
                      <div className="flex items-center gap-4 text-gray-600 text-sm">
                        <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                          <Clock size={16} className="text-gray-400" />
                          <span className="font-medium">{workshop.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Users size={16} />
                          <span>{workshop.students_count} alumnos</span>
                        </div>
                      </div>

                      <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECCIÓN: TODOS LOS TALLERES */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide text-xs mb-4 px-1 flex items-center gap-2">
            <ClipboardCheck size={16} /> Mis Talleres Asignados
          </h2>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {MOCK_WORKSHOPS.map((workshop, index) => (
              <div
                key={workshop.id}
                className={`p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-gray-50/50 transition-colors ${index !== MOCK_WORKSHOPS.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${workshop.image_gradient} flex items-center justify-center text-white shadow-md shadow-gray-200`}>
                    <Star fill="currentColor" size={20} className="opacity-90" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {workshop.title}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} /> {workshop.day}s
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> {workshop.time}
                      </span>
                      <span className={`flex items-center gap-1 font-medium ${workshop.role === 'Principal' ? 'text-indigo-600' : 'text-orange-600'}`}>
                        {workshop.role === 'Principal' ? '★ Referente' : '• Apoyo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/teacher/workshop/${workshop.next_session.id}/evaluate`)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium shadow-sm"
                  >
                    Evaluaciones
                  </button>
                  <button
                    onClick={() => navigate(`/teacher/workshop/${workshop.next_session.id}`)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-black transition-all text-sm font-medium shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
                  >
                    Pasar Lista
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default TeacherDashboard;
