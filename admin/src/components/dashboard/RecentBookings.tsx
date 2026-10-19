import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Eye, CreditCard, Mail, Phone } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import { settlePayment } from '../../services/paymentService';
import { useToast } from '../ui/Toast';
import { Booking } from '../../types';

interface RecentBookingsProps {
  bookings?: Booking[];
  onRefresh?: () => void;
}

export default function RecentBookings({ bookings = [], onRefresh }: RecentBookingsProps) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const recent = bookings.slice(0, 6);

  const formatShortDate = (dateStr?: string) => {
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
                  <span className="font-mono text-xs font-medium text-[#A58A5C]">
                    {b.id}
                  </span>
                </td>
                <td>
                  <div className="space-y-0.5">
                    <div className="font-medium text-[#111111]">{b.guestName}</div>
                    {b.guestPhone && (
                      <div className="text-[11px] text-[#77736C] font-mono flex items-center gap-1">
                        <Phone size={10} className="text-[#A58A5C] shrink-0" />
                        <span>{b.guestPhone}</span>
                      </div>
                    )}
                    {b.guestEmail && (
                      <div className="text-[11px] text-[#77736C] font-mono flex items-center gap-1">
                        <Mail size={10} className="text-[#A58A5C] shrink-0" />
                        <span>{b.guestEmail}</span>
                      </div>
                    )}
                    {b.specialRequests && (
                      <div className="text-[10px] text-[#A58A5C] italic truncate max-w-[160px]" title={b.specialRequests}>
                        Req: {b.specialRequests}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div>
                    <div className="text-xs text-[#111111]">{b.roomType}</div>
                    <div className="text-[10px] font-mono text-[#77736C]">Room {b.roomNumber}</div>
                  </div>
                </td>
                <td className="font-mono text-xs text-[#55514B]">
                  {formatShortDate(b.checkIn)}
                </td>
                <td className="font-mono text-xs text-[#55514B]">
                  {formatShortDate(b.checkOut)}
                </td>
                <td className="font-mono text-xs text-center text-[#55514B]">
                  {b.guests}
                </td>
                <td>
                  <span className="font-mono text-xs font-semibold text-[#111111]">
                    ₹ {b.totalAmount?.toLocaleString()}
                  </span>
                </td>
                <td>
                  <StatusBadge status={b.bookingStatus} />
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {b.paymentStatus === 'Pending' && (
                      <button
                        onClick={async () => {
                          try {
                            await settlePayment({
                              bookingId: b.id,
                              paymentId: b.paymentId,
                            });
                            addToast(`Payment recorded for booking ${b.id}`);
                            if (onRefresh) onRefresh();
                          } catch (err: any) {
                            addToast(err.message || 'Payment update failed', 'error');
                          }
                        }}
                        className="px-2 py-1 bg-[#FAF8F5] border border-[#E2DDD5] hover:border-[#A58A5C] text-[#A58A5C] text-[10px] font-mono uppercase tracking-wider rounded-xs transition-colors flex items-center gap-1"
                        title="Mark payment as PAID"
                      >
                        <CreditCard size={12} />
                        <span>Pay Now</span>
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/admin/bookings/${b.id}`)}
                      className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#FAF8F5] rounded-xs transition-colors"
                      title="View Details"
                    >
                      <Eye size={14} />
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
