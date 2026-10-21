# NOVA HOUSE · Luxury Hotel Booking & Management System

> **A modern, full-stack luxury hospitality platform comprising a public guest sanctuary portal and an executive hotel operations center, synchronized via Supabase.**

---

## 1. Architectural Overview

NOVA HOUSE is architected as a cohesive dual-portal hospitality system:

```
                                  ┌──────────────────────────────┐
                                  │   Supabase Cloud Platform    │
                                  │  - PostgreSQL Database       │
                                  │  - Realtime WebSocket Sync   │
                                  │  - Auth & Storage            │
                                  └──────────────▲───────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        │                                                 │
                        ▼                                                 ▼
        ┌───────────────────────────────┐                 ┌───────────────────────────────┐
        │       Customer Website        │                 │         Admin Portal          │
        │      (Port: 5173 / Vite)      │                 │      (Port: 5174 / Vite)      │
        ├───────────────────────────────┤                 ├───────────────────────────────┤
        │ • Luxury Brand Experience     │                 │ • Operations & Bookings Radar │
        │ • Room Inventory & Tariffs    │                 │ • Tariff & Inventory Yield    │
        │ • Dining & Restaurant Menus   │                 │ • Dining & Menu CMS           │
        │ • Curated Offers & Promo Codes│                 │ • Promo Codes & Marketing     │
        │ • Instant Razorpay Checkout   │                 │ • Guest CRM & Invoices        │
        └───────────────────────────────┘                 └───────────────────────────────┘
```

- **Customer Interface (`customer/`)**: Guest-facing website featuring rich editorial typography, responsive booking workflows, dynamic room selection, promotional offer codes, restaurant showcase, and Razorpay checkout integration.
- **Admin Panel (`admin/`)**: Enterprise operations console for hotel managers and front desk staff, featuring real-time booking dossiers, occupancy radar, room availability matrix, dynamic yield pricing, dining CMS, invoice management, and guest CRM.

---

## 2. Technology Stack

### Customer Portal (`customer/`)
- **Core**: React 19, Vite 8, JavaScript (ESM)
- **Styling**: Tailwind CSS, Vanilla CSS luxury design tokens (`#111111`, `#B69A68`, `#F7F5EF`)
- **Animation & Motion**: Motion (`framer-motion`), Anime.js, Canvas Confetti, Lenis smooth scroll
- **Icons**: Lucide React
- **Payments**: Razorpay Checkout Integration
- **Database & Sync**: `@supabase/supabase-js` with live Supabase fallback state

### Admin Operations Portal (`admin/`)
- **Core**: React 19, TypeScript, Vite 8
- **Routing**: React Router v7 (`react-router-dom`)
- **Styling**: Tailwind CSS & CSS Custom Properties
- **Data Visualizations**: Recharts (Revenue Trends, Occupancy Distribution, Booking Velocity)
- **Icons**: Lucide React
- **State & Service Layer**: Supabase Client with resilient local data fallback

---

## 3. Project Directory Structure

