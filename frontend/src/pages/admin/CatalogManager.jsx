import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Filter, Layers, Wrench, Sparkles, Search } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState('');

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
      setError('Error desant: ' + err.message);
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
    if (!window.confirm('Estàs segur d\'eliminar aquest taller?')) return;
    try {
      await deleteWorkshop(id);
      loadWorkshops();
    } catch (err) {
      setError('Error al eliminar: ' + err.message);
    }
  };

  // Ámbitos disponibles
  const ambits = ['Tecnològic', 'Artístic', 'Sostenibilitat', 'Oci i benestar', 'Comunicació'];

  const filteredWorkshops = workshops.filter(w =>
    w.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: workshops.length,
    new: workshops.filter(w => w.is_new).length,
    tech: workshops.filter(w => w.ambit === 'Tecnològic').length,
    art: workshops.filter(w => w.ambit === 'Artístic').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Layers className="text-blue-600" size={28} /> Gestió del Catàleg
        </h1>
        <p className="text-gray-500 mt-1">
          Administra l'oferta de tallers disponibles per als centres educatius.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-xs font-semibold uppercase text-blue-800 tracking-wide mt-1">Total Tallers</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
          <div className="text-2xl font-bold text-green-600">{stats.new}</div>
          <div className="text-xs font-semibold uppercase text-green-800 tracking-wide mt-1">Novetats</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
          <div className="text-2xl font-bold text-purple-600">{stats.tech}</div>
          <div className="text-xs font-semibold uppercase text-purple-800 tracking-wide mt-1">Tecnològics</div>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
          <div className="text-2xl font-bold text-orange-600">{stats.art}</div>
          <div className="text-xs font-semibold uppercase text-orange-800 tracking-wide mt-1">Artístics</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
          <div className="w-full md:w-80 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cerca taller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 w-full md:w-auto">
            <Filter size={18} className="text-gray-500" />
            <select
              value={filterAmbit}
              onChange={(e) => setFilterAmbit(e.target.value)}
              className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer w-full md:w-auto text-gray-700 font-medium"
            >
              <option value="">Tots els àmbits</option>
              {ambits.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div className="w-full md:w-auto flex justify-end">
          <Button onClick={handleCreate}>
            <div className="flex items-center gap-2">
              <Plus size={18} /> Nou Taller
            </div>
          </Button>
        </div>
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
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Títol</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Àmbit</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estat</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Accions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                {filteredWorkshops.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{w.title}</div>
                      {w.description && <div className="text-xs text-gray-500 mt-0.5 max-w-sm truncate">{w.description}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                        {w.ambit === 'Tecnològic' && <Wrench size={12} />}
                        {w.ambit === 'Artístic' && <Sparkles size={12} />}
                        {w.ambit}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {w.is_new ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 border border-green-200">
                          <Sparkles size={10} className="mr-1" /> Nou
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(w)}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(w.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredWorkshops.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      <p className="text-lg font-medium text-gray-900 mb-1">No se encontraron talleres</p>
                      <p>Prueba con otros filtros</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 text-xs text-gray-500 flex justify-between">
            <span>Mostrant {filteredWorkshops.length} de {workshops.length} tallers</span>
          </div>
        </div>
      )}



      {/* Modal de Creación/Edición */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingWorkshop ? 'Editar Taller' : 'Nou Taller'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel·lar
            </Button>
            <Button type="submit" form="workshop-form">
              Desar
            </Button>
          </>
        }
      >
        <form id="workshop-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Títol *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Àmbit *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripció</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              rows={4}
              placeholder="Breu descripció del taller..."
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
            <label htmlFor="is_new" className="text-sm text-gray-700 select-none">És un taller nou aquest any</label>
          </div>
        </form>
      </Modal>
    </div >
  );
};

export default CatalogManager;
