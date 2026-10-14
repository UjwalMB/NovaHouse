import { initialRooms } from './rooms';
import { initialBookings } from './bookings';
import { initialGuests } from './guests';
import { initialDining } from './dining';
import { initialExperiences } from './experiences';
import { initialGallery, galleryCategories } from './gallery';
import { initialOffers } from './offers';
import { initialEnquiries } from './enquiries';
import { initialReviews } from './reviews';
import { initialStaff, staffRoles } from './staff';
import { initialWebsiteContent } from './websiteContent';

export {
  initialRooms,
  initialBookings,
  initialGuests,
  initialDining,
  initialExperiences,
  initialGallery,
  galleryCategories,
  initialOffers,
  initialEnquiries,
  initialReviews,
  initialStaff,
  staffRoles,
  initialWebsiteContent
};

// Dashboard KPI metrics calculator
export function calculateDashboardKPIs(bookings = initialBookings, rooms = initialRooms) {
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
  const availableRooms = rooms.filter(r => r.status === 'Available').length;
  const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

  const todayBookingsCount = bookings.filter(b => b.checkIn === '2026-10-12').length;
  const todayRevenue = bookings
    .filter(b => b.checkIn === '2026-10-12' && b.paymentStatus === 'Paid')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const pendingEnquiriesCount = 7;
  const cancelledCount = bookings.filter(b => b.bookingStatus === 'Cancelled').length;

  return {
    todayBookings: 24, // demo calibrated metric
    occupancyRate: occupancyRate || 78,
    todayRevenue: 248500, // ₹ 2,48,500
    availableRooms: availableRooms || 18,
    pendingEnquiries: pendingEnquiriesCount,
    cancelled: cancelledCount || 3,
    totalGuestsMonth: 312,
    revPAR: 18450
  };
}

// Revenue chart 7d / 30d / 90d / 1y mock points
export const revenueChartData = {
  '7 Days': [
    { name: 'Mon (06 Oct)', revenue: 198000, bookings: 18 },
    { name: 'Tue (07 Oct)', revenue: 215000, bookings: 21 },
    { name: 'Wed (08 Oct)', revenue: 232000, bookings: 22 },
    { name: 'Thu (09 Oct)', revenue: 245000, bookings: 23 },
    { name: 'Fri (10 Oct)', revenue: 290000, bookings: 27 },
    { name: 'Sat (11 Oct)', revenue: 315000, bookings: 29 },
    { name: 'Sun (12 Oct)', revenue: 248500, bookings: 24 },
  ],
  '30 Days': [
    { name: 'Week 1', revenue: 1420000, bookings: 135 },
    { name: 'Week 2', revenue: 1580000, bookings: 148 },
    { name: 'Week 3', revenue: 1690000, bookings: 162 },
    { name: 'Week 4', revenue: 1850000, bookings: 178 },
  ],
  '90 Days': [
    { name: 'August', revenue: 6400000, bookings: 590 },
    { name: 'September', revenue: 7100000, bookings: 645 },
    { name: 'October', revenue: 7850000, bookings: 710 },
  ],
  '1 Year': [
    { name: 'Q1', revenue: 18200000, bookings: 1680 },
    { name: 'Q2', revenue: 21400000, bookings: 1940 },
    { name: 'Q3', revenue: 24100000, bookings: 2150 },
    { name: 'Q4 (Est.)', revenue: 27500000, bookings: 2420 },
  ]
};

// Occupancy trend points
export const occupancyChartData = [
  { day: 'Mon', rate: 72 },
  { day: 'Tue', rate: 75 },
  { day: 'Wed', rate: 80 },
  { day: 'Thu', rate: 84 },
  { day: 'Fri', rate: 95 },
  { day: 'Sat', rate: 98 },
  { day: 'Sun', rate: 78 },
];

// Activity Feed Mock
export const initialActivityFeed = [
  {
    id: 'ACT-01',
    type: 'booking',
    title: 'New booking received',
    description: 'Marcus Bennett booked The Skyline Penthouse for 7 nights (NH-1031)',
    time: '8 mins ago',
    icon: 'calendar'
  },
  {
    id: 'ACT-02',
    type: 'checkin',
    title: 'Guest checked in',
    description: 'Rahul Sharma checked into Nova Suite #301',
    time: '24 mins ago',
    icon: 'user-check'
  },
  {
    id: 'ACT-03',
    type: 'room',
    title: 'Room marked available',
    description: 'Deluxe Courtyard #101 cleaned and inspected by Housekeeping',
    time: '45 mins ago',
    icon: 'door-open'
  },
  {
    id: 'ACT-04',
    type: 'enquiry',
    title: 'New enquiry received',
    description: 'Siddharth Varma requested Glasshouse private buyout info',
    time: '1 hour ago',
    icon: 'mail'
  },
  {
    id: 'ACT-05',
    type: 'payment',
    title: 'Payment received',
    description: '₹ 5,01,500 settled via Wire for Eleanor Vance (NH-1025)',
    time: '2 hours ago',
    icon: 'credit-card'
  }
];
