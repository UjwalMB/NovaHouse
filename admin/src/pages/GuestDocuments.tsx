import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  ShieldCheck,
  AlertCircle,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  Lock,
  Download,
  Trash2,
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
  getGuestDocuments,
  uploadGuestDocument,
  updateDocumentVerification,
  deleteGuestDocument,
} from '../services/guestDocumentService';
import { GuestDocument, DocumentType, VerificationStatus } from '../types';

export default function GuestDocuments() {
  const { addToast } = useToast();
  const [documents, setDocuments] = useState<GuestDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Drawers & Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<GuestDocument | null>(null);

  // Form
  const [form, setForm] = useState({
    guestName: '',
    guestId: '',
    documentType: 'Passport' as DocumentType,
    documentNumber: '',
    nationality: 'Indian',
    expiryDate: '2030-05-20',
    fileName: 'passport_scan.pdf',
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const docs = await getGuestDocuments();
      setDocuments(docs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute metrics
  const verifiedCount = documents.filter((d) => d.verificationStatus === 'Verified').length;
  const pendingCount = documents.filter((d) => d.verificationStatus === 'Pending').length;
  const rejectedCount = documents.filter((d) => d.verificationStatus === 'Rejected').length;

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        d.guestName.toLowerCase().includes(q) ||
        d.documentNumber.toLowerCase().includes(q) ||
        d.nationality.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'all' || d.verificationStatus.toLowerCase() === statusFilter.toLowerCase();
      const matchType = typeFilter === 'all' || d.documentType.toLowerCase() === typeFilter.toLowerCase();

      return matchSearch && matchStatus && matchType;
    });
  }, [documents, searchQuery, statusFilter, typeFilter]);

  // Actions
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guestName.trim() || !form.documentNumber.trim()) return;

    const created = await uploadGuestDocument({
      ...form,
      verificationStatus: 'Pending',
    });
    setDocuments([created, ...documents]);
    addToast(`Identity record uploaded for ${created.guestName}.`);
    setIsUploadOpen(false);
    setForm({
      guestName: '',
      guestId: '',
      documentType: 'Passport',
      documentNumber: '',
      nationality: 'Indian',
      expiryDate: '2030-05-20',
      fileName: 'identity_doc.pdf',
      notes: '',
    });
  };

  const handleVerify = async (id: string, status: VerificationStatus) => {
    const updated = await updateDocumentVerification(id, status, 'Front Desk General Manager');
    if (updated) {
      setDocuments(documents.map((d) => (d.id === id ? updated : d)));
      if (selectedDoc?.id === id) setSelectedDoc(updated);
      addToast(`Document #${id} marked as ${status}.`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Permanently remove identity document for ${name}?`)) {
      await deleteGuestDocument(id);
      setDocuments(documents.filter((d) => d.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
      addToast(`Document record purged.`);
    }
  };

  const columns: Column<GuestDocument>[] = [
    {
      header: 'Guest Name',
      key: 'guestName',
      render: (d) => (
        <div>
          <span className="font-medium text-xs text-[#111111] block">{d.guestName}</span>
          <span className="font-mono text-[10px] text-[#A58A5C]">ID: #{d.id}</span>
        </div>
      ),
    },
    {
      header: 'Document Type',
      key: 'documentType',
      render: (d) => (
        <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#ECE8E0] text-[10px] font-mono text-[#55514B] rounded-xs">
          {d.documentType}
        </span>
      ),
    },
    {
      header: 'Document ID Number',
      key: 'documentNumber',
      render: (d) => (
        <span className="font-mono text-xs font-semibold text-[#111111]">
          {d.documentNumber}
        </span>
      ),
    },
    {
      header: 'Nationality',
      key: 'nationality',
      render: (d) => <span className="text-xs font-mono text-[#55514B]">{d.nationality}</span>,
    },
    {
      header: 'Uploaded Date',
      key: 'uploadDate',
      render: (d) => <span className="text-xs font-mono text-[#77736C]">{d.uploadDate}</span>,
    },
    {
      header: 'Verification',
      key: 'verificationStatus',
      render: (d) => <StatusBadge status={d.verificationStatus} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (d) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {d.verificationStatus === 'Pending' && (
            <>
              <button
                onClick={() => handleVerify(d.id, 'Verified')}
                className="px-2 py-1 text-[10px] font-mono font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xs transition-colors cursor-pointer flex items-center gap-1"
                title="Verify Identity"
              >
                <CheckCircle2 size={11} />
                <span>Verify</span>
              </button>
              <button
                onClick={() => handleVerify(d.id, 'Rejected')}
                className="px-2 py-1 text-[10px] font-mono font-medium text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xs transition-colors cursor-pointer"
                title="Reject"
              >
                Reject
              </button>
            </>
          )}

          <button
            onClick={() => setSelectedDoc(d)}
            className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs"
            title="Inspect Dossier"
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
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C]">
              KYC & Government Regulatory Compliance
            </span>
            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-[10px] font-mono text-emerald-800 rounded-xs flex items-center gap-1">
              <Lock size={10} />
              <span>Encrypted Storage</span>
            </span>
          </div>
          <h1 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Guest Documents
          </h1>
          <p className="text-xs text-[#77736C] mt-1">
            Secure regulatory identity storage for Passports, Aadhaar, Visas, and Government IDs.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setIsUploadOpen(true)}
        >
          Register Identity Document
        </Button>
      </div>

      {/* Security Banner */}
      <div className="p-3.5 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs flex items-center gap-3 text-xs text-[#55514B]">
        <Lock size={16} className="text-[#A58A5C] shrink-0" />
        <div>
          <span className="font-semibold text-[#111111]">Statutory Hospitality Privacy Standard: </span>
          All guest documentation is stored under Supabase Row-Level-Security (RLS). Unauthenticated external access is prohibited by property law.
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="admin-card p-4 border-l-4 border-emerald-600">
          <span className="font-mono text-[10px] uppercase text-[#77736C] block">Verified Documents</span>
          <span className="font-serif text-2xl font-light text-emerald-800">{verifiedCount} Verified</span>
          <span className="text-[10px] text-[#77736C] block mt-1">Clear for check-in</span>
        </div>

        <div className="admin-card p-4 border-l-4 border-amber-500">
          <span className="font-mono text-[10px] uppercase text-[#77736C] block">Pending Verification</span>
          <span className="font-serif text-2xl font-light text-amber-800">{pendingCount} Awaiting Review</span>
          <span className="text-[10px] text-[#77736C] block mt-1">Front desk audit required</span>
        </div>

        <div className="admin-card p-4 border-l-4 border-rose-500">
          <span className="font-mono text-[10px] uppercase text-[#77736C] block">Rejected / Expired</span>
          <span className="font-serif text-2xl font-light text-rose-800">{rejectedCount} Flagged</span>
          <span className="text-[10px] text-[#77736C] block mt-1">Requires re-submission</span>
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="admin-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search guest name, document ID, country..."
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select text-xs font-mono !py-1.5"
          >
            <option value="all">All Verification Statuses</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-select text-xs font-mono !py-1.5"
          >
            <option value="all">All Document Types</option>
            <option value="Passport">Passport</option>
            <option value="Aadhaar Card">Aadhaar Card</option>
            <option value="Driver License">Driver License</option>
            <option value="Voter ID">Voter ID</option>
            <option value="Visa">Visa</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card">
        <DataTable
          columns={columns}
          data={filteredDocs}
          loading={loading}
          onRowClick={(d) => setSelectedDoc(d)}
        />
      </div>

      {/* Register Document Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Register Guest Identification"
        subtitle="Mandatory C-Form & KYC Protocol"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="form-group !mb-0 col-span-2">
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
              <label className="form-label">Document Type</label>
              <select
                value={form.documentType}
                onChange={(e) => setForm({ ...form, documentType: e.target.value as any })}
                className="form-select text-xs font-mono"
              >
                <option value="Passport">Passport</option>
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="Driver License">Driver License</option>
                <option value="Voter ID">Voter ID</option>
                <option value="Visa">Visa</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Document Number</label>
              <input
                type="text"
                required
                value={form.documentNumber}
                onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                placeholder="e.g. Z9876543 / 8892 1120 4491"
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Nationality</label>
              <input
                type="text"
                required
                value={form.nationality}
                onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Document Expiry Date</label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0 col-span-2">
              <label className="form-label">Uploaded File Name / Reference</label>
              <input
                type="text"
                value={form.fileName}
                onChange={(e) => setForm({ ...form, fileName: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0 col-span-2">
              <label className="form-label">Verification Remarks / Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Physical original inspected at front desk..."
                className="form-textarea text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE8E0]">
            <Button variant="secondary" size="sm" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Deposit to Secure Registry
            </Button>
          </div>
        </form>
      </Modal>

      {/* Document Dossier Inspection Drawer */}
      <Drawer
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc ? `Identity Dossier · ${selectedDoc.guestName}` : ''}
        subtitle={selectedDoc ? `${selectedDoc.documentType} #${selectedDoc.documentNumber}` : ''}
      >
        {selectedDoc && (
          <div className="space-y-6">
            <div className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-serif text-lg font-medium text-[#111111]">{selectedDoc.guestName}</span>
                <StatusBadge status={selectedDoc.verificationStatus} />
              </div>
              <div className="text-xs text-[#77736C]">
                <div>Nationality: <strong className="text-[#111111]">{selectedDoc.nationality}</strong></div>
                <div>Document Type: <strong className="text-[#111111]">{selectedDoc.documentType}</strong></div>
                <div>Number: <strong className="text-[#111111] font-mono">{selectedDoc.documentNumber}</strong></div>
                <div>Uploaded on: <strong className="text-[#111111] font-mono">{selectedDoc.uploadDate}</strong></div>
                {selectedDoc.expiryDate && (
                  <div>Valid Until: <strong className="text-[#111111] font-mono">{selectedDoc.expiryDate}</strong></div>
                )}
              </div>
            </div>

            {selectedDoc.verifiedBy && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xs text-xs text-emerald-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-700" />
                  <span>Officially Verified KYC Record</span>
                </div>
                <div className="text-[11px] font-mono">
                  Verified by: {selectedDoc.verifiedBy} {selectedDoc.verifiedAt && `· ${selectedDoc.verifiedAt}`}
                </div>
              </div>
            )}

            {/* Mock Secure File Viewer */}
            <div className="p-4 border border-dashed border-[#CDC7BC] rounded-xs text-center space-y-2 bg-[#FAF8F5]">
              <FileText size={32} className="mx-auto text-[#A58A5C]" />
              <div className="text-xs font-mono font-medium text-[#111111]">{selectedDoc.fileName || 'passport_scan.pdf'}</div>
              <p className="text-[10px] text-[#77736C]">
                Stored in private Supabase bucket <code className="text-[#111111]">hotel-guest-docs</code> with 256-bit AES encryption.
              </p>
              <Button variant="secondary" size="sm" icon={Download}>
                Export Digital Copy
              </Button>
            </div>

            {selectedDoc.notes && (
              <div className="text-xs text-[#77736C]">
                <span className="font-semibold text-[#111111] block mb-0.5">Verification Notes:</span>
                <p className="p-2.5 bg-white border border-[#ECE8E0] rounded-xs italic">{selectedDoc.notes}</p>
              </div>
            )}

            <div className="pt-4 border-t border-[#ECE8E0] flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                icon={Trash2}
                onClick={() => handleDelete(selectedDoc.id, selectedDoc.guestName)}
              >
                Delete
              </Button>

              <div className="flex gap-2">
                {selectedDoc.verificationStatus !== 'Verified' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle2}
                    onClick={() => handleVerify(selectedDoc.id, 'Verified')}
                  >
                    Approve KYC
                  </Button>
                )}
                {selectedDoc.verificationStatus !== 'Rejected' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={XCircle}
                    onClick={() => handleVerify(selectedDoc.id, 'Rejected')}
                  >
                    Flag / Reject
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
