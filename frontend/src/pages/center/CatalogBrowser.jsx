import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, Clock, Filter, Info, Star } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
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
  const [detailsLoading, setDetailsLoading] = useState(false);

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
  const handleViewDetails = async (workshop) => {
    try {
      // Si el workshop ya tiene ediciones completas (que ahora vienen del list), podríamos usarlo directamente,
      // pero getWorkshop trae info extra si la hubiese. Por ahora usamos el del listado si tiene ediciones,
      // o recargamos si queremos asegurarnos. El endpoint list ya trae ediciones básicas.
      // Pero getWorkshop trae capacity, max_per_school y quizas mas detalles.
      // Vamos a llamar a getWorkshop para asegurar coherencia, aunque mostraremos el modal rápido.
      setDetailsLoading(true);
      const data = await getWorkshop(workshop.id);
      setSelectedWorkshop(data);
    } catch (err) {
      console.error('Error loading workshop details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Ámbitos disponibles
  const ambits = ['Tecnològic', 'Artístic', 'Sostenibilitat', 'Oci i benestar', 'Comunicació'];

  // Filtrar por día si está activo
  const filteredWorkshops = workshops.filter(w => {
    if (!filterDay) return true;
    // Filtrar si alguna de las ediciones coincide con el día seleccionado
    return w.editions && w.editions.some(e => e.day_of_week === filterDay);
  });

  // Helper para formatear hora
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5); // 15:30:00 -> 15:30
  };

  return (
    <div className="space-y-6">
      {/* Cabecera y Filtros */}
      <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Search className="text-blue-600" /> Explorar Catálogo
        </h2>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Filter size={16} /> Filtrar por ámbito
            </label>
            <select
              value={filterAmbit}
              onChange={(e) => setFilterAmbit(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Todos los ámbitos</option>
              {ambits.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Calendar size={16} /> Filtrar por día
            </label>
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Todos los días</option>
              <option value="TUESDAY">Martes</option>
              <option value="THURSDAY">Jueves</option>
            </select>
          </div>

          <div className="flex-1 text-right">
            <Button onClick={() => navigate('/center/request')}>
              📝 Nueva Solicitud
            </Button>
          </div>
        </div>
      </div>

      {/* Grid de talleres */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkshops.map((workshop) => (
            <div
              key={workshop.id}
              className="group bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col"
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    {workshop.ambit}
                  </span>
                  {workshop.is_new && (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold shadow-xs">
                      <Star size={10} className="fill-current" /> NUEVO
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-lg text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                  {workshop.title}
                </h3>

                {workshop.description && (
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                    {workshop.description}
                  </p>
                )}

                {/* Horarios visibles directamente */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 mt-auto">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Horarios Disponibles</p>
                  {workshop.editions && workshop.editions.length > 0 ? (
                    workshop.editions.map((ed, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-700 gap-2">
                        {ed.day_of_week === 'TUESDAY' ? (
                          <span className="w-20 text-xs font-medium bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-center">Martes</span>
                        ) : (
                          <span className="w-20 text-xs font-medium bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-center">Jueves</span>
                        )}
                        <span className="flex items-center gap-1 text-gray-600">
                          <Clock size={14} />
                          {formatTime(ed.start_time)} - {formatTime(ed.end_time)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400 italic">Sin ediciones programadas</span>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-sm">
                <button
                  onClick={() => handleViewDetails(workshop)}
                  className="text-blue-600 font-medium hover:text-blue-800 flex items-center gap-1 transition-colors"
                >
                  <Info size={16} /> Ver detalles completos
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Helper text */}
      {!loading && (
        <div className="text-center text-sm text-gray-500 mt-8">
          Mostrando {filteredWorkshops.length} de {workshops.length} talleres disponibles
        </div>
      )}

      {/* Modal de detalles */}
      <Modal
        isOpen={!!selectedWorkshop}
        onClose={() => setSelectedWorkshop(null)}
        title={selectedWorkshop?.title || 'Detalle del Taller'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedWorkshop(null)}>
              Cerrar
            </Button>
            <Button onClick={() => {
              setSelectedWorkshop(null);
              navigate('/center/request');
            }}>
              Solicitar Taller
            </Button>
          </>
        }
      >
        {selectedWorkshop && (
          <div className="space-y-6">
            <div>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-3">
                {selectedWorkshop.ambit}
              </span>
              <p className="text-gray-700 leading-relaxed text-base">
                {selectedWorkshop.description || 'Sin descripción disponible.'}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar size={18} className="text-gray-500" />
                Sesiones y Capacidad
              </h4>
              {selectedWorkshop.editions && selectedWorkshop.editions.length > 0 ? (
                <div className="grid gap-3">
                  {selectedWorkshop.editions.map((edition, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-white hover:shadow-xs transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${edition.day_of_week === 'TUESDAY' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                            {edition.day_of_week === 'TUESDAY' ? 'Martes' : 'Jueves'}
                          </span>
                          <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
                            <Clock size={16} />
                            {formatTime(edition.start_time)} - {formatTime(edition.end_time)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-400 uppercase">Capacidad Total</span>
                          <span className="font-semibold">{edition.capacity_total} alumnos</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-400 uppercase">Máx. por Centro</span>
                          <span className="font-semibold">{edition.max_per_school} alumnos</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No hay sesiones definidas para este taller.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CatalogBrowser;
