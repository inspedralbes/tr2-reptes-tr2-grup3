/**
 * NominalConfirmation.jsx
 * 
 * US #16: Pujada de Documentació (Checklist)
 * Pàgina per a la confirmació nominal d'alumnes i pujada de documents
 */
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const NominalConfirmation = () => {
  const { allocationId } = useParams();
  
  const [allocation, setAllocation] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingFor, setUploadingFor] = useState(null);

  useEffect(() => {
    loadAllocationData();
  }, [allocationId]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };

  /**
   * Carrega les dades de l'assignació i els alumnes
   */
  const loadAllocationData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Obtenir assignació
      const allocRes = await fetch(`${API_URL}/allocation/${allocationId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!allocRes.ok) throw new Error("Error carregant assignació");
      const allocData = await allocRes.json();
      setAllocation(allocData);

      // Obtenir alumnes de l'assignació
      const studentsRes = await fetch(`${API_URL}/students?allocation_id=${allocationId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        // Per cada alumne, obtenir els seus documents
        const studentsWithDocs = await Promise.all(
          studentsData.map(async (student) => {
            const docsRes = await fetch(`${API_URL}/students/${student.id}/documents`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            const docs = docsRes.ok ? await docsRes.json() : [];
            return { ...student, documents: docs };
          })
        );
        setStudents(studentsWithDocs);
      }

      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Afegeix un nou alumne a l'assignació
   */
  const handleAddStudent = async () => {
    const name = prompt("Nom complet de l'alumne:");
    if (!name) return;

    const idalu = prompt("IDALU (opcional):");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/students`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          full_name: name,
          idalu: idalu || null,
          school_id: allocation.school_id
        })
      });

      if (!res.ok) throw new Error("Error creant alumne");
      
      loadAllocationData();
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Puja un document PDF per a un alumne
   */
  const handleUploadDocument = async (studentId, file, docType) => {
    if (!file) return;

    setUploadingFor(studentId);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("document", file);
      formData.append("document_type", docType);

      const res = await fetch(`${API_URL}/students/${studentId}/documents`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error pujant document");
      }

      loadAllocationData();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingFor(null);
    }
  };

  /**
   * Comprova si un alumne té un tipus de document pujat
   */
  const hasDocument = (student, docType) => {
    return student.documents?.some(d => d.document_type === docType);
  };

  /**
   * Comprova si un alumne té tots els documents requerits
   */
  const hasAllDocuments = (student) => {
    return hasDocument(student, "AUTORITZACIO_IMATGE") && 
           hasDocument(student, "AUTORITZACIO_SORTIDA");
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Carregant dades...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Capçalera */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Confirmació Nominal</h1>
        <p className="text-gray-500">
          Afegeix els alumnes i puja les autoritzacions signades
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Info de l'assignació */}
      {allocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="font-medium">Taller: {allocation.workshop_title || `Edició ${allocation.workshop_edition_id}`}</p>
          <p className="text-sm text-gray-600">Places assignades: {allocation.assigned_seats}</p>
        </div>
      )}

      {/* Llista d'alumnes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Alumnes ({students.length})</h2>
          <button
            onClick={handleAddStudent}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            ➕ Afegir alumne
          </button>
        </div>

        {students.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hi ha alumnes registrats. Afegeix alumnes per continuar.
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alumne</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IDALU</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aut. Imatge</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aut. Sortida</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium">{student.full_name}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {student.idalu || "-"}
                  </td>
                  
                  {/* Autorització Imatge */}
                  <td className="px-6 py-4 text-center">
                    {hasDocument(student, "AUTORITZACIO_IMATGE") ? (
                      <span className="text-green-600 text-xl">✅</span>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => handleUploadDocument(student.id, e.target.files[0], "AUTORITZACIO_IMATGE")}
                          disabled={uploadingFor === student.id}
                        />
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm hover:bg-gray-200">
                          {uploadingFor === student.id ? "Pujant..." : "📤 Pujar PDF"}
                        </span>
                      </label>
                    )}
                  </td>

                  {/* Autorització Sortida */}
                  <td className="px-6 py-4 text-center">
                    {hasDocument(student, "AUTORITZACIO_SORTIDA") ? (
                      <span className="text-green-600 text-xl">✅</span>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => handleUploadDocument(student.id, e.target.files[0], "AUTORITZACIO_SORTIDA")}
                          disabled={uploadingFor === student.id}
                        />
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm hover:bg-gray-200">
                          {uploadingFor === student.id ? "Pujant..." : "📤 Pujar PDF"}
                        </span>
                      </label>
                    )}
                  </td>

                  {/* Estat complet */}
                  <td className="px-6 py-4 text-center">
                    {hasAllDocuments(student) ? (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        ✅ Complet
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                        ⏳ Pendent
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Resum */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium mb-2">Checklist Final</h3>
        <ul className="space-y-1 text-sm">
          <li className={students.length > 0 ? "text-green-600" : "text-gray-500"}>
            {students.length > 0 ? "✅" : "⬜"} Alumnes registrats ({students.length})
          </li>
          <li className={students.filter(s => hasDocument(s, "AUTORITZACIO_IMATGE")).length === students.length && students.length > 0 ? "text-green-600" : "text-gray-500"}>
            {students.filter(s => hasDocument(s, "AUTORITZACIO_IMATGE")).length === students.length && students.length > 0 ? "✅" : "⬜"} 
            {" "}Autoritzacions d'imatge ({students.filter(s => hasDocument(s, "AUTORITZACIO_IMATGE")).length}/{students.length})
          </li>
          <li className={students.filter(s => hasDocument(s, "AUTORITZACIO_SORTIDA")).length === students.length && students.length > 0 ? "text-green-600" : "text-gray-500"}>
            {students.filter(s => hasDocument(s, "AUTORITZACIO_SORTIDA")).length === students.length && students.length > 0 ? "✅" : "⬜"} 
            {" "}Autoritzacions de sortida ({students.filter(s => hasDocument(s, "AUTORITZACIO_SORTIDA")).length}/{students.length})
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NominalConfirmation;
