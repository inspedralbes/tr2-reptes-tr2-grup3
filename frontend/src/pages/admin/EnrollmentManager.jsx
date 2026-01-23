/**
 * EnrollmentManager.jsx
 * 
 * Panel de Control de Períodos de Inscripción - Vista Mejorada
 * Sistema de fases: SOLICITUDES → ASIGNACION → PUBLICACION → EJECUCION
 */
import { useState, useEffect } from "react";
import {
  Plus, Edit, Trash2, Calendar, Power, ChevronRight,
  Send, Cog, Eye, Rocket, Clock, Users, School, FileCheck,
  AlertTriangle, CheckCircle, Info, BarChart3, ArrowRight, ArrowLeft,
  PauseCircle, Activity
} from "lucide-react";
import Modal from "../../components/common/Modal.jsx";
import Button from "../../components/ui/Button.jsx";
import enrollmentService, {
  PHASES, PHASE_ORDER, PHASE_LABELS, PHASE_COLORS,
  STATUS_LABELS, STATUS_COLORS
} from "../../services/enrollment.service";

/**
 * Iconos y configuración extendida para cada fase
 */
const PHASE_CONFIG = {
  [PHASES.SOLICITUDES]: {
    icon: Send,
    color: 'blue',
    bgColor: 'bg-blue-500',
    lightBg: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    description: 'Els centres poden enviar sol·licituds de tallers',
    actions: ['Crear sol·licituds', 'Modificar preferències', 'Afegir alumnes']
  },
  [PHASES.ASIGNACION]: {
    icon: Cog,
    color: 'amber',
    bgColor: 'bg-amber-500',
    lightBg: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    description: "L'administrador executa l'algoritme i revisa assignacions",
    actions: ['Executar algoritme', 'Revisar resultats', 'Ajustar manualment', 'Aprovar assignacions']
  },
  [PHASES.PUBLICACION]: {
    icon: Eye,
    color: 'green',
    bgColor: 'bg-green-500',
    lightBg: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    description: 'Els centres poden veure les seves assignacions',
    actions: ['Veure assignacions', 'Inscriure alumnes', 'Assignar professors']
  },
  [PHASES.EJECUCION]: {
    icon: Rocket,
    color: 'purple',
    bgColor: 'bg-purple-500',
    lightBg: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    description: 'Els tallers estan en marxa',
    actions: ['Passar llista', 'Registrar avaluacions', 'Gestionar incidències']
  }
};

