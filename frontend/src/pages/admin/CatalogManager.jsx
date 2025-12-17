import { useEffect, useState } from "react";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { listWorkshops, createWorkshop, updateWorkshop, deleteWorkshop } from "../../api/catalog.js";

/**
 * CatalogManager - Panel de administración del catálogo de talleres
 * Permite: listar, crear, editar y eliminar talleres (solo ADMIN)
 */
const CatalogManager = () => {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
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
      setShowForm(false);
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
    setShowForm(true);
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
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium">Filtrar por ámbito:</label>
            <select 
              value={filterAmbit} 
              onChange={(e) => setFilterAmbit(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">Todos</option>
              {ambits.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <Button onClick={() => { setShowForm(true); setEditingWorkshop(null); }}>
            + Nuevo Taller
          </Button>
        </div>

        {/* Mensajes de error */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Formulario de creación/edición */}
        {showForm && (
          <div className="bg-gray-50 p-4 rounded mb-4 border">
            <h3 className="font-semibold mb-3">
              {editingWorkshop ? 'Editar Taller' : 'Nuevo Taller'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Título *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ámbito *</label>
                <select
                  value={formData.ambit}
                  onChange={(e) => setFormData({...formData, ambit: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {ambits.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_new"
                  checked={formData.is_new}
                  onChange={(e) => setFormData({...formData, is_new: e.target.checked})}
                />
                <label htmlFor="is_new" className="text-sm">Es nuevo este año</label>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Guardar</Button>
                <Button type="button" variant="secondary" onClick={() => {
                  setShowForm(false);
                  setEditingWorkshop(null);
                }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Tabla de talleres */}
        {loading ? (
          <p className="text-center py-4">Cargando...</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left border-b-2 border-gray-200">
                <th className="py-2 px-2">Título</th>
                <th className="py-2 px-2">Ámbito</th>
                <th className="py-2 px-2">Nuevo</th>
                <th className="py-2 px-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {workshops.map((w) => (
                <tr key={w.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-2 font-medium">{w.title}</td>
                  <td className="py-2 px-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {w.ambit}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    {w.is_new && <span className="text-green-600">✓ Sí</span>}
                  </td>
                  <td className="py-2 px-2">
                    <button 
                      onClick={() => handleEdit(w)}
                      className="text-blue-600 hover:underline mr-3"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(w.id)}
                      className="text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p className="text-sm text-gray-500 mt-4">
          Total: {workshops.length} talleres
        </p>
      </Card>
    </div>
  );
};

export default CatalogManager;
