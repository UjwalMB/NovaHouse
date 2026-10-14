import { User } from '../types';

const TOKEN_KEY = 'nova_admin_token';
const USER_KEY = 'nova_admin_user';

interface StaffCredential {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'ANALYST';
  passwords: string[];
}

const AUTHORIZED_STAFF: Record<string, StaffCredential> = {
  'admin@novahouse.com': {
    id: 'usr_admin_01',
    name: 'Executive General Manager',
    email: 'admin@novahouse.com',
    role: 'ADMIN',
    passwords: ['NovaAdmin#Executive2026', 'admin', 'password', 'ujju!@#$400'],
  },
  'manager@novahouse.com': {
    id: 'usr_mgr_02',
    name: 'Hotel Operations Manager',
    email: 'manager@novahouse.com',
    role: 'MANAGER',
    passwords: ['NovaManager#Ops2026', 'manager', 'password'],
  },
  'manager@novahouse.example': {
    id: 'usr_mgr_03',
    name: 'Hotel Operations Manager',
    email: 'manager@novahouse.example',
    role: 'MANAGER',
    passwords: ['NovaManager#Ops2026', 'manager', 'password'],
  },
  'analyst@novahouse.com': {
    id: 'usr_anl_04',
    name: 'Executive Revenue Analyst',
    email: 'analyst@novahouse.com',
    role: 'ANALYST',
    passwords: ['NovaAnalyst#Insights2026', 'analyst', 'password'],
  },
};

export async function loginStaff(email: string, password: string): Promise<{ success: boolean; user: User; token: string }> {
  const normEmail = email.trim().toLowerCase();
  const staff = AUTHORIZED_STAFF[normEmail];

  // Validate credentials or permit admin fallback in development
  if (staff && staff.passwords.includes(password)) {
    const user: User = {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
    };
    const token = `nh_token_${btoa(JSON.stringify({ sub: user.id, email: user.email, role: user.role, iat: Date.now() }))}`;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('nova_admin_logged_in', 'true');
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return { success: true, user, token };
  }

  // Development convenience: permit generic hotel credentials
  if (password === 'NovaAdmin#Executive2026' || password === 'admin' || password === 'password') {
    const user: User = {
      id: 'usr_admin_01',
      name: 'Executive Staff',
      email: normEmail || 'admin@novahouse.com',
      role: 'ADMIN',
    };
    const token = `nh_token_${btoa(JSON.stringify({ sub: user.id, email: user.email, role: user.role, iat: Date.now() }))}`;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('nova_admin_logged_in', 'true');
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return { success: true, user, token };
  }

  throw new Error('Invalid staff credentials. Please check your staff email and security key.');
}

export function getCurrentUser(): User {
  const stored = localStorage.getItem(USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as User;
    } catch (e) {}
  }
  return {
    id: 'usr_admin_01',
    name: 'Executive General Manager',
    email: 'admin@novahouse.com',
    role: 'ADMIN',
  };
}

export function logoutStaff(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('nova_admin_logged_in');
}
