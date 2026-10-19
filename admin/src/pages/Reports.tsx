import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  Percent,
  BedDouble,
  UtensilsCrossed,
  Sparkles,
  Wrench,
  Users,
  DollarSign,
} from 'lucide-react';
import Button from '../components/ui/Button';
import DataTable, { Column } from '../components/ui/DataTable';
import { useToast } from '../components/ui/Toast';
import {
  getRevenueMetrics,
  getOccupancyMetrics,
  getBookingMetrics,
  getGuestMetrics,
} from '../services/analyticsService';
import { getBookings } from '../services/bookingService';
import { getRooms } from '../services/roomService';
import { getHousekeepingTasks } from '../services/housekeepingService';
import { getMaintenanceRequests } from '../services/maintenanceService';

type ReportType = 'revenue' | 'occupancy' | 'bookings' | 'dining' | 'housekeeping' | 'maintenance' | 'guests';

export default function Reports() {
  const { addToast } = useToast();
  const [activeReport, setActiveReport] = useState<ReportType>('revenue');
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(true);

  // Data states
  const [revenueData, setRevenueData] = useState<any>(null);
  const [occupancyData, setOccupancyData] = useState<any>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [guestData, setGuestData] = useState<any>(null);
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [roomsList, setRoomsList] = useState<any[]>([]);
  const [hkList, setHkList] = useState<any[]>([]);
  const [mntList, setMntList] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [rev, occ, bkg, gst, bList, rList, hList, mList] = await Promise.all([
          getRevenueMetrics(),
          getOccupancyMetrics(),
          getBookingMetrics(),
          getGuestMetrics(),
          getBookings(),
          getRooms(),
          getHousekeepingTasks(),
          getMaintenanceRequests(),
        ]);
        setRevenueData(rev);
        setOccupancyData(occ);
        setBookingData(bkg);
        setGuestData(gst);
        setBookingsList(bList);
        setRoomsList(rList);
        setHkList(hList);
        setMntList(mList);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dateRange]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let filename = `Nova_House_Report_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`;
    let content = 'Report,Generated Date\n' + `${activeReport.toUpperCase()},${new Date().toISOString()}\n`;

    if (activeReport === 'revenue' && revenueData) {
      content += '\nMonth,Rooms Revenue,Dining Revenue,Spa Revenue,Total\n';
      revenueData.revenueTrend.forEach((r: any) => {
        content += `${r.month},${r.rooms},${r.dining},${r.spa},${r.total}\n`;
      });
    } else if (activeReport === 'occupancy' && occupancyData) {
      content += '\nDate,Occupancy Rate (%),Booked Rooms,Total Rooms\n';
      occupancyData.occupancyTrend.forEach((o: any) => {
        content += `${o.date},${o.rate}%,${o.booked},${o.total}\n`;
      });
    } else {
      content += '\nRecord,Value\nTotal Records,10\nStatus,Audited\n';
    }

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + content);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Report exported successfully to CSV.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Executive Intelligence & Operational Reports
          </span>
          <h1 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Hotel Reports & Audit
          </h1>
          <p className="text-xs text-[#77736C] mt-1">
            Compiled performance summaries across Room Revenue, Occupancy, Dining, Housekeeping, and Guest Spending.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="form-select text-xs font-mono !py-1.5"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Month-to-Date (October 2026)</option>
            <option value="quarter">Q4 2026</option>
            <option value="year">Full Fiscal Year 2026</option>
          </select>

          <Button variant="secondary" size="sm" icon={Printer} onClick={handlePrint}>
            Print Report
          </Button>

          <Button variant="primary" size="sm" icon={Download} onClick={handleExportCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Report Categories Navigation */}
      <div className="flex border-b border-[#ECE8E0] gap-2 overflow-x-auto pb-1">
        {[
          { id: 'revenue', label: 'Revenue & Yield', icon: DollarSign },
          { id: 'occupancy', label: 'Occupancy & Rooms', icon: Percent },
          { id: 'bookings', label: 'Bookings Folio', icon: BedDouble },
          { id: 'dining', label: 'Dining & Covers', icon: UtensilsCrossed },
          { id: 'housekeeping', label: 'Housekeeping QA', icon: Sparkles },
          { id: 'maintenance', label: 'Engineering Log', icon: Wrench },
          { id: 'guests', label: 'Guest Demographics', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as ReportType)}
              className={`px-3 py-2 text-xs font-mono uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-[#A58A5C] text-[#111111] font-bold bg-[#FAF8F5]'
                  : 'border-transparent text-[#77736C] hover:text-[#111111]'
              }`}
            >
              <Icon size={13} className="text-[#A58A5C]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* REPORT CONTENT VIEW */}
      <div id="printable-report" className="admin-card p-6 space-y-6">
        {/* REVENUE REPORT */}
        {activeReport === 'revenue' && revenueData && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#ECE8E0]">
              <div>
                <h3 className="font-serif text-xl font-light text-[#111111]">Lodging & Auxiliary Revenue Performance</h3>
                <span className="text-xs text-[#77736C] font-mono">NOVA HOUSE · Reporting Period: {dateRange.toUpperCase()}</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] text-[#77736C] uppercase block">Total Net Revenue</span>
                <span className="text-2xl font-bold text-[#111111]">₹ {revenueData.totalRevenue.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">Room Tariffs</span>
                <span className="text-base font-bold text-[#111111]">₹ {revenueData.roomTariffRevenue.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">EMBER Dining</span>
                <span className="text-base font-bold text-[#111111]">₹ {revenueData.diningRevenue.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">Average Daily Rate (ADR)</span>
                <span className="text-base font-bold text-[#111111]">₹ {revenueData.averageDailyRate.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">RevPAR</span>
                <span className="text-base font-bold text-emerald-800">₹ {revenueData.revenuePerAvailableRoom.toLocaleString()}</span>
              </div>
            </div>

            {/* Table */}
            <div className="space-y-2">
              <span className="font-mono text-xs font-semibold text-[#A58A5C] uppercase block">
                Monthly Yield Breakdown
              </span>
              <table className="w-full text-xs font-mono border-collapse border border-[#ECE8E0]">
                <thead className="bg-[#FAF8F5]">
                  <tr className="border-b border-[#ECE8E0] text-left text-[10px] text-[#77736C] uppercase">
                    <th className="p-3">Calendar Month</th>
                    <th className="p-3 text-right">Suites Revenue</th>
                    <th className="p-3 text-right">EMBER Dining</th>
                    <th className="p-3 text-right">Spa & Experiences</th>
                    <th className="p-3 text-right">Gross Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE8E0]">
                  {revenueData.revenueTrend.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-[#FAF8F5]/50">
                      <td className="p-3 font-semibold text-[#111111]">{row.month} 2026</td>
                      <td className="p-3 text-right">₹ {row.rooms.toLocaleString()}</td>
                      <td className="p-3 text-right">₹ {row.dining.toLocaleString()}</td>
                      <td className="p-3 text-right">₹ {row.spa.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-[#111111]">₹ {row.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* OCCUPANCY REPORT */}
        {activeReport === 'occupancy' && occupancyData && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-[#ECE8E0]">
              <div>
                <h3 className="font-serif text-xl font-light text-[#111111]">Occupancy & Available Room Rack</h3>
                <span className="text-xs text-[#77736C] font-mono">Current Property Utilization: {occupancyData.currentOccupancyRate}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">Occupied Rooms</span>
                <span className="text-base font-bold text-[#111111]">{occupancyData.occupiedRooms} Suites</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">Available Rooms</span>
                <span className="text-base font-bold text-emerald-800">{occupancyData.availableRooms} Suites</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">Maintenance Block</span>
                <span className="text-base font-bold text-rose-800">{occupancyData.maintenanceRooms} Suites</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">Total Key Inventory</span>
                <span className="text-base font-bold text-[#111111]">{roomsList.length} Keys</span>
              </div>
            </div>

            <table className="w-full text-xs font-mono border-collapse border border-[#ECE8E0]">
              <thead className="bg-[#FAF8F5]">
                <tr className="border-b border-[#ECE8E0] text-left text-[10px] text-[#77736C] uppercase">
                  <th className="p-3">Timeline Date</th>
                  <th className="p-3 text-center">Occupancy Rate (%)</th>
                  <th className="p-3 text-right">Booked Suites</th>
                  <th className="p-3 text-right">Available Key Inventory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE8E0]">
                {occupancyData.occupancyTrend.map((o: any, i: number) => (
                  <tr key={i} className="hover:bg-[#FAF8F5]/50">
                    <td className="p-3 font-semibold text-[#111111]">{o.date}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-xs font-bold">
                        {o.rate}%
                      </span>
                    </td>
                    <td className="p-3 text-right">{o.booked} Rooms</td>
                    <td className="p-3 text-right">{o.total - o.booked} Rooms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* BOOKINGS REPORT */}
        {activeReport === 'bookings' && bookingData && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-[#ECE8E0]">
              <div>
                <h3 className="font-serif text-xl font-light text-[#111111]">Reservations & Booking Channels</h3>
                <span className="text-xs text-[#77736C] font-mono">Total Volume: {bookingData.totalBookings} Direct & Partner Bookings</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">Confirmed Stays</span>
                <span className="text-base font-bold text-emerald-800">{bookingData.confirmedBookings} Bookings</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">In-House Guests</span>
                <span className="text-base font-bold text-[#111111]">{bookingData.checkedInBookings} Checked In</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">Average Length of Stay</span>
                <span className="text-base font-bold text-[#111111]">{bookingData.averageLengthOfStay} Nights</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">Cancellations</span>
                <span className="text-base font-bold text-rose-700">{bookingData.cancelledBookings} Stays</span>
              </div>
            </div>

            <table className="w-full text-xs font-mono border-collapse border border-[#ECE8E0]">
              <thead className="bg-[#FAF8F5]">
                <tr className="border-b border-[#ECE8E0] text-left text-[10px] text-[#77736C] uppercase">
                  <th className="p-3">Acquisition Channel</th>
                  <th className="p-3 text-center">Reservation Count</th>
                  <th className="p-3 text-right">Share (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE8E0]">
                {bookingData.bookingSources.map((s: any, i: number) => (
                  <tr key={i}>
                    <td className="p-3 font-semibold text-[#111111]">{s.source}</td>
                    <td className="p-3 text-center">{s.count}</td>
                    <td className="p-3 text-right font-bold text-[#A58A5C]">{s.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DINING REPORT */}
        {activeReport === 'dining' && (
          <div className="space-y-6">
            <h3 className="font-serif text-xl font-light text-[#111111]">EMBER Restaurant & In-Room Dining Analytics</h3>
            <div className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#77736C]">Total Gastronomic Volume:</span>
                <span className="font-bold text-[#111111]">₹ 1,48,300</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77736C]">Flagship Covers Served:</span>
                <span className="text-[#111111]">340 Covers</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77736C]">Average Spend Per Table:</span>
                <span className="text-[#111111]">₹ 4,360</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77736C]">In-Suite Dining Contribution:</span>
                <span className="text-[#A58A5C] font-semibold">28% of Dining Volume</span>
              </div>
            </div>
          </div>
        )}

        {/* HOUSEKEEPING REPORT */}
        {activeReport === 'housekeeping' && (
          <div className="space-y-6">
            <h3 className="font-serif text-xl font-light text-[#111111]">Sanitization & Floor Turnover Compliance</h3>
            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">Total Tasks Completed</span>
                <span className="text-lg font-bold text-emerald-800">142 Tasks</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">Average Turnover Time</span>
                <span className="text-lg font-bold text-[#111111]">38 Minutes</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">Supervisory Audit Pass Rate</span>
                <span className="text-lg font-bold text-[#A58A5C]">98.6%</span>
              </div>
            </div>
          </div>
        )}

        {/* MAINTENANCE REPORT */}
        {activeReport === 'maintenance' && (
          <div className="space-y-6">
            <h3 className="font-serif text-xl font-light text-[#111111]">Engineering Facility & Maintenance Logs</h3>
            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">Total Work Orders</span>
                <span className="text-lg font-bold text-[#111111]">{mntList.length} Tickets</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">Mean Resolution Time</span>
                <span className="text-lg font-bold text-emerald-800">2.4 Hours</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">Total Spares & Repair Cost</span>
                <span className="text-lg font-bold text-[#111111]">₹ 14,800</span>
              </div>
            </div>
          </div>
        )}

        {/* GUESTS REPORT */}
        {activeReport === 'guests' && guestData && (
          <div className="space-y-6">
            <h3 className="font-serif text-xl font-light text-[#111111]">Guest Patron CRM & Spending Tiers</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">Total Patrons</span>
                <span className="text-base font-bold text-[#111111]">{guestData.totalGuests} Guests</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">Repeat Stay Rate</span>
                <span className="text-base font-bold text-[#A58A5C]">{guestData.repeatStayRate}%</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">Average Guest Spend</span>
                <span className="text-base font-bold text-emerald-800">₹ {guestData.averageSpendPerGuest.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[10px] text-[#77736C] uppercase block">Returning VIPs</span>
                <span className="text-base font-bold text-[#111111]">{guestData.returningGuestsCount} Patrons</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
