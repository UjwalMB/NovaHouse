import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Package,
  Eye,
  Check,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
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
  getHousekeepingTasks,
  createHousekeepingTask,
  updateHousekeepingTask,
  deleteHousekeepingTask,
  getLostAndFound,
  addLostAndFound,
  updateLostAndFound,
} from '../services/housekeepingService';
import {
  HousekeepingTask,
  LostAndFoundItem,
  HousekeepingStatus,
  TaskPriority,
  TaskStatus,
} from '../types';

export default function Housekeeping() {
  const { addToast } = useToast();
  const { rooms, refresh: refreshRooms } = useRooms();

  const [activeTab, setActiveTab] = useState<'tasks' | 'lostFound'>('tasks');
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [lostFound, setLostFound] = useState<LostAndFoundItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Modals & Drawers
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewLFOpen, setIsNewLFOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null);

  // Forms
  const [taskForm, setTaskForm] = useState({
    roomNumber: '101',
    taskType: 'Daily Turnover' as HousekeepingTask['taskType'],
    assignedStaff: 'Lakshmi Devi (Senior Housekeeper)',
    priority: 'Medium' as TaskPriority,
    roomStatus: 'Dirty' as HousekeepingStatus,
    scheduledTime: '11:00 AM',
    notes: '',
  });

  const [lfForm, setLfForm] = useState({
    item: '',
    locationFound: 'Room 201',
    foundBy: 'Housekeeping Staff',
    guestName: '',
    guestPhone: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [tList, lfList] = await Promise.all([
        getHousekeepingTasks(),
        getLostAndFound(),
      ]);
      setTasks(tList);
      setLostFound(lfList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live room status rack counts
  const cleanCount = rooms.filter((r) => r.status === 'Available').length;
  const dirtyCount = tasks.filter((t) => t.roomStatus === 'Dirty' && t.status !== 'Completed').length;
  const cleaningCount = tasks.filter((t) => t.status === 'In Progress').length;
  const inspectedCount = tasks.filter((t) => t.status === 'Inspected').length;
  const outOfServiceCount = rooms.filter((r) => r.status === 'Maintenance').length;

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.roomNumber.toLowerCase().includes(q) ||
        t.assignedStaff.toLowerCase().includes(q) ||
        t.taskType.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'all' || t.status.toLowerCase() === statusFilter.toLowerCase();
      const matchPriority = priorityFilter === 'all' || t.priority.toLowerCase() === priorityFilter.toLowerCase();

      return matchSearch && matchStatus && matchPriority;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  // Handle Task Actions
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const selRoom = rooms.find((r) => r.roomNumber === taskForm.roomNumber);
    const created = await createHousekeepingTask({
      ...taskForm,
      roomType: selRoom?.type || 'Deluxe Room',
      status: 'Pending',
    });
    setTasks([created, ...tasks]);
    addToast(`Housekeeping task allocated for Room #${created.roomNumber}.`);
    setIsNewTaskOpen(false);
    refreshRooms();
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus, newRoomStatus?: HousekeepingStatus) => {
    const updates: Partial<HousekeepingTask> = { status: newStatus };
    if (newRoomStatus) updates.roomStatus = newRoomStatus;
    if (newStatus === 'Completed') updates.roomStatus = 'Clean';
    if (newStatus === 'Inspected') updates.roomStatus = 'Inspected';

    const updated = await updateHousekeepingTask(taskId, updates);
    if (updated) {
      setTasks(tasks.map((t) => (t.id === taskId ? updated : t)));
      if (selectedTask?.id === taskId) setSelectedTask(updated);
      addToast(`Task #${taskId} updated to ${newStatus}.`);
      refreshRooms();
    }
  };

  const handleToggleChecklist = async (taskId: string, itemIndex: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newChecklist = task.checklist.map((c, i) => (i === itemIndex ? { ...c, completed: !c.completed } : c));
    const updated = await updateHousekeepingTask(taskId, { checklist: newChecklist });
    if (updated) {
      setTasks(tasks.map((t) => (t.id === taskId ? updated : t)));
      if (selectedTask?.id === taskId) setSelectedTask(updated);
    }
  };

  // Lost and found
  const handleAddLF = async (e: React.FormEvent) => {
    e.preventDefault();
    const newItem = await addLostAndFound({
      ...lfForm,
      foundDate: new Date().toISOString().split('T')[0],
      status: 'Stored',
    });
    setLostFound([newItem, ...lostFound]);
    addToast(`Item "${newItem.item}" recorded in Lost & Found.`);
    setIsNewLFOpen(false);
  };

  const handleClaimLF = async (id: string) => {
    const updated = await updateLostAndFound(id, {
      status: 'Claimed',
      claimedDate: new Date().toISOString().split('T')[0],
    });
    if (updated) {
      setLostFound(lostFound.map((i) => (i.id === id ? updated : i)));
      addToast(`Item marked as Claimed by guest.`);
    }
  };

  const taskColumns: Column<HousekeepingTask>[] = [
    {
      header: 'Room',
      key: 'roomNumber',
      render: (t) => (
        <div>
          <span className="font-mono text-xs font-bold text-[#111111] block">Room #{t.roomNumber}</span>
          <span className="text-[10px] text-[#77736C] font-mono">{t.roomType}</span>
        </div>
      ),
    },
    {
      header: 'Task Type',
      key: 'taskType',
      render: (t) => <span className="font-medium text-xs text-[#111111]">{t.taskType}</span>,
    },
    {
      header: 'Assigned Staff',
      key: 'assignedStaff',
      render: (t) => (
        <span className="text-xs font-mono text-[#55514B] flex items-center gap-1.5">
          <UserCheck size={12} className="text-[#A58A5C]" />
          <span>{t.assignedStaff}</span>
        </span>
      ),
    },
    {
      header: 'Priority',
      key: 'priority',
      render: (t) => {
        let bg = 'bg-gray-100 text-gray-700 border-gray-200';
        if (t.priority === 'Critical') bg = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
        if (t.priority === 'High') bg = 'bg-amber-100 text-amber-800 border-amber-300';
        if (t.priority === 'Medium') bg = 'bg-blue-50 text-blue-700 border-blue-200';
        return (
          <span className={`px-2 py-0.5 text-[10px] font-mono rounded-xs border ${bg}`}>
            {t.priority}
          </span>
        );
      },
    },
    {
      header: 'Room Condition',
      key: 'roomStatus',
      render: (t) => <StatusBadge status={t.roomStatus} />,
    },
    {
      header: 'Task Status',
      key: 'status',
      render: (t) => <StatusBadge status={t.status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (t) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {t.status === 'Pending' && (
            <button
              onClick={() => handleUpdateTaskStatus(t.id, 'In Progress', 'Cleaning')}
              className="px-2 py-1 text-[10px] font-mono font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xs transition-colors cursor-pointer"
            >
              Start
            </button>
          )}

          {t.status === 'In Progress' && (
            <button
              onClick={() => handleUpdateTaskStatus(t.id, 'Completed', 'Clean')}
              className="px-2 py-1 text-[10px] font-mono font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <CheckCircle2 size={11} />
              <span>Complete</span>
            </button>
          )}

          {t.status === 'Completed' && (
            <button
              onClick={() => handleUpdateTaskStatus(t.id, 'Inspected', 'Inspected')}
              className="px-2 py-1 text-[10px] font-mono font-medium text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <ShieldCheck size={11} />
              <span>Inspect</span>
            </button>
          )}

          <button
            onClick={() => setSelectedTask(t)}
            className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs"
            title="Inspect Task & Checklist"
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
            Property Hygiene & Quality Assurance
          </span>
          <h1 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Housekeeping Management
          </h1>
          <p className="text-xs text-[#77736C] mt-1">
            Real-time room turnover tracking, staff allocation, sanitation audits, and lost & found custody.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'tasks' ? (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsNewTaskOpen(true)}
            >
              Assign Cleaning Task
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={Package}
              onClick={() => setIsNewLFOpen(true)}
            >
              Log Lost & Found
            </Button>
          )}
        </div>
      </div>

      {/* DASHBOARD STATUS TILES (Clean, Dirty, Cleaning, Inspected, Out of Service) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="admin-card p-4 border-l-4 border-emerald-600">
          <span className="font-mono text-[10px] uppercase text-[#77736C] block">Clean / Ready</span>
          <span className="font-serif text-2xl font-light text-emerald-800">{cleanCount} Suites</span>
          <span className="text-[10px] text-[#77736C] block mt-1">Inspected & available</span>
        </div>

        <div className="admin-card p-4 border-l-4 border-rose-500">
          <span className="font-mono text-[10px] uppercase text-[#77736C] block">Dirty / Turnover</span>
          <span className="font-serif text-2xl font-light text-rose-800">{dirtyCount} Rooms</span>
          <span className="text-[10px] text-[#77736C] block mt-1">Checkout / turnover due</span>
        </div>

        <div className="admin-card p-4 border-l-4 border-amber-500">
          <span className="font-mono text-[10px] uppercase text-[#77736C] block">Cleaning in Progress</span>
          <span className="font-serif text-2xl font-light text-amber-800">{cleaningCount} In Progress</span>
          <span className="text-[10px] text-[#77736C] block mt-1">Attendants on floor</span>
        </div>

        <div className="admin-card p-4 border-l-4 border-purple-600">
          <span className="font-mono text-[10px] uppercase text-[#77736C] block">Supervised / Inspected</span>
          <span className="font-serif text-2xl font-light text-purple-800">{inspectedCount} Rooms</span>
          <span className="text-[10px] text-[#77736C] block mt-1">Quality audited</span>
        </div>

        <div className="admin-card p-4 border-l-4 border-[#77736C]">
          <span className="font-mono text-[10px] uppercase text-[#77736C] block">Out of Service</span>
          <span className="font-serif text-2xl font-light text-[#111111]">{outOfServiceCount} Offline</span>
          <span className="text-[10px] text-[#77736C] block mt-1">Maintenance hold</span>
        </div>
      </div>

      {/* Primary Tab Navigation: Tasks vs Lost & Found */}
      <div className="flex border-b border-[#ECE8E0] gap-4">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'tasks'
              ? 'border-[#A58A5C] text-[#111111] font-bold'
              : 'border-transparent text-[#77736C] hover:text-[#111111]'
          }`}
        >
          Active Cleaning Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('lostFound')}
          className={`pb-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'lostFound'
              ? 'border-[#A58A5C] text-[#111111] font-bold'
              : 'border-transparent text-[#77736C] hover:text-[#111111]'
          }`}
        >
          Lost & Found Custody ({lostFound.length})
        </button>
      </div>

      {/* TAB 1: Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Search & Filter Row */}
          <div className="admin-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-80">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search room number, staff, task..."
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select text-xs font-mono !py-1.5"
              >
                <option value="all">All Task Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Inspected">Inspected</option>
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
            </div>
          </div>

          <div className="admin-card">
            <DataTable
              columns={taskColumns}
              data={filteredTasks}
              loading={loading}
              onRowClick={(t) => setSelectedTask(t)}
            />
          </div>
        </div>
      )}

      {/* TAB 2: Lost & Found */}
      {activeTab === 'lostFound' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lostFound.map((item) => (
              <div key={item.id} className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-[#A58A5C] block">#{item.id}</span>
                    <span className="font-serif text-base font-medium text-[#111111]">{item.item}</span>
                    <span className="text-xs text-[#77736C] font-mono block">Location: {item.locationFound}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded-xs border ${
                    item.status === 'Claimed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="text-xs font-mono py-2 border-y border-[#E2DDD5] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#77736C]">Found By:</span>
                    <span className="text-[#111111]">{item.foundBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77736C]">Found Date:</span>
                    <span>{item.foundDate}</span>
                  </div>
                  {item.guestName && (
                    <div className="flex justify-between">
                      <span className="text-[#77736C]">Associated Guest:</span>
                      <span className="font-semibold">{item.guestName}</span>
                    </div>
                  )}
                  {item.claimedDate && (
                    <div className="flex justify-between">
                      <span className="text-[#77736C]">Claimed On:</span>
                      <span className="text-emerald-700 font-semibold">{item.claimedDate}</span>
                    </div>
                  )}
                </div>

                {item.status !== 'Claimed' && (
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Check}
                      onClick={() => handleClaimLF(item.id)}
                    >
                      Mark as Claimed
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <Modal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        title="Schedule Housekeeping Task"
        subtitle="Floor Room Allocation"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="form-group !mb-0">
              <label className="form-label">Room Number</label>
              <select
                value={taskForm.roomNumber}
                onChange={(e) => setTaskForm({ ...taskForm, roomNumber: e.target.value })}
                className="form-select text-xs font-mono"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.roomNumber}>
                    Key #{r.roomNumber} · {r.name} ({r.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Task Type</label>
              <select
                value={taskForm.taskType}
                onChange={(e) => setTaskForm({ ...taskForm, taskType: e.target.value as any })}
                className="form-select text-xs font-mono"
              >
                <option>Daily Turnover</option>
                <option>Deep Clean</option>
                <option>Checkout Clean</option>
                <option>Touch-up</option>
                <option>Linen Change</option>
                <option>Inspection</option>
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Assigned Staff</label>
              <input
                type="text"
                value={taskForm.assignedStaff}
                onChange={(e) => setTaskForm({ ...taskForm, assignedStaff: e.target.value })}
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Priority</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                className="form-select text-xs font-mono"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High (Checkout due)</option>
                <option value="Critical">Critical (VIP arrival)</option>
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Scheduled Time</label>
              <input
                type="text"
                value={taskForm.scheduledTime}
                onChange={(e) => setTaskForm({ ...taskForm, scheduledTime: e.target.value })}
                className="form-input text-xs font-mono"
                placeholder="e.g. 11:30 AM"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Current Condition</label>
              <select
                value={taskForm.roomStatus}
                onChange={(e) => setTaskForm({ ...taskForm, roomStatus: e.target.value as any })}
                className="form-select text-xs font-mono"
              >
                <option value="Dirty">Dirty</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Clean">Clean</option>
                <option value="Out of Service">Out of Service</option>
              </select>
            </div>

            <div className="form-group !mb-0 col-span-2">
              <label className="form-label">Instructions / Notes</label>
              <textarea
                rows={2}
                value={taskForm.notes}
                onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                placeholder="e.g. Extra goose-down pillows requested, organic lemongrass diffuser"
                className="form-textarea text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE8E0]">
            <Button variant="secondary" size="sm" onClick={() => setIsNewTaskOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Assign Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Lost & Found Modal */}
      <Modal
        isOpen={isNewLFOpen}
        onClose={() => setIsNewLFOpen(false)}
        title="Log Lost & Found Article"
        subtitle="Safe Custody Registry"
      >
        <form onSubmit={handleAddLF} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="form-group !mb-0 col-span-2">
              <label className="form-label">Item Description</label>
              <input
                type="text"
                required
                value={lfForm.item}
                onChange={(e) => setLfForm({ ...lfForm, item: e.target.value })}
                placeholder="e.g. Montblanc Meisterstück Fountain Pen"
                className="form-input text-xs"
              />
            </div>
            <div className="form-group !mb-0">
              <label className="form-label">Location Found</label>
              <input
                type="text"
                required
                value={lfForm.locationFound}
                onChange={(e) => setLfForm({ ...lfForm, locationFound: e.target.value })}
                placeholder="e.g. Room 204 or Ember Dining"
                className="form-input text-xs"
              />
            </div>
            <div className="form-group !mb-0">
              <label className="form-label">Discovered By</label>
              <input
                type="text"
                required
                value={lfForm.foundBy}
                onChange={(e) => setLfForm({ ...lfForm, foundBy: e.target.value })}
                className="form-input text-xs"
              />
            </div>
            <div className="form-group !mb-0">
              <label className="form-label">Associated Guest Name</label>
              <input
                type="text"
                value={lfForm.guestName}
                onChange={(e) => setLfForm({ ...lfForm, guestName: e.target.value })}
                placeholder="Lord Anthony Somerset"
                className="form-input text-xs"
              />
            </div>
            <div className="form-group !mb-0">
              <label className="form-label">Guest Contact Phone</label>
              <input
                type="tel"
                value={lfForm.guestPhone}
                onChange={(e) => setLfForm({ ...lfForm, guestPhone: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE8E0]">
            <Button variant="secondary" size="sm" onClick={() => setIsNewLFOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Deposit to Safe
            </Button>
          </div>
        </form>
      </Modal>

      {/* Task Inspection Drawer */}
      <Drawer
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        title={selectedTask ? `Sanitization Checklist · Room ${selectedTask.roomNumber}` : ''}
        subtitle="Quality Inspection & Verification"
      >
        {selectedTask && (
          <div className="space-y-6">
            <div className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs font-bold text-[#111111]">Task #{selectedTask.id}</span>
                <StatusBadge status={selectedTask.status} />
              </div>
              <div className="text-xs text-[#77736C]">
                <div>Type: <strong className="text-[#111111]">{selectedTask.taskType}</strong></div>
                <div>Attendant: <strong className="text-[#111111]">{selectedTask.assignedStaff}</strong></div>
                <div>Priority: <strong className="text-[#111111]">{selectedTask.priority}</strong></div>
                {selectedTask.completedAt && (
                  <div>Completed: <strong className="text-emerald-700">{selectedTask.completedAt}</strong></div>
                )}
              </div>
            </div>

            {/* Quality Checklist */}
            <div className="space-y-3">
              <span className="font-mono text-xs uppercase tracking-wider text-[#A58A5C] block font-bold">
                Luxury Standard Inspection Checklist
              </span>
              <div className="space-y-2">
                {selectedTask.checklist.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleToggleChecklist(selectedTask.id, idx)}
                    className="w-full flex items-center gap-3 p-3 bg-white border border-[#ECE8E0] hover:border-[#A58A5C] rounded-xs text-left cursor-pointer transition-colors"
                  >
                    <div
                      className={`w-4 h-4 rounded-xs border flex items-center justify-center ${
                        item.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300'
                      }`}
                    >
                      {item.completed && <Check size={12} />}
                    </div>
                    <span className={`text-xs ${item.completed ? 'line-through text-gray-400' : 'text-[#111111]'}`}>
                      {item.item}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Status Override */}
            <div className="pt-4 border-t border-[#ECE8E0] space-y-3">
              <span className="font-mono text-xs text-[#77736C] block">Advance Operational Status:</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUpdateTaskStatus(selectedTask.id, 'In Progress', 'Cleaning')}
                >
                  Mark In Progress
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={CheckCircle2}
                  onClick={() => handleUpdateTaskStatus(selectedTask.id, 'Completed', 'Clean')}
                >
                  Mark Cleaned
                </Button>
                <Button
                  variant="gold"
                  size="sm"
                  icon={ShieldCheck}
                  onClick={() => handleUpdateTaskStatus(selectedTask.id, 'Inspected', 'Inspected')}
                >
                  Supervisor Inspected
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
