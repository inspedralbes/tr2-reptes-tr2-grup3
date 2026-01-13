import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Upload, Download } from "lucide-react";
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
    <div className="space-y-4">
      <Card title="Gestión de Centros">
        <div className="flex justify-between items-center mb-6">
          <div></div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowImportModal(true)}
            >
              <div className="flex items-center gap-2">
                <Upload size={18} /> Importar CSV
              </div>
            </Button>
            <Button variant="secondary" onClick={handleExport}>
              <div className="flex items-center gap-2">
                <Download size={18} /> Exportar CSV
              </div>
            </Button>
            <Button onClick={handleCreate}>
              <div className="flex items-center gap-2">
                <Plus size={18} /> Nuevo Centro
              </div>
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 mb-4 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-medium text-gray-900">
                    Código
                  </th>
                  <th className="px-6 py-4 font-medium text-gray-900">
                    Nombre
                  </th>
                  <th className="px-6 py-4 font-medium text-gray-900">
                    Dirección
                  </th>
                  <th className="px-6 py-4 font-medium text-gray-900">
                    Teléfono
                  </th>
                  <th className="px-6 py-4 font-medium text-gray-900">
                    Email
                  </th>
                  <th className="px-6 py-4 font-medium text-gray-900">
                    Titularidad
                  </th>
                  <th className="px-6 py-4 font-medium text-gray-900 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                {centers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{c.code}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {c.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{c.address}</div>
                      <div className="text-xs text-gray-400">
                        {c.postal_code} {c.municipality}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono text-xs">
                      {c.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="text-blue-600 hover:underline truncate max-w-[150px] block" title={c.email}>
                          {c.email}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {c.ownership_type && (
                        <span className={`px-2 py-1 rounded text-xs ${c.ownership_type.includes('Públic') || c.ownership_type.includes('Educació')
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {c.ownership_type}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-3">
                      <button
                        onClick={() => handleEdit(c)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {centers.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No hay centros registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
          <p className="text-sm text-gray-600">
            Arrastra un archivo CSV o haz clic para seleccionar. El archivo debe
            contener las columnas: <strong>code</strong> y <strong>name</strong>
            .
          </p>

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
