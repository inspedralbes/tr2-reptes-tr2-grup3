/**
 * RequestsMonitor.jsx
 *
 * ZONA ADMIN: Monitor de Solicitudes
 * Tabla grande (DataGrid) para ver todas las solicitudes de los centros
 * Filtros por taller y por centro
 */
import { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Filter,
  X,
  Check,
  Eye,
  AlertCircle,
} from "lucide-react";
import client from "../../api/client";
import Card from "../../components/ui/Card.jsx";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const RequestsMonitor = () => {
  const [requests, setRequests] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [filters, setFilters] = useState({
    status: "",
    workshop_id: "",
    search: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [requestsRes, workshopsRes] = await Promise.all([
        client.get("/requests"),
        client.get("/catalog/workshops"),
      ]);

      setRequests(requestsRes.data);
      setWorkshops(workshopsRes.data);
    } catch (err) {
      setError(
        "Error carregant sol·licituds: " +
        (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filtra las solicitudes según los criterios
   */
  const filteredRequests = requests.filter((req) => {
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
      DRAFT: "bg-gray-100 text-gray-600 border-gray-200",
      SUBMITTED: "bg-blue-50 text-blue-700 border-blue-200",
      APPROVED: "bg-green-50 text-green-700 border-green-200",
      CANCELLED: "bg-red-50 text-red-700 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-600 border-gray-200";
  };

  const getStatusLabel = (status) => {
    const labels = {
      DRAFT: "Esborrany",
      SUBMITTED: "Enviada",
      APPROVED: "Aprovada",
      CANCELLED: "Cancel·lada",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="text-blue-600" size={28} /> Monitor de
          Sol·licituds
        </h1>
        <p className="text-gray-500 mt-1">
          Visualitza i gestiona totes les sol·licituds entrants dels centres.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Search size={14} /> Cerca centre
            </label>
            <input
              type="text"
              placeholder="Nom del centre..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Filter size={14} /> Estat
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tots els estats</option>
              <option value="SUBMITTED">Enviades</option>
              <option value="APPROVED">Aprovades</option>
              <option value="CANCELLED">Cancel·lades</option>
            </select>
          </div>

          {/* Taller */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <FileText size={14} /> Taller
            </label>
            <select
              value={filters.workshop_id}
              onChange={(e) =>
                setFilters({ ...filters, workshop_id: e.target.value })
              }
              className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tots els tallers</option>
              {workshops.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title}
                </option>
              ))}
            </select>
          </div>

          {/* Botón limpiar */}
          <div className="flex items-end">
            <button
              onClick={() =>
                setFilters({ status: "", workshop_id: "", search: "" })
              }
              className="w-full bg-gray-50 text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <X size={16} /> Netejar filtres
            </button>
          </div>
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
          <div className="text-2xl font-bold text-blue-600">
            {requests.filter((r) => r.status === "SUBMITTED").length}
          </div>
          <div className="text-xs font-semibold uppercase text-blue-800 tracking-wide mt-1">
            Enviades
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
          <div className="text-2xl font-bold text-green-600">
            {requests.filter((r) => r.status === "APPROVED").length}
          </div>
          <div className="text-xs font-semibold uppercase text-green-800 tracking-wide mt-1">
            Aprovades
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
          <div className="text-2xl font-bold text-red-600">
            {requests.filter((r) => r.status === "CANCELLED").length}
          </div>
          <div className="text-xs font-semibold uppercase text-red-800 tracking-wide mt-1">
            Cancel·lades
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
          <div className="text-2xl font-bold text-gray-600">
            {requests.length}
          </div>
          <div className="text-xs font-semibold uppercase text-gray-500 tracking-wide mt-1">
            Total
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabla de solicitudes */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Centre
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Període
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Data enviament
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  1a Vegada
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Dimarts OK
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Estat
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Accions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No hi ha sol·licituds que coincideixin amb els filtres
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        #{req.id?.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {req.school_name ||
                          `Centre ${req.school_id?.slice(0, 8)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {req.period_name ||
                        `Període ${req.enrollment_period_id?.slice(0, 8)}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {req.submitted_at
                        ? new Date(req.submitted_at).toLocaleDateString("ca-ES")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center">
                        {req.is_first_time_participation ? (
                          <Check size={18} className="text-green-500" />
                        ) : (
                          <X size={18} className="text-gray-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center">
                        {req.available_for_tuesdays ? (
                          <Check size={18} className="text-green-500" />
                        ) : (
                          <X size={18} className="text-gray-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          req.status
                        )}`}
                      >
                        {getStatusLabel(req.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1 transition-colors">
                        <Eye size={16} /> Veure detall
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación simple */}
      <div className="mt-4 flex justify-between items-center text-sm text-gray-500 px-1">
        <span>
          Mostrant {filteredRequests.length} de {requests.length} sol·licituds
        </span>
      </div>
    </div>
  );
};

export default RequestsMonitor;
