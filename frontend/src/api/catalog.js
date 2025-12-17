import client from "./client.js";

/**
 * API del Catálogo de Talleres
 * Endpoints para gestionar workshops y ediciones
 */

// Listar todos los talleres (con filtros opcionales)
export const listWorkshops = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.ambit) params.append('ambit', filters.ambit);
  if (filters.is_new !== undefined) params.append('is_new', filters.is_new);
  
  const { data } = await client.get(`/catalog/workshops?${params}`);
  return data;
};

// Obtener un taller específico con sus ediciones
export const getWorkshop = async (id) => {
  const { data } = await client.get(`/catalog/workshops/${id}`);
  return data;
};

// Crear nuevo taller (ADMIN)
export const createWorkshop = async (workshop) => {
  const { data } = await client.post('/catalog/workshops', workshop);
  return data;
};

// Actualizar taller (ADMIN)
export const updateWorkshop = async (id, workshop) => {
  const { data } = await client.put(`/catalog/workshops/${id}`, workshop);
  return data;
};

// Eliminar taller (ADMIN)
export const deleteWorkshop = async (id) => {
  const { data } = await client.delete(`/catalog/workshops/${id}`);
  return data;
};
