import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Shield,
  Bell,
  CreditCard,
  Mail,
  Calendar,
  Lock,
  Building,
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';

const settingTabs = [
  { id: 'general', label: 'General & Brand', icon: Building },
  { id: 'booking', label: 'Booking Rules', icon: Calendar },
  { id: 'notifications', label: 'Alerts & Webhooks', icon: Bell },
  { id: 'payment', label: 'Payment Gateway', icon: CreditCard },
  { id: 'security', label: 'Security & 2FA', icon: Shield },
];

export default function Settings() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('general');

  const [generalForm, setGeneralForm] = useState({
    hotelName: 'NOVA HOUSE',
    tagline: 'A Place to Pause',
    contactEmail: 'gm@novahouse.example',
    phone: '+91 80 0000 0000',
    currency: 'INR (₹)',
    timezone: 'Asia/Kolkata (IST +5:30)',
  });

  const [bookingRules, setBookingRules] = useState({
    checkInTime: '02:00 PM',
    checkOutTime: '12:00 PM',
    minStayNights: 1,
    maxStayNights: 30,
    cancellationNoticeHours: 48,
    instantConfirmation: true,
  });

  const [notifications, setNotifications] = useState({
    emailOnNewBooking: true,
    smsOnCheckIn: true,
    enquiryAlerts: true,
    dailyFinancialDigest: true,
  });

  const [securityForm, setSecurityForm] = useState({
    twoFactorEnabled: true,
    sessionTimeoutMins: 60,
  });

  const handleSave = (e) => {
    e.preventDefault();
    addToast('Configuration settings persisted successfully.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            System Preferences
          </span>
          <h2 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Hotel & Portal Settings
          </h2>
          <p className="text-xs text-[#77736C] mt-1">
            Configure system rules, payment processors, alerts, and authentication parameters.
          </p>
        </div>

        <Button variant="gold" size="sm" icon={Save} onClick={handleSave}>
          Save All Settings
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
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-wider rounded-xs transition-all ${
                isActive
                  ? 'bg-[#111111] text-[#F4F1EB] font-semibold shadow-xs'
                  : 'bg-[#FFFFFF] text-[#55514B] border border-[#E2DDD5] hover:border-[#CDC7BC]'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-[#A58A5C]' : 'text-[#77736C]'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: General */}
      {activeTab === 'general' && (
        <div className="admin-card p-6 space-y-4">
          <h3 className="font-serif text-lg font-light uppercase text-[#111111] pb-2 border-b border-[#ECE8E0]">
            General Hotel Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group !mb-0">
              <label className="form-label">Hotel Trade Name</label>
              <input
                type="text"
                value={generalForm.hotelName}
                onChange={(e) => setGeneralForm({ ...generalForm, hotelName: e.target.value })}
                className="form-input text-xs font-serif"
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

            <div className="form-group !mb-0">
              <label className="form-label">Primary Executive Email</label>
              <input
                type="email"
                value={generalForm.contactEmail}
                onChange={(e) => setGeneralForm({ ...generalForm, contactEmail: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Operating Phone</label>
              <input
                type="text"
                value={generalForm.phone}
                onChange={(e) => setGeneralForm({ ...generalForm, phone: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Base Currency</label>
              <input
                type="text"
                value={generalForm.currency}
                disabled
                className="form-input text-xs font-mono bg-[#FAF8F5]"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Timezone</label>
              <input
                type="text"
                value={generalForm.timezone}
                disabled
                className="form-input text-xs font-mono bg-[#FAF8F5]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Booking Rules */}
      {activeTab === 'booking' && (
        <div className="admin-card p-6 space-y-4">
          <h3 className="font-serif text-lg font-light uppercase text-[#111111] pb-2 border-b border-[#ECE8E0]">
            Sanctuary Booking & Reservation Policies
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group !mb-0">
              <label className="form-label">Check-In Standard Hour</label>
              <input
                type="text"
                value={bookingRules.checkInTime}
                onChange={(e) => setBookingRules({ ...bookingRules, checkInTime: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Check-Out Standard Hour</label>
              <input
                type="text"
                value={bookingRules.checkOutTime}
                onChange={(e) => setBookingRules({ ...bookingRules, checkOutTime: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Cancellation Window (Hours prior to arrival)</label>
              <input
                type="number"
                value={bookingRules.cancellationNoticeHours}
                onChange={(e) =>
                  setBookingRules({
                    ...bookingRules,
                    cancellationNoticeHours: Number(e.target.value),
                  })
                }
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Maximum Consecutive Nights</label>
              <input
                type="number"
                value={bookingRules.maxStayNights}
                onChange={(e) =>
                  setBookingRules({ ...bookingRules, maxStayNights: Number(e.target.value) })
                }
                className="form-input text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Notifications */}
      {activeTab === 'notifications' && (
        <div className="admin-card p-6 space-y-4">
          <h3 className="font-serif text-lg font-light uppercase text-[#111111] pb-2 border-b border-[#ECE8E0]">
            Automated Alerts & Staff Notifications
          </h3>

          <div className="space-y-3">
            {[
              { key: 'emailOnNewBooking', label: 'Email front desk upon new confirmed reservation' },
              { key: 'smsOnCheckIn', label: 'SMS alert to housekeeping upon guest check-out' },
              { key: 'enquiryAlerts', label: 'Instant notification on new event/corporate inquiry' },
              { key: 'dailyFinancialDigest', label: 'Daily 11:59 PM revenue and occupancy ledger digest' },
            ].map((n) => (
              <label
                key={n.key}
                className="flex items-center justify-between p-3.5 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs cursor-pointer select-none"
              >
                <span className="text-xs text-[#111111] font-medium">{n.label}</span>
                <input
                  type="checkbox"
                  checked={notifications[n.key]}
                  onChange={(e) =>
                    setNotifications({ ...notifications, [n.key]: e.target.checked })
                  }
                  className="accent-[#A58A5C] w-4 h-4"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Payment */}
      {activeTab === 'payment' && (
        <div className="admin-card p-6 space-y-4">
          <h3 className="font-serif text-lg font-light uppercase text-[#111111] pb-2 border-b border-[#ECE8E0]">
            Payment Processors & Gateway Configurations
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif text-base font-semibold text-[#111111]">
                  Razorpay & Stripe International
                </span>
                <span className="badge badge-success">Connected</span>
              </div>
              <p className="text-xs text-[#77736C]">
                Processing UPI, Credit Cards, Amex Centurion, and international bank wires.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group !mb-0">
                <label className="form-label">Gateway Merchant ID</label>
                <input
                  type="text"
                  value="rzp_live_NOVAHOUSE_2026"
                  disabled
                  className="form-input text-xs font-mono bg-[#FAF8F5]"
                />
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Webhook Endpoint Status</label>
                <input
                  type="text"
                  value="https://api.novahouse.example/v1/webhooks/payment"
                  disabled
                  className="form-input text-xs font-mono bg-[#FAF8F5]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Security */}
      {activeTab === 'security' && (
        <div className="admin-card p-6 space-y-4">
          <h3 className="font-serif text-lg font-light uppercase text-[#111111] pb-2 border-b border-[#ECE8E0]">
            Security Protocols & Authentication
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs flex items-center justify-between">
              <div>
                <span className="font-serif text-base font-medium text-[#111111] block">
                  Two-Factor Authentication (2FA)
                </span>
                <span className="text-xs text-[#77736C]">
                  Require authenticator OTP on all Super Admin sign-ins.
                </span>
              </div>
              <span className="badge badge-success">Enforced</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group !mb-0">
                <label className="form-label">Idle Session Timeout (Minutes)</label>
                <input
                  type="number"
                  value={securityForm.sessionTimeoutMins}
                  onChange={(e) =>
                    setSecurityForm({
                      ...securityForm,
                      sessionTimeoutMins: Number(e.target.value),
                    })
                  }
                  className="form-input text-xs font-mono"
                />
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Password Policy</label>
                <input
                  type="text"
                  value="12+ Characters, Entropy Required"
                  disabled
                  className="form-input text-xs font-mono bg-[#FAF8F5]"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
