#!/usr/bin/env python3
"""
NOVA HOUSE · SQLite to Supabase PostgreSQL Migration Utility

Safely migrates all existing reservations, transactions, rooms, and guests
from the local SQLite database ('novahouse.db') to Supabase PostgreSQL.

Security:
- Does NOT delete or alter the existing SQLite database file.
- Masks database credentials in terminal output.
- Reads connection strings securely from environment variables.
"""

import os
import sys
import sqlite3
import re
from pathlib import Path
from datetime import datetime

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
backend_dir = root_dir / "backend"
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv

# Load environment
backend_env = backend_dir / ".env"
root_env = root_dir / ".env"
if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
if root_env.exists():
    load_dotenv(dotenv_path=root_env, override=False)
load_dotenv()

from sqlalchemy.orm import sessionmaker
from backend.app.core.database import engine as pg_engine, Base, DATABASE_URL, is_sqlite
from backend.app.models import Booking, Payment, Room, Guest
from backend.app.routes.bookings import ROOMS_LIST

def mask_connection_string(url) -> str:
    """Mask password in connection URI for secure logging."""
    url_str = str(url) if url else "[NOT SET]"
    return re.sub(r":([^:@/]+)@", r":****@", url_str)

def migrate():
    print("=" * 65)
    print("  NOVA HOUSE · Supabase PostgreSQL Migration")
    print("=" * 65)

    # 1. Source SQLite Database
    sqlite_path = root_dir / "novahouse.db"
    if not sqlite_path.exists():
        sqlite_path = backend_dir / "novahouse.db"

    if not sqlite_path.exists():
        print(f"❌ Error: SQLite source database not found at {sqlite_path}")
        sys.exit(1)

    print(f"📁 Source SQLite Database: {sqlite_path} (READ-ONLY)")

    # 2. Target PostgreSQL Database
    if is_sqlite:
        print("❌ Error: DATABASE_URL is not set to a PostgreSQL connection string.")
        print("   Please set DATABASE_URL in your backend/.env file, e.g.:")
        print("   DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres")
        sys.exit(1)

    masked_url = mask_connection_string(DATABASE_URL)
    print(f"🐘 Target PostgreSQL Database: {masked_url}")

    # 3. Connect to PostgreSQL
    print("\n[1/5] Testing PostgreSQL Connection...")
    try:
        with pg_engine.connect() as conn:
            print("  ✓ Successfully connected to Supabase PostgreSQL!")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)

    # 4. Initialize Tables
    print("\n[2/5] Creating Tables in PostgreSQL Schema...")
    try:
        Base.metadata.create_all(bind=pg_engine)
        print("  ✓ Tables created/verified: bookings, payments, rooms, guests")
    except Exception as e:
        print(f"❌ Table creation failed: {e}")
        sys.exit(1)

    PgSession = sessionmaker(bind=pg_engine)
    pg_db = PgSession()

    # 5. Connect to SQLite in Read-Only Mode
    print("\n[3/5] Reading Existing SQLite Records...")
    sqlite_conn = sqlite3.connect(f"file:{sqlite_path}?mode=ro", uri=True)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()

    # Read bookings
    sqlite_cur.execute("SELECT * FROM bookings")
    sqlite_bookings = sqlite_cur.fetchall()
    print(f"  • Found {len(sqlite_bookings)} bookings in SQLite")

    # Read payments
    sqlite_cur.execute("SELECT * FROM payments")
    sqlite_payments = sqlite_cur.fetchall()
    print(f"  • Found {len(sqlite_payments)} payments in SQLite")

    # 6. Migrate Bookings & Payments
    print("\n[4/5] Migrating Records to PostgreSQL...")
    migrated_bookings = 0
    migrated_payments = 0
    unique_guests = {}

    for row in sqlite_bookings:
        b_dict = dict(row)
        
        # Parse dates if stored as string
        for date_col in ["created_at", "updated_at"]:
            val = b_dict.get(date_col)
            if isinstance(val, str):
                try:
                    b_dict[date_col] = datetime.fromisoformat(val.replace("Z", "+00:00"))
                except Exception:
                    b_dict[date_col] = datetime.utcnow()

        # Track unique guest
        guest_email = b_dict.get("guest_email")
        gid = b_dict.get("guest_id") or f"gst_{len(unique_guests) + 101}"
        b_dict["guest_id"] = gid
        if guest_email and guest_email not in unique_guests:
            unique_guests[guest_email] = {
                "id": gid,
                "full_name": b_dict.get("guest_name", "Patron Guest"),
                "email": guest_email,
                "phone": b_dict.get("guest_phone"),
                "country": b_dict.get("guest_country", "India"),
                "vip_tier": "Member",
                "total_stays": 1,
                "notes": "Imported from guest reservation ledger"
            }
        elif guest_email and guest_email in unique_guests:
            unique_guests[guest_email]["total_stays"] += 1

        booking_obj = Booking(**b_dict)
        pg_db.merge(booking_obj)
        migrated_bookings += 1

    for row in sqlite_payments:
        p_dict = dict(row)
        for date_col in ["created_at", "updated_at"]:
            val = p_dict.get(date_col)
            if isinstance(val, str):
                try:
                    p_dict[date_col] = datetime.fromisoformat(val.replace("Z", "+00:00"))
                except Exception:
                    p_dict[date_col] = datetime.utcnow()

        payment_obj = Payment(**p_dict)
        pg_db.merge(payment_obj)
        migrated_payments += 1

    # 7. Migrate Rooms Catalog
    print("\n[5/5] Populating Sanctuary Room Inventory...")
    migrated_rooms = 0
    for r in ROOMS_LIST:
        room_obj = Room(
            id=str(r["id"]),
            room_number=str(r.get("roomNumber", r["id"])),
            title=r["name"],
            type_code=r.get("slug", "deluxe-room"),
            floor=int(str(r.get("floor", "1"))[0]) if str(r.get("floor", "1"))[0].isdigit() else 1,
            base_price=float(r.get("price", 18500)),
            max_guests=int(r.get("capacity", 2)),
            status=r.get("status", "Available"),
            is_active=True
        )
        pg_db.merge(room_obj)
        migrated_rooms += 1

    # Populate Guests
    migrated_guests = 0
    for g_data in unique_guests.values():
        guest_obj = Guest(**g_data)
        pg_db.merge(guest_obj)
        migrated_guests += 1

    # Commit transactions
    pg_db.commit()
    sqlite_conn.close()
    pg_db.close()

    print("\n" + "=" * 65)
    print("  ✅ MIGRATION COMPLETED SUCCESSFULLY")
    print("=" * 65)
    print(f"  • Bookings migrated: {migrated_bookings}")
    print(f"  • Payments migrated: {migrated_payments}")
    print(f"  • Sanctuary Rooms:   {migrated_rooms}")
    print(f"  • Guest Profiles:    {migrated_guests}")
    print(f"  • Original SQLite:   UNTOUCHED & PRESERVED")
    print("=" * 65)

if __name__ == "__main__":
    migrate()
