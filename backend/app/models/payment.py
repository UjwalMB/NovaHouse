from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(64), primary_key=True, index=True) # e.g. pay_rec_1024 or pay_xxxxxxxx
    booking_id = Column(String(64), ForeignKey("bookings.id"), index=True, nullable=False)
    
    razorpay_order_id = Column(String(64), index=True, nullable=False)
    razorpay_payment_id = Column(String(64), index=True, nullable=True)
    razorpay_signature = Column(String(256), nullable=True)
    
    amount = Column(Float, nullable=False) # INR rupees
    amount_paise = Column(Integer, nullable=False) # INR paise
    currency = Column(String(8), default="INR", nullable=False)
    
    # Statuses: CREATED, PENDING, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED
    status = Column(String(32), default="CREATED", index=True, nullable=False)
    
    # Method: UPI, Card, Netbanking, Wallet
    method = Column(String(32), default="Card / UPI", nullable=True)
    
    email = Column(String(128), nullable=True)
    contact = Column(String(32), nullable=True)
    
    refund_id = Column(String(64), nullable=True)
    refund_amount = Column(Float, default=0.0)
    
    error_code = Column(String(64), nullable=True)
    error_description = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to booking
    booking = relationship("Booking", back_populates="payments")
