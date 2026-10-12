import json
import os
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="NOVA HOUSE Hotel API", version="1.0.0")

# Enable full CORS for public website and admin portal
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = os.path.join(os.path.dirname(__file__), "bookings.json")

# Pre-seeded realistic bookings if bookings.json does not exist yet
INITIAL_BOOKINGS = [
    {
        "id": "NH-1024",
        "guestName": "Rahul Sharma",
        "guestEmail": "rahul.sharma@venturecap.in",
        "guestPhone": "+91 98201 44589",
        "guestCountry": "India",
        "roomNumber": "301",
        "roomType": "Nova Suite",
        "roomId": "301",
        "checkIn": "2026-10-12",
        "checkOut": "2026-10-15",
        "nights": 3,
        "guests": 2,
        "baseRate": 38000,
        "taxes": 20520,
        "discount": 5000,
        "totalAmount": 129520,
        "paymentStatus": "Paid",
        "bookingStatus": "Cancelled",
        "paymentMethod": "Corporate Amex",
        "specialRequests": "High floor preferred, late checkout at 2:00 PM requested.",
        "source": "Website Direct",
        "createdAt": "2026-10-04"
    },
    {
        "id": "NH-1025",
        "guestName": "Eleanor Vance",
        "guestEmail": "e.vance@studioarch.co.uk",
        "guestPhone": "+44 7700 900142",
        "guestCountry": "United Kingdom",
        "roomNumber": "501",
        "roomType": "The Bengaluru Penthouse",
        "roomId": "501",
        "checkIn": "2026-10-12",
        "checkOut": "2026-10-17",
        "nights": 5,
        "guests": 2,
        "baseRate": 85000,
        "taxes": 76500,
        "discount": 0,
        "totalAmount": 501500,
        "paymentStatus": "Paid",
        "bookingStatus": "Checked In",
        "paymentMethod": "Bank Wire",
        "specialRequests": "Chauffeur pickup from KIA Airport, sparkling water in cellar, allergen free linen.",
        "source": "Concierge Direct",
        "createdAt": "2026-09-28"
    },
    {
        "id": "NH-1026",
        "guestName": "Aditya Birla",
        "guestEmail": "aditya.b@techinfra.com",
        "guestPhone": "+91 99304 88120",
        "guestCountry": "India",
        "roomNumber": "102",
        "roomType": "Deluxe Courtyard",
        "roomId": "102",
        "checkIn": "2026-10-12",
        "checkOut": "2026-10-14",
        "nights": 2,
        "guests": 1,
        "baseRate": 18500,
        "taxes": 6660,
        "discount": 0,
        "totalAmount": 43660,
        "paymentStatus": "Paid",
        "bookingStatus": "Checked In",
        "paymentMethod": "UPI / GPay",
        "specialRequests": "Quiet courtyard view, early arrival luggage drop.",
        "source": "Website Direct",
        "createdAt": "2026-10-08"
    },
    {
        "id": "NH-1027",
        "guestName": "Samantha Wu",
        "guestEmail": "s.wu@singaporeglobal.sg",
        "guestPhone": "+65 8123 4567",
        "guestCountry": "Singapore",
        "roomNumber": "201",
        "roomType": "Premier Garden Room",
        "roomId": "201",
        "checkIn": "2026-10-13",
        "checkOut": "2026-10-16",
        "nights": 3,
        "guests": 2,
        "baseRate": 24000,
        "taxes": 12960,
        "discount": 3000,
        "totalAmount": 81960,
        "paymentStatus": "Pending",
        "bookingStatus": "Confirmed",
        "paymentMethod": "Visa Signature",
        "specialRequests": "Botanical spa session booking on arrival afternoon.",
        "source": "Website Direct",
        "createdAt": "2026-10-10"
    },
    {
        "id": "NH-1028",
        "guestName": "Vikram Sethi",
        "guestEmail": "vikram.sethi@heritage.in",
        "guestPhone": "+91 98110 33490",
        "guestCountry": "India",
        "roomNumber": "401",
        "roomType": "Terrace Garden Suite",
        "roomId": "401",
        "checkIn": "2026-10-14",
        "checkOut": "2026-10-18",
        "nights": 4,
        "guests": 2,
        "baseRate": 48000,
        "taxes": 34560,
        "discount": 0,
        "totalAmount": 226560,
        "paymentStatus": "Paid",
        "bookingStatus": "Confirmed",
        "paymentMethod": "Mastercard World",
        "specialRequests": "Private terrace dinner reservation on Oct 15.",
        "source": "Website Direct",
        "createdAt": "2026-10-09"
    }
]

