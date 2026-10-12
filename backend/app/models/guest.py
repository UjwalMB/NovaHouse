from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text
from ..core.database import Base

class Guest(Base):
    __tablename__ = "guests"

    id = Column(String(32), primary_key=True)
    full_name = Column(String(128), nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    phone = Column(String(32), nullable=True)
    country = Column(String(64), default="India")
    vip_tier = Column(String(32), default="Member") # Member, Silver, Gold, Platinum
    total_stays = Column(Integer, default=1)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
