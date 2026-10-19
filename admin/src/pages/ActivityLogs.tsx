import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Search,
  Download,
  Filter,
  Shield,
  Clock,
  Eye,
  RefreshCw,
} from 'lucide-react';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import DataTable, { Column } from '../components/ui/DataTable';
import Drawer from '../components/ui/Drawer';
import { useToast } from '../components/ui/Toast';
import { getActivityLogs } from '../services/staffService';
import { ActivityLog } from '../types';

export default function ActivityLogs() {
  const { addToast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');

  // Selected Log Drawer
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getActivityLogs();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        log.user.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.module.toLowerCase().includes(q);

      const matchModule = moduleFilter === 'all' || log.module.toLowerCase() === moduleFilter.toLowerCase();
      return matchSearch && matchModule;
    });
  }, [logs, searchQuery, moduleFilter]);

  const handleExportCSV = () => {
    const headers = ['Log ID,Timestamp,Staff User,Role,Action,Module,Details,IP Address'];
    const rows = filteredLogs.map((l) =>
      `"${l.id}","${l.timestamp}","${l.user}","${l.role}","${l.action}","${l.module}","${(l.details || '').replace(/"/g, '""')}","${l.ipAddress || ''}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Nova_House_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Security audit log exported.');
  };

  const columns: Column<ActivityLog>[] = [
    {
      header: 'Timestamp',
      key: 'timestamp',
      render: (l) => <span className="font-mono text-xs text-[#77736C]">{l.timestamp}</span>,
    },
    {
      header: 'Staff User',
      key: 'user',
      render: (l) => (
        <div>
          <span className="font-medium text-xs text-[#111111] block">{l.user}</span>
          <span className="font-mono text-[10px] text-[#A58A5C]">{l.role}</span>
        </div>
      ),
    },
    {
      header: 'Module',
      key: 'module',
      render: (l) => (
        <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#ECE8E0] text-[10px] font-mono text-[#55514B] rounded-xs">
          {l.module}
        </span>
      ),
    },
    {
      header: 'Action & Audit Trail',
      key: 'action',
      render: (l) => (
        <div className="max-w-md space-y-0.5">
          <span className="font-semibold text-xs text-[#111111] block">{l.action}</span>
          <span className="text-[11px] text-[#77736C] line-clamp-1">{l.details}</span>
        </div>
      ),
    },
    {
      header: 'Terminal IP',
      key: 'ipAddress',
      render: (l) => <span className="font-mono text-xs text-[#77736C]">{l.ipAddress || '192.168.1.1'}</span>,
    },
    {
      header: 'Inspect',
      key: 'id',
      align: 'right',
      render: (l) => (
        <button
          onClick={() => setSelectedLog(l)}
          className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs cursor-pointer"
          title="Inspect Audit Record"
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            System Security & Compliance Trail
          </span>
          <h1 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Activity & Audit Logs
          </h1>
          <p className="text-xs text-[#77736C] mt-1">
            Immutable timeline of staff actions, rate modifications, reservation cancellations, and access authentications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadData}>
            Refresh
          </Button>
          <Button variant="secondary" size="sm" icon={Download} onClick={handleExportCSV}>
            Export Audit Log
          </Button>
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="admin-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search user, action, details..."
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="form-select text-xs font-mono !py-1.5"
          >
            <option value="all">All Modules</option>
            <option value="Bookings">Bookings</option>
            <option value="Rooms">Rooms</option>
            <option value="Pricing">Pricing</option>
            <option value="Payments">Payments</option>
            <option value="Housekeeping">Housekeeping</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Dining">Dining</option>
            <option value="Staff">Staff</option>
            <option value="Settings">Settings</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card">
        <DataTable
          columns={columns}
          data={filteredLogs}
          loading={loading}
          onRowClick={(l) => setSelectedLog(l)}
        />
      </div>

      {/* Log Inspection Drawer */}
      <Drawer
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? `Audit Record #${selectedLog.id}` : ''}
        subtitle="Security Verification Event"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-2">
              <span className="font-mono text-xs font-bold text-[#111111]">{selectedLog.action}</span>
              <div className="text-xs text-[#77736C] space-y-1 pt-1 font-mono">
                <div>User: <strong className="text-[#111111]">{selectedLog.user} ({selectedLog.role})</strong></div>
                <div>Module: <strong className="text-[#111111]">{selectedLog.module}</strong></div>
                <div>Recorded: <strong className="text-[#111111]">{selectedLog.timestamp}</strong></div>
                <div>IP Address: <strong className="text-[#111111]">{selectedLog.ipAddress || '192.168.1.1'}</strong></div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[#A58A5C] font-bold block">
                Action Specifications & Payload
              </span>
              <div className="p-4 bg-white border border-[#ECE8E0] rounded-xs text-xs text-[#111111] font-mono whitespace-pre-wrap leading-relaxed">
                {selectedLog.details}
              </div>
            </div>

            <div className="pt-4 border-t border-[#ECE8E0] flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
