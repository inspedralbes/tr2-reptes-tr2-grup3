import api from './api';

export const authService = {
  async login(credentials) {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('enginy_token', data.token);
    localStorage.setItem('enginy_user', JSON.stringify(data.user));
    return data;
  },

  async getProfile() {
    const { data } = await api.get('/auth/me');
    return data;
  },

  logout() {
    localStorage.removeItem('enginy_token');
    localStorage.removeItem('enginy_user');
  },

  getStoredToken() {
    return localStorage.getItem('enginy_token');
  },

  getStoredUser() {
    const user = localStorage.getItem('enginy_user');
    return user ? JSON.parse(user) : null;
  },
};
