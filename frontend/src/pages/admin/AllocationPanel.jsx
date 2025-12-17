import { useEffect, useState } from "react";
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
    <div className="space-y-4">
      <Card title="Panel de Asignación Automática">
        {/* Selector de período */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Período de inscripción:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border rounded px-3 py-2 w-full max-w-md"
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
          <div className={`p-3 rounded mb-4 ${
            message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b mb-4">
          <button
            className={`px-4 py-2 ${activeTab === 'demand' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
            onClick={() => setActiveTab('demand')}
          >
            📊 Demanda ({demandSummary.length})
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'results' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            ✅ Asignaciones ({allocations.length})
          </button>
        </div>

        {/* Tab: Demanda */}
        {activeTab === 'demand' && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Resumen de Demanda</h3>
              <Button onClick={handleRunAllocation} disabled={loading}>
                {loading ? 'Ejecutando...' : '🚀 Ejecutar Asignación'}
              </Button>
            </div>

            {demandSummary.length === 0 ? (
              <p className="text-gray-500 py-4">No hay solicitudes pendientes para este período.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left border-b-2 border-gray-200">
                    <th className="py-2 px-2">Centro</th>
                    <th className="py-2 px-2">Taller</th>
                    <th className="py-2 px-2">Día</th>
                    <th className="py-2 px-2">Alumnos</th>
                  </tr>
                </thead>
                <tbody>
                  {demandSummary.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-2 px-2">{item.school_name}</td>
                      <td className="py-2 px-2">{item.workshop_title}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          item.day_of_week === 'TUESDAY' ? 'bg-blue-100' : 'bg-purple-100'
                        }`}>
                          {item.day_of_week === 'TUESDAY' ? 'Martes' : 'Jueves'}
                        </span>
                      </td>
                      <td className="py-2 px-2 font-semibold">{item.total_requested}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab: Resultados */}
        {activeTab === 'results' && (
          <div>
            <h3 className="font-semibold mb-3">Asignaciones Realizadas</h3>
            
            {Object.keys(groupedAllocations).length === 0 ? (
              <p className="text-gray-500 py-4">No hay asignaciones para mostrar.</p>
            ) : (
              <div className="space-y-4">
                {Object.values(groupedAllocations).map((workshop, idx) => (
                  <div key={idx} className="border rounded p-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">{workshop.title}</h4>
                      <span className="text-sm text-gray-500">
                        {workshop.day === 'TUESDAY' ? '📅 Martes' : '📅 Jueves'} | 
                        Total: {workshop.total}/16
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {workshop.schools.map((school, sIdx) => (
                        <span 
                          key={sIdx} 
                          className={`px-2 py-1 rounded text-sm ${
                            school.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 
                            school.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {school.name}: {school.seats} alumnos
                        </span>
                      ))}
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
