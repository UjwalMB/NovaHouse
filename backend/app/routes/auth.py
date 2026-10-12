"""
NOVA HOUSE · Shared Authentication API
Supports role-based authentication (ADMIN, MANAGER, ANALYST)
used by both nova-house-admin and nova-house-dashboard.
"""

from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import hmac
import hashlib
import json
import base64
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..core.database import get_db

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
# Also support /api/auth prefix for backwards compatibility
auth_compat_router = APIRouter(prefix="/api/auth", tags=["Authentication"])

SECRET_KEY = "nova-house-executive-jwt-secret-key-2026"

# Authorized staff directory
AUTHORIZED_USERS = {
    "admin@novahouse.com": {
        "id": "usr_admin_01",
        "name": "Executive General Manager",
        "email": "admin@novahouse.com",
        "role": "ADMIN",
        "password_hash": hashlib.sha256("Admin@Nova2026".encode()).hexdigest(),
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        "permissions": ["all", "operations", "analytics", "financials", "refunds", "staff"]
    },
    "manager@novahouse.example": {
        "id": "usr_mgr_02",
        "name": "Ujwal Bilagi (Hotel Manager)",
        "email": "manager@novahouse.example",
        "role": "MANAGER",
        "password_hash": hashlib.sha256("Admin@Nova2026".encode()).hexdigest(),
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        "permissions": ["operations", "analytics", "rooms", "bookings", "payments"]
    },
    "manager@novahouse.com": {
        "id": "usr_mgr_03",
        "name": "Operations Manager",
        "email": "manager@novahouse.com",
        "role": "MANAGER",
        "password_hash": hashlib.sha256("Admin@Nova2026".encode()).hexdigest(),
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        "permissions": ["operations", "analytics", "rooms", "bookings", "payments"]
    },
    "analyst@novahouse.com": {
        "id": "usr_anl_04",
        "name": "Revenue Analyst",
        "email": "analyst@novahouse.com",
        "role": "ANALYST",
        "password_hash": hashlib.sha256("Admin@Nova2026".encode()).hexdigest(),
        "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
        "permissions": ["analytics", "reporting", "forecasts"]
    }
}

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    token: str
    user: Dict[str, Any]

def create_access_token(user_data: dict, expires_delta: timedelta = timedelta(days=7)) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user_data["id"],
        "email": user_data["email"],
        "role": user_data["role"],
        "name": user_data["name"],
        "exp": int((datetime.utcnow() + expires_delta).timestamp())
    }
    encoded_header = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    encoded_payload = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    signing_input = f"{encoded_header}.{encoded_payload}"
    signature = hmac.new(SECRET_KEY.encode(), signing_input.encode(), hashlib.sha256).digest()
    encoded_sig = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{signing_input}.{encoded_sig}"

def verify_token(token: str) -> Optional[dict]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        signing_input = f"{parts[0]}.{parts[1]}"
        expected_sig = base64.urlsafe_b64encode(
            hmac.new(SECRET_KEY.encode(), signing_input.encode(), hashlib.sha256).digest()
        ).decode().rstrip("=")
        if not hmac.compare_digest(parts[2], expected_sig):
            return None
        payload_bytes = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_bytes).decode())
        if payload.get("exp", 0) < datetime.utcnow().timestamp():
            return None
        return payload
    except Exception:
        return None

def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization:
        # Default fallback for demo / existing session if token omitted
        return {
            "id": "usr_mgr_02",
            "name": "Hotel Manager",
            "email": "manager@novahouse.example",
            "role": "MANAGER",
            "permissions": ["all"]
        }
    token = authorization.replace("Bearer ", "").strip()
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session token")
    return payload

@router.post("/login", response_model=LoginResponse)
@auth_compat_router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    email = payload.email.strip().lower()
    user_record = AUTHORIZED_USERS.get(email)
    
    # Check default password or hash
    req_hash = hashlib.sha256(payload.password.encode()).hexdigest()
    if not user_record or (user_record["password_hash"] != req_hash and payload.password != "Admin@Nova2026"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid executive credentials. Use registered staff email and security key."
        )

    user_info = {
        "id": user_record["id"],
        "name": user_record["name"],
        "email": user_record["email"],
        "role": user_record["role"],
        "avatar": user_record["avatar"],
        "permissions": user_record["permissions"]
    }
    token = create_access_token(user_info)
    return {"success": True, "token": token, "user": user_info}

@router.get("/me")
@auth_compat_router.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    return {"authenticated": True, "user": user}

@router.post("/verify")
@auth_compat_router.post("/verify")
def verify_session(token_data: dict):
    token = token_data.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token required")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return {"valid": True, "user": payload}
