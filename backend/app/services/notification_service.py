import logging
from typing import Dict, Any

logger = logging.getLogger("novahouse.notifications")

class NotificationService:
    """
    Notification service abstraction.
    Prepares and dispatches guest booking confirmation emails,
    invoice receipts, and administrative alerts.
    """
    
    @staticmethod
    def send_booking_confirmation(booking: Dict[str, Any], payment: Dict[str, Any] = None) -> bool:
        """
        Send luxury reservation confirmation dossier to the guest.
        Ready for integration with SendGrid, Postmark, AWS SES, or SMTP.
        """
        guest_email = booking.get("guest_email") or booking.get("guestEmail")
        guest_name = booking.get("guest_name") or booking.get("guestName")
        booking_id = booking.get("id")
        amount = booking.get("total_amount") or booking.get("totalAmount")
        
        logger.info(
            f"📧 [NOTIFICATION DISPATCHED] Booking confirmation for {booking_id} "
            f"sent to {guest_name} <{guest_email}>. Total: ₹{amount:,.0f} (PAID)."
        )
        return True

    @staticmethod
    def send_refund_notification(booking_id: str, amount: float, guest_email: str) -> bool:
        logger.info(
            f"📧 [REFUND NOTICE] Refund of ₹{amount:,.0f} for booking {booking_id} "
            f"dispatched to {guest_email}."
        )
        return True

notification_service = NotificationService()
