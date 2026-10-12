import os
from typing import List, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend or root directory
backend_env = Path(__file__).resolve().parent.parent.parent / ".env"
root_env = Path(__file__).resolve().parent.parent.parent.parent / ".env"

if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
if root_env.exists():
    load_dotenv(dotenv_path=root_env, override=False)
load_dotenv()

class Settings:
    PROJECT_NAME: str = "NOVA HOUSE Hotel Management & Payment Gateway"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Razorpay Credentials (TEST / LIVE)
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_novahouse2026")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "rzp_sec_novahouse_test_secret_2026")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "rzp_whsec_novahouse_test_2026")
    RAZORPAY_MODE: str = os.getenv("RAZORPAY_MODE", "TEST").upper()
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./novahouse.db")
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:5173,http://localhost:5174",
        ).split(",")
        if origin.strip()
    ]
    
    # Authoritative Room Catalog for Server-Side Price Verification
    ROOM_PRICING: Dict[str, Dict[str, Any]] = {
        "nova-suite": {
            "title": "Nova Suite",
            "number": "301",
            "basePrice": 38000,
            "maxGuests": 3,
        },
        "deluxe-room": {
            "title": "Deluxe Courtyard",
            "number": "102",
            "basePrice": 18500,
            "maxGuests": 2,
        },
        "premier-room": {
            "title": "Premier Garden Room",
            "number": "201",
            "basePrice": 24000,
            "maxGuests": 2,
        },
        "penthouse": {
            "title": "The Bengaluru Penthouse",
            "number": "501",
            "basePrice": 85000,
            "maxGuests": 4,
        },
        "terrace-suite": {
            "title": "Terrace Garden Suite",
            "number": "401",
            "basePrice": 48000,
            "maxGuests": 3,
        },
        "courtyard-room": {
            "title": "Courtyard Verandah",
            "number": "101",
            "basePrice": 16500,
            "maxGuests": 2,
        },
        "spa-suite": {
            "title": "Ayurvedic Spa Sanctuary",
            "number": "302",
            "basePrice": 32000,
            "maxGuests": 2,
        },
        "glasshouse-suite": {
            "title": "The Botanical Glasshouse",
            "number": "402",
            "basePrice": 55000,
            "maxGuests": 4,
        },
        "residence": {
            "title": "Private Residence Suite",
            "number": "502",
            "basePrice": 42000,
            "maxGuests": 4,
        },
        "101": {
            "title": "Deluxe Courtyard 101",
            "number": "101",
            "basePrice": 18500,
            "maxGuests": 2,
        },
        "102": {
            "title": "Deluxe Courtyard 102",
            "number": "102",
            "basePrice": 18500,
            "maxGuests": 2,
        },
        "201": {
            "title": "Premier Garden 201",
            "number": "201",
            "basePrice": 24000,
            "maxGuests": 2,
        },
        "301": {
            "title": "Nova Suite 301",
            "number": "301",
            "basePrice": 38000,
            "maxGuests": 3,
        },
        "401": {
            "title": "Terrace Garden Suite 401",
            "number": "401",
            "basePrice": 48000,
            "maxGuests": 3,
        },
        "501": {
            "title": "The Bengaluru Penthouse 501",
            "number": "501",
            "basePrice": 85000,
            "maxGuests": 4,
        },
    }

    TAX_RATE: float = 0.18 # 18% GST for luxury hotel tariffs

settings = Settings()
