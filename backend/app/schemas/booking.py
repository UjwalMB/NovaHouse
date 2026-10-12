from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class BookingCreateSchema(BaseModel):
    guestName: str = Field(..., description="Guest name")
    guestEmail: str = Field(..., description="Guest email")
    guestPhone: Optional[str] = None
    guestCountry: Optional[str] = "India"
    roomId: str = "nova-suite"
    roomType: Optional[str] = "Nova Suite"
    roomNumber: Optional[str] = "301"
    checkIn: str
    checkOut: str
    nights: Optional[int] = 1
    guests: int = 2
    baseRate: Optional[float] = 38000
    taxes: Optional[float] = 6840
    discount: Optional[float] = 0.0
    totalAmount: Optional[float] = 44840
    paymentStatus: str = "PENDING"
    bookingStatus: str = "Pending"
    paymentMethod: Optional[str] = "Razorpay"
    specialRequests: Optional[str] = ""
    source: Optional[str] = "Website Direct"

class BookingOutSchema(BaseModel):
    id: str
    guestName: str
    guestEmail: str
    guestPhone: Optional[str] = None
    guestCountry: Optional[str] = "India"
    roomId: str
    roomType: str
    roomNumber: str
    checkIn: str
    checkOut: str
    nights: int
    guests: int
    baseRate: float
    taxes: float
    discount: float
    totalAmount: float
    paymentStatus: str
    bookingStatus: str
    paymentMethod: Optional[str] = None
    paymentId: Optional[str] = None
    razorpayOrderId: Optional[str] = None
    specialRequests: Optional[str] = None
    source: str
    createdAt: str

    class Config:
        from_attributes = True
