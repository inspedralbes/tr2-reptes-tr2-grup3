import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Truck, Search, MapPin, Mail, Building } from "lucide-react";
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

    const [searchTerm, setSearchTerm] = useState("");

    const filteredProviders = providers.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            setError('Error carregant proveïdors: ' + (err.response?.data?.message || err.message));
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
            setError('Error desant: ' + (err.response?.data?.message || err.message));
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
        if (!window.confirm('Estàs segur d\'eliminar aquest proveïdor?')) return;
        try {
            await providerService.delete(id);
            loadProviders();
        } catch (err) {
            setError('Error al eliminar: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Truck className="text-blue-600" size={28} /> Gestió de Proveïdors
                </h1>
                <p className="text-gray-500 mt-1">
                    Administra els proveïdors de tallers i activitats extraescolars.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                    <div className="text-2xl font-bold text-blue-600">{providers.length}</div>
                    <div className="text-xs font-semibold uppercase text-blue-800 tracking-wide mt-1">Total Proveïdors</div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="w-full md:w-96 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cerca per nom o correu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                    <Button onClick={handleCreate}>
                        <div className="flex items-center gap-2">
                            <Plus size={18} /> Nou Proveïdor
                        </div>
                    </Button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">×</button>
                </div>
            )}

            {/* Table */}
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
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Adreça</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contacte</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Accions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                                {filteredProviders.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 hidden sm:block">
                                                <Building size={16} />
                                            </div>
                                            {p.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-2 text-gray-600">
                                                {p.address ? (
                                                    <>
                                                        <MapPin size={14} className="mt-0.5 text-gray-400 shrink-0" />
                                                        <span className="text-sm truncate max-w-[200px]" title={p.address}>{p.address}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">Sense adreça</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {p.contact_email ? (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Mail size={14} className="text-gray-400 shrink-0" />
                                                    <a href={`mailto:${p.contact_email}`} className="text-blue-600 hover:underline">{p.contact_email}</a>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs italic">Sense email</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(p)}
                                                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(p.id)}
                                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredProviders.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                            <p className="text-lg font-medium text-gray-900 mb-1">No se encontraron proveedores</p>
                                            <p>Prueba a añadir uno nuevo</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 text-xs text-gray-500 flex justify-between">
                        <span>Mostrant {filteredProviders.length} de {providers.length} proveïdors</span>
                    </div>
                </div>
            )}

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingProvider ? 'Editar Proveïdor' : 'Nou Proveïdor'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel·lar
                        </Button>
                        <Button type="submit" form="provider-form">
                            Desar
                        </Button>
                    </>
                }
            >
                <form id="provider-form" onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adreça</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                            placeholder="C/ Ejemplo 123"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contacte</label>
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
