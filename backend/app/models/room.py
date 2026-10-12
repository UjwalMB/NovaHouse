from ..core.database import Base
from sqlalchemy import Column, String, Integer, Float, Boolean

class Room(Base):
    __tablename__ = "rooms"

    id = Column(String(32), primary_key=True) # e.g. 101, 301
    room_number = Column(String(32), unique=True, nullable=False)
    title = Column(String(128), nullable=False)
    type_code = Column(String(64), nullable=False) # nova-suite, deluxe-room
    floor = Column(Integer, default=1)
    base_price = Column(Float, nullable=False)
    max_guests = Column(Integer, default=2)
    status = Column(String(32), default="Available") # Available, Occupied, Maintenance, Blocked
    is_active = Column(Boolean, default=True)
