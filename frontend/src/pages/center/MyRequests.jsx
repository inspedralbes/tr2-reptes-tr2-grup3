/**
 * MyRequests.jsx
 *
 * Página para que los centros vean sus solicitudes enviadas.
 * Permite ver el estado, editar (si está en SUBMITTED) o cancelar.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { requestService } from "../../services/request.service";
import { useAuth } from "../../context/AuthContext";
import { FileText } from "lucide-react";

const MyRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  /**
   * Carga las solicitudes del centro actual
   */
  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await requestService.getRequests();
      setRequests(data);
    } catch (err) {
      setError("Error al cargar solicitudes: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancela una solicitud tras confirmación
   */
  const handleCancel = async (id) => {
    if (
      !window.confirm(
        "¿Cancelar esta solicitud? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }
    try {
      await requestService.cancelRequest(id);
      loadRequests();
    } catch (err) {
      setError("Error al cancelar: " + err.message);
    }
  };

  /**
   * Devuelve el color del badge según el estado
   */
  const getStatusColor = (status) => {
    const colors = {
      SUBMITTED: "bg-blue-100 text-blue-800",
      PROCESSING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  /**
   * Traduce el estado a español
   */
  const getStatusLabel = (status) => {
    const labels = {
      SUBMITTED: "Enviada",
      PROCESSING: "En proceso",
      APPROVED: "Aprobada",
      CANCELLED: "Cancelada",
    };
    return labels[status] || status;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="text-blue-600" /> Mis Solicitudes
          </h1>
          <p className="text-gray-500 mt-1">
            Historial de solicitudes de talleres enviadas
          </p>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
          {error}
        </div>
      )}

      {/* Lista de solicitudes */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Cargando solicitudes...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No tienes solicitudes enviadas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase w-[45%]">
                    Resumen de Solicitud
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase w-[18%]">
                    Fecha Envío
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase w-[17%]">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase w-[20%]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-5">
                      {/* Profesores Acompañantes Globales */}
                      {req.request_teachers &&
                        req.request_teachers.length > 0 && (
                          <div className="mb-4 pb-3 border-b border-gray-200">
                            <span className="font-semibold text-gray-800 text-sm">
                              Profesores Acompañantes:
                            </span>{" "}
                            <span className="text-gray-600 text-sm">
                              {req.request_teachers
                                .map((t) => t.full_name)
                                .join(", ")}
                            </span>
                          </div>
                        )}

                      {/* Lista de Talleres */}
                      <div className="space-y-5">
                        {req.items_summary?.map((item, idx) => (
                          <div key={idx}>
                            {/* Separador entre talleres */}
                            {idx > 0 && (
                              <div className="mb-5 border-t-2 border-dashed border-gray-300"></div>
                            )}

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              {/* Header del taller */}
                              <div className="flex justify-between items-start mb-3">
                                <div className="font-semibold text-gray-900 text-base">
                                  {item.workshop_name}
                                </div>
                                <div className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-md font-semibold whitespace-nowrap ml-2 shadow-sm">
                                  {item.day === "TUESDAY" ? "Martes" : "Jueves"}{" "}
                                  {item.start_time?.slice(0, 5)} -{" "}
                                  {item.end_time?.slice(0, 5)}
                                </div>
                              </div>

                              {/* Alumnos */}
                              <div className="mb-3">
                                <div className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wide">
                                  Alumnos
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {item.students?.map((s, i) => (
                                    <span
                                      key={i}
                                      className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs bg-white border border-gray-300 text-gray-800 font-medium shadow-sm"
                                    >
                                      {s.name}
                                      <span
                                        title={`Nivel absentismo: ${
                                          s.absentismo || 0
                                        }`}
                                        className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          (s.absentismo || 0) >= 4
                                            ? "bg-red-500 text-white"
                                            : (s.absentismo || 0) >= 2
                                            ? "bg-yellow-500 text-white"
                                            : "bg-green-500 text-white"
                                        }`}
                                      >
                                        {s.absentismo || 0}
                                      </span>
                                    </span>
                                  )) || (
                                    <span className="text-gray-400 italic text-sm">
                                      Sin alumnos
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Profesores Preferentes */}
                              {item.teachers && item.teachers.length > 0 && (
                                <div className="text-xs text-gray-600 bg-purple-50 px-3 py-2 rounded border border-purple-100">
                                  <span className="font-semibold text-purple-700">
                                    Preferencias:
                                  </span>{" "}
                                  {item.teachers.join(", ")}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-5 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {req.submitted_at
                            ? new Date(req.submitted_at).toLocaleDateString(
                                "es-ES",
                                { day: "2-digit", month: "short" }
                              )
                            : "-"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {req.submitted_at
                            ? new Date(req.submitted_at).toLocaleDateString(
                                "es-ES",
                                { year: "numeric" }
                              )
                            : ""}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-center align-top">
                      <span
                        className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold shadow-sm ${getStatusColor(
                          req.status
                        )}`}
                      >
                        {getStatusLabel(req.status)}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-center align-top">
                      {req.status === "SUBMITTED" && (
                        <button
                          onClick={() => handleCancel(req.id)}
                          className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all border border-red-200 hover:border-red-600 shadow-sm"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRequests;
