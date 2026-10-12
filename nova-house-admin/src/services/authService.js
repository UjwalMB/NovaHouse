import api from './api';

const TOKEN_KEY = 'nova_admin_token';
const USER_KEY = 'nova_admin_user';

export async function loginStaff(email, password) {
  try {
    const res = await api.post('/auth/login', { email, password });
    if (res && res.token) {
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem('nova_admin_logged_in', 'true');
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
    id: 'usr_mgr_02',
    name: 'Hotel Manager',
    email: 'manager@novahouse.example',
    role: 'MANAGER'
  };
}

export function logoutStaff() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('nova_admin_logged_in');
  api.setToken(null);
}
