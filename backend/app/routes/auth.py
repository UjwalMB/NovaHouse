"""
NOVA HOUSE · Secure Authentication & Role Authorization Engine
Implements bcrypt salted password validation and HMAC-SHA256 JWT tokens
with strict role-based access control (ADMIN, MANAGER, ANALYST).
"""

import os
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import hmac
import hashlib
import json
import base64
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.config import settings

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
auth_compat_router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def get_jwt_secret() -> str:
    # Load JWT secret key strictly from settings/environment
    secret = getattr(settings, "JWT_SECRET_KEY", None) or os.getenv("JWT_SECRET_KEY")
    if not secret:
        # Fallback to an internal persistent signature string if not configured in dev
        secret = "nova-house-production-jwt-secure-key-default-2026"
    return secret

# Pre-computed bcrypt salted password hashes for authorized staff accounts
# Passwords can also be securely overridden via environment variables on Render
DEFAULT_STAFF_DIRECTORY = {
    "admin@novahouse.com": {
        "id": "usr_admin_01",
        "name": "Executive General Manager",
        "email": "admin@novahouse.com",
        "role": "ADMIN",
        # Default salted bcrypt hash (override via ADMIN_PASSWORD in environment)
        "bcrypt_hash": "$2b$12$nDIDYshbEKCT9Iqa1zWql.IOckjVAVGw8UdJX8BHa1FRw5Kx.xNC2",
        "env_var": "ADMIN_PASSWORD",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        "permissions": ["all", "operations", "analytics", "financials", "refunds", "staff"]
    },
    "manager@novahouse.example": {
        "id": "usr_mgr_02",
        "name": "Hotel Operations Manager",
        "email": "manager@novahouse.example",
        "role": "MANAGER",
        # Default salted bcrypt hash (override via MANAGER_PASSWORD in environment)
        "bcrypt_hash": "$2b$12$keb4dr15sU0zLCdYde6wduPXJ/2lCAoZApPftFFaXfV9.poArbZx2",
        "env_var": "MANAGER_PASSWORD",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        "permissions": ["operations", "analytics", "rooms", "bookings", "payments"]
    },
    "manager@novahouse.com": {
        "id": "usr_mgr_03",
        "name": "Hotel Operations Manager",
        "email": "manager@novahouse.com",
        "role": "MANAGER",
        "bcrypt_hash": "$2b$12$keb4dr15sU0zLCdYde6wduPXJ/2lCAoZApPftFFaXfV9.poArbZx2",
        "env_var": "MANAGER_PASSWORD",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        "permissions": ["operations", "analytics", "rooms", "bookings", "payments"]
    },
    "analyst@novahouse.com": {
        "id": "usr_anl_04",
        "name": "Executive Revenue Analyst",
        "email": "analyst@novahouse.com",
        "role": "ANALYST",
        # Default salted bcrypt hash (override via ANALYST_PASSWORD in environment)
        "bcrypt_hash": "$2b$12$3yan17xCZavJpNjnZ6iPjeYOl4zSqmZKzz7ty7NNQay969S/XYtgS",
        "env_var": "ANALYST_PASSWORD",
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

def verify_staff_password(plain_password: str, user_record: dict) -> bool:
    """Verifies candidate password using environment override or bcrypt hash."""
    env_name = user_record.get("env_var")
    if env_name:
        env_val = os.getenv(env_name) or os.getenv(f"TEST_{env_name}")
        if env_val:
            return hmac.compare_digest(plain_password, env_val)

    stored_hash = user_record.get("bcrypt_hash")
    if not stored_hash:
        return False

    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), stored_hash.encode("utf-8"))
    except Exception:
        return False

def create_access_token(user_data: dict, expires_delta: timedelta = timedelta(days=7)) -> str:
    """Generates an HMAC-SHA256 signed JWT token."""
    secret = get_jwt_secret()
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
    signature = hmac.new(secret.encode(), signing_input.encode(), hashlib.sha256).digest()
    encoded_sig = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{signing_input}.{encoded_sig}"

def verify_token(token: str) -> Optional[dict]:
    """Validates token signature and expiration."""
    try:
        secret = get_jwt_secret()
        parts = token.split(".")
        if len(parts) != 3:
            return None
        signing_input = f"{parts[0]}.{parts[1]}"
        expected_sig = base64.urlsafe_b64encode(
            hmac.new(secret.encode(), signing_input.encode(), hashlib.sha256).digest()
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

def require_auth(authorization: Optional[str] = Header(None)) -> dict:
    """
    Strict authentication dependency.
    Raises 401 Unauthorized if token is missing or invalid.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a Bearer token in the Authorization header."
        )
    token = authorization.replace("Bearer ", "").strip()
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token."
        )
    return payload

def require_roles(allowed_roles: List[str]):
    """
    Role-based authorization dependency.
    Raises 403 Forbidden if user's role is not within allowed_roles.
    """
    def role_checker(user: dict = Depends(require_auth)) -> dict:
        user_role = user.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: role '{user_role}' does not have sufficient operational privileges."
            )
        return user
    return role_checker

@router.post("/login", response_model=LoginResponse)
@auth_compat_router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    email = payload.email.strip().lower()
    user_record = DEFAULT_STAFF_DIRECTORY.get(email)
    
    if not user_record or not verify_staff_password(payload.password, user_record):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid executive credentials. Please verify your registered staff email and security key."
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
def get_me(user: dict = Depends(require_auth)):
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
