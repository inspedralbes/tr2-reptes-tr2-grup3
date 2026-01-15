import { useEffect, useState, useContext } from "react";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { listAllocations, confirmAllocation } from "../../api/requests.js";
import { AuthContext } from "../../context/AuthContext.jsx";

/**
 * MyAllocations - Vista de asignaciones para centros
 * Permite: ver asignaciones, confirmar y añadir nombres de alumnos
 */
const MyAllocations = () => {
  const { user } = useContext(AuthContext);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [students, setStudents] = useState([]);

  // Cargar asignaciones
  useEffect(() => {
    if (user) {
      loadAllocations();
    }
  }, [user]);

  const loadAllocations = async () => {
    try {
      setLoading(true);
      // Filtrar por school_id si está disponible
      const filters = user?.school_id ? { school_id: user.school_id } : {};
      const data = await listAllocations(filters);
      setAllocations(data);
    } catch (err) {
      setError('Error al cargar asignaciones: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Iniciar confirmación
  const startConfirmation = (allocation) => {
    setConfirmingId(allocation.id);
    // Crear array de estudiantes vacíos según asignación
    const studentList = Array(allocation.assigned_seats).fill(null).map((_, i) => ({
      name: '',
      idalu: '',
    }));
    setStudents(studentList);
  };

  // Actualizar estudiante
  const updateStudent = (index, field, value) => {
    const updated = [...students];
    updated[index][field] = value;
    setStudents(updated);
  };

  // Confirmar asignación
  const handleConfirm = async () => {
    // Validar que todos los estudiantes tengan nombre
    const validStudents = students.filter(s => s.name.trim());
    if (validStudents.length === 0) {
      setError('Debes añadir al menos un alumno');
      return;
    }

    try {
      await confirmAllocation(confirmingId, validStudents);
      setConfirmingId(null);
      setStudents([]);
      loadAllocations();
    } catch (err) {
      setError('Error al confirmar: ' + err.message);
    }
  };

  // Obtener color según estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'ACCEPTED': return 'bg-blue-100 text-blue-800';
      case 'PROVISIONAL': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Traducir estado
  const translateStatus = (status) => {
    switch (status) {
      case 'PUBLISHED': return 'Publicada';
      case 'ACCEPTED': return 'Confirmada';
      case 'PROVISIONAL': return 'Provisional';
      default: return status;
    }
  };

  const traverseToConfirmation = (id) => {
    // Navegar a la página de confirmación nominal
    window.location.href = `/center/allocations/${id}/confirm`;
  };

  return (
    <div className="space-y-4">
      <Card title="Mis Asignaciones">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
        )}

        {loading ? (
          <p className="text-center py-8">Cargando asignaciones...</p>
        ) : allocations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No tienes asignaciones todavía.</p>
            <p className="text-sm mt-2">Las asignaciones aparecerán aquí cuando el administrador las publique.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allocations.map((alloc) => (
              <div key={alloc.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{alloc.workshop_title}</h3>
                    <p className="text-gray-600 text-sm">
                      {alloc.day_of_week === 'TUESDAY' ? '📅 Martes' : '📅 Jueves'} •
                      {alloc.start_time} - {alloc.end_time}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm ${getStatusColor(alloc.status)}`}>
                    {translateStatus(alloc.status)}
                  </span>
                </div>

                <div className="bg-gray-50 rounded p-3 mb-3">
                  <p className="text-sm">
                    <strong>Plazas asignadas:</strong> {alloc.assigned_seats}
                  </p>
                </div>

                {/* Botón de confirmar (solo si está publicada y no confirmada) */}
                {alloc.status === 'PUBLISHED' && (
                  <Button onClick={() => traverseToConfirmation(alloc.id)}>
                    ✓ Confirmar Asignación
                  </Button>
                )}

                {/* Permitir editar aunque esté confirmada si se desea, o ver detalles */}
                {alloc.status === 'ACCEPTED' && (
                  <div className="flex justify-between items-center">
                    <p className="text-green-600 text-sm">✓ Ya has confirmado esta asignación</p>
                    <Button variant="secondary" onClick={() => traverseToConfirmation(alloc.id)}>
                      Ver Alumnos
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default MyAllocations;
