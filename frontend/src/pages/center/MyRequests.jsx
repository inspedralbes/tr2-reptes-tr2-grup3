/**
 * MyRequests.jsx
 *
 * Página para que los centros vean SU ÚNICA solicitud por período.
 * Cada centro solo puede enviar UNA solicitud por convocatoria.
 * Si ya existe, solo puede editarla, no crear otra.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { requestService } from "../../services/request.service";
import { useAuth } from "../../context/AuthContext";
import { FileText, Clock, Trash2, User, Star, Edit, AlertCircle, CheckCircle, Send } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import client from "../../api/client";

const MyRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState(null);
  const [currentPhase, setCurrentPhase] = useState(null);

  // Modal de confirmación
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar período activo para saber la fase
      const periodsRes = await client.get("/enrollment/periods?status=ACTIVE");
      if (periodsRes.data.length > 0) {
        setActivePeriod(periodsRes.data[0]);
        setCurrentPhase(periodsRes.data[0].current_phase);
      }
      
      const data = await requestService.getRequests();
      setRequests(data);
    } catch (err) {
      toast.error("Error en carregar les sol·licituds: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Cancel·lar sol·licitud",
      message: "Segur que vols cancel·lar aquesta sol·licitud? L'acció és irreversible.",
      onConfirm: async () => {
        try {
          await requestService.cancelRequest(id);
          toast.success("Sol·licitud cancel·lada");
          loadData();
        } catch (err) {
          toast.error("Error en cancel·lar: " + err.message);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
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

  // Verificar si el centro puede editar (solo en fase SOLICITUDES)
  const canEdit = currentPhase === 'SOLICITUDES';
  
  // Obtener la solicitud activa del período actual (solo puede haber 1)
  const currentPeriodRequest = activePeriod 
    ? requests.find(r => r.enrollment_period_id === activePeriod.id && r.status !== 'CANCELLED')
    : null;

  // Solicitudes de años anteriores
  const historicalRequests = requests.filter(r => 
    !activePeriod || r.enrollment_period_id !== activePeriod.id
  );

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="text-blue-600 w-8 h-8" /> La Meva Sol·licitud
        </h1>
        <p className="text-gray-500 mt-2">
          Cada centre pot enviar una única sol·licitud per convocatòria.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400 animate-pulse">
          Carregant...
        </div>
      ) : (
        <>
          {/* Sección del período actual */}
          {activePeriod && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Send className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h2 className="font-bold text-blue-900">{activePeriod.name}</h2>
                      <p className="text-sm text-blue-600">Convocatòria actual</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    canEdit ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {canEdit ? 'Període de sol·licituds obert' : `Fase: ${currentPhase}`}
                  </span>
                </div>
              </div>

              <div className="p-6">
                {currentPeriodRequest ? (
                  // Ya tiene solicitud - mostrar resumen y opción de editar
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-full">
                          <CheckCircle className="text-green-600" size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">Sol·licitud enviada</h3>
                          <p className="text-sm text-gray-500">
                            Enviada el {new Date(currentPeriodRequest.submitted_at).toLocaleDateString("ca-ES", {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(currentPeriodRequest.status)}`}>
                        {getStatusLabel(currentPeriodRequest.status)}
                      </span>
                    </div>

                    {/* Resumen de la solicitud */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tallers sol·licitats:</span>
                        <span className="font-bold text-gray-900">{currentPeriodRequest.items_summary?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Alumnes totals:</span>
                        <span className="font-bold text-gray-900">
                          {currentPeriodRequest.items_summary?.reduce((acc, item) => acc + (item.students?.length || 0), 0) || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Professors acompanyants:</span>
                        <span className="font-bold text-gray-900">{currentPeriodRequest.request_teachers?.length || 0}</span>
                      </div>
                    </div>

                    {/* Talleres solicitados */}
                    {currentPeriodRequest.items_summary && currentPeriodRequest.items_summary.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-700">Tallers sol·licitats:</h4>
                        <div className="grid gap-2">
                          {currentPeriodRequest.items_summary
                            .sort((a, b) => (a.priority || 99) - (b.priority || 99))
                            .map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center gap-3">
                                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                                    {item.priority || idx + 1}
                                  </span>
                                  <div>
                                    <p className="font-medium text-gray-900">{item.workshop_name}</p>
                                    <p className="text-xs text-gray-500">
                                      {item.day === "TUESDAY" ? "Dimarts" : "Dijous"} · {item.students?.length || 0} alumnes
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      {canEdit && currentPeriodRequest.status === "SUBMITTED" && (
                        <>
                          <button
                            onClick={() => navigate("/center/request", { state: { editingRequest: currentPeriodRequest } })}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                          >
                            <Edit size={18} /> Modificar sol·licitud
                          </button>
                          <button
                            onClick={() => handleCancel(currentPeriodRequest.id)}
                            className="flex items-center justify-center gap-2 px-4 py-3 border border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                      {!canEdit && (
                        <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl">
                          <AlertCircle size={18} />
                          <span className="text-sm">El període de sol·licituds ha finalitzat. No es pot modificar.</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // No tiene solicitud - mostrar CTA para crear
                  <div className="text-center py-8">
                    {canEdit ? (
                      <>
                        <div className="p-4 bg-blue-50 rounded-full w-fit mx-auto mb-4">
                          <Send className="text-blue-400" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Encara no has enviat cap sol·licitud
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                          Tens fins al final del període de sol·licituds per enviar la teva petició de tallers.
                        </p>
                        <button
                          onClick={() => navigate("/center/request")}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                        >
                          <Send size={18} /> Crear sol·licitud
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                          <AlertCircle className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          No vas enviar cap sol·licitud
                        </h3>
                        <p className="text-gray-500">
                          El període de sol·licituds per a aquesta convocatòria ja ha finalitzat.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Historial de años anteriores */}
          {historicalRequests.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                <Clock size={20} /> Historial de convocatòries anteriors
              </h2>
              
              <div className="space-y-4">
                {historicalRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden opacity-75 hover:opacity-100 transition-opacity"
                  >
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(req.status)}`}>
                          {getStatusLabel(req.status)}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {new Date(req.submitted_at).toLocaleDateString("ca-ES")}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {req.items_summary?.length || 0} tallers · {req.items_summary?.reduce((acc, item) => acc + (item.students?.length || 0), 0) || 0} alumnes
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {req.items_summary?.slice(0, 3).map((item, idx) => (
                          <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {item.workshop_name}
                          </span>
                        ))}
                        {req.items_summary?.length > 3 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm">
                            +{req.items_summary.length - 3} més
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sin período activo ni historial */}
          {!activePeriod && historicalRequests.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-gray-300 w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No hi ha convocatòries disponibles
              </h3>
              <p className="text-gray-500 mt-1">
                Quan s'obri una nova convocatòria, podràs enviar la teva sol·licitud aquí.
              </p>
            </div>
          )}
        </>
      )}

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant="danger"
        confirmText="Cancel·lar sol·licitud"
        cancelText="Tornar"
      />
    </div>
  );
};

export default MyRequests;
