import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X, Save, Search, User, Mail } from "lucide-react";
import client from "../../api/client";
import { toast } from "react-hot-toast";

const TeachersManager = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
    });

    useEffect(() => {
        loadTeachers();
    }, []);

    const loadTeachers = async () => {
        try {
            setLoading(true);
            const res = await client.get("/teachers");
            setTeachers(res.data);
        } catch (error) {
            console.error("Error loading teachers:", error);
            toast.error("Error carregant professors");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (teacher = null) => {
        if (teacher) {
            setEditingTeacher(teacher);
            setFormData({
                full_name: teacher.full_name,
                email: teacher.email,
            });
        } else {
            setEditingTeacher(null);
            setFormData({
                full_name: "",
                email: "",
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTeacher(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTeacher) {
                // Update
                await client.put(`/teachers/${editingTeacher.id}`, formData);
                toast.success("Professor actualitzat correctament");
            } else {
                // Create
                await client.post("/teachers", formData);
                toast.success("Professor creat correctament");
            }
            handleCloseModal();
            loadTeachers();
        } catch (error) {
            console.error("Error saving teacher:", error);
            toast.error(error.response?.data?.error || "Error guardant professor");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Estàs segur que vols eliminar aquest professor?")) return;
        try {
            await client.delete(`/teachers/${id}`);
            toast.success("Professor eliminat");
            loadTeachers();
        } catch (error) {
            console.error("Error deleting teacher:", error);
            toast.error("Error eliminant professor");
        }
    };

    const filteredTeachers = teachers.filter(
        (t) =>
            t.full_name.toLowerCase().includes(filter.toLowerCase()) ||
            t.email.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestió de Professors</h1>
                    <p className="text-gray-500 mt-2">Administra l'equip docent del teu centre</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    Afegir Professor
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Search Bar */}
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cercar per nom o correu..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Nom</th>
                                <th className="px-6 py-4">Correu Electrònic</th>
                                <th className="px-6 py-4">Data Alta</th>
                                <th className="px-6 py-4 text-right">Accions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-gray-500">
                                        Carregant...
                                    </td>
                                </tr>
                            ) : filteredTeachers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-gray-500">
                                        No s'han trobat professors.
                                    </td>
                                </tr>
                            ) : (
                                filteredTeachers.map((teacher) => (
                                    <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                                                {teacher.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            {teacher.full_name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{teacher.email}</td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">
                                            {new Date(teacher.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleOpenModal(teacher)}
                                                className="text-gray-400 hover:text-blue-600 transition-colors"
                                                title="Editar"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(teacher.id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingTeacher ? "Editar Professor" : "Nou Professor"}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom Complet</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Ex: Joan Garcia"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Correu Electrònic</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="joan@escola.cat"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>



                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                                >
                                    Cancel·lar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex justify-center items-center gap-2"
                                >
                                    <Save size={18} />
                                    {editingTeacher ? "Guardar Canvis" : "Crear Professor"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeachersManager;
