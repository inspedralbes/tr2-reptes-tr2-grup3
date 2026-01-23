import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Upload, Download, Building2, Search, MapPin, Mail, Phone, School } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import { centerService } from "../../services/center.service.js";

const CenterManager = () => {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    postal_code: "",
    municipality: "",
    email: "",
    phone: "",
    ownership_type: ""
  });

  const [searchTerm, setSearchTerm] = useState("");

  const filteredCenters = centers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.includes(searchTerm) ||
    c.municipality?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: centers.length,
    public: centers.filter(c => c.ownership_type?.includes('Públic') || c.ownership_type?.includes('Educació') || c.ownership_type?.includes('Locals')).length,
    private: centers.filter(c => c.ownership_type?.includes('Privat') || c.ownership_type?.includes('Fundacions') || c.ownership_type?.includes('Religioso')).length,
    municipalities: new Set(centers.map(c => c.municipality)).size
  };

  useEffect(() => {
    loadCenters();
  }, []);

  const loadCenters = async () => {
    try {
      setLoading(true);
      const data = await centerService.getAll();
      setCenters(data);
      setError(null);
    } catch (err) {
      setError(
        "Error al cargar centros: " +
        (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCenter) {
        await centerService.update(editingCenter.id, formData);
      } else {
        await centerService.create(formData);
      }
      setShowModal(false);
      setEditingCenter(null);
      setFormData({
        name: "",
        code: "",
        address: "",
        postal_code: "",
        municipality: "",
        email: "",
        phone: "",
        ownership_type: ""
      });
      loadCenters();
    } catch (err) {
      setError(
        "Error al guardar: " + (err.response?.data?.message || err.message)
      );
    }
  };

  const handleEdit = (center) => {
    setEditingCenter(center);
    setFormData({
      name: center.name,
      code: center.code || "",
      address: center.address || "",
      postal_code: center.postal_code || "",
      municipality: center.municipality || "",
      email: center.email || "",
      phone: center.phone || "",
      ownership_type: center.ownership_type || ""
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingCenter(null);
    setFormData({ name: "", code: "" });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este centro?")) return;
    try {
      await centerService.delete(id);
      loadCenters();
    } catch (err) {
      setError(
        "Error al eliminar: " + (err.response?.data?.message || err.message)
      );
    }
  };

  const handleExport = async () => {
    try {
      await centerService.exportCSV();
    } catch (err) {
      setError(
        "Error al exportar: " + (err.response?.data?.message || err.message)
      );
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Código",
      "Nombre",
      "Dirección",
      "Teléfono",
      "Email",
      "Titularidad"
    ];

    // Example data based on a real school
    const exampleRow = [
      "08013275",
      "Institut Pedralbes",
      "Av. Esplugues, 36-42",
      "932033332",
      "a8013275@xtec.cat",
      "Departament d'Educació i Formació Professional"
    ];

    const csvContent = [
      headers.join(";"),
      exampleRow.join(";")
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_centros.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async (file) => {
    try {
      setImporting(true);
      setImportResult(null);
      const result = await centerService.importCSV(file);
      setImportResult(result);
      loadCenters();
    } catch (err) {
      setError(
        "Error al importar: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setImporting(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImport(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <School className="text-blue-600" size={28} /> Gestión de Centros
        </h1>
        <p className="text-gray-500 mt-1">
          Administra los centros educativos, sus datos de contacto y detalles de facturación.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-xs font-semibold uppercase text-blue-800 tracking-wide mt-1">Total Centros</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
          <div className="text-2xl font-bold text-green-600">{stats.public}</div>
          <div className="text-xs font-semibold uppercase text-green-800 tracking-wide mt-1">Públicos</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
          <div className="text-2xl font-bold text-purple-600">{stats.private}</div>
          <div className="text-xs font-semibold uppercase text-purple-800 tracking-wide mt-1">Priv/Conc</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
          <div className="text-2xl font-bold text-gray-600">{stats.municipalities}</div>
          <div className="text-xs font-semibold uppercase text-gray-500 tracking-wide mt-1">Municipios</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="w-full md:w-96 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, código o municipio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <Button
            variant="secondary"
            onClick={handleDownloadTemplate}
          >
            <div className="flex items-center gap-2">
              <Download size={18} /> <span className="hidden sm:inline">Plantilla</span>
            </div>
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowImportModal(true)}
          >
            <div className="flex items-center gap-2">
              <Upload size={18} /> <span className="hidden sm:inline">Importar</span>
            </div>
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            <div className="flex items-center gap-2">
              <Download size={18} /> <span className="hidden sm:inline">Exportar</span>
            </div>
          </Button>
          <Button onClick={handleCreate}>
            <div className="flex items-center gap-2">
              <Plus size={18} /> Nuevo Centro
            </div>
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ubicación</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contacto</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Titularidad</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                {filteredCenters.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-900 bg-gray-50/50 w-24 text-center">{c.code}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="mt-0.5 text-gray-400 shrink-0" />
                        <div>
                          <div className="text-gray-900">{c.municipality}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[180px]" title={c.address}>
                            {c.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {c.email && (
                          <div className="flex items-center gap-2 text-xs">
                            <Mail size={12} className="text-gray-400" />
                            <a href={`mailto:${c.email}`} className="text-blue-600 hover:underline truncate max-w-[150px]" title={c.email}>
                              {c.email}
                            </a>
                          </div>
                        )}
                        {c.phone && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Phone size={12} className="text-gray-400" />
                            {c.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {c.ownership_type && (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${c.ownership_type.includes('Públic') || c.ownership_type.includes('Educació')
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                          }`}>
                          {c.ownership_type.includes('Educació') ? 'Generalitat' : c.ownership_type.split(' ')[0]}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(c)}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCenters.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <p className="text-lg font-medium text-gray-900 mb-1">No se encontraron centros</p>
                      <p>Prueba a ajustar los filtros de búsqueda</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 text-xs text-gray-500 flex justify-between">
            <span>Mostrando {filteredCenters.length} de {centers.length} centros</span>
          </div>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCenter ? "Editar Centro" : "Nuevo Centro"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="center-form">
              Guardar
            </Button>
          </>
        }
      >
        <form id="center-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              required
              placeholder="Ej: Institut Pedralbes"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              placeholder="08013275"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Municipio
              </label>
              <input
                type="text"
                value={formData.municipality}
                onChange={(e) =>
                  setFormData({ ...formData, municipality: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                placeholder="Barcelona"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CP
              </label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) =>
                  setFormData({ ...formData, postal_code: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                placeholder="08019"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              placeholder="C/ Ejemplo, 123"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                placeholder="centro@xtec.cat"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                placeholder="93..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titularidad
            </label>
            <select
              value={formData.ownership_type}
              onChange={(e) =>
                setFormData({ ...formData, ownership_type: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="">Seleccionar...</option>
              <option value="Departament d'Educació i Formació Professional">Público (Generalitat)</option>
              <option value="Corporacions Locals">Público (Municipal)</option>
              <option value="Privat">Privado</option>
              <option value="Fundacions">Fundación</option>
              <option value="Ordes i Congregacions Catòlics">Religioso</option>
              <option value="Societats Mercantils">Sociedad Mercantil</option>
              <option value="Cooperatives">Cooperativa</option>
            </select>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportResult(null);
        }}
        title="Importar Centros desde CSV"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowImportModal(false);
                setImportResult(null);
              }}
            >
              Cerrar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="text-sm text-gray-600">
              <p className="mb-2">
                Arrastra un archivo CSV o haz clic para seleccionar.
              </p>
              <p>
                El archivo debe contener las cabeceras: <code>Código</code>, <code>Nombre</code>, <code>Dirección</code>, <code>Teléfono</code>, <code>Email</code>, <code>Titularidad</code>.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleDownloadTemplate}
              className="whitespace-nowrap shrink-0"
            >
              <div className="flex items-center gap-2">
                <Download size={16} /> Descargar Plantilla
              </div>
            </Button>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
              }`}
          >
            <Upload
              className={`mx-auto mb-4 ${dragActive ? "text-blue-500" : "text-gray-400"
                }`}
              size={48}
            />
            <p className="text-sm text-gray-600 mb-2">
              {dragActive
                ? "Suelta el archivo aquí"
                : "Arrastra el archivo CSV aquí"}
            </p>
            <label className="inline-block">
              <span className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                o haz clic para seleccionar
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                disabled={importing}
              />
            </label>
          </div>

          {importing && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Importando...</span>
            </div>
          )}

          {importResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">
                {importResult.message}
              </p>
              {importResult.details && (
                <div className="mt-2 text-sm text-green-700">
                  <p>Total procesados: {importResult.details.total}</p>
                  <p>Insertados: {importResult.details.inserted}</p>
                  <p>Omitidos: {importResult.details.skipped}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CenterManager;
