/**
 * NominalConfirmation.jsx
 *
 * US #16: Pujada de Documentació (Checklist)
 * Pàgina per a la confirmació nominal d'alumnes i pujada de documents
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../../api/client";

const NominalConfirmation = () => {
  const { allocationId } = useParams();
  const navigate = useNavigate();

  const [allocation, setAllocation] = useState(null);
  const [students, setStudents] = useState([]); // Alumnos ASIGNADOS
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingFor, setUploadingFor] = useState(null);



  useEffect(() => {
    loadAllocationData();
  }, [allocationId]);

  const loadAllocationData = async () => {
    try {
      setLoading(true);

      const allocRes = await client.get(`/allocation/${allocationId}`);
      const allocData = allocRes.data;
      setAllocation(allocData);

      const studentsRes = await client.get(
        `/students?allocation_id=${allocationId}`
      );

      if (studentsRes.data) {
        const studentsData = studentsRes.data;
        const studentsWithDocs = await Promise.all(
          studentsData.map(async (student) => {
            try {
              const docsRes = await client.get(
                `/students/${student.id}/documents`
              );
              return { ...student, documents: docsRes.data };
            } catch (e) {
              return { ...student, documents: [] };
            }
          })
        );
        setStudents(studentsWithDocs);
      }

      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (studentId, file, docType) => {
    if (!file) return;

    setUploadingFor(studentId);

    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("document_type", docType);

      await client.post(`/students/${studentId}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      loadAllocationData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setUploadingFor(null);
    }
  };

  const hasDocument = (student, docType) => {
    return student.documents?.some((d) => d.document_type === docType);
  };

  const hasAllDocuments = (student) => {
    return (
      hasDocument(student, "AUTORITZACIO_IMATGE") &&
      hasDocument(student, "AUTORITZACIO_SORTIDA")
    );
  };



  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Carregant dades...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Capçalera */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Detall de l'Assignació
        </h1>
        <p className="text-gray-500 mt-2">
          Aquests són els alumnes que han estat assignats a aquest taller.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Info de l'assignació */}
      {allocation && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-blue-900 mb-1">
              {allocation.workshop_title ||
                `Edició ${allocation.workshop_edition_id}`}
            </h2>
            <p className="text-blue-700">
              Places assignades:{" "}
              <span className="font-bold">{allocation.assigned_seats}</span>
            </p>
          </div>
          <div className="text-right">
            <span
              className={`px-3 py-1 rounded text-sm font-semibold 
               ${allocation.status === "ACCEPTED"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
                }`}
            >
              {allocation.status === "ACCEPTED"
                ? "Confirmada"
                : "Pendent de Confirmació"}
            </span>
          </div>
        </div>
      )}

      {/* Llista d'alumnes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-700">
            Llistat d'Alumnes Assignats
          </h3>
          <span className="text-sm text-gray-500 italic">
            Seleccionats per nivell d'absentisme
          </span>
        </div>

        {students.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg mb-2">
              No hi ha alumnes assignats a aquesta plaça.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                <tr>
                  <th className="px-6 py-3 text-left">Alumne</th>
                  <th className="px-6 py-3 text-center">Nivell Absentisme</th>
                  <th className="px-6 py-3 text-center">Documentació</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div>{student.full_name || student.nombre_completo}</div>
                      <div className="text-xs text-gray-500">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${student.nivel_absentismo >= 3 ? 'bg-red-100 text-red-700' :
                        student.nivel_absentismo === 2 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                        {student.nivel_absentismo || 1} / 5
                      </span>
                    </td>

                    {/* Estat complet */}
                    <td className="px-6 py-4 text-center">
                      {hasAllDocuments(student) ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium border border-green-200">
                          Complet
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium border border-gray-200">
                          Pendent
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-start">
        <button
          onClick={() => navigate("/center/allocations")}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          ← Tornar al llistat
        </button>
      </div>
    </div>
  );
};

export default NominalConfirmation;
