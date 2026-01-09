import { useEffect, useState } from "react";
import {
  Play,
  BarChart,
  CheckCircle,
  Calendar,
  AlertCircle,
  Users,
  Clock
} from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import {
  listEnrollmentPeriods,
  getDemandSummary,
  runAllocation,
  listAllocations
} from "../../api/requests.js";

/**
 * AllocationPanel - Panel de asignación automática (solo ADMIN)
 * Permite: ver demanda, ejecutar algoritmo, ver resultados
 */
const AllocationPanel = () => {
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [demandSummary, setDemandSummary] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('demand'); // 'demand' | 'results'

  // Cargar períodos al montar
  useEffect(() => {
    loadPeriods();
  }, []);

  // Cargar datos cuando cambia el período seleccionado
  useEffect(() => {
    if (selectedPeriod) {
      loadDemandSummary();
      loadAllocations();
    }
  }, [selectedPeriod]);

  const loadPeriods = async () => {
    try {
      const data = await listEnrollmentPeriods();
      setPeriods(data);
      if (data.length > 0) {
        setSelectedPeriod(data[0].id);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al cargar períodos: ' + err.message });
    }
  };

  const loadDemandSummary = async () => {
    try {
      const response = await getDemandSummary(selectedPeriod);
      setDemandSummary(response.data || []);
    } catch (err) {
      console.error('Error loading demand:', err);
    }
  };

  const loadAllocations = async () => {
    try {
      const data = await listAllocations({ period_id: selectedPeriod });
      setAllocations(data);
    } catch (err) {
      console.error('Error loading allocations:', err);
    }
  };

  // Ejecutar algoritmo de asignación
  const handleRunAllocation = async () => {
    if (!window.confirm('¿Ejecutar el algoritmo de asignación? Esto procesará todas las solicitudes pendientes.')) {
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      const result = await runAllocation(selectedPeriod);
      setMessage({
        type: 'success',
        text: `Asignación completada: ${result.allocations_created || 0} asignaciones creadas`
      });
      loadAllocations();
    } catch (err) {
      setMessage({ type: 'error', text: 'Error en asignación: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  // Agrupar asignaciones por taller
  const groupedAllocations = allocations.reduce((acc, alloc) => {
    const key = alloc.workshop_title;
    if (!acc[key]) {
      acc[key] = { title: key, day: alloc.day_of_week, schools: [], total: 0 };
    }
    acc[key].schools.push({
      name: alloc.school_name,
      seats: alloc.assigned_seats,
      status: alloc.status
    });
    acc[key].total += alloc.assigned_seats;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card title="Panel de Asignación Automática">
        {/* Selector de período */}
        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Calendar size={18} /> Período de inscripción:
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border-gray-300 rounded-lg px-3 py-2 w-full max-w-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {periods.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.status})
              </option>
            ))}
          </select>
        </div>

        {/* Mensajes */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${message.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-green-50 text-green-800 border border-green-200'
            }`}>
            {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`px-6 py-3 flex items-center gap-2 font-medium transition-all ${activeTab === 'demand'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('demand')}
          >
            <BarChart size={18} /> Demanda <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs ml-1">{demandSummary.length}</span>
          </button>
          <button
            className={`px-6 py-3 flex items-center gap-2 font-medium transition-all ${activeTab === 'results'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('results')}
          >
            <CheckCircle size={18} /> Asignaciones <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs ml-1">{allocations.length}</span>
          </button>
        </div>

        {/* Tab: Demanda */}
        {activeTab === 'demand' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Resumen de Demanda</h3>
              <Button onClick={handleRunAllocation} disabled={loading}>
                <div className="flex items-center gap-2">
                  <Play size={18} fill="currentColor" />
                  {loading ? 'Ejecutando...' : 'Ejecutar Asignación'}
                </div>
              </Button>
            </div>

            {demandSummary.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">No hay solicitudes pendientes para este período.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full border-collapse bg-white">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="py-3 px-4 font-medium text-gray-600">Centro</th>
                      <th className="py-3 px-4 font-medium text-gray-600">Taller</th>
                      <th className="py-3 px-4 font-medium text-gray-600">Día</th>
                      <th className="py-3 px-4 font-medium text-gray-600">Alumnos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {demandSummary.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-gray-900 font-medium">{item.school_name}</td>
                        <td className="py-3 px-4 text-gray-600">{item.workshop_title}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${item.day_of_week === 'TUESDAY'
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : 'bg-purple-50 text-purple-700 border-purple-100'
                            }`}>
                            {item.day_of_week === 'TUESDAY' ? 'Martes' : 'Jueves'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-800">{item.total_requested}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab: Resultados */}
        {activeTab === 'results' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Asignaciones Realizadas</h3>

            {Object.keys(groupedAllocations).length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">No hay asignaciones para mostrar.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {Object.values(groupedAllocations).map((workshop, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${workshop.day === 'TUESDAY' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                          {workshop.day === 'TUESDAY' ? <Calendar size={20} /> : <Calendar size={20} />}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 leading-tight">{workshop.title}</h4>
                          <span className="text-sm text-gray-500 font-medium">{workshop.day === 'TUESDAY' ? 'Martes' : 'Jueves'}</span>
                        </div>
                      </div>
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        <Users size={14} /> {workshop.total}/16
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {workshop.schools.map((school, sIdx) => {
                        let badgeStyle = '';
                        if (school.status === 'PUBLISHED') badgeStyle = 'bg-green-50 text-green-700 border-green-200';
                        else if (school.status === 'ACCEPTED') badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
                        else badgeStyle = 'bg-yellow-50 text-yellow-700 border-yellow-200';

                        return (
                          <span
                            key={sIdx}
                            className={`px-3 py-1.5 rounded-lg text-sm border font-medium flex items-center gap-2 ${badgeStyle}`}
                          >
                            <span>{school.name}</span>
                            <span className="bg-white/50 px-1.5 rounded text-xs ml-1 font-bold">
                              {school.seats}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AllocationPanel;
