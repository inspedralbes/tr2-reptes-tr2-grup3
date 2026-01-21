/**
 * enrollment.service.js
 * 
 * Servicio para gestionar períodos de inscripción con sistema de fases.
 * Consume los endpoints del backend: /api/enrollment/periods
 * 
 * FASES DISPONIBLES:
 * - SOLICITUDES: Centros pueden enviar solicitudes
 * - ASIGNACION: Admin ejecuta algoritmo (interno)
 * - PUBLICACION: Resultados visibles
 * - EJECUCION: Talleres en marcha
 */
import client from "../api/client";

/**
 * Constantes de fases (sincronizadas con backend)
 */
export const PHASES = {
  SOLICITUDES: 'SOLICITUDES',
  ASIGNACION: 'ASIGNACION',
  PUBLICACION: 'PUBLICACION',
  EJECUCION: 'EJECUCION'
};

export const PHASE_ORDER = [
  PHASES.SOLICITUDES,
  PHASES.ASIGNACION,
  PHASES.PUBLICACION,
  PHASES.EJECUCION
];

export const PHASE_LABELS = {
  [PHASES.SOLICITUDES]: 'Envío de Solicitudes',
  [PHASES.ASIGNACION]: 'Asignación (interno)',
  [PHASES.PUBLICACION]: 'Publicación de Resultados',
  [PHASES.EJECUCION]: 'Ejecución de Talleres'
};

export const PHASE_COLORS = {
  [PHASES.SOLICITUDES]: 'bg-blue-100 text-blue-800 border-blue-200',
  [PHASES.ASIGNACION]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [PHASES.PUBLICACION]: 'bg-green-100 text-green-800 border-green-200',
  [PHASES.EJECUCION]: 'bg-indigo-100 text-indigo-800 border-indigo-200'
};

export const STATUS_LABELS = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activo',
  CLOSED: 'Cerrado'
};

export const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-200',
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  CLOSED: 'bg-red-100 text-red-800 border-red-200'
};

const enrollmentService = {
  /**
   * Obtiene todos los períodos de inscripción
   * @param {string} status - Filtrar por estado (DRAFT, ACTIVE, CLOSED)
   * @returns {Promise<Array>} Lista de períodos
   */
  getAll: async (status = null) => {
    const params = status ? `?status=${status}` : '';
    const response = await client.get(`/enrollment/periods${params}`);
    return response.data;
  },

  /**
   * Obtiene un período específico por ID
   * @param {string} id - ID del período
   * @returns {Promise<Object>} Período encontrado
   */
  getById: async (id) => {
    const response = await client.get(`/enrollment/periods/${id}`);
    return response.data;
  },

  /**
   * Obtiene la fase actual del período activo
   * @returns {Promise<Object>} Info de fase actual
   */
  getCurrentPhase: async () => {
    const response = await client.get('/enrollment/periods/active/current-phase');
    return response.data;
  },

  /**
   * Crea un nuevo período de inscripción
   * @param {Object} data - Datos del período
   * @param {string} data.name - Nombre del período
   * @param {Object} data.phases - Fechas de cada fase
   * @returns {Promise<Object>} Período creado
   */
  create: async (data) => {
    const response = await client.post("/enrollment/periods", data);
    return response.data;
  },

  /**
   * Actualiza un período existente
   * @param {string} id - ID del período
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Período actualizado
   */
  update: async (id, data) => {
    const response = await client.put(`/enrollment/periods/${id}`, data);
    return response.data;
  },

  /**
   * Activa un período (solo uno puede estar activo)
   * @param {string} id - ID del período
   * @returns {Promise<Object>} Período activado
   */
  activate: async (id) => {
    const response = await client.put(`/enrollment/periods/${id}/activate`);
    return response.data;
  },

  /**
   * Avanza a la siguiente fase o a una específica
   * @param {string} id - ID del período
   * @param {string} targetPhase - Fase objetivo (opcional)
   * @returns {Promise<Object>} Período con nueva fase
   */
  advancePhase: async (id, targetPhase = null) => {
    const body = targetPhase ? { target_phase: targetPhase } : {};
    const response = await client.put(`/enrollment/periods/${id}/advance-phase`, body);
    return response.data;
  },

  /**
   * Elimina un período
   * @param {string} id - ID del período a eliminar
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    await client.delete(`/enrollment/periods/${id}`);
  },

  /**
   * Publica los resultados de un período (DEPRECATED - usar advancePhase)
   * @param {string} id - ID del período
   * @returns {Promise<Object>} Período actualizado
   */
  publish: async (id) => {
    const response = await client.put(`/enrollment/periods/${id}/publish`);
    return response.data;
  },

  /**
   * Utilidad: Verifica si estamos en una fase específica
   * @param {Object} phaseInfo - Objeto retornado por getCurrentPhase
   * @param {string} phase - Fase a verificar
   * @returns {boolean}
   */
  isInPhase: (phaseInfo, phase) => {
    return phaseInfo?.active && phaseInfo?.phase === phase;
  },

  /**
   * Utilidad: Obtiene el índice de una fase
   * @param {string} phase - Fase
   * @returns {number} Índice (0-5)
   */
  getPhaseIndex: (phase) => {
    return PHASE_ORDER.indexOf(phase);
  }
};

export default enrollmentService;
