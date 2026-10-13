import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import engine, Base, SessionLocal, is_sqlite
from .models import Booking, Payment, Room, Guest, BookingNotification
from .routes import payments, bookings, auth, guests, dashboard, rooms, availability, notifications
from .services.booking_service import booking_service

# Auto-create database tables on startup
try:
    Base.metadata.create_all(bind=engine)
    # Seed database with realistic initial bookings & payment records
    with SessionLocal() as db:
        booking_service.seed_initial_bookings(db)
except Exception as e:
    print(f"⚠️ Notice during schema/seed initialization: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Official REST API & Razorpay Payment Gateway integration for NOVA HOUSE Boutique Hotel."
)

# CORS Configuration - Explicit whitelist (No wildcards)
origins = list(settings.ALLOWED_ORIGINS) if settings.ALLOWED_ORIGINS else []
default_allowed = [
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://nova-house-hotel.vercel.app",
    "https://nova-house-admin.vercel.app",
    "https://nova-house-dashboard.vercel.app",
    "https://nova-house-hotel.onrender.com",
]
for d in default_allowed:
    if d not in origins:
        origins.append(d)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Route Blueprints
app.include_router(payments.router, prefix="/api/payments")
app.include_router(payments.router, prefix="/api/v1/payments")
app.include_router(bookings.router)
app.include_router(rooms.router)
app.include_router(rooms.rooms_compat_router)
app.include_router(availability.router)
app.include_router(availability.availability_compat_router)
app.include_router(auth.router)
app.include_router(auth.auth_compat_router)
app.include_router(guests.router)
app.include_router(guests.guests_compat_router)
app.include_router(dashboard.router)
app.include_router(dashboard.dashboard_compat_router)
app.include_router(notifications.router)
app.include_router(notifications.notifications_compat_router)

@app.get("/")
@app.get("/health")
@app.get("/api/v1/health")
def health():
    return {
        "status": "healthy",
        "service": "NOVA HOUSE Hotel & Razorpay Payment Engine",
        "version": settings.VERSION,
        "razorpayMode": settings.RAZORPAY_MODE,
        "database": "postgresql" if not is_sqlite else "sqlite"
    }
