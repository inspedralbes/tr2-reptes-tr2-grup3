import { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { listWorkshops, getWorkshop } from "../../api/catalog.js";
import { listEnrollmentPeriods, createRequest } from "../../api/requests.js";
import { requestService } from "../../services/request.service"; // Import updateRequest
import studentsService from "../../services/students.service";
import { AuthContext } from "../../context/AuthContext.jsx";
import client from "../../api/client";
import toast from "react-hot-toast";

/**
 * RequestWizard - Asistente de solicitud de talleres
 * Supports Creating NEW requests and EDITING existing requests.
 */
const RequestWizard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Datos del formulario
  const [periods, setPeriods] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [workshopDetails, setWorkshopDetails] = useState({});
  const [availableStudents, setAvailableStudents] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);

  // Editing State
  const [editingRequest, setEditingRequest] = useState(null);

  // Paso 1: Datos del centro
  const [formData, setFormData] = useState({
    enrollment_period_id: "",
    school_id: user?.school_id || "",
  });

  const [hasExistingRequest, setHasExistingRequest] = useState(false);
  const [existingRequestDate, setExistingRequestDate] = useState(null);

  // Paso 2: Talleres seleccionados
  const [selectedItems, setSelectedItems] = useState([]);

  // Paso 3: Preferencias por profesor
  const [teacherPreferencesMap, setTeacherPreferencesMap] = useState({});
  const [selectedTeachers, setSelectedTeachers] = useState(["", ""]);

  // Computed: Total Students
  const totalStudents = selectedItems.reduce(
    (acc, item) => acc + (item.selected_students?.length || 0),
    0
  );

  // Cargar datos iniciales
  useEffect(() => {
    if (user?.school_id) {
      loadInitialData();
    }
  }, [user]);

  // Handle Editing Mode Initialization
  useEffect(() => {
    if (
      location.state?.editingRequest &&
      workshops.length > 0 &&
      availableStudents.length > 0
    ) {
      const req = location.state.editingRequest;
      console.log("Editing Request Loaded:", req);
      setEditingRequest(req);
      setError(null); // Clear race-condition error
      setHasExistingRequest(false); // We are editing it, so valid
      setFormData({
        enrollment_period_id: req.enrollment_period_id,
        school_id: req.school_id,
      });

      // 1. Reconstruct Selected Items
      // Need to fetch workshop details for all items first to get IDs if missing
      const reconstructedItems = req.items_summary.map((item) => {
        // We need to find the WORKSHOP ID from the workshop name or edition ID
        // Ideally items_summary should have workshop_id, but if not we might need to search
        // Assuming we can find it via edition if present, or name
        // For now, let's assume we can map it if we have the catalogs loaded.
        const workshop = workshops.find((w) => w.title === item.workshop_name);

        // We also need the edition ID. The backend now sends it in preferences, but maybe not in items_summary?
        // Actually, listRequests controller didn't add workshop_edition_id to items_summary yet.
        // However, we can try to infer it or rely on what matches.
        // BETTER: Update listRequests to include workshop_id and workshop_edition_id in items_summary.
        // BUT, without that backend change, we rely on matching names/days.

        return {
          workshop_id: workshop ? workshop.id : "",
          // Warning: If multiple editions have same day/time, we might pick wrong one without ID.
          // But usually day/time is unique per workshop.
          // We will try to find the edition ID when details are loaded or if we patch backend.
          // For now, let's just store what we have and resolve IDs in a bit.
          workshop_name: item.workshop_name,
          day: item.day,
          start_time: item.start_time,

          // Prioridad and Students
          priority: item.priority,
          requested_students: item.students.length,
          selected_students: item.students.map((s) => {
            // Try to resolve student name to ID
            const studentObj = availableStudents.find(
              (as) => as.nombre_completo === s.name
            );
            return studentObj ? studentObj.id : "";
          }),
        };
      });

      // Trigger loading of workshop details for these items
      reconstructedItems.forEach((item) => {
        if (item.workshop_id) loadWorkshopDetails(item.workshop_id);
      });

      setSelectedItems(reconstructedItems);

      // 2. Reconstruct Teachers
      const teachers = [];
      if (req.request_teachers && req.request_teachers.length > 0) {
        teachers.push(req.request_teachers[0]?.id || "");
        // Find ID if only name is present? The DB stores JSON with id/name.
        if (req.request_teachers[1])
          teachers.push(req.request_teachers[1].id || "");
        else teachers.push("");
      } else {
        teachers.push("", "");
      }
      setSelectedTeachers(teachers);

      // 3. Reconstruct Preferences
      // This is tricky because preferences_summary is flat. We need to group by teacher_id/name.
      // And we need to map names back to IDs if IDs not present.
      // Fortunately listRequests DOES include teacher_name.
      const prefMap = {};
      req.preferences_summary?.forEach((p) => {
        // Find teacher ID
        const teacherObj = availableTeachers.find(
          (t) => t.full_name === p.teacher_name
        );
        if (!teacherObj) return;

        if (!prefMap[teacherObj.id]) {
          prefMap[teacherObj.id] = [
            { workshop_edition_id: "", preference_order: 1 },
            { workshop_edition_id: "", preference_order: 2 },
            { workshop_edition_id: "", preference_order: 3 },
          ];
        }
        // Fill the slot
        const slotIndex = p.preference_order - 1;
        if (slotIndex >= 0 && slotIndex < 3) {
          prefMap[teacherObj.id][slotIndex] = {
            workshop_edition_id: p.workshop_edition_id, // We added this to backend recently!
            preference_order: p.preference_order,
          };
        }
      });
      setTeacherPreferencesMap(prefMap);
    }
  }, [location.state, workshops, availableStudents, availableTeachers]);

  // Post-processing to fill edition IDs in selectedItems once workshopDetails are loaded
  useEffect(() => {
    if (editingRequest && Object.keys(workshopDetails).length > 0) {
      setSelectedItems((prevItems) =>
        prevItems.map((item) => {
          if (item.workshop_edition_id) return item; // Already has ID
          if (!item.workshop_id) return item;

          const details = workshopDetails[item.workshop_id];
          if (!details) return item;

          // Match by day/time
          const edition = details.editions?.find(
            (e) =>
              e.day_of_week === item.day && e.start_time === item.start_time
          );

          if (edition) return { ...item, workshop_edition_id: edition.id };
          return item;
        })
      );
    }
  }, [workshopDetails, editingRequest]);

  // Verificar si ya tiene solicitud (only if NOT editing)
  useEffect(() => {
    if (formData.enrollment_period_id && user?.school_id && !editingRequest) {
      checkExistingRequest(formData.enrollment_period_id);
    }
  }, [formData.enrollment_period_id, user?.school_id, editingRequest]);

  const checkExistingRequest = async (periodId) => {
    try {
      const { listRequests } = await import("../../api/requests.js");
      const myRequests = await listRequests();
      const found = myRequests.find(
        (r) => r.enrollment_period_id === periodId && r.status === "SUBMITTED"
      );

      const editingId = location.state?.editingRequest?.id;

      if (found && found.id !== editingId) {
        setHasExistingRequest(true);
        setExistingRequestDate(found.submitted_at);
        setError(
          "ATENCIÓ: Ja heu enviat una sol·licitud per a aquest període. No podeu enviar-ne més."
        );
      } else {
        setHasExistingRequest(false);
        setExistingRequestDate(null);
        setError(null);
      }
    } catch (err) {
      console.error("Error checking requests", err);
    }
  };

  const loadInitialData = async () => {
    try {
      const [periodsData, workshopsData, studentsData, teachersRes] =
        await Promise.all([
          listEnrollmentPeriods(),
          listWorkshops(),
          studentsService.getAll({ school_id: user.school_id }),
          client.get("/teachers"),
        ]);
      setPeriods(
        periodsData.filter(
          (p) => p.status === "OPEN" || p.status === "PUBLISHED"
        )
      );
      setWorkshops(workshopsData);
      setAvailableStudents(studentsData);
      setAvailableTeachers(teachersRes.data);

      if (periodsData.length > 0 && !editingRequest) {
        setFormData((prev) => ({
          ...prev,
          enrollment_period_id: periodsData[0].id,
        }));
      }
    } catch (err) {
      setError("Error al cargar datos: " + err.message);
    }
  };

  const loadWorkshopDetails = async (id) => {
    if (workshopDetails[id]) return;
    try {
      const data = await getWorkshop(id);
      setWorkshopDetails((prev) => ({ ...prev, [id]: data }));
    } catch (err) {
      console.error("Error loading workshop details:", err);
    }
  };

  const addWorkshopItem = () => {
    if (totalStudents >= 12) {
      toast.error("Has assolit el límit de 12 alumnes totals.");
      return;
    }
    setSelectedItems([
      ...selectedItems,
      {
        workshop_id: "",
        workshop_edition_id: "",
        requested_students: 1,
        selected_students: [""],
        priority: "",
      },
    ]);
  };

  const updateItem = (index, field, value) => {
    const updated = [...selectedItems];
    updated[index][field] = value;
    if (field === "workshop_id" && value) {
      loadWorkshopDetails(value);
      updated[index].workshop_edition_id = "";
    }
    setSelectedItems(updated);
  };

  const removeItem = (index) => {
    // Re-calculate priorities after removal? Or let user fix them.
    // Better to just remove.
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const isSlotOccupied = (currentItemIndex, edition) => {
    if (!edition) return false;
    return selectedItems.some((item, idx) => {
      if (idx === currentItemIndex) return false;
      return item.workshop_edition_id === edition.id;
    });
  };

  // Only init preferences map on step change if it's empty / new
  useEffect(() => {
    if (
      step === 3 &&
      Object.keys(teacherPreferencesMap).length === 0 &&
      !editingRequest
    ) {
      const map = {};
      selectedTeachers.forEach((tid) => {
        if (tid) {
          map[tid] = [
            { workshop_edition_id: "", preference_order: 1 },
            { workshop_edition_id: "", preference_order: 2 },
            { workshop_edition_id: "", preference_order: 3 },
          ];
        }
      });
      setTeacherPreferencesMap(map);
    }
  }, [step, selectedTeachers, editingRequest]);

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      setError("Debes seleccionar al menos un taller");
      return;
    }

    if (!selectedTeachers[0] || !selectedTeachers[1]) {
      setError("Debes seleccionar dos profesores acompañantes");
      return;
    }
    if (selectedTeachers[0] === selectedTeachers[1]) {
      setError("Els dos professors han de ser diferents");
      return;
    }

    const invalidItems = selectedItems.filter(
      (item) =>
        !item.workshop_edition_id ||
        item.requested_students < 1 ||
        item.requested_students > 4
    );
    if (invalidItems.length > 0) {
      setError(
        "Todos los talleres deben tener edición seleccionada y entre 1-4 alumnos"
      );
      return;
    }

    // Verify slots are filled
    for (const [index, item] of selectedItems.entries()) {
      if (!item.selected_students || item.selected_students.length === 0) {
        setError(`El taller #${index + 1} no tiene alumnos asignados.`);
        return;
      }
      const emptySlots = item.selected_students.some((s) => !s || s === "");
      if (emptySlots) {
        setError(`El taller #${index + 1} tiene alumnos sin seleccionar.`);
        return;
      }
    }

    // Final Safe Check for limit
    const total = selectedItems.reduce(
      (acc, item) => acc + (item.selected_students?.length || 0),
      0
    );
    if (total > 12) {
      setError(
        "Has superat el límit de 12 alumnes totals. Revisa la selecció."
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const request_teachers = selectedTeachers.map((id) => {
        const t = availableTeachers.find((t) => t.id === id);
        return { id: t?.id, full_name: t?.full_name };
      });

      let flatPreferences = [];
      // Only iterate over CURRENTLY SELECTED teachers to ignore stale data in the map
      selectedTeachers.forEach((teacherId) => {
        if (!teacherId) return;
        const prefs = teacherPreferencesMap[teacherId];
        if (prefs) {
          prefs.forEach((pref) => {
            if (pref.workshop_edition_id) {
              flatPreferences.push({
                teacher_id: teacherId,
                workshop_edition_id: pref.workshop_edition_id,
                preference_order: pref.preference_order,
              });
            }
          });
        }
      });

      const payload = {
        enrollment_period_id: formData.enrollment_period_id,
        school_id: formData.school_id,
        is_first_time_participation: false,
        available_for_tuesdays: true,
        items: selectedItems.map((item) => ({
          workshop_edition_id: item.workshop_edition_id,
          requested_students: parseInt(item.requested_students),
          priority: item.priority,
          student_ids: item.selected_students,
        })),
        teacher_preferences: flatPreferences,
        request_teachers,
      };

      if (editingRequest) {
        await requestService.updateRequest(editingRequest.id, payload);
      } else {
        await createRequest(payload);
      }

      setSuccess(true);
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setError("Error al enviar solicitud: " + errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card
        title={
          editingRequest ? "✅ Solicitud Actualizada" : "✅ Solicitud Enviada"
        }
      >
        <div className="text-center py-8">
          <p className="text-lg mb-4">
            {editingRequest
              ? "Tu solicitud se ha actualizado correctamente."
              : "Tu solicitud ha sido enviada correctamente."}
          </p>
          <p className="text-gray-600 mb-6">
            Recibirás las asignaciones cuando el administrador publique los
            resultados.
          </p>
          <Button onClick={() => navigate("/center/requests")}>
            Ver mis solicitudes
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between items-center mb-2">
          <span
            className={`px-3 py-1 rounded ${
              step >= 1 ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            1. Datos Centro
          </span>
          <div className="flex-1 h-1 bg-gray-200 mx-2">
            <div
              className={`h-full bg-blue-500 transition-all ${
                step >= 2 ? "w-full" : "w-0"
              }`}
            ></div>
          </div>
          <span
            className={`px-3 py-1 rounded ${
              step >= 2 ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            2. Talleres ({totalStudents}/12)
          </span>
          <div className="flex-1 h-1 bg-gray-200 mx-2">
            <div
              className={`h-full bg-blue-500 transition-all ${
                step >= 3 ? "w-full" : "w-0"
              }`}
            ></div>
          </div>
          <span
            className={`px-3 py-1 rounded ${
              step >= 3 ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            3. Preferencias
          </span>
        </div>
        {editingRequest && (
          <div className="text-sm text-blue-600 font-bold text-center">
            MODE EDICIÓ: Estàs modificant la teva sol·licitud
          </div>
        )}
      </Card>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
      )}

      {step === 1 && (
        <Card title="Paso 1: Datos del Centro">
          <div className="space-y-4">
            {hasExistingRequest && !editingRequest && (
              <div className="p-4 bg-yellow-50 text-yellow-800 rounded border border-yellow-200">
                <p className="font-bold">⚠️ Sol·licitud ja realitzada</p>
                <p>Ja heu enviat una sol·licitud per a aquest període.</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">
                Período de inscripción *
              </label>
              <select
                value={formData.enrollment_period_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    enrollment_period_id: e.target.value,
                  })
                }
                className="w-full border rounded px-3 py-2"
                required
                disabled={!!editingRequest}
              >
                <option value="">Seleccionar...</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={
                  !formData.enrollment_period_id ||
                  (hasExistingRequest && !editingRequest)
                }
              >
                Siguiente →
              </Button>
            </div>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card title="Paso 2: Selección de Talleres">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-gray-600">
                Selecciona los talleres y los alumnos.
              </p>
              <p
                className={`text-sm font-bold mt-1 ${
                  totalStudents >= 12 ? "text-red-600" : "text-blue-600"
                }`}
              >
                Total alumnes: {totalStudents}/12 (Màxim 12)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {selectedItems.map((item, index) => (
              <div key={index} className="border rounded p-3 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Taller #{index + 1}</span>
                  <button
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕ Eliminar
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm mb-1">Taller</label>
                    <select
                      value={item.workshop_id}
                      onChange={(e) =>
                        updateItem(index, "workshop_id", e.target.value)
                      }
                      className="w-full border rounded px-2 py-1"
                    >
                      <option value="">Seleccionar...</option>
                      {workshops.map((w) => {
                        const details = workshopDetails[w.id];
                        // If details loaded, check if ALL editions are occupied by OTHER items
                        let allEditionsOccupied = false;
                        if (details?.editions && details.editions.length > 0) {
                          const availableEditions = details.editions.filter(
                            (ed) => !isSlotOccupied(index, ed)
                          );
                          if (availableEditions.length === 0)
                            allEditionsOccupied = true;
                        }

                        return (
                          <option
                            key={w.id}
                            value={w.id}
                            disabled={
                              allEditionsOccupied && item.workshop_id !== w.id
                            }
                          >
                            {w.title}{" "}
                            {allEditionsOccupied && item.workshop_id !== w.id
                              ? "(Complet)"
                              : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Edición (día)</label>
                    <select
                      value={item.workshop_edition_id}
                      onChange={(e) =>
                        updateItem(index, "workshop_edition_id", e.target.value)
                      }
                      className="w-full border rounded px-2 py-1"
                      disabled={!item.workshop_id}
                    >
                      <option value="">Seleccionar...</option>
                      {workshopDetails[item.workshop_id]?.editions?.map(
                        (ed) => {
                          const isOccupied = isSlotOccupied(index, ed);
                          return (
                            <option
                              key={ed.id}
                              value={ed.id}
                              disabled={isOccupied}
                            >
                              {ed.day_of_week === "TUESDAY"
                                ? "Martes"
                                : "Jueves"}{" "}
                              {ed.start_time}-{ed.end_time}
                              {isOccupied ? " (Solapat)" : ""}
                            </option>
                          );
                        }
                      )}
                    </select>
                  </div>
                </div>

                <div className="bg-white p-3 rounded border">
                  <label className="block text-sm font-medium mb-2">
                    Alumnos ({item.selected_students?.length || 0}/4)
                  </label>
                  {item.selected_students &&
                    item.selected_students.map((studentId, sIndex) => {
                      const reservedStudentIds = new Set();

                      // Check other items
                      selectedItems.forEach((otherItem, otherIndex) => {
                        if (otherIndex === index) return;
                        otherItem.selected_students?.forEach((id) =>
                          reservedStudentIds.add(id)
                        );
                      });

                      // Check THIS item's other slots
                      item.selected_students.forEach((id, i) => {
                        if (i !== sIndex && id) reservedStudentIds.add(id);
                      });

                      return (
                        <div key={sIndex} className="flex gap-2 mb-2">
                          <select
                            value={studentId}
                            onChange={(e) => {
                              const newStudents = [
                                ...(item.selected_students || []),
                              ];
                              newStudents[sIndex] = e.target.value;
                              const updated = [...selectedItems];
                              updated[index].selected_students = newStudents;
                              updated[index].requested_students =
                                newStudents.length;
                              setSelectedItems(updated);
                            }}
                            className="flex-1 border rounded px-2 py-1 text-sm"
                          >
                            <option value="">Seleccionar alumno...</option>
                            {availableStudents.map((s) => {
                              const isReserved =
                                reservedStudentIds.has(s.id) &&
                                s.id !== studentId;
                              const hasAllChecks =
                                s.check_acuerdo_pedagogico === 1 &&
                                s.check_autorizacion_movilidad === 1 &&
                                s.check_derechos_imagen === 1;
                              const isDisabled = isReserved || !hasAllChecks;
                              let labelInfo = "";
                              if (isReserved) labelInfo = " (Seleccionat)";
                              else if (!hasAllChecks)
                                labelInfo = " (Faltan acuerdos)";

                              return (
                                <option
                                  key={s.id}
                                  value={s.id}
                                  disabled={isDisabled}
                                >
                                  {s.nombre_completo} ({s.email}){labelInfo}
                                </option>
                              );
                            })}
                          </select>
                          <button
                            onClick={() => {
                              const newStudents = item.selected_students.filter(
                                (_, i) => i !== sIndex
                              );
                              const updated = [...selectedItems];
                              updated[index].selected_students = newStudents;
                              updated[index].requested_students =
                                newStudents.length;
                              setSelectedItems(updated);
                            }}
                            className="text-red-500 font-bold px-2"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  {(!item.selected_students ||
                    item.selected_students.length < 4) && (
                    <button
                      onClick={() => {
                        const current = item.selected_students || [];
                        if (current.length < 4) {
                          if (totalStudents >= 12) {
                            toast.error(
                              "Has assolit el límit de 12 alumnes totals."
                            );
                            return;
                          }
                          const updated = [...selectedItems];
                          updated[index].selected_students = [...current, ""];
                          updated[index].requested_students =
                            updated[index].selected_students.length;
                          setSelectedItems(updated);
                        }
                      }}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      + Añadir alumno
                    </button>
                  )}
                </div>
              </div>
            ))}
            <Button
              variant="secondary"
              onClick={addWorkshopItem}
              disabled={totalStudents >= 12}
            >
              + Añadir otro taller{" "}
              {totalStudents >= 12 ? "(Límit alumnes assolit)" : ""}
            </Button>
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="secondary" onClick={() => setStep(1)}>
              ← Anterior
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={selectedItems.length === 0}
            >
              Siguiente →
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card title="Paso 3: Profesores Acompañantes y Preferencias">
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">
              1. Prioridad Global de los Talleres (Orden de importancia)
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Asigna un orden de prioridad único a cada taller solicitado (1 =
              Más importante).
            </p>
            <div className="space-y-2 bg-gray-50 p-4 rounded border">
              {selectedItems
                .map((item, index) => ({ item, index })) // Preserve original index
                .sort((a, b) => {
                  // Sort logic: assigned priority first (ascending), then unassigned
                  const pA = a.item.priority || 999;
                  const pB = b.item.priority || 999;
                  return pA - pB;
                })
                .map(({ item, index }) => {
                  const w = workshops.find((x) => x.id === item.workshop_id);
                  // Try to find edition in details, OR fallback to item properties if details not loaded yet (should be loaded for edit)
                  // If editing, we relied on item.workshop_edition_id.
                  let ed = null;
                  if (workshopDetails[item.workshop_id]?.editions) {
                    ed = workshopDetails[item.workshop_id].editions.find(
                      (e) => e.id === item.workshop_edition_id
                    );
                  } else if (editingRequest && item.day && item.start_time) {
                    // Fallback visual for editing if details somehow fail (unlikely)
                    ed = {
                      day_of_week: item.day,
                      start_time: item.start_time,
                    };
                  }

                  const day =
                    ed?.day_of_week === "TUESDAY"
                      ? "Martes"
                      : ed?.day_of_week === "THURSDAY"
                      ? "Jueves"
                      : item.day === "TUESDAY"
                      ? "Martes"
                      : "Jueves";
                  const time = ed?.start_time || item.start_time;

                  return (
                    <div
                      key={index}
                      className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0"
                    >
                      <span>
                        {w?.title || item.workshop_name} ({day} {time})
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">
                          Prioridad:
                        </label>
                        <select
                          className="border rounded px-2 py-1"
                          value={item.priority || ""}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "priority",
                              e.target.value === ""
                                ? ""
                                : parseInt(e.target.value)
                            )
                          }
                        >
                          <option value="">--</option>
                          {selectedItems.map((_, i) => {
                            const val = i + 1;
                            // Disable if selected by another item (excluding self)
                            const isTaken = selectedItems.some(
                              (otherItem, otherIdx) =>
                                otherIdx !== index && otherItem.priority === val
                            );
                            return (
                              <option key={val} value={val} disabled={isTaken}>
                                {val} {isTaken ? "(Asignado)" : ""}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          <hr className="my-6" />

          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">
              2. Profesores Acompañantes (2)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1].map((idx) => (
                <div key={idx} className="border p-3 rounded bg-gray-50">
                  <label className="block text-sm font-medium mb-1">
                    Profesor #{idx + 1}
                  </label>
                  <select
                    value={selectedTeachers[idx]}
                    onChange={(e) => {
                      const newTeachers = [...selectedTeachers];
                      newTeachers[idx] = e.target.value;
                      setSelectedTeachers(newTeachers);
                    }}
                    className="w-full border rounded px-2 py-1"
                  >
                    <option value="">Seleccionar...</option>
                    {availableTeachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            {selectedTeachers[0] &&
              selectedTeachers[1] &&
              selectedTeachers[0] === selectedTeachers[1] && (
                <p className="text-red-500 text-sm mt-1">
                  Has seleccionado el mismo profesor dos veces.
                </p>
              )}
          </div>

          {selectedTeachers[0] &&
            selectedTeachers[1] &&
            selectedTeachers[0] !== selectedTeachers[1] && (
              <div className="space-y-6">
                <hr />
                <h3 className="font-semibold text-lg">
                  3. Preferencias de Talleres por Profesor
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Indica el orden de preferencia (Top 3) para CADA profesor.
                </p>
                {selectedTeachers.map((teacherId, tIdx) => {
                  const teacher = availableTeachers.find(
                    (t) => t.id === teacherId
                  );
                  const prefs = teacherPreferencesMap[teacherId] || [];
                  return (
                    <div
                      key={tIdx}
                      className="bg-blue-50 p-4 rounded-lg border border-blue-100"
                    >
                      <h4 className="font-bold text-blue-800 mb-3">
                        Preferencias para: {teacher?.full_name}
                      </h4>
                      <div className="space-y-3">
                        {[0, 1, 2].map((prefIdx) => (
                          <div
                            key={prefIdx}
                            className="flex gap-3 items-center"
                          >
                            <span className="font-medium w-16 text-sm text-gray-600">
                              Opción {prefIdx + 1}
                            </span>
                            <select
                              value={prefs[prefIdx]?.workshop_edition_id || ""}
                              onChange={(e) => {
                                const newMap = { ...teacherPreferencesMap };
                                if (!newMap[teacherId]) newMap[teacherId] = []; // Safety init
                                newMap[teacherId][prefIdx] = {
                                  workshop_edition_id: e.target.value,
                                  preference_order: prefIdx + 1,
                                };
                                setTeacherPreferencesMap(newMap);
                              }}
                              className="flex-1 border rounded px-2 py-1 bg-white"
                            >
                              <option value="">-- Sin selección --</option>
                              {selectedItems
                                .filter((item) => item.workshop_edition_id)
                                .map((item, i) => {
                                  // Reuse visualization logic
                                  const w = workshops.find(
                                    (x) => x.id === item.workshop_id
                                  );
                                  // Prefer loaded details, fallback to item props
                                  const details =
                                    workshopDetails[item.workshop_id];
                                  const ed = details?.editions?.find(
                                    (e) => e.id === item.workshop_edition_id
                                  );

                                  // If we can't find edition in details (maybe details loading), use item properties if available
                                  const dayStr = ed?.day_of_week || item.day;
                                  const timeStr =
                                    ed?.start_time || item.start_time;

                                  const day =
                                    dayStr === "TUESDAY" ? "Martes" : "Jueves";

                                  // Exclusivity: Check if selected in other priority slot
                                  const isSelectedElsewhere = prefs.some(
                                    (p, pIdx) =>
                                      pIdx !== prefIdx &&
                                      p.workshop_edition_id ===
                                        item.workshop_edition_id
                                  );

                                  return (
                                    <option
                                      key={i}
                                      value={item.workshop_edition_id}
                                      disabled={isSelectedElsewhere}
                                    >
                                      {w?.title || item.workshop_name} ({day}{" "}
                                      {timeStr}){" "}
                                      {isSelectedElsewhere
                                        ? "(Ya seleccionado)"
                                        : ""}
                                    </option>
                                  );
                                })}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          <div className="flex justify-between mt-6">
            <Button variant="secondary" onClick={() => setStep(2)}>
              ← Anterior
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || (hasExistingRequest && !editingRequest)}
            >
              {loading
                ? "Enviando..."
                : editingRequest
                ? "✓ Actualizar Solicitud"
                : "✓ Enviar Solicitud"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
export default RequestWizard;
