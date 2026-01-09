/**
 * EnrollmentManager.jsx
 * 
 * Página de administración para gestionar los períodos de inscripción.
 * Permite crear, editar, eliminar y publicar resultados de períodos.
 */
import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Megaphone, Calendar } from "lucide-react";
import Modal from "../../components/common/Modal.jsx";
import Button from "../../components/ui/Button.jsx";
import enrollmentService from "../../services/enrollment.service";

const EnrollmentManager = () => {
  // Estado para lista de períodos
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado para modal de crear/editar
  const [showModal, setShowModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    status: "OPEN"
  });

  // Cargar períodos al montar el componente
  useEffect(() => {
    loadPeriods();
  }, []);

  /**
   * Obtiene todos los períodos de inscripción del backend
   */
  const loadPeriods = async () => {
    try {
      setLoading(true);
      const data = await enrollmentService.getAll();
      setPeriods(data);
      setError(null);
    } catch (err) {
      setError("Error al cargar períodos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Abre el modal para crear un nuevo período
   */
  const handleCreate = () => {
    setEditingPeriod(null);
    setFormData({
      name: "",
      start_date: "",
      end_date: "",
      status: "OPEN"
    });
    setShowModal(true);
  };

  /**
   * Abre el modal para editar un período existente
   */
  const handleEdit = (period) => {
    setEditingPeriod(period);
    setFormData({
      name: period.name,
      start_date: period.start_date?.split("T")[0] || "",
      end_date: period.end_date?.split("T")[0] || "",
      status: period.status
    });
    setShowModal(true);
  };

  /**
   * Guarda el período (crear o actualizar según contexto)
   */
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingPeriod) {
        await enrollmentService.update(editingPeriod.id, formData);
      } else {
        await enrollmentService.create(formData);
      }
      setShowModal(false);
      loadPeriods(); // Recargar lista
    } catch (err) {
      setError("Error al guardar: " + err.message);
    }
  };

  /**
   * Elimina un período tras confirmación
   */
  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este período? Esta acción no se puede deshacer.")) {
      return;
    }
    try {
      await enrollmentService.delete(id);
      loadPeriods();
    } catch (err) {
      setError("Error al eliminar: " + err.message);
    }
  };

  /**
   * Publica los resultados de un período
   */
  const handlePublish = async (id) => {
    if (!window.confirm("¿Publicar los resultados de este período? Los centros podrán ver sus asignaciones.")) {
      return;
    }
    try {
      await enrollmentService.publish(id);
      loadPeriods();
    } catch (err) {
      setError("Error al publicar: " + err.message);
    }
  };

  /**
   * Devuelve el color del badge según el estado
   */
  const getStatusColor = (status) => {
    const colors = {
      OPEN: "bg-green-100 text-green-800 border-green-200",
      PROCESSING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      PUBLISHED: "bg-blue-100 text-blue-800 border-blue-200",
      CLOSED: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  /**
   * Traduce el estado a español
   */
  const getStatusLabel = (status) => {
    const labels = {
      OPEN: "Abierto",
      PROCESSING: "Procesando",
      PUBLISHED: "Publicado",
      CLOSED: "Cerrado"
    };
    return labels[status] || status;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="text-blue-600" /> Períodos de Inscripción
          </h1>
          <p className="text-gray-500 mt-1">Gestiona los plazos y estados de las solicitudes</p>
        </div>
        <Button onClick={handleCreate}>
          <div className="flex items-center gap-2">
            <Plus size={18} /> Nuevo Período
          </div>
        </Button>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {/* Tabla de períodos */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Inicio</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fin</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {periods.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No hay períodos creados. Crea uno nuevo para empezar.
                  </td>
                </tr>
              ) : (
                periods.map((period) => (
                  <tr key={period.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{period.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {period.start_date ? new Date(period.start_date).toLocaleDateString("es-ES") : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {period.end_date ? new Date(period.end_date).toLocaleDateString("es-ES") : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(period.status)}`}>
                        {getStatusLabel(period.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        {/* Botón publicar - solo si está en PROCESSING */}
                        {period.status === "PROCESSING" && (
                          <button
                            onClick={() => handlePublish(period.id)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Publicar resultados"
                          >
                            <Megaphone size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(period)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Editar período"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(period.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                          title="Eliminar período"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Crear/Editar */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPeriod ? "Editar Período" : "Nuevo Período"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="enrollment-form">
              {editingPeriod ? "Guardar cambios" : "Crear período"}
            </Button>
          </>
        }
      >
        <form id="enrollment-form" onSubmit={handleSave} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del período
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              placeholder="Ej: Curso 2024-2025 Q1"
              required
            />
          </div>

          {/* Fecha inicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de inicio (Solicitudes)
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              required
            />
          </div>

          {/* Fecha fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de fin (Solicitudes)
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              required
            />
          </div>

          {/* Estado (solo en edición) */}
          {editingPeriod && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              >
                <option value="OPEN">Abierto</option>
                <option value="PROCESSING">Procesando (Cerrado)</option>
                <option value="PUBLISHED">Publicado</option>
                <option value="CLOSED">Finalizado</option>
              </select>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default EnrollmentManager;
