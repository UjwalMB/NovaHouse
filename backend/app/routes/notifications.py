from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..services.notification_service import notification_service
from ..models.notification import BookingNotification
from ..models.booking import Booking
from .auth import require_roles

router = APIRouter(prefix="/api", tags=["Notifications"])
notifications_compat_router = APIRouter(prefix="/api/v1", tags=["Notifications Compat"])

@router.get("/bookings/{booking_id}/notifications")
@notifications_compat_router.get("/bookings/{booking_id}/notifications")
def get_booking_notifications(
    booking_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    """
    Retrieve live email & SMS confirmation dispatch audit trail for a booking.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking '{booking_id}' not found.")
    
    return notification_service.get_booking_notifications(db, booking_id)

@router.post("/notifications/{notification_id}/retry")
@notifications_compat_router.post("/notifications/{notification_id}/retry")
def retry_notification_delivery(
    notification_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    """
    Retry a failed email or SMS notification record without altering
    booking confirmation or payment ledger status.
    """
    try:
        updated = notification_service.retry_notification(db, notification_id)
        return {
            "success": True,
            "id": updated.id,
            "status": updated.status,
            "type": updated.notification_type,
            "recipient": updated.recipient,
            "sentAt": updated.sent_at.isoformat() if updated.sent_at else None,
            "providerMessageId": updated.provider_message_id,
            "errorMessage": updated.error_message,
            "message": f"{updated.notification_type} notification retry completed with status: {updated.status}."
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retry notification: {str(e)}")

@router.post("/bookings/{booking_id}/notifications/dispatch")
@notifications_compat_router.post("/bookings/{booking_id}/notifications/dispatch")
def force_dispatch_booking_notifications(
    booking_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    """
    Manually trigger confirmation notifications (Email + SMS) for a confirmed booking
    if missing or failed.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking '{booking_id}' not found.")
    
    res = notification_service.send_booking_confirmations(db, booking)
    return {
        "success": True,
        "bookingId": booking_id,
        "dispatch": res
    }