def load_bookings() -> List[Dict[str, Any]]:
    if not os.path.exists(DATA_FILE):
        save_bookings(INITIAL_BOOKINGS)
        return list(INITIAL_BOOKINGS)
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return list(INITIAL_BOOKINGS)

def save_bookings(bookings: List[Dict[str, Any]]) -> None:
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(bookings, f, indent=2, ensure_ascii=False)

class BookingCreate(BaseModel):
    guestName: str = "Guest Patron"
    guestEmail: str = "guest@novahouse.example"
    guestPhone: str = "+91 98450 12345"
    guestCountry: str = "India"
    roomType: str = "Nova Suite"
    roomId: str = "301"
    roomNumber: Optional[str] = "301"
    checkIn: str = "2026-10-18"
    checkOut: str = "2026-10-21"
    nights: Optional[int] = 3
    guests: int = 2
    baseRate: Optional[float] = 38000
    taxes: Optional[float] = 6840
    discount: Optional[float] = 0
    totalAmount: Optional[float] = 44840
    paymentStatus: str = "Paid"
    bookingStatus: str = "Confirmed"
    paymentMethod: str = "Online Payment / Card"
    specialRequests: Optional[str] = "Direct booking from website"
    source: str = "Website Direct"

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "hotel": "NOVA HOUSE", "version": "1.0.0"}

@app.get("/api/v1/bookings")
def get_bookings():
    return load_bookings()

@app.get("/api/v1/bookings/{booking_id}")
def get_booking(booking_id: str):
    bookings = load_bookings()
    for b in bookings:
        if b.get("id") == booking_id:
            return b
    raise HTTPException(status_code=404, detail="Booking not found")

@app.post("/api/v1/bookings")
def create_booking(payload: BookingCreate):
    bookings = load_bookings()
    new_id = f"NH-{1029 + len(bookings)}"
    
    # Calculate nights if not provided
    try:
        d1 = datetime.strptime(payload.checkIn, "%Y-%m-%d")
        d2 = datetime.strptime(payload.checkOut, "%Y-%m-%d")
        calculated_nights = max(1, (d2 - d1).days)
    except Exception:
        calculated_nights = payload.nights or 1

    new_booking = {
        "id": new_id,
        "guestName": payload.guestName,
        "guestEmail": payload.guestEmail,
        "guestPhone": payload.guestPhone,
        "guestCountry": payload.guestCountry,
        "roomNumber": payload.roomNumber or "301",
        "roomType": payload.roomType,
        "roomId": payload.roomId,
        "checkIn": payload.checkIn,
        "checkOut": payload.checkOut,
        "nights": calculated_nights,
        "guests": payload.guests,
        "baseRate": payload.baseRate or 38000,
        "taxes": payload.taxes or 6840,
        "discount": payload.discount or 0,
        "totalAmount": payload.totalAmount or 44840,
        "paymentStatus": payload.paymentStatus,
        "bookingStatus": payload.bookingStatus,
        "paymentMethod": payload.paymentMethod,
        "specialRequests": payload.specialRequests or "Website direct booking",
        "source": "Website Direct",
        "createdAt": date.today().isoformat()
    }

    # Prepend newest booking to the top
    updated = [new_booking] + bookings
    save_bookings(updated)
    return new_booking

@app.patch("/api/v1/bookings/{booking_id}")
def update_booking(booking_id: str, updates: Dict[str, Any]):
    bookings = load_bookings()
    found = False
    for i, b in enumerate(bookings):
        if b.get("id") == booking_id:
            bookings[i].update(updates)
            found = True
            save_bookings(bookings)
            return bookings[i]
    if not found:
        raise HTTPException(status_code=404, detail="Booking not found")

@app.delete("/api/v1/bookings/{booking_id}")
def delete_booking(booking_id: str):
    bookings = load_bookings()
    filtered = [b for b in bookings if b.get("id") != booking_id]
    if len(filtered) == len(bookings):
        raise HTTPException(status_code=404, detail="Booking not found")
    save_bookings(filtered)
    return {"success": True, "deleted": booking_id}

@app.get("/api/v1/stats")
def get_stats():
    bookings = load_bookings()
    today = "2026-10-12"
    today_bookings = len([b for b in bookings if b.get("createdAt") == today or b.get("checkIn") == today])
    total_rev = sum([b.get("totalAmount", 0) for b in bookings if b.get("paymentStatus") == "Paid"])
    return {
        "totalBookings": len(bookings),
        "todayBookings": today_bookings,
        "totalRevenue": total_rev,
        "activeCount": len([b for b in bookings if b.get("bookingStatus") in ["Confirmed", "Checked In"]])
    }
