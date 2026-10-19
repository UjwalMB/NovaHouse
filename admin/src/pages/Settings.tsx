import React, { useState, useEffect } from 'react';
import {
  Save,
  Shield,
  Bell,
  CreditCard,
  Calendar,
  Building,
  Percent,
  Cpu,
  Sliders,
  CheckCircle2,
  Lock,
  Globe,
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import { getHotelSettings, saveHotelSettings } from '../services/hotelService';

const settingTabs = [
  { id: 'general', label: 'General & Brand', icon: Building },
  { id: 'booking', label: 'Booking Rules', icon: Calendar },
  { id: 'tax', label: 'Taxes & GST', icon: Percent },
  { id: 'payment', label: 'Payments & Razorpay', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security & 2FA', icon: Shield },
  { id: 'integrations', label: 'Integrations', icon: Cpu },
  { id: 'system', label: 'System & Audit', icon: Sliders },
];

export default function Settings() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  // GENERAL
  const [generalForm, setGeneralForm] = useState({
    hotelName: 'NOVA HOUSE',
    tagline: 'A Place to Pause',
    address: 'Lavelle Road, Richmond Circle, Bengaluru 560001, Karnataka, India',
    contactEmail: 'gm@novahouse.com',
    phone: '+91 80 4965 8800',
    logo: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80',
    currency: 'INR (₹)',
    timezone: 'Asia/Kolkata (IST +5:30)',
  });

  // BOOKING
  const [bookingRules, setBookingRules] = useState({
    checkInTime: '02:00 PM',
    checkOutTime: '12:00 PM',
    cancellationNoticeHours: 48,
    minStayNights: 1,
    maxStayNights: 30,
    instantConfirmation: true,
    cancellationPolicy: 'Complimentary cancellation up to 48 hours before check-in. Non-refundable thereafter.',
  });

  // TAX
  const [taxForm, setTaxForm] = useState({
    gstin: '29AAACN8820P1Z4',
    cgstRate: 9.0,
    sgstRate: 9.0,
    igstRate: 18.0,
    hsnRoomTariff: '996311',
    hsnDining: '996331',
    luxuryCessEnabled: false,
  });

  // PAYMENTS
  const [paymentForm, setPaymentForm] = useState({
    gateway: 'Razorpay',
    keyId: 'rzp_test_NOVAHOUSE_2026',
    autoCapture: true,
    allowRefunds: true,
    refundFeePolicy: 'Instant online refund to source account',
    webhookUrl: 'https://api.novahouse.com/v1/webhooks/razorpay',
  });

  // NOTIFICATIONS
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    emailOnNewBooking: true,
    smsOnCheckIn: true,
    enquiryAlerts: true,
    dailyFinancialDigest: true,
    paymentReceiptToGuest: true,
  });

  // SECURITY
  const [securityForm, setSecurityForm] = useState({
    twoFactorEnabled: true,
    sessionTimeoutMins: 60,
    passwordPolicy: '12+ Characters, Complex Entropy',
    enforceIpBinding: false,
  });

  // INTEGRATIONS
  const [integrationsForm, setIntegrationsForm] = useState({
    supabaseStatus: 'Connected (rcirzjtfynlozlehtbwp)',
    razorpayStatus: 'Connected (Live API)',
    emailProvider: 'AWS SES / Resend API',
    smsGateway: 'Twilio / Gupshup SMS',
  });

  // SYSTEM
  const [systemForm, setSystemForm] = useState({
    environment: 'Production-Ready (SPA + Supabase)',
    appVersion: 'v2.4.0 (Enterprise PMS)',
    auditLogging: true,
    maintenanceMode: false,
  });

  useEffect(() => {
    getHotelSettings().then((config) => {
      if (config) {
        setGeneralForm((prev) => ({
          ...prev,
          hotelName: config.hotelName || prev.hotelName,
          tagline: config.tagline || prev.tagline,
          contactEmail: config.contactEmail || prev.contactEmail,
          phone: config.phone || prev.phone,
          currency: config.currency || prev.currency,
          timezone: config.timezone || prev.timezone,
        }));
        setBookingRules((prev) => ({
          ...prev,
          checkInTime: config.checkInTime || prev.checkInTime,
          checkOutTime: config.checkOutTime || prev.checkOutTime,
          minStayNights: config.minStayNights ?? prev.minStayNights,
          maxStayNights: config.maxStayNights ?? prev.maxStayNights,
          cancellationNoticeHours: config.cancellationNoticeHours ?? prev.cancellationNoticeHours,
        }));
        if (config.notifications) {
          setNotifications((prev) => ({ ...prev, ...config.notifications }));
        }
        if (config.security) {
          setSecurityForm((prev) => ({ ...prev, ...config.security }));
        }
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveHotelSettings({
        ...generalForm,
        ...bookingRules,
        notifications,
        security: securityForm,
      });
      addToast('Configuration settings persisted successfully.');
    } catch (err: any) {
      addToast(err.message || 'Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            System Preferences & Operational Policy
          </span>
          <h1 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Hotel System Settings
          </h1>
          <p className="text-xs text-[#77736C] mt-1">
            Configure hotel identity, statutory taxes, Razorpay gateway, booking rules, and enterprise integrations.
          </p>
        </div>

        <Button variant="gold" size="sm" icon={Save} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E2DDD5] pb-2">
        {settingTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-mono uppercase tracking-wider rounded-xs transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#111111] text-[#F4F1EB] font-semibold shadow-xs'
                  : 'bg-white text-[#55514B] border border-[#E2DDD5] hover:border-[#CDC7BC]'
              }`}
            >
              <Icon size={13} className={isActive ? 'text-[#A58A5C]' : 'text-[#77736C]'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: GENERAL */}
      {activeTab === 'general' && (
        <div className="admin-card p-6 space-y-4">
          <h3 className="font-serif text-lg font-light uppercase text-[#111111] pb-2 border-b border-[#ECE8E0]">
            General Hotel Identity & Localisation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="form-group !mb-0">
              <label className="form-label">Hotel Brand Name</label>
              <input
                type="text"
                value={generalForm.hotelName}
                onChange={(e) => setGeneralForm({ ...generalForm, hotelName: e.target.value })}
                className="form-input text-xs"
              />
            </div>
            <div className="form-group !mb-0">
              <label className="form-label">Brand Tagline</label>
              <input
                type="text"
                value={generalForm.tagline}
                onChange={(e) => setGeneralForm({ ...generalForm, tagline: e.target.value })}
                className="form-input text-xs"
              />
            </div>
            <div className="form-group !mb-0 col-span-2">
              <label className="form-label">Property Address</label>
              <input
                type="text"
                value={generalForm.address}
                onChange={(e) => setGeneralForm({ ...generalForm, address: e.target.value })}
                className="form-input text-xs"
              />
            </div>
            <div className="form-group !mb-0">
              <label className="form-label">Executive Contact Email</label>
              <input
                type="email"
                value={generalForm.contactEmail}
                onChange={(e) => setGeneralForm({ ...generalForm, contactEmail: e.target.value })}
                className="form-input text-xs"
              />
            </div>
            <div className="form-group !mb-0">
              <label className="form-label">Front Desk Telephone</label>
              <input
                type="tel"
                value={generalForm.phone}
                onChange={(e) => setGeneralForm({ ...generalForm, phone: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>
            <div className="form-group !mb-0">
              <label className="form-label">Operating Currency</label>
              <input
                type="text"
                value={generalForm.currency}
                onChange={(e) => setGeneralForm({ ...generalForm, currency: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>
            <div className="form-group !mb-0">
              <label className="form-label">Local Timezone</label>
              <input
                type="text"
                value={generalForm.timezone}
                onChange={(e) => setGeneralForm({ ...generalForm, timezone: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BOOKING */}
      {activeTab === 'booking' && (
        <div className="admin-card p-6 space-y-4">
          <h3 className="font-serif text-lg font-light uppercase text-[#111111] pb-2 border-b border-[#ECE8E0]">
            Sanctuary Booking & Reservation Policies
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="form-group !mb-0">
              <label className="form-label">Standard Check-In Hour</label>
              <input
                type="text"
                value={bookingRules.checkInTime}
                onChange={(e) => setBookingRules({ ...bookingRules, checkInTime: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>
            <div className="form-group !mb-0">
              <label className="form-label">Standard Check-Out Hour</label>
              <input
                type="text"
                value={bookingRules.checkOutTime}
                onChange={(e) => setBookingRules({ ...bookingRules, checkOutTime: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>
            <div className="form-group !mb-0">
              <label className="form-label">Minimum Stay (Nights)</label>
              <input
                type="number"
                value={bookingRules.minStayNights}
                onChange={(e) => setBookingRules({ ...bookingRules, minStayNights: Number(e.target.value) })}
                className="form-input text-xs font-mono"
              />
            </div>
            <div className="form-group !mb-0">
              <label className="form-label">Maximum Consecutive Nights</label>
              <input
                type="number"
                value={bookingRules.maxStayNights}
                onChange={(e) => setBookingRules({ ...bookingRules, maxStayNights: Number(e.target.value) })}
                className="form-input text-xs font-mono"
              />
            </div>
            <div className="form-group !mb-0">
              <label className="form-label">Cancellation Notice Window (Hours)</label>
              <input
                type="number"
                value={bookingRules.cancellationNoticeHours}
                onChange={(e) => setBookingRules({ ...bookingRules, cancellationNoticeHours: Number(e.target.value) })}
                className="form-input text-xs font-mono"
              />
            </div>
            <div className="form-group !mb-0 col-span-2">
              <label className="form-label">Cancellation Policy Description</label>
              <textarea
                rows={2}
                value={bookingRules.cancellationPolicy}
                onChange={(e) => setBookingRules({ ...bookingRules, cancellationPolicy: e.target.value })}
                className="form-textarea text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TAX */}
      {activeTab === 'tax' && (
        <div className="admin-card p-6 space-y-4">
          <h3 className="font-serif text-lg font-light uppercase text-[#111111] pb-2 border-b border-[#ECE8E0]">
            GST & Statutory Tax Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="form-group !mb-0">
              <label className="form-label">Hotel GSTIN Registration Number</label>
              <input
                type="text"
                value={taxForm.gstin}
                onChange={(e) => setTaxForm({ ...taxForm, gstin: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>
            <div className="form-group !mb-0">
              <label className="form-label">Central GST (CGST %)</label>
              <input
                type="number"
                step="0.1"
                value={taxForm.cgstRate}
                onChange={(e) => setTaxForm({ ...taxForm, cgstRate: Number(e.target.value) })}
                className="form-input text-xs font-mono"
              />
            </div>
            <div className="form-group !mb-0">
              <label className="form-label">State GST (SGST %)</label>
              <input
                type="number"
                step="0.1"
                value={taxForm.sgstRate}
                onChange={(e) => setTaxForm({ ...taxForm, sgstRate: Number(e.target.value) })}
                className="form-input text-xs font-mono"
              />
            </div>
            <div className="form-group !mb-0">
              <label className="form-label">Interstate GST (IGST %)</label>
              <input
                type="number"
                step="0.1"
                value={taxForm.igstRate}
                onChange={(e) => setTaxForm({ ...taxForm, igstRate: Number(e.target.value) })}
                className="form-input text-xs font-mono"
              />
            </div>
            <div className="form-group !mb-0">
              <label className="form-label">Room Tariff HSN / SAC Code</label>
              <input
                type="text"
                value={taxForm.hsnRoomTariff}
                onChange={(e) => setTaxForm({ ...taxForm, hsnRoomTariff: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>
            <div className="form-group !mb-0">
              <label className="form-label">Dining & F&B SAC Code</label>
              <input
                type="text"
                value={taxForm.hsnDining}
                onChange={(e) => setTaxForm({ ...taxForm, hsnDining: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENTS */}
      {activeTab === 'payment' && (
        <div className="admin-card p-6 space-y-4">
          <h3 className="font-serif text-lg font-light uppercase text-[#111111] pb-2 border-b border-[#ECE8E0]">
            Payment Gateway & Razorpay Settings
          </h3>
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs flex items-center justify-between">
              <div>
                <span className="font-serif text-base font-semibold text-[#111111] block">Razorpay Merchant Gateway</span>
                <span className="text-xs text-[#77736C]">Active in TEST / LIVE mode with UPI, NetBanking, and Card checkout.</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-xs font-mono text-[10px] font-bold">
                Connected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group !mb-0">
                <label className="form-label">API Key ID</label>
                <input
                  type="text"
                  value={paymentForm.keyId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, keyId: e.target.value })}
                  className="form-input text-xs font-mono"
                />
              </div>
              <div className="form-group !mb-0">
                <label className="form-label">Webhook Endpoint Status</label>
                <input
                  type="text"
                  value={paymentForm.webhookUrl}
                  disabled
                  className="form-input text-xs font-mono bg-[#FAF8F5]"
                />
              </div>
              <div className="form-group !mb-0 col-span-2">
                <label className="form-label">Refund Policy Strategy</label>
                <input
                  type="text"
                  value={paymentForm.refundFeePolicy}
                  onChange={(e) => setPaymentForm({ ...paymentForm, refundFeePolicy: e.target.value })}
                  className="form-input text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="admin-card p-6 space-y-4">
          <h3 className="font-serif text-lg font-light uppercase text-[#111111] pb-2 border-b border-[#ECE8E0]">
            Automated Alerts & Communication Triggers
          </h3>
          <div className="space-y-3">
            {[
              { key: 'emailOnNewBooking', label: 'Email front desk team upon new confirmed reservation' },
              { key: 'smsOnCheckIn', label: 'SMS alert to housekeeping lead upon guest check-out turnover' },
              { key: 'enquiryAlerts', label: 'Instant notification on new event/corporate inquiry form' },
              { key: 'dailyFinancialDigest', label: 'Daily midnight revenue and occupancy digest to General Manager' },
              { key: 'paymentReceiptToGuest', label: 'Automatically send PDF tax receipt to guest email upon payment' },
            ].map((n) => (
              <label
                key={n.key}
                className="flex items-center justify-between p-3.5 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs cursor-pointer select-none"
              >
                <span className="text-xs text-[#111111] font-medium">{n.label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(notifications[n.key])}
                  onChange={(e) => setNotifications({ ...notifications, [n.key]: e.target.checked })}
                  className="accent-[#A58A5C] w-4 h-4 cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SECURITY */}
      {activeTab === 'security' && (
        <div className="admin-card p-6 space-y-4">
          <h3 className="font-serif text-lg font-light uppercase text-[#111111] pb-2 border-b border-[#ECE8E0]">
            Security Protocols & Session Policies
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="form-group !mb-0">
              <label className="form-label">Session Idle Timeout (Minutes)</label>
              <input
                type="number"
                value={securityForm.sessionTimeoutMins}
                onChange={(e) => setSecurityForm({ ...securityForm, sessionTimeoutMins: Number(e.target.value) })}
                className="form-input text-xs font-mono"
              />
            </div>
            <div className="form-group !mb-0">
              <label className="form-label">Password Policy Standard</label>
              <input
                type="text"
                value={securityForm.passwordPolicy}
                disabled
                className="form-input text-xs font-mono bg-[#FAF8F5]"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: INTEGRATIONS */}
      {activeTab === 'integrations' && (
        <div className="admin-card p-6 space-y-4">
          <h3 className="font-serif text-lg font-light uppercase text-[#111111] pb-2 border-b border-[#ECE8E0]">
            External Connected Platforms
          </h3>
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs flex justify-between items-center">
              <div>
                <strong className="text-[#111111] block">Supabase PostgreSQL & Auth</strong>
                <span className="text-[#77736C] text-[11px]">{integrationsForm.supabaseStatus}</span>
              </div>
              <span className="badge badge-success">Online</span>
            </div>
            <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs flex justify-between items-center">
              <div>
                <strong className="text-[#111111] block">Razorpay Payment Processing</strong>
                <span className="text-[#77736C] text-[11px]">{integrationsForm.razorpayStatus}</span>
              </div>
              <span className="badge badge-success">Live</span>
            </div>
            <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs flex justify-between items-center">
              <div>
                <strong className="text-[#111111] block">Email Service Provider (SMTP/SES)</strong>
                <span className="text-[#77736C] text-[11px]">{integrationsForm.emailProvider}</span>
              </div>
              <span className="badge badge-success">Active</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: SYSTEM */}
      {activeTab === 'system' && (
        <div className="admin-card p-6 space-y-4">
          <h3 className="font-serif text-lg font-light uppercase text-[#111111] pb-2 border-b border-[#ECE8E0]">
            Environment & Property System Status
          </h3>
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs flex justify-between items-center">
              <div>
                <strong className="text-[#111111] block">Property Management System Core</strong>
                <span className="text-[#77736C] text-[11px]">{systemForm.appVersion}</span>
              </div>
              <span className="text-[#A58A5C] font-semibold">{systemForm.environment}</span>
            </div>

            <label className="flex items-center justify-between p-3.5 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs cursor-pointer select-none">
              <div>
                <strong className="text-xs text-[#111111] block">Immutable Audit Logging</strong>
                <span className="text-[11px] text-[#77736C]">Record staff actions into secure activity stream</span>
              </div>
              <input
                type="checkbox"
                checked={systemForm.auditLogging}
                onChange={(e) => setSystemForm({ ...systemForm, auditLogging: e.target.checked })}
                className="accent-[#A58A5C] w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs cursor-pointer select-none">
              <div>
                <strong className="text-xs text-[#111111] block">Hotel Emergency / Maintenance Mode</strong>
                <span className="text-[11px] text-[#77736C]">Temporarily restrict new bookings across website</span>
              </div>
              <input
                type="checkbox"
                checked={systemForm.maintenanceMode}
                onChange={(e) => setSystemForm({ ...systemForm, maintenanceMode: e.target.checked })}
                className="accent-rose-600 w-4 h-4 cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
