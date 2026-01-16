import { useEffect, useState } from "react";
import {
  Play,
  BarChart,
  CheckCircle,
  Calendar,
  AlertCircle,
  Users,
  Clock,
  Cpu,
  Sliders
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

  const totalDemand = demandSummary.reduce((sum, item) => sum + parseInt(item.total_requested), 0);
  const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.assigned_seats, 0);
  const coverage = totalDemand > 0 ? Math.round((totalAllocated / totalDemand) * 100) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Cpu className="text-blue-600" size={28} /> Panel de Asignación Automática
        </h1>
        <p className="text-gray-500 mt-1">
          Ejecuta el algoritmo de asignación de plazas para distribuir los talleres disponibles.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
          <div className="text-2xl font-bold text-blue-600">{totalDemand}</div>
          <div className="text-xs font-semibold uppercase text-blue-800 tracking-wide mt-1">Alumnos Solicitantes</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
          <div className="text-2xl font-bold text-green-600">{totalAllocated}</div>
          <div className="text-xs font-semibold uppercase text-green-800 tracking-wide mt-1">Plazas Asignadas</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
          <div className="text-2xl font-bold text-purple-600">{coverage}%</div>
          <div className="text-xs font-semibold uppercase text-purple-800 tracking-wide mt-1">Cobertura</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 flex items-center gap-2">
            <Calendar size={18} className="text-gray-500" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer text-gray-700 font-medium w-full md:w-64"
            >
              {periods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleRunAllocation} disabled={loading}>
            <div className="flex items-center gap-2">
              <Play size={18} fill="currentColor" />
              {loading ? 'Ejecutando...' : 'Ejecutar Asignación'}
            </div>
          </Button>
        </div>
      </div>

      {/* Mensajes */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'error'
          ? 'bg-red-50 text-red-800 border border-red-200'
          : 'bg-green-50 text-green-800 border border-green-200'
          }`}>
          {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Tabs Content */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden min-h-[500px]">
        {/* Custom Tabs Header */}
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors relative ${activeTab === 'demand'
              ? 'text-blue-600 bg-blue-50/50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            onClick={() => setActiveTab('demand')}
          >
            <div className="flex items-center justify-center gap-2">
              <BarChart size={18} /> Demanda
              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">{demandSummary.length}</span>
            </div>
            {activeTab === 'demand' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
          </button>
          <button
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors relative ${activeTab === 'results'
              ? 'text-blue-600 bg-blue-50/50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            onClick={() => setActiveTab('results')}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle size={18} /> Asignaciones
              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">{Object.keys(groupedAllocations).length}</span>
            </div>
            {activeTab === 'results' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
          </button>
        </div>

        <div className="p-6">
          {/* Tab: Demanda */}
          {activeTab === 'demand' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <BarChart className="text-gray-400" size={20} /> Resumen de Solicitudes
                </h3>
              </div>

              {demandSummary.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500">No hay solicitudes pendientes para este período.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full border-collapse bg-white text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-left">
                        <th className="py-3 px-4 font-semibold text-gray-600 uppercase text-xs">Centro</th>
                        <th className="py-3 px-4 font-semibold text-gray-600 uppercase text-xs">Taller</th>
                        <th className="py-3 px-4 font-semibold text-gray-600 uppercase text-xs">Día</th>
                        <th className="py-3 px-4 font-semibold text-gray-600 uppercase text-xs">Alumnos</th>
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
                              : 'bg-indigo-50 text-indigo-700 border-indigo-100'
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
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={20} /> Resultados de Asignación
                </h3>
              </div>

              {Object.keys(groupedAllocations).length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500">No hay asignaciones para mostrar.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.values(groupedAllocations).map((workshop, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${workshop.day === 'TUESDAY' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                            <Calendar size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 leading-tight text-sm line-clamp-2" title={workshop.title}>{workshop.title}</h4>
                            <span className="text-xs text-gray-500 font-medium">{workshop.day === 'TUESDAY' ? 'Martes' : 'Jueves'}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${workshop.total >= 16 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                          }`}>
                          <Users size={12} /> {workshop.total}
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
                              className={`px-2 py-1 rounded-md text-xs border font-medium flex items-center justify-between gap-2 w-full ${badgeStyle}`}
                            >
                              <span className="truncate">{school.name}</span>
                              <span className="bg-white/50 px-1.5 rounded text-[10px] font-bold">
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
        </div>
      </div>

    </div>
  );
};

export default AllocationPanel;
