import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Users,
  Download,
  Upload,
  Mail,
} from "lucide-react";
import client from "../../api/client";
import toast from "react-hot-toast";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import ConfirmModal from "../../components/common/ConfirmModal.jsx";

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
    phone_number: "",
  });

  // Modal de confirmación
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    variant: "warning"
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
        phone_number: teacher.phone_number || "",
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        full_name: "",
        email: "",
        phone_number: "",
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
    setConfirmModal({
      isOpen: true,
      title: "Eliminar professor",
      message: "Estàs segur que vols eliminar aquest professor? Aquesta acció no es pot desfer.",
      variant: "danger",
      onConfirm: async () => {
        try {
          await client.delete(`/teachers/${id}`);
          toast.success("Professor eliminat");
          loadTeachers();
        } catch (error) {
          console.error("Error deleting teacher:", error);
          toast.error("Error eliminant professor");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSendCredentials = async (teacher) => {
    setConfirmModal({
      isOpen: true,
      title: "Enviar credencials",
      message: `Vols enviar les credencials d'accés a ${teacher.full_name}?`,
      variant: "info",
      onConfirm: async () => {
        try {
          await client.post(`/teachers/${teacher.id}/send-credentials`);
          toast.success("Credencials enviades correctament");
        } catch (error) {
          console.error("Error sending credentials:", error);
          toast.error(error.response?.data?.error || "Error enviant credencials");
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // --- CSV Import / Export ---

  const handleDownloadTemplate = () => {
    const csvContent = [
      ["Nom Complet", "Email", "Telèfon"],
      ["Joan Garcia Perez", "joan.garcia@profe.edu", "666777888"],
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
      ["Nom Complet", "Email", "Telèfon"],
      ...teachers.map((t) => [
        `"${t.full_name || ""}"`,
        `"${t.email || ""}"`,
        `"${t.phone_number || ""}"`,
      ]),
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

          // Assumes order: Name, Email, Phone (optional)
          const full_name = parts[0];
          const email = parts[1];
          const phone_number = parts[2] || "";

          if (!full_name || !email) continue;

          const teacherData = {
            full_name: full_name,
            email: email,
            phone_number: phone_number,
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
      t.email.toLowerCase().includes(filter.toLowerCase()) ||
      (t.phone_number && t.phone_number.includes(filter))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="text-blue-600" size={24} /> Gestió de Professors
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Administra l'equip docent del teu centre
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImportFile}
          />
          <Button variant="secondary" onClick={handleDownloadTemplate} className="text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-2">
              <Download size={16} /> <span className="hidden sm:inline">Plantilla</span>
            </div>
          </Button>
          <Button variant="secondary" onClick={handleImportClick} className="text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-2">
              <Upload size={16} /> <span className="hidden sm:inline">Importar</span>
            </div>
          </Button>
          <Button variant="secondary" onClick={handleExportCSV} className="text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-2">
              <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
            </div>
          </Button>
          <Button onClick={() => handleOpenModal()} className="text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-2">
              <Plus size={16} /> Afegir
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
          placeholder="Cercar per nom, correu o telèfon..."
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
                  Telèfon
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
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    Carregant...
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
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
                    <td className="px-6 py-4 text-gray-600">
                      {teacher.phone_number || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(teacher.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleSendCredentials(teacher)}
                          title="Enviar credencials"
                          className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition-colors"
                        >
                          <Mail size={18} />
                        </button>
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

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Telèfon
            </label>
            <input
              type="tel"
              className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: 666777888"
              value={formData.phone_number || ""}
              onChange={(e) =>
                setFormData({ ...formData, phone_number: e.target.value })
              }
            />
          </div>
        </form>
      </Modal>

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText={confirmModal.variant === "danger" ? "Eliminar" : "Enviar"}
        cancelText="Cancel·lar"
      />
    </div>
  );
};

export default TeachersManager;
