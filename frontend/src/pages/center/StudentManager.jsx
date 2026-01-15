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
import Modal from "../../components/common/Modal.jsx";
import Button from "../../components/ui/Button.jsx";
import studentsService from "../../services/students.service";
import client from "../../api/client";

const StudentManager = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schoolId, setSchoolId] = useState(null);

  // Modal y formulario
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre_completo: "",
    email: "",
    curso: "3 ESO",
    nivel_absentismo: 1,
    check_acuerdo_pedagogico: false,
    check_autorizacion_movilidad: false,
    check_derechos_imagen: false,
  });

  // Exportar/Importar
  const fileInputRef = useRef(null);

  // Filtro
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadSchoolAndStudents();
  }, []);

  const loadSchoolAndStudents = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem("enginy_user");
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user) throw new Error("No estás logueado");

      // Obtener escuela
      const schoolsRes = await client.get("/centers");
      const mySchool = schoolsRes.data.find(
        (s) => s.coordinator_user_id === user.id
      );

      if (mySchool) {
        setSchoolId(mySchool.id);
        const data = await studentsService.getAll({ school_id: mySchool.id });
        setStudents(data);
      } else {
        if (user.role === "ADMIN") {
          const data = await studentsService.getAll();
          setStudents(data);
        } else {
          setError("No se encontró escuela asociada a este usuario.");
        }
      }
    } catch (err) {
      console.error(err);
      try {
        const data = await studentsService.getAll();
        setStudents(data);
      } catch (e) {
        setError("Error cargando alumnos: " + e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingStudent(null);
    setFormData({
      nombre_completo: "",
      email: "",
      curso: "3 ESO",
      nivel_absentismo: 1,
      check_acuerdo_pedagogico: false,
      check_autorizacion_movilidad: false,
      check_derechos_imagen: false,
    });
    setShowModal(true);
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      nombre_completo: student.nombre_completo,
      email: student.email || "",
      curso: student.curso || "3 ESO",
      nivel_absentismo: student.nivel_absentismo || 1,
      check_acuerdo_pedagogico: !!student.check_acuerdo_pedagogico,
      check_autorizacion_movilidad: !!student.check_autorizacion_movilidad,
      check_derechos_imagen: !!student.check_derechos_imagen,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este alumno?")) return;
    try {
      await studentsService.delete(id);
      setStudents(students.filter((s) => s.id !== id));
    } catch (err) {
      alert("Error al eliminar: " + (err.response?.data?.error || err.message));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let savedStudent;

      const payload = {
        nombre_completo: formData.nombre_completo,
        email: formData.email,
        curso: formData.curso,
        nivel_absentismo: parseInt(formData.nivel_absentismo),
        check_acuerdo_pedagogico: formData.check_acuerdo_pedagogico ? 1 : 0,
        check_autorizacion_movilidad: formData.check_autorizacion_movilidad
          ? 1
          : 0,
        check_derechos_imagen: formData.check_derechos_imagen ? 1 : 0,
      };

      if (editingStudent) {
        savedStudent = await studentsService.update(editingStudent.id, payload);
        setStudents(
          students.map((s) => (s.id === savedStudent.id ? savedStudent : s))
        );
      } else {
        if (!schoolId) {
          console.warn("No schoolId in front, relying on backend auto-assign.");
        }
        savedStudent = await studentsService.create({
          ...payload,
          school_id: schoolId,
        });
        setStudents([...students, savedStudent]);
      }

      setShowModal(false);
    } catch (err) {
      console.error(err);
      setError(
        "Error al guardar: " + (err.response?.data?.error || err.message)
      );
    }
  };

  // --- CSV Import / Export ---

  const handleDownloadTemplate = () => {
    const csvContent = [
      [
        "Nombre Completo",
        "Email",
        "Curso",
        "Nivel Absentismo (1-5)",
        "Acuerdo Pedagogico",
        "Autorizacion Movilidad",
        "Derechos Imagen",
      ],
      // Fila de ejemplo para guiar al coordinador
      [
        "Juan Pérez García",
        "juan.perez@alumno.edu",
        "3 ESO",
        "1",
        "1",
        "1",
        "0",
        "EXEMPLE DE PROVA, ELIMINAR UN COP FACIS LA MODIFICACIÓ",
      ],
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_alumnos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const csvContent = [
      [
        "Nombre Completo",
        "Email",
        "Curso",
        "Nivel Absentismo (1-5)",
        "Acuerdo Pedagogico",
        "Autorizacion Movilidad",
        "Derechos Imagen",
      ],
      ...students.map((s) => [
        `"${s.nombre_completo || ""}"`,
        `"${s.email || ""}"`,
        `"${s.curso || "3 ESO"}"`,
        s.nivel_absentismo || 1,
        s.check_acuerdo_pedagogico ? 1 : 0,
        s.check_autorizacion_movilidad ? 1 : 0,
        s.check_derechos_imagen ? 1 : 0,
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "alumnos_export.csv");
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
        const startIndex = lines[0].toLowerCase().includes("nombre") ? 1 : 0;

        // Process sequentially to avoid Backend overload or use a bulk endpoint if available
        // For now, client-side loop is safer without backend changes
        const newStudents = [];

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i];
          // Handle quotes basically
          const parts = line
            .split(",")
            .map((p) => p.replace(/^"|"$/g, "").trim());

          if (parts.length < 1) continue;

          const [nombre, email, curso, abs, acuerdo, movil, imagen] = parts;

          if (!nombre || !email) continue;

          const studentData = {
            nombre_completo: nombre,
            email: email,
            curso: curso || "3 ESO",
            nivel_absentismo: abs ? parseInt(abs) : 1,
            check_acuerdo_pedagogico: acuerdo == "1" ? 1 : 0,
            check_autorizacion_movilidad: movil == "1" ? 1 : 0,
            check_derechos_imagen: imagen == "1" ? 1 : 0,
            school_id: schoolId,
          };

          // Create one by one
          const created = await studentsService.create(studentData);
          newStudents.push(created);
        }

        setStudents([...students, ...newStudents]);
        alert(`Se han importado ${newStudents.length} alumnos correctamente.`);
      } catch (err) {
        console.error("Import Error", err);
        alert("Error importando CSV: " + err.message);
      }
      // Reset input
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const filteredStudents = students.filter(
    (s) =>
      (s.nombre_completo &&
        s.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="text-blue-600" /> Els meus alumnes
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona el teu llistat d'alumnes
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
          <Button onClick={handleCreate}>
            <div className="flex items-center gap-2">
              <Plus size={18} /> Nou alumne
            </div>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
          {error}
        </div>
      )}

      {/* Buscador */}
      <div className="mb-6 relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregant...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Nom complet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Curs
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    Absentisme
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    Acord Pedagògic
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    Autorització Movilitat
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    Dret d'Imatge
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                    Accions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No s'han trobat alumnes.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {student.nombre_completo}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {student.email || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {student.curso || "-"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            student.nivel_absentismo >= 4
                              ? "bg-red-100 text-red-800"
                              : student.nivel_absentismo >= 3
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {student.nivel_absentismo || 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {student.check_acuerdo_pedagogico ? (
                          <span className="text-green-600">Sí</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {student.check_autorizacion_movilidad ? (
                          <span className="text-green-600">Sí</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {student.check_derechos_imagen ? (
                          <span className="text-green-600">Sí</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(student)}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
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
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingStudent ? "Editar Alumne" : "Nou Alumne"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Guardar</Button>
          </>
        }
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Nom Complet
              </label>
              <input
                type="text"
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.nombre_completo}
                onChange={(e) =>
                  setFormData({ ...formData, nombre_completo: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email de l'alumne
              </label>
              <input
                type="email"
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                placeholder="alumno@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Curs
              </label>
              <select
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.curso}
                onChange={(e) =>
                  setFormData({ ...formData, curso: e.target.value })
                }
              >
                <option value="3 ESO">3 ESO</option>
                <option value="4 ESO">4 ESO</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nivell d'Absentisme (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.nivel_absentismo}
                onChange={(e) =>
                  setFormData({ ...formData, nivel_absentismo: e.target.value })
                }
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-4">
              Documentació i Permisos
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-blue-600 focus:ring-blue-500 h-5 w-5"
                  checked={formData.check_acuerdo_pedagogico}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      check_acuerdo_pedagogico: e.target.checked,
                    })
                  }
                />
                <span className="text-gray-700">Acord Pedagògic Firmat</span>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-blue-600 focus:ring-blue-500 h-5 w-5"
                  checked={formData.check_autorizacion_movilidad}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      check_autorizacion_movilidad: e.target.checked,
                    })
                  }
                />
                <span className="text-gray-700">Autorització de Movilitat</span>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-blue-600 focus:ring-blue-500 h-5 w-5"
                  checked={formData.check_derechos_imagen}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      check_derechos_imagen: e.target.checked,
                    })
                  }
                />
                <span className="text-gray-700">Drets d'Imatge</span>
              </label>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentManager;
