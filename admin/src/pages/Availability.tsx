import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Bed,
  Sparkles,
} from 'lucide-react';
import { useRooms } from '../hooks/useRooms';
import { useBookings } from '../hooks/useBookings';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Room } from '../types';

interface CalendarDate {
  key: string;
  dateObj: Date;
  dayNumber: number;
  weekday: string;
  month: string;
  isWeekend: boolean;
}

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
  'Out of Service': {
    bg: '#F7EBEB',
    text: '#7A1C1C',
    border: '#E8BFBF',
    label: 'OOS',
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

  // Date Window (14 continuous dates)
  const [baseDate, setBaseDate] = useState(() => new Date(2026, 9, 12));

  // Generate 14 continuous dates from baseDate
  const calendarDates: CalendarDate[] = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      return {
        key: iso,
        dateObj: d,
        dayNumber: d.getDate(),
        weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      };
    });
  }, [baseDate]);

  const handlePrevFortnight = () => {
    setBaseDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 14);
      return d;
    });
  };

  const handleNextFortnight = () => {
    setBaseDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 14);
      return d;
    });
  };

  const handleResetToday = () => {
    setBaseDate(new Date(2026, 9, 12));
  };

  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');

  // Selected cell for status change modal
  const [selectedCell, setSelectedCell] = useState<SelectedCellState | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('Available');

  // Custom local matrix overrides for dates
  const [matrixOverrides, setMatrixOverrides] = useState<Record<string, string>>({});

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchesType = typeFilter === 'all' || r.type.toLowerCase() === typeFilter.toLowerCase();
      const matchesFloor = floorFilter === 'all' || r.floor.toLowerCase() === floorFilter.toLowerCase();
      return matchesType && matchesFloor;
    });
  }, [rooms, typeFilter, floorFilter]);

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
    if (room.status === 'Cleaning' || room.status === 'Dirty') return 'Maintenance';
    return room.status || 'Available';
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

  // Compute Occupancy & Availability metrics across active 14-day window
  const metrics = useMemo(() => {
    let totalSlots = 0;
    let availableSlots = 0;
    let occupiedSlots = 0;
    let reservedSlots = 0;
    let maintenanceSlots = 0;
    let blockedSlots = 0;

    filteredRooms.forEach((room) => {
      calendarDates.forEach((date) => {
        totalSlots++;
        const status = getCellStatus(room, date.key);
        if (status === 'Available') availableSlots++;
        else if (status === 'Occupied') occupiedSlots++;
        else if (status === 'Reserved') reservedSlots++;
        else if (status === 'Maintenance' || status === 'Out of Service') maintenanceSlots++;
        else if (status === 'Blocked') blockedSlots++;
      });
    });

    const activeOccupied = occupiedSlots + reservedSlots;
    const occupancyRate = totalSlots > 0 ? Math.round((activeOccupied / totalSlots) * 100) : 0;

    return {
      totalSlots,
      availableSlots,
      occupiedSlots,
      reservedSlots,
      maintenanceSlots,
      blockedSlots,
      occupancyRate,
    };
  }, [filteredRooms, calendarDates, matrixOverrides, bookings]);

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
            Visual room rack. Real-time availability, blockings, maintenance locks, and date allocation.
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

      {/* Top Occupancy KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="admin-card p-3.5 text-center">
          <span className="text-[10px] font-mono uppercase text-[#77736C] block">Occupancy Rate</span>
          <span className="font-serif text-2xl font-medium text-[#111111]">{metrics.occupancyRate}%</span>
          <span className="text-[9px] font-mono text-[#A58A5C] block mt-0.5">14-Day Forecast</span>
        </div>

        <div className="admin-card p-3.5 text-center border-l-2 border-l-emerald-600">
          <span className="text-[10px] font-mono uppercase text-[#77736C] block">Available Slots</span>
          <span className="font-serif text-2xl font-medium text-emerald-800">{metrics.availableSlots}</span>
          <span className="text-[9px] font-mono text-emerald-600 block mt-0.5">Open For Sale</span>
        </div>

        <div className="admin-card p-3.5 text-center border-l-2 border-l-[#244C66]">
          <span className="text-[10px] font-mono uppercase text-[#77736C] block">Occupied</span>
          <span className="font-serif text-2xl font-medium text-[#244C66]">{metrics.occupiedSlots}</span>
          <span className="text-[9px] font-mono text-[#77736C] block mt-0.5">Checked In</span>
        </div>

        <div className="admin-card p-3.5 text-center border-l-2 border-l-purple-600">
          <span className="text-[10px] font-mono uppercase text-[#77736C] block">Reserved</span>
          <span className="font-serif text-2xl font-medium text-[#5E3E6E]">{metrics.reservedSlots}</span>
          <span className="text-[9px] font-mono text-purple-600 block mt-0.5">Confirmed Advance</span>
        </div>

        <div className="admin-card p-3.5 text-center border-l-2 border-l-rose-600">
          <span className="text-[10px] font-mono uppercase text-[#77736C] block">Maintenance</span>
          <span className="font-serif text-2xl font-medium text-[#962828]">{metrics.maintenanceSlots}</span>
          <span className="text-[9px] font-mono text-rose-600 block mt-0.5">Off Market</span>
        </div>

        <div className="admin-card p-3.5 text-center border-l-2 border-l-[#77736C]">
          <span className="text-[10px] font-mono uppercase text-[#77736C] block">Blocked</span>
          <span className="font-serif text-2xl font-medium text-[#55514B]">{metrics.blockedSlots}</span>
          <span className="text-[9px] font-mono text-[#77736C] block mt-0.5">Administrative</span>
        </div>
      </div>

      {/* Date Navigation & Filters Toolbar */}
      <div className="admin-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Date Pager */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevFortnight}
              className="p-1.5 border border-[#E2DDD5] bg-[#FFFFFF] rounded-xs hover:bg-[#F4F1EB] transition-colors cursor-pointer"
              title="Previous 14 Days"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={handleResetToday}
              className="px-2.5 py-1.5 text-xs font-mono border border-[#E2DDD5] bg-[#FFFFFF] hover:bg-[#F4F1EB] rounded-xs cursor-pointer font-medium"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextFortnight}
              className="p-1.5 border border-[#E2DDD5] bg-[#FFFFFF] rounded-xs hover:bg-[#F4F1EB] transition-colors cursor-pointer"
              title="Next 14 Days"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <span className="font-mono text-xs font-semibold text-[#111111] flex items-center gap-1.5">
            <CalendarIcon size={14} className="text-[#A58A5C]" />
            <span>
              {calendarDates[0].dayNumber} {calendarDates[0].month} – {calendarDates[13].dayNumber} {calendarDates[13].month} 2026
            </span>
          </span>
        </div>

        {/* Room Type & Floor Selectors */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-select !py-2 text-xs font-mono"
          >
            <option value="all">All Room Types</option>
            <option value="Deluxe Room">Deluxe Room</option>
            <option value="Premier Room">Premier Room</option>
            <option value="Junior Suite">Junior Suite</option>
            <option value="Executive Suite">Executive Suite</option>
            <option value="Terrace Suite">Terrace Suite</option>
            <option value="Penthouse">Penthouse</option>
            <option value="Studio">Studio</option>
          </select>

          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="form-select !py-2 text-xs font-mono"
          >
            <option value="all">All Floors</option>
            <option value="1st Floor">1st Floor</option>
            <option value="2nd Floor">2nd Floor</option>
            <option value="3rd Floor">3rd Floor</option>
            <option value="4th Floor">4th Floor</option>
            <option value="5th Floor">5th Floor</option>
          </select>
        </div>
      </div>

      {/* Grid Container */}
      <div className="admin-card overflow-hidden">
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
                    className={`p-2.5 text-center font-mono text-xs border-r border-[#ECE8E0] min-w-[75px] ${
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
              {filteredRooms.map((room) => (
                <tr key={room.id} className="border-b border-[#ECE8E0] hover:bg-[#FAF8F5]/50">
                  {/* Sticky Room Label */}
                  <td className="sticky left-0 z-10 bg-[#FFFFFF] p-3 border-r border-[#E2DDD5] shadow-xs">
                    <div className="font-mono text-xs font-bold text-[#111111]">
                      #{room.roomNumber}
                    </div>
                    <div className="font-serif text-[11px] text-[#77736C] truncate max-w-[150px]">
                      {room.name}
                    </div>
                    <span className="text-[9px] font-mono text-[#A58A5C] block">
                      {room.floor} · {room.type}
                    </span>
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
                          className="h-10 rounded-xs border flex items-center justify-center font-mono text-[10px] font-medium cursor-pointer transition-transform hover:scale-95 shadow-2xs"
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
                {['Available', 'Occupied', 'Reserved', 'Maintenance', 'Blocked', 'Out of Service'].map((st) => {
                  const isSelected = targetStatus === st;
                  const stStyle = statusStyleMap[st] || statusStyleMap.Available;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTargetStatus(st)}
                      className={`p-3 rounded-xs border text-xs font-mono text-left transition-all flex items-center justify-between cursor-pointer ${
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
