/**
 * TeacherDashboard.jsx
 *
 * ZONA PROFESOR: Dashboard principal - El Meu Taller
 * Muestra info del taller, sesiones y estadísticas de progreso.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  Calendar,
  Clock,
  ChevronRight,
  ClipboardCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  TrendingUp,
  Loader2,
  Users,
  RefreshCw
} from "lucide-react";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Datos del taller
  const [workshop, setWorkshop] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);

  // Mapeo de días en catalán
  const dayLabels = {
    'MONDAY': 'Dilluns',
    'TUESDAY': 'Dimarts',
    'WEDNESDAY': 'Dimecres',
    'THURSDAY': 'Dijous',
    'FRIDAY': 'Divendres'
  };

  useEffect(() => {
    loadTeacherData();
  }, []);

  const loadTeacherData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Obtener talleres asignados al profesor
      const workshopsRes = await api.get('/classroom/my-workshops');
      const workshops = workshopsRes.data;

      if (!workshops || workshops.length === 0) {
        setError('No tens cap taller assignat.');
        setLoading(false);
        return;
      }

      // El profesor solo tiene 1 taller asignado
      const myWorkshop = workshops[0];
      setWorkshop(myWorkshop);

      // 2. Obtener sesiones del taller
      const sessionsRes = await api.get(`/classroom/sessions/${myWorkshop.edition_id}`);
      setSessions(sessionsRes.data || []);

      // 3. Obtener estadísticas desde el backend
      try {
        const statsRes = await api.get(`/classroom/stats/${myWorkshop.edition_id}`);
        setStats(statsRes.data);
      } catch (e) {
        console.log('Stats no disponibles:', e);
        setStats({
          totalStudents: parseInt(myWorkshop.total_students) || 0,
          totalSessions: sessionsRes.data?.length || 0,
          completedSessions: 0,
          attendanceRate: 0,
          totalPresent: 0,
          totalAbsent: 0,
          totalLate: 0
        });
      }

    } catch (err) {
      console.error('Error carregant dades:', err);
      setError(err.response?.data?.error || 'Error carregant les dades del professor');
    } finally {
      setLoading(false);
    }
  };

  // Obtener próxima sesión
  const getNextSession = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureSessions = sessions
      .filter(s => {
        const sessionDate = new Date(s.date);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate >= today;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return futureSessions[0] || null;
  };

  // Obtener sesión de hoy
  const getTodaySession = () => {
    const today = new Date().toISOString().split('T')[0];
    return sessions.find(s => s.date.split('T')[0] === today);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium">Carregant el teu taller...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Atenció</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const nextSession = getNextSession();
  const todaySession = getTodaySession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-10">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <BookOpen className="h-7 w-7 text-blue-600" />
                El Meu Taller
              </h1>
              <p className="text-gray-500 mt-1">
                Hola, {user?.name?.split(' ')[0] || 'Professor'}! 👋
              </p>
            </div>
            <button
              onClick={loadTeacherData}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Actualitzar"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        
        {/* Info del Taller */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h2 className="text-2xl font-bold">{workshop?.workshop_title}</h2>
            <p className="text-blue-100 mt-1">{workshop?.provider_name}</p>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{dayLabels[workshop?.day_of_week] || workshop?.day_of_week}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="font-medium">
                  {workshop?.start_time?.slice(0, 5)} - {workshop?.end_time?.slice(0, 5)}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{stats?.totalStudents || workshop?.total_students || 0} alumnes</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                <BookOpen className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{sessions.length} sessions</span>
              </div>
            </div>
          </div>
        </section>

        {/* Sesión de Hoy - Destacada */}
        {todaySession && (
          <section 
            onClick={() => navigate(`/teacher/attendance/${todaySession.id}`)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white cursor-pointer hover:shadow-xl transition-all transform hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                  <span className="text-green-100 text-sm font-medium uppercase tracking-wide">Sessió d'avui</span>
                </div>
                <h3 className="text-2xl font-bold">Sessió {todaySession.session_number}</h3>
                <p className="text-green-100 mt-1">
                  {new Date(todaySession.date).toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <div className="bg-white/20 rounded-full p-4 backdrop-blur-sm">
                <ClipboardCheck className="h-8 w-8" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-green-100">
              <span>Toca per passar llista</span>
              <ChevronRight className="h-5 w-5" />
            </div>
          </section>
        )}

        {/* Estadísticas de Progreso */}
        {stats && (
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Progrés de la Classe
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="text-3xl font-bold text-blue-600">{stats.completedSessions}</div>
                <div className="text-sm text-gray-500">Sessions fetes</div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${stats.totalSessions > 0 ? (stats.completedSessions / stats.totalSessions) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="text-3xl font-bold text-green-600">{stats.attendanceRate}%</div>
                <div className="text-sm text-gray-500">Assistència</div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${stats.attendanceRate}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-emerald-600">{stats.totalPresent}</span>
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="text-sm text-gray-500">Presents</div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-red-600">{stats.totalAbsent}</span>
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div className="text-sm text-gray-500">Absències</div>
              </div>
            </div>
          </section>
        )}

        {/* Próxima Sesión */}
        {nextSession && !todaySession && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Propera Sessió</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold text-gray-900">Sessió {nextSession.session_number}</div>
                <div className="text-gray-500 mt-1">
                  {new Date(nextSession.date).toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              </div>
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium">
                {Math.ceil((new Date(nextSession.date) - new Date()) / (1000 * 60 * 60 * 24))} dies
              </div>
            </div>
          </section>
        )}

        {/* Lista de Sesiones */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Totes les Sessions
          </h3>
          <div className="space-y-3">
            {sessions.map((session) => {
              const sessionDate = new Date(session.date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              sessionDate.setHours(0, 0, 0, 0);
              const isPast = sessionDate < today;
              const isToday = sessionDate.getTime() === today.getTime();

              return (
                <div
                  key={session.id}
                  onClick={() => navigate(`/teacher/attendance/${session.id}`)}
                  className={`bg-white rounded-xl p-4 shadow-sm border cursor-pointer transition-all hover:shadow-md ${
                    isToday ? 'border-green-300 bg-green-50' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                        isPast ? 'bg-gray-100 text-gray-400' : isToday ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {session.session_number}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          Sessió {session.session_number}
                          {isToday && <span className="ml-2 text-green-600 text-sm">(Avui)</span>}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(session.date).toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default TeacherDashboard;
