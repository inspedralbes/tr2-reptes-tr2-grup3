import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Users,
  FileText,
  Image as ImageIcon,
  X,
} from "lucide-react";
import Modal from "../../components/common/Modal.jsx";
import Button from "../../components/ui/Button.jsx";
import studentsService from "../../services/students.service";
import client from "../../api/client";

// Helper para construir URL completa
const getFullImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;

  // Asumimos que la API está en /api y los uploads en /uploads
  // Si VITE_API_URL es http://localhost:5000/api, queremos http://localhost:5000
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const baseUrl = apiUrl.replace(/\/api\/?$/, "");

  return `${baseUrl}${path}`;
};

// Componente para visualizar/subir imagen con preview
const ImageUploadField = ({ label, currentUrl, onFileChange, newFile }) => {
  const [preview, setPreview] = useState(null);

  // Generar preview cuando cambia el archivo nuevo
  useEffect(() => {
    if (newFile) {
      const objectUrl = URL.createObjectURL(newFile);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [newFile]);

  // Si no hay archivo nuevo, mostrar URL actual
  const imageToShow = preview || currentUrl;

  return (
    <div className="border rounded p-3">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex gap-4 items-start">
        {/* Preview Area */}
        <div className="w-24 h-24 bg-gray-100 border rounded flex items-center justify-center overflow-hidden shrink-0">
          {imageToShow ? (
            <a href={imageToShow} target="_blank" rel="noopener noreferrer">
              <img
                src={imageToShow}
                alt={label}
                className="w-full h-full object-cover hover:opacity-75 transition"
              />
            </a>
          ) : (
            <ImageIcon className="text-gray-400" />
          )}
        </div>

        {/* Controls */}
        <div className="flex-1">
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            onChange={(e) => {
              if (e.target.files?.[0]) onFileChange(e.target.files[0]);
            }}
          />
          <p className="text-xs text-gray-500 mt-2">
            {currentUrl
              ? "Subir nueva para reemplazar la actual."
              : "Sube una imagen (JPEG, PNG)."}
          </p>
        </div>
      </div>
    </div>
  );
};

const StudentManager = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schoolId, setSchoolId] = useState(null);

  // Modal y formulario
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Image Viewer State
  const [viewImage, setViewImage] = useState(null);

  // Estado del formulario
  const [formData, setFormData] = useState({
    full_name: "",
    idalu: "",
  });
  // Archivos seleccionados (separado del formData para no enviar al update textual)
  const [dniFiles, setDniFiles] = useState({
    front: null,
    back: null,
  });

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
      // Intentamos usar endpoints más robustos si existieran, pero seguimos con la lógica actual
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
    setFormData({ full_name: "", idalu: "" });
    setDniFiles({ front: null, back: null });
    setShowModal(true);
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      full_name: student.full_name,
      idalu: student.idalu || "",
    });
    setDniFiles({ front: null, back: null });
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

      if (editingStudent) {
        // Update basic info
        savedStudent = await studentsService.update(editingStudent.id, {
          full_name: formData.full_name,
          idalu: formData.idalu,
        });

        // Conservar URLs anteriores si no se sube nada nuevo (el backend las devuelve, pero si subimos luego se actualizan)
        // El update devuelve el objeto actualizado, que tiene las URLs viejas aun.
      } else {
        // Create basic info
        if (!schoolId) {
          console.warn("No schoolId in front, relying on backend auto-assign.");
        }
        savedStudent = await studentsService.create({
          full_name: formData.full_name,
          idalu: formData.idalu,
          school_id: schoolId,
        });
      }

      // Handle File Uploads (for both Create and Edit)
      if (savedStudent && savedStudent.id) {
        let updatedUrls = {};

        if (dniFiles.front) {
          const res = await studentsService.uploadDocument(
            savedStudent.id,
            dniFiles.front,
            "DNI_FRONT"
          );
          updatedUrls.dni_front_url = res.fileUrl; // Asumiendo que el servicio/backend devuelve esto
        }

        if (dniFiles.back) {
          const res = await studentsService.uploadDocument(
            savedStudent.id,
            dniFiles.back,
            "DNI_BACK"
          );
          updatedUrls.dni_back_url = res.fileUrl;
        }

        // Actualizar estado local con todo (info basica + nuevas URLs)
        // Ojo: savedStudent ya trae las URLs viejas. Necesitamos mezclar.
        const finalStudent = {
          ...savedStudent,
          dni_front_url:
            updatedUrls.dni_front_url || savedStudent.dni_front_url,
          dni_back_url: updatedUrls.dni_back_url || savedStudent.dni_back_url,
        };

        if (editingStudent) {
          setStudents(
            students.map((s) => (s.id === finalStudent.id ? finalStudent : s))
          );
        } else {
          setStudents([...students, finalStudent]);
        }
      }

      setShowModal(false);
    } catch (err) {
      console.error(err);
      setError(
        "Error al guardar: " + (err.response?.data?.error || err.message)
      );
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.idalu && s.idalu.includes(searchTerm))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="text-blue-600" /> Mis Alumnos
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona la base de datos de tus estudiantes (DNI Frontal y Trasero)
          </p>
        </div>
        <Button onClick={handleCreate}>
          <div className="flex items-center gap-2">
            <Plus size={18} /> Nuevo Alumno
          </div>
        </Button>
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
          placeholder="Buscar por nombre o ID..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  ID ALU
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  DNI Frontal
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  DNI Trasero
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No se encontraron alumnos.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {student.full_name}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {student.idalu || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {student.dni_front_url ? (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 text-xs font-semibold">
                            ✓
                          </span>
                          <button
                            onClick={() =>
                              setViewImage(
                                getFullImageUrl(student.dni_front_url)
                              )
                            }
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                          >
                            <ImageIcon size={14} /> Ver
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Pendiente</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {student.dni_back_url ? (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 text-xs font-semibold">
                            ✓
                          </span>
                          <button
                            onClick={() =>
                              setViewImage(
                                getFullImageUrl(student.dni_back_url)
                              )
                            }
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                          >
                            <ImageIcon size={14} /> Ver
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Pendiente</span>
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
        )}
      </div>

      {/* Visor de Imágenes (Modal) */}
      {viewImage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setViewImage(null)}
        >
          <div
            className="relative bg-white p-2 rounded-lg shadow-2xl max-w-4xl max-h-[90vh] overflow-auto animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewImage(null)}
              className="absolute top-2 right-2 p-2 bg-gray-900/50 hover:bg-gray-900/80 text-white rounded-full transition-colors z-10"
            >
              <X size={24} />
            </button>
            <img
              src={viewImage}
              alt="Documento DNI"
              className="block w-full h-auto rounded"
            />
          </div>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingStudent ? "Editar Alumno" : "Nuevo Alumno"}
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
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre Completo
              </label>
              <input
                type="text"
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ID ALU (Opcional)
              </label>
              <input
                type="text"
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.idalu}
                onChange={(e) =>
                  setFormData({ ...formData, idalu: e.target.value })
                }
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={18} /> Documentación DNI
            </h3>
            <div className="space-y-4">
              <ImageUploadField
                label="Parte Frontal"
                currentUrl={getFullImageUrl(editingStudent?.dni_front_url)}
                newFile={dniFiles.front}
                onFileChange={(file) =>
                  setDniFiles({ ...dniFiles, front: file })
                }
              />
              <ImageUploadField
                label="Parte Trasera"
                currentUrl={getFullImageUrl(editingStudent?.dni_back_url)}
                newFile={dniFiles.back}
                onFileChange={(file) =>
                  setDniFiles({ ...dniFiles, back: file })
                }
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentManager;
