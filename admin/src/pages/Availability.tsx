import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Check,
} from 'lucide-react';
import { useRooms } from '../hooks/useRooms';
import { useBookings } from '../hooks/useBookings';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Room } from '../types';

interface CalendarDate {
  key: string;
  dayNumber: number;
  weekday: string;
  month: string;
  isWeekend: boolean;
}

// Generate 14 continuous dates starting Oct 12, 2026
const calendarDates: CalendarDate[] = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(2026, 9, 12 + i);
  return {
    key: d.toISOString().split('T')[0],
    dayNumber: d.getDate(),
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    month: d.toLocaleDateString('en-US', { month: 'short' }),
    isWeekend: d.getDay() === 0 || d.getDay() === 6,
  };
});

// Cell status color mappings
const statusStyleMap: Record<string, { bg: string; text: string; border: string; label: string }> = {
  Available: {
    bg: '#EDF7F0',
    text: '#235C33',
    border: '#C8E8D1',
    label: 'Avail',
  },
  Occupied: {
    bg: '#EBF4F9',
    text: '#244C66',
    border: '#C5DFEE',
    label: 'Occ',
  },
  Reserved: {
    bg: '#F6EEF8',
    text: '#5E3E6E',
    border: '#DFC5E4',
    label: 'Res',
  },
  Maintenance: {
    bg: '#FDF0F0',
    text: '#962828',
    border: '#F7C6C6',
    label: 'Maint',
  },
  Blocked: {
    bg: '#F1ECE3',
    text: '#55514B',
    border: '#E0D9CE',
    label: 'Block',
  },
};

interface SelectedCellState {
  room: Room;
  date: CalendarDate;
  current: string;
}

