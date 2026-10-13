from datetime import datetime, date
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from ..models.booking import Booking
from ..models.payment import Payment

SEED_BOOKINGS = [
    {
        "id": "NH-1024",
        "guest_name": "Rahul Sharma",
        "guest_email": "rahul.sharma@venturecap.in",
        "guest_phone": "+91 98201 44589",
        "guest_country": "India",
        "room_number": "301",
        "room_type": "Nova Suite",
        "room_id": "nova-suite",
        "check_in": "2026-10-12",
        "check_out": "2026-10-15",
        "nights": 3,
        "guests": 2,
        "base_rate": 38000,
        "taxes": 20520,
        "discount": 5000,
        "total_amount": 129520,
        "payment_status": "PAID",
        "booking_status": "Checked In",
        "payment_method": "Corporate Amex",
        "payment_id": "pay_O7w88HhJ993881",
        "razorpay_order_id": "order_O7w88Order01",
        "special_requests": "High floor preferred, late checkout at 2:00 PM requested.",
        "source": "Website Direct",
        "created_at": datetime(2026, 10, 4)
    },
    {
        "id": "NH-1025",
        "guest_name": "Eleanor Vance",
        "guest_email": "e.vance@studioarch.co.uk",
        "guest_phone": "+44 7700 900142",
        "guest_country": "United Kingdom",
        "room_number": "501",
        "room_type": "The Bengaluru Penthouse",
        "room_id": "penthouse",
        "check_in": "2026-10-12",
        "check_out": "2026-10-17",
        "nights": 5,
        "guests": 2,
        "base_rate": 85000,
        "taxes": 76500,
        "discount": 0,
        "total_amount": 501500,
        "payment_status": "PAID",
        "booking_status": "Checked In",
        "payment_method": "Bank Wire / Netbanking",
        "payment_id": "pay_O8x99IiK112233",
        "razorpay_order_id": "order_O8x99Order02",
        "special_requests": "Chauffeur pickup from KIA Airport, sparkling water in cellar.",
        "source": "Concierge Direct",
        "created_at": datetime(2026, 9, 28)
    },
    {
        "id": "NH-1026",
        "guest_name": "Aditya Birla",
        "guest_email": "aditya.b@techinfra.com",
        "guest_phone": "+91 99304 88120",
        "guest_country": "India",
        "room_number": "102",
        "room_type": "Deluxe Courtyard",
        "room_id": "deluxe-room",
        "check_in": "2026-10-12",
        "check_out": "2026-10-14",
        "nights": 2,
        "guests": 1,
        "base_rate": 18500,
        "taxes": 6660,
        "discount": 0,
        "total_amount": 43660,
        "payment_status": "PAID",
        "booking_status": "Checked In",
        "payment_method": "UPI / GPay",
        "payment_id": "pay_O9y00JjL445566",
        "razorpay_order_id": "order_O9y00Order03",
        "special_requests": "Quiet courtyard view, early arrival luggage drop.",
        "source": "Website Direct",
        "created_at": datetime(2026, 10, 8)
    },
    {
        "id": "NH-1027",
        "guest_name": "Samantha Wu",
        "guest_email": "s.wu@singaporeglobal.sg",
        "guest_phone": "+65 8123 4567",
        "guest_country": "Singapore",
        "room_number": "201",
        "room_type": "Premier Garden Room",
        "room_id": "premier-room",
        "check_in": "2026-10-13",
        "check_out": "2026-10-16",
        "nights": 3,
        "guests": 2,
        "base_rate": 24000,
        "taxes": 12960,
        "discount": 3000,
        "total_amount": 81960,
        "payment_status": "PENDING",
        "booking_status": "Confirmed",
        "payment_method": "Visa Signature",
        "payment_id": None,
        "razorpay_order_id": "order_O9z11Order04",
        "special_requests": "Botanical spa session booking on arrival afternoon.",
        "source": "Website Direct",
        "created_at": datetime(2026, 10, 10)
    },
    {
        "id": "NH-1028",
        "guest_name": "Vikram Sethi",
        "guest_email": "vikram.sethi@heritage.in",
        "guest_phone": "+91 98110 33490",
        "guest_country": "India",
        "room_number": "401",
        "room_type": "Terrace Garden Suite",
        "room_id": "terrace-suite",
        "check_in": "2026-10-14",
        "check_out": "2026-10-18",
        "nights": 4,
        "guests": 2,
        "base_rate": 48000,
        "taxes": 34560,
        "discount": 0,
        "total_amount": 226560,
        "payment_status": "PAID",
        "booking_status": "Confirmed",
        "payment_method": "Mastercard World",
        "payment_id": "pay_O9a22KkM778899",
        "razorpay_order_id": "order_O9a22Order05",
        "special_requests": "Private terrace dinner reservation on Oct 15.",
        "source": "Website Direct",
        "created_at": datetime(2026, 10, 9)
    }
]

class BookingService:
    @staticmethod
    def seed_initial_bookings(db: Session):
        """Seed initial bookings if database is fresh."""
        count = db.query(Booking).count()
        if count == 0:
            for b_data in SEED_BOOKINGS:
                booking = Booking(**b_data)
                db.add(booking)
                
                # Also create corresponding payment record if paid
                if b_data.get("payment_status") == "PAID":
                    pay = Payment(
                        id=b_data["payment_id"] or f"pay_seed_{b_data['id']}",
                        booking_id=b_data["id"],
                        razorpay_order_id=b_data["razorpay_order_id"] or "order_seed",
                        razorpay_payment_id=b_data["payment_id"],
                        amount=b_data["total_amount"],
                        amount_paise=int(b_data["total_amount"] * 100),
                        currency="INR",
                        status="PAID",
                        method=b_data.get("payment_method", "Card"),
                        email=b_data["guest_email"],
                        contact=b_data["guest_phone"],
                        created_at=b_data["created_at"]
                    )
                    db.add(pay)
            db.commit()

    @staticmethod
    @staticmethod
    def _to_dict(b: Booking) -> Dict[str, Any]:
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
            "notifications": [
                {
                    "id": n.id,
                    "type": n.notification_type,
                    "recipient": n.recipient,
                    "status": n.status,
                    "sentAt": n.sent_at.isoformat() if n.sent_at else None,
                    "messageId": n.provider_message_id,
                    "error": n.error_message,
                }
                for n in (b.notifications if hasattr(b, "notifications") and b.notifications else [])
            ],
        }

    @staticmethod
    def get_all(db: Session) -> List[Dict[str, Any]]:
        BookingService.seed_initial_bookings(db)
        bookings = db.query(Booking).order_by(Booking.created_at.desc()).all()
        return [BookingService._to_dict(b) for b in bookings]

    @staticmethod
    def get_by_id(db: Session, booking_id: str) -> Optional[Dict[str, Any]]:
        b = db.query(Booking).filter(Booking.id == booking_id).first()
        if not b:
            return None
        return BookingService._to_dict(b)

booking_service = BookingService()
