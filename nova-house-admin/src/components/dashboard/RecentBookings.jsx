import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Eye, CreditCard } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import { settlePayment } from '../../services/paymentService';
import { useToast } from '../ui/Toast';

export default function RecentBookings({ bookings = [], onRefresh }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const recent = bookings.slice(0, 6);

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="admin-card">
      <div className="admin-card-header flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A5C] block">
            Front Desk Stream
          </span>
          <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
            Recent Reservations
          </h3>
        </div>
        <Link
          to="/admin/bookings"
          className="inline-flex items-center gap-1 font-mono text-xs text-[#A58A5C] hover:text-[#111111] transition-colors"
        >
          <span>View All</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className="data-table-container !border-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Guest</th>
              <th>Room</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Guests</th>
              <th>Amount</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((b) => (
              <tr
                key={b.id}
                onClick={() => navigate(`/admin/bookings/${b.id}`)}
                className="cursor-pointer"
              >
                <td>
                  <span className="font-mono text-xs font-semibold text-[#111111]">
                    #{b.id}
                  </span>
                </td>
                <td>
                  <div>
                    <div className="font-medium text-[#111111]">{b.guestName}</div>
                    <div className="text-[11px] text-[#77736C] font-mono">{b.guestEmail}</div>
                  </div>
                </td>
                <td>
                  <span className="font-serif text-xs text-[#111111]">{b.roomType}</span>
                  <span className="block text-[10px] text-[#77736C] font-mono">#{b.roomNumber}</span>
                </td>
                <td className="font-mono text-xs text-[#111111]">{formatShortDate(b.checkIn)}</td>
                <td className="font-mono text-xs text-[#111111]">{formatShortDate(b.checkOut)}</td>
                <td className="font-mono text-xs text-[#111111]">{b.guests}</td>
                <td>
                  <span className="font-mono text-xs font-semibold text-[#111111]">
                    ₹ {Number(b.totalAmount || b.total_amount || 0).toLocaleString()}
                  </span>
                </td>
                <td>
                  <StatusBadge status={b.bookingStatus || b.booking_status || 'Confirmed'} />
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {(b.paymentStatus === 'Pending' || b.paymentStatus === 'PENDING' || b.payment_status === 'Pending') && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await settlePayment({ bookingId: b.id });
                            addToast(`Payment for #${b.id} marked as PAID.`);
                            if (onRefresh) onRefresh();
                          } catch (err) {
                            navigate(`/admin/bookings/${b.id}`);
                          }
                        }}
                        className="px-2 py-1 text-[10px] font-mono font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xs transition-colors flex items-center gap-1"
                        title="Collect & Settle Payment"
                      >
                        <CreditCard size={11} />
                        <span>Pay Now</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/bookings/${b.id}`);
                      }}
                      className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs transition-colors"
                      title="View Booking Dossier"
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
