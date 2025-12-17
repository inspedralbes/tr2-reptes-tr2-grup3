import api from './api';

export const requestService = {
  async getRequests(centerId) {
    const { data } = await api.get('/requests', {
      params: centerId ? { center_id: centerId } : undefined,
    });
    return data;
  },

  async getRequestById(id) {
    const { data } = await api.get(`/requests/${id}`);
    return data;
  },

  async createRequest(payload) {
    const { data } = await api.post('/requests', payload);
    return data;
  },

  async updateRequest(id, payload) {
    const { data } = await api.put(`/requests/${id}`, payload);
    return data;
  },

  async cancelRequest(id) {
    const { data } = await api.delete(`/requests/${id}`);
    return data;
  },

  async updateStatus(id, status) {
    const { data } = await api.patch(`/requests/${id}/status`, { status });
    return data;
  },
};
