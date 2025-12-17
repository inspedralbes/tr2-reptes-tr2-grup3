import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { listWorkshops, getWorkshop } from "../../api/catalog.js";
import { listEnrollmentPeriods, createRequest } from "../../api/requests.js";
import { AuthContext } from "../../context/AuthContext.jsx";

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

  // Paso 1: Datos del centro
  const [formData, setFormData] = useState({
    enrollment_period_id: '',
    school_id: user?.school_id || '',
    is_first_time_participation: false,
    available_for_tuesdays: true,
  });

  // Paso 2: Talleres seleccionados
  const [selectedItems, setSelectedItems] = useState([]);

  // Paso 3: Preferencias de profesores
  const [teacherPreferences, setTeacherPreferences] = useState([
    { workshop_edition_id: '', preference_order: 1 },
  ]);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [periodsData, workshopsData] = await Promise.all([
        listEnrollmentPeriods(),
        listWorkshops()
      ]);
      setPeriods(periodsData.filter(p => p.status === 'OPEN' || p.status === 'PUBLISHED'));
      setWorkshops(workshopsData);
      
      if (periodsData.length > 0) {
        setFormData(prev => ({ ...prev, enrollment_period_id: periodsData[0].id }));
      }
    } catch (err) {
      setError('Error al cargar datos: ' + err.message);
    }
  };

  // Cargar detalles de un taller (ediciones)
  const loadWorkshopDetails = async (id) => {
    if (workshopDetails[id]) return;
    try {
      const data = await getWorkshop(id);
      setWorkshopDetails(prev => ({ ...prev, [id]: data }));
    } catch (err) {
      console.error('Error loading workshop details:', err);
    }
  };

  // Añadir taller a la selección
  const addWorkshopItem = () => {
    setSelectedItems([...selectedItems, {
      workshop_id: '',
      workshop_edition_id: '',
      requested_students: 1,
      priority: selectedItems.length + 1,
    }]);
  };

  // Actualizar item seleccionado
  const updateItem = (index, field, value) => {
    const updated = [...selectedItems];
    updated[index][field] = value;
    
    // Si cambia el workshop, cargar sus ediciones
    if (field === 'workshop_id' && value) {
      loadWorkshopDetails(value);
      updated[index].workshop_edition_id = ''; // Reset edition
    }
    
    setSelectedItems(updated);
  };

  // Eliminar item
  const removeItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  // Añadir preferencia de profesor
  const addTeacherPreference = () => {
    if (teacherPreferences.length >= 3) return;
    setTeacherPreferences([...teacherPreferences, {
      workshop_edition_id: '',
      preference_order: teacherPreferences.length + 1,
    }]);
  };

  // Enviar solicitud
  const handleSubmit = async () => {
    // Validar
    if (selectedItems.length === 0) {
      setError('Debes seleccionar al menos un taller');
      return;
    }

    const invalidItems = selectedItems.filter(
      item => !item.workshop_edition_id || item.requested_students < 1 || item.requested_students > 4
    );
    if (invalidItems.length > 0) {
      setError('Todos los talleres deben tener una edición seleccionada y entre 1-4 alumnos');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        enrollment_period_id: formData.enrollment_period_id,
        school_id: formData.school_id || '00000000-0000-0000-0000-000000000001', // placeholder
        is_first_time_participation: formData.is_first_time_participation,
        available_for_tuesdays: formData.available_for_tuesdays,
        items: selectedItems.map(item => ({
          workshop_edition_id: item.workshop_edition_id,
          requested_students: parseInt(item.requested_students),
          priority: item.priority,
        })),
        teacher_preferences: teacherPreferences
          .filter(p => p.workshop_edition_id)
          .map(p => ({
            workshop_edition_id: p.workshop_edition_id,
            preference_order: p.preference_order,
          })),
      };

      await createRequest(payload);
      setSuccess(true);
    } catch (err) {
      setError('Error al enviar solicitud: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Éxito
  if (success) {
    return (
      <Card title="✅ Solicitud Enviada">
        <div className="text-center py-8">
          <p className="text-lg mb-4">Tu solicitud ha sido enviada correctamente.</p>
          <p className="text-gray-600 mb-6">
            Recibirás las asignaciones cuando el administrador publique los resultados.
          </p>
          <Button onClick={() => navigate('/center/allocations')}>
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
          <span className={`px-3 py-1 rounded ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            1. Datos Centro
          </span>
          <div className="flex-1 h-1 bg-gray-200 mx-2">
            <div className={`h-full bg-blue-500 transition-all ${step >= 2 ? 'w-full' : 'w-0'}`}></div>
          </div>
          <span className={`px-3 py-1 rounded ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            2. Talleres
          </span>
          <div className="flex-1 h-1 bg-gray-200 mx-2">
            <div className={`h-full bg-blue-500 transition-all ${step >= 3 ? 'w-full' : 'w-0'}`}></div>
          </div>
          <span className={`px-3 py-1 rounded ${step >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
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
              <label className="block text-sm font-medium mb-1">Período de inscripción *</label>
              <select
                value={formData.enrollment_period_id}
                onChange={(e) => setFormData({...formData, enrollment_period_id: e.target.value})}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Seleccionar...</option>
                {periods.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="first_time"
                checked={formData.is_first_time_participation}
                onChange={(e) => setFormData({...formData, is_first_time_participation: e.target.checked})}
              />
              <label htmlFor="first_time">Es la primera vez que participamos en Enginy</label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="tuesdays"
                checked={formData.available_for_tuesdays}
                onChange={(e) => setFormData({...formData, available_for_tuesdays: e.target.checked})}
              />
              <label htmlFor="tuesdays">Podemos participar los martes</label>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!formData.enrollment_period_id}>
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
            Selecciona los talleres que te interesan y el número de alumnos (máximo 4 por taller).
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm mb-1">Taller</label>
                    <select
                      value={item.workshop_id}
                      onChange={(e) => updateItem(index, 'workshop_id', e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    >
                      <option value="">Seleccionar...</option>
                      {workshops.map(w => (
                        <option key={w.id} value={w.id}>{w.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Edición (día)</label>
                    <select
                      value={item.workshop_edition_id}
                      onChange={(e) => updateItem(index, 'workshop_edition_id', e.target.value)}
                      className="w-full border rounded px-2 py-1"
                      disabled={!item.workshop_id}
                    >
                      <option value="">Seleccionar...</option>
                      {workshopDetails[item.workshop_id]?.editions?.map(ed => (
                        <option key={ed.id} value={ed.id}>
                          {ed.day_of_week === 'TUESDAY' ? 'Martes' : 'Jueves'} {ed.start_time}-{ed.end_time}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Nº Alumnos (1-4)</label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={item.requested_students}
                      onChange={(e) => updateItem(index, 'requested_students', e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </div>
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
            <Button onClick={() => setStep(3)} disabled={selectedItems.length === 0}>
              Siguiente →
            </Button>
          </div>
        </Card>
      )}

      {/* Paso 3: Preferencias */}
      {step === 3 && (
        <Card title="Paso 3: Profesores Referentes (Opcional)">
          <p className="text-gray-600 mb-4">
            Si tienes profesores que quieren ser referentes de algún taller, indícalos aquí (máximo 3).
          </p>

          <div className="space-y-3">
            {teacherPreferences.map((pref, index) => (
              <div key={index} className="flex gap-3 items-center">
                <span className="font-medium">#{index + 1}</span>
                <select
                  value={pref.workshop_edition_id}
                  onChange={(e) => {
                    const updated = [...teacherPreferences];
                    updated[index].workshop_edition_id = e.target.value;
                    setTeacherPreferences(updated);
                  }}
                  className="flex-1 border rounded px-2 py-1"
                >
                  <option value="">Seleccionar taller...</option>
                  {selectedItems.filter(i => i.workshop_edition_id).map((item, idx) => (
                    <option key={idx} value={item.workshop_edition_id}>
                      {workshops.find(w => w.id === item.workshop_id)?.title || 'Taller'}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {teacherPreferences.length < 3 && (
              <Button variant="secondary" onClick={addTeacherPreference}>
                + Añadir preferencia
              </Button>
            )}
          </div>

          {/* Resumen */}
          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h4 className="font-semibold mb-2">Resumen de la solicitud:</h4>
            <ul className="text-sm space-y-1">
              <li>• Talleres seleccionados: {selectedItems.length}</li>
              <li>• Total alumnos: {selectedItems.reduce((sum, i) => sum + parseInt(i.requested_students || 0), 0)}</li>
              <li>• Disponible martes: {formData.available_for_tuesdays ? 'Sí' : 'No'}</li>
              <li>• Primera participación: {formData.is_first_time_participation ? 'Sí' : 'No'}</li>
            </ul>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="secondary" onClick={() => setStep(2)}>
              ← Anterior
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Enviando...' : '✓ Enviar Solicitud'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RequestWizard;
