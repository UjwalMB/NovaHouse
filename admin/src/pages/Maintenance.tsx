import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  DollarSign,
  UserCheck,
  Eye,
  Check,
  Building,
} from 'lucide-react';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import FilterBar from '../components/ui/FilterBar';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable, { Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';
import { useToast } from '../components/ui/Toast';
import { useRooms } from '../hooks/useRooms';
import {
  getMaintenanceRequests,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
} from '../services/maintenanceService';
import { MaintenanceRequest, TaskPriority } from '../types';

export default function Maintenance() {
  const { addToast } = useToast();
  const { rooms, refresh: refreshRooms } = useRooms();

  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals & Drawers
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<MaintenanceRequest | null>(null);

  // Form State
  const [form, setForm] = useState({
    roomNumber: '101',
    category: 'HVAC' as MaintenanceRequest['category'],
    issue: '',
    description: '',
    priority: 'Medium' as TaskPriority,
    assignedStaff: 'Karan Mehra (Chief Engineer)',
    estimatedCost: 1500,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getMaintenanceRequests();
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute KPI cards
  const openCount = requests.filter((r) => r.status === 'Open').length;
  const inProgressCount = requests.filter((r) => r.status === 'In Progress').length;
  const completedCount = requests.filter((r) => r.status === 'Completed').length;
  const criticalCount = requests.filter((r) => (r.priority === 'Critical' || r.priority === 'High') && r.status !== 'Completed').length;
  const totalCost = requests.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.roomNumber.toLowerCase().includes(q) ||
        r.issue.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.assignedStaff.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'all' || r.status.toLowerCase() === statusFilter.toLowerCase();
      const matchPriority = priorityFilter === 'all' || r.priority.toLowerCase() === priorityFilter.toLowerCase();
      const matchCat = categoryFilter === 'all' || r.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchSearch && matchStatus && matchPriority && matchCat;
    });
  }, [requests, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  // Submit new request
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.issue.trim()) return;

    const newReq = await createMaintenanceRequest(form);
    setRequests([newReq, ...requests]);
    addToast(`Maintenance ticket #${newReq.id} logged for Room #${newReq.roomNumber}.`);
    setIsNewModalOpen(false);
    setForm({
      roomNumber: '101',
      category: 'HVAC',
      issue: '',
      description: '',
      priority: 'Medium',
      assignedStaff: 'Karan Mehra (Chief Engineer)',
      estimatedCost: 1500,
    });
    refreshRooms();
  };

  // Status transitions
  const handleUpdateStatus = async (id: string, newStatus: MaintenanceRequest['status']) => {
    const updated = await updateMaintenanceRequest(id, { status: newStatus });
    if (updated) {
      setRequests(requests.map((r) => (r.id === id ? updated : r)));
      if (selectedReq?.id === id) setSelectedReq(updated);
      addToast(`Ticket #${id} marked as ${newStatus}.`);
      refreshRooms();
    }
  };

  const columns: Column<MaintenanceRequest>[] = [
    {
      header: 'Ticket & Room',
      key: 'roomNumber',
      render: (r) => (
        <div>
          <span className="font-mono text-xs font-bold text-[#111111] block">Key #{r.roomNumber}</span>
          <span className="text-[10px] text-[#A58A5C] font-mono">#{r.id}</span>
        </div>
      ),
    },
    {
      header: 'Category',
      key: 'category',
      render: (r) => (
        <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#ECE8E0] text-[10px] font-mono text-[#55514B] rounded-xs">
          {r.category}
        </span>
      ),
    },
    {
      header: 'Issue / Description',
      key: 'issue',
      render: (r) => (
        <div className="max-w-xs space-y-0.5">
          <span className="font-medium text-xs text-[#111111] block line-clamp-1">{r.issue}</span>
          <span className="text-[11px] text-[#77736C] line-clamp-1">{r.description}</span>
        </div>
      ),
    },
    {
      header: 'Priority',
      key: 'priority',
      render: (r) => {
        let bg = 'bg-gray-100 text-gray-700 border-gray-200';
        if (r.priority === 'Critical') bg = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
        if (r.priority === 'High') bg = 'bg-amber-100 text-amber-800 border-amber-300';
        if (r.priority === 'Medium') bg = 'bg-blue-50 text-blue-700 border-blue-200';
        return (
          <span className={`px-2 py-0.5 text-[10px] font-mono rounded-xs border ${bg}`}>
            {r.priority}
          </span>
        );
      },
    },
    {
      header: 'Engineer',
      key: 'assignedStaff',
      render: (r) => (
        <span className="text-xs font-mono text-[#55514B] flex items-center gap-1.5">
          <UserCheck size={12} className="text-[#A58A5C]" />
          <span>{r.assignedStaff}</span>
        </span>
      ),
    },
    {
      header: 'Created Date',
      key: 'createdDate',
      render: (r) => <span className="text-xs font-mono text-[#77736C]">{r.createdDate}</span>,
    },
    {
      header: 'Status',
      key: 'status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {r.status === 'Open' && (
            <button
              onClick={() => handleUpdateStatus(r.id, 'In Progress')}
              className="px-2 py-1 text-[10px] font-mono font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xs transition-colors cursor-pointer"
            >
              Start
            </button>
          )}

          {r.status === 'In Progress' && (
            <button
              onClick={() => handleUpdateStatus(r.id, 'Completed')}
              className="px-2 py-1 text-[10px] font-mono font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <CheckCircle2 size={11} />
              <span>Resolve</span>
            </button>
          )}

          <button
            onClick={() => setSelectedReq(r)}
            className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs"
            title="Inspect Details"
          >
            <Eye size={15} />
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
            Engineering & Facility Assets
          </span>
          <h1 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Maintenance Management
          </h1>
          <p className="text-xs text-[#77736C] mt-1">
            Track infrastructure maintenance requests, HVAC, acoustics, plumbing repairs, and room availability locks.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setIsNewModalOpen(true)}
        >
          Create Repair Request
        </Button>
      </div>

      {/* KPI TILES (Open requests, In progress, Completed, Critical/High Priority) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="admin-card p-4 border-l-4 border-amber-500">
          <span className="font-mono text-[10px] uppercase text-[#77736C] block">Open Tickets</span>
          <span className="font-serif text-2xl font-light text-amber-800">{openCount} Pending</span>
          <span className="text-[10px] text-[#77736C] block mt-1">Awaiting dispatch</span>
        </div>

        <div className="admin-card p-4 border-l-4 border-blue-500">
          <span className="font-mono text-[10px] uppercase text-[#77736C] block">In Progress</span>
          <span className="font-serif text-2xl font-light text-blue-800">{inProgressCount} Under Repair</span>
          <span className="text-[10px] text-[#77736C] block mt-1">Technicians on site</span>
        </div>

        <div className="admin-card p-4 border-l-4 border-emerald-600">
          <span className="font-mono text-[10px] uppercase text-[#77736C] block">Resolved & Closed</span>
          <span className="font-serif text-2xl font-light text-emerald-800">{completedCount} Fixed</span>
          <span className="text-[10px] text-[#77736C] block mt-1">Rooms returned to inventory</span>
        </div>

        <div className="admin-card p-4 border-l-4 border-rose-600">
          <span className="font-mono text-[10px] uppercase text-[#77736C] block">Critical / High Priority</span>
          <span className="font-serif text-2xl font-light text-rose-800">{criticalCount} Urgent</span>
          <span className="text-[10px] text-[#77736C] block mt-1">Impacts guest stay / room lock</span>
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="admin-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search room number, issue, engineer..."
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select text-xs font-mono !py-1.5"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="form-select text-xs font-mono !py-1.5"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-select text-xs font-mono !py-1.5"
          >
            <option value="all">All Categories</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="HVAC">HVAC</option>
            <option value="Carpentry">Carpentry</option>
            <option value="Audio/Visual">Audio/Visual</option>
            <option value="Appliance">Appliance</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="admin-card">
        <DataTable
          columns={columns}
          data={filteredRequests}
          loading={loading}
          onRowClick={(r) => setSelectedReq(r)}
        />
      </div>

      {/* New Maintenance Ticket Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Log Engineering Repair Ticket"
        subtitle="Facility Issue Tracking"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="form-group !mb-0">
              <label className="form-label">Room Number</label>
              <select
                value={form.roomNumber}
                onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                className="form-select text-xs font-mono"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.roomNumber}>
                    Key #{r.roomNumber} · {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Trade Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                className="form-select text-xs font-mono"
              >
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="HVAC">HVAC</option>
                <option value="Carpentry">Carpentry</option>
                <option value="Audio/Visual">Audio/Visual</option>
                <option value="Appliance">Appliance</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group !mb-0 col-span-2">
              <label className="form-label">Issue Headline</label>
              <input
                type="text"
                required
                value={form.issue}
                onChange={(e) => setForm({ ...form, issue: e.target.value })}
                placeholder="e.g. Balcony smart louvre motor stutter"
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0 col-span-2">
              <label className="form-label">Detailed Engineering Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Observed symptoms, error codes, affected fixtures..."
                className="form-textarea text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Priority Level</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                className="form-select text-xs font-mono"
              >
                <option value="Low">Low (Cosmetic/Touch-up)</option>
                <option value="Medium">Medium (Preventative)</option>
                <option value="High">High (Immediate repair)</option>
                <option value="Critical">Critical (Locks room from inventory)</option>
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Assigned Chief Engineer</label>
              <input
                type="text"
                value={form.assignedStaff}
                onChange={(e) => setForm({ ...form, assignedStaff: e.target.value })}
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0 col-span-2">
              <label className="form-label">Estimated Repair Cost (₹)</label>
              <input
                type="number"
                value={form.estimatedCost}
                onChange={(e) => setForm({ ...form, estimatedCost: Number(e.target.value) })}
                className="form-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE8E0]">
            <Button variant="secondary" size="sm" onClick={() => setIsNewModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Dispatch Ticket
            </Button>
          </div>
        </form>
      </Modal>

      {/* Ticket Details Drawer */}
      <Drawer
        isOpen={Boolean(selectedReq)}
        onClose={() => setSelectedReq(null)}
        title={selectedReq ? `Maintenance Ticket #${selectedReq.id}` : ''}
        subtitle={selectedReq ? `Room Key #${selectedReq.roomNumber} · ${selectedReq.category}` : ''}
      >
        {selectedReq && (
          <div className="space-y-6">
            <div className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-serif text-base font-medium text-[#111111]">{selectedReq.issue}</span>
                <StatusBadge status={selectedReq.status} />
              </div>
              <p className="text-xs text-[#77736C] leading-relaxed">{selectedReq.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-white border border-[#ECE8E0] rounded-xs">
                <span className="text-[#77736C] text-[10px] uppercase block">Assigned Engineer</span>
                <span className="font-semibold text-[#111111] block mt-0.5">{selectedReq.assignedStaff}</span>
              </div>

              <div className="p-3 bg-white border border-[#ECE8E0] rounded-xs">
                <span className="text-[#77736C] text-[10px] uppercase block">Priority Level</span>
                <span className="font-semibold text-[#111111] block mt-0.5">{selectedReq.priority}</span>
              </div>

              <div className="p-3 bg-white border border-[#ECE8E0] rounded-xs">
                <span className="text-[#77736C] text-[10px] uppercase block">Created Date</span>
                <span className="font-semibold text-[#111111] block mt-0.5">{selectedReq.createdDate}</span>
              </div>

              <div className="p-3 bg-white border border-[#ECE8E0] rounded-xs">
                <span className="text-[#77736C] text-[10px] uppercase block">Estimated Parts / Cost</span>
                <span className="font-semibold text-[#111111] block mt-0.5">₹ {selectedReq.estimatedCost?.toLocaleString()}</span>
              </div>
            </div>

            {selectedReq.completedDate && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs rounded-xs text-emerald-900">
                Resolved & Verified by Engineering on <strong>{selectedReq.completedDate}</strong>.
              </div>
            )}

            <div className="pt-4 border-t border-[#ECE8E0] space-y-3">
              <span className="font-mono text-xs text-[#77736C] block">Update Ticket Status:</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedReq.id, 'In Progress')}
                >
                  Mark In Progress
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={CheckCircle2}
                  onClick={() => handleUpdateStatus(selectedReq.id, 'Completed')}
                >
                  Mark Completed & Release Room
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
