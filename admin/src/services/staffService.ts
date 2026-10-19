import { StaffMember, RolePermission, ActivityLog } from '../types';
import { initialStaff, initialRolePermissions, initialActivityLogs } from '../data/staff';

const STAFF_KEY = 'nova_admin_staff_list';
const ROLES_KEY = 'nova_admin_roles_list';
const LOGS_KEY = 'nova_admin_activity_logs';

function getStoredStaff(): StaffMember[] {
  const s = localStorage.getItem(STAFF_KEY);
  if (s) {
    try { return JSON.parse(s); } catch (e) {}
  }
  localStorage.setItem(STAFF_KEY, JSON.stringify(initialStaff));
  return [...initialStaff];
}

function saveStoredStaff(staff: StaffMember[]) {
  localStorage.setItem(STAFF_KEY, JSON.stringify(staff));
}

function getStoredRoles(): RolePermission[] {
  const s = localStorage.getItem(ROLES_KEY);
  if (s) {
    try { return JSON.parse(s); } catch (e) {}
  }
  localStorage.setItem(ROLES_KEY, JSON.stringify(initialRolePermissions));
  return [...initialRolePermissions];
}

function saveStoredRoles(roles: RolePermission[]) {
  localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
}

function getStoredLogs(): ActivityLog[] {
  const s = localStorage.getItem(LOGS_KEY);
  if (s) {
    try { return JSON.parse(s); } catch (e) {}
  }
  localStorage.setItem(LOGS_KEY, JSON.stringify(initialActivityLogs));
  return [...initialActivityLogs];
}

function saveStoredLogs(logs: ActivityLog[]) {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export async function getStaffList(): Promise<StaffMember[]> {
  return getStoredStaff();
}

export async function createStaffMember(member: Partial<StaffMember>): Promise<StaffMember> {
  const list = getStoredStaff();
  const newStaff: StaffMember = {
    id: `STF-0${list.length + 1}`,
    name: member.name || 'New Staff Member',
    email: member.email || 'staff@novahouse.example',
    phone: member.phone || '+91 98450 00000',
    role: member.role || 'Staff',
    department: member.department || 'Hotel Operations',
    status: member.status || 'Active',
    lastActive: 'Just registered',
    avatar: member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    ...member,
  };
  const updated = [newStaff, ...list];
  saveStoredStaff(updated);
  await logActivity('Staff Registered', 'Staff', `Registered new staff member ${newStaff.name} as ${newStaff.role}`);
  return newStaff;
}

export async function updateStaffMember(id: string, updates: Partial<StaffMember>): Promise<StaffMember | null> {
  const list = getStoredStaff();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...updates };
  saveStoredStaff(list);
  await logActivity('Staff Updated', 'Staff', `Updated details for staff member ${list[idx].name}`);
  return list[idx];
}

export async function deleteStaffMember(id: string): Promise<boolean> {
  const list = getStoredStaff();
  const found = list.find((s) => s.id === id);
  const filtered = list.filter((s) => s.id !== id);
  saveStoredStaff(filtered);
  if (found) {
    await logActivity('Staff Removed', 'Staff', `Removed staff member ${found.name}`);
  }
  return true;
}

export async function getRoles(): Promise<RolePermission[]> {
  return getStoredRoles();
}

export async function createRole(role: Partial<RolePermission>): Promise<RolePermission> {
  const roles = getStoredRoles();
  const newRole: RolePermission = {
    id: `ROLE-0${roles.length + 1}`,
    roleName: role.roleName || 'Custom Role',
    description: role.description || 'Custom access tier permissions',
    userCount: 0,
    permissions: role.permissions || {
      dashboard: true, bookings: false, rooms: false, guests: false, availability: false,
      pricing: false, housekeeping: false, maintenance: false, dining: false, experiences: false,
      offers: false, documents: false, communications: false, reviews: false, enquiries: false,
      payments: false, invoices: false, settlements: false, analytics: false, staff: false, settings: false,
    },
    ...role,
  };
  const updated = [...roles, newRole];
  saveStoredRoles(updated);
  await logActivity('Role Created', 'Roles & Permissions', `Created new role profile: ${newRole.roleName}`);
  return newRole;
}

export async function updateRole(id: string, updates: Partial<RolePermission>): Promise<RolePermission | null> {
  const roles = getStoredRoles();
  const idx = roles.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  roles[idx] = { ...roles[idx], ...updates };
  saveStoredRoles(roles);
  await logActivity('Role Updated', 'Roles & Permissions', `Modified permission matrix for ${roles[idx].roleName}`);
  return roles[idx];
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  return getStoredLogs();
}

export async function logActivity(action: string, module: string, details: string, user = 'Admin', role = 'Super Admin'): Promise<void> {
  const logs = getStoredLogs();
  const newLog: ActivityLog = {
    id: `ACT-${Date.now().toString().slice(-4)}`,
    user,
    role,
    action,
    module,
    details,
    timestamp: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
    ipAddress: '192.168.1.1',
  };
  saveStoredLogs([newLog, ...logs.slice(0, 99)]);
}
