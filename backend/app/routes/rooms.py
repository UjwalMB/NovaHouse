"""
NOVA HOUSE · Rooms Catalog & Inventory Management API
Manages architectural sanctuaries, categories, base rates, and occupancy status.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from .auth import require_roles

router = APIRouter(prefix="/api/v1/rooms", tags=["Rooms"])
rooms_compat_router = APIRouter(prefix="/api/rooms", tags=["Rooms"])

# Authoritative In-Memory Room Inventory & Defaults
ROOMS_LIST = [
    {
        "id": "101",
        "slug": "courtyard-room",
        "name": "Courtyard Verandah 101",
        "type": "Courtyard Room",
        "category": "Rooms",
        "floor": "1st Floor",
        "roomNumber": "101",
        "capacity": 2,
        "bedType": "King Bed",
        "size": "38 m²",
        "price": 16500,
        "status": "Available"
    },
    {
        "id": "102",
        "slug": "deluxe-room",
        "name": "Deluxe Courtyard 102",
        "type": "Deluxe Room",
        "category": "Rooms",
        "floor": "1st Floor",
        "roomNumber": "102",
        "capacity": 2,
        "bedType": "King Bed",
        "size": "42 m²",
        "price": 18500,
        "status": "Occupied"
    },
    {
        "id": "201",
        "slug": "premier-room",
        "name": "Premier Garden 201",
        "type": "Premier Room",
        "category": "Rooms",
        "floor": "2nd Floor",
        "roomNumber": "201",
        "capacity": 2,
        "bedType": "King Bed",
        "size": "56 m²",
        "price": 24000,
        "status": "Available"
    },
    {
        "id": "301",
        "slug": "nova-suite",
        "name": "Nova Suite 301",
        "type": "Suite",
        "category": "Suites",
        "floor": "3rd Floor",
        "roomNumber": "301",
        "capacity": 3,
        "bedType": "King Bed",
        "size": "85 m²",
        "price": 38000,
        "status": "Available"
    },
    {
        "id": "401",
        "slug": "terrace-suite",
        "name": "Terrace Garden Suite 401",
        "type": "Suite",
        "category": "Suites",
        "floor": "4th Floor",
        "roomNumber": "401",
        "capacity": 3,
        "bedType": "King Bed",
        "size": "110 m²",
        "price": 48000,
        "status": "Available"
    },
    {
        "id": "501",
        "slug": "penthouse",
        "name": "The Bengaluru Penthouse 501",
        "type": "Penthouse",
        "category": "Signature",
        "floor": "5th Floor",
        "roomNumber": "501",
        "capacity": 4,
        "bedType": "Presidential King",
        "size": "195 m²",
        "price": 85000,
        "status": "Occupied"
    }
]

# Public room browsing endpoints (Public Website + Admin)
@router.get("")
@rooms_compat_router.get("")
def get_rooms():
    return ROOMS_LIST

@router.get("/{room_id}")
@rooms_compat_router.get("/{room_id}")
def get_room(room_id: str):
    r = next((
        rm for rm in ROOMS_LIST 
        if rm["id"] == room_id or rm.get("slug") == room_id or rm.get("roomNumber") == room_id
    ), None)
    if not r:
        raise HTTPException(status_code=404, detail=f"Room '{room_id}' not found")
    return r

# Operational updates (Require ADMIN or MANAGER role)
@router.patch("/{room_id}")
@router.put("/{room_id}")
@rooms_compat_router.patch("/{room_id}")
@rooms_compat_router.put("/{room_id}")
def update_room(
    room_id: str,
    updates: Dict[str, Any],
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    r = next((
        rm for rm in ROOMS_LIST 
        if rm["id"] == room_id or rm.get("slug") == room_id or rm.get("roomNumber") == room_id
    ), None)
    if not r:
        raise HTTPException(status_code=404, detail=f"Room '{room_id}' not found")
        
    for k, v in updates.items():
        if k in r:
            r[k] = v
        elif k == "basePrice" or k == "price":
            r["price"] = float(v)
        elif k == "roomNumber":
            r["roomNumber"] = str(v)
            
    # Also update database Room table if model exists
    from ..models.room import Room as RoomModel
    db_room = db.query(RoomModel).filter((RoomModel.id == room_id) | (RoomModel.room_number == room_id)).first()
    if db_room:
        if "status" in updates:
            db_room.status = updates["status"]
        if "price" in updates or "basePrice" in updates:
            db_room.base_price = float(updates.get("price") or updates.get("basePrice"))
        if "name" in updates or "title" in updates:
            db_room.title = updates.get("name") or updates.get("title")
        db.commit()
        
    return r

@router.post("")
@rooms_compat_router.post("")
def create_room(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles(["ADMIN", "MANAGER"]))
):
    new_id = str(payload.get("id") or (len(ROOMS_LIST) + 101))
    room_entry = {
        "id": new_id,
        "slug": payload.get("slug", f"room-{new_id}"),
        "name": payload.get("name") or payload.get("title", f"Sanctuary {new_id}"),
        "type": payload.get("type", "Deluxe Room"),
        "category": payload.get("category", "Rooms"),
        "floor": payload.get("floor", "1st Floor"),
        "roomNumber": str(payload.get("roomNumber", new_id)),
        "capacity": int(payload.get("capacity", 2)),
        "bedType": payload.get("bedType", "King Bed"),
        "size": payload.get("size", "45 m²"),
        "price": float(payload.get("price") or payload.get("basePrice", 18500)),
        "status": payload.get("status", "Available")
    }
    ROOMS_LIST.append(room_entry)
    return room_entry
