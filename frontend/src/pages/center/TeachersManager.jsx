import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Users,
  Download,
  Upload,
} from "lucide-react";
import client from "../../api/client";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/common/Modal.jsx";

const TeachersManager = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
  });

  // Exportar/Importar
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const res = await client.get("/teachers");
      setTeachers(res.data);
      setError(null);
    } catch (error) {
      console.error("Error loading teachers:", error);
      setError("Error carregant professors");
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
      setError(error.response?.data?.error || "Error guardant professor");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Estàs segur que vols eliminar aquest professor?"))
      return;
    try {
      await client.delete(`/teachers/${id}`);
      toast.success("Professor eliminat");
      loadTeachers();
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast.error("Error eliminant professor");
      setError("Error eliminant professor");
    }
  };

  // --- CSV Import / Export ---

  const handleDownloadTemplate = () => {
    const csvContent = [
      ["Nom Complet", "Email"],
      ["Joan Garcia Perez", "joan.garcia@profe.edu, EXEMPLE DE PROVA"],
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_professors.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["Nom Complet", "Email"],
      ...teachers.map((t) => [`"${t.full_name || ""}"`, `"${t.email || ""}"`]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "professors_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        // Simple CSV parser
        const lines = text
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l);
        // Skip header if present (heuristic)
        const startIndex = lines[0].toLowerCase().includes("nom") ? 1 : 0;

        const newTeachers = [];
        let errorCount = 0;

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i];
          const parts = line
            .split(",")
            .map((p) => p.replace(/^"|"$/g, "").trim());

          if (parts.length < 2) continue;

          const [full_name, email] = parts;

          if (!full_name || !email) continue;

          const teacherData = {
            full_name: full_name,
            email: email,
          };

          try {
            const created = await client.post("/teachers", teacherData);
            newTeachers.push(created.data);
          } catch (err) {
            console.error(`Error importing line ${i + 1}:`, err);
            errorCount++;
          }
        }

        toast.success(
          `S'han importat ${newTeachers.length} professors.` +
          (errorCount > 0 ? ` (${errorCount} fallits)` : "")
        );
        loadTeachers();
      } catch (err) {
        console.error("Import Error", err);
        toast.error("Error important CSV: " + err.message);
      }
      // Reset input
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      t.full_name.toLowerCase().includes(filter.toLowerCase()) ||
      t.email.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="text-blue-600" /> Gestió de Professors
          </h1>
          <p className="text-gray-500 mt-1">
            Administra l'equip docent del teu centre
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImportFile}
          />
          <Button variant="secondary" onClick={handleDownloadTemplate}>
            <div className="flex items-center gap-2">
              <Download size={18} /> Descarregar Plantilla
            </div>
          </Button>
          <Button variant="secondary" onClick={handleImportClick}>
            <div className="flex items-center gap-2">
              <Upload size={18} /> Importar CSV
            </div>
          </Button>
          <Button variant="secondary" onClick={handleExportCSV}>
            <div className="flex items-center gap-2">
              <Download size={18} /> Exportar CSV
            </div>
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <div className="flex items-center gap-2">
              <Plus size={18} /> Afegir Professor
            </div>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Cercar per nom o correu..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Correu Electrònic
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Data Alta
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                  Accions
                </th>
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
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No s'han trobat professors.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {teacher.full_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{teacher.email}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(teacher.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(teacher)}
                          className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(teacher.id)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
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
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTeacher ? "Editar Professor" : "Nou Professor"}
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel·lar
            </Button>
            <Button onClick={handleSubmit}>Guardar</Button>
          </>
        }
      >
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nom Complet
            </label>
            <input
              type="text"
              required
              className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Joan Garcia"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Correu Electrònic
            </label>
            <input
              type="email"
              required
              className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="joan@escola.cat"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeachersManager;
