/**
 * WorkshopEvaluate.jsx
 *
 * ZONA PROFESOR: Evaluar Alumnos
 * Formulario para puntuar competencias técnicas y transversales
 * Diseño PREMIUM con datos MOCK
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  ChevronDown,
  ChevronUp,
  Star,
  MessageSquare,
  Award,
  Zap
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const WorkshopEvaluate = () => {
  const { editionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState([]);
  const [evaluations, setEvaluations] = useState({});
  const [expandedStudent, setExpandedStudent] = useState(null);

  // MOCK DATA: Competencias
  const COMPETENCIES = {
    technical: [
      { id: "tech_knowledge", label: "Coneixements tècnics rebuts" },
      { id: "tech_skills", label: "Habilitat en l'execució pràctica" },
      { id: "tech_safety", label: "Compliment de normes de seguretat" },
    ],
    transversal: [
      { id: "teamwork", label: "Col·laboració i treball en equip" },
      { id: "proactivity", label: "Iniciativa i proactivitat" },
      { id: "respect", label: "Actitud i respecte cap als companys" },
    ],
  };

  // MOCK DATA: Alumnos
  const MOCK_STUDENTS = [
    { id: "st1", name: "Marc Rojano", school: "Institut Pedralbes", avatar_color: "bg-blue-500", initials: "MR" },
    { id: "st2", name: "Lucía García", school: "Institut Tecnològic", avatar_color: "bg-pink-500", initials: "LG" },
    { id: "st3", name: "Ahmed Benali", school: "Escuela del Trabajo", avatar_color: "bg-green-500", initials: "AB" },
    { id: "st4", name: "Sofía Martí", school: "Institut Pedralbes", avatar_color: "bg-purple-500", initials: "SM" },
    { id: "st5", name: "Joan Vila", school: "Institut Joan Miró", avatar_color: "bg-orange-500", initials: "JV" },
  ];

  useEffect(() => {
    setTimeout(() => {
      setStudents(MOCK_STUDENTS);
      // Inicializar evaluaciones
      const initialEvals = {};
      MOCK_STUDENTS.forEach(s => {
        initialEvals[s.id] = {
          // Puntuaciones aleatorias iniciales para demo (o vacías)
          tech_knowledge: 0,
          tech_skills: 0,
          tech_safety: 0,
          teamwork: 0,
          proactivity: 0,
          respect: 0,
          comments: ""
        };
      });
      setEvaluations(initialEvals);
      setLoading(false);
    }, 600);
  }, []);

  const updateScore = (studentId, competencyId, score) => {
    setEvaluations(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [competencyId]: score
      }
    }));
  };

  const updateComments = (studentId, value) => {
    setEvaluations(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        comments: value
      }
    }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Avaluacions guardades correctament");
      setTimeout(() => navigate("/teacher"), 1000);
    }, 1500);
  };

  const getStudentAverage = (studentId) => {
    const evalData = evaluations[studentId];
    if (!evalData) return 0;

    // Solo contar las keys numéricas > 0
    const scores = Object.entries(evalData)
      .filter(([key, val]) => typeof val === 'number')
      .map(([_, val]) => val);

    const filledScores = scores.filter(s => s > 0);
    if (filledScores.length === 0) return 0;

    const sum = filledScores.reduce((a, b) => a + b, 0);
    return (sum / filledScores.length).toFixed(1);
  };

  const ScoreComponent = ({ studentId, compId, label, type }) => {
    const score = evaluations[studentId]?.[compId] || 0;

    return (
      <div className="mb-4">
        <div className="flex justify-between mb-1.5">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <span className={`text-sm font-bold ${score > 0 ? 'text-indigo-600' : 'text-gray-300'}`}>
            {score > 0 ? score : '-'} / 5
          </span>
        </div>
        <div className="flex gap-1 justify-between sm:justify-start">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => updateScore(studentId, compId, star)}
              className={`h-10 w-10 sm:h-9 sm:w-12 rounded-lg transition-all duration-200 flex items-center justify-center ${score >= star
                ? (type === 'tech' ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200')
                : 'bg-gray-50 text-gray-300 hover:bg-gray-100'
                }`}
            >
              <Star size={20} fill={score >= star ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32">
      <Toaster position="bottom-center" />

      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/80">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/teacher")} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Avaluació de Taller</h1>
              <p className="text-xs text-gray-500">Robòtica i IA Aplicada</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {students.map((student) => {
          const isExpanded = expandedStudent === student.id;
          const userAvg = getStudentAverage(student.id);

          return (
            <div
              key={student.id}
              className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-indigo-200 ring-2 ring-indigo-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
            >
              {/* CARD HEADER (CLICK TO EXPAND) */}
              <button
                onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                className="w-full text-left p-4 flex items-center gap-4 focus:outline-none"
              >
                <div className={`h-12 w-12 rounded-full ${student.avatar_color} flex items-center justify-center text-white font-bold shadow-sm shrink-0`}>
                  {student.initials}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{student.name}</h3>
                  <p className="text-xs text-gray-500">{student.school}</p>
                </div>

                <div className="text-right flex flex-col items-end">
                  {Number(userAvg) > 0 && (
                    <div className={`px-2 py-0.5 rounded-full text-xs font-bold mb-1 ${Number(userAvg) >= 4 ? 'bg-green-100 text-green-700' : Number(userAvg) >= 3 ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      Mitjana: {userAvg}
                    </div>
                  )}
                  {isExpanded ? <ChevronUp className="text-gray-400" size={20} /> : <ChevronDown className="text-gray-400" size={20} />}
                </div>
              </button>

              {/* EXPANDED CONTENT */}
              {isExpanded && (
                <div className="px-5 pb-6 pt-2 border-t border-gray-100 bg-gray-50/30">
                  <div className="grid md:grid-cols-2 gap-8 mb-6">
                    {/* COLUMNA TECNICA */}
                    <div>
                      <div className="flex items-center gap-2 mb-4 text-indigo-700">
                        <Zap size={18} />
                        <h4 className="font-bold text-sm uppercase tracking-wide">Competències Tècniques</h4>
                      </div>
                      {COMPETENCIES.technical.map(c => (
                        <ScoreComponent key={c.id} studentId={student.id} compId={c.id} label={c.label} type="tech" />
                      ))}
                    </div>

                    {/* COLUMNA TRANSVERSAL */}
                    <div>
                      <div className="flex items-center gap-2 mb-4 text-emerald-700">
                        <Award size={18} />
                        <h4 className="font-bold text-sm uppercase tracking-wide">Competències Transversals</h4>
                      </div>
                      {COMPETENCIES.transversal.map(c => (
                        <ScoreComponent key={c.id} studentId={student.id} compId={c.id} label={c.label} type="soft" />
                      ))}
                    </div>
                  </div>

                  {/* COMENTARIOS */}
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-gray-700">
                      <MessageSquare size={16} />
                      <label className="font-bold text-sm">Observacions i Comentaris</label>
                    </div>
                    <textarea
                      value={evaluations[student.id]?.comments || ""}
                      onChange={(e) => updateComments(student.id, e.target.value)}
                      placeholder="Escriu aquí notes sobre l'acompliment de l'alumne..."
                      className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-3 px-4 min-h-[80px]"
                    ></textarea>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* FOOTER SAVE */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 z-40 shadow-lg">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl py-4 font-bold text-lg shadow-indigo-200 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <>
                <Save size={20} />
                Guardar Totes les Avaluacions
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkshopEvaluate;
