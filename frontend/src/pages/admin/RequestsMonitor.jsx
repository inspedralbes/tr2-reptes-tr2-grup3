/**
 * RequestsMonitor.jsx
 * 
 * ZONA ADMIN: Monitor de Solicitudes
 * Tabla grande (DataGrid) para ver todas las solicitudes de los centros
 * Filtros por taller y por centro
 */
import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const RequestsMonitor = () => {
  const [requests, setRequests] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtros
  const [filters, setFilters] = useState({
    status: "",
    workshop_id: "",
    search: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { "Authorization": `Bearer ${token}` };

      // Cargar solicitudes
      const requestsRes = await fetch(`${API_URL}/requests`, { headers });
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setRequests(data);
      }

      // Cargar talleres para filtro
      const workshopsRes = await fetch(`${API_URL}/catalog/workshops`, { headers });
      if (workshopsRes.ok) {
        const data = await workshopsRes.json();
        setWorkshops(data);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filtra las solicitudes según los criterios
   */
  const filteredRequests = requests.filter(req => {
    if (filters.status && req.status !== filters.status) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!req.school_name?.toLowerCase().includes(search)) return false;
    }
    return true;
  });

  /**
   * Obtiene el color del badge según el estado
   */
  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-100 text-gray-600",
      SUBMITTED: "bg-blue-100 text-blue-800",
      APPROVED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-600";
  };

  const getStatusLabel = (status) => {
    const labels = {
      DRAFT: "Borrador",
      SUBMITTED: "Enviada",
      APPROVED: "Aprobada",
      CANCELLED: "Cancelada"
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Cargando solicitudes...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📋 Monitor de Solicitudes</h1>
        <p className="text-gray-500">Visualiza todas las solicitudes de los centros</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar centro</label>
            <input
              type="text"
              placeholder="Nombre del centro..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Todos los estados</option>
              <option value="SUBMITTED">Enviadas</option>
              <option value="APPROVED">Aprobadas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>

          {/* Taller */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Taller</label>
            <select
              value={filters.workshop_id}
              onChange={(e) => setFilters({ ...filters, workshop_id: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Todos los talleres</option>
              {workshops.map((w) => (
                <option key={w.id} value={w.id}>{w.title}</option>
              ))}
            </select>
          </div>

          {/* Botón limpiar */}
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: "", workshop_id: "", search: "" })}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {requests.filter(r => r.status === "SUBMITTED").length}
          </div>
          <div className="text-sm text-blue-700">Enviadas</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {requests.filter(r => r.status === "APPROVED").length}
          </div>
          <div className="text-sm text-green-700">Aprobadas</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {requests.filter(r => r.status === "CANCELLED").length}
          </div>
          <div className="text-sm text-red-700">Canceladas</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{requests.length}</div>
          <div className="text-sm text-purple-700">Total</div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Tabla de solicitudes */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Centro</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha envío</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">1ª Vez</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Martes OK</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                  No hay solicitudes que coincidan con los filtros
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm text-gray-600">#{req.id?.slice(0, 8)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{req.school_name || `Centro ${req.school_id?.slice(0, 8)}`}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {req.period_name || `Período ${req.enrollment_period_id?.slice(0, 8)}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {req.submitted_at 
                      ? new Date(req.submitted_at).toLocaleDateString("es-ES")
                      : "-"
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {req.is_first_time_participation ? "✅" : "❌"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {req.available_for_tuesdays ? "✅" : "❌"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                      {getStatusLabel(req.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      👁️ Ver detalle
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación simple */}
      <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
        <span>Mostrando {filteredRequests.length} de {requests.length} solicitudes</span>
      </div>
    </div>
  );
};

export default RequestsMonitor;
