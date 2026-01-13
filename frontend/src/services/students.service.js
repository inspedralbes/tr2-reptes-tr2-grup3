import client from "../api/client";

/**
 * Servicio para gestión de alumnos del centro
 */
const studentsService = {
  /**
   * Obtiene todos los alumnos del centro (o filtrados)
   * @param {Object} params - Filtros opcionales (school_id, allocation_id)
   */
  getAll: async (params = {}) => {
    // Si somos CENTER_COORD, el backend filtra por nuestra escuela automáticamente
    // o deberíamos pasar el school_id.
    // Por ahora asumimos que el endpoint lista todos si es admin,
    // o podríamos necesitar lógica extra.
    // Revisando backend: listStudents usa req.query.school_id
    // El backend NO filtra por usuario logueado automáticamente en listStudents,
    // pero para CENTER_COORD deberíamos pasar su school_id o tener un endpoint "me/students".
    // MVP: Pasamos parametros tal cual.
    const response = await client.get("/students", { params });
    return response.data;
  },

  /**
   * Obtiene un alumno por ID
   */
  getById: async (id) => {
    const response = await client.get(`/students/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo alumno
   * @param {Object} data - { full_name, idalu, school_id }
   */
  create: async (data) => {
    const response = await client.post("/students", data);
    return response.data;
  },

  /**
   * Actualiza un alumno
   * @param {string} id
   * @param {Object} data - { full_name, idalu }
   */
  update: async (id, data) => {
    const response = await client.put(`/students/${id}`, data);
    return response.data;
  },

  /**
   * Elimina un alumno
   * @param {string} id
   */
  delete: async (id) => {
    const response = await client.delete(`/students/${id}`);
    return response.data;
  },

  /**
   * Sube un documento para el alumno
   */
  uploadDocument: async (id, file, type) => {
    const formData = new FormData();
    formData.append("document", file);
    formData.append("document_type", type);

    const response = await client.post(`/students/${id}/documents`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Elimina un documento
   */
  deleteDocument: async (docId) => {
    const response = await client.delete(`/students/documents/${docId}`);
    return response.data;
  },
};

export default studentsService;
