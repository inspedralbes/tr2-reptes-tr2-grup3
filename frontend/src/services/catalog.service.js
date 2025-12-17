import api from './api';

export const catalogService = {
  async getWorkshops(filters) {
    const { data } = await api.get('/catalog/workshops', { params: filters });
    return data;
  },

  async getWorkshopById(id) {
    const { data } = await api.get(`/catalog/workshops/${id}`);
    return data;
  },
};
