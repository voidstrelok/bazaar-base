import { create } from 'zustand';
import api from '../utils/api';

const useAuth = create((set, get) => ({
  user: (() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),

  login: async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    const user = { nombre: data.nombre, email: data.email, rol: data.rol };

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    set({ user, accessToken: data.accessToken, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await api.post('/api/auth/revoke');
    } catch {
      // ignore errors on revoke
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  isAdmin: () => get().user?.rol === 'ADMIN',
}));

export default useAuth;
