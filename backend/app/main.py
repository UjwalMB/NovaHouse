import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import engine, Base, SessionLocal, is_sqlite
from .models import Booking, Payment, Room, Guest
from .routes import payments, bookings
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

# CORS Configuration
origins = list(settings.ALLOWED_ORIGINS) if settings.ALLOWED_ORIGINS else []
default_allowed = [
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://localhost:5173",
    "http://localhost:5174",
    "https://nova-house-hotel.vercel.app",
    "https://nova-house-hotel.onrender.com",
]
for d in default_allowed:
    if d not in origins:
        origins.append(d)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Route Blueprints
app.include_router(payments.router, prefix="/api/payments")
app.include_router(payments.router, prefix="/api/v1/payments")
app.include_router(bookings.router)

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
