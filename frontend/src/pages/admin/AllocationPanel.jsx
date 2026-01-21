import { useEffect, useState } from "react";
import {
  Play, BarChart, CheckCircle, Calendar, AlertCircle, Users, Clock, Cpu,
  Edit3, Save, X, RefreshCw, Eye, EyeOff, ChevronDown, ChevronRight,
  School, AlertTriangle, Check, Trash2, Plus, Minus, FileCheck, 
  UserCheck, GraduationCap, Building, Filter, ArrowUpDown, Layers,
  MapPin, Phone, Mail, User, BookOpen
} from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import {
  listEnrollmentPeriods,
  getDemandSummary,
  runAllocation,
  listAllocations,
  updateAllocation,
  publishAllocations
} from "../../api/requests.js";

/**
 * AllocationPanel - Panel de Revisión y Aprobación de Asignaciones (ADMIN)
 * 
 * FLUJO:
 * 1. ADMIN ejecuta el algoritmo → crea asignaciones PROVISIONALES
 * 2. ADMIN revisa y puede editar manualmente las asignaciones
 * 3. ADMIN aprueba → cambia estado a PUBLISHED
 * 4. Solo cuando se cambia a fase PUBLICACION los centros ven los resultados
 */
const AllocationPanel = () => {
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [demandSummary, setDemandSummary] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('demand');
  const [editingAllocation, setEditingAllocation] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});
  const [publishingAll, setPublishingAll] = useState(false);
  
  // Nuevos estados para vistas y filtros
  const [viewMode, setViewMode] = useState('workshop'); // 'workshop' | 'center'
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'students' | 'status'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'PROVISIONAL' | 'PUBLISHED'

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadDemandSummary();
      loadAllocations();
    }
  }, [selectedPeriod]);

  const loadPeriods = async () => {
    try {
      const data = await listEnrollmentPeriods();
      setPeriods(data);
      const activePeriod = data.find(p => p.status === 'ACTIVE');
      if (activePeriod) {
        setSelectedPeriod(activePeriod.id);
      } else if (data.length > 0) {
        setSelectedPeriod(data[0].id);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al cargar períodos: ' + err.message });
    }
  };

  const loadDemandSummary = async () => {
    try {
      const response = await getDemandSummary(selectedPeriod);
      setDemandSummary(response.data || []);
    } catch (err) {
      console.error('Error loading demand:', err);
    }
  };

  const loadAllocations = async () => {
    try {
      const data = await listAllocations({ period_id: selectedPeriod });
      setAllocations(data);
    } catch (err) {
      console.error('Error loading allocations:', err);
    }
  };

  const handleRunAllocation = async () => {
    const period = periods.find(p => p.id === selectedPeriod);
    if (period && period.current_phase !== 'ASIGNACION') {
      setMessage({
        type: 'error',
        text: `No es pot executar l'algoritme en la fase actual (${period.current_phase}). El període ha d'estar en fase ASSIGNACIÓ.`
      });
      return;
    }
    
    const hasExisting = allocations.length > 0;
    const confirmMsg = hasExisting 
      ? "Ja existeixen assignacions. Vols eliminar-les i tornar a executar l'algoritme?" 
      : "Executar l'algoritme d'assignació? Això processarà totes les sol·licituds.";
    
    if (!window.confirm(confirmMsg)) return;

    try {
      setLoading(true);
      setMessage(null);
      const result = await runAllocation(selectedPeriod, hasExisting);
      setMessage({
        type: 'success',
        text: `✅ Assignació completada: ${result.allocations_created || 0} assignacions creades, ${result.total_students_allocated || 0} alumnes assignats`
      });
      loadAllocations();
      setActiveTab('places');
    } catch (err) {
      setMessage({ type: 'error', text: "Error en assignació: " + (err.response?.data?.error || err.message) });
    } finally {
      setLoading(false);
    }
  };

  const handleEditAllocation = (allocation) => {
    setEditingAllocation({
      ...allocation,
      new_seats: allocation.assigned_seats
    });
  };

  const handleSaveEdit = async () => {
    if (!editingAllocation) return;
    
    try {
      await updateAllocation(editingAllocation.id, {
        assigned_seats: editingAllocation.new_seats
      });
      setMessage({ type: 'success', text: 'Assignació actualitzada correctament' });
      setEditingAllocation(null);
      loadAllocations();
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al actualitzar: ' + err.message });
    }
  };

  const handlePublishAll = async () => {
    if (!window.confirm("Aprovar totes les assignacions provisionals? Els centres no les veuran fins que canviïs a la fase PUBLICACIÓ.")) {
      return;
    }
    
    try {
      setPublishingAll(true);
      await publishAllocations(selectedPeriod);
      setMessage({ type: 'success', text: '✅ Totes les assignacions han estat aprovades (PUBLISHED)' });
      loadAllocations();
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al publicar: ' + err.message });
    } finally {
      setPublishingAll(false);
    }
  };

  const toggleExpand = (key) => {
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Agrupar por TALLER
  const groupByWorkshop = () => {
    const grouped = allocations.reduce((acc, alloc) => {
      const key = alloc.workshop_edition_id;
      if (!acc[key]) {
        acc[key] = { 
          id: key,
          title: alloc.workshop_title, 
          day: alloc.day_of_week,
          term: alloc.term || '2N_TRIMESTRE',
          schools: [], 
          totalStudents: 0,
          provisionalCount: 0,
          publishedCount: 0,
          capacity: 16
        };
      }
      acc[key].schools.push(alloc);
      acc[key].totalStudents += alloc.assigned_seats;
      if (alloc.status === 'PROVISIONAL') acc[key].provisionalCount++;
      if (alloc.status === 'PUBLISHED') acc[key].publishedCount++;
      return acc;
    }, {});
    
    return Object.values(grouped).sort((a, b) => {
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      if (sortBy === 'students') return b.totalStudents - a.totalStudents;
      return b.provisionalCount - a.provisionalCount;
    });
  };

  // Agrupar por CENTRO
  const groupByCenter = () => {
    const grouped = allocations.reduce((acc, alloc) => {
      const key = alloc.school_id;
      if (!acc[key]) {
        acc[key] = { 
          id: key,
          name: alloc.school_name,
          code: alloc.school_code,
          workshops: [], 
          totalStudents: 0,
          provisionalCount: 0,
          publishedCount: 0
        };
      }
      acc[key].workshops.push(alloc);
      acc[key].totalStudents += alloc.assigned_seats;
      if (alloc.status === 'PROVISIONAL') acc[key].provisionalCount++;
      if (alloc.status === 'PUBLISHED') acc[key].publishedCount++;
      return acc;
    }, {});
    
    return Object.values(grouped).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'students') return b.totalStudents - a.totalStudents;
      return b.provisionalCount - a.provisionalCount;
    });
  };

  // Agrupar demanda por taller para la pestaña de demanda
  const groupDemandByWorkshop = () => {
    const grouped = demandSummary.reduce((acc, item) => {
      const key = item.workshop_title;
      if (!acc[key]) {
        acc[key] = {
          title: key,
          day: item.day_of_week,
          requests: [],
          totalRequested: 0,
          schoolCount: 0
        };
      }
      acc[key].requests.push(item);
      acc[key].totalRequested += parseInt(item.total_requested);
      acc[key].schoolCount++;
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => b.totalRequested - a.totalRequested);
  };

  // Estadísticas
  const totalDemand = demandSummary.reduce((sum, item) => sum + parseInt(item.total_requested), 0);
  const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.assigned_seats, 0);
  const coverage = totalDemand > 0 ? Math.round((totalAllocated / totalDemand) * 100) : 0;
  const provisionalCount = allocations.filter(a => a.status === 'PROVISIONAL').length;
  const publishedCount = allocations.filter(a => a.status === 'PUBLISHED').length;
  const uniqueSchools = new Set(allocations.map(a => a.school_id)).size;
  const uniqueWorkshops = new Set(allocations.map(a => a.workshop_edition_id)).size;
  
  const selectedPeriodData = periods.find(p => p.id === selectedPeriod);
  const currentPhase = selectedPeriodData?.current_phase;
  const canRunAllocation = currentPhase === 'ASIGNACION';
  const canPublish = canRunAllocation && provisionalCount > 0;

  // Filtrar asignaciones según estado
  const filteredAllocations = filterStatus === 'all' 
    ? allocations 
    : allocations.filter(a => a.status === filterStatus);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
              <Cpu size={24} />
            </div>
            Assignació Intel·ligent
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gestiona les assignacions de places i professors als tallers
          </p>
        </div>
        
        {/* Selector de período */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm">
            <Calendar size={18} className="text-gray-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer text-gray-700 font-medium"
            >
              {periods.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {currentPhase && (
            <span className={`px-3 py-2 rounded-xl text-xs font-semibold ${
              currentPhase === 'ASIGNACION' 
                ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}>
              {currentPhase}
            </span>
          )}
        </div>
      </div>

      {/* Workflow Progress */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-4 border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {[
              { step: 1, label: 'Executar', icon: Play, active: canRunAllocation, done: allocations.length > 0 },
              { step: 2, label: 'Revisar', icon: Eye, active: provisionalCount > 0, done: false },
              { step: 3, label: 'Aprovar', icon: CheckCircle, active: publishedCount > 0, done: publishedCount > 0 && provisionalCount === 0 }
            ].map((item, idx) => (
              <div key={item.step} className="flex items-center gap-2">
                {idx > 0 && <div className={`w-12 h-0.5 ${item.active || item.done ? 'bg-blue-300' : 'bg-gray-200'}`} />}
                <div className={`flex items-center gap-2 ${
                  item.done ? 'text-green-600' : item.active ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    item.done ? 'bg-green-500 text-white' : 
                    item.active ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {item.done ? <Check size={16} /> : <item.icon size={16} />}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleRunAllocation} 
              disabled={loading || !canRunAllocation}
              size="sm"
              className={!canRunAllocation ? 'opacity-50' : ''}
            >
              {loading ? <RefreshCw size={16} className="animate-spin mr-1" /> : <Play size={16} className="mr-1" />}
              Executar
            </Button>
            
            {canPublish && (
              <Button 
                onClick={handlePublishAll}
                disabled={publishingAll}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                {publishingAll ? <RefreshCw size={16} className="animate-spin mr-1" /> : <CheckCircle size={16} className="mr-1" />}
                Aprovar ({provisionalCount})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <Users className="text-blue-500" size={18} />
            <span className="text-xs font-medium text-blue-600">Sol·licitats</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">{totalDemand}</div>
          <div className="text-xs text-blue-500">alumnes</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 border border-green-100">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="text-green-500" size={18} />
            <span className="text-xs font-medium text-green-600">Assignats</span>
          </div>
          <div className="text-2xl font-bold text-green-700">{totalAllocated}</div>
          <div className="text-xs text-green-500">alumnes</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
          <div className="flex items-center gap-2 mb-1">
            <BarChart className="text-purple-500" size={18} />
            <span className="text-xs font-medium text-purple-600">Cobertura</span>
          </div>
          <div className="text-2xl font-bold text-purple-700">{coverage}%</div>
          <div className="text-xs text-purple-500">del total</div>
        </div>
        <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
          <div className="flex items-center gap-2 mb-1">
            <Building className="text-indigo-500" size={18} />
            <span className="text-xs font-medium text-indigo-600">Centres</span>
          </div>
          <div className="text-2xl font-bold text-indigo-700">{uniqueSchools}</div>
          <div className="text-xs text-indigo-500">amb places</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="text-amber-500" size={18} />
            <span className="text-xs font-medium text-amber-600">Provisionals</span>
          </div>
          <div className="text-2xl font-bold text-amber-700">{provisionalCount}</div>
          <div className="text-xs text-amber-500">pendent</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
          <div className="flex items-center gap-2 mb-1">
            <FileCheck className="text-emerald-500" size={18} />
            <span className="text-xs font-medium text-emerald-600">Aprovades</span>
          </div>
          <div className="text-2xl font-bold text-emerald-700">{publishedCount}</div>
          <div className="text-xs text-emerald-500">confirmat</div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'error'
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span className="font-medium flex-1">{message.text}</span>
          <button onClick={() => setMessage(null)} className="p-1 hover:bg-white/50 rounded">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Main Content Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tab Header */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {[
            { key: 'demand', label: 'Demanda', icon: BarChart, count: demandSummary.length },
            { key: 'places', label: 'Places (Alumnes)', icon: Users, count: allocations.length, highlight: provisionalCount > 0 },
            { key: 'teachers', label: 'Professors', icon: GraduationCap, count: 0 }
          ].map(tab => (
            <button
              key={tab.key}
              className={`flex-1 py-3.5 text-sm font-medium text-center transition-all relative ${
                activeTab === tab.key
                  ? 'text-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              <div className="flex items-center justify-center gap-2">
                <tab.icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    tab.highlight ? "bg-amber-100 text-amber-700" : "bg-gray-200 text-gray-600"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </div>
              {activeTab === tab.key && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5">
          
          {/* ========== TAB: DEMANDA ========== */}
          {activeTab === 'demand' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <BarChart className="text-blue-500" size={20} />
                  Resum de Sol·licituds per Taller
                </h3>
                <span className="text-sm text-gray-500">
                  {demandSummary.length} sol·licituds de {new Set(demandSummary.map(d => d.school_name)).size} centres
                </span>
              </div>

              {demandSummary.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <BarChart className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-500">No hi ha sol·licituds per aquest període</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groupDemandByWorkshop().map((workshop, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div 
                        className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
                        onClick={() => toggleExpand(`demand_${workshop.title}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${
                            workshop.day === 'TUESDAY' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                          }`}>
                            <BookOpen size={20} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{workshop.title}</h4>
                            <p className="text-sm text-gray-500">
                              {workshop.day === 'TUESDAY' ? '📅 Dimarts' : '📅 Dijous'} • {workshop.schoolCount} centres sol·licitants
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-800">{workshop.totalRequested}</div>
                            <div className="text-xs text-gray-500">alumnes sol·licitats</div>
                          </div>
                          <div className={`p-2 rounded-lg ${
                            workshop.totalRequested > 16 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {workshop.totalRequested > 16 ? <AlertTriangle size={20} /> : <Check size={20} />}
                          </div>
                          {expandedItems[`demand_${workshop.title}`] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </div>
                      </div>
                      
                      {expandedItems[`demand_${workshop.title}`] && (
                        <div className="p-4 border-t border-gray-100 bg-white">
                          <div className="grid gap-2">
                            {workshop.requests.map((req, rIdx) => (
                              <div key={rIdx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <School className="text-gray-400" size={18} />
                                  <div>
                                    <span className="font-medium text-gray-800">{req.school_name}</span>
                                    {req.is_first_time_participation && (
                                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                        🆕 Primera vegada
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-gray-500">Prioritat {req.priority}</span>
                                  <span className="font-bold text-gray-800 bg-white px-3 py-1 rounded-lg border">
                                    {req.total_requested} alumnes
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== TAB: PLACES (ALUMNES) ========== */}
          {activeTab === 'places' && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="text-blue-500" size={20} />
                  Assignacions de Places
                </h3>
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Vista */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('workshop')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        viewMode === 'workshop' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Layers size={14} className="inline mr-1" /> Per Taller
                    </button>
                    <button
                      onClick={() => setViewMode('center')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        viewMode === 'center' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Building size={14} className="inline mr-1" /> Per Centre
                    </button>
                  </div>

                  {/* Filtro estado */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
                  >
                    <option value="all">Tots els estats</option>
                    <option value="PROVISIONAL">🟡 Provisionals</option>
                    <option value="PUBLISHED">🟢 Aprovades</option>
                  </select>

                  {/* Ordenar */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
                  >
                    <option value="name">Ordenar: Nom</option>
                    <option value="students">Ordenar: Alumnes</option>
                    <option value="status">Ordenar: Estat</option>
                  </select>
                </div>
              </div>

              {allocations.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <Cpu className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-500 mb-4">No hi ha assignacions. Executa l'algoritme per crear-les.</p>
                  {canRunAllocation && (
                    <Button onClick={handleRunAllocation} size="sm">
                      <Play size={16} className="mr-1" /> Executar Algoritme
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* VISTA POR TALLER */}
                  {viewMode === 'workshop' && groupByWorkshop().map((workshop) => {
                    const isExpanded = expandedItems[workshop.id] !== false;
                    const hasProvisional = workshop.provisionalCount > 0;
                    const occupancy = Math.round((workshop.totalStudents / workshop.capacity) * 100);
                    
                    return (
                      <div 
                        key={workshop.id} 
                        className={`border rounded-xl overflow-hidden transition-all ${
                          hasProvisional ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200'
                        }`}
                      >
                        <div 
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            hasProvisional ? 'bg-amber-50/50' : 'bg-gray-50'
                          }`}
                          onClick={() => toggleExpand(workshop.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`p-2.5 rounded-xl ${
                                workshop.day === 'TUESDAY' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                              }`}>
                                <BookOpen size={22} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{workshop.title}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    workshop.day === 'TUESDAY' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {workshop.day === 'TUESDAY' ? 'Dimarts' : 'Dijous'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {workshop.schools.length} centres assignats
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              {/* Barra de ocupación */}
                              <div className="hidden md:block w-32">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-500">Ocupació</span>
                                  <span className={`font-semibold ${
                                    occupancy > 100 ? 'text-red-600' : occupancy > 80 ? 'text-amber-600' : 'text-green-600'
                                  }`}>{occupancy}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all ${
                                      occupancy > 100 ? 'bg-red-500' : occupancy > 80 ? 'bg-amber-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(occupancy, 100)}%` }}
                                  />
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-xl font-bold text-gray-800">{workshop.totalStudents}/{workshop.capacity}</div>
                                <div className="text-xs text-gray-500">places</div>
                              </div>
                              
                              {hasProvisional && (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                  {workshop.provisionalCount} pendent
                                </span>
                              )}
                              
                              {isExpanded ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                            </div>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="p-4 border-t border-gray-100 bg-white">
                            <div className="space-y-2">
                              {workshop.schools
                                .filter(s => filterStatus === 'all' || s.status === filterStatus)
                                .map((school) => (
                                <div 
                                  key={school.id}
                                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                    editingAllocation?.id === school.id 
                                      ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-200' 
                                      : school.status === 'PROVISIONAL'
                                        ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
                                        : 'border-green-200 bg-green-50 hover:border-green-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${
                                      school.status === 'PROVISIONAL' ? 'bg-amber-100' : 'bg-green-100'
                                    }`}>
                                      <School className={school.status === 'PROVISIONAL' ? 'text-amber-600' : 'text-green-600'} size={18} />
                                    </div>
                                    <div>
                                      <span className="font-medium text-gray-800">{school.school_name}</span>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                          school.status === 'PROVISIONAL' 
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-green-100 text-green-700'
                                        }`}>
                                          {school.status === 'PROVISIONAL' ? '🟡 Provisional' : '✅ Aprovat'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    {editingAllocation?.id === school.id ? (
                                      <div className="flex items-center gap-2">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); setEditingAllocation(prev => ({...prev, new_seats: Math.max(1, prev.new_seats - 1)})); }}
                                          className="p-1.5 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                          <Minus size={14} />
                                        </button>
                                        <span className="w-10 text-center font-bold text-xl">{editingAllocation.new_seats}</span>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); setEditingAllocation(prev => ({...prev, new_seats: Math.min(4, prev.new_seats + 1)})); }}
                                          className="p-1.5 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                          <Plus size={14} />
                                        </button>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors ml-2"
                                        >
                                          <Save size={16} />
                                        </button>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); setEditingAllocation(null); }}
                                          className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                          <X size={16} />
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="text-center">
                                          <span className="text-2xl font-bold text-gray-800">{school.assigned_seats}</span>
                                          <span className="text-sm text-gray-500 ml-1">alumnes</span>
                                        </div>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleEditAllocation(school); }}
                                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                          title="Editar places"
                                        >
                                          <Edit3 size={18} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* VISTA POR CENTRO */}
                  {viewMode === 'center' && groupByCenter().map((center) => {
                    const isExpanded = expandedItems[center.id] !== false;
                    const hasProvisional = center.provisionalCount > 0;
                    
                    return (
                      <div 
                        key={center.id} 
                        className={`border rounded-xl overflow-hidden transition-all ${
                          hasProvisional ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200'
                        }`}
                      >
                        <div 
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            hasProvisional ? 'bg-amber-50/50' : 'bg-gray-50'
                          }`}
                          onClick={() => toggleExpand(center.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`p-2.5 rounded-xl ${
                                hasProvisional ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                              }`}>
                                <Building size={22} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{center.name}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-gray-500">
                                    Codi: {center.code}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {center.workshops.length} tallers assignats
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-xl font-bold text-gray-800">{center.totalStudents}</div>
                                <div className="text-xs text-gray-500">alumnes total</div>
                              </div>
                              
                              {hasProvisional && (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                  {center.provisionalCount} pendent
                                </span>
                              )}
                              
                              {isExpanded ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                            </div>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="p-4 border-t border-gray-100 bg-white">
                            <div className="space-y-2">
                              {center.workshops
                                .filter(w => filterStatus === 'all' || w.status === filterStatus)
                                .map((workshop) => (
                                <div 
                                  key={workshop.id}
                                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                    editingAllocation?.id === workshop.id 
                                      ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-200' 
                                      : workshop.status === 'PROVISIONAL'
                                        ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
                                        : 'border-green-200 bg-green-50 hover:border-green-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${
                                      workshop.day_of_week === 'TUESDAY' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                                    }`}>
                                      <BookOpen size={18} />
                                    </div>
                                    <div>
                                      <span className="font-medium text-gray-800">{workshop.workshop_title}</span>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                          workshop.day_of_week === 'TUESDAY' 
                                            ? 'bg-blue-100 text-blue-700' 
                                            : 'bg-purple-100 text-purple-700'
                                        }`}>
                                          {workshop.day_of_week === 'TUESDAY' ? 'Dimarts' : 'Dijous'}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                          workshop.status === 'PROVISIONAL' 
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-green-100 text-green-700'
                                        }`}>
                                          {workshop.status === 'PROVISIONAL' ? '🟡 Provisional' : '✅ Aprovat'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    {editingAllocation?.id === workshop.id ? (
                                      <div className="flex items-center gap-2">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); setEditingAllocation(prev => ({...prev, new_seats: Math.max(1, prev.new_seats - 1)})); }}
                                          className="p-1.5 bg-gray-200 rounded-lg hover:bg-gray-300"
                                        >
                                          <Minus size={14} />
                                        </button>
                                        <span className="w-10 text-center font-bold text-xl">{editingAllocation.new_seats}</span>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); setEditingAllocation(prev => ({...prev, new_seats: Math.min(4, prev.new_seats + 1)})); }}
                                          className="p-1.5 bg-gray-200 rounded-lg hover:bg-gray-300"
                                        >
                                          <Plus size={14} />
                                        </button>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 ml-2"
                                        >
                                          <Save size={16} />
                                        </button>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); setEditingAllocation(null); }}
                                          className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                                        >
                                          <X size={16} />
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="text-center">
                                          <span className="text-2xl font-bold text-gray-800">{workshop.assigned_seats}</span>
                                          <span className="text-sm text-gray-500 ml-1">alumnes</span>
                                        </div>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleEditAllocation(workshop); }}
                                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                          title="Editar places"
                                        >
                                          <Edit3 size={18} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========== TAB: PROFESSORS ========== */}
          {activeTab === 'teachers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <GraduationCap className="text-indigo-500" size={20} />
                  Assignació de Professors als Tallers
                </h3>
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="text-blue-500 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Com funciona l'assignació de professors?</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Els centres indiquen les preferències de professors a les seves sol·licituds. 
                    L'algoritme assigna automàticament els professors segons disponibilitat i preferències.
                    Pots revisar i modificar manualment les assignacions aquí.
                  </p>
                </div>
              </div>

              {allocations.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <GraduationCap className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-500">No hi ha assignacions de tallers encara.</p>
                  <p className="text-sm text-gray-400 mt-1">Primer executa l'algoritme per assignar places.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groupByWorkshop().map((workshop) => {
                    const isExpanded = expandedItems[`teacher_${workshop.id}`];
                    
                    return (
                      <div key={workshop.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div 
                          className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
                          onClick={() => toggleExpand(`teacher_${workshop.id}`)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${
                              workshop.day === 'TUESDAY' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                            }`}>
                              <BookOpen size={22} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{workshop.title}</h4>
                              <p className="text-sm text-gray-500">
                                {workshop.day === 'TUESDAY' ? 'Dimarts' : 'Dijous'} • {workshop.schools.length} centres
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {[1, 2].map(i => (
                                  <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                                    <User size={14} className="text-gray-400" />
                                  </div>
                                ))}
                              </div>
                              <span className="text-sm text-gray-500 ml-2">Sense professors assignats</span>
                            </div>
                            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="p-4 border-t border-gray-100 bg-white">
                            <div className="mb-4">
                              <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <UserCheck size={16} /> Professors assignats al taller
                              </h5>
                              <div className="bg-gray-50 rounded-lg p-4 text-center border border-dashed border-gray-200">
                                <User className="mx-auto text-gray-300 mb-2" size={32} />
                                <p className="text-sm text-gray-500">No hi ha professors assignats a aquest taller</p>
                                <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                                  + Assignar professor
                                </button>
                              </div>
                            </div>
                            
                            <div>
                              <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <School size={16} /> Centres participants
                              </h5>
                              <div className="space-y-2">
                                {workshop.schools.map((school, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-3">
                                      <Building className="text-gray-400" size={18} />
                                      <div>
                                        <span className="font-medium text-gray-800">{school.school_name}</span>
                                        <span className="text-xs text-gray-500 ml-2">({school.assigned_seats} alumnes)</span>
                                      </div>
                                    </div>
                                    <span className="text-sm text-gray-400 italic">Sense preferència indicada</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllocationPanel;
