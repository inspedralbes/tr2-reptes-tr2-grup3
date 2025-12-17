/**
 * WorkshopAttendance.jsx
 * 
 * ZONA PROFESOR: Aula Virtual / Pasar Lista
 * Lista de alumnos con botones para marcar asistencia
 * Diseño "Mobile First" - pensado para usar de pie en el taller
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const WorkshopAttendance = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [sessionId]);

  /**
   * Carga datos de la sesión y alumnos
   */
  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { "Authorization": `Bearer ${token}` };

      // Cargar sesiones para obtener info de la sesión actual
      const sessionsRes = await fetch(`${API_URL}/sessions`, { headers });
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        const currentSession = sessionsData.find(s => s.id === sessionId);
        if (currentSession) {
          setSession(currentSession);
          
          // Cargar alumnos del taller
          const studentsRes = await fetch(
            `${API_URL}/classroom/students/${currentSession.workshop_edition_id}`, 
            { headers }
          );
          if (studentsRes.ok) {
            const studentsData = await studentsRes.json();
            setStudents(studentsData);
            
            // Inicializar estado de asistencia
            const initialAttendance = {};
            studentsData.forEach(s => {
              initialAttendance[s.id] = { status: null, observation: "" };
            });
            setAttendance(initialAttendance);
          }
        }
      }

    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Marca la asistencia de un alumno
   */
  const markAttendance = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  /**
   * Actualiza la observación de un alumno
   */
  const updateObservation = (studentId, observation) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], observation }
    }));
  };

  /**
   * Guarda la asistencia en el backend
   */
  const saveAttendanceData = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      
      // Preparar array de asistencia
      const attendanceArray = Object.entries(attendance)
        .filter(([_, data]) => data.status)
        .map(([studentId, data]) => ({
          studentId,
          status: data.status,
          observation: data.observation
        }));

      const res = await fetch(`${API_URL}/classroom/attendance/${sessionId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ attendance: attendanceArray })
      });

      if (res.ok) {
        alert("✅ Asistencia guardada correctamente");
      } else {
        throw new Error("Error al guardar");
      }
    } catch (err) {
      alert("❌ Error guardando asistencia: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Botón de asistencia con estilo
   */
  const AttendanceButton = ({ studentId, status, color, label }) => {
    const isSelected = attendance[studentId]?.status === status;
    return (
      <button
        onClick={() => markAttendance(studentId, status)}
        className={`py-2 px-3 rounded-lg font-medium text-sm transition ${
          isSelected 
            ? `${color} text-white shadow-md` 
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        {label}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Cargando aula virtual...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sticky top-0 z-10">
        <button 
          onClick={() => navigate("/teacher")}
          className="text-green-200 hover:text-white mb-2"
        >
          ← Volver
        </button>
        <h1 className="text-xl font-bold">📋 Pasar Lista</h1>
        {session && (
          <p className="text-green-200 mt-1">
            Sesión #{session.session_number} - {new Date(session.date).toLocaleDateString("es-ES")}
          </p>
        )}
      </div>

      {/* Lista de alumnos */}
      <div className="p-4">
        {students.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-gray-500">No hay alumnos registrados en este taller</p>
          </div>
        ) : (
          <div className="space-y-3">
            {students.map((student) => (
              <div key={student.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {student.student_name?.charAt(0) || "?"}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{student.student_name}</h3>
                      <p className="text-sm text-gray-500">{student.school_name || "Centro"}</p>
                    </div>
                  </div>

                  {/* Botones de asistencia */}
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <AttendanceButton 
                      studentId={student.id} 
                      status="PRESENT" 
                      color="bg-green-500"
                      label="✅ Presente"
                    />
                    <AttendanceButton 
                      studentId={student.id} 
                      status="ABSENT" 
                      color="bg-red-500"
                      label="❌ Falta"
                    />
                    <AttendanceButton 
                      studentId={student.id} 
                      status="LATE" 
                      color="bg-yellow-500"
                      label="⏰ Retraso"
                    />
                    <AttendanceButton 
                      studentId={student.id} 
                      status="EXCUSED" 
                      color="bg-blue-500"
                      label="📝 Justif."
                    />
                  </div>

                  {/* Campo de observación (colapsable) */}
                  {attendance[student.id]?.status && (
                    <input
                      type="text"
                      placeholder="Añadir observación..."
                      value={attendance[student.id]?.observation || ""}
                      onChange={(e) => updateObservation(student.id, e.target.value)}
                      className="mt-3 w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botón flotante de guardar */}
      {students.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
          <button
            onClick={saveAttendanceData}
            disabled={saving}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {saving ? "Guardando..." : "💾 Guardar Asistencia"}
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkshopAttendance;
