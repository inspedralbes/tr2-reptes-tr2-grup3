/**
 * MyStudents.jsx
 *
 * ZONA PROFESOR: Página de Mis Alumnos
 * Lista de alumnos del taller con información detallada y notas personales.
 */
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  Users,
  User,
  FileText,
  Save,
  School,
  Edit3,
  X,
  Loader2,
  AlertCircle,
  Search,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const MyStudents = () => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Datos
  const [workshop, setWorkshop] = useState(null);
  const [students, setStudents] = useState([]);
  const [notes, setNotes] = useState({});
  const [attendanceStats, setAttendanceStats] = useState({});
  
  // Edición de notas
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Obtener taller asignado
      const workshopsRes = await api.get('/classroom/my-workshops');
      const workshops = workshopsRes.data;

      if (!workshops || workshops.length === 0) {
        setError('No tens cap taller assignat.');
        setLoading(false);
        return;
      }

      const myWorkshop = workshops[0];
      setWorkshop(myWorkshop);

      // 2. Obtener alumnos del taller
      const studentsRes = await api.get(`/classroom/students/${myWorkshop.edition_id}`);
      setStudents(studentsRes.data || []);

      // 3. Obtener notas del profesor
      try {
        const notesRes = await api.get(`/classroom/notes/${myWorkshop.edition_id}`);
        const notesMap = {};
        (notesRes.data || []).forEach(n => {
          notesMap[n.student_id] = n.note;
        });
        setNotes(notesMap);
      } catch (e) {
        console.log('Notes no disponibles:', e);
      }

      // 4. Obtener estadísticas de asistencia por alumno
      try {
        const sessionsRes = await api.get(`/classroom/sessions/${myWorkshop.edition_id}`);
        const stats = {};
        
        // Inicializar stats para cada alumno
        (studentsRes.data || []).forEach(s => {
          stats[s.id] = { present: 0, absent: 0, late: 0, total: 0 };
        });
        
        // Obtener asistencia de cada sesión
        for (const session of sessionsRes.data || []) {
          try {
            const attRes = await api.get(`/classroom/attendance/${session.id}`);
            (attRes.data || []).forEach(record => {
              if (stats[record.student_id]) {
                stats[record.student_id].total++;
                if (record.status === 'PRESENT') stats[record.student_id].present++;
                else if (record.status === 'ABSENT') stats[record.student_id].absent++;
                else if (record.status === 'LATE') stats[record.student_id].late++;
              }
            });
          } catch (e) {
            // Sesión sin asistencia
          }
        }
        
        setAttendanceStats(stats);
      } catch (e) {
        console.log('Attendance stats no disponibles:', e);
      }

    } catch (err) {
      console.error('Error carregant dades:', err);
      setError(err.response?.data?.error || 'Error carregant les dades');
    } finally {
      setLoading(false);
    }
  };

  // Guardar nota de alumno
  const handleSaveNote = async (studentId) => {
    if (!workshop) return;
    
    setSavingNote(true);
    try {
      await api.post(`/classroom/notes/${workshop.edition_id}/${studentId}`, {
        note: noteText
      });
      
      setNotes(prev => ({
        ...prev,
        [studentId]: noteText
      }));
      
      setEditingNote(null);
      setNoteText('');
      toast.success('Nota guardada');
    } catch (err) {
      console.error('Error guardant nota:', err);
      toast.error('Error al guardar la nota');
    } finally {
      setSavingNote(false);
    }
  };

  // Iniciar edición de nota
  const startEditNote = (studentId) => {
    setEditingNote(studentId);
    setNoteText(notes[studentId] || '');
  };

  // Filtrar alumnos
  const filteredStudents = students.filter(s =>
    s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.course?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium">Carregant alumnes...</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-10">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="h-7 w-7 text-blue-600" />
                Els meus Alumnes
              </h1>
              <p className="text-gray-500 mt-1">
                {students.length} alumnes al taller <span className="font-medium text-gray-700">{workshop?.workshop_title}</span>
              </p>
            </div>
            
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cercar alumne..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Alumnos */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="space-y-4">
          {filteredStudents.map((student) => {
            const stats = attendanceStats[student.id] || { present: 0, absent: 0, late: 0, total: 0 };
            const attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : null;
            
            return (
              <div
                key={student.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Info del alumno */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 overflow-hidden">
                      {student.photo_url ? (
                        <img 
                          src={student.photo_url} 
                          alt={student.student_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          {student.student_name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg">{student.student_name}</h3>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm">
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <School className="h-4 w-4" />
                          {student.school_name}
                        </span>
                        <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">
                          {student.course}
                        </span>
                      </div>
                      
                      {/* Estadísticas de asistencia */}
                      {stats.total > 0 && (
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1.5 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-600">{stats.present}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-gray-600">{stats.absent}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <span className="text-gray-600">{stats.late}</span>
                          </div>
                          {attendanceRate !== null && (
                            <div className={`text-sm font-medium px-2 py-0.5 rounded ${
                              attendanceRate >= 80 ? 'bg-green-100 text-green-700' :
                              attendanceRate >= 50 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {attendanceRate}% assistència
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sección de notas */}
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  {editingNote === student.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">Notes personals</span>
                      </div>
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Escriu les teves notes sobre aquest alumne..."
                        className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setEditingNote(null);
                            setNoteText('');
                          }}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Cancel·lar
                        </button>
                        <button
                          onClick={() => handleSaveNote(student.id)}
                          disabled={savingNote}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          {savingNote ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => startEditNote(student.id)}
                      className="cursor-pointer hover:bg-gray-100 rounded-xl p-3 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">Notes personals</span>
                        </div>
                        <Edit3 className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      {notes[student.id] ? (
                        <p className="mt-2 text-gray-700 text-sm whitespace-pre-wrap">{notes[student.id]}</p>
                      ) : (
                        <p className="mt-2 text-gray-400 text-sm italic">Toca per afegir notes...</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredStudents.length === 0 && students.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No s'han trobat alumnes amb "{searchTerm}"</p>
            </div>
          )}

          {students.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hi ha alumnes assignats a aquest taller</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyStudents;
