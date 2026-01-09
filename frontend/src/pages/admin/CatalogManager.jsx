import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Filter } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import { listWorkshops, createWorkshop, updateWorkshop, deleteWorkshop } from "../../api/catalog.js";

/**
 * CatalogManager - Panel de administración del catálogo de talleres
 * Permite: listar, crear, editar y eliminar talleres (solo ADMIN)
 */
const CatalogManager = () => {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState(null);
  const [filterAmbit, setFilterAmbit] = useState('');

  // Formulario
  const [formData, setFormData] = useState({
    title: '',
    ambit: '',
    is_new: false,
    description: '',
  });

  // Cargar talleres al montar componente
  useEffect(() => {
    loadWorkshops();
  }, [filterAmbit]);

  const loadWorkshops = async () => {
    try {
      setLoading(true);
      const filters = filterAmbit ? { ambit: filterAmbit } : {};
      const data = await listWorkshops(filters);
      setWorkshops(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar talleres: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Manejar submit del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingWorkshop) {
        await updateWorkshop(editingWorkshop.id, formData);
      } else {
        await createWorkshop(formData);
      }
      setShowModal(false);
      setEditingWorkshop(null);
      setFormData({ title: '', ambit: '', is_new: false, description: '' });
      loadWorkshops();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    }
  };

  // Manejar edición
  const handleEdit = (workshop) => {
    setEditingWorkshop(workshop);
    setFormData({
      title: workshop.title,
      ambit: workshop.ambit,
      is_new: workshop.is_new,
      description: workshop.description || '',
    });
    setShowModal(true);
  };

  // Manejar creación
  const handleCreate = () => {
    setEditingWorkshop(null);
    setFormData({ title: '', ambit: '', is_new: false, description: '' });
    setShowModal(true);
  };

  // Manejar eliminación
  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este taller?')) return;
    try {
      await deleteWorkshop(id);
      loadWorkshops();
    } catch (err) {
      setError('Error al eliminar: ' + err.message);
    }
  };

  // Ámbitos disponibles
  const ambits = ['Tecnològic', 'Artístic', 'Sostenibilitat', 'Oci i benestar', 'Comunicació'];

  return (
    <div className="space-y-4">
      <Card title="Gestión del Catálogo de Talleres">
        {/* Barra de acciones */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2 items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <Filter size={18} className="text-gray-500" />
            <select
              value={filterAmbit}
              onChange={(e) => setFilterAmbit(e.target.value)}
              className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer"
            >
              <option value="">Todos los ámbitos</option>
              {ambits.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <Button onClick={handleCreate}>
            <div className="flex items-center gap-2">
              <Plus size={18} /> Nuevo Taller
            </div>
          </Button>
        </div>

        {/* Mensajes de error */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 mb-4 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">×</button>
          </div>
        )}

        {/* Tabla de talleres */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-medium text-gray-900">Título</th>
                  <th className="px-6 py-4 font-medium text-gray-900">Ámbito</th>
                  <th className="px-6 py-4 font-medium text-gray-900">Estado</th>
                  <th className="px-6 py-4 font-medium text-gray-900 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                {workshops.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{w.title}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
                        {w.ambit}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {w.is_new ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 border border-green-200">
                          Nuevo
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-3">
                      <button
                        onClick={() => handleEdit(w)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && workshops.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            No hay talleres creados todavía.
          </div>
        )}

        <p className="text-sm text-gray-500 mt-4 text-right">
          Total: {workshops.length} talleres
        </p>
      </Card>

      {/* Modal de Creación/Edición */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingWorkshop ? 'Editar Taller' : 'Nuevo Taller'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="workshop-form">
              Guardar
            </Button>
          </>
        }
      >
        <form id="workshop-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
              required
              placeholder="Introducción a la Robótica"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ámbito *</label>
            <select
              value={formData.ambit}
              onChange={(e) => setFormData({ ...formData, ambit: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              required
            >
              <option value="">Seleccionar...</option>
              {ambits.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              rows={4}
              placeholder="Breve descripción del taller..."
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_new"
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
              checked={formData.is_new}
              onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
            />
            <label htmlFor="is_new" className="text-sm text-gray-700 select-none">Es un taller nuevo este año</label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CatalogManager;
