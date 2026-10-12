#!/usr/bin/env python3
"""
NOVA HOUSE · Supabase PostgreSQL Connection & Health Check

Tests the database connection, verifies table creation,
and checks row counts without printing passwords.
"""

import os
import sys
import re
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent.parent
backend_dir = root_dir / "backend"
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv

backend_env = backend_dir / ".env"
root_env = root_dir / ".env"
if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
if root_env.exists():
    load_dotenv(dotenv_path=root_env, override=False)
load_dotenv()

from sqlalchemy import text
from backend.app.core.database import engine, Base, DATABASE_URL, is_sqlite
from backend.app.models import Booking, Payment, Room, Guest

def mask_connection_string(url) -> str:
    url_str = str(url) if url else "[NOT SET]"
    return re.sub(r":([^:@/]+)@", r":****@", url_str)

def test_connection():
    masked = mask_connection_string(DATABASE_URL)
    print(f"Target Database: {masked}")

    try:
        with engine.connect() as conn:
            if is_sqlite:
                ver = conn.execute(text("SELECT sqlite_version();")).scalar()
                print(f"✓ Connected to SQLite (v{ver})")
            else:
                db_name, db_user = conn.execute(text("SELECT current_database(), current_user;")).fetchone()
                pg_ver = conn.execute(text("SHOW server_version;")).scalar()
                print(f"✓ Connected to Supabase PostgreSQL (v{pg_ver})")
                print(f"  • Database: {db_name}")
                print(f"  • User:     {db_user}")

            # Check tables
            tables = engine.dialect.get_table_names(conn)
            print(f"✓ Detected Tables in Schema: {tables}")
            for t in ["bookings", "payments", "rooms", "guests"]:
                if t in tables:
                    count = conn.execute(text(f"SELECT COUNT(*) FROM {t};")).scalar()
                    print(f"  • {t}: {count} records")

    except Exception as e:
        print(f"❌ Connection check failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_connection()
