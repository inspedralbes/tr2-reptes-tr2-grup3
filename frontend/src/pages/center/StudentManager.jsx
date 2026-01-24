import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Users,
  Download,
  Upload,
  Camera,
  FileText,
  X,
  Check,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../../components/common/Modal.jsx";
import ConfirmModal from "../../components/common/ConfirmModal.jsx";
import ImageCropper from "../../components/common/ImageCropper.jsx";
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

  // Modal de confirmación
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    variant: "warning"
  });

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre_completo: "",
    email: "",
    curso: "3 ESO",
    nivel_absentismo: 1,
    tutor_nombre: "",
    tutor_email: "",
    tutor_telefono: "",
  });

  // Estado para guardar documentos existentes del alumno
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [savingStudent, setSavingStudent] = useState(false);

  // Estado para foto de perfil y documentos
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoBlob, setProfilePhotoBlob] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [documents, setDocuments] = useState({
    autoritzacio_imatge: null,
    autoritzacio_sortida: null,
    dni_front: null,
    dni_back: null
  });
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const docInputRef = useRef(null);

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
          setError("No s'ha trobat escola associada a aquest usuari.");
        }
      }
    } catch (err) {
      console.error(err);
      // Manejar error de fase incorrecta
      if (err.response?.status === 403 && err.response?.data?.code === 'INVALID_PHASE') {
        setError(`La gestió d'alumnes no està disponible en la fase actual. Estarà disponible quan es publiquin els resultats.`);
        return;
      } else if (err.response?.status === 400 && err.response?.data?.code === 'NO_ACTIVE_PERIOD') {
        setError("No hi ha cap període actiu en aquest moment.");
        return;
      }

      try {
        const data = await studentsService.getAll();
        setStudents(data);
      } catch (e) {
        // También manejar error de fase en el fallback
        if (e.response?.status === 403 && e.response?.data?.code === 'INVALID_PHASE') {
          setError(`La gestió d'alumnes no està disponible en la fase actual. Estarà disponible quan es publiquin els resultats.`);
        } else {
          setError("Error carregant alumnes: " + e.message);
        }
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
      tutor_nombre: "",
      tutor_email: "",
      tutor_telefono: "",
    });
    resetPhotoAndDocs();
    setProfilePhotoBlob(null);
    setExistingDocuments([]);
    setShowModal(true);
  };

  const handleEdit = async (student) => {
    setEditingStudent(student);
    setFormData({
      nombre_completo: student.nombre_completo,
      email: student.email || "",
      curso: student.curso || "3 ESO",
      nivel_absentismo: student.nivel_absentismo || 1,
      tutor_nombre: student.tutor_nombre || "",
      tutor_email: student.tutor_email || "",
      tutor_telefono: student.tutor_telefono || "",
    });
    // Cargar foto existente si la hay
    if (student.photo_url) {
      setProfilePhotoPreview(student.photo_url);
    } else {
      setProfilePhotoPreview(null);
    }
    setProfilePhoto(null);
    setDocuments({
      autoritzacio_imatge: null,
      autoritzacio_sortida: null,
      dni_front: null,
      dni_back: null
    });
    // Cargar documentos existentes
    try {
      const docs = await studentsService.getDocuments(student.id);
      setExistingDocuments(docs || []);
    } catch (e) {
      console.error("Error carregant documents:", e);
      setExistingDocuments([]);
    }
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Eliminar alumne",
      message: "Segur que vols eliminar aquest alumne? Aquesta acció no es pot desfer.",
      variant: "danger",
      onConfirm: async () => {
        try {
          await studentsService.delete(id);
          setStudents(students.filter((s) => s.id !== id));
          toast.success("Alumne eliminat correctament");
        } catch (err) {
          toast.error("Error eliminant: " + (err.response?.data?.error || err.message));
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSavingStudent(true);

    try {
      let savedStudent;

      const payload = {
        nombre_completo: formData.nombre_completo,
        email: formData.email,
        curso: formData.curso,
        nivel_absentismo: parseInt(formData.nivel_absentismo),
        tutor_nombre: formData.tutor_nombre || null,
        tutor_email: formData.tutor_email || null,
        tutor_telefono: formData.tutor_telefono || null,
      };

      if (editingStudent) {
        savedStudent = await studentsService.update(editingStudent.id, payload);
      } else {
        if (!schoolId) {
          console.warn("No schoolId in front, relying on backend auto-assign.");
        }
        savedStudent = await studentsService.create({
          ...payload,
          school_id: schoolId,
        });
      }

      const studentId = savedStudent.id;

      // Pujar foto si s'ha seleccionat una nova
      if (profilePhotoBlob) {
        try {
          const photoResult = await studentsService.uploadPhoto(studentId, profilePhotoBlob);
          savedStudent.photo_url = photoResult.photo_url;
        } catch (photoErr) {
          console.error("Error pujant foto:", photoErr);
          toast.error("L'alumne s'ha guardat però la foto no s'ha pogut pujar");
        }
      } else if (profilePhotoPreview && profilePhotoPreview.startsWith('data:')) {
        try {
          // Convertir dataURL a Blob (fallback si no hay blob explícito)
          const response = await fetch(profilePhotoPreview);
          const blob = await response.blob();
          const photoResult = await studentsService.uploadPhoto(studentId, blob);
          savedStudent.photo_url = photoResult.photo_url;
        } catch (photoErr) {
          console.error("Error pujant foto:", photoErr);
          toast.error("L'alumne s'ha guardat però la foto no s'ha pogut pujar");
        }
      }

      // Pujar documents nous
      const docTypes = {
        autoritzacio_imatge: 'AUTORITZACIO_IMATGE',
        autoritzacio_sortida: 'AUTORITZACIO_SORTIDA',
        dni_front: 'DNI_FRONT',
        dni_back: 'DNI_BACK'
      };

      for (const [key, type] of Object.entries(docTypes)) {
        if (documents[key]?.file) {
          try {
            await studentsService.uploadDocument(studentId, documents[key].file, type);
          } catch (docErr) {
            console.error(`Error pujant ${key}:`, docErr);
            toast.error(`Error pujant document: ${documents[key].name}`);
          }
        }
      }

      // Actualizar lista de estudiantes
      if (editingStudent) {
        setStudents(students.map((s) => (s.id === savedStudent.id ? savedStudent : s)));
      } else {
        setStudents([...students, savedStudent]);
      }

      toast.success(editingStudent ? "Alumne actualitzat correctament" : "Alumne creat correctament");
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Error desant: " + (err.response?.data?.error || err.message));
    } finally {
      setSavingStudent(false);
    }
  };

  // --- Gestió de foto de perfil ---
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Només es permeten imatges");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imatge no pot superar 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfilePhoto(ev.target.result);
        setShowImageCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCroppedImage = (blob, croppedDataUrl) => {
    setProfilePhotoBlob(blob);
    setProfilePhotoPreview(croppedDataUrl);
    setShowImageCropper(false);
    toast.success("Foto retallada correctament");
  };

  // --- Gestió de documents ---
  const handleDocumentUpload = (docType) => {
    setUploadingDoc(docType);
    docInputRef.current?.click();
  };

  const handleDocumentFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && uploadingDoc) {
      // Validar tipus de fitxer
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Només es permeten fitxers PDF o imatges (JPG, PNG)");
        setUploadingDoc(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("El fitxer no pot superar 10MB");
        setUploadingDoc(null);
        return;
      }
      setDocuments(prev => ({
        ...prev,
        [uploadingDoc]: {
          file,
          name: file.name,
          type: file.type
        }
      }));
      toast.success(`Document "${file.name}" carregat`);
      setUploadingDoc(null);
    }
    e.target.value = '';
  };

  const removeDocument = (docType) => {
    setDocuments(prev => ({
      ...prev,
      [docType]: null
    }));
    toast.success("Document eliminat");
  };

  const resetPhotoAndDocs = () => {
    setProfilePhoto(null);
    setProfilePhotoBlob(null);
    setProfilePhotoPreview(null);
    setDocuments({
      autoritzacio_imatge: null,
      autoritzacio_sortida: null,
      dni_front: null,
      dni_back: null
    });
  };

  // --- CSV Import / Export ---

  const handleDownloadTemplate = () => {
    const csvContent = [
      [
        "Nom Complet",
        "Email",
        "Curs",
        "Nivell Absentisme (1-5)",
        "Acord Pedagogic",
        "Autoritzacio Movilitat",
        "Drets Imatge",
      ],
      // Fila de ejemplo para guiar al coordinador
      [
        "Joan Perez Garcia",
        "joan.perez@alumne.edu",
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
    link.setAttribute("download", "plantilla_alumnes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const csvContent = [
      [
        "Nom Complet",
        "Email",
        "Curs",
        "Nivell Absentisme (1-5)",
        "Acord Pedagogic",
        "Autoritzacio Movilitat",
        "Drets Imatge",
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
    link.setAttribute("download", "alumnes_export.csv");
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
        toast.success(`S'han importat ${newStudents.length} alumnes correctament.`);
      } catch (err) {
        console.error("Import Error", err);
        toast.error("Error important CSV: " + err.message);
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
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="text-blue-600" size={24} /> Els meus alumnes
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gestiona el teu llistat d'alumnes
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
          <Button onClick={handleCreate} className="text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-2">
              <Plus size={16} /> Nou
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
          placeholder="Cerca per nom o correu..."
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Alumne
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Curs
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    Absentisme
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    Docs
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                    Accions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No s'han trobat alumnes.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                            {student.photo_url ? (
                              <img
                                src={student.photo_url?.startsWith('http') ? student.photo_url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${student.photo_url}`}
                                alt={student.nombre_completo}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                                {student.nombre_completo?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-gray-900">
                            {student.nombre_completo}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {student.email || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {student.curso || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.nivel_absentismo >= 4
                            ? "bg-red-100 text-red-800"
                            : student.nivel_absentismo >= 3
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                            }`}
                        >
                          {student.nivel_absentismo || 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <FileText size={18} className="inline text-gray-400" />
                      </td>
                      <td className="px-4 py-3 text-right">
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
        onClose={() => !savingStudent && setShowModal(false)}
        title={editingStudent ? "Editar Alumne" : "Nou Alumne"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={savingStudent}>
              Cancel·lar
            </Button>
            <Button onClick={handleSave} disabled={savingStudent}>
              {savingStudent ? "Desant..." : "Desar"}
            </Button>
          </>
        }
      >
        <form className="space-y-6">
          {/* Secció de foto de perfil */}
          <div className="flex flex-col items-center pb-4 border-b">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-gray-200">
                {profilePhotoPreview ? (
                  <img
                    src={profilePhotoPreview}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Camera size={40} />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                <Camera size={18} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Fes clic a la icona per pujar una foto
            </p>
          </div>

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
                placeholder="alumne@exemple.com"
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

          {/* Secció de dades del tutor/responsable */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Users size={18} className="text-purple-600" />
              Dades del Tutor/Responsable
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Es notificarà al tutor per email en cas d'absència de l'alumne.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nom complet del tutor
                </label>
                <input
                  type="text"
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.tutor_nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, tutor_nombre: e.target.value })
                  }
                  placeholder="Nom i cognoms del tutor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email del tutor
                </label>
                <input
                  type="email"
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.tutor_email}
                  onChange={(e) =>
                    setFormData({ ...formData, tutor_email: e.target.value })
                  }
                  placeholder="tutor@exemple.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Telèfon del tutor
                </label>
                <input
                  type="tel"
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.tutor_telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, tutor_telefono: e.target.value })
                  }
                  placeholder="600 000 000"
                />
              </div>
            </div>
          </div>

          {/* Secció de documentació adjunta */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              Documents Adjunts
            </h3>
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png"
              ref={docInputRef}
              className="hidden"
              onChange={handleDocumentFileSelect}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Autorització Imatge */}
              <div className={`border-2 rounded-lg p-3 transition-all ${documents.autoritzacio_imatge || existingDocuments.some(d => d.document_type === 'AUTORITZACIO_IMATGE')
                ? 'bg-green-50 border-green-300'
                : 'bg-gray-50 border-gray-200'
                }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {documents.autoritzacio_imatge || existingDocuments.some(d => d.document_type === 'AUTORITZACIO_IMATGE') ? (
                      <Check size={18} className="text-green-600" />
                    ) : (
                      <FileText size={18} className="text-gray-400" />
                    )}
                    <p className={`text-sm font-medium ${documents.autoritzacio_imatge || existingDocuments.some(d => d.document_type === 'AUTORITZACIO_IMATGE')
                      ? 'text-green-700'
                      : 'text-gray-700'
                      }`}>Autorització Imatge</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => documents.autoritzacio_imatge ? removeDocument('autoritzacio_imatge') : handleDocumentUpload('autoritzacio_imatge')}
                    className={`p-1.5 rounded transition-colors ${documents.autoritzacio_imatge || existingDocuments.some(d => d.document_type === 'AUTORITZACIO_IMATGE')
                      ? 'text-green-600 hover:bg-green-100'
                      : 'text-blue-600 hover:bg-blue-50'
                      }`}
                  >
                    {documents.autoritzacio_imatge ? <Edit size={16} /> : <Upload size={16} />}
                  </button>
                </div>
              </div>

              {/* Autorització Sortida */}
              <div className={`border-2 rounded-lg p-3 transition-all ${documents.autoritzacio_sortida || existingDocuments.some(d => d.document_type === 'AUTORITZACIO_SORTIDA')
                ? 'bg-green-50 border-green-300'
                : 'bg-gray-50 border-gray-200'
                }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {documents.autoritzacio_sortida || existingDocuments.some(d => d.document_type === 'AUTORITZACIO_SORTIDA') ? (
                      <Check size={18} className="text-green-600" />
                    ) : (
                      <FileText size={18} className="text-gray-400" />
                    )}
                    <p className={`text-sm font-medium ${documents.autoritzacio_sortida || existingDocuments.some(d => d.document_type === 'AUTORITZACIO_SORTIDA')
                      ? 'text-green-700'
                      : 'text-gray-700'
                      }`}>Autorització Sortida</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => documents.autoritzacio_sortida ? removeDocument('autoritzacio_sortida') : handleDocumentUpload('autoritzacio_sortida')}
                    className={`p-1.5 rounded transition-colors ${documents.autoritzacio_sortida || existingDocuments.some(d => d.document_type === 'AUTORITZACIO_SORTIDA')
                      ? 'text-green-600 hover:bg-green-100'
                      : 'text-blue-600 hover:bg-blue-50'
                      }`}
                  >
                    {documents.autoritzacio_sortida ? <Edit size={16} /> : <Upload size={16} />}
                  </button>
                </div>
              </div>

              {/* DNI Frontal */}
              <div className={`border-2 rounded-lg p-3 transition-all ${documents.dni_front || existingDocuments.some(d => d.document_type === 'DNI_FRONT')
                ? 'bg-green-50 border-green-300'
                : 'bg-gray-50 border-gray-200'
                }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {documents.dni_front || existingDocuments.some(d => d.document_type === 'DNI_FRONT') ? (
                      <Check size={18} className="text-green-600" />
                    ) : (
                      <FileText size={18} className="text-gray-400" />
                    )}
                    <p className={`text-sm font-medium ${documents.dni_front || existingDocuments.some(d => d.document_type === 'DNI_FRONT')
                      ? 'text-green-700'
                      : 'text-gray-700'
                      }`}>DNI Frontal</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => documents.dni_front ? removeDocument('dni_front') : handleDocumentUpload('dni_front')}
                    className={`p-1.5 rounded transition-colors ${documents.dni_front || existingDocuments.some(d => d.document_type === 'DNI_FRONT')
                      ? 'text-green-600 hover:bg-green-100'
                      : 'text-blue-600 hover:bg-blue-50'
                      }`}
                  >
                    {documents.dni_front ? <Edit size={16} /> : <Upload size={16} />}
                  </button>
                </div>
              </div>

              {/* DNI Posterior */}
              <div className={`border-2 rounded-lg p-3 transition-all ${documents.dni_back || existingDocuments.some(d => d.document_type === 'DNI_BACK')
                ? 'bg-green-50 border-green-300'
                : 'bg-gray-50 border-gray-200'
                }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {documents.dni_back || existingDocuments.some(d => d.document_type === 'DNI_BACK') ? (
                      <Check size={18} className="text-green-600" />
                    ) : (
                      <FileText size={18} className="text-gray-400" />
                    )}
                    <p className={`text-sm font-medium ${documents.dni_back || existingDocuments.some(d => d.document_type === 'DNI_BACK')
                      ? 'text-green-700'
                      : 'text-gray-700'
                      }`}>DNI Posterior</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => documents.dni_back ? removeDocument('dni_back') : handleDocumentUpload('dni_back')}
                    className={`p-1.5 rounded transition-colors ${documents.dni_back || existingDocuments.some(d => d.document_type === 'DNI_BACK')
                      ? 'text-green-600 hover:bg-green-100'
                      : 'text-blue-600 hover:bg-blue-50'
                      }`}
                  >
                    {documents.dni_back ? <Edit size={16} /> : <Upload size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal del cropper d'imatge */}
      {showImageCropper && profilePhoto && (
        <ImageCropper
          isOpen={true}
          image={profilePhoto}
          onCropComplete={handleCroppedImage}
          onClose={() => {
            setShowImageCropper(false);
            setProfilePhoto(null);
          }}
          aspectRatio={1}
        />
      )}

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText="Eliminar"
        cancelText="Cancel·lar"
      />
    </div>
  );
};

export default StudentManager;
