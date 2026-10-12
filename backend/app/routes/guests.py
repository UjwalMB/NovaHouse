"""
NOVA HOUSE · Guests Management API
Direct database access to the guest ledger for Admin and Dashboard systems.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.guest import Guest
from ..models.booking import Booking

router = APIRouter(prefix="/api/v1/guests", tags=["Guests"])
guests_compat_router = APIRouter(prefix="/api/guests", tags=["Guests"])

class GuestCreateSchema(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    country: Optional[str] = "India"
    vip_tier: Optional[str] = "Member"
    notes: Optional[str] = None

class GuestUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    vip_tier: Optional[str] = None
    notes: Optional[str] = None

def serialize_guest(g: Guest, db: Session) -> dict:
    # Find bookings associated with this guest
    bookings = db.query(Booking).filter(
        (Booking.guest_id == g.id) | (Booking.guest_email == g.email)
    ).all()
    
    total_spent = sum(b.total_amount for b in bookings if b.payment_status == "PAID")
    last_stay = max((b.check_out for b in bookings), default=None)
    
    return {
        "id": g.id,
        "name": g.full_name,
        "fullName": g.full_name,
        "email": g.email,
        "phone": g.phone or "+91 98450 12345",
        "country": g.country or "India",
        "vipTier": g.vip_tier or "Member",
        "totalStays": max(g.total_stays or 1, len(bookings)),
        "totalSpent": total_spent,
        "lastStay": last_stay or "15 Oct 2026",
        "notes": g.notes or "Patron guest reservation ledger",
        "createdAt": g.created_at.strftime("%d %b %Y") if g.created_at else "12 Oct 2026",
        "bookingHistory": [
            {
                "id": b.id,
                "roomType": b.room_type,
                "checkIn": b.check_in,
                "checkOut": b.check_out,
                "totalAmount": b.total_amount,
                "status": b.booking_status,
                "paymentStatus": b.payment_status
            }
            for b in bookings
        ]
    }

@router.get("")
@guests_compat_router.get("")
def list_guests(
    search: Optional[str] = None,
    vip_tier: Optional[str] = None,
    db: Session = Depends(get_db)
):
    if db.query(Guest).count() == 0:
        bookings = db.query(Booking).all()
        seen = set()
        for b in bookings:
            if b.guest_email and b.guest_email not in seen:
                seen.add(b.guest_email)
                g = Guest(
                    id=b.guest_id or f"gst_{b.id}",
                    full_name=b.guest_name or "Distinguished Guest",
                    email=b.guest_email,
                    phone=b.guest_phone or "+91 98450 12345",
                    country=b.guest_country or "India",
                    vip_tier="Gold" if (b.total_amount or 0) > 40000 else "Member",
                    total_stays=1,
                    notes=f"Reservation {b.id} ledger",
                    created_at=b.created_at or datetime.utcnow()
                )
                db.add(g)
        try:
            db.commit()
        except Exception:
            db.rollback()

    query = db.query(Guest).order_by(Guest.full_name.asc())
    
    if vip_tier and vip_tier.lower() != "all":
        query = query.filter(Guest.vip_tier == vip_tier)
        
    guests = query.all()
    
    results = [serialize_guest(g, db) for g in guests]
    
    if search:
        q = search.lower().strip()
        results = [
            r for r in results 
            if q in r["name"].lower() or q in r["email"].lower() or q in r["phone"].lower() or q in r["country"].lower()
        ]
        
    return results

@router.get("/{guest_id}")
@guests_compat_router.get("/{guest_id}")
def get_guest(guest_id: str, db: Session = Depends(get_db)):
    guest = db.query(Guest).filter(
        (Guest.id == guest_id) | (Guest.email == guest_id)
    ).first()
    
    if not guest:
        raise HTTPException(status_code=404, detail="Guest profile not found")
        
    return serialize_guest(guest, db)

@router.post("")
@guests_compat_router.post("")
def create_guest(payload: GuestCreateSchema, db: Session = Depends(get_db)):
    existing = db.query(Guest).filter(Guest.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Guest with this email already exists")
        
    guest_id = f"gst_{int(datetime.utcnow().timestamp())}"
    new_guest = Guest(
        id=guest_id,
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        country=payload.country or "India",
        vip_tier=payload.vip_tier or "Member",
        total_stays=1,
        notes=payload.notes,
        created_at=datetime.utcnow()
    )
    db.add(new_guest)
    db.commit()
    return serialize_guest(new_guest, db)

@router.patch("/{guest_id}")
@router.put("/{guest_id}")
@guests_compat_router.patch("/{guest_id}")
@guests_compat_router.put("/{guest_id}")
def update_guest(guest_id: str, payload: GuestUpdateSchema, db: Session = Depends(get_db)):
    guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest profile not found")
        
    if payload.full_name is not None:
        guest.full_name = payload.full_name
    if payload.phone is not None:
        guest.phone = payload.phone
    if payload.country is not None:
        guest.country = payload.country
    if payload.vip_tier is not None:
        guest.vip_tier = payload.vip_tier
    if payload.notes is not None:
        guest.notes = payload.notes
        
    db.commit()
    return serialize_guest(guest, db)
