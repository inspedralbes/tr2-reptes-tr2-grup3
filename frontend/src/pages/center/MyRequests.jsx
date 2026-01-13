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
      // TODO: Filtrar por school_id del usuario cuando esté implementado
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
      loadRequests(); // Recargar lista
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

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Cargando solicitudes...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Cabecera */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Solicitudes</h1>
          <p className="text-gray-500">
            Historial de solicitudes de talleres enviadas
          </p>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Lista de solicitudes */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">No tienes solicitudes enviadas.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Período
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Resumen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha Envío
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm">#{req.id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    Período #{req.enrollment_period_id}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs">
                    {/* Profesores Acompañantes */}
                    {req.request_teachers &&
                      req.request_teachers.length > 0 && (
                        <div className="mb-2 bg-blue-50 p-2 rounded border border-blue-100">
                          <span className="font-bold text-blue-900 block mb-1">
                            Profesores Acompañantes:
                          </span>
                          <div className="text-blue-800">
                            {req.request_teachers
                              .map((t) => t.full_name)
                              .join(", ")}
                          </div>
                        </div>
                      )}

                    {req.items_summary?.map((item, idx) => (
                      <div
                        key={idx}
                        className="mb-2 border-b pb-1 last:border-0 last:pb-0"
                      >
                        <div className="font-bold text-gray-800">
                          {item.workshop_name} (
                          {item.day === "TUESDAY" ? "Martes" : "Jueves"}{" "}
                          {item.start_time?.slice(0, 5)})
                        </div>
                        <div className="ml-2">
                          <span className="font-semibold text-gray-700">
                            Alumnos:
                          </span>{" "}
                          {item.students?.join(", ") || "Sin alumnos"}
                        </div>
                      </div>
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {req.submitted_at
                      ? new Date(req.submitted_at).toLocaleDateString("es-ES")
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        req.status
                      )}`}
                    >
                      {getStatusLabel(req.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      {/* Solo mostrar cancelar si está en SUBMITTED */}
                      {req.status === "SUBMITTED" && (
                        <button
                          onClick={() => handleCancel(req.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          ❌ Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyRequests;
