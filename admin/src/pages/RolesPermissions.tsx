import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Shield,
  Plus,
  Edit2,
  Check,
  X,
  Users,
  Lock,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';
import { useToast } from '../components/ui/Toast';
import { getRoles, createRole, updateRole } from '../services/staffService';
import { RolePermission } from '../types';

const moduleKeys: { key: keyof RolePermission['permissions']; label: string; category: string }[] = [
  { key: 'dashboard', label: 'Dashboard', category: 'MAIN' },
  { key: 'bookings', label: 'Bookings', category: 'MAIN' },
  { key: 'rooms', label: 'Rooms Inventory', category: 'MAIN' },
  { key: 'guests', label: 'Guests CRM', category: 'MAIN' },
  { key: 'availability', label: 'Availability', category: 'MAIN' },
  { key: 'pricing', label: 'Tariffs & Pricing', category: 'MAIN' },
  { key: 'housekeeping', label: 'Housekeeping', category: 'HOTEL OPERATIONS' },
  { key: 'maintenance', label: 'Maintenance', category: 'HOTEL OPERATIONS' },
  { key: 'dining', label: 'Dining (Tables & Menu)', category: 'HOTEL OPERATIONS' },
  { key: 'experiences', label: 'Experiences & Spa', category: 'HOTEL OPERATIONS' },
  { key: 'offers', label: 'Offers & Promos', category: 'HOTEL OPERATIONS' },
  { key: 'documents', label: 'Guest Documents', category: 'GUEST EXPERIENCE' },
  { key: 'communications', label: 'Guest Communication', category: 'GUEST EXPERIENCE' },
  { key: 'reviews', label: 'Guest Reviews', category: 'GUEST EXPERIENCE' },
  { key: 'enquiries', label: 'Inbound Enquiries', category: 'GUEST EXPERIENCE' },
  { key: 'payments', label: 'Payments & Gateway', category: 'FINANCE' },
  { key: 'invoices', label: 'Invoices Billing', category: 'FINANCE' },
  { key: 'settlements', label: 'Bank Settlements', category: 'FINANCE' },
  { key: 'analytics', label: 'Reports & Analytics', category: 'ANALYTICS' },
  { key: 'staff', label: 'Staff Management', category: 'MANAGEMENT' },
  { key: 'settings', label: 'System Settings', category: 'SYSTEM' },
];

