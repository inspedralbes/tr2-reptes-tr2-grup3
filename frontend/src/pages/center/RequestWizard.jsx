import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { listWorkshops, getWorkshop } from "../../api/catalog.js";
import { listEnrollmentPeriods, createRequest } from "../../api/requests.js";
import studentsService from "../../services/students.service";
import { AuthContext } from "../../context/AuthContext.jsx";
import client from "../../api/client";

/**
 * RequestWizard - Asistente de solicitud de talleres (3 pasos)
 * Paso 1: Datos del centro y disponibilidad
 * Paso 2: Selección de talleres y alumnos
 * Paso 3: Preferencias de profesores referentes
 */
const RequestWizard = () => {
  const navigate = useNavigate();
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

  // Paso 1: Datos del centro
  const [formData, setFormData] = useState({
    enrollment_period_id: "",
    school_id: user?.school_id || "",
    // Eliminados available_for_tuesdays y is_first_time_participation de la UI (se enviarán por defecto)
  });

  // Paso 2: Talleres seleccionados
  const [selectedItems, setSelectedItems] = useState([]);

  // Paso 3: Preferencias de profesores (Ahora solo PRIORIDADES DE TALLER)
  const [teacherPreferences, setTeacherPreferences] = useState([
    { workshop_edition_id: "", preference_order: 1 },
    { workshop_edition_id: "", preference_order: 2 },
    { workshop_edition_id: "", preference_order: 3 },
  ]);

  const [selectedTeachers, setSelectedTeachers] = useState(["", ""]);

  // Cargar datos iniciales
  useEffect(() => {
    if (user?.school_id) {
      loadInitialData();
    }
  }, [user]);

  // Auto-llenar prioridades al cambiar de paso o items seleccionados
  useEffect(() => {
    if (step === 3) {
      const validItems = selectedItems.filter((i) => i.workshop_edition_id);
      const newPrefs = [...teacherPreferences];

      if (validItems.length === 1) {
        // Caso 1: Solo 1 taller -> Prioridad 1 fija
        newPrefs[0].workshop_edition_id = validItems[0].workshop_edition_id;
        newPrefs[1].workshop_edition_id = "";
        newPrefs[2].workshop_edition_id = "";
      } else if (validItems.length === 2) {
        // Caso 2: 2 talleres -> Ponerlos en orden por defecto si están vacíos
        if (!newPrefs[0].workshop_edition_id)
          newPrefs[0].workshop_edition_id = validItems[0].workshop_edition_id;
        if (!newPrefs[1].workshop_edition_id)
          newPrefs[1].workshop_edition_id = validItems[1].workshop_edition_id;
        newPrefs[2].workshop_edition_id = "";
      } else if (validItems.length >= 3) {
        // Caso 3+: Rellenar los 3 primeros por defecto si están vacíos
        if (!newPrefs[0].workshop_edition_id)
          newPrefs[0].workshop_edition_id = validItems[0].workshop_edition_id;
        if (!newPrefs[1].workshop_edition_id)
          newPrefs[1].workshop_edition_id = validItems[1].workshop_edition_id;
        if (!newPrefs[2].workshop_edition_id)
          newPrefs[2].workshop_edition_id = validItems[2].workshop_edition_id;
      }
      setTeacherPreferences(newPrefs);
    }
  }, [step, selectedItems]);

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

      if (periodsData.length > 0) {
        setFormData((prev) => ({
          ...prev,
          enrollment_period_id: periodsData[0].id,
        }));
      }
    } catch (err) {
      setError("Error al cargar datos: " + err.message);
    }
  };

  // Cargar detalles de un taller (ediciones)
  const loadWorkshopDetails = async (id) => {
    if (workshopDetails[id]) return;
    try {
      const data = await getWorkshop(id);
      setWorkshopDetails((prev) => ({ ...prev, [id]: data }));
    } catch (err) {
      console.error("Error loading workshop details:", err);
    }
  };

  // Añadir taller a la selección
  const addWorkshopItem = () => {
    setSelectedItems([
      ...selectedItems,
      {
        workshop_id: "",
        workshop_edition_id: "",
        requested_students: 1,
        priority: selectedItems.length + 1,
      },
    ]);
  };

  // Actualizar item seleccionado
  const updateItem = (index, field, value) => {
    const updated = [...selectedItems];
    updated[index][field] = value;

    // Si cambia el workshop, cargar sus ediciones
    if (field === "workshop_id" && value) {
      loadWorkshopDetails(value);
      updated[index].workshop_edition_id = ""; // Reset edition
    }

    // Si selecciona edición, intentar preseleccionar la primera fecha disponible si no hay fecha
    if (field === "workshop_edition_id" && value) {
      // La lógica de fechas se renderiza en el select, pero podríamos setear un default aquí
      // Dejamos que el usuario elija, pero ya no hay opción "indiferente" vacía válida en UI
    }

    setSelectedItems(updated);
  };

  // Eliminar item
  const removeItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  // Enviar solicitud
  const handleSubmit = async () => {
    // Validar
    if (selectedItems.length === 0) {
      setError("Debes seleccionar al menos un taller");
      return;
    }

    if (!selectedTeachers[0] || !selectedTeachers[1]) {
      setError("Debes seleccionar dos profesores acompañantes");
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

    // Validar asignación de alumnos (No permitir huecos vacíos)
    for (const [index, item] of selectedItems.entries()) {
      if (!item.selected_students || item.selected_students.length === 0) {
        setError(`El taller #${index + 1} no tiene alumnos asignados.`);
        return;
        s;
      }
      const emptySlots = item.selected_students.some((s) => !s || s === "");
      if (emptySlots) {
        setError(
          `El taller #${
            index + 1
          } tiene alumnos sin seleccionar. Por favor, selecciona un alumno o elimina el hueco.`
        );
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Mapear IDs de profes a objetos para enviar
      const request_teachers = selectedTeachers.map((id) => {
        const t = availableTeachers.find((t) => t.id === id);
        return { id: t?.id, full_name: t?.full_name };
      });

      const payload = {
        enrollment_period_id: formData.enrollment_period_id,
        school_id: formData.school_id || "00000000-0000-0000-0000-000000000001", // placeholder
        is_first_time_participation: false, // Default
        available_for_tuesdays: true, // Default
        items: selectedItems.map((item) => ({
          workshop_edition_id: item.workshop_edition_id,
          requested_students: parseInt(item.requested_students),
          priority: item.priority,
          student_ids: item.selected_students,
        })),
        teacher_preferences: teacherPreferences
          .filter((p) => p.workshop_edition_id)
          .map((p) => ({
            workshop_edition_id: p.workshop_edition_id,
            preference_order: p.preference_order,
          })),
        request_teachers,
      };

      await createRequest(payload);
      setSuccess(true);
    } catch (err) {
      setError("Error al enviar solicitud: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Éxito
  if (success) {
    return (
      <Card title="✅ Solicitud Enviada">
        <div className="text-center py-8">
          <p className="text-lg mb-4">
            Tu solicitud ha sido enviada correctamente.
          </p>
          <p className="text-gray-600 mb-6">
            Recibirás las asignaciones cuando el administrador publique los
            resultados.
          </p>
          <Button onClick={() => navigate("/center/allocations")}>
            Ver mis asignaciones
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
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
            2. Talleres
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
      </Card>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
      )}

      {/* Paso 1: Datos del centro */}
      {step === 1 && (
        <Card title="Paso 1: Datos del Centro">
          <div className="space-y-4">
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
                disabled={!formData.enrollment_period_id}
              >
                Siguiente →
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Paso 2: Selección de talleres */}
      {step === 2 && (
        <Card title="Paso 2: Selección de Talleres">
          <p className="text-gray-600 mb-4">
            Selecciona los talleres que te interesan y los alumnos.
          </p>

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
                      {workshops.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.title}
                        </option>
                      ))}
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
                        (ed) => (
                          <option key={ed.id} value={ed.id}>
                            {ed.day_of_week === "TUESDAY" ? "Martes" : "Jueves"}{" "}
                            {ed.start_time}-{ed.end_time}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {/* Selector de alumnos nominal */}
                <div className="bg-white p-3 rounded border">
                  <label className="block text-sm font-medium mb-2">
                    Alumnos seleccionados ({item.selected_students?.length || 0}
                    /4)
                  </label>

                  {item.selected_students &&
                    item.selected_students.map((studentId, sIndex) => {
                      // Calcular estudiantes ya seleccionados en talleres coincidentes en horario
                      const currentEdition = workshopDetails[
                        item.workshop_id
                      ]?.editions?.find(
                        (e) => e.id === item.workshop_edition_id
                      );

                      const reservedStudentIds = new Set();
                      if (currentEdition) {
                        selectedItems.forEach((otherItem, otherIndex) => {
                          if (otherIndex === index) return;

                          const otherEdition = workshopDetails[
                            otherItem.workshop_id
                          ]?.editions?.find(
                            (e) => e.id === otherItem.workshop_edition_id
                          );
                          if (
                            otherEdition &&
                            otherEdition.day_of_week ===
                              currentEdition.day_of_week &&
                            otherEdition.start_time ===
                              currentEdition.start_time
                          ) {
                            otherItem.selected_students?.forEach((id) =>
                              reservedStudentIds.add(id)
                            );
                          }
                        });
                      }
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

                              // Verificar que tenga los 3 checks marcados (1 = Sí)
                              const hasAllChecks =
                                s.check_acuerdo_pedagogico === 1 &&
                                s.check_autorizacion_movilidad === 1 &&
                                s.check_derechos_imagen === 1;

                              const isDisabled = isReserved || !hasAllChecks;

                              let labelInfo = "";
                              if (isReserved)
                                labelInfo = " (Ocupado en este horario)";
                              else if (!hasAllChecks)
                                labelInfo = " (Faltan acuerdos por aprobar)";

                              return (
                                <option
                                  key={s.id}
                                  value={s.id}
                                  disabled={isDisabled}
                                >
                                  {s.nombre_completo || s.full_name} (
                                  {s.email || "Sin Email"}){labelInfo}
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
                          const updated = [...selectedItems];
                          updated[index].selected_students = [...current, ""];
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

            <Button variant="secondary" onClick={addWorkshopItem}>
              + Añadir otro taller
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

      {/* Paso 3: Profesores y Preferencias */}
      {step === 3 && (
        <Card title="Paso 3: Profesores Acompañantes y Preferencias">
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">
              1. Profesores Acompañantes (2)
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Selecciona los dos profesores que representarán al centro y
              pasarán lista.
            </p>
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
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">
              2. Preferencias de Talleres
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Indica el orden de prioridad para la asignación de plazas.
              {selectedItems.length === 1 &&
                " (Solo 1 taller seleccionado, prioridad fija)."}
            </p>
            <div className="space-y-3">
              {teacherPreferences.map((pref, index) => {
                // No mostrar prioridad 3 si hay menos de 3 talleres, etc.
                if (index >= selectedItems.length) return null;

                const isSingleItem = selectedItems.length === 1;

                return (
                  <div key={index} className="flex gap-3 items-center">
                    <span className="font-medium w-6">#{index + 1}</span>
                    <select
                      value={pref.workshop_edition_id}
                      onChange={(e) => {
                        const updated = [...teacherPreferences];
                        updated[index].workshop_edition_id = e.target.value;
                        setTeacherPreferences(updated);
                      }}
                      className="flex-1 border rounded px-2 py-1"
                      disabled={isSingleItem} // Si solo hay 1, no se edita
                    >
                      <option value="">Seleccionar taller...</option>
                      {selectedItems
                        .filter((i) => i.workshop_edition_id)
                        // Unique editions only
                        .filter(
                          (item, i, self) =>
                            i ===
                            self.findIndex(
                              (t) =>
                                t.workshop_edition_id ===
                                item.workshop_edition_id
                            )
                        )
                        .map((item, idx) => (
                          <option key={idx} value={item.workshop_edition_id}>
                            {workshops.find((w) => w.id === item.workshop_id)
                              ?.title || "Taller"}{" "}
                            (
                            {workshopDetails[item.workshop_id]?.editions?.find(
                              (e) => e.id === item.workshop_edition_id
                            )?.day_of_week === "TUESDAY"
                              ? "M"
                              : "J"}
                            )
                          </option>
                        ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="secondary" onClick={() => setStep(2)}>
              ← Anterior
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Enviando..." : "✓ Enviar Solicitud"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
export default RequestWizard;
