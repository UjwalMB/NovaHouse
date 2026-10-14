/**
 * NOVA HOUSE · Admin Type Definitions
 * Typed contracts for bookings, rooms, guests, payments, and CMS entities.
 */

export interface Booking {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCountry?: string;
  roomNumber: string;
  roomType: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  baseRate: number;
  taxes: number;
  discount?: number;
  totalAmount: number;
  paymentStatus: string;
  bookingStatus: string;
  paymentMethod?: string;
  paymentId?: string;
  razorpayOrderId?: string;
  specialRequests?: string;
  source?: string;
  createdAt?: string;
}

export interface Room {
  id: string;
  name: string;
  type: string;
  category: string;
  floor: string;
  roomNumber: string;
  capacity: number;
  bedType: string;
  size: string;
  price: number;
  weekendPrice?: number;
  peakPrice?: number;
  discountPrice?: number;
  status: 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance' | 'Reserved' | 'Blocked' | string;
  amenities: string[];
  image: string;
  description: string;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  totalStays: number;
  totalSpent: number;
  lastStay: string;
  status: string;
  tier: string;
  preferences: string[];
  notes?: string;
  history: string[];
}

export interface PaymentRecord {
  id: string;
  bookingId?: string;
  booking_id?: string;
  amount: number;
  amountPaise?: number;
  amount_paise?: number;
  currency?: string;
  status: string;
  method?: string;
  razorpayOrderId?: string;
  razorpay_order_id?: string;
  razorpayPaymentId?: string;
  razorpay_payment_id?: string;
  email?: string;
  contact?: string;
  refundAmount?: number;
  refund_amount?: number;
  refundId?: string;
  refund_id?: string;
  createdAt?: string;
  created_at?: string;
  booking?: Booking;
}

export interface PaymentStats {
  totalGrossVolume: number;
  netVolume: number;
  refundedVolume: number;
  successRate: number;
  refundRate: number;
  statusDistribution: {
    PAID: number;
    PENDING: number;
    FAILED: number;
    REFUNDED: number;
  };
  totalTransactions: number;
}

export interface RefundPayload {
  amount?: number;
  reason?: string;
}

export interface NotificationLog {
  id: string;
  booking_id: string;
  channel: string;
  recipient: string;
  message_type: string;
  status: string;
  payload?: any;
  provider_response?: any;
  error_message?: string;
  attempts: number;
  created_at: string;
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  date: string;
  status: string;
  priority: string;
  notes?: string;
}

export interface Review {
  id: string;
  guest: string;
  country?: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  room: string;
  status: string;
  source: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: string;
  lastActive?: string;
  avatar?: string;
}

export interface Offer {
  id: string;
  name: string;
  tagline: string;
  description: string;
  discount: string;
  code: string;
  validFrom: string;
  validUntil: string;
  applicableRooms: string[];
  terms?: string;
  image: string;
  status: string;
  claimedCount: number;
}

export interface Experience {
  id: string;
  title: string;
  category: string;
  subtitle: string;
  description: string;
  hours: string;
  temperature?: string;
  price: string;
  availability: string;
  capacity: string;
  image: string;
  features: string[];
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
  caption?: string;
  featured?: boolean;
  order?: number;
}

export interface DiningInfo {
  restaurant: any;
  cocktailLounge?: any;
  inRoomDining?: any;
  privateCellar?: any;
  tastingMenu?: any;
}

export interface WebsiteContent {
  homepage: any;
  suitesPage?: any;
  diningPage?: any;
  experiencesPage?: any;
  aboutPage?: any;
  contactInfo?: any;
  hotelInfo?: any;
  location?: any;
  policies?: any;
  [key: string]: any;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'ANALYST';
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  availability: 'Available' | 'Low Stock' | 'Unavailable' | string;
  isChefSpecial: boolean;
  image: string;
}
