/**
 * WorkshopDetail.jsx
 *
 * US #17: Assignació de Referents (Admin)
 * Pàgina de detalls d'un taller amb assignació de professors referents
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../../api/client";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const WorkshopDetail = () => {
  const { editionId } = useParams();
  const navigate = useNavigate();

  const [edition, setEdition] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [assignedTeachers, setAssignedTeachers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [editionId]);

  const getAuthHeaders = () => {
    // Ya no es necesario con el cliente centralizado
    return {};
  };

  /**
   * Carrega totes les dades del taller
   */
  /**
   * Carrega totes les dades del taller
   */
  const loadData = async () => {
    try {
      setLoading(true);

      const [editionRes, candidatesRes, assignedRes, sessionsRes] =
        await Promise.all([
          client.get("/catalog/workshops"),
          client.get(`/teachers/candidates/${editionId}`),
          client.get(`/teachers/assigned/${editionId}`),
          client.get(`/sessions/${editionId}`),
        ]);

      // Processar edició
      const workshops = editionRes.data;
      for (const workshop of workshops) {
        const ed = workshop.editions?.find((e) => e.id === editionId);
        if (ed) {
          setEdition({
            ...ed,
            workshop_title: workshop.title,
            workshop_description: workshop.description,
          });
          break;
        }
      }

      setCandidates(candidatesRes.data);
      setAssignedTeachers(assignedRes.data);
      setSessions(sessionsRes.data);

      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Assignar un professor com a referent
   */
  /**
   * Assignar un professor com a referent
   */
  const handleAssignTeacher = async (teacherUserId, isMain = true) => {
    try {
      await client.post("/teachers/assign", {
        workshop_edition_id: editionId,
        teacher_user_id: teacherUserId,
        is_main_referent: isMain,
      });

      loadData();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  /**
   * Eliminar assignació d'un professor
   */
  /**
   * Eliminar assignació d'un professor
   */
  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm("Eliminar aquest professor del taller?")) return;

    try {
      await client.delete(`/teachers/assign/${assignmentId}`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  /**
   * Generar sessions del calendari
   */
  /**
   * Generar sessions del calendari
   */
  const handleGenerateSessions = async () => {
    try {
      const res = await client.post(`/sessions/generate/${editionId}`, {});

      const data = res.data;
      alert(`Sessions generades: ${data.sessions?.length || 0}`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  /**
   * Cancel·lar una sessió
   */
  /**
   * Cancel·lar una sessió
   */
  const handleCancelSession = async (sessionId) => {
    try {
      await client.put(`/sessions/${sessionId}/cancel`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  /**
   * Reactivar una sessió cancel·lada
   */
  /**
   * Reactivar una sessió cancel·lada
   */
  const handleReactivateSession = async (sessionId) => {
    try {
      await client.put(`/sessions/${sessionId}/reactivate`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Carregant dades del taller...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Capçalera */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-800 mb-2"
        >
          ← Tornar
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {edition?.workshop_title || "Detalls del Taller"}
        </h1>
        <p className="text-gray-500">
          {edition?.day_of_week === "TUESDAY" ? "Dimarts" : "Dijous"} -{" "}
          {edition?.start_time} a {edition?.end_time}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-800">
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Secció: Professors Assignats */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-lg">👨‍🏫 Professors Referents</h2>
            <p className="text-sm text-gray-500">
              Màxim 2 referents per taller
            </p>
          </div>

          <div className="p-6">
            {assignedTeachers.length === 0 ? (
              <p className="text-gray-500">No hi ha professors assignats</p>
            ) : (
              <ul className="space-y-3">
                {assignedTeachers.map((teacher) => (
                  <li
                    key={teacher.id}
                    className="flex justify-between items-center bg-green-50 p-3 rounded"
                  >
                    <div>
                      <span className="font-medium">{teacher.full_name}</span>
                      <span
                        className={`ml-2 text-xs px-2 py-1 rounded ${
                          teacher.is_main_referent
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {teacher.is_main_referent ? "Principal" : "Suport"}
                      </span>
                      <p className="text-sm text-gray-500">{teacher.email}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveAssignment(teacher.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      🗑️
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Secció: Candidats */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-lg">🙋 Candidats</h2>
            <p className="text-sm text-gray-500">
              Professors que van demanar ser referents
            </p>
          </div>

          <div className="p-6">
            {candidates.length === 0 ? (
              <p className="text-gray-500">
                No hi ha candidats per a aquest taller
              </p>
            ) : (
              <ul className="space-y-3">
                {candidates.map((candidate, idx) => {
                  const isAlreadyAssigned = assignedTeachers.some(
                    (t) => t.teacher_user_id === candidate.user_id
                  );
                  return (
                    <li
                      key={idx}
                      className={`flex justify-between items-center p-3 rounded ${
                        isAlreadyAssigned ? "bg-gray-100" : "bg-yellow-50"
                      }`}
                    >
                      <div>
                        <span className="font-medium">
                          {candidate.full_name}
                        </span>
                        <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                          Preferència #{candidate.preference_order}
                        </span>
                        <p className="text-sm text-gray-500">
                          {candidate.email} - {candidate.school_name}
                        </p>
                      </div>
                      {!isAlreadyAssigned && assignedTeachers.length < 2 && (
                        <button
                          onClick={() =>
                            handleAssignTeacher(
                              candidate.user_id,
                              assignedTeachers.length === 0
                            )
                          }
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          ✓ Assignar
                        </button>
                      )}
                      {isAlreadyAssigned && (
                        <span className="text-green-600 text-sm">
                          ✅ Assignat
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Secció: Calendari de Sessions */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-lg">📅 Calendari de Sessions</h2>
            <p className="text-sm text-gray-500">10 sessions programades</p>
          </div>
          {sessions.length === 0 && (
            <button
              onClick={handleGenerateSessions}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              🔄 Generar Sessions
            </button>
          )}
        </div>

        <div className="p-6">
          {sessions.length === 0 ? (
            <p className="text-gray-500">
              Les sessions es generen automàticament quan es publica el període.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded border text-center ${
                    session.is_cancelled
                      ? "bg-red-50 border-red-200"
                      : "bg-green-50 border-green-200"
                  }`}
                >
                  <div className="font-bold text-lg">
                    #{session.session_number}
                  </div>
                  <div className="text-sm">
                    {new Date(session.date).toLocaleDateString("ca-ES", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  {session.is_cancelled ? (
                    <button
                      onClick={() => handleReactivateSession(session.id)}
                      className="text-xs text-red-600 hover:text-red-800 mt-1"
                    >
                      ❌ Cancel·lada (Reactivar)
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCancelSession(session.id)}
                      className="text-xs text-gray-500 hover:text-red-600 mt-1"
                    >
                      Cancel·lar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkshopDetail;
