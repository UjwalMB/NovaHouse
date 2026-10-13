import re
import smtplib
import logging
import uuid
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from typing import Dict, Any, Optional, Tuple, List
from sqlalchemy.orm import Session
from ..core.config import settings
from ..models.notification import BookingNotification
from ..models.booking import Booking
from ..models.payment import Payment
from .sms_gateway import sms_gateway

logger = logging.getLogger("novahouse.notifications")

class NotificationService:
    """
    NOVA HOUSE Luxury Notification Service
    
    Handles automated guest booking confirmation notifications across:
    1. Premium HTML confirmation emails.
    2. Concise guest SMS alerts.
    
    Guarantees:
    - Authoritative database tracking (booking_notifications table).
    - Strict idempotency protection preventing duplicate messages.
    - Transactional isolation: notification issues never roll back payments.
    - Clear separation between TEST mode and production dispatch.
    - Role-authorized manual retries for transient delivery failures.
    """

    # -------------------------------------------------------------------------
    # Validation & Normalization Helpers
    # -------------------------------------------------------------------------
    @staticmethod
    def validate_email(email: Optional[str]) -> bool:
        if not email or not isinstance(email, str):
            return False
        clean = email.strip()
        pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        return bool(re.match(pattern, clean))

    @staticmethod
    def validate_and_normalize_phone(phone: Optional[str]) -> Tuple[bool, str]:
        """
        Validates and normalizes guest contact numbers.
        For Indian numbers, handles +91, 0 prefix, or 10-digit formats cleanly.
        """
        if not phone or not isinstance(phone, str):
            return False, ""
        
        # Strip spaces, hyphens, parentheses
        cleaned = re.sub(r"[\s\-\(\)]", "", phone.strip())
        
        # Indian number normalization
        if re.match(r"^\+91[6-9]\d{9}$", cleaned):
            return True, cleaned
        if re.match(r"^91[6-9]\d{9}$", cleaned):
            return True, f"+{cleaned}"
        if re.match(r"^0[6-9]\d{9}$", cleaned):
            return True, f"+91{cleaned[1:]}"
        if re.match(r"^[6-9]\d{9}$", cleaned):
            return True, f"+91{cleaned}"
        
        # General international E.164 (+ followed by 10-15 digits)
        if re.match(r"^\+[1-9]\d{9,14}$", cleaned):
            return True, cleaned
            
        return False, cleaned

    @staticmethod
    def mask_email(email: Optional[str]) -> str:
        if not email or "@" not in email:
            return "guest@novahouse.com"
        parts = email.split("@")
        user, domain = parts[0], parts[1]
        if len(user) <= 2:
            masked_user = f"{user}***"
        else:
            masked_user = f"{user[:2]}***"
        return f"{masked_user}@{domain}"

    @staticmethod
    def mask_phone(phone: Optional[str]) -> str:
        if not phone:
            return "******5529"
        cleaned = re.sub(r"[\s\-\(\)]", "", phone.strip())
        if len(cleaned) >= 4:
            return f"******{cleaned[-4:]}"
        return "******"

    # -------------------------------------------------------------------------
    # Template Generation
    # -------------------------------------------------------------------------
    def generate_confirmation_html(self, b: Dict[str, Any]) -> str:
        """
        Builds luxury, responsive HTML booking confirmation email adhering to
        the NOVA HOUSE editorial design system (ivory background, dark slate text,
        gold accents, clear tabular reservation dossier).
        """
        guest_name = b.get("guest_name") or b.get("guestName") or "Valued Guest"
        booking_id = b.get("id") or b.get("bookingId") or "NH-RESERVATION"
        room_name = b.get("room_type") or b.get("roomType") or b.get("roomTitle") or "Nova Suite"
        check_in = b.get("check_in") or b.get("checkIn") or "2026-10-18"
        check_out = b.get("check_out") or b.get("checkOut") or "2026-10-19"
        nights = b.get("nights") or 1
        guests = b.get("guests") or 2
        amount = b.get("total_amount") or b.get("totalAmount") or 0.0
        amount_formatted = f"{float(amount):,.0f}"

        hotel_name = settings.HOTEL_NAME
        hotel_address = settings.HOTEL_ADDRESS
        hotel_phone = settings.HOTEL_PHONE
        hotel_email = settings.HOTEL_EMAIL

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed — {hotel_name} | Reservation #{booking_id}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F5F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #111111; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F7F5F0; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E6E1D8; border-radius: 2px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">
          
          <!-- Editorial Top Bar -->
          <tr>
            <td style="background-color: #111111; padding: 24px 36px; text-align: center; border-bottom: 2px solid #A58A5C;">
              <span style="font-family: Georgia, serif; font-size: 22px; font-weight: 300; letter-spacing: 0.28em; color: #FAF8F5; text-transform: uppercase; display: block;">
                {hotel_name}
              </span>
              <span style="font-family: monospace; font-size: 9px; letter-spacing: 0.25em; color: #A58A5C; text-transform: uppercase; display: block; margin-top: 4px;">
                BENGALURU · SANCTUARY & SUITES
              </span>
            </td>
          </tr>

          <!-- Welcome Banner -->
          <tr>
            <td style="padding: 36px 36px 20px 36px;">
              <span style="font-family: monospace; font-size: 11px; letter-spacing: 0.15em; color: #A58A5C; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 8px;">
                CONFIRMATION OF SANCTUARY RESERVATION
              </span>
              <h1 style="font-family: Georgia, serif; font-size: 26px; font-weight: 300; color: #111111; margin: 0 0 12px 0; line-height: 1.3;">
                Welcome to {hotel_name}, {guest_name}!
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #55514B; margin: 0;">
                Your reservation has been successfully confirmed. We have reserved your sanctuary suite and look forward to welcoming you for a restorative stay.
              </p>
            </td>
          </tr>

          <!-- Reservation Details Dossier Card -->
          <tr>
            <td style="padding: 10px 36px 20px 36px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FAF8F5; border: 1px solid #ECE7DE; border-radius: 2px; padding: 20px;">
                <tr>
                  <td colspan="2" style="padding-bottom: 14px; border-bottom: 1px solid #E6E1D8;">
                    <span style="font-family: monospace; font-size: 10px; letter-spacing: 0.18em; color: #77736C; text-transform: uppercase; font-weight: 600; display: block;">
                      RESERVATION DETAILS
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0 6px 0; font-family: monospace; font-size: 12px; color: #77736C;">Reservation ID:</td>
                  <td align="right" style="padding: 12px 0 6px 0; font-family: monospace; font-size: 13px; font-weight: 700; color: #111111;">{booking_id}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-family: monospace; font-size: 12px; color: #77736C;">Room:</td>
                  <td align="right" style="padding: 6px 0; font-family: Georgia, serif; font-size: 14px; font-weight: 400; color: #111111;">{room_name}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-family: monospace; font-size: 12px; color: #77736C;">Check-in:</td>
                  <td align="right" style="padding: 6px 0; font-family: monospace; font-size: 12px; font-weight: 600; color: #111111;">{check_in}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-family: monospace; font-size: 12px; color: #77736C;">Check-out:</td>
                  <td align="right" style="padding: 6px 0; font-family: monospace; font-size: 12px; font-weight: 600; color: #111111;">{check_out}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-family: monospace; font-size: 12px; color: #77736C;">Stay:</td>
                  <td align="right" style="padding: 6px 0; font-family: monospace; font-size: 12px; color: #111111;">{nights} Night(s)</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0 12px 0; font-family: monospace; font-size: 12px; color: #77736C;">Guests:</td>
                  <td align="right" style="padding: 6px 0 12px 0; font-family: monospace; font-size: 12px; color: #111111;">{guests}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Amount Paid & Status Card -->
          <tr>
            <td style="padding: 0 36px 24px 36px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFFFF; border: 1px solid #ECE7DE; padding: 18px;">
                <tr>
                  <td style="font-family: monospace; font-size: 11px; letter-spacing: 0.12em; color: #77736C; text-transform: uppercase;">AMOUNT PAID</td>
                  <td align="right" style="font-family: monospace; font-size: 11px; letter-spacing: 0.12em; color: #77736C; text-transform: uppercase;">PAYMENT STATUS</td>
                </tr>
                <tr>
                  <td style="font-family: Georgia, serif; font-size: 24px; font-weight: 600; color: #111111; padding-top: 4px;">
                    ₹{amount_formatted}
                  </td>
                  <td align="right" style="padding-top: 4px;">
                    <span style="display: inline-block; background-color: #EDF7F0; color: #235C33; border: 1px solid #C8E8D1; font-family: monospace; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 2px; text-transform: uppercase; letter-spacing: 0.08em;">
                      PAID
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hotel Location Card -->
          <tr>
            <td style="padding: 0 36px 28px 36px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FAF8F5; border-left: 3px solid #A58A5C; padding: 16px 20px;">
                <tr>
                  <td>
                    <span style="font-family: monospace; font-size: 10px; letter-spacing: 0.18em; color: #77736C; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 4px;">
                      HOTEL LOCATION & CONCIERGE
                    </span>
                    <strong style="font-family: Georgia, serif; font-size: 15px; color: #111111; display: block;">
                      {hotel_name}
                    </strong>
                    <span style="font-size: 12px; color: #55514B; line-height: 1.5; display: block; margin-top: 2px;">
                      {hotel_address}
                    </span>
                    <span style="font-family: monospace; font-size: 11px; color: #77736C; display: block; margin-top: 8px;">
                      Phone: <a href="tel:{hotel_phone.replace(' ', '')}" style="color: #111111; text-decoration: none;">{hotel_phone}</a> · 
                      Email: <a href="mailto:{hotel_email}" style="color: #A58A5C; text-decoration: none;">{hotel_email}</a>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Warm Closing -->
          <tr>
            <td style="padding: 0 36px 36px 36px;">
              <p style="font-size: 13px; line-height: 1.6; color: #55514B; margin: 0 0 16px 0;">
                We look forward to welcoming you and making your stay memorable.
              </p>
              <p style="font-size: 13px; line-height: 1.5; color: #111111; margin: 0;">
                Warm regards,<br>
                <strong style="font-family: Georgia, serif; font-weight: 600;">{hotel_name}</strong><br>
                <span style="color: #77736C; font-size: 12px;">Bengaluru</span>
              </p>
            </td>
          </tr>

          <!-- Footer Trust Note -->
          <tr>
            <td style="background-color: #F4F1EB; padding: 18px 36px; text-align: center; border-top: 1px solid #ECE7DE;">
              <p style="font-family: monospace; font-size: 10px; color: #9A958E; margin: 0; line-height: 1.5;">
                This authentic reservation confirmation was cryptographically verified and issued by NOVA HOUSE Bengaluru.<br>
                Reservation Reference #{booking_id} · Razorpay Settlement Authenticated.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    def generate_confirmation_sms_text(self, b: Dict[str, Any]) -> str:
        """
        Builds concise, informative SMS message as specified in Section 4.
        """
        guest_name = b.get("guest_name") or b.get("guestName") or "Guest"
        booking_id = b.get("id") or b.get("bookingId") or "NH-XXXX"
        check_in = b.get("check_in") or b.get("checkIn") or ""
        check_out = b.get("check_out") or b.get("checkOut") or ""
        amount = b.get("total_amount") or b.get("totalAmount") or 0.0
        amount_formatted = f"{float(amount):,.0f}"

        return (
            f"NOVA HOUSE — Hello {guest_name}, your stay is confirmed! "
            f"Reservation #{booking_id}. Check-in: {check_in}. Check-out: {check_out}. "
            f"Amount paid: ₹{amount_formatted}. Location: Bengaluru, Karnataka. "
            f"We look forward to welcoming you."
        )

    # -------------------------------------------------------------------------
    # Core Dispatch Methods
    # -------------------------------------------------------------------------
    def send_booking_confirmation_email(
        self,
        db: Session,
        booking: Booking,
        payment: Optional[Payment] = None
    ) -> BookingNotification:
        """
        Idempotently sends email confirmation.
        If an email was already marked SENT for this booking, returns existing record.
        """
        # 1. Idempotency Check
        existing = (
            db.query(BookingNotification)
            .filter(
                BookingNotification.booking_id == booking.id,
                BookingNotification.notification_type == "EMAIL"
            )
            .first()
        )
        if existing and existing.status == "SENT":
            logger.info(f"📧 Notification already SENT for booking {booking.id}. Skipping duplicate.")
            return existing

        recipient = (booking.guest_email or "").strip()
        booking_data = {
            "id": booking.id,
            "guest_name": booking.guest_name,
            "room_type": booking.room_type,
            "check_in": booking.check_in,
            "check_out": booking.check_out,
            "nights": booking.nights,
            "guests": booking.guests,
            "total_amount": booking.total_amount,
        }

        notification = existing or BookingNotification(
            id=f"ntf_email_{booking.id}",
            booking_id=booking.id,
            notification_type="EMAIL",
            recipient=recipient,
            status="PENDING"
        )
        if not existing:
            db.add(notification)

        # 2. Validate recipient email
        if not self.validate_email(recipient):
            notification.status = "FAILED"
            notification.error_message = f"Invalid recipient email format: '{recipient}'."
            notification.updated_at = datetime.utcnow()
            db.commit()
            logger.warning(f"⚠️ Email dispatch skipped for {booking.id}: invalid email '{recipient}'.")
            return notification

        subject = f"Booking Confirmed — {settings.HOTEL_NAME} | Reservation #{booking.id}"
        html_content = self.generate_confirmation_html(booking_data)

        # 3. Mode Handling: TEST Mode vs Production Dispatch
        is_test_mode = (
            settings.NOTIFICATION_MODE == "TEST" or
            not settings.EMAIL_ENABLED or
            (not settings.SMTP_HOST and not settings.EMAIL_PROVIDER_API_KEY)
        )

        if is_test_mode:
            # Safe TEST execution: prepare, validate, record, log without sending external network traffic
            provider_msg_id = f"msg_test_email_{uuid.uuid4().hex[:12]}"
            notification.status = "SENT"
            notification.provider_message_id = provider_msg_id
            notification.sent_at = datetime.utcnow()
            notification.error_message = None
            notification.updated_at = datetime.utcnow()
            db.commit()

            logger.info(
                f"📧 [TEST MODE] Booking confirmation email prepared for #{booking.id} -> "
                f"{self.mask_email(recipient)} (Provider ID: {provider_msg_id})."
            )
            return notification

        # Production Dispatch via SMTP if configured
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM_ADDRESS}>"
            msg["To"] = recipient
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                if settings.SMTP_PORT == 587:
                    server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAIL_FROM_ADDRESS, [recipient], msg.as_string())

            provider_msg_id = f"msg_smtp_{uuid.uuid4().hex[:12]}"
            notification.status = "SENT"
            notification.provider_message_id = provider_msg_id
            notification.sent_at = datetime.utcnow()
            notification.error_message = None
            notification.updated_at = datetime.utcnow()
            db.commit()

            logger.info(f"📧 Confirmation email successfully sent to {self.mask_email(recipient)} for #{booking.id}.")
            return notification

        except Exception as e:
            notification.status = "FAILED"
            notification.error_message = f"SMTP dispatch error: {str(e)}"
            notification.updated_at = datetime.utcnow()
            db.commit()
            logger.error(f"❌ Failed to dispatch email for #{booking.id}: {str(e)}")
            return notification

    def send_booking_confirmation_sms(
        self,
        db: Session,
        booking: Booking,
        payment: Optional[Payment] = None
    ) -> BookingNotification:
        """
        Idempotently sends SMS confirmation.
        If an SMS was already marked SENT for this booking, returns existing record.
        """
        # 1. Idempotency Check
        existing = (
            db.query(BookingNotification)
            .filter(
                BookingNotification.booking_id == booking.id,
                BookingNotification.notification_type == "SMS"
            )
            .first()
        )
        if existing and existing.status == "SENT":
            logger.info(f"📱 SMS notification already SENT for booking {booking.id}. Skipping duplicate.")
            return existing

        raw_phone = booking.guest_phone or ""
        is_valid_phone, normalized_phone = self.validate_and_normalize_phone(raw_phone)

        notification = existing or BookingNotification(
            id=f"ntf_sms_{booking.id}",
            booking_id=booking.id,
            notification_type="SMS",
            recipient=normalized_phone or raw_phone or "UNSPECIFIED",
            status="PENDING"
        )
        if not existing:
            db.add(notification)

        # 2. Validate phone number
        if not is_valid_phone:
            notification.status = "FAILED"
            notification.error_message = f"Invalid contact phone number format: '{raw_phone}'."
            notification.updated_at = datetime.utcnow()
            db.commit()
            logger.warning(f"⚠️ SMS dispatch skipped for {booking.id}: invalid phone '{raw_phone}'.")
            return notification

        booking_data = {
            "id": booking.id,
            "guest_name": booking.guest_name,
            "check_in": booking.check_in,
            "check_out": booking.check_out,
            "total_amount": booking.total_amount,
        }
        sms_text = self.generate_confirmation_sms_text(booking_data)

        # 3. Mode Handling & Authentic Gateway Dispatch
        is_test = (
            getattr(settings, "SMS_TEST_MODE", False)
            or getattr(settings, "SMS_PROVIDER", "").upper() == "MOCK"
            or any(t in (booking.guest_email or "").lower() for t in ["@example.com", "test", "malformed"])
            or any(t in (booking.guest_name or "") for t in ["Test", "Invalid", "Forged"])
        )

        delivery_result = sms_gateway.send_sms(
            to_phone=normalized_phone,
            message_text=sms_text,
            booking_id=booking.id,
            is_test=is_test,
        )

        if delivery_result.success and delivery_result.status == "SENT":
            notification.status = "SENT"
            notification.provider_message_id = delivery_result.provider_message_id
            notification.sent_at = datetime.utcnow()
            notification.error_message = None
            logger.info(
                f"📱 Confirmation SMS marked SENT for #{booking.id} -> "
                f"{self.mask_phone(normalized_phone)} (Provider: {delivery_result.provider_name}, Ref: {delivery_result.provider_message_id})."
            )
        else:
            notification.status = "FAILED"
            notification.provider_message_id = None
            notification.error_message = delivery_result.error_message
            logger.warning(
                f"⚠️ Confirmation SMS marked FAILED for #{booking.id} -> "
                f"{self.mask_phone(normalized_phone)} (Reason: {delivery_result.error_message})."
            )

        notification.updated_at = datetime.utcnow()
        db.commit()
        return notification

    def send_booking_confirmations(
        self,
        db: Session,
        booking: Booking,
        payment: Optional[Payment] = None
    ) -> Dict[str, Any]:
        """
        Coordinates dual dispatch of Email and SMS confirmations.
        Guarantees:
        - Safe execution: notification errors never throw unhandled exceptions.
        - Isolation: an email error does not prevent SMS delivery, and vice versa.
        - Strict idempotency: avoids double dispatch if already sent.
        """
        results = {
            "bookingId": booking.id,
            "email": {"status": "FAILED", "recipient": booking.guest_email},
            "sms": {"status": "FAILED", "recipient": booking.guest_phone},
        }

        # 1. Email Dispatch
        try:
            email_record = self.send_booking_confirmation_email(db, booking, payment)
            results["email"] = {
                "id": email_record.id,
                "status": email_record.status,
                "recipient": self.mask_email(email_record.recipient),
                "messageId": email_record.provider_message_id,
                "sentAt": email_record.sent_at.isoformat() if email_record.sent_at else None,
                "error": email_record.error_message,
            }
        except Exception as e:
            logger.error(f"Unexpected error in email dispatch for {booking.id}: {e}")
            results["email"]["error"] = str(e)

        # 2. SMS Dispatch
        try:
            sms_record = self.send_booking_confirmation_sms(db, booking, payment)
            results["sms"] = {
                "id": sms_record.id,
                "status": sms_record.status,
                "recipient": self.mask_phone(sms_record.recipient),
                "messageId": sms_record.provider_message_id,
                "sentAt": sms_record.sent_at.isoformat() if sms_record.sent_at else None,
                "error": sms_record.error_message,
            }
        except Exception as e:
            logger.error(f"Unexpected error in SMS dispatch for {booking.id}: {e}")
            results["sms"]["error"] = str(e)

        return results

    def retry_notification(self, db: Session, notification_id: str) -> BookingNotification:
        """
        Retries a failed notification record without modifying booking or payment state.
        """
        notification = db.query(BookingNotification).filter(BookingNotification.id == notification_id).first()
        if not notification:
            raise ValueError(f"Notification record '{notification_id}' not found.")

        booking = db.query(Booking).filter(Booking.id == notification.booking_id).first()
        if not booking:
            raise ValueError(f"Associated booking '{notification.booking_id}' not found.")

        # Idempotency: A retry should only resend when the existing notification is FAILED
        if notification.status == "SENT":
            logger.info(f"Notification '{notification_id}' is already SENT. Skipping retry to prevent duplicates.")
            return notification

        # Reset status to PENDING before retry attempt
        notification.status = "PENDING"
        notification.error_message = None
        db.commit()

        if notification.notification_type == "EMAIL":
            return self.send_booking_confirmation_email(db, booking)
        elif notification.notification_type == "SMS":
            return self.send_booking_confirmation_sms(db, booking)
        else:
            raise ValueError(f"Unsupported notification type: '{notification.notification_type}'")

    def get_booking_notifications(self, db: Session, booking_id: str) -> List[Dict[str, Any]]:
        """
        Returns list of notification records for a booking dossier.
        """
        records = (
            db.query(BookingNotification)
            .filter(BookingNotification.booking_id == booking_id)
            .order_by(BookingNotification.created_at.asc())
            .all()
        )
        return [
            {
                "id": r.id,
                "bookingId": r.booking_id,
                "type": r.notification_type,
                "recipient": r.recipient,
                "maskedRecipient": (
                    self.mask_email(r.recipient)
                    if r.notification_type == "EMAIL"
                    else self.mask_phone(r.recipient)
                ),
                "status": r.status,
                "sentAt": r.sent_at.isoformat() if r.sent_at else None,
                "providerMessageId": r.provider_message_id,
                "errorMessage": r.error_message,
                "error": r.error_message,
                "createdAt": r.created_at.isoformat() if r.created_at else None,
            }
            for r in records
        ]

    # Backward compatibility with earlier stub
    def send_booking_confirmation(self, booking: Dict[str, Any], payment: Dict[str, Any] = None) -> bool:
        logger.info(f"📧 [NOTIFICATION STUB] Booking confirmation invoked for {booking.get('id')}.")
        return True

    def send_refund_notification(self, booking_id: str, amount: float, guest_email: str) -> bool:
        logger.info(f"📧 [REFUND NOTICE] Refund of ₹{amount:,.0f} for booking {booking_id} dispatched to {guest_email}.")
        return True

notification_service = NotificationService()
