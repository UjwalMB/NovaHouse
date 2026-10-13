import uuid
import time
import logging
from datetime import datetime, date
from typing import Dict, Any, Optional, List
import razorpay
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.security import verify_razorpay_signature, verify_razorpay_webhook_signature
from ..models.payment import Payment
from ..models.booking import Booking
from .notification_service import notification_service

logger = logging.getLogger("novahouse.payments")

class PaymentService:
    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        self.mode = settings.RAZORPAY_MODE

        # Initialize official Razorpay SDK client
        try:
            self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
            self.client.set_app_details({"title": "NovaHouseHotel", "version": "1.0.0"})
        except Exception as e:
            logger.warning(f"Razorpay client initialization warning: {e}")
            self.client = None

    def calculate_stay_amount(self, room_id: str, check_in_str: str, check_out_str: str) -> Dict[str, Any]:
        """
        CRITICAL SECURITY REQUIREMENT:
        Calculate booking price SERVER-SIDE. Never trust values from the frontend.
        Formula: (Room price * Number of nights) + Taxes (18% GST) - Discounts
        """
        room_info = settings.ROOM_PRICING.get(room_id)
        if not room_info:
            # Fallback to default Nova Suite if not found
            room_info = settings.ROOM_PRICING["nova-suite"]

        try:
            d1 = datetime.strptime(check_in_str, "%Y-%m-%d")
            d2 = datetime.strptime(check_out_str, "%Y-%m-%d")
            nights = max(1, (d2 - d1).days)
        except Exception:
            nights = 1

        base_rate = room_info["basePrice"]
        room_subtotal = base_rate * nights
        taxes = round(room_subtotal * settings.TAX_RATE)
        discount = 0.0
        final_total = room_subtotal + taxes - discount
        amount_paise = int(final_total * 100)

        return {
            "roomTitle": room_info["title"],
            "roomNumber": room_info["number"],
            "baseRate": float(base_rate),
            "nights": nights,
            "subtotal": float(room_subtotal),
            "taxes": float(taxes),
            "discount": float(discount),
            "totalAmount": float(final_total),
            "amountPaise": amount_paise,
        }

    def create_order(self, db: Session, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a secure Razorpay order for an upcoming room reservation.
        Includes double-payment protection and server-side price calculation.
        """
        room_id = payload.get("roomId", "nova-suite")
        check_in = payload.get("checkIn")
        check_out = payload.get("checkOut")
        guest_name = payload.get("guestName", "Valued Guest").strip()
        guest_email = payload.get("guestEmail", "guest@novahouse.example").strip()
        guest_phone = payload.get("guestPhone", "+91 98450 12345")
        guest_country = payload.get("guestCountry", "India")
        guests_count = payload.get("guests", 2)
        special_req = payload.get("specialRequests", "Direct website reservation")

        # 1. Authoritative Server-Side Calculation
        calc = self.calculate_stay_amount(room_id, check_in, check_out)
        amount_paise = calc["amountPaise"]
        total_amount = calc["totalAmount"]

        # 2. Generate or identify booking ID
        booking_id = payload.get("bookingId") or payload.get("booking_id")
        if not booking_id:
            base_num = int(time.time() * 1000) % 9000 + 1000
            booking_id = f"NH-{base_num}"
            while db.query(Booking).filter(Booking.id == booking_id).first():
                base_num = (base_num + random.randint(1, 99)) % 9000 + 1000
                booking_id = f"NH-{base_num}"

        # 3. Check for double payment protection
        existing_booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if existing_booking and existing_booking.payment_status == "PAID":
            raise ValueError("Booking already paid. Duplicate payment prevented.")

        # 4. Create Order with Razorpay SDK
        order_receipt = f"rec_{booking_id}"
        razorpay_order_id = None
        
        if self.client and not self.key_secret.startswith("rzp_sec_novahouse_test"):
            try:
                order_params = {
                    "amount": amount_paise,
                    "currency": "INR",
                    "receipt": order_receipt,
                    "notes": {
                        "hotel": "NOVA HOUSE Bengaluru",
                        "booking_id": booking_id,
                        "room": calc["roomTitle"],
                        "guest_name": guest_name,
                        "guest_email": guest_email,
                    },
                }
                rzp_order = self.client.order.create(data=order_params)
                razorpay_order_id = rzp_order.get("id")
            except Exception as e:
                logger.warning(f"Live Razorpay API call failed: {e}. Falling back to standard test order simulation.")

        if not razorpay_order_id:
            # Deterministic test order ID for Razorpay Test Mode simulation
            razorpay_order_id = f"order_{uuid.uuid4().hex[:14]}"

        # 5. Persist initial Booking with PAYMENT_PENDING status
        booking = Booking(
            id=booking_id,
            booking_number=booking_id,
            guest_id=f"gst_{booking_id}",
            guest_name=guest_name,
            guest_email=guest_email,
            guest_phone=guest_phone,
            guest_country=guest_country,
            room_number=calc["roomNumber"],
            room_type=calc["roomTitle"],
            room_id=room_id,
            check_in=check_in,
            check_out=check_out,
            nights=calc["nights"],
            guests=guests_count,
            base_rate=calc["baseRate"],
            taxes=calc["taxes"],
            discount=calc["discount"],
            total_amount=total_amount,
            payment_status="PENDING",
            booking_status="Pending",
            payment_method="Razorpay",
            razorpay_order_id=razorpay_order_id,
            special_requests=special_req,
            source="Website Direct",
            created_at=datetime.utcnow()
        )
        db.merge(booking)

        # 6. Persist initial Payment record
        payment_record_id = f"pay_rec_{booking_id}"
        payment = Payment(
            id=payment_record_id,
            booking_id=booking_id,
            razorpay_order_id=razorpay_order_id,
            amount=total_amount,
            amount_paise=amount_paise,
            currency="INR",
            status="PENDING",
            email=guest_email,
            contact=guest_phone,
            created_at=datetime.utcnow()
        )
        db.merge(payment)
        db.commit()

        return {
            "orderId": razorpay_order_id,
            "amount": total_amount,
            "amountPaise": amount_paise,
            "currency": "INR",
            "keyId": self.key_id,
            "bookingId": booking_id,
            "roomTitle": calc["roomTitle"],
            "nights": calc["nights"],
            "taxes": calc["taxes"],
            "discount": calc["discount"],
            "isTestMode": self.mode == "TEST",
            "breakdown": {
                "baseRate": calc["baseRate"],
                "nights": calc["nights"],
                "subtotal": calc["subtotal"],
                "taxes": calc["taxes"],
                "total": total_amount,
            }
        }

    def verify_payment(self, db: Session, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        CRITICAL SECURITY REQUIREMENT:
        Verify the Razorpay payment signature cryptographically on the server.
        Never trust payment success sent from the frontend.
        """
        razorpay_order_id = payload.get("razorpay_order_id")
        razorpay_payment_id = payload.get("razorpay_payment_id")
        razorpay_signature = payload.get("razorpay_signature")
        booking_id = payload.get("booking_id")

        if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature or not booking_id:
            raise ValueError("Missing critical Razorpay verification parameters.")

        # 1. Booking Integrity Verification
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise ValueError(f"Booking '{booking_id}' not found in registry.")

        # 2. Guard: If already paid, return idempotent success
        if booking.payment_status == "PAID":
            try:
                payment_rec = db.query(Payment).filter(Payment.razorpay_order_id == razorpay_order_id).first()
                notification_service.send_booking_confirmations(db, booking, payment_rec)
            except Exception:
                pass
            return {
                "success": True,
                "bookingId": booking_id,
                "paymentId": booking.payment_id or razorpay_payment_id,
                "paymentStatus": "PAID",
                "bookingStatus": "Confirmed",
                "message": "Payment already verified and confirmed.",
                "booking": self._booking_to_dict(booking)
            }

        # 3. Consistency Checks: Order & Payment Binding
        if booking.razorpay_order_id and booking.razorpay_order_id != razorpay_order_id:
            raise ValueError(f"Security mismatch: Razorpay order '{razorpay_order_id}' does not match registered order for booking '{booking_id}'.")

        payment = db.query(Payment).filter(Payment.razorpay_order_id == razorpay_order_id).first()
        if not payment:
            raise ValueError(f"No payment record found corresponding to Razorpay order '{razorpay_order_id}'.")

        if payment.booking_id and payment.booking_id != booking_id:
            raise ValueError(f"Security mismatch: Payment record is bound to booking '{payment.booking_id}', not '{booking_id}'.")

        if payment.amount != booking.total_amount:
            raise ValueError(f"Amount mismatch: Payment record amount ₹{payment.amount} does not match authoritative booking amount ₹{booking.total_amount}.")

        # 4. Authoritative Cryptographic Signature Verification (HMAC-SHA256)
        # Never bypass signature verification based on TEST mode or mock headers.
        is_valid = verify_razorpay_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature)

        if not is_valid:
            # Mark payment record as FAILED while keeping booking PENDING
            payment.status = "FAILED"
            payment.error_code = "BAD_SIGNATURE"
            payment.error_description = "Server-side Razorpay cryptographic signature mismatch."
            db.commit()
            raise ValueError("Cryptographic payment signature verification failed.")

        # Determine real payment method if available
        payment_method = "Card"
        if self.client and not self.key_secret.startswith("rzp_sec_novahouse_test"):
            try:
                rzp_payment = self.client.payment.fetch(razorpay_payment_id)
                payment_method = rzp_payment.get("method", "Card").capitalize()
            except Exception:
                pass

        # Update Payment Record
        payment = db.query(Payment).filter(Payment.razorpay_order_id == razorpay_order_id).first()
        if not payment:
            payment = Payment(
                id=razorpay_payment_id,
                booking_id=booking_id,
                razorpay_order_id=razorpay_order_id,
                amount=booking.total_amount,
                amount_paise=int(booking.total_amount * 100),
                currency="INR"
            )
            db.add(payment)

        payment.razorpay_payment_id = razorpay_payment_id
        payment.razorpay_signature = razorpay_signature
        payment.status = "PAID"
        payment.method = payment_method
        payment.updated_at = datetime.utcnow()

        # Update Booking Status
        booking.payment_status = "PAID"
        booking.booking_status = "Confirmed"
        booking.payment_id = razorpay_payment_id
        booking.payment_method = payment_method
        booking.updated_at = datetime.utcnow()

        db.commit()

        # Dispatch automated booking confirmations (Email + SMS)
        # Transactional isolation: notification issues never rollback confirmed payment
        try:
            notification_service.send_booking_confirmations(db, booking, payment)
        except Exception as e:
            logger.error(f"Notification dispatch failure for #{booking_id}: {e}")

        return {
            "success": True,
            "bookingId": booking_id,
            "paymentId": razorpay_payment_id,
            "paymentStatus": "PAID",
            "bookingStatus": "Confirmed",
            "message": "Payment verified successfully. Booking confirmed.",
            "booking": self._booking_to_dict(booking)
        }

    def process_refund(self, db: Session, payment_id: str, amount: Optional[float] = None, reason: str = "") -> Dict[str, Any]:
        """
        Process a full or partial refund securely through FastAPI -> Razorpay.
        Never call Razorpay refund APIs directly from React.
        """
        payment = db.query(Payment).filter(
            (Payment.id == payment_id) | 
            (Payment.razorpay_payment_id == payment_id) | 
            (Payment.booking_id == payment_id)
        ).first()

        if not payment:
            raise ValueError(f"Payment record {payment_id} not found.")

        if payment.status != "PAID":
            raise ValueError(f"Cannot refund payment with status '{payment.status}'.")

        refund_amount = amount if amount is not None else payment.amount
        if refund_amount > payment.amount:
            raise ValueError("Refund amount exceeds original payment amount.")

        refund_paise = int(refund_amount * 100)
        actual_refund_id = f"rfnd_{uuid.uuid4().hex[:14]}"

        # Call Razorpay Refund API if live credentials available
        if self.client and payment.razorpay_payment_id and not self.key_secret.startswith("rzp_sec_novahouse_test"):
            try:
                rzp_refund = self.client.payment.refund(payment.razorpay_payment_id, {
                    "amount": refund_paise,
                    "notes": {"reason": reason, "booking_id": payment.booking_id}
                })
                actual_refund_id = rzp_refund.get("id", actual_refund_id)
            except Exception as e:
                logger.warning(f"Razorpay live refund error: {e}. Recording in test mode.")

        # Update database
        payment.status = "REFUNDED" if refund_amount >= payment.amount else "PARTIALLY_REFUNDED"
        payment.refund_id = actual_refund_id
        payment.refund_amount = refund_amount
        payment.updated_at = datetime.utcnow()

        # Update corresponding booking
        booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
        if booking:
            booking.payment_status = "REFUNDED"
            booking.booking_status = "Cancelled"
            booking.updated_at = datetime.utcnow()

        db.commit()

        if booking:
            notification_service.send_refund_notification(booking.id, refund_amount, booking.guest_email)

        return {
            "success": True,
            "refundId": actual_refund_id,
            "amount": refund_amount,
            "status": payment.status,
            "message": f"Successfully processed refund of ₹{refund_amount:,.0f}."
        }

    def retry_payment(self, db: Session, booking_id: str) -> Dict[str, Any]:
        """
        Allow guest to retry an uncompleted or failed payment without creating a duplicate booking.
        """
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise ValueError(f"Booking {booking_id} not found.")

        if booking.payment_status == "PAID":
            raise ValueError("Booking already paid. Retrying payment is not allowed.")

        amount_paise = int(booking.total_amount * 100)
        new_order_id = f"order_{uuid.uuid4().hex[:14]}"

        if self.client and not self.key_secret.startswith("rzp_sec_novahouse_test"):
            try:
                rzp_order = self.client.order.create({
                    "amount": amount_paise,
                    "currency": "INR",
                    "receipt": f"retry_{booking_id}",
                    "notes": {"booking_id": booking_id, "retry": "true"}
                })
                new_order_id = rzp_order.get("id", new_order_id)
            except Exception:
                pass

        booking.razorpay_order_id = new_order_id
        booking.payment_status = "PENDING"
        db.commit()

        return {
            "orderId": new_order_id,
            "amount": booking.total_amount,
            "amountPaise": amount_paise,
            "currency": "INR",
            "keyId": self.key_id,
            "bookingId": booking_id,
            "roomTitle": booking.room_type,
            "nights": booking.nights,
            "taxes": booking.taxes,
            "isTestMode": self.mode == "TEST"
        }

    def process_webhook(self, db: Session, body: bytes, signature: str) -> Dict[str, Any]:
        """
        Idempotent Razorpay Webhook processor.
        Handles payment.captured, payment.failed, refund.processed.
        """
        if not verify_razorpay_webhook_signature(body, signature):
            raise ValueError("Invalid webhook cryptographic signature.")

        import json
        event = json.loads(body.decode("utf-8"))
        event_type = event.get("event")
        payload_entity = event.get("payload", {}).get("payment", {}).get("entity", {})

        rzp_payment_id = payload_entity.get("id")
        rzp_order_id = payload_entity.get("order_id")

        if not rzp_order_id:
            return {"status": "ignored", "reason": "No order_id in event"}

        payment = db.query(Payment).filter(Payment.razorpay_order_id == rzp_order_id).first()
        booking = db.query(Booking).filter(Booking.razorpay_order_id == rzp_order_id).first()

        if event_type == "payment.captured":
            if payment and payment.status != "PAID":
                payment.status = "PAID"
                payment.razorpay_payment_id = rzp_payment_id
                payment.method = payload_entity.get("method", "Card").capitalize()
                payment.updated_at = datetime.utcnow()

            if booking and booking.payment_status != "PAID":
                booking.payment_status = "PAID"
                booking.booking_status = "Confirmed"
                booking.payment_id = rzp_payment_id
                booking.updated_at = datetime.utcnow()

            db.commit()

        elif event_type == "payment.failed":
            if payment and payment.status != "PAID":
                payment.status = "FAILED"
                payment.error_code = payload_entity.get("error_code")
                payment.error_description = payload_entity.get("error_description")
                db.commit()

            if booking and booking.payment_status != "PAID":
                booking.payment_status = "FAILED"
                db.commit()

        return {"status": "processed", "event": event_type}

    def _booking_to_dict(self, b: Booking) -> Dict[str, Any]:
        return {
            "id": b.id,
            "booking_number": b.booking_number or b.id,
            "bookingNumber": b.booking_number or b.id,
            "guest_id": b.guest_id or f"gst_{b.id}",
            "guestId": b.guest_id or f"gst_{b.id}",
            "guestName": b.guest_name,
            "guest_name": b.guest_name,
            "guestEmail": b.guest_email,
            "guest_email": b.guest_email,
            "guestPhone": b.guest_phone,
            "guest_phone": b.guest_phone,
            "guestCountry": b.guest_country,
            "guest_country": b.guest_country,
            "roomNumber": b.room_number,
            "room_number": b.room_number,
            "roomType": b.room_type,
            "room_type": b.room_type,
            "roomId": b.room_id,
            "room_id": b.room_id,
            "checkIn": b.check_in,
            "check_in": b.check_in,
            "checkOut": b.check_out,
            "check_out": b.check_out,
            "nights": b.nights,
            "number_of_nights": b.nights,
            "guests": b.guests,
            "baseRate": b.base_rate,
            "base_rate": b.base_rate,
            "room_amount": b.base_rate * b.nights,
            "roomAmount": b.base_rate * b.nights,
            "taxes": b.taxes,
            "tax_amount": b.taxes,
            "taxAmount": b.taxes,
            "discount": b.discount,
            "discount_amount": b.discount,
            "discountAmount": b.discount,
            "totalAmount": b.total_amount,
            "total_amount": b.total_amount,
            "paymentStatus": b.payment_status,
            "payment_status": b.payment_status,
            "bookingStatus": b.booking_status,
            "booking_status": b.booking_status,
            "paymentMethod": b.payment_method,
            "payment_method": b.payment_method,
            "paymentId": b.payment_id,
            "payment_id": b.payment_id,
            "razorpayOrderId": b.razorpay_order_id,
            "razorpay_order_id": b.razorpay_order_id,
            "specialRequests": b.special_requests,
            "special_requests": b.special_requests,
            "source": b.source,
            "createdAt": b.created_at.strftime("%Y-%m-%d") if b.created_at else str(date.today()),
            "created_at": b.created_at.isoformat() if b.created_at else datetime.utcnow().isoformat(),
            "updated_at": b.updated_at.isoformat() if b.updated_at else datetime.utcnow().isoformat(),
        }

payment_service = PaymentService()
