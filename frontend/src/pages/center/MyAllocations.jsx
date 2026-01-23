/**
 * MyAllocations.jsx
 * 
 * Vista de resultats d'assignació per a coordinadors de centre.
 * Els coordinadors veuen les places assignades i poden confirmar nominalment els alumnes.
 */
import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { listAllocations } from "../../api/requests.js";
import { AuthContext } from "../../context/AuthContext.jsx";
import { 
  CheckCircle, AlertCircle, Calendar, Users, Clock, 
  BookOpen, MapPin, Info, Download, UserCheck
} from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import client from "../../api/client";

const MyAllocations = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePeriod, setActivePeriod] = useState(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar período activo
      const periodsRes = await client.get("/enrollment/periods?status=ACTIVE");
      if (periodsRes.data.length > 0) {
        setActivePeriod(periodsRes.data[0]);
      }
      
      // Cargar asignaciones
      const filters = user?.school_id ? { school_id: user.school_id } : {};
      const data = await listAllocations(filters);
      setAllocations(data);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'INVALID_PHASE') {
        setError(`Els resultats de les assignacions encara no estan disponibles. Espereu a la fase de publicació.`);
      } else if (err.response?.status === 400 && err.response?.data?.code === 'NO_ACTIVE_PERIOD') {
        setError("No hi ha cap període actiu en aquest moment.");
      } else {
        setError("Error en carregar les assignacions: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Agrupar asignaciones por día
  const groupByDay = () => {
    const tuesday = allocations.filter(a => a.day_of_week === 'TUESDAY');
    const thursday = allocations.filter(a => a.day_of_week === 'THURSDAY');
    return { tuesday, thursday };
  };

  const { tuesday, thursday } = groupByDay();
  const totalStudents = allocations.reduce((sum, a) => sum + a.assigned_seats, 0);

  // Exportar resumen a texto
  const handleExportSummary = () => {
    let content = `RESULTATS D'ASSIGNACIÓ - ${activePeriod?.name || 'Període actual'}\n`;
    content += `${'='.repeat(50)}\n\n`;
    content += `Total places assignades: ${totalStudents} alumnes\n\n`;
    
    if (tuesday.length > 0) {
      content += `DIMARTS:\n`;
      tuesday.forEach(a => {
        content += `  • ${a.workshop_title}: ${a.assigned_seats} places\n`;
      });
      content += `\n`;
    }
    
    if (thursday.length > 0) {
      content += `DIJOUS:\n`;
      thursday.forEach(a => {
        content += `  • ${a.workshop_title}: ${a.assigned_seats} places\n`;
      });
    }
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'assignacions_tallers.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <CheckCircle className="text-green-600 w-8 h-8" />
            Resultats de l'Assignació
          </h1>
          <p className="text-gray-500 mt-1">
            Consulteu les places assignades al vostre centre per a aquesta convocatòria.
          </p>
        </div>
        
        {allocations.length > 0 && (
          <Button variant="secondary" onClick={handleExportSummary} size="sm">
            <Download size={16} className="mr-2" /> Exportar resum
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : allocations.length === 0 && !error ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
            <Calendar className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Encara no teniu assignacions
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Les assignacions apareixeran aquí quan l'administrador publiqui els resultats de la convocatòria.
          </p>
        </div>
      ) : allocations.length > 0 && (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <Users className="text-green-600" size={24} />
                <span className="text-sm font-medium text-green-700">Total Places</span>
              </div>
              <div className="text-3xl font-bold text-green-800">{totalStudents}</div>
              <p className="text-sm text-green-600 mt-1">alumnes assignats</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="text-blue-600" size={24} />
                <span className="text-sm font-medium text-blue-700">Tallers</span>
              </div>
              <div className="text-3xl font-bold text-blue-800">{allocations.length}</div>
              <p className="text-sm text-blue-600 mt-1">tallers diferents</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-5 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="text-purple-600" size={24} />
                <span className="text-sm font-medium text-purple-700">Dies</span>
              </div>
              <div className="text-3xl font-bold text-purple-800">
                {tuesday.length > 0 && thursday.length > 0 ? '2' : '1'}
              </div>
              <p className="text-sm text-purple-600 mt-1">
                {tuesday.length > 0 && thursday.length > 0 
                  ? 'Dimarts i Dijous' 
                  : tuesday.length > 0 ? 'Dimarts' : 'Dijous'}
              </p>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="text-blue-600 shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Com funciona?</p>
              <p>
                Aquestes són les places que el vostre centre ha obtingut per als tallers sol·licitats.
                Feu clic a <strong>"Confirmar alumnes"</strong> per assignar nominalment els alumnes que assistiran a cada taller.
                Els professors acompanyants que vau indicar a la sol·licitud seran notificats amb accés per passar llista.
              </p>
            </div>
          </div>

          {/* Assignacions per dia */}
          <div className="space-y-6">
            {/* Dimarts */}
            {tuesday.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  Dimarts
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({tuesday.length} tallers, {tuesday.reduce((s, a) => s + a.assigned_seats, 0)} alumnes)
                  </span>
                </h3>
                <div className="grid gap-3">
                  {tuesday.map((alloc) => (
                    <AllocationCard 
                      key={alloc.id} 
                      allocation={alloc} 
                      currentPhase={activePeriod?.current_phase}
                      onConfirmClick={() => navigate(`/center/allocation/${alloc.id}/confirm`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Dijous */}
            {thursday.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  Dijous
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({thursday.length} tallers, {thursday.reduce((s, a) => s + a.assigned_seats, 0)} alumnes)
                  </span>
                </h3>
                <div className="grid gap-3">
                  {thursday.map((alloc) => (
                    <AllocationCard 
                      key={alloc.id} 
                      allocation={alloc}
                      currentPhase={activePeriod?.current_phase}
                      onConfirmClick={() => navigate(`/center/allocation/${alloc.id}/confirm`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Componente de tarjeta de asignación
const AllocationCard = ({ allocation, currentPhase, onConfirmClick }) => {
  // Mostrar botón de confirmación solo en fase PUBLICACION o EJECUCION
  const canConfirm = ['PUBLICACION', 'EJECUCION'].includes(currentPhase);
  
  // Verificar si ya tiene alumnos confirmados (campo students_confirmed o similar)
  const hasConfirmedStudents = allocation.confirmed_students > 0;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${
            allocation.day_of_week === 'TUESDAY' 
              ? 'bg-blue-100 text-blue-600' 
              : 'bg-purple-100 text-purple-600'
          }`}>
            <BookOpen size={24} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-lg">{allocation.workshop_title}</h4>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {allocation.start_time?.slice(0, 5)} - {allocation.end_time?.slice(0, 5)}
              </span>
              {allocation.provider_name && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {allocation.provider_name}
                </span>
              )}
            </div>
            
            {/* Botón de confirmación nominal */}
            {canConfirm && (
              <div className="mt-3">
                <Button
                  variant={hasConfirmedStudents ? "secondary" : "primary"}
                  size="sm"
                  onClick={onConfirmClick}
                  className="flex items-center gap-2"
                >
                  <UserCheck size={16} />
                  {hasConfirmedStudents 
                    ? `Gestionar alumnes (${allocation.confirmed_students || 0}/${allocation.assigned_seats})` 
                    : "Confirmar alumnes"}
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <div className={`px-4 py-2 rounded-xl ${
            hasConfirmedStudents 
              ? 'bg-green-100 text-green-800' 
              : 'bg-amber-100 text-amber-800'
          }`}>
            <div className="text-2xl font-bold">{allocation.assigned_seats}</div>
            <div className="text-xs font-medium">places</div>
          </div>
          {hasConfirmedStudents && (
            <div className="mt-2 text-xs text-green-600 font-medium flex items-center justify-end gap-1">
              <CheckCircle size={12} />
              Confirmat
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAllocations;