```
Hotel/
├── customer/                   # Guest-facing luxury booking website
│   ├── public/                 # Static assets, SVG icons, redirects
│   ├── src/
│   │   ├── assets/             # Photography, logo marks, brand media
│   │   ├── components/         # Hero, Navbar, Booking, Rooms, Dining, Offers, Modals
│   │   ├── data/               # Curated sanctuary defaults & mock data
│   │   ├── services/           # Supabase client, bookings API, Razorpay handler
│   │   ├── utils/              # Animation helpers & formatters
│   │   ├── App.jsx             # Main application orchestrator
│   │   ├── index.css           # Global typography & luxury design system
│   │   └── main.jsx            # React root mount
│   ├── .env.example            # Environment template for guest portal
│   ├── package.json            # Customer app dependencies & scripts
│   └── vite.config.js          # Vite build configuration
│
├── admin/                      # Operations & Management Portal
│   ├── public/                 # Favicons, vector assets, redirects
│   ├── src/
│   │   ├── assets/             # Admin brand assets & icons
│   │   ├── components/         # Dashboard charts, data tables, modals, drawers
│   │   │   ├── dashboard/      # Occupancy, revenue, activity, recent bookings
│   │   │   ├── layout/         # Topbar, responsive sidebar, navigation shell
│   │   │   ├── payments/       # Payment dossiers, refund modals, stat cards
│   │   │   └── ui/             # Filter bars, search, badges, modals, pagination
│   │   ├── data/               # Seed data for guests, rooms, dining, staff
│   │   ├── hooks/              # Custom reactive hooks (useBookings, useRooms)
│   │   ├── pages/              # Dashboard, Bookings, Availability, Pricing, Dining, etc.
│   │   ├── routes/             # AppRoutes and route definitions
│   │   ├── services/           # Supabase services, guest service, tariff manager
│   │   ├── types/              # TypeScript interfaces and entity types
│   │   ├── App.tsx             # Root admin shell
│   │   └── main.tsx            # TypeScript entry point
│   ├── .env.example            # Environment template for admin portal
│   ├── package.json            # Admin app dependencies & scripts
│   ├── tsconfig.json           # TypeScript configuration
│   └── vite.config.ts          # Vite build configuration
│
├── .env.example                # Root environment template
├── .gitignore                  # Git ignore rules (protects credentials & build artifacts)
├── package.json                # Monorepo orchestrator scripts
└── README.md                   # Project documentation
```

---

## 4. Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/UjwalMB/NovaHouse.git
cd NovaHouse

# Install dependencies for both apps
npm run install:all
```

*(Alternatively, install in each directory: `cd customer && npm install`, then `cd ../admin && npm install`)*

### 2. Configure Environment Variables

Copy the provided `.env.example` templates to `.env` in each application directory:

```bash
# Customer portal
cp customer/.env.example customer/.env

# Admin portal
cp admin/.env.example admin/.env
```

Update each `.env` file with your credentials:

**`customer/.env`**:
```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_ADMIN_URL=http://localhost:5174
```

**`admin/.env`**:
```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
VITE_DASHBOARD_URL=http://localhost:5174
VITE_PUBLIC_WEBSITE_URL=http://localhost:5173
```

> **Note**: Both portals include built-in fallback data stores, allowing complete local execution and development even before connecting to a live Supabase instance.

---

## 5. Running the Application

### Concurrently (Both Portals)
```bash
npm run dev
```
- **Customer Portal**: `http://localhost:5173`
- **Admin Portal**: `http://localhost:5174`

### Individually
```bash
# Run customer website only
npm run dev:customer

# Run admin panel only
npm run dev:admin
```

---

## 6. Building for Production

To produce optimized production builds for both applications:

```bash
# Build both customer and admin applications
npm run build

# Or build individually:
npm run build:customer
npm run build:admin
```

Build outputs are generated into `customer/dist/` and `admin/dist/` respectively.

---

## 7. Real-Time Synchronization Workflows

1. **Direct Guest Booking**:
   - Guest selects dates, room type, and enters contact details on the Customer portal.
   - Promotional discount codes are validated and applied.
   - Upon reservation confirmation (or Razorpay payment), records are created in Supabase `bookings` and `payments`.
   - Admin Bookings Radar instantly updates via Supabase Realtime subscriptions.

2. **Live Operational CMS**:
   - Hotel staff adjust room base tariffs or toggle maintenance status in Admin.
   - EMBER restaurant menus and tasting dishes are updated in real time.
   - Changes are broadcast to the Customer portal immediately without requiring full page reloads.

---

## 8. Security & Best Practices

- Real credentials (`.env`, `.env.*`, API keys, private keys, certificates) are strictly excluded from version control via `.gitignore`.
- Public templates (`.env.example`) provide placeholder configuration schemas.
- Client applications access Supabase strictly via the public `anon` key, relying on Row-Level Security (RLS) policies for data isolation.

