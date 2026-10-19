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

// ============================================================================
// HOTEL OPERATIONS: HOUSEKEEPING & MAINTENANCE
// ============================================================================

export type HousekeepingStatus = 'Clean' | 'Dirty' | 'Cleaning' | 'Inspected' | 'Out of Service';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Inspected';

export interface HousekeepingTask {
  id: string;
  roomNumber: string;
  roomType: string;
  taskType: 'Daily Turnover' | 'Deep Clean' | 'Checkout Clean' | 'Touch-up' | 'Linen Change' | 'Inspection';
  assignedStaff: string;
  priority: TaskPriority;
  status: TaskStatus;
  roomStatus: HousekeepingStatus;
  scheduledTime: string;
  completedAt?: string;
  notes?: string;
  checklist: { item: string; completed: boolean }[];
}

export interface LostAndFoundItem {
  id: string;
  item: string;
  locationFound: string; // e.g. Room 204 or Ember Dining
  foundDate: string;
  foundBy: string;
  status: 'Reported' | 'Stored' | 'Claimed' | 'Disposed';
  guestName?: string;
  guestPhone?: string;
  claimedDate?: string;
}

export interface MaintenanceRequest {
  id: string;
  roomNumber: string;
  category: 'Plumbing' | 'Electrical' | 'HVAC' | 'Carpentry' | 'Audio/Visual' | 'Appliance' | 'Other';
  issue: string;
  description: string;
  priority: TaskPriority;
  status: 'Open' | 'In Progress' | 'Completed' | 'On Hold';
  assignedStaff: string;
  createdDate: string;
  completedDate?: string;
  resolutionNotes?: string;
  estimatedCost?: number;
}

// ============================================================================
// HOTEL OPERATIONS: DINING (TABLES, ORDERS, ROOM SERVICE)
// ============================================================================

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  capacity: number;
  section: 'Main Dining' | 'Courtyard Terrace' | 'Cellar Lounge' | 'Private Pavilion';
  status: 'Available' | 'Occupied' | 'Reserved';
  currentOrderId?: string;
  reservedFor?: string;
  reservationTime?: string;
}

export type OrderStatus = 'New' | 'Accepted' | 'Preparing' | 'Ready' | 'Delivered' | 'Completed' | 'Cancelled';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface RestaurantOrder {
  id: string;
  orderNumber: string;
  tableNumber: string;
  guestName?: string;
  roomNumber?: string;
  items: OrderItem[];
  subtotal: number;
  taxes: number;
  total: number;
  status: OrderStatus;
  paymentStatus: 'PAID' | 'UNPAID' | 'BILLED_TO_ROOM';
  createdAt: string;
  serverName: string;
  specialInstructions?: string;
}

export interface RoomServiceOrder {
  id: string;
  orderNumber: string;
  roomNumber: string;
  guestName: string;
  guestPhone?: string;
  bookingId?: string;
  items: OrderItem[];
  subtotal: number;
  taxes: number;
  deliveryCharge: number;
  total: number;
  status: OrderStatus;
  paymentStatus: 'PAID' | 'UNPAID' | 'BILLED_TO_ROOM';
  createdAt: string;
  deliveryTimeEstimated?: string;
  assignedStaff?: string;
  specialInstructions?: string;
}

// ============================================================================
// GUEST EXPERIENCE: DOCUMENTS & COMMUNICATION
// ============================================================================

export type DocumentType = 'Passport' | 'Aadhaar Card' | 'Driver License' | 'Voter ID' | 'Visa' | 'Other';
export type VerificationStatus = 'Pending' | 'Verified' | 'Rejected';

export interface GuestDocument {
  id: string;
  guestId: string;
  guestName: string;
  documentType: DocumentType;
  documentNumber: string;
  nationality: string;
  expiryDate?: string;
  uploadDate: string;
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  fileUrl?: string;
  fileName?: string;
  notes?: string;
}

export interface GuestCommunication {
  id: string;
  guestId?: string;
  bookingId?: string;
  guestName: string;
  channel: 'Email' | 'SMS' | 'Internal Note' | 'WhatsApp';
  type: 'Booking Confirmation' | 'Pre-Arrival Check-In' | 'Stay Courtesy' | 'Check-Out Invoice' | 'Cancellation Notice' | 'Custom Message' | 'Enquiry Follow-Up';
  subject?: string;
  content: string;
  sentBy: string;
  sentAt: string;
  status: 'Sent' | 'Delivered' | 'Read' | 'Failed';
}

// ============================================================================
// FINANCE: INVOICES, RECEIPTS, SETTLEMENTS
// ============================================================================

export interface InvoiceLineItem {
  id: string;
  description: string;
  category: 'Room Tariff' | 'Dining' | 'Room Service' | 'Spa & Experience' | 'Mini Bar' | 'Laundry' | 'Taxes' | 'Other';
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  companyName?: string;
  gstin?: string;
  roomNumber?: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceLineItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  totalTaxes: number;
  discount: number;
  grandTotal: number;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Cancelled';
  paymentMethod?: string;
  notes?: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  invoiceId?: string;
  bookingId?: string;
  paymentId: string;
  guestName: string;
  guestEmail?: string;
  amountPaid: number;
  currency: string;
  paymentMethod: string;
  paidAt: string;
  transactionRef: string;
  receivedBy: string;
  notes?: string;
}

export interface Settlement {
  id: string;
  settlementId: string;
  gateway: 'Razorpay' | 'POS Terminal' | 'Direct Bank Transfer';
  capturedAmount: number;
  refundedAmount: number;
  gatewayFees: number;
  taxOnFees: number;
  netSettlement: number;
  settlementDate: string;
  transactionCount: number;
  status: 'Reconciled' | 'Processing' | 'Pending';
  utrNumber?: string;
}

// ============================================================================
// MANAGEMENT: ROLES & ACTIVITY LOGS
// ============================================================================

export interface RolePermission {
  id: string;
  roleName: string;
  description: string;
  userCount: number;
  permissions: {
    dashboard: boolean;
    bookings: boolean;
    rooms: boolean;
    guests: boolean;
    availability: boolean;
    pricing: boolean;
    housekeeping: boolean;
    maintenance: boolean;
    dining: boolean;
    experiences: boolean;
    offers: boolean;
    documents: boolean;
    communications: boolean;
    reviews: boolean;
    enquiries: boolean;
    payments: boolean;
    invoices: boolean;
    settlements: boolean;
    analytics: boolean;
    staff: boolean;
    settings: boolean;
  };
}

export interface ActivityLog {
  id: string;
  user: string;
  role: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

