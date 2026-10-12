from typing import List, Dict, Any, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..schemas.booking import BookingCreateSchema, BookingOutSchema
from ..services.booking_service import booking_service
from ..models.booking import Booking
from ..models.payment import Payment

router = APIRouter(tags=["Bookings"])

class AvailabilityCheckSchema(BaseModel):
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    checkIn: Optional[str] = None
    checkOut: Optional[str] = None
    guests: Optional[int] = 2
    room_id: Optional[str] = None
    roomId: Optional[str] = None

@router.get("/api/bookings")
@router.get("/api/v1/bookings")
def get_bookings(db: Session = Depends(get_db)):
    return booking_service.get_all(db)

@router.get("/api/bookings/{booking_id}")
@router.get("/api/v1/bookings/{booking_id}")
def get_booking(booking_id: str, db: Session = Depends(get_db)):
    b = booking_service.get_by_id(db, booking_id)
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    return b

@router.post("/api/bookings")
@router.post("/api/v1/bookings")
def create_booking(payload: BookingCreateSchema, db: Session = Depends(get_db)):
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
        nights=payload.nights or 1,
        guests=payload.guests,
        base_rate=payload.baseRate or 38000,
        taxes=payload.taxes or 6840,
        discount=payload.discount or 0,
        total_amount=payload.totalAmount or 44840,
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

@router.patch("/api/bookings/{booking_id}")
@router.patch("/api/v1/bookings/{booking_id}")
@router.put("/api/bookings/{booking_id}")
@router.put("/api/v1/bookings/{booking_id}")
def update_booking(booking_id: str, updates: Dict[str, Any], db: Session = Depends(get_db)):
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
def delete_booking(booking_id: str, db: Session = Depends(get_db)):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    db.delete(b)
    db.commit()
    return {"success": True, "deleted": booking_id}

@router.get("/api/stats")
@router.get("/api/v1/stats")
def get_stats(db: Session = Depends(get_db)):
    bookings = db.query(Booking).all()
    payments = db.query(Payment).all()
    today_str = "2026-10-12"
    
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
    
    total_rooms = len(ROOMS_LIST)
    occupied_count = len([
        b for b in bookings 
        if b.booking_status in ["Checked In", "Confirmed"] and b.check_in <= today_str <= b.check_out
    ])
    available_rooms = max(0, total_rooms - occupied_count)
    occupancy_rate = round((occupied_count / total_rooms) * 100) if total_rooms > 0 else 0

    return {
        "todayRevenue": today_revenue,
        "totalRevenue": net_revenue,
        "todayBookings": today_bookings,
        "totalBookings": total_bookings,
        "confirmedBookings": confirmed_bookings,
        "pendingPayments": pending_payments,
        "cancelled": cancelled_bookings,
        "availableRooms": available_rooms,
        "occupancyRate": occupancy_rate,
        "refundsTotal": total_refunds,
        "refundsCount": len([p for p in payments if p.status in ["REFUNDED", "PARTIALLY_REFUNDED"]]),
    }

ROOMS_LIST = [
    {
        "id": "101",
        "slug": "courtyard-room",
        "name": "Deluxe Courtyard 101",
        "type": "Deluxe Room",
        "category": "Rooms",
        "floor": "1st Floor",
        "roomNumber": "101",
        "capacity": 2,
        "bedType": "King Bed",
        "size": "42 m²",
        "price": 18500,
        "status": "Available"
    },
    {
        "id": "102",
        "slug": "deluxe-room",
        "name": "Deluxe Courtyard 102",
        "type": "Deluxe Room",
        "category": "Rooms",
        "floor": "1st Floor",
        "roomNumber": "102",
        "capacity": 2,
        "bedType": "King Bed",
        "size": "42 m²",
        "price": 18500,
        "status": "Occupied"
    },
    {
        "id": "201",
        "slug": "premier-room",
        "name": "Premier Garden 201",
        "type": "Premier Room",
        "category": "Rooms",
        "floor": "2nd Floor",
        "roomNumber": "201",
        "capacity": 2,
        "bedType": "King Bed",
        "size": "56 m²",
        "price": 24000,
        "status": "Available"
    },
    {
        "id": "301",
        "slug": "nova-suite",
        "name": "Nova Suite 301",
        "type": "Suite",
        "category": "Suites",
        "floor": "3rd Floor",
        "roomNumber": "301",
        "capacity": 3,
        "bedType": "King Bed",
        "size": "85 m²",
        "price": 38000,
        "status": "Available"
    },
    {
        "id": "401",
        "slug": "terrace-suite",
        "name": "Terrace Garden Suite 401",
        "type": "Suite",
        "category": "Suites",
        "floor": "4th Floor",
        "roomNumber": "401",
        "capacity": 3,
        "bedType": "King Bed",
        "size": "110 m²",
        "price": 48000,
        "status": "Available"
    },
    {
        "id": "501",
        "slug": "penthouse",
        "name": "The Bengaluru Penthouse 501",
        "type": "Penthouse",
        "category": "Signature",
        "floor": "5th Floor",
        "roomNumber": "501",
        "capacity": 4,
        "bedType": "Presidential King",
        "size": "195 m²",
        "price": 85000,
        "status": "Occupied"
    }
]

