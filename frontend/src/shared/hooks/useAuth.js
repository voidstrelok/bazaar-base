import { create } from 'zustand';
import api from '../utils/api';

const persistUser = (data) => {
  const user = { nombre: data.nombre, email: data.email, rol: data.rol, esInvitado: data.esInvitado ?? false };
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
  return user;
};

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
    const user = persistUser(data);
    set({ user, accessToken: data.accessToken, isAuthenticated: true });
  },

  guestLogin: async (nombre, rut, email) => {
    const { data } = await api.post('/api/auth/guest', { nombre, rut, email });
    const user = persistUser(data);
    set({ user, accessToken: data.accessToken, isAuthenticated: true });
  },

  sendOtp: async (email) => {
    const { data } = await api.post('/api/auth/send-code', { email });
    return data; // { status: "sent" | "not_found" }
  },

  registerForOtp: async (nombre, rut, email) => {
    await api.post('/api/auth/register-otp', { nombre, rut, email });
    // Crea la cuenta sin iniciar sesión; el OTP se envía a continuación
  },

  verifyOtp: async (email, code) => {
    const { data } = await api.post('/api/auth/verify-code', { email, code });
    const user = persistUser(data);
    set({ user, accessToken: data.accessToken, isAuthenticated: true });
  },

  confirmRegistration: async (email, code) => {
    const { data } = await api.post('/api/auth/confirm-email', { email, code });
    const user = persistUser(data);
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
