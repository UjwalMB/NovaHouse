# NOVA HOUSE · Luxury Hotel Booking & Management System

This repository consists of **strictly two frontend websites** communicating via Supabase APIs:

1. **Customer Interface (`customer/`)** · Running on `http://localhost:5173`
   - Public-facing hotel website for guests and external visitors.
   - **Browse Rooms & Suites**: Live inventory, room descriptions, amenities, and nightly prices directly synchronized from Supabase / Admin.
   - **Curated Promotional Offers**: Live active privileges, seasonal discount codes (`SANCTUARY15`, `RESIDENCY25`, `EMBERHEARTH`), and instant one-click code claim.
   - **Live Dining Menu & Reservations**: Live restaurant dishes (Breakfast, Starters, Main Course, Desserts, Beverages), prices, chef special tags, and priority table reservation at EMBER restaurant.
   - **Direct Booking & Online Payment**: Full date validation, guest details (name, email, phone, number of guests), promo code discount application, and Razorpay checkout.

2. **Admin Panel (`admin/`)** · Running on `http://localhost:5174`
   - Private management portal for hotel staff and managers.
   - **Live Bookings Radar & Dossier**: Details of who booked, which room, reservation time, number of individuals, phone/email, payment status, and special requests.
   - **Booking Validation & Lifecycle**: Check-in, check-out, cancel, mark paid/unpaid, and refund management.
   - **Room Tariff & Pricing Management**: Real-time room price and status updates (Available, Occupied, Maintenance) that immediately reflect on the customer website.
   - **Promotions & Offers Desk**: Create, edit, schedule, or disable promotional discount codes.
   - **Dining & Menu Management**: Add, edit, or adjust prices and availability for dishes and beverages.

---

## Real-Time Synchronization Flow

- **Customer ➔ Admin**: Every time a guest books a room or completes a payment on the customer website, the booking is instantly registered in Supabase `public.bookings` and `public.payments`, automatically showing up on the admin panel in real time.
- **Admin ➔ Customer**: Whenever the hotel admin modifies a room's price or status (e.g. Deluxe Room price, availability), adds or edits a promotional offer, or changes a dining menu dish price, the changes immediately sync and update across the customer website.

---

## Supabase Connection Details

- **Database Host**: `aws-0-ap-northeast-2.pooler.supabase.com:5432` / `db.rcirzjtfynlozlehtbwp.supabase.co:5432`
- **Supabase Project URL**: `https://rcirzjtfynlozlehtbwp.supabase.co`
- **Anon Public Key**: Copy your project's `anon` public key from [Supabase Dashboard > Project Settings > API](https://supabase.com/dashboard/project/rcirzjtfynlozlehtbwp/settings/api) and paste it into:
  - `customer/.env` (`VITE_SUPABASE_ANON_KEY=your_anon_key`)
  - `admin/.env` (`VITE_SUPABASE_ANON_KEY=your_anon_key`)
*(Both apps also include robust real-time local state synchronization so the two websites work and sync seamlessly even before the key is pasted).*

---

## Quick Start Commands

### Run Both Websites Concurrently
```bash
npm run dev
```

### Run Individually
```bash
# 1. Customer Website (Port 5173)
npm run dev:customer

# 2. Admin Management Panel (Port 5174)
npm run dev:admin
```

### Build for Production
```bash
npm run build
```
