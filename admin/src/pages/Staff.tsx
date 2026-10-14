import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';
import { initialStaff, staffRoles } from '../data/staff';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable, { Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { StaffMember } from '../types';

const rolePermissionsMap: Record<string, string> = {
  'Super Admin': 'Full unrestricted access to financial metrics, staff roles, and website CMS.',
  'Hotel Manager': 'Operational oversight of bookings, room tariffs, staff shifts, and guest CRM.',
  'Reception': 'Front desk check-ins, guest arrivals/departures, room key allocation.',
  'Reservations': 'Central bookings management, tariff inquiries, cancellation handling.',
  'Content Manager': 'Digital website CMS, gallery uploads, dining menus, and packages.',
};

export default function Staff() {
  const { addToast } = useToast();
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaff);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Reception',
    department: 'Front Office',
    status: 'Active',
  });

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setStaffForm({
      name: '',
      email: '',
      phone: '',
      role: 'Reception',
      department: 'Front Office',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: StaffMember) => {
    setEditingStaff(s);
    setStaffForm({
      name: s.name,
      email: s.email,
      phone: s.phone,
      role: s.role,
      department: s.department,
      status: s.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Revoke portal access for ${name}?`)) {
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      addToast(`Staff access revoked for ${name}.`);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff) {
      setStaffList((prev) =>
        prev.map((s) => (s.id === editingStaff.id ? { ...s, ...staffForm } : s))
      );
      addToast(`Staff profile for ${staffForm.name} updated.`);
    } else {
      const created: StaffMember = {
        ...staffForm,
        id: `STF-${Date.now()}`,
        lastActive: 'Invited just now',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      };
      setStaffList([created, ...staffList]);
      addToast(`Staff member ${staffForm.name} added.`);
    }
    setIsModalOpen(false);
  };

  const columns: Column<StaffMember>[] = [
    {
      header: 'Staff Member',
      key: 'name',
      render: (s: StaffMember) => (
        <div className="flex items-center gap-3">
          <img
            src={s.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
            alt={s.name}
            className="w-8 h-8 rounded-full object-cover border border-[#E2DDD5]"
          />
          <div>
            <div className="font-medium text-[#111111]">{s.name}</div>
            <div className="text-[10px] text-[#77736C] font-mono">{s.department}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Email Address',
      key: 'email',
      render: (s: StaffMember) => <span className="font-mono text-xs">{s.email}</span>,
    },
    {
      header: 'Phone',
      key: 'phone',
      render: (s: StaffMember) => <span className="font-mono text-xs">{s.phone}</span>,
    },
    {
      header: 'Assigned Role',
      key: 'role',
      render: (s: StaffMember) => (
        <span className="font-mono text-xs font-semibold text-[#A58A5C] bg-[#F6F2EA] px-2.5 py-1 rounded-xs border border-[#A58A5C]/20">
          {s.role}
        </span>
      ),
    },
    {
      header: 'Last Active',
      key: 'lastActive',
      render: (s: StaffMember) => <span className="font-mono text-xs text-[#77736C]">{s.lastActive}</span>,
    },
    {
      header: 'Status',
      key: 'status',
      render: (s: StaffMember) => <StatusBadge status={s.status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (s: StaffMember) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenEdit(s)}
            className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs"
            title="Edit Role & Permissions"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDelete(s.id, s.name)}
            className="p-1.5 text-[#77736C] hover:text-[#962828] hover:bg-[#FDF0F0] rounded-xs"
            title="Revoke Access"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Access Control & Governance
          </span>
          <h2 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Staff & Role Permissions
          </h2>
          <p className="text-xs text-[#77736C] mt-1">
            Manage authorized staff members, role boundaries, and portal access privileges.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
          Grant Staff Access
        </Button>
      </div>

      {/* Role Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffRoles.map((role) => (
          <div key={role} className="admin-card p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-serif text-sm font-semibold text-[#111111]">{role}</span>
              <span className="font-mono text-[10px] text-[#A58A5C]">
                {staffList.filter((s) => s.role === role).length} Members
              </span>
            </div>
            <p className="text-[11px] text-[#77736C] leading-relaxed">
              {rolePermissionsMap[role]}
            </p>
          </div>
        ))}
      </div>

      {/* Staff Table */}
      <div className="admin-card">
        <DataTable
          columns={columns}
          data={staffList}
          onRowClick={(s) => handleOpenEdit(s)}
        />
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? `Edit ${staffForm.name}` : 'Grant Portal Access'}
        subtitle="Staff Role Administration"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group !mb-0">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                required
                value={staffForm.name}
                onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                className="form-input text-xs"
                placeholder="e.g. Maya Deshmukh"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Work Email</label>
              <input
                type="email"
                required
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                className="form-input text-xs font-mono"
                placeholder="staff@novahouse.example"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                value={staffForm.phone}
                onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                className="form-input text-xs font-mono"
                placeholder="+91 98450 00106"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Assigned Role</label>
              <select
                value={staffForm.role}
                onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                className="form-select text-xs font-mono"
              >
                {staffRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group !mb-0">
              <label className="form-label">Department</label>
              <input
                type="text"
                value={staffForm.department}
                onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Access Status</label>
              <select
                value={staffForm.status}
                onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}
                className="form-select text-xs font-mono"
              >
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs text-xs font-mono">
            <span className="text-[#A58A5C] font-semibold block mb-0.5">Role Permission Scope:</span>
            <span className="text-[#77736C] font-sans">{rolePermissionsMap[staffForm.role]}</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ECE8E0]">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingStaff ? 'Update Permissions' : 'Issue Credentials'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
