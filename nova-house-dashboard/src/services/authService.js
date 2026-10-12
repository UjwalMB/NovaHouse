import api from './api';

const TOKEN_KEY = 'nova_dashboard_token';
const USER_KEY = 'nova_dashboard_user';

export async function loginDashboard(email, password) {
  try {
    const res = await api.post('/auth/login', { email, password });
    if (res && res.token) {
      localStorage.setItem(TOKEN_KEY, res.token);
      if (res.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      }
      api.setToken(res.token);
      return { success: true, user: res.user, token: res.token };
    }
    throw new Error('Authentication failed: no session token returned.');
  } catch (err) {
    throw new Error(err.message || 'Invalid executive credentials. Please verify your staff email and security key.');
  }
}

export function getCurrentUser() {
  const stored = localStorage.getItem(USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  return {
    id: 'usr_admin_01',
    name: 'Executive GM',
    email: 'admin@novahouse.com',
    role: 'ADMIN'
  };
}

export function isUserAuthenticated() {
  return !!localStorage.getItem(TOKEN_KEY);
}

export function logoutDashboard() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  api.setToken(null);
}
