import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import { providerService } from "../../services/provider.service.js";

const ProviderManager = () => {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingProvider, setEditingProvider] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        contact_email: '',
    });

    useEffect(() => {
        loadProviders();
    }, []);

    const loadProviders = async () => {
        try {
            setLoading(true);
            const data = await providerService.getAll();
            setProviders(data);
            setError(null);
        } catch (err) {
            setError('Error al cargar proveedores: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProvider) {
                await providerService.update(editingProvider.id, formData);
            } else {
                await providerService.create(formData);
            }
            setShowModal(false);
            setEditingProvider(null);
            setFormData({ name: '', address: '', contact_email: '' });
            loadProviders();
        } catch (err) {
            setError('Error al guardar: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleEdit = (provider) => {
        setEditingProvider(provider);
        setFormData({
            name: provider.name,
            address: provider.address || '',
            contact_email: provider.contact_email || '',
        });
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingProvider(null);
        setFormData({ name: '', address: '', contact_email: '' });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este proveedor?')) return;
        try {
            await providerService.delete(id);
            loadProviders();
        } catch (err) {
            setError('Error al eliminar: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="space-y-4">
            <Card title="Gestión de Proveedores">
                <div className="flex justify-between items-center mb-6">
                    <div></div>
                    <Button onClick={handleCreate}>
                        <div className="flex items-center gap-2">
                            <Plus size={18} /> Nuevo Proveedor
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
                                    <th className="px-6 py-4 font-medium text-gray-900">Nombre</th>
                                    <th className="px-6 py-4 font-medium text-gray-900">Dirección</th>
                                    <th className="px-6 py-4 font-medium text-gray-900">Contacto</th>
                                    <th className="px-6 py-4 font-medium text-gray-900 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                                {providers.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                                        <td className="px-6 py-4">{p.address || '-'}</td>
                                        <td className="px-6 py-4">{p.contact_email}</td>
                                        <td className="px-6 py-4 flex justify-end gap-3">
                                            <button
                                                onClick={() => handleEdit(p)}
                                                className="text-gray-400 hover:text-blue-600 transition-colors"
                                                title="Editar"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p.id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {providers.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                            No hay proveedores registrados.
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
                title={editingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" form="provider-form">
                            Guardar
                        </Button>
                    </>
                }
            >
                <form id="provider-form" onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                            required
                            placeholder="Ej: Empresa SL"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                            placeholder="C/ Ejemplo 123"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contacto</label>
                        <input
                            type="email"
                            value={formData.contact_email}
                            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                            placeholder="contacto@empresa.com"
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ProviderManager;
