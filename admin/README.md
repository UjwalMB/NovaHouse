# NOVA HOUSE · Hotel Admin & Operations Portal

> **Executive Control Center for NOVA HOUSE Luxury Hotel (Bengaluru, India)**
> Designed for hotel owners, general managers, and operational staff to manage room inventory, reservations, guests, dynamic tariffs, dining, experiences, media assets, and public website CMS content.

---

## 1. Architectural Overview

The **NOVA HOUSE Hotel Admin Portal** is an enterprise-grade Single Page Application (SPA) built to pair with the customer-facing NOVA HOUSE luxury website. It maintains the same refined brand identity (`#111111`, `#F4F1EB`, `#A58A5C`) while prioritizing high-density operational usability, rapid record filtering, and structured CMS controls.

```
NOVA-HOUSE-PROJECT/
├── Demo/ (Customer-Facing Luxury Hotel Website)
│   └── Running on http://127.0.0.1:5173
│
└── nova-house-admin/ (Hotel Admin & Management Portal)
    └── Running on http://127.0.0.1:5174
```

---

## 2. Tech Stack

* **Framework**: React 18+ & Vite
* **Routing**: React Router v6 (`react-router-dom`)
* **Styling**: Vanilla CSS Luxury Design System (`src/index.css`) with CSS custom properties
* **Icons**: Lucide React
* **Analytics & Visualizations**: Recharts (Revenue Area Charts, Occupancy Bar Charts, Status Donut Distribution)
* **Architecture**: Clean Service / Repository Pattern (`src/services/api.js` abstraction ready for FastAPI + MySQL / PostgreSQL)

---

## 3. Implemented Routes & Capabilities

| Route | Module | Purpose |
|---|---|---|
| `/admin/login` | **Admin Gateway** | Split-screen luxury login interface with session persistence |
| `/admin` | **Dashboard** | 6 KPI cards, 7d/30d/90d/1y revenue trends, weekly occupancy, activity feed |
| `/admin/bookings` | **Reservations** | Search, filter by status/room/payment, export CSV, create new reservations |
| `/admin/bookings/:id`| **Booking Dossier** | Comprehensive guest profile, stay specs, GST invoice breakdown, status transitions |
| `/admin/rooms` | **Inventory Management** | Room rack, amenity configuration, photo URLs, base & discount tariffs |
| `/admin/guests` | **Guest CRM** | Patron directory, loyalty tiers, lifetime spend, tailored sanctuary preferences |
| `/admin/availability`| **Availability Matrix** | 14-day horizontal room rack grid with interactive cell status overrides |
| `/admin/pricing` | **Dynamic Yield Engine** | Room category tariffs, weekend multipliers, seasonal event surge rules |
| `/admin/dining` | **EMBER Restaurant CMS** | Restaurant narrative, service hours, tasting menu dish management |
| `/admin/experiences` | **Wellness & Experiences** | Heated rooftop pool, Kaya Sanctuary Spa, movement studio, glasshouse buyouts |
| `/admin/gallery` | **Media Asset Library** | Category filtering (Exterior, Lobby, Suites, Pool, Spa), upload UI, featured toggles |
| `/admin/offers` | **Packages & Marketing** | Promo codes, stay minimums, validity periods, redemption counters |
| `/admin/website` | **Public Website CMS** | Structured form fields controlling public hero headlines, philosophy, landmarks |
| `/admin/enquiries` | **Inbound Leads** | Website contact form leads, priority sorting, drawer inspection, email dispatch |
| `/admin/reviews` | **Testimonials** | Moderation stream (Approve, Hide, Delete), average rating aggregator |
| `/admin/staff` | **Staff & Roles** | Role-based governance (Super Admin, Hotel Manager, Reception, Reservations, Content Manager) |
| `/admin/settings` | **System Preferences** | Hotel identity, check-in/out policies, payment gateways, automated notifications |

---

## 4. Future Backend Connection (FastAPI + MySQL / PostgreSQL)

The frontend is completely decoupled through `src/services/api.js`.

```
React Admin Portal (Port 5174)
        ↓
src/services/api.js (REST Client with Bearer Token Interceptor)
        ↓
FastAPI Backend (Port 8000)
        ↓
MySQL / PostgreSQL Database
```

To switch from the local mock data to your live FastAPI backend:
1. Create a `.env` file inside `nova-house-admin/`:
   ```env
   VITE_API_URL=http://127.0.0.1:8000/api/v1
   ```
2. In `src/services/api.js`, set `USE_MOCK_FALLBACK = false`.
3. The services will automatically send requests to your FastAPI endpoints without modifying any component UI code.

---

## 5. Development & Running

### Starting the Admin Portal:
```bash
cd nova-house-admin
npm install
npm run dev
```
Open **http://127.0.0.1:5174** in your browser.

### Building for Production:
```bash
npm run build
```
