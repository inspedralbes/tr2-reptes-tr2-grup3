import client from "./client.js";

/**
 * API de Solicitudes (Requests)
 * Endpoints para gestionar solicitudes de talleres por centros
 */

// Listar solicitudes (con filtros opcionales)
export const listRequests = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.enrollment_period_id) params.append('enrollment_period_id', filters.enrollment_period_id);
  if (filters.school_id) params.append('school_id', filters.school_id);
  if (filters.status) params.append('status', filters.status);
  
  const { data } = await client.get(`/requests?${params}`);
  return data;
};

// Obtener solicitud específica
export const getRequest = async (id) => {
  const { data } = await client.get(`/requests/${id}`);
  return data;
};

// Crear nueva solicitud (CENTER_COORD)
export const createRequest = async (payload) => {
  const { data } = await client.post("/requests", payload);
  return data;
};

/**
 * API de Períodos de Inscripción
 */
export const listEnrollmentPeriods = async () => {
  const { data } = await client.get("/enrollment/periods");
  return data;
};

export const getEnrollmentPeriod = async (id) => {
  const { data } = await client.get(`/enrollment/periods/${id}`);
  return data;
};

/**
 * API de Asignaciones (Allocations)
 */
export const listAllocations = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.period_id) params.append('period_id', filters.period_id);
  if (filters.school_id) params.append('school_id', filters.school_id);
  if (filters.status) params.append('status', filters.status);
  
  const { data } = await client.get(`/allocation?${params}`);
  return data;
};

export const getDemandSummary = async (periodId) => {
  const { data } = await client.get(`/allocation/demand-summary?period_id=${periodId}`);
  return data;
};

export const runAllocation = async (periodId, force = false) => {
  const { data } = await client.post('/allocation/run', { period_id: periodId, force });
  return data;
};

export const updateAllocation = async (allocationId, payload) => {
  const { data } = await client.put(`/allocation/${allocationId}`, payload);
  return data;
};

export const publishAllocations = async (periodId) => {
  const { data } = await client.post('/allocation/publish-all', { period_id: periodId });
  return data;
};

export const confirmAllocation = async (allocationId, students) => {
  const { data } = await client.put(`/allocation/${allocationId}/confirm`, { students });
  return data;
};
