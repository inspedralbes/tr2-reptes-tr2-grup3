/**
 * WorkshopEvaluate.jsx
 * 
 * ZONA PROFESOR: Evaluar Alumnos
 * Formulario para puntuar competencias técnicas y transversales (1-5)
 * Diseño "Mobile First"
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const WorkshopEvaluate = () => {
  const { editionId } = useParams();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState([]);
  const [evaluations, setEvaluations] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);

  // Competencias a evaluar
  const competencies = {
    technical: [
      { id: "tech_knowledge", label: "Conocimientos técnicos" },
      { id: "tech_skills", label: "Habilidades prácticas" },
      { id: "tech_problem_solving", label: "Resolución de problemas" },
    ],
    transversal: [
      { id: "teamwork", label: "Trabajo en equipo" },
      { id: "communication", label: "Comunicación" },
      { id: "responsibility", label: "Responsabilidad" },
      { id: "creativity", label: "Creatividad" },
    ]
  };

  useEffect(() => {
    loadStudents();
  }, [editionId]);

  /**
   * Carga los alumnos del taller
   */
  const loadStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${API_URL}/classroom/students/${editionId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setStudents(data);
        
        // Inicializar evaluaciones vacías
        const initialEvals = {};
        data.forEach(s => {
          initialEvals[s.id] = {
            tech_knowledge: 0,
            tech_skills: 0,
            tech_problem_solving: 0,
            teamwork: 0,
            communication: 0,
            responsibility: 0,
            creativity: 0,
            comments: ""
          };
        });
        setEvaluations(initialEvals);
      }
    } catch (err) {
      console.error("Error cargando alumnos:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualiza una puntuación
   */
  const updateScore = (studentId, competencyId, score) => {
    setEvaluations(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [competencyId]: score
      }
    }));
  };

  /**
   * Actualiza comentarios
   */
  const updateComments = (studentId, comments) => {
    setEvaluations(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        comments
      }
    }));
  };

  /**
   * Guarda las evaluaciones
   */
  const saveEvaluations = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      
      await fetch(`${API_URL}/classroom/evaluations/${editionId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ evaluations })
      });

      alert("✅ Evaluaciones guardadas correctamente");
      navigate("/teacher");
    } catch (err) {
      alert("❌ Error guardando evaluaciones: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Componente de puntuación con estrellas
   */
  const ScoreSelector = ({ studentId, competencyId, label }) => {
    const currentScore = evaluations[studentId]?.[competencyId] || 0;
    
    return (
      <div className="mb-3">
        <label className="text-sm text-gray-600 block mb-1">{label}</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              onClick={() => updateScore(studentId, competencyId, score)}
              className={`w-10 h-10 rounded-lg font-bold transition ${
                currentScore >= score
                  ? "bg-yellow-400 text-yellow-900"
                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              }`}
            >
              {score <= currentScore ? "★" : "☆"}
            </button>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Calcula la media de un alumno
   */
  const getStudentAverage = (studentId) => {
    const eval_ = evaluations[studentId];
    if (!eval_) return 0;
    
    const scores = Object.values(eval_).filter(v => typeof v === 'number' && v > 0);
    if (scores.length === 0) return 0;
    
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Cargando alumnos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sticky top-0 z-10">
        <button 
          onClick={() => navigate("/teacher")}
          className="text-blue-200 hover:text-white mb-2"
        >
          ← Volver
        </button>
        <h1 className="text-xl font-bold">⭐ Evaluar Alumnos</h1>
        <p className="text-blue-200 text-sm mt-1">
          Puntúa del 1 al 5 las competencias de cada alumno
        </p>
      </div>

      {/* Lista de alumnos */}
      <div className="p-4">
        {students.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-gray-500">No hay alumnos para evaluar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {students.map((student) => (
              <div key={student.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Cabecera del alumno (clickeable) */}
                <button
                  onClick={() => setExpandedStudent(
                    expandedStudent === student.id ? null : student.id
                  )}
                  className="w-full p-4 flex items-center gap-3 text-left"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {student.full_name?.charAt(0) || "?"}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{student.full_name}</h3>
                    <p className="text-sm text-gray-500">{student.school_name || "Centro"}</p>
                  </div>

                  {/* Media */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {getStudentAverage(student.id)}
                    </div>
                    <div className="text-xs text-gray-400">Media</div>
                  </div>

                  {/* Indicador expandir */}
                  <span className="text-gray-400">
                    {expandedStudent === student.id ? "▲" : "▼"}
                  </span>
                </button>

                {/* Formulario de evaluación (expandible) */}
                {expandedStudent === student.id && (
                  <div className="px-4 pb-4 border-t">
                    {/* Competencias técnicas */}
                    <h4 className="font-semibold text-gray-700 mt-4 mb-3">
                      🔧 Competencias Técnicas
                    </h4>
                    {competencies.technical.map((comp) => (
                      <ScoreSelector
                        key={comp.id}
                        studentId={student.id}
                        competencyId={comp.id}
                        label={comp.label}
                      />
                    ))}

                    {/* Competencias transversales */}
                    <h4 className="font-semibold text-gray-700 mt-4 mb-3">
                      🤝 Competencias Transversales
                    </h4>
                    {competencies.transversal.map((comp) => (
                      <ScoreSelector
                        key={comp.id}
                        studentId={student.id}
                        competencyId={comp.id}
                        label={comp.label}
                      />
                    ))}

                    {/* Comentarios */}
                    <h4 className="font-semibold text-gray-700 mt-4 mb-2">
                      💬 Comentarios
                    </h4>
                    <textarea
                      value={evaluations[student.id]?.comments || ""}
                      onChange={(e) => updateComments(student.id, e.target.value)}
                      placeholder="Observaciones sobre el alumno..."
                      rows={3}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botón flotante de guardar */}
      {students.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
          <button
            onClick={saveEvaluations}
            disabled={saving}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? "Guardando..." : "💾 Guardar Evaluaciones"}
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkshopEvaluate;
