import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import { centerService } from "../../services/center.service.js";

const CenterManager = () => {
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingCenter, setEditingCenter] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
    });

    useEffect(() => {
        loadCenters();
    }, []);

    const loadCenters = async () => {
        try {
            setLoading(true);
            const data = await centerService.getAll();
            setCenters(data);
            setError(null);
        } catch (err) {
            setError('Error al cargar centros: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCenter) {
                await centerService.update(editingCenter.id, formData);
            } else {
                await centerService.create(formData);
            }
            setShowModal(false);
            setEditingCenter(null);
            setFormData({ name: '', code: '' });
            loadCenters();
        } catch (err) {
            setError('Error al guardar: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleEdit = (center) => {
        setEditingCenter(center);
        setFormData({
            name: center.name,
            code: center.code || '',
        });
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingCenter(null);
        setFormData({ name: '', code: '' });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este centro?')) return;
        try {
            await centerService.delete(id);
            loadCenters();
        } catch (err) {
            setError('Error al eliminar: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="space-y-4">
            <Card title="Gestión de Centros">
                <div className="flex justify-between items-center mb-6">
                    <div></div>
                    <Button onClick={handleCreate}>
                        <div className="flex items-center gap-2">
                            <Plus size={18} /> Nuevo Centro
                        </div>
                    </Button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 mb-4 flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">×</button>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-gray-900">Código</th>
                                    <th className="px-6 py-4 font-medium text-gray-900">Nombre</th>
                                    <th className="px-6 py-4 font-medium text-gray-900 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                                {centers.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs">{c.code}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                                        <td className="px-6 py-4 flex justify-end gap-3">
                                            <button
                                                onClick={() => handleEdit(c)}
                                                className="text-gray-400 hover:text-blue-600 transition-colors"
                                                title="Editar"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(c.id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {centers.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                                            No hay centros registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingCenter ? 'Editar Centro' : 'Nuevo Centro'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" form="center-form">
                            Guardar
                        </Button>
                    </>
                }
            >
                <form id="center-form" onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                            required
                            placeholder="Ej: Institut Pedralbes"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                            placeholder="08013275"
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CenterManager;
