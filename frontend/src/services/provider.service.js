import api from './api';

export const providerService = {
    async getAll() {
        const { data } = await api.get('/providers');
        return data;
    },

    async getById(id) {
        const { data } = await api.get(`/providers/${id}`);
        return data;
    },

    async create(provider) {
        const { data } = await api.post('/providers', provider);
        return data;
    },

    async update(id, provider) {
        const { data } = await api.put(`/providers/${id}`, provider);
        return data;
    },

    async delete(id) {
        const { data } = await api.delete(`/providers/${id}`);
        return data;
    }
};
