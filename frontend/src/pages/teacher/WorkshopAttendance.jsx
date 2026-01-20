/**
 * WorkshopAttendance.jsx
 *
 * ZONA PROFESOR: Aula Virtual / Pasar Lista
 * Lista de alumnos con botones grandes para marcar asistencia
 * Diseño PREMIUM "Mobile First" - Optimizado para uso en tablet/móvil
 * 
 * USA DATOS MOCK (INVENTADOS)
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  X,
  Clock,
  FileText,
  Save,
  Search,
  MoreVertical,
  User
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const WorkshopAttendance = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});

  // MOCK DATA: Sesión
  const MOCK_SESSION = {
    id: sessionId || "s1",
    workshop_title: "Robótica e IA Aplicada",
    session_number: 3,
    date: new Date().toISOString().split('T')[0],
    time: "16:00 - 17:30",
    location: "Laboratorio T1"
  };

  // MOCK DATA: Alumnos Inventados
  const MOCK_STUDENTS = [
    { id: "st1", name: "Marc Rojano", school: "Institut Pedralbes", avatar_color: "bg-blue-500", initials: "MR" },
    { id: "st2", name: "Lucía García", school: "Institut Tecnològic", avatar_color: "bg-pink-500", initials: "LG" },
    { id: "st3", name: "Ahmed Benali", school: "Escuela del Trabajo", avatar_color: "bg-green-500", initials: "AB" },
    { id: "st4", name: "Sofía Martí", school: "Institut Pedralbes", avatar_color: "bg-purple-500", initials: "SM" },
    { id: "st5", name: "Joan Vila", school: "Institut Joan Miró", avatar_color: "bg-orange-500", initials: "JV" },
    { id: "st6", name: "Carla Pineda", school: "Institut Tecnològic", avatar_color: "bg-teal-500", initials: "CP" },
    { id: "st7", name: "David Ruiz", school: "Institut Pedralbes", avatar_color: "bg-indigo-500", initials: "DR" },
    { id: "st8", name: "Emma Bosch", school: "Escuela del Trabajo", avatar_color: "bg-rose-500", initials: "EB" },
    { id: "st9", name: "Pol Ribas", school: "Institut Joan Miró", avatar_color: "bg-cyan-500", initials: "PR" },
    { id: "st10", name: "Nora Gil", school: "Institut Pedralbes", avatar_color: "bg-lime-500", initials: "NG" },
    { id: "st11", name: "Hugo Torres", school: "Institut Tecnològic", avatar_color: "bg-amber-500", initials: "HT" },
    { id: "st12", name: "Sara Méndez", school: "Institut Joan Miró", avatar_color: "bg-fuchsia-500", initials: "SM" },
  ];

  useEffect(() => {
    // Simular carga
    setTimeout(() => {
      setStudents(MOCK_STUDENTS);
      // Inicializar asistencia vacía
      const initAttendance = {};
      MOCK_STUDENTS.forEach(s => {
        initAttendance[s.id] = { status: null, observation: "" };
      });
      setAttendance(initAttendance);
      setLoading(false);
    }, 600);
  }, []);

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

  const handleSave = async () => {
    // Validar que se haya marcado algo (opcional, podría querer guardar parcial)
    const markedCount = Object.values(attendance).filter(a => a.status).length;
    if (markedCount === 0) {
      toast("Marca al menos un alumno", { icon: "⚠️" });
      return;
    }

    setSaving(true);
    // Simular guardado
    setTimeout(() => {
      setSaving(false);
      toast.success("Asistencia guardada correctamente");
      // Opcional: navegar atrás
      // setTimeout(() => navigate("/teacher"), 1500);
    }, 1500);
  };

  const getStatusButtonClass = (isActive, type) => {
    const baseClass = "flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all duration-200 transform active:scale-95";

    if (!isActive) return `${baseClass} bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent`;

    switch (type) {
      case "PRESENT": return `${baseClass} bg-green-100 text-green-700 border border-green-200 shadow-sm`;
      case "ABSENT": return `${baseClass} bg-red-100 text-red-700 border border-red-200 shadow-sm`;
      case "LATE": return `${baseClass} bg-yellow-100 text-yellow-700 border border-yellow-200 shadow-sm`;
      case "EXCUSED": return `${baseClass} bg-blue-100 text-blue-700 border border-blue-200 shadow-sm`;
      default: return baseClass;
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.school.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: students.length,
    marked: Object.values(attendance).filter(a => a.status).length,
    present: Object.values(attendance).filter(a => a.status === 'PRESENT').length,
    absent: Object.values(attendance).filter(a => a.status === 'ABSENT').length
  };

  const progress = (stats.marked / stats.total) * 100;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans">
      <Toaster position="bottom-center" />

      {/* HEADER STICKY */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm transition-all duration-300">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/teacher")} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600">
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate leading-tight">
                {MOCK_SESSION.workshop_title}
              </h1>
              <p className="text-xs text-gray-500">
                Sesión {MOCK_SESSION.session_number} • {new Date(MOCK_SESSION.date).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Progreso</div>
              <div className="text-lg font-bold text-indigo-600">{stats.marked}/{stats.total}</div>
            </div>
          </div>

          {/* BARRA DE PROGRESO */}
          <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* BUSCADOR */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar alumno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border-none shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        {/* LISTA DE ALUMNOS */}
        <div className="space-y-4">
          {filteredStudents.map((student) => {
            const currentStatus = attendance[student.id]?.status;
            const hasObservation = attendance[student.id]?.observation?.length > 0;

            return (
              <div key={student.id} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
                <div className="p-4 flex items-center gap-4">
                  {/* AVATAR */}
                  <div className={`h-12 w-12 rounded-full ${student.avatar_color} flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0`}>
                    {student.initials}
                  </div>

                  {/* INFO */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate text-lg">
                      {student.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                      <User size={12} /> {student.school}
                    </p>
                  </div>

                  {/* INDICADOR ESTADO (SOLO ICONO EN MÓVIL PEQUEÑO) */}
                  {currentStatus && (
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${currentStatus === 'PRESENT' ? 'bg-green-100 text-green-600' :
                        currentStatus === 'ABSENT' ? 'bg-red-100 text-red-600' :
                          currentStatus === 'LATE' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                      {currentStatus === 'PRESENT' && <Check size={18} strokeWidth={3} />}
                      {currentStatus === 'ABSENT' && <X size={18} strokeWidth={3} />}
                      {currentStatus === 'LATE' && <Clock size={18} strokeWidth={3} />}
                      {currentStatus === 'EXCUSED' && <FileText size={18} strokeWidth={3} />}
                    </div>
                  )}
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="bg-gray-50/50 p-2 sm:p-3 border-t border-gray-100">
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => handleStatusChange(student.id, "PRESENT")}
                      className={getStatusButtonClass(currentStatus === "PRESENT", "PRESENT")}
                    >
                      <span className="hidden sm:inline">Presente</span>
                      <span className="sm:hidden">Pres.</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, "LATE")}
                      className={getStatusButtonClass(currentStatus === "LATE", "LATE")}
                    >
                      <span className="hidden sm:inline">Retraso</span>
                      <span className="sm:hidden">Retr.</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, "ABSENT")}
                      className={getStatusButtonClass(currentStatus === "ABSENT", "ABSENT")}
                    >
                      <span className="hidden sm:inline">Ausente</span>
                      <span className="sm:hidden">Aus.</span>
                    </button>
                  </div>

                  {/* CAMPO DE OBSERVACIÓN */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Añadir comentario (opcional)..."
                      value={attendance[student.id]?.observation || ""}
                      onChange={(e) => handleObservationChange(student.id, e.target.value)}
                      className={`w-full py-2 px-3 pl-9 rounded-lg text-sm border-none bg-white ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 transition-shadow ${hasObservation ? 'ring-indigo-300 bg-indigo-50/30' : ''}`}
                    />
                    <FileText size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${hasObservation ? 'text-indigo-500' : 'text-gray-400'}`} />
                  </div>
                </div>
              </div>
            );
          })}

          {filteredStudents.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No se encontraron alumnos con ese nombre.
            </div>
          )}
        </div>
      </main>

      {/* FOOTER FLOTANTE */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg z-40 pb-6 sm:pb-4 backdrop-blur-lg bg-white/90">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="text-sm font-medium text-gray-600 hidden sm:block">
            {stats.marked === stats.total ? "✨ Todos marcados" : `Faltan ${stats.total - stats.marked} alumnos`}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex-1 bg-gray-900 text-white rounded-xl py-3.5 px-6 font-bold shadow-lg shadow-gray-900/20 flex items-center justify-center gap-3 transition-transform active:scale-[0.98] ${saving ? 'opacity-80' : 'hover:bg-black'}`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save size={20} />
                Guardar Asistencia
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkshopAttendance;
