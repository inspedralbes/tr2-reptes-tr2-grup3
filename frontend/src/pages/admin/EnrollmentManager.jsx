/**
 * EnrollmentManager.jsx
 * 
 * Página de administración para gestionar los períodos de inscripción.
 * Permite crear, editar, eliminar y publicar resultados de períodos.
 * 
 * Estados de un período:
 * - OPEN: Abierto para solicitudes de centros
 * - PROCESSING: Cerrado, pendiente de ejecutar algoritmo
 * - PUBLISHED: Resultados publicados y visibles
 * - CLOSED: Período finalizado
 */
import { useState, useEffect } from "react";
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
        // Actualizar período existente
        await enrollmentService.update(editingPeriod.id, formData);
      } else {
        // Crear nuevo período
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
   * Cambia el estado de PROCESSING a PUBLISHED
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
      OPEN: "bg-green-100 text-green-800",
      PROCESSING: "bg-yellow-100 text-yellow-800",
      PUBLISHED: "bg-blue-100 text-blue-800",
      CLOSED: "bg-gray-100 text-gray-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
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

  // Mostrar loading mientras carga
  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Cargando períodos...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Cabecera */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Períodos de Inscripción</h1>
          <p className="text-gray-500">Gestiona los períodos en los que los centros pueden solicitar talleres</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          ➕ Nuevo Período
        </button>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tabla de períodos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Inicio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Fin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {periods.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No hay períodos creados. Crea uno nuevo para empezar.
                </td>
              </tr>
            ) : (
              periods.map((period) => (
                <tr key={period.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{period.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {period.start_date ? new Date(period.start_date).toLocaleDateString("es-ES") : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {period.end_date ? new Date(period.end_date).toLocaleDateString("es-ES") : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(period.status)}`}>
                      {getStatusLabel(period.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end gap-2">
                      {/* Botón publicar - solo si está en PROCESSING */}
                      {period.status === "PROCESSING" && (
                        <button
                          onClick={() => handlePublish(period.id)}
                          className="text-green-600 hover:text-green-800"
                          title="Publicar resultados"
                        >
                          📢 Publicar
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(period)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar período"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(period.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar período"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingPeriod ? "Editar Período" : "Nuevo Período"}
            </h2>
            
            <form onSubmit={handleSave}>
              {/* Nombre */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del período
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Curso 2024-2025 Q1"
                  required
                />
              </div>

              {/* Fecha inicio */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Fecha fin */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de fin
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Estado (solo en edición) */}
              {editingPeriod && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="OPEN">Abierto</option>
                    <option value="PROCESSING">Procesando</option>
                    <option value="PUBLISHED">Publicado</option>
                    <option value="CLOSED">Cerrado</option>
                  </select>
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingPeriod ? "Guardar cambios" : "Crear período"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentManager;
