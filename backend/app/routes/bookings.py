from typing import List, Dict, Any, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..schemas.booking import BookingCreateSchema, BookingOutSchema
from ..services.booking_service import booking_service
from ..models.booking import Booking
from ..models.payment import Payment
from .auth import require_roles, verify_token
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
def create_booking(payload: BookingCreateSchema, request: Request, db: Session = Depends(get_db)):
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

    # 2. Authoritative Server-Side Pricing Calculation (Never trust client baseRate, taxes, or totalAmount)
    matched_room = next((
        r for r in ROOMS_LIST
        if str(r.get("id")) == str(payload.roomId) or r.get("slug") == str(payload.roomId) or str(r.get("roomNumber")) == str(payload.roomNumber)
    ), None)

    authoritative_rate = float(matched_room["price"]) if matched_room else 38000.0
    room_number = str(matched_room["roomNumber"]) if matched_room else (str(payload.roomNumber) or "301")
    room_type = matched_room["name"] if matched_room else (payload.roomType or "Nova Suite")
    room_id = str(matched_room["id"]) if matched_room else (str(payload.roomId) or "301")

    nights = calculated_nights
    subtotal = authoritative_rate * nights
    taxes = round(subtotal * 0.18)
    discount = 0.0
    total_amount = subtotal + taxes - discount

    # 3. Security Lifecycle: Check if request is an authenticated staff member
    is_staff = False
    auth_header = request.headers.get("Authorization") if request else None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "").strip()
        user_info = verify_token(token)
        if user_info and user_info.get("role") in ["ADMIN", "MANAGER"]:
            is_staff = True

    if is_staff and payload.paymentStatus == "PAID":
        payment_status = "PAID"
        booking_status = payload.bookingStatus or "Confirmed"
    else:
        # Public website reservations always start as PENDING until verified
        payment_status = "PENDING"
        booking_status = "Pending"

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
        room_number=room_number,
        room_type=room_type,
        room_id=room_id,
        check_in=payload.checkIn,
        check_out=payload.checkOut,
        nights=nights,
        guests=payload.guests,
        base_rate=authoritative_rate,
        taxes=taxes,
        discount=discount,
        total_amount=total_amount,
        payment_status=payment_status,
        booking_status=booking_status,
        payment_method=payload.paymentMethod or "Razorpay",
        special_requests=payload.specialRequests or "Website direct reservation",
        source=payload.source or "Website Direct",
        created_at=datetime.utcnow(),
    )
    db.add(new_booking)

    # Create synchronized Payment record for ledger accounting
    payment_id = f"pay_{booking_id}"
    payment = Payment(
        id=payment_id,
        booking_id=booking_id,
        razorpay_order_id=f"order_{booking_id}",
        razorpay_payment_id=payment_id if payment_status == "PAID" else None,
        amount=new_booking.total_amount,
        amount_paise=int(new_booking.total_amount * 100),
        currency="INR",
        status=payment_status,
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
            else:
                # If no payment record existed, create synchronized record
                linked_p = Payment(
                    id=f"pay_adm_{booking_id}",
                    booking_id=booking_id,
                    razorpay_order_id=f"order_adm_{booking_id}",
                    razorpay_payment_id=f"pay_adm_{booking_id}" if v == "PAID" else None,
                    amount=b.total_amount,
                    amount_paise=int(b.total_amount * 100),
                    currency="INR",
                    status=v,
                    method=b.payment_method or "Staff Terminal",
                    email=b.guest_email,
                    contact=b.guest_phone,
                    created_at=datetime.utcnow()
                )
                db.add(linked_p)
                b.payment_id = linked_p.id

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

    try:
        # Clean up associated payments bound to this specific booking to prevent orphan records
        linked_payments = db.query(Payment).filter(Payment.booking_id == booking_id).all()
        for p in linked_payments:
            db.delete(p)

        db.delete(b)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database transaction failure during booking deletion.")
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
