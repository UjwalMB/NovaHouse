import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  Mail,
  Smartphone,
  FileText,
  Send,
  Eye,
  Trash2,
  Clock,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import FilterBar from '../components/ui/FilterBar';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable, { Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';
import { useToast } from '../components/ui/Toast';
import {
  getGuestCommunications,
  sendGuestCommunication,
  deleteGuestCommunication,
} from '../services/guestCommunicationService';
import type { GuestCommunication as GuestCommunicationRecord } from '../types';

const templates: Record<string, { subject: string; content: string }> = {
  'Booking Confirmation': {
    subject: 'Confirmation of Sanctuary Reservation · NOVA HOUSE Bengaluru',
    content: 'Dear Valued Patron,\n\nWe are delighted to confirm your bespoke reservation at NOVA HOUSE. Your suite has been allocated and our concierge is at your service.\n\nWarmest regards,\nFront Desk Concierge',
  },
  'Pre-Arrival Check-In': {
    subject: 'Pre-Arrival Preferences & Chauffeur Coordination · NOVA HOUSE',
    content: 'Dear Patron,\n\nIn anticipation of your arrival, please let us know if you require airport chauffeur transfers or specific in-suite pillow and dietary preferences.\n\nYours sincerely,\nConcierge Team',
  },
  'Stay Courtesy': {
    subject: 'A warm welcome to your Sanctuary at NOVA HOUSE',
    content: 'Good day,\n\nWe trust your stay in your suite is serene. Should you wish to reserve a table at EMBER or experience Kaya Sanctuary Spa, please dial 0 for concierge.',
  },
  'Check-Out Invoice': {
    subject: 'Your Official Stay Invoice & Folio · NOVA HOUSE',
    content: 'Dear Guest,\n\nThank you for choosing NOVA HOUSE Bengaluru. Attached please find your tax invoice and settlement receipt.\n\nWe look forward to welcoming you back.',
  },
  'Cancellation Notice': {
    subject: 'Reservation Cancellation Acknowledged · NOVA HOUSE',
    content: 'Dear Guest,\n\nWe confirm the cancellation of your reservation as requested. Any eligible refunds have been initiated in accordance with our luxury sanctuary cancellation policy.',
  },
  'Custom Message': {
    subject: 'Update regarding your stay at NOVA HOUSE',
    content: '',
  },
};

export default function GuestCommunication() {
  const { addToast } = useToast();
  const [messages, setMessages] = useState<GuestCommunicationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals & Drawers
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<GuestCommunicationRecord | null>(null);

  // Compose Form
  const [form, setForm] = useState({
    guestName: '',
    guestId: '',
    bookingId: '',
    channel: 'Email' as GuestCommunicationRecord['channel'],
    type: 'Booking Confirmation' as GuestCommunicationRecord['type'],
    subject: templates['Booking Confirmation'].subject,
    content: templates['Booking Confirmation'].content,
    sentBy: 'Front Desk Administration',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const comms = await getGuestCommunications();
      setMessages(comms);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTemplateChange = (type: GuestCommunicationRecord['type']) => {
    const t = templates[type] || { subject: '', content: '' };
    setForm((prev) => ({
      ...prev,
      type,
      subject: t.subject,
      content: t.content,
    }));
  };

  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guestName.trim() || !form.content.trim()) return;

    const created = await sendGuestCommunication(form);
    setMessages([created, ...messages]);
    addToast(`${form.channel} message dispatched to ${created.guestName}.`);
    setIsComposeOpen(false);
    setForm({
      guestName: '',
      guestId: '',
      bookingId: '',
      channel: 'Email',
      type: 'Booking Confirmation',
      subject: templates['Booking Confirmation'].subject,
      content: templates['Booking Confirmation'].content,
      sentBy: 'Front Desk Administration',
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this communication record?')) {
      await deleteGuestCommunication(id);
      setMessages(messages.filter((m) => m.id !== id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
      addToast('Communication record removed.');
    }
  };

  // Filtered messages
  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.guestName.toLowerCase().includes(q) ||
        (m.subject && m.subject.toLowerCase().includes(q)) ||
        m.content.toLowerCase().includes(q) ||
        m.sentBy.toLowerCase().includes(q);

      const matchChannel = channelFilter === 'all' || m.channel.toLowerCase() === channelFilter.toLowerCase();
      const matchType = typeFilter === 'all' || m.type.toLowerCase() === typeFilter.toLowerCase();

      return matchSearch && matchChannel && matchType;
    });
  }, [messages, searchQuery, channelFilter, typeFilter]);

  const columns: Column<GuestCommunicationRecord>[] = [
    {
      header: 'Guest Recipient',
      key: 'guestName',
      render: (m) => (
        <div>
          <span className="font-medium text-xs text-[#111111] block">{m.guestName}</span>
          <span className="font-mono text-[10px] text-[#A58A5C]">
            {m.bookingId ? `Ref #${m.bookingId}` : `ID: #${m.id}`}
          </span>
        </div>
      ),
    },
    {
      header: 'Channel',
      key: 'channel',
      render: (m) => {
        let Icon = Mail;
        if (m.channel === 'SMS') Icon = Smartphone;
        if (m.channel === 'WhatsApp') Icon = Share2;
        if (m.channel === 'Internal Note') Icon = FileText;

        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#FAF8F5] border border-[#ECE8E0] text-[10px] font-mono text-[#55514B] rounded-xs">
            <Icon size={11} className="text-[#A58A5C]" />
            <span>{m.channel}</span>
          </span>
        );
      },
    },
    {
      header: 'Message Purpose',
      key: 'type',
      render: (m) => <span className="text-xs font-mono font-medium text-[#111111]">{m.type}</span>,
    },
    {
      header: 'Subject & Preview',
      key: 'subject',
      render: (m) => (
        <div className="max-w-xs space-y-0.5">
          <span className="font-medium text-xs text-[#111111] block line-clamp-1">{m.subject || m.type}</span>
          <span className="text-[11px] text-[#77736C] line-clamp-1">{m.content}</span>
        </div>
      ),
    },
    {
      header: 'Dispatched By',
      key: 'sentBy',
      render: (m) => <span className="text-xs font-mono text-[#55514B]">{m.sentBy}</span>,
    },
    {
      header: 'Sent At',
      key: 'sentAt',
      render: (m) => <span className="text-xs font-mono text-[#77736C]">{m.sentAt}</span>,
    },
    {
      header: 'Status',
      key: 'status',
      render: (m) => <StatusBadge status={m.status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (m) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedMessage(m)}
            className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs"
            title="Inspect Message"
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
            Omnichannel Hospitality Messaging
          </span>
          <h1 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Guest Communication
          </h1>
          <p className="text-xs text-[#77736C] mt-1">
            Dispatch booking confirmations, check-in courtesy notices, folios, and internal concierge handovers.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Send}
          onClick={() => setIsComposeOpen(true)}
        >
          Compose Message
        </Button>
      </div>

      {/* Search & Filter Row */}
      <div className="admin-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search guest, subject, content..."
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="form-select text-xs font-mono !py-1.5"
          >
            <option value="all">All Channels</option>
            <option value="Email">Email</option>
            <option value="SMS">SMS</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Internal Note">Internal Note</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-select text-xs font-mono !py-1.5"
          >
            <option value="all">All Purposes</option>
            <option value="Booking Confirmation">Booking Confirmation</option>
            <option value="Pre-Arrival Check-In">Pre-Arrival Check-In</option>
            <option value="Stay Courtesy">Stay Courtesy</option>
            <option value="Check-Out Invoice">Check-Out Invoice</option>
            <option value="Cancellation Notice">Cancellation Notice</option>
            <option value="Custom Message">Custom Message</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card">
        <DataTable
          columns={columns}
          data={filteredMessages}
          loading={loading}
          onRowClick={(m) => setSelectedMessage(m)}
        />
      </div>

      {/* Compose Modal */}
      <Modal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        title="Compose Guest Communication"
        subtitle="Concierge & Front Office Dispatch"
      >
        <form onSubmit={handleSendSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="form-group !mb-0">
              <label className="form-label">Delivery Channel</label>
              <select
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value as any })}
                className="form-select text-xs font-mono"
              >
                <option value="Email">Email (SES / SMTP)</option>
                <option value="SMS">SMS Gateway</option>
                <option value="WhatsApp">WhatsApp Concierge</option>
                <option value="Internal Note">Internal Staff Note</option>
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Template Purpose</label>
              <select
                value={form.type}
                onChange={(e) => handleTemplateChange(e.target.value as any)}
                className="form-select text-xs font-mono"
              >
                <option value="Booking Confirmation">Booking Confirmation</option>
                <option value="Pre-Arrival Check-In">Pre-Arrival Check-In</option>
                <option value="Stay Courtesy">Stay Courtesy</option>
                <option value="Check-Out Invoice">Check-Out Invoice</option>
                <option value="Cancellation Notice">Cancellation Notice</option>
                <option value="Custom Message">Custom Message</option>
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Guest Full Name</label>
              <input
                type="text"
                required
                value={form.guestName}
                onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                placeholder="Lord Anthony Somerset"
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Booking ID Ref (Optional)</label>
              <input
                type="text"
                value={form.bookingId}
                onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
                placeholder="e.g. NH-4029"
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0 col-span-2">
              <label className="form-label">Subject</label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0 col-span-2">
              <label className="form-label">Message Body</label>
              <textarea
                rows={4}
                required
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="form-textarea text-xs font-sans"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE8E0]">
            <Button variant="secondary" size="sm" onClick={() => setIsComposeOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={Send}>
              Dispatch Communication
            </Button>
          </div>
        </form>
      </Modal>

      {/* Message Inspection Drawer */}
      <Drawer
        isOpen={Boolean(selectedMessage)}
        onClose={() => setSelectedMessage(null)}
        title={selectedMessage ? `${selectedMessage.channel} Dispatch · ${selectedMessage.guestName}` : ''}
        subtitle={selectedMessage ? selectedMessage.type : ''}
      >
        {selectedMessage && (
          <div className="space-y-6">
            <div className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs font-bold text-[#111111]">Ref: #{selectedMessage.id}</span>
                <StatusBadge status={selectedMessage.status} />
              </div>
              <div className="text-xs text-[#77736C]">
                <div>Recipient: <strong className="text-[#111111]">{selectedMessage.guestName}</strong></div>
                <div>Channel: <strong className="text-[#111111]">{selectedMessage.channel}</strong></div>
                <div>Dispatched By: <strong className="text-[#111111]">{selectedMessage.sentBy}</strong></div>
                <div>Timestamp: <strong className="text-[#111111] font-mono">{selectedMessage.sentAt}</strong></div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-xs text-[#A58A5C] uppercase font-bold block">
                {selectedMessage.subject || selectedMessage.type}
              </span>
              <div className="p-4 bg-white border border-[#ECE8E0] rounded-xs text-xs text-[#111111] whitespace-pre-wrap font-sans leading-relaxed">
                {selectedMessage.content}
              </div>
            </div>

            <div className="pt-4 border-t border-[#ECE8E0] flex justify-between">
              <Button
                variant="secondary"
                size="sm"
                icon={Trash2}
                onClick={() => handleDelete(selectedMessage.id)}
              >
                Delete Record
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedMessage(null)}
              >
                Close Dossier
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
