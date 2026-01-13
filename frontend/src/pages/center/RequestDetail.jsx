import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { requestService } from "../../services/request.service";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const data = await requestService.getRequestById(id);
      setRequest(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("¿Estás seguro de cancelar esta solicitud?")) return;
    try {
      await requestService.cancelRequest(id);
      navigate("/center/requests");
    } catch (err) {
      alert("Error al cancelar: " + err.message);
    }
  };

  if (loading) return <div className="p-6">Cargando detalles...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!request) return <div className="p-6">No se encontró la solicitud.</div>;

  // Parse teachers if strictly json string (though backend returns object usually if pg handles it, but let's be safe)
  // Actually pg returns JSON type as object usually.
  const teachers = request.request_teachers || [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Detalle de Solicitud #{request.id}
        </h1>
        <Button
          variant="secondary"
          onClick={() => navigate("/center/requests")}
        >
          ← Volver
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Estado</p>
            <span
              className={`font-bold ${
                request.status === "SUBMITTED"
                  ? "text-blue-600"
                  : "text-gray-800"
              }`}
            >
              {request.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fecha Envío</p>
            <p className="font-medium">
              {new Date(request.submitted_at).toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Profesores Acompañantes */}
      <Card title="Profesores Acompañantes del Centro">
        {teachers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teachers.map((t, idx) => (
              <div
                key={idx}
                className="p-3 bg-blue-50 rounded border border-blue-100"
              >
                <span className="font-bold text-blue-900">
                  Profesor #{idx + 1}:
                </span>{" "}
                {t.full_name}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            No se han especificado profesores acompañantes.
          </p>
        )}
      </Card>

      {/* Preferencias (Prioridades) */}
      <Card title="Prioridades de Talleres (Preferencias)">
        <div className="space-y-2">
          {request.teacher_preferences?.map((pref) => (
            <div
              key={pref.id}
              className="flex gap-4 items-center p-3 bg-gray-50 rounded border"
            >
              <span className="font-bold bg-gray-200 text-gray-700 w-8 h-8 flex items-center justify-center rounded-full">
                {pref.preference_order}
              </span>
              <div>
                <p className="font-bold text-gray-800">{pref.workshop_title}</p>
                <p className="text-sm text-gray-600">
                  {pref.day_of_week === "TUESDAY" ? "Martes" : "Jueves"} (
                  {pref.start_time?.slice(0, 5)} - {pref.end_time?.slice(0, 5)})
                </p>
              </div>
            </div>
          ))}
          {(!request.teacher_preferences ||
            request.teacher_preferences.length === 0) && (
            <p className="text-gray-500 italic">
              Sin preferencias registradas.
            </p>
          )}
        </div>
      </Card>

      {/* Talleres Solicitados */}
      <Card title="Talleres Solicitados y Alumnos">
        <div className="space-y-4">
          {request.items?.map((item, idx) => (
            <div key={idx} className="border rounded p-4 shadow-sm bg-white">
              <div className="flex justify-between mb-2">
                <h3 className="font-bold text-lg text-blue-900">
                  {item.workshop_title}
                </h3>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {item.day_of_week === "TUESDAY" ? "Martes" : "Jueves"}{" "}
                  {item.start_time?.slice(0, 5)}
                </span>
              </div>

              <div className="mt-2">
                <h4 className="font-semibold text-sm text-gray-700 mb-1">
                  Alumnos ({item.students?.length || 0}):
                </h4>
                {item.students && item.students.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                    {item.students.map((s) => (
                      <li key={s.id}>{s.full_name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    Sin alumnos asignados.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {request.status === "SUBMITTED" && (
        <div className="flex justify-end">
          <Button variant="danger" onClick={handleCancel}>
            Cancelar Solicitud
          </Button>
        </div>
      )}
    </div>
  );
};

export default RequestDetail;
