from typing import List, Dict, Any, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..schemas.booking import BookingCreateSchema, BookingOutSchema
from ..services.booking_service import booking_service
from ..models.booking import Booking
from ..models.payment import Payment
from .auth import require_roles
from .rooms import ROOMS_LIST  # Re-export for backward compatibility

router = APIRouter(tags=["Bookings"])

@router.get("/api/bookings")
@router.get("/api/v1/bookings")
def get_bookings(
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    return booking_service.get_all(db)

@router.get("/api/bookings/{booking_id}")
@router.get("/api/v1/bookings/{booking_id}")
def get_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    b = booking_service.get_by_id(db, booking_id)
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    return b

# Public booking creation (Customer Website + Staff Terminal)
@router.post("/api/bookings")
@router.post("/api/v1/bookings")
def create_booking(payload: BookingCreateSchema, db: Session = Depends(get_db)):
    # 1. Strict Server-Side Date Validation: checkout > checkin (minimum 1 night)
    try:
        d1 = datetime.strptime(payload.checkIn, "%Y-%m-%d").date()
        d2 = datetime.strptime(payload.checkOut, "%Y-%m-%d").date()
        if d2 <= d1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reservation dates: Check-out date must be strictly after check-in date (minimum stay: 1 night)."
            )
        calculated_nights = (d2 - d1).days
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Expected YYYY-MM-DD."
        )

    # 2. Authoritative Server-Side Pricing Calculation (Nightly Rate * Nights + 18% GST - Discount)
    base_rate = payload.baseRate or 38000
    nights = calculated_nights
    subtotal = base_rate * nights
    taxes = round(subtotal * 0.18)
    discount = payload.discount or 0
    total_amount = subtotal + taxes - discount

    base_num = 1029 + db.query(Booking).count()
    booking_id = f"NH-{base_num}"
    while db.query(Booking).filter(Booking.id == booking_id).first():
        base_num += 1
        booking_id = f"NH-{base_num}"

    new_booking = Booking(
        id=booking_id,
        booking_number=booking_id,
        guest_id=f"gst_{booking_id}",
        guest_name=payload.guestName,
        guest_email=payload.guestEmail,
        guest_phone=payload.guestPhone or "+91 98450 12345",
        guest_country=payload.guestCountry or "India",
        room_number=payload.roomNumber or "301",
        room_type=payload.roomType or "Nova Suite",
        room_id=payload.roomId,
        check_in=payload.checkIn,
        check_out=payload.checkOut,
        nights=nights,
        guests=payload.guests,
        base_rate=base_rate,
        taxes=taxes,
        discount=discount,
        total_amount=total_amount,
        payment_status=payload.paymentStatus or "PAID",
        booking_status=payload.bookingStatus or "Confirmed",
        payment_method=payload.paymentMethod or "Razorpay",
        special_requests=payload.specialRequests or "Website direct reservation",
        source=payload.source or "Website Direct",
        created_at=datetime.utcnow(),
    )
    db.add(new_booking)

    # If created as PAID, ensure matching payment record is recorded for accounting
    if new_booking.payment_status == "PAID":
        payment_id = f"pay_adm_{booking_id}"
        payment = Payment(
            id=payment_id,
            booking_id=booking_id,
            razorpay_order_id=f"order_adm_{booking_id}",
            razorpay_payment_id=payment_id,
            amount=new_booking.total_amount,
            amount_paise=int(new_booking.total_amount * 100),
            currency="INR",
            status="PAID",
            method=new_booking.payment_method or "Staff Terminal",
            email=new_booking.guest_email,
            contact=new_booking.guest_phone,
            created_at=datetime.utcnow()
        )
        db.add(payment)
        new_booking.payment_id = payment_id

    db.commit()
    return booking_service.get_by_id(db, booking_id)

# Operational status changes (Requires ADMIN or MANAGER; ANALYST is denied with 403)
@router.patch("/api/bookings/{booking_id}")
@router.patch("/api/v1/bookings/{booking_id}")
@router.put("/api/bookings/{booking_id}")
@router.put("/api/v1/bookings/{booking_id}")
def update_booking(
    booking_id: str,
    updates: Dict[str, Any],
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    for k, v in updates.items():
        if hasattr(b, k):
            setattr(b, k, v)
        elif k == "bookingStatus":
            b.booking_status = v
        elif k == "paymentStatus":
            b.payment_status = v
            # Keep payment record in sync
            linked_p = db.query(Payment).filter(Payment.booking_id == booking_id).first()
            if linked_p:
                linked_p.status = v
                if v == "REFUNDED" and not linked_p.refund_id:
                    linked_p.refund_id = f"rfnd_adm_{booking_id}"
                    linked_p.refund_amount = linked_p.amount

    db.commit()
    return booking_service.get_by_id(db, booking_id)

@router.delete("/api/bookings/{booking_id}")
@router.delete("/api/v1/bookings/{booking_id}")
def delete_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Clean up associated payments to prevent analytics data pollution
    linked_payments = db.query(Payment).filter(Payment.booking_id == booking_id).all()
    for p in linked_payments:
        db.delete(p)

    db.delete(b)
    db.commit()
    return {"success": True, "deleted": booking_id}

@router.get("/api/stats")
@router.get("/api/v1/stats")
def get_stats(
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    bookings = db.query(Booking).all()
    payments = db.query(Payment).all()
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    
    total_bookings = len(bookings)
    today_bookings = len([
        b for b in bookings 
        if b.check_in == today_str or (b.created_at and b.created_at.strftime("%Y-%m-%d") == today_str)
    ])
    confirmed_bookings = len([b for b in bookings if b.booking_status in ["Confirmed", "Checked In"]])
    pending_payments = len([b for b in bookings if b.payment_status in ["PENDING", "UNPAID"]])
    cancelled_bookings = len([b for b in bookings if b.booking_status == "Cancelled"])
    
    # Revenue: Real successful captured payments from database minus refunds
    total_paid_revenue = sum(p.amount for p in payments if p.status == "PAID")
    total_refunds = sum(p.refund_amount or p.amount for p in payments if p.status in ["REFUNDED", "PARTIALLY_REFUNDED"])
    net_revenue = max(0.0, total_paid_revenue - total_refunds)
    
    today_revenue = sum(
        p.amount for p in payments 
        if p.status == "PAID" and p.created_at and p.created_at.strftime("%Y-%m-%d") == today_str
    )
    
    total_rooms_count = len(ROOMS_LIST)
    occupied_count = len([
        b for b in bookings 
        if b.booking_status in ["Checked In", "Confirmed"] and b.check_in <= today_str <= b.check_out
    ])
    available_rooms = max(0, total_rooms_count - occupied_count)
    occupancy_rate = round((occupied_count / total_rooms_count) * 100) if total_rooms_count > 0 else 0
    
    return {
        "totalBookings": total_bookings,
        "todayBookings": today_bookings,
        "confirmedBookings": confirmed_bookings,
        "pendingPayments": pending_payments,
        "cancelledBookings": cancelled_bookings,
        "totalRevenue": net_revenue,
        "todayRevenue": today_revenue,
        "refundsTotal": total_refunds,
        "availableRooms": available_rooms,
        "occupiedRooms": occupied_count,
        "occupancyRate": occupancy_rate,
        "totalRooms": total_rooms_count
    }
