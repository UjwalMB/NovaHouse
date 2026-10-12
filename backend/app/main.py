import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import engine, Base, SessionLocal, is_sqlite
from .models import Booking, Payment, Room, Guest
from .routes import payments, bookings
from .services.booking_service import booking_service

# Auto-create database tables on startup
Base.metadata.create_all(bind=engine)

# Seed database with realistic initial bookings & payment records
with SessionLocal() as db:
    booking_service.seed_initial_bookings(db)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Official REST API & Razorpay Payment Gateway integration for NOVA HOUSE Boutique Hotel."
)

# CORS Configuration
origins = settings.ALLOWED_ORIGINS
if not origins:
    origins = [
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:5173",
        "http://localhost:5174",
    ]

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
