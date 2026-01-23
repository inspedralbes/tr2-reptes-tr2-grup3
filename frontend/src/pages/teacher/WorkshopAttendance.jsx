/**
 * WorkshopAttendance.jsx
 *
 * ZONA PROFESOR: Pasar Lista
 * Vista para marcar asistencia de los alumnos en una sesión específica.
 * Diseño optimizado para tablet/móvil.
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  ArrowLeft,
  Check,
  X,
  Clock,
  Save,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  Users
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const WorkshopAttendance = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Obtener info del taller del profesor para la sesión
      const workshopsRes = await api.get('/classroom/my-workshops');
      const myWorkshop = workshopsRes.data[0];

      if (!myWorkshop) {
        setError('No tens cap taller assignat.');
        return;
      }

      // 2. Obtener sesiones y encontrar la actual
      const sessionsRes = await api.get(`/classroom/sessions/${myWorkshop.edition_id}`);
      const currentSession = sessionsRes.data.find(s => s.id === sessionId);

      if (!currentSession) {
        setError('Sessió no trobada.');
        return;
      }

      setSession({
        ...currentSession,
        workshop_title: myWorkshop.workshop_title,
        provider_name: myWorkshop.provider_name
      });

      // 3. Obtener alumnos del taller
      const studentsRes = await api.get(`/classroom/students/${myWorkshop.edition_id}`);
      setStudents(studentsRes.data || []);

      // 4. Obtener asistencia existente (si la hay)
      try {
        const attRes = await api.get(`/classroom/attendance/${sessionId}`);
        const existingAttendance = {};
        (attRes.data || []).forEach(record => {
          existingAttendance[record.student_id] = {
            status: record.status,
            observation: record.observation || ''
          };
        });
        
        // Inicializar con datos existentes o vacío
        const initAttendance = {};
        (studentsRes.data || []).forEach(s => {
          initAttendance[s.id] = existingAttendance[s.id] || { status: null, observation: '' };
        });
        setAttendance(initAttendance);
      } catch (e) {
        // No hay asistencia previa, inicializar vacío
        const initAttendance = {};
        (studentsRes.data || []).forEach(s => {
          initAttendance[s.id] = { status: null, observation: '' };
        });
        setAttendance(initAttendance);
      }

    } catch (err) {
      console.error('Error carregant sessió:', err);
      setError(err.response?.data?.error || 'Error carregant la sessió');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleObservationChange = (studentId, observation) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], observation }
    }));
  };

  const markAllPresent = () => {
    const newAttendance = {};
    students.forEach(s => {
      newAttendance[s.id] = { ...attendance[s.id], status: 'PRESENT' };
    });
    setAttendance(newAttendance);
    toast.success('Tots marcats com a presents');
  };

  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    // Preparar datos para enviar
    const attendanceData = Object.entries(attendance)
      .filter(([_, data]) => data.status) // Solo enviar los que tienen estado
      .map(([studentId, data]) => ({
        studentId,
        status: data.status,
        observation: data.observation || null
      }));

    if (attendanceData.length === 0) {
      toast("Marca almenys un alumne", { icon: "⚠️" });
      return;
    }

    setSaving(true);
    try {
      await api.post(`/classroom/attendance/${sessionId}`, {
        attendance: attendanceData
      });
      setSaved(true);
      toast.success("Assistència guardada correctament! ✅");
      
      // NO redirigir automáticamente - dejar que el usuario vea el resultado
    } catch (err) {
      console.error('Error guardant assistència:', err);
      toast.error(err.response?.data?.error || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const getStatusButtonClass = (isActive, type) => {
    const baseClass = "flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-all duration-200 transform active:scale-95";

    if (!isActive) return `${baseClass} bg-gray-50 text-gray-400 hover:bg-gray-100 border-2 border-transparent`;

    switch (type) {
      case "PRESENT": return `${baseClass} bg-green-100 text-green-700 border-2 border-green-300 shadow-sm`;
      case "ABSENT": return `${baseClass} bg-red-100 text-red-700 border-2 border-red-300 shadow-sm`;
      case "LATE": return `${baseClass} bg-amber-100 text-amber-700 border-2 border-amber-300 shadow-sm`;
      default: return baseClass;
    }
  };

  const filteredStudents = students.filter(s =>
    s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.school_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: students.length,
    marked: Object.values(attendance).filter(a => a.status).length,
    present: Object.values(attendance).filter(a => a.status === 'PRESENT').length,
    absent: Object.values(attendance).filter(a => a.status === 'ABSENT').length,
    late: Object.values(attendance).filter(a => a.status === 'LATE').length
  };

  const progress = stats.total > 0 ? (stats.marked / stats.total) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
          <p className="text-gray-500">Carregant sessió...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/teacher')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tornar al panell
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Toaster position="top-center" />

      {/* HEADER STICKY */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/teacher")} 
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {session?.workshop_title}
              </h1>
              <p className="text-sm text-gray-500">
                Sessió {session?.session_number} • {new Date(session?.date).toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

          {/* BARRA DE PROGRESO */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Progrés</span>
              <span className="font-medium text-gray-700">{stats.marked} / {stats.total}</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* ESTADÍSTICAS RÁPIDAS */}
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600">{stats.present} presents</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600">{stats.absent} absents</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-gray-600">{stats.late} tard</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* ACCIONES RÁPIDAS */}
        <div className="flex gap-3">
          <button
            onClick={markAllPresent}
            className="flex-1 py-3 px-4 bg-green-50 text-green-700 rounded-xl font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} />
            Tots presents
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cercar alumne..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* LISTA DE ALUMNOS */}
        <div className="space-y-3">
          {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No s'han trobat alumnes</p>
            </div>
          ) : (
            filteredStudents.map((student) => {
              const currentStatus = attendance[student.id]?.status;
              const initials = student.student_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
              
              // Color del avatar basado en el nombre
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500'];
              const colorIndex = student.student_name?.charCodeAt(0) % colors.length || 0;
              const avatarColor = colors[colorIndex];

              return (
                <div key={student.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4">
                    {/* INFO ALUMNO */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`h-12 w-12 rounded-full overflow-hidden ${!student.photo_url ? avatarColor : 'bg-gray-100'} flex items-center justify-center text-white font-bold shadow-sm shrink-0`}>
                        {student.photo_url ? (
                          <img 
                            src={student.photo_url} 
                            alt={student.student_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{student.student_name}</h3>
                        <p className="text-sm text-gray-500 truncate">{student.school_name}</p>
                      </div>
                      {currentStatus && (
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          currentStatus === 'PRESENT' ? 'bg-green-100 text-green-700' :
                          currentStatus === 'ABSENT' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {currentStatus === 'PRESENT' ? 'Present' : 
                           currentStatus === 'ABSENT' ? 'Absent' : 'Tard'}
                        </div>
                      )}
                    </div>

                    {/* BOTONES DE ESTADO */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(student.id, 'PRESENT')}
                        className={getStatusButtonClass(currentStatus === 'PRESENT', 'PRESENT')}
                      >
                        <Check size={20} />
                        <span className="hidden sm:inline">Present</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'ABSENT')}
                        className={getStatusButtonClass(currentStatus === 'ABSENT', 'ABSENT')}
                      >
                        <X size={20} />
                        <span className="hidden sm:inline">Absent</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'LATE')}
                        className={getStatusButtonClass(currentStatus === 'LATE', 'LATE')}
                      >
                        <Clock size={20} />
                        <span className="hidden sm:inline">Tard</span>
                      </button>
                    </div>

                    {/* OBSERVACIÓN (solo si está ausente o llegó tarde) */}
                    {(currentStatus === 'ABSENT' || currentStatus === 'LATE') && (
                      <div className="mt-3">
                        <input
                          type="text"
                          placeholder="Observació (opcional)..."
                          value={attendance[student.id]?.observation || ''}
                          onChange={(e) => handleObservationChange(student.id, e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* BOTÓN GUARDAR FLOTANTE */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-100 to-transparent">
        <div className="max-w-3xl mx-auto space-y-3">
          {saved && (
            <div className="bg-green-100 border border-green-300 text-green-800 rounded-xl p-3 text-center font-medium flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Assistència guardada correctament!
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/teacher')}
              className="flex-1 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
            >
              ← Tornar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || stats.marked === 0}
              className={`flex-[2] py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition-all ${
                saved
                  ? 'bg-green-500 text-white'
                  : saving || stats.marked === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl transform hover:scale-[1.02]'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Guardant...
                </>
              ) : saved ? (
                <>
                  <CheckCircle size={22} />
                  Guardat ✓
                </>
              ) : (
                <>
                  <Save size={22} />
                  Guardar ({stats.marked}/{stats.total})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkshopAttendance;
