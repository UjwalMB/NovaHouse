import React, { useState, useMemo } from 'react';
import {
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Eye,
  Reply,
  Send,
  MessageSquare,
} from 'lucide-react';
import { initialEnquiries } from '../data/enquiries';
import { useToast } from '../components/ui/Toast';
import SearchBar from '../components/ui/SearchBar';
import FilterBar from '../components/ui/FilterBar';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable from '../components/ui/DataTable';
import Drawer from '../components/ui/Drawer';
import Button from '../components/ui/Button';

export default function Enquiries() {
  const { addToast } = useToast();
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Drawer & Reply State
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [replyText, setReplyText] = useState('');

  const handleMarkResolved = (id) => {
    setEnquiries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'Resolved' } : e))
    );
    if (selectedEnquiry && selectedEnquiry.id === id) {
      setSelectedEnquiry((prev) => ({ ...prev, status: 'Resolved' }));
    }
    addToast('Enquiry marked as Resolved.');
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    addToast(`Reply dispatched to ${selectedEnquiry.email}.`);
    handleMarkResolved(selectedEnquiry.id);
    setReplyText('');
    setSelectedEnquiry(null);
  };

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((enq) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        enq.name.toLowerCase().includes(q) ||
        enq.email.toLowerCase().includes(q) ||
        enq.subject.toLowerCase().includes(q) ||
        enq.message.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        enq.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [enquiries, searchQuery, statusFilter]);

  const columns = [
    {
      header: 'Lead Name',
      key: 'name',
      render: (e) => (
        <div>
          <div className="font-medium text-[#111111]">{e.name}</div>
          <div className="text-[10px] text-[#A58A5C] font-mono">{e.priority} Priority</div>
        </div>
      ),
    },
    {
      header: 'Email',
      key: 'email',
      render: (e) => <span className="font-mono text-xs">{e.email}</span>,
    },
    {
      header: 'Phone',
      key: 'phone',
      render: (e) => <span className="font-mono text-xs">{e.phone}</span>,
    },
    {
      header: 'Subject & Topic',
      key: 'subject',
      render: (e) => (
        <span className="font-serif text-xs text-[#111111] truncate max-w-[220px] block">
          {e.subject}
        </span>
      ),
    },
    {
      header: 'Date',
      key: 'date',
      render: (e) => <span className="font-mono text-xs text-[#77736C]">{e.date}</span>,
    },
    {
      header: 'Status',
      key: 'status',
      render: (e) => <StatusBadge status={e.status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (e) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(ev) => ev.stopPropagation()}>
          <button
            onClick={() => setSelectedEnquiry(e)}
            className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs"
            title="Read Enquiry"
          >
            <Eye size={15} />
          </button>
        </div>
      ),
    },
  ];

  const statusOptions = [
    { label: 'All Inquiries', value: 'all', count: enquiries.length },
    { label: 'New', value: 'New', count: enquiries.filter((e) => e.status === 'New').length },
    { label: 'In Progress', value: 'In Progress', count: enquiries.filter((e) => e.status === 'In Progress').length },
    { label: 'Resolved', value: 'Resolved', count: enquiries.filter((e) => e.status === 'Resolved').length },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Inbound Guest Communications
          </span>
          <h2 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Guest Inquiries & Leads
          </h2>
          <p className="text-xs text-[#77736C] mt-1">
            Submissions received from the public website contact form and private event requests.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="overflow-x-auto pb-1">
        <FilterBar
          options={statusOptions}
          activeValue={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {/* Search Bar */}
      <div className="admin-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search inquiry message, subject, name..."
          />
        </div>
        <div className="text-xs font-mono text-[#77736C]">
          Showing <strong className="text-[#111111]">{filteredEnquiries.length}</strong> inquiries
        </div>
      </div>

      {/* Table */}
      <div className="admin-card">
        <DataTable
          columns={columns}
          data={filteredEnquiries}
          onRowClick={(e) => setSelectedEnquiry(e)}
        />
      </div>

      {/* Enquiry Detail Drawer */}
      <Drawer
        isOpen={!!selectedEnquiry}
        onClose={() => setSelectedEnquiry(null)}
        title={selectedEnquiry?.subject}
        subtitle={`From ${selectedEnquiry?.name} · ${selectedEnquiry?.date}`}
        width="max-w-lg"
        footer={
          <div className="flex items-center justify-between w-full">
            {selectedEnquiry?.status !== 'Resolved' ? (
              <Button
                variant="secondary"
                size="sm"
                icon={CheckCircle}
                onClick={() => handleMarkResolved(selectedEnquiry?.id)}
              >
                Mark Resolved
              </Button>
            ) : (
              <span className="font-mono text-xs text-[#235C33]">✓ Resolved</span>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedEnquiry(null)}
            >
              Close
            </Button>
          </div>
        }
      >
        {selectedEnquiry && (
          <div className="space-y-6 text-xs font-mono">
            {/* Sender Meta */}
            <div className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-sans text-sm font-semibold text-[#111111]">
                  {selectedEnquiry.name}
                </span>
                <StatusBadge status={selectedEnquiry.status} />
              </div>
              <div className="flex flex-col gap-1 text-[11px] text-[#77736C]">
                <div className="flex items-center gap-1.5">
                  <Mail size={13} className="text-[#A58A5C]" />
                  <span>{selectedEnquiry.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone size={13} className="text-[#A58A5C]" />
                  <span>{selectedEnquiry.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#A58A5C]" />
                  <span>Received on {selectedEnquiry.date}</span>
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-2">
              <span className="text-[#77736C] block text-[10px] uppercase tracking-wider font-semibold">
                Inquiry Message
              </span>
              <div className="p-4 bg-[#FFFFFF] border border-[#E2DDD5] rounded-xs font-sans text-xs text-[#111111] leading-relaxed whitespace-pre-wrap">
                {selectedEnquiry.message}
              </div>
            </div>

            {/* Internal Notes */}
            {selectedEnquiry.notes && (
              <div className="p-3 bg-[#F6F2EA] border border-[#A58A5C]/20 rounded-xs text-[11px]">
                <span className="font-bold text-[#A58A5C] uppercase block mb-0.5">Concierge Routing</span>
                <span className="text-[#55514B] font-sans">{selectedEnquiry.notes}</span>
              </div>
            )}

            {/* Quick Reply Form */}
            <form onSubmit={handleSendReply} className="space-y-3 pt-4 border-t border-[#ECE8E0]">
              <span className="text-[#77736C] block text-[10px] uppercase tracking-wider font-semibold">
                Compose Executive Response
              </span>
              <textarea
                rows={4}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Dear ${selectedEnquiry.name},\n\nThank you for writing to NOVA HOUSE. In response to your inquiry regarding...`}
                className="form-textarea text-xs font-sans"
              />
              <div className="flex items-center justify-end">
                <Button variant="primary" size="sm" icon={Send} type="submit">
                  Dispatch Reply
                </Button>
              </div>
            </form>
          </div>
        )}
      </Drawer>
    </div>
  );
}
