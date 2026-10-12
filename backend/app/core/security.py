import hmac
import hashlib
from typing import Optional
from .config import settings

def verify_razorpay_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """
    Cryptographically verify the Razorpay signature using the server-side secret key.
    Formula: HMAC_SHA256(order_id + "|" + payment_id, secret) == signature
    """
    if not order_id or not payment_id or not signature:
        return False
        
    generated_payload = f"{order_id}|{payment_id}".encode("utf-8")
    secret = settings.RAZORPAY_KEY_SECRET.encode("utf-8")
    
    expected_signature = hmac.new(
        secret,
        generated_payload,
        hashlib.sha256
    ).hexdigest()
    
    # Secure constant-time comparison
    return hmac.compare_digest(expected_signature, signature)

def verify_razorpay_webhook_signature(body: bytes, signature: str) -> bool:
    """
    Verify incoming webhook requests from Razorpay servers against RAZORPAY_WEBHOOK_SECRET.
    """
    if not signature or not settings.RAZORPAY_WEBHOOK_SECRET:
        return False
        
    secret = settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8")
    expected_signature = hmac.new(
        secret,
        body,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, signature)

def mask_secret(value: Optional[str]) -> str:
    """Mask credentials for display without leaking keys."""
    if not value:
        return ""
    if len(value) <= 8:
        return "****"
    return f"{value[:4]}****{value[-4:]}"