export default function RolesPermissions() {
  const { addToast } = useToast();
  const [roles, setRoles] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [isNewRoleOpen, setIsNewRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RolePermission | null>(null);

  // Form State
  const [roleForm, setRoleForm] = useState({
    roleName: '',
    description: '',
    permissions: moduleKeys.reduce((acc, m) => ({ ...acc, [m.key]: false }), {} as RolePermission['permissions']),
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setRoleForm({
      roleName: '',
      description: '',
      permissions: moduleKeys.reduce((acc, m) => ({ ...acc, [m.key]: false }), {} as RolePermission['permissions']),
    });
    setIsNewRoleOpen(true);
  };

  const handleOpenEdit = (role: RolePermission) => {
    setSelectedRole(role);
    setRoleForm({
      roleName: role.roleName,
      description: role.description,
      permissions: { ...role.permissions },
    });
  };

  const handleTogglePerm = (key: keyof RolePermission['permissions']) => {
    setRoleForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key],
      },
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.roleName.trim()) return;

    const newRole = await createRole(roleForm);
    setRoles([...roles, newRole]);
    addToast(`Role profile "${newRole.roleName}" established.`);
    setIsNewRoleOpen(false);
  };

  const handleUpdateSubmit = async () => {
    if (!selectedRole) return;
    const updated = await updateRole(selectedRole.id, roleForm);
    if (updated) {
      setRoles(roles.map((r) => (r.id === selectedRole.id ? updated : r)));
      addToast(`Permissions matrix for "${updated.roleName}" saved.`);
      setSelectedRole(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Governance & Role-Based Access Control (RBAC)
          </span>
          <h1 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Roles & Permissions
          </h1>
          <p className="text-xs text-[#77736C] mt-1">
            Configure fine-grained module access for Hotel Managers, Front Desk, Housekeeping, Dining, and Accounts.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={handleOpenAdd}
        >
          Create Custom Role
        </Button>
      </div>

      {/* Role Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.id} className="admin-card p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-lg font-medium text-[#111111]">{role.roleName}</h3>
                  <span className="text-[10px] text-[#A58A5C] font-mono">Role ID: #{role.id}</span>
                </div>
                <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#ECE8E0] text-[10px] font-mono text-[#55514B] rounded-xs flex items-center gap-1">
                  <Users size={11} />
                  <span>{role.userCount} Assigned</span>
                </span>
              </div>
              <p className="text-xs text-[#77736C] leading-relaxed min-h-[36px]">
                {role.description}
              </p>
            </div>

            <div className="pt-3 border-t border-[#ECE8E0] flex items-center justify-between text-xs font-mono">
              <span className="text-[#77736C]">
                {Object.values(role.permissions).filter(Boolean).length} of {moduleKeys.length} Modules Allowed
              </span>
              <button
                onClick={() => handleOpenEdit(role)}
                className="text-[#A58A5C] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
              >
                <Edit2 size={12} />
                <span>Configure Matrix</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Complete Permissions Matrix Table */}
      <div className="admin-card overflow-hidden">
        <div className="admin-card-header">
          <div>
            <span className="font-mono text-[10px] uppercase text-[#A58A5C] tracking-widest block">Access Matrix</span>
            <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
              System Module Permission Grid
            </h3>
          </div>
          <span className="text-xs font-mono text-[#77736C]">Live Security Enforcement Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-[#ECE8E0] bg-[#FAF8F5] text-left text-[10px] uppercase text-[#77736C]">
                <th className="p-3 w-64">PMS Module</th>
                <th className="p-3">Section</th>
                {roles.map((r) => (
                  <th key={r.id} className="p-3 text-center">
                    {r.roleName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE8E0]">
              {moduleKeys.map((mod) => (
                <tr key={mod.key} className="hover:bg-[#FAF8F5]/50">
                  <td className="p-3 font-semibold text-[#111111]">{mod.label}</td>
                  <td className="p-3 text-[10px] text-[#A58A5C] font-semibold">{mod.category}</td>
                  {roles.map((role) => {
                    const hasAccess = role.permissions[mod.key];
                    return (
                      <td key={role.id} className="p-3 text-center">
                        {hasAccess ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800">
                            <Check size={12} />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-400">
                            <X size={12} />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Role Modal */}
      <Modal
        isOpen={isNewRoleOpen}
        onClose={() => setIsNewRoleOpen(false)}
        title="Establish Access Tier Role"
        subtitle="NOVA HOUSE · RBAC Governance"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="space-y-3 text-xs">
            <div className="form-group !mb-0">
              <label className="form-label">Role Title</label>
              <input
                type="text"
                required
                value={roleForm.roleName}
                onChange={(e) => setRoleForm({ ...roleForm, roleName: e.target.value })}
                placeholder="e.g. Concierge Lead"
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Scope & Responsibilities Description</label>
              <textarea
                rows={2}
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                placeholder="Operational oversight over guest experiences and check-ins..."
                className="form-textarea text-xs"
              />
            </div>
          </div>

          <div className="pt-2">
            <span className="font-mono text-xs text-[#A58A5C] uppercase block mb-2 font-bold">
              Select Permitted Modules
            </span>
            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto">
              {moduleKeys.map((mod) => (
                <button
                  type="button"
                  key={mod.key}
                  onClick={() => handleTogglePerm(mod.key)}
                  className={`flex items-center gap-2 p-2 rounded-xs border text-xs text-left cursor-pointer transition-colors ${
                    roleForm.permissions[mod.key]
                      ? 'border-[#A58A5C] bg-[#FAF8F5] text-[#111111] font-semibold'
                      : 'border-[#ECE8E0] text-[#77736C] hover:border-[#CDC7BC]'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center text-[10px] ${
                      roleForm.permissions[mod.key] ? 'bg-[#A58A5C] text-white' : 'border border-gray-300'
                    }`}
                  >
                    {roleForm.permissions[mod.key] && <Check size={10} />}
                  </div>
                  <span>{mod.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE8E0]">
            <Button variant="secondary" size="sm" onClick={() => setIsNewRoleOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Role Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Drawer */}
      <Drawer
        isOpen={Boolean(selectedRole)}
        onClose={() => setSelectedRole(null)}
        title={selectedRole ? `Configure Permissions · ${selectedRole.roleName}` : ''}
        subtitle="Module Access Matrix"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setSelectedRole(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpdateSubmit}>
              Apply Matrix Updates
            </Button>
          </>
        }
      >
        {selectedRole && (
          <div className="space-y-6">
            <div className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-2">
              <span className="font-serif text-base font-medium text-[#111111] block">{roleForm.roleName}</span>
              <p className="text-xs text-[#77736C]">{roleForm.description}</p>
            </div>

            <div className="space-y-3">
              <span className="font-mono text-xs uppercase tracking-wider text-[#A58A5C] font-bold block">
                Toggle Authorized Modules
              </span>
              <div className="space-y-1.5 divide-y divide-[#ECE8E0]">
                {moduleKeys.map((mod) => {
                  const allowed = roleForm.permissions[mod.key];
                  return (
                    <div
                      key={mod.key}
                      onClick={() => handleTogglePerm(mod.key)}
                      className="py-2.5 flex items-center justify-between cursor-pointer group"
                    >
                      <div>
                        <span className="text-xs font-semibold text-[#111111] block group-hover:text-[#A58A5C]">
                          {mod.label}
                        </span>
                        <span className="text-[10px] font-mono text-[#77736C] uppercase">{mod.category}</span>
                      </div>
                      <div
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                          allowed ? 'bg-[#A58A5C]' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                            allowed ? 'left-4.5' : 'left-0.5'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
