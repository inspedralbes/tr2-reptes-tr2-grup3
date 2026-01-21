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
import { FileText, Clock, Trash2, User, Star } from "lucide-react";
import toast from "react-hot-toast";

const MyRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await requestService.getRequests();
      setRequests(data);
    } catch (err) {
      toast.error("Error en carregar les sol·licituds: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (
      !window.confirm(
        "¿Segur que vols cancel·lar aquesta sol·licitud? L'acció és irreversible."
      )
    ) {
      return;
    }
    try {
      await requestService.cancelRequest(id);
      toast.success("Sol·licitud cancel·lada");
      loadRequests();
    } catch (err) {
      toast.error("Error en cancel·lar: " + err.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      SUBMITTED: "bg-blue-100 text-blue-800 border-blue-200",
      PROCESSING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      APPROVED: "bg-green-100 text-green-800 border-green-200",
      CANCELLED: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status) => {
    const labels = {
      SUBMITTED: "Enviada",
      PROCESSING: "En procés",
      APPROVED: "Aprovada",
      CANCELLED: "Cancel·lada",
    };
    return labels[status] || status;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Cabecera */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="text-blue-600 w-8 h-8" /> Les Meves
            Sol·licituds
          </h1>
          <p className="text-gray-500 mt-2">
            Consulta i gestiona l'estat de les teves peticions de tallers.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400 animate-pulse">
          Carregant historial...
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="text-gray-300 w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            No tens sol·licituds actives
          </h3>
          <p className="text-gray-500 mt-1">
            Quan enviïs una petició, apareixerà aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Request Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(
                      req.status
                    )}`}
                  >
                    {getStatusLabel(req.status)}
                  </span>
                  <span className="text-gray-500 text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Enviada el{" "}
                    {new Date(req.submitted_at).toLocaleDateString("es-ES")}
                  </span>
                </div>
                {req.status === "SUBMITTED" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        navigate("/center/request", {
                          state: { editingRequest: req },
                        })
                      }
                      className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1 hover:bg-blue-50 px-3 py-1.5 rounded transition-colors"
                    >
                      <FileText className="w-4 h-4" /> Editar
                    </button>
                    <button
                      onClick={() => handleCancel(req.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-semibold flex items-center gap-1 hover:bg-red-50 px-3 py-1.5 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Cancel·lar Sol·licitud
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Workshops */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2">
                    Tallers Sol·licitats
                  </h3>
                  {!req.items_summary || req.items_summary.length === 0 ? (
                    <p className="text-gray-400 italic">
                      No hi ha cap taller seleccionat.
                    </p>
                  ) : (
                    req.items_summary
                      .slice()
                      .sort((a, b) => (a.priority || 99) - (b.priority || 99))
                      .map((item, idx) => {
                        return (
                          <div
                            key={idx}
                            className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow relative"
                          >
                            <div className="absolute top-4 right-4 bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200 shadow-sm z-10">
                              Prioritat: {item.priority ? item.priority : "N/A"}
                            </div>

                            <h4 className="font-bold text-lg text-blue-900 pr-24">
                              {item.workshop_name}
                            </h4>
                            <div className="text-sm text-gray-500 font-medium mb-3">
                              Horari:{" "}
                              {item.day === "TUESDAY" ? "Dimarts" : "Dijous"}{" "}
                              {item.start_time?.slice(0, 5)} -{" "}
                              {item.end_time?.slice(0, 5)}
                            </div>

                            {/* Students Grid */}
                            <div className="mt-3 bg-gray-50 rounded p-3 mb-3">
                              <div className="text-xs font-bold text-gray-400 uppercase mb-2">
                                Alumnes assignats ({item.students?.length || 0}
                                ):
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {item.students?.map((s, i) => (
                                  <span
                                    key={i}
                                    className="bg-white border text-gray-700 text-xs px-2 py-1 rounded shadow-sm flex items-center gap-2"
                                  >
                                    {s.name}
                                    {s.absentismo > 0 && (
                                      <span
                                        className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] text-white font-bold ${
                                          s.absentismo >= 4
                                            ? "bg-red-500"
                                            : s.absentismo >= 2
                                            ? "bg-yellow-500"
                                            : "bg-green-500"
                                        }`}
                                        title="Nivell d'absentisme"
                                      >
                                        {s.absentismo}
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Right Column: Teachers & Preferences */}
                <div className="space-y-6">
                  {/* Accompanying Teachers */}
                  <div>
                    <h3 className="text-md font-bold text-gray-800 flex items-center gap-2 mb-3 border-b pb-2">
                      <User className="text-blue-500 w-5 h-5" /> Professors
                      Acompanyants
                    </h3>
                    {!req.request_teachers ||
                    req.request_teachers.length === 0 ? (
                      <p className="text-gray-400 text-sm italic">
                        Cap professor assignat.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {req.request_teachers?.map((t, i) => (
                          <li
                            key={i}
                            className="bg-blue-50 text-blue-800 px-3 py-2 rounded text-sm font-medium border border-blue-100 flex items-center gap-2"
                          >
                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                            {t.full_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Teacher Preferences Summary */}
                  <div>
                    <h3 className="text-md font-bold text-gray-800 mb-3 border-b pb-2">
                      Preferències Detallades
                    </h3>
                    {!req.preferences_summary ||
                    req.preferences_summary.length === 0 ? (
                      <p className="text-gray-400 text-sm italic">
                        Sense preferències registrades.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(
                          req.preferences_summary.reduce((acc, curr) => {
                            if (!acc[curr.teacher_name])
                              acc[curr.teacher_name] = [];
                            acc[curr.teacher_name].push(curr);
                            return acc;
                          }, {})
                        ).map(([teacherName, prefs]) => (
                          <div
                            key={teacherName}
                            className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                          >
                            <div className="font-bold text-sm text-gray-700 mb-2 border-b border-gray-200 pb-1 flex items-center gap-2">
                              <User className="w-3 h-3 text-gray-400" />{" "}
                              {teacherName}
                            </div>
                            <ol className="list-decimal list-inside text-xs space-y-1.5 text-gray-600">
                              {prefs
                                .sort(
                                  (a, b) =>
                                    a.preference_order - b.preference_order
                                )
                                .map((p, idx) => (
                                  <li key={idx}>
                                    <span className="font-medium text-gray-800">
                                      {p.workshop_name}
                                    </span>
                                    {p.day && (
                                      <span className="text-gray-500 ml-1">
                                        (
                                        {p.day === "TUESDAY"
                                          ? "Dimarts"
                                          : "Dijous"}{" "}
                                        {p.start_time?.slice(0, 5)})
                                      </span>
                                    )}
                                  </li>
                                ))}
                            </ol>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRequests;
