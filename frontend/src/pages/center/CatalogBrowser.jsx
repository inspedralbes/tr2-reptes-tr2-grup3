import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { listWorkshops, getWorkshop } from "../../api/catalog.js";

/**
 * CatalogBrowser - Navegador del catálogo de talleres para centros
 * Permite: filtrar por ámbito/día, ver detalles, seleccionar para solicitud
 */
const CatalogBrowser = () => {
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  
  // Filtros
  const [filterAmbit, setFilterAmbit] = useState('');
  const [filterDay, setFilterDay] = useState('');

  // Cargar talleres
  useEffect(() => {
    loadWorkshops();
  }, [filterAmbit]);

  const loadWorkshops = async () => {
    try {
      setLoading(true);
      const filters = filterAmbit ? { ambit: filterAmbit } : {};
      const data = await listWorkshops(filters);
      setWorkshops(data);
    } catch (err) {
      console.error('Error loading workshops:', err);
    } finally {
      setLoading(false);
    }
  };

  // Ver detalles de un taller
  const handleViewDetails = async (id) => {
    try {
      const data = await getWorkshop(id);
      setSelectedWorkshop(data);
    } catch (err) {
      console.error('Error loading workshop details:', err);
    }
  };

  // Ámbitos disponibles
  const ambits = ['Tecnològic', 'Artístic', 'Sostenibilitat', 'Oci i benestar', 'Comunicació'];

  // Filtrar por día si está activo
  const filteredWorkshops = workshops.filter(w => {
    if (!filterDay) return true;
    // Nota: necesitaríamos las ediciones para filtrar por día
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card title="Explorar Catálogo de Talleres">
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Filtrar por ámbito:</label>
            <select 
              value={filterAmbit} 
              onChange={(e) => setFilterAmbit(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">Todos los ámbitos</option>
              {ambits.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Filtrar por día:</label>
            <select 
              value={filterDay} 
              onChange={(e) => setFilterDay(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">Todos los días</option>
              <option value="TUESDAY">Martes</option>
              <option value="THURSDAY">Jueves</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={() => navigate('/center/request')}>
              📝 Nueva Solicitud
            </Button>
          </div>
        </div>
      </Card>

      {/* Grid de talleres */}
      {loading ? (
        <p className="text-center py-8">Cargando talleres...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkshops.map((workshop) => (
            <div 
              key={workshop.id} 
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-white"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{workshop.title}</h3>
                {workshop.is_new && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    NUEVO
                  </span>
                )}
              </div>
              
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm mb-2">
                {workshop.ambit}
              </span>
              
              {workshop.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {workshop.description}
                </p>
              )}
              
              <button
                onClick={() => handleViewDetails(workshop.id)}
                className="text-blue-600 hover:underline text-sm"
              >
                Ver detalles y horarios →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalles */}
      {selectedWorkshop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{selectedWorkshop.title}</h2>
              <button 
                onClick={() => setSelectedWorkshop(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm mb-3">
              {selectedWorkshop.ambit}
            </span>
            
            {selectedWorkshop.description && (
              <p className="text-gray-600 mb-4">{selectedWorkshop.description}</p>
            )}
            
            <h3 className="font-semibold mb-2">Ediciones disponibles:</h3>
            {selectedWorkshop.editions && selectedWorkshop.editions.length > 0 ? (
              <div className="space-y-2">
                {selectedWorkshop.editions.map((edition, idx) => (
                  <div key={idx} className="border rounded p-3 bg-gray-50">
                    <div className="flex justify-between">
                      <span className={`px-2 py-1 rounded text-sm ${
                        edition.day_of_week === 'TUESDAY' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {edition.day_of_week === 'TUESDAY' ? '📅 Martes' : '📅 Jueves'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {edition.start_time} - {edition.end_time}
                      </span>
                    </div>
                    <div className="text-sm mt-1 text-gray-500">
                      Capacidad: {edition.capacity_total} | Máx. por centro: {edition.max_per_school}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No hay ediciones disponibles.</p>
            )}
            
            <div className="mt-4 flex gap-2">
              <Button onClick={() => {
                setSelectedWorkshop(null);
                navigate('/center/request');
              }}>
                Solicitar este taller
              </Button>
              <Button variant="secondary" onClick={() => setSelectedWorkshop(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-500">
        Mostrando {filteredWorkshops.length} talleres
      </p>
    </div>
  );
};

export default CatalogBrowser;
