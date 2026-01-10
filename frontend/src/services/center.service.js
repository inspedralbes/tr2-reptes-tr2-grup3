import api from './api';

export const centerService = {
    async getAll() {
        const { data } = await api.get('/centers');
        return data;
    },

    async getById(id) {
        const { data } = await api.get(`/centers/${id}`);
        return data;
    },

    async create(center) {
        const { data } = await api.post('/centers', center);
        return data;
    },

    async update(id, center) {
        const { data } = await api.put(`/centers/${id}`, center);
        return data;
    },

    async delete(id) {
        const { data } = await api.delete(`/centers/${id}`);
        return data;
    }
};