const EnrollmentManager = () => {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [stats, setStats] = useState({});
  const [expandedPeriod, setExpandedPeriod] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    phases: {
      solicitudes: { start: "", end: "" },
      publicacion: { start: "", end: "" },
      ejecucion: { start: "", end: "" }
    }
  });

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadPeriods = async () => {
    try {
      setLoading(true);
      const data = await enrollmentService.getAll();
      setPeriods(data);
      const activePeriod = data.find(p => p.status === 'ACTIVE');
      if (activePeriod) {
        setExpandedPeriod(activePeriod.id);
        loadPeriodStats(activePeriod.id);
      }
      setError(null);
    } catch (err) {
      setError("Error carregant períodes: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPeriodStats = async (periodId) => {
    try {
      setStats(prev => ({
        ...prev,
        [periodId]: {
          totalRequests: 45,
          totalCenters: 12,
          totalStudents: 187,
          allocationsCreated: 38,
          pendingReview: 7
        }
      }));
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleCreate = () => {
    setEditingPeriod(null);
    setFormData({
      name: "",
      phases: {
        solicitudes: { start: "", end: "" },
        publicacion: { start: "", end: "" },
        ejecucion: { start: "", end: "" }
      }
    });
    setShowModal(true);
  };

  const handleEdit = (period) => {
    setEditingPeriod(period);
    setFormData({
      name: period.name,
      phases: {
        solicitudes: {
          start: period.phase_solicitudes_start?.split("T")[0] || "",
          end: period.phase_solicitudes_end?.split("T")[0] || ""
        },
        publicacion: {
          start: period.phase_publicacion_start?.split("T")[0] || "",
          end: period.phase_publicacion_end?.split("T")[0] || ""
        },
        ejecucion: {
          start: period.phase_ejecucion_start?.split("T")[0] || "",
          end: period.phase_ejecucion_end?.split("T")[0] || ""
        }
      }
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingPeriod) {
        await enrollmentService.update(editingPeriod.id, formData);
        setSuccess("Període actualitzat correctament");
      } else {
        await enrollmentService.create(formData);
        setSuccess("Període creat correctament");
      }
      setShowModal(false);
      loadPeriods();
    } catch (err) {
      setError("Error desant: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Eliminar aquest període? Aquesta acció no es pot desfer.")) {
      return;
    }
    try {
      await enrollmentService.delete(id);
      setSuccess("Període eliminat");
      loadPeriods();
    } catch (err) {
      setError("Error eliminant: " + err.message);
    }
  };

  const handleActivate = async (id) => {
    if (!window.confirm("Activar aquest període? Es desactivaran els altres períodes actius.")) {
      return;
    }
    try {
      await enrollmentService.activate(id);
      setSuccess("Període activat correctament");
      loadPeriods();
    } catch (err) {
      setError("Error activant: " + err.message);
    }
  };

  const handleAdvancePhase = async (id, currentPhase) => {
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    const nextPhase = PHASE_ORDER[currentIndex + 1];

    if (!nextPhase) {
      setError("Ja sou a la fase final");
      return;
    }

    const confirmMessages = {
      [PHASES.ASIGNACION]: "Això tancarà el període de sol·licituds. Els centres ja no podran modificar-les.",
      [PHASES.PUBLICACION]: "Això publicarà les assignacions als centres. Assegureu-vos d'haver revisat tot.",
      [PHASES.EJECUCION]: "Això iniciarà l'execució dels tallers."
    };

    if (!window.confirm(confirmMessages[nextPhase] + "\n\nAvançar a \"" + PHASE_LABELS[nextPhase] + "\"?")) {
      return;
    }

    try {
      await enrollmentService.advancePhase(id);
      setSuccess("Fase avançada a: " + PHASE_LABELS[nextPhase]);
      loadPeriods();
    } catch (err) {
      setError("Error avançant fase: " + err.message);
    }
  };

  const handleRegressPhase = async (id, currentPhase) => {
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    const prevPhase = PHASE_ORDER[currentIndex - 1];

    if (!prevPhase) {
      setError("Ja sou a la primera fase");
      return;
    }

    if (!window.confirm("⚠️ ATENCIÓ: Retrocedir a la fase \"" + PHASE_LABELS[prevPhase] + "\"?\n\nAixò és per a testing. En producció pot causar inconsistències.")) {
      return;
    }

    try {
      await enrollmentService.advancePhase(id, prevPhase);
      setSuccess("Fase retrocedida a: " + PHASE_LABELS[prevPhase]);
      loadPeriods();
    } catch (err) {
      setError("Error retrocedint fase: " + err.message);
    }
  };

  const handleSetPhase = async (id, targetPhase) => {
    if (!window.confirm("Canviar a la fase \"" + PHASE_LABELS[targetPhase] + "\"?")) {
      return;
    }

    try {
      await enrollmentService.advancePhase(id, targetPhase);
      setSuccess("Fase canviada a: " + PHASE_LABELS[targetPhase]);
      loadPeriods();
    } catch (err) {
      setError("Error canviant fase: " + err.message);
    }
  };

  const renderEnhancedTimeline = (period) => {
    const currentPhaseIndex = PHASE_ORDER.indexOf(period.current_phase);
    const config = PHASE_CONFIG[period.current_phase];

    return (
      <div className="mt-6">
        <div className="relative">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={config.bgColor + " h-full transition-all duration-500"}
              style={{ width: ((currentPhaseIndex + 1) / PHASE_ORDER.length) * 100 + "%" }}
            />
          </div>

          <div className="flex justify-between mt-2">
            {PHASE_ORDER.map((phase, index) => {
              const phaseConfig = PHASE_CONFIG[phase];
              const Icon = phaseConfig.icon;
              const isActive = phase === period.current_phase;
              const isPast = index < currentPhaseIndex;
              const isFuture = index > currentPhaseIndex;

              return (
                <button
                  key={phase}
                  onClick={() => handleSetPhase(period.id, phase)}
                  className={"flex flex-col items-center group relative " + (isFuture ? "cursor-pointer" : "cursor-default")}
                  title={"Canviar a: " + PHASE_LABELS[phase]}
                >
                  <div className={
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all " +
                    (isActive ? phaseConfig.bgColor + " text-white ring-4 ring-opacity-30 ring-current scale-110" : "") +
                    (isPast ? "bg-green-500 text-white" : "") +
                    (isFuture ? "bg-gray-200 text-gray-400 hover:bg-gray-300" : "")
                  }>
                    {isPast ? <CheckCircle size={20} /> : <Icon size={20} />}
                  </div>
                  <span className={
                    "mt-2 text-xs font-medium " +
                    (isActive ? phaseConfig.textColor : "") +
                    (isPast ? "text-green-600" : "") +
                    (isFuture ? "text-gray-400" : "")
                  }>
                    {PHASE_LABELS[phase]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentPhaseInfo = (period) => {
    const config = PHASE_CONFIG[period.current_phase];
    const Icon = config.icon;

    return (
      <div className={config.lightBg + " rounded-xl p-5 border " + config.borderColor + " mt-6"}>
        <div className="flex items-start gap-4">
          <div className={config.bgColor + " p-3 rounded-xl text-white"}>
            <Icon size={24} />
          </div>
          <div className="flex-1">
            <h4 className={"font-semibold text-lg " + config.textColor}>
              Fase Actual: {PHASE_LABELS[period.current_phase]}
            </h4>
            <p className="text-gray-600 text-sm mt-1">{config.description}</p>

            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Accions disponibles en aquesta fase:</p>
              <div className="flex flex-wrap gap-2">
                {config.actions.map((action, idx) => (
                  <span
                    key={idx}
                    className={"px-3 py-1.5 rounded-full text-xs font-medium " + config.lightBg + " " + config.textColor + " border " + config.borderColor}
                  >
                    {action}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPeriodStats = (period) => {
    const periodStats = stats[period.id] || {};

    const statCards = [
      { label: 'Centres', value: periodStats.totalCenters || 0, icon: School, bgColor: 'bg-blue-50', borderColor: 'border-blue-100', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', valueColor: 'text-blue-700', labelColor: 'text-blue-600' },
      { label: 'Sol·licituds', value: periodStats.totalRequests || 0, icon: FileCheck, bgColor: 'bg-indigo-50', borderColor: 'border-indigo-100', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', valueColor: 'text-indigo-700', labelColor: 'text-indigo-600' },
      { label: 'Alumnes', value: periodStats.totalStudents || 0, icon: Users, bgColor: 'bg-green-50', borderColor: 'border-green-100', iconBg: 'bg-green-100', iconColor: 'text-green-600', valueColor: 'text-green-700', labelColor: 'text-green-600' },
      { label: 'Assignacions', value: periodStats.allocationsCreated || 0, icon: BarChart3, bgColor: 'bg-purple-50', borderColor: 'border-purple-100', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', valueColor: 'text-purple-700', labelColor: 'text-purple-600' }
    ];

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        {statCards.map(({ label, value, icon: Icon, bgColor, borderColor, iconBg, iconColor, valueColor, labelColor }) => (
          <div key={label} className={bgColor + " rounded-xl p-4 border " + borderColor}>
            <div className="flex items-center gap-3">
              <div className={"p-2 rounded-lg " + iconBg}>
                <Icon size={18} className={iconColor} />
              </div>
              <div>
                <div className={"text-2xl font-bold " + valueColor}>{value}</div>
                <div className={"text-xs font-medium " + labelColor}>{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPhaseForm = () => {
    const phaseFields = [
      { key: 'solicitudes', label: 'Sol·licituds', icon: Send, description: 'Centres envien peticions de tallers' },
      { key: 'publicacion', label: 'Publicació', icon: Eye, description: 'Es publiquen les assignacions' },
      { key: 'ejecucion', label: 'Execució', icon: Rocket, description: 'Tallers en marxa' }
    ];

    return (
      <div className="space-y-4">
        {phaseFields.map(({ key, label, icon: Icon, description }) => (
          <div key={key} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={18} className="text-blue-600" />
              <span className="font-medium text-gray-900">{label}</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">{description}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Inici</label>
                <input
                  type="date"
                  value={formData.phases[key]?.start || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    phases: {
                      ...formData.phases,
                      [key]: { ...formData.phases[key], start: e.target.value }
                    }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fi</label>
                <input
                  type="date"
                  value={formData.phases[key]?.end || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    phases: {
                      ...formData.phases,
                      [key]: { ...formData.phases[key], end: e.target.value }
                    }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Calendar className="text-blue-600" size={28} />
            </div>
            Gestió de Períodes
          </h1>
          <p className="text-gray-500 mt-2 max-w-xl">
            Configura i controla els períodes d'inscripció. Cada període passa per 4 fases:
            Sol·licituds → Assignació → Publicació → Execució
          </p>
        </div>
        <Button onClick={handleCreate} className="shadow-lg">
          <div className="flex items-center gap-2">
            <Plus size={18} /> Nou Període
          </div>
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
          <AlertTriangle size={20} />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 p-1">×</button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : periods.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-16 text-center">
          <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
            <Calendar className="text-gray-400" size={48} />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No hi ha períodes</h3>
          <p className="text-gray-500 mb-6">Crea un nou període per començar a gestionar inscripcions</p>
          <Button onClick={handleCreate}>
            <Plus size={18} className="mr-2" /> Crear Primer Període
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {periods.map((period) => {
            const isExpanded = expandedPeriod === period.id;
            const config = PHASE_CONFIG[period.current_phase];

            return (
              <div
                key={period.id}
                className={
                  "bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all " +
                  (period.status === 'ACTIVE' ? "border-green-400 shadow-green-100" : "border-gray-200")
                }
              >
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setExpandedPeriod(isExpanded ? null : period.id);
                    if (!isExpanded) loadPeriodStats(period.id);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className={
                        "p-3 rounded-xl " +
                        (period.status === 'ACTIVE' ? "bg-green-100" : "bg-gray-100")
                      }>
                        {period.status === 'ACTIVE' ? (
                          <Activity className="text-green-600" size={24} />
                        ) : (
                          <PauseCircle className="text-gray-400" size={24} />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{period.name}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={"px-3 py-1 rounded-full text-xs font-semibold " + STATUS_COLORS[period.status]}>
                            {STATUS_LABELS[period.status]}
                          </span>
                          <span className={"px-3 py-1 rounded-full text-xs font-semibold " + config.lightBg + " " + config.textColor + " border " + config.borderColor}>
                            {PHASE_LABELS[period.current_phase]}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {period.status === 'DRAFT' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleActivate(period.id); }}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-sm font-medium"
                        >
                          <Power size={16} /> Activar
                        </button>
                      )}
                      {period.status === 'ACTIVE' && period.current_phase !== PHASES.SOLICITUDES && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRegressPhase(period.id, period.current_phase); }}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors text-sm font-medium"
                          title="Retrocedir fase (testing)"
                        >
                          <ArrowLeft size={16} /> Retrocedir
                        </button>
                      )}
                      {period.status === 'ACTIVE' && period.current_phase !== PHASES.EJECUCION && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAdvancePhase(period.id, period.current_phase); }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium"
                        >
                          Avançar Fase <ArrowRight size={16} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(period); }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(period.id); }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                      <ChevronRight
                        size={24}
                        className={"text-gray-400 transition-transform " + (isExpanded ? "rotate-90" : "")}
                      />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                    {renderEnhancedTimeline(period)}
                    {renderCurrentPhaseInfo(period)}
                    {renderPeriodStats(period)}

                    <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Clock size={16} /> Dates del Període
                      </h4>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        {[
                          { label: 'Sol·licituds', start: period.phase_solicitudes_start, end: period.phase_solicitudes_end, phase: PHASES.SOLICITUDES },
                          { label: 'Assignació', start: null, end: null, phase: PHASES.ASIGNACION },
                          { label: 'Publicació', start: period.phase_publicacion_start, end: period.phase_publicacion_end, phase: PHASES.PUBLICACION },
                          { label: 'Execució', start: period.phase_ejecucion_start, end: period.phase_ejecucion_end, phase: PHASES.EJECUCION }
                        ].map(({ label, start, end, phase }) => {
                          const phaseConfig = PHASE_CONFIG[phase];
                          const isCurrent = period.current_phase === phase;

                          return (
                            <div
                              key={label}
                              className={
                                "p-3 rounded-lg border text-center " +
                                (isCurrent ? phaseConfig.lightBg + " " + phaseConfig.borderColor : "bg-white border-gray-200")
                              }
                            >
                              <p className={"font-medium " + (isCurrent ? phaseConfig.textColor : "text-gray-700")}>
                                {label}
                              </p>
                              <p className="text-gray-500 text-xs mt-1">
                                {start ? new Date(start).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' }) : '-'}
                                {' → '}
                                {end ? new Date(end).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' }) : '-'}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPeriod ? "Editar Període" : "Nou Període"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel·lar
            </Button>
            <Button type="submit" form="enrollment-form">
              {editingPeriod ? "Guardar canvis" : "Crear període"}
            </Button>
          </>
        }
      >
        <form id="enrollment-form" onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom del període
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              placeholder="Ex: Enginy 2025-2026 Modalitat C"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Configuració de Fases
            </label>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <Info size={18} className="text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-700">
                La fase d'Assignació no té dates fixes. L'administrador controla manualment quan executa l'algoritme i revisa els resultats.
              </p>
            </div>
            {renderPhaseForm()}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EnrollmentManager;
