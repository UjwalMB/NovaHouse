from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class CreateOrderRequest(BaseModel):
    roomId: str = Field(..., description="Room identifier e.g. nova-suite")
    checkIn: str = Field(..., description="Check-in date YYYY-MM-DD")
    checkOut: str = Field(..., description="Check-out date YYYY-MM-DD")
    guestName: str = Field(..., description="Full name of guest")
    guestEmail: str = Field(..., description="Email address for confirmations")
    guestPhone: Optional[str] = Field(None, description="Contact phone or WhatsApp")
    guestCountry: Optional[str] = Field("India", description="Guest country")
    guests: int = Field(2, ge=1, le=10, description="Total guests")
    specialRequests: Optional[str] = Field("", description="Guest preferences")

class CreateOrderResponse(BaseModel):
    orderId: str
    amount: float
    amountPaise: int
    currency: str
    keyId: str
    bookingId: str
    roomTitle: str
    nights: int
    taxes: float
    discount: float
    isTestMode: bool
    breakdown: Dict[str, Any]

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    booking_id: str

class VerifyPaymentResponse(BaseModel):
    success: bool
    bookingId: str
    paymentId: str
    paymentStatus: str
    bookingStatus: str
    message: str
    booking: Optional[Dict[str, Any]] = None

class RefundRequest(BaseModel):
    payment_id: str
    amount: Optional[float] = None # None for full refund
    reason: Optional[str] = "Guest reservation cancelled by management"

class RefundResponse(BaseModel):
    success: bool
    refundId: str
    amount: float
    status: str
    message: str

class PaymentOut(BaseModel):
    id: str
    booking_id: str
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    amount: float
    currency: str
    status: str
    method: Optional[str] = "Card / UPI"
    email: Optional[str] = None
    contact: Optional[str] = None
    refund_id: Optional[str] = None
    refund_amount: Optional[float] = 0.0
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
