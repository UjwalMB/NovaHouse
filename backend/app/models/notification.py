from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base

class BookingNotification(Base):
    """
    Authoritative ledger for automated guest booking confirmation notifications.
    Tracks both EMAIL and SMS dispatch with provider message IDs, timestamps,
    error messages, and strict idempotency protection against duplicate sending.
    """
    __tablename__ = "booking_notifications"

    id = Column(String(64), primary_key=True, index=True) # e.g. ntf_email_NH-1024 or uuid
    booking_id = Column(String(64), ForeignKey("bookings.id", ondelete="CASCADE"), index=True, nullable=False)
    
    # Notification Type: 'EMAIL' or 'SMS'
    notification_type = Column(String(16), index=True, nullable=False)
    
    # Recipient: email address (for EMAIL) or phone number (for SMS)
    recipient = Column(String(128), nullable=False)
    
    # Status: 'SENT', 'FAILED', 'PENDING'
    status = Column(String(32), default="PENDING", index=True, nullable=False)
    
    sent_at = Column(DateTime, nullable=True)
    provider_message_id = Column(String(128), nullable=True)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship to booking
    booking = relationship("Booking", back_populates="notifications")