export default function Availability() {
  const { rooms } = useRooms();
  const { bookings } = useBookings();
  const { addToast } = useToast();

  // Selected cell for status change modal
  const [selectedCell, setSelectedCell] = useState<SelectedCellState | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('Available');

  // Custom local matrix overrides for dates
  const [matrixOverrides, setMatrixOverrides] = useState<Record<string, string>>({});

  const getCellStatus = (room: Room, dateKey: string): string => {
    const key = `${room.id}_${dateKey}`;
    if (matrixOverrides[key]) return matrixOverrides[key];

    // Check if there is an active booking for this room on this date in DB
    const activeBooking = bookings?.find((b: any) => {
      if (b.bookingStatus === 'Cancelled') return false;
      const matchRoom =
        String(b.roomId) === String(room.id) ||
        String(b.roomNumber) === String(room.roomNumber) ||
        (b.room && room.name && b.room.toLowerCase().includes(room.name.toLowerCase().split(' ')[0]));
      if (!matchRoom) return false;
      return dateKey >= b.checkIn && dateKey < b.checkOut;
    });

    if (activeBooking) {
      return activeBooking.bookingStatus === 'Checked In' ? 'Occupied' : 'Reserved';
    }

    // fallback based on room default status
    return room.status === 'Cleaning' ? 'Maintenance' : (room.status || 'Available');
  };

  const handleCellClick = (room: Room, date: CalendarDate) => {
    const current = getCellStatus(room, date.key);
    setSelectedCell({ room, date, current });
    setTargetStatus(current);
  };

  const handleSaveCellStatus = () => {
    if (!selectedCell) return;
    const key = `${selectedCell.room.id}_${selectedCell.date.key}`;
    setMatrixOverrides((prev) => ({
      ...prev,
      [key]: targetStatus,
    }));
    addToast(
      `Room ${selectedCell.room.roomNumber} set to "${targetStatus}" on ${selectedCell.date.dayNumber} ${selectedCell.date.month}.`
    );
    setSelectedCell(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Yield & Occupancy Calendar
          </span>
          <h2 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Room Availability Matrix
          </h2>
          <p className="text-xs text-[#77736C] mt-1">
            Visual room rack. Click any calendar cell to update status or block dates.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          {Object.entries(statusStyleMap).map(([status, style]) => (
            <div key={status} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-xs border"
                style={{ backgroundColor: style.bg, borderColor: style.border }}
              />
              <span className="text-[#55514B]">{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Container */}
      <div className="admin-card overflow-hidden">
        <div className="p-4 border-b border-[#E2DDD5] bg-[#FAF8F5] flex items-center justify-between font-mono text-xs text-[#77736C]">
          <span className="flex items-center gap-2">
            <CalendarIcon size={14} className="text-[#A58A5C]" />
            <span>12 Oct 2026 – 25 Oct 2026 (Fortnight View)</span>
          </span>
          <span className="hidden sm:inline">Click any slot to adjust allocation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E2DDD5]">
                {/* Room Sticky Column */}
                <th className="sticky left-0 z-20 bg-[#FAF8F5] p-3 text-left font-mono text-xs uppercase tracking-wider text-[#77736C] w-48 border-r border-[#E2DDD5]">
                  Sanctuary Key
                </th>
                {calendarDates.map((date) => (
                  <th
                    key={date.key}
                    className={`p-2.5 text-center font-mono text-xs border-r border-[#ECE8E0] min-w-[70px] ${
                      date.isWeekend ? 'bg-[#F6F2EA]' : ''
                    }`}
                  >
                    <div className="text-[10px] uppercase text-[#77736C]">{date.weekday}</div>
                    <div className="font-serif text-sm font-semibold text-[#111111] mt-0.5">
                      {date.dayNumber} {date.month}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id} className="border-b border-[#ECE8E0] hover:bg-[#FAF8F5]/50">
                  {/* Sticky Room Label */}
                  <td className="sticky left-0 z-10 bg-[#FFFFFF] p-3 border-r border-[#E2DDD5] shadow-xs">
                    <div className="font-mono text-xs font-bold text-[#111111]">
                      #{room.roomNumber}
                    </div>
                    <div className="font-serif text-[11px] text-[#77736C] truncate max-w-[150px]">
                      {room.name}
                    </div>
                  </td>

                  {/* Date Slots */}
                  {calendarDates.map((date) => {
                    const status = getCellStatus(room, date.key);
                    const style = statusStyleMap[status] || statusStyleMap.Available;

                    return (
                      <td
                        key={date.key}
                        onClick={() => handleCellClick(room, date)}
                        className="p-1 border-r border-[#ECE8E0] text-center"
                      >
                        <div
                          className="h-9 rounded-xs border flex items-center justify-center font-mono text-[10px] font-medium cursor-pointer transition-transform hover:scale-95 shadow-2xs"
                          style={{
                            backgroundColor: style.bg,
                            color: style.text,
                            borderColor: style.border,
                          }}
                          title={`${room.name} - ${date.dayNumber} ${date.month}: ${status}`}
                        >
                          {style.label}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Modification Modal */}
      <Modal
        isOpen={!!selectedCell}
        onClose={() => setSelectedCell(null)}
        title="Modify Room Availability"
        subtitle={`Room #${selectedCell?.room?.roomNumber} · ${selectedCell?.date?.dayNumber} ${selectedCell?.date?.month} 2026`}
      >
        {selectedCell && (
          <div className="space-y-4">
            <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs text-xs font-mono">
              <div>Sanctuary: <strong className="text-[#111111]">{selectedCell.room.name}</strong></div>
              <div className="mt-1">Date: <strong className="text-[#111111]">{selectedCell.date.weekday}, {selectedCell.date.dayNumber} {selectedCell.date.month} 2026</strong></div>
              <div className="mt-1">Current Status: <strong className="text-[#A58A5C]">{selectedCell.current}</strong></div>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Select Updated Allocation</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['Available', 'Occupied', 'Reserved', 'Maintenance', 'Blocked'].map((st) => {
                  const isSelected = targetStatus === st;
                  const stStyle = statusStyleMap[st] || statusStyleMap.Available;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTargetStatus(st)}
                      className={`p-3 rounded-xs border text-xs font-mono text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#111111] bg-[#111111] text-[#F4F1EB] font-bold shadow-sm'
                          : 'border-[#E2DDD5] bg-[#FFFFFF] hover:border-[#CDC7BC]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: stStyle.text }}
                        />
                        <span>{st}</span>
                      </span>
                      {isSelected && <Check size={14} className="text-[#A58A5C]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ECE8E0]">
              <Button variant="secondary" size="sm" onClick={() => setSelectedCell(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveCellStatus}>
                Update Allocation
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