@router.get("/api/rooms")
@router.get("/api/v1/rooms")
def get_rooms():
    return ROOMS_LIST

@router.get("/api/rooms/{room_id}")
@router.get("/api/v1/rooms/{room_id}")
def get_room(room_id: str):
    r = next((
        rm for rm in ROOMS_LIST 
        if rm["id"] == room_id or rm.get("slug") == room_id or rm.get("roomNumber") == room_id
    ), None)
    if not r:
        raise HTTPException(status_code=404, detail=f"Room '{room_id}' not found")
    return r

@router.post("/api/availability/check")
@router.post("/api/v1/availability/check")
def check_availability(payload: AvailabilityCheckSchema, db: Session = Depends(get_db)):
    effective_check_in = payload.checkIn or payload.check_in or "2026-10-18"
    effective_check_out = payload.checkOut or payload.check_out or "2026-10-21"
    requested_room = payload.roomId or payload.room_id
    guest_count = payload.guests or 2

    # Query active bookings from database
    active_bookings = db.query(Booking).filter(Booking.booking_status != "Cancelled").all()

    # Determine overlapping bookings: (StartA < EndB) and (EndA > StartB)
    booked_room_identifiers = set()
    for b in active_bookings:
        if b.check_in < effective_check_out and b.check_out > effective_check_in:
            if b.room_id:
                booked_room_identifiers.add(b.room_id)
            if b.room_number:
                booked_room_identifiers.add(b.room_number)

    # Process room catalog availability and calculate stay pricing
    try:
        d1 = datetime.strptime(effective_check_in, "%Y-%m-%d")
        d2 = datetime.strptime(effective_check_out, "%Y-%m-%d")
        nights = max(1, (d2 - d1).days)
    except Exception:
        nights = 1

    rooms_status = []
    for r in ROOMS_LIST:
        is_booked = (
            r["id"] in booked_room_identifiers or 
            r.get("slug") in booked_room_identifiers or 
            r.get("roomNumber") in booked_room_identifiers
        )
        
        price_per_night = r.get("price", 18500)
        subtotal = price_per_night * nights
        taxes = round(subtotal * 0.18)
        total = subtotal + taxes

        room_data = {
            **r,
            "status": "Occupied" if is_booked else "Available",
            "isAvailable": not is_booked,
            "nights": nights,
            "baseRate": price_per_night,
            "subtotal": subtotal,
            "taxes": taxes,
            "totalAmount": total,
        }
        rooms_status.append(room_data)

    available_rooms = [r for r in rooms_status if r["isAvailable"]]
    booked_rooms = [r for r in rooms_status if not r["isAvailable"]]

    # Check specific room if requested
    is_requested_available = True
    target_room_info = None
    if requested_room:
        match = next((
            r for r in rooms_status 
            if r["id"] == requested_room or r.get("slug") == requested_room or r.get("roomNumber") == requested_room
        ), None)
        if match:
            is_requested_available = match["isAvailable"]
            target_room_info = match
        else:
            is_booked = requested_room in booked_room_identifiers
            is_requested_available = not is_booked

    return {
        "available": is_requested_available if requested_room else len(available_rooms) > 0,
        "checkIn": effective_check_in,
        "checkOut": effective_check_out,
        "nights": nights,
        "requestedRoomId": requested_room,
        "room": target_room_info,
        "availableRooms": available_rooms,
        "bookedRooms": booked_rooms,
        "totalAvailableCount": len(available_rooms),
        "totalRooms": len(rooms_status),
    }

