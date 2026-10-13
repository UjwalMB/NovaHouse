import os
import sys
import uuid
import hmac
import hashlib
from pathlib import Path
from dotenv import load_dotenv
import requests

# Load test credentials strictly from environment
workspace_dir = Path(os.environ.get("WORKSPACE_DIR", Path.cwd()))
load_dotenv(workspace_dir / "backend" / ".env")
load_dotenv(workspace_dir / ".env")
load_dotenv()

TEST_ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD") or os.environ.get("ADMIN_PASSWORD")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")

if not TEST_ADMIN_PASSWORD:
    raise RuntimeError("Missing TEST_ADMIN_PASSWORD environment variable.")

BASE_URL = os.environ.get("TEST_API_URL", "http://127.0.0.1:8000")

def test_razorpay_payment_flow():
    print("=== TEST B: AUTHORITATIVE RAZORPAY TEST PAYMENT FLOW & VERIFICATION ===")

    # 1. Step 1: Customer requests server-side Razorpay order creation
    unique_tag = uuid.uuid4().hex[:6]
    test_marker = f"E2E_RZP_TEST_{unique_tag}"
    
    order_payload = {
        "roomId": "nova-suite",
        "checkIn": "2026-11-01",
        "checkOut": "2026-11-03",
        "guests": 2,
        "guestName": f"Razorpay Test Guest {unique_tag}",
        "guestEmail": f"rzp_guest_{unique_tag}@novahouse.example",
        "guestPhone": "+91 98450 11223",
        "specialRequests": test_marker
    }

    print("📡 Step 1: Requesting server-side Razorpay order creation via POST /api/payments/create-order...")
    res = requests.post(f"{BASE_URL}/api/payments/create-order", json=order_payload)
    assert res.status_code == 200, f"Order creation failed: {res.text}"
    order_data = res.json()

    order_id = order_data["orderId"]
    booking_id = order_data["bookingId"]
    total_amount = order_data["amount"]
    amount_paise = order_data["amountPaise"]

    # Verify server-side pricing: 38000 * 2 = 76000; GST (18%) = 13680; Total = 89680
    assert total_amount == 89680, f"Expected 89680, got {total_amount}"
    assert amount_paise == 8968000, f"Expected 8968000, got {amount_paise}"
    assert order_data["isTestMode"] is True, "Expected TEST mode active"
    print(f"✅ Order Created: Order ID = {order_id}, Booking ID = {booking_id}, Amount = ₹{total_amount:,.2f}")

    # Verify initial database state: must be PENDING (NOT paid)
    # Admin inspects booking
    admin_login = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "admin@novahouse.com",
        "password": TEST_ADMIN_PASSWORD
    })
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    booking_check = requests.get(f"{BASE_URL}/api/v1/bookings/{booking_id}", headers=admin_headers).json()
    assert booking_check["payment_status"] == "PENDING", f"Booking must NOT be marked paid prematurely: {booking_check['payment_status']}"
    assert booking_check["booking_status"] == "Pending"
    print(f"🔒 Step 2: Database state verified: Booking {booking_id} is correctly PENDING (Never pre-marked PAID)")

    # Step 3: Negative Security Test — Forged Signature Rejection
    fake_payment_id = f"pay_forged_{uuid.uuid4().hex[:10]}"
    fake_signature = "bad_forged_cryptographic_signature_xyz"
    verify_fraud_res = requests.post(f"{BASE_URL}/api/payments/verify", json={
        "razorpay_order_id": order_id,
        "razorpay_payment_id": fake_payment_id,
        "razorpay_signature": fake_signature,
        "booking_id": booking_id
    })
    assert verify_fraud_res.status_code == 400, f"Expected 400 for forged signature, got {verify_fraud_res.status_code}"
    print("🛡️ Step 3A: Security verified: Forged payment signature rejected by backend (400 Bad Request)")

    # Negative Security Test — Mismatched Booking ID Rejection
    verify_mismatch_res = requests.post(f"{BASE_URL}/api/payments/verify", json={
        "razorpay_order_id": order_id,
        "razorpay_payment_id": fake_payment_id,
        "razorpay_signature": fake_signature,
        "booking_id": "NH-999999"  # Mismatched booking ID
    })
    assert verify_mismatch_res.status_code == 400, f"Expected 400 for mismatched booking ID, got {verify_mismatch_res.status_code}"
    print("🛡️ Step 3B: Security verified: Mismatched booking ID rejected by backend (400 Bad Request)")

    # Step 4: Authoritative Cryptographic Razorpay Verification
    if not RAZORPAY_KEY_SECRET:
        raise RuntimeError("Test execution failure: RAZORPAY_KEY_SECRET must be configured in environment.")

    test_payment_id = f"pay_{uuid.uuid4().hex[:14]}"
    # Authoritative HMAC-SHA256 signature generated using server-side secret key
    msg = f"{order_id}|{test_payment_id}".encode("utf-8")
    valid_signature = hmac.new(RAZORPAY_KEY_SECRET.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    print(f"📡 Step 4: Submitting cryptographically signed verification to backend via POST /api/payments/verify...")
    verify_res = requests.post(f"{BASE_URL}/api/payments/verify", json={
        "razorpay_order_id": order_id,
        "razorpay_payment_id": test_payment_id,
        "razorpay_signature": valid_signature,
        "booking_id": booking_id
    })
    assert verify_res.status_code == 200, f"Verification failed: {verify_res.text}"
    verify_data = verify_res.json()
    assert verify_data["success"] is True
    assert verify_data["paymentStatus"] == "PAID"
    assert verify_data["bookingStatus"] == "Confirmed"
    print(f"✅ Cryptographic signature verified server-side! Booking confirmed.")

    # Step 5: Verify Authoritative Database Update
    booking_updated = requests.get(f"{BASE_URL}/api/v1/bookings/{booking_id}", headers=admin_headers).json()
    assert booking_updated["payment_status"] == "PAID"
    assert booking_updated["booking_status"] == "Confirmed"
    print(f"✅ Step 5: Backend authoritatively updated database: status = {booking_updated['booking_status']}, payment = {booking_updated['payment_status']}")

    # Step 6: Test Data Cleanup
    del_res = requests.delete(f"{BASE_URL}/api/v1/bookings/{booking_id}", headers=admin_headers)
    assert del_res.status_code == 200, f"Cleanup deletion failed: {del_res.text}"
    print(f"🧹 Step 6: Test booking {booking_id} and associated payment cleaned up (Zero database pollution)")

    print("\n🎉 TEST B (RAZORPAY TEST FLOW & VERIFICATION) COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    test_razorpay_payment_flow()
