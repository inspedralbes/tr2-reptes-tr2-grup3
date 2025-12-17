/**
 * enrollment.service.js
 * 
 * Servicio para gestionar períodos de inscripción.
 * Consume los endpoints del backend: /api/enrollment/periods
 */
import client from "../api/client";

const enrollmentService = {
  /**
   * Obtiene todos los períodos de inscripción
   * @returns {Promise<Array>} Lista de períodos
   */
  getAll: async () => {
    const response = await client.get("/enrollment/periods");
    return response.data;
  },

  /**
   * Obtiene un período específico por ID
   * @param {number} id - ID del período
   * @returns {Promise<Object>} Período encontrado
   */
  getById: async (id) => {
    const response = await client.get(`/enrollment/periods/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo período de inscripción
   * @param {Object} data - Datos del período (name, start_date, end_date, status)
   * @returns {Promise<Object>} Período creado
   */
  create: async (data) => {
    const response = await client.post("/enrollment/periods", data);
    return response.data;
  },

  /**
   * Actualiza un período existente
   * @param {number} id - ID del período
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Período actualizado
   */
  update: async (id, data) => {
    const response = await client.put(`/enrollment/periods/${id}`, data);
    return response.data;
  },

  /**
   * Elimina un período
   * @param {number} id - ID del período a eliminar
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    await client.delete(`/enrollment/periods/${id}`);
  },

  /**
   * Publica los resultados de un período
   * Cambia el estado de PROCESSING a PUBLISHED
   * Los centros podrán ver sus asignaciones
   * @param {number} id - ID del período
   * @returns {Promise<Object>} Período actualizado
   */
  publish: async (id) => {
    const response = await client.put(`/enrollment/periods/${id}/publish`);
    return response.data;
  }
};

export default enrollmentService;
