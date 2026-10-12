"""
NOVA HOUSE · Availability Checking Engine
Validates date overlaps and capacity for both public guest bookings and admin calendar views.
"""

from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.booking import Booking
from .rooms import ROOMS_LIST

router = APIRouter(prefix="/api/v1/availability", tags=["Availability"])
availability_compat_router = APIRouter(prefix="/api/availability", tags=["Availability"])

class AvailabilityCheckSchema(BaseModel):
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    checkIn: Optional[str] = None
    checkOut: Optional[str] = None
    guests: Optional[int] = 2
    room_id: Optional[str] = None
    roomId: Optional[str] = None

@router.post("/check")
@availability_compat_router.post("/check")
def check_availability(payload: AvailabilityCheckSchema, db: Session = Depends(get_db)):
    effective_check_in = payload.checkIn or payload.check_in or "2026-10-18"
    effective_check_out = payload.checkOut or payload.check_out or "2026-10-21"
    requested_room = payload.roomId or payload.room_id
    guest_count = payload.guests or 2

    # Query active confirmed reservations (only Confirmed and Checked In block inventory)
    active_bookings = db.query(Booking).filter(
        Booking.booking_status.in_(["Confirmed", "Checked In"])
    ).all()

    # Determine overlapping bookings: (StartA < EndB) and (EndA > StartB)
    booked_room_identifiers = set()
    for b in active_bookings:
        if b.check_in and b.check_out:
            if effective_check_in < b.check_out and effective_check_out > b.check_in:
                if b.room_id:
                    booked_room_identifiers.add(b.room_id)
                if b.room_number:
                    booked_room_identifiers.add(str(b.room_number))

    # Evaluate availability
    available_rooms_list = []
    for rm in ROOMS_LIST:
        is_booked = (
            rm["id"] in booked_room_identifiers or
            rm.get("slug") in booked_room_identifiers or
            str(rm.get("roomNumber")) in booked_room_identifiers
        )
        if not is_booked and rm.get("capacity", 2) >= guest_count:
            available_rooms_list.append(rm)

    if requested_room:
        is_requested_available = any(
            rm["id"] == requested_room or rm.get("slug") == requested_room or str(rm.get("roomNumber")) == str(requested_room)
            for rm in available_rooms_list
        )
        return {
            "available": is_requested_available,
            "roomId": requested_room,
            "checkIn": effective_check_in,
            "checkOut": effective_check_out,
            "availableRoomsCount": len(available_rooms_list),
            "availableRooms": available_rooms_list
        }

    return {
        "available": len(available_rooms_list) > 0,
        "checkIn": effective_check_in,
        "checkOut": effective_check_out,
        "availableRoomsCount": len(available_rooms_list),
        "availableRooms": available_rooms_list
    }
