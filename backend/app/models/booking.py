from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from sqlalchemy.orm import relationship
from ..core.database import Base

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(64), primary_key=True, index=True) # e.g. NH-1024
    booking_number = Column(String(64), nullable=True, index=True)
    guest_id = Column(String(64), nullable=True, index=True)
    
    guest_name = Column(String(128), nullable=False)
    guest_email = Column(String(128), nullable=False)
    guest_phone = Column(String(32), nullable=True)
    guest_country = Column(String(64), default="India")
    
    room_number = Column(String(32), nullable=False)
    room_type = Column(String(128), nullable=False)
    room_id = Column(String(64), nullable=False)
    
    check_in = Column(String(32), nullable=False)
    check_out = Column(String(32), nullable=False)
    nights = Column(Integer, default=1, nullable=False)
    guests = Column(Integer, default=2, nullable=False)
    
    base_rate = Column(Float, nullable=False)
    taxes = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    
    # Payment Status: UNPAID, PENDING, PAID, FAILED, REFUNDED
    payment_status = Column(String(32), default="UNPAID", index=True, nullable=False)
    
    # Booking Status: Confirmed, Checked In, Checked Out, Cancelled, Pending
    booking_status = Column(String(32), default="Pending", index=True, nullable=False)
    
    payment_method = Column(String(64), default="Online / Razorpay")
    payment_id = Column(String(64), nullable=True) # e.g. pay_xxxxxxxxx
    razorpay_order_id = Column(String(64), nullable=True) # e.g. order_xxxxxxxxx
    
    special_requests = Column(Text, nullable=True)
    source = Column(String(64), default="Website Direct")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def number_of_nights(self):
        return self.nights

    @property
    def room_amount(self):
        return self.base_rate * self.nights

    @property
    def tax_amount(self):
        return self.taxes

    @property
    def discount_amount(self):
        return self.discount

    # Relationships
    payments = relationship("Payment", back_populates="booking", cascade="all, delete-orphan")
