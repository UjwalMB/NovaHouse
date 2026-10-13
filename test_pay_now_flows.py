import os
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_pay_now_website_and_admin():
    print("=== TESTING PAY NOW ACTIONS (WEBSITE & ADMIN DASHBOARD) ===")

    # Test 1: Website Checkout Flow with Authoritative Test Signature
    print("\n1. Testing Website Checkout Flow ('Pay Now' -> 'Authorize & Pay')...")
    order_payload = {
        "roomId": "nova-suite",
        "checkIn": "2026-11-01",
        "checkOut": "2026-11-03",
        "guestName": "Test Pay Now Guest",
        "guestEmail": "testpay@example.com",
        "guestPhone": "+91 99999 88888",
        "guests": 2
    }
    create_res = requests.post(f"{BASE_URL}/api/payments/create-order", json=order_payload)
    assert create_res.status_code == 200, f"Failed create-order: {create_res.text}"
    order_data = create_res.json()
    b_id = order_data["bookingId"]
    ord_id = order_data["orderId"]
    print(f"   ✅ Created order {ord_id} for booking {b_id} (Amount: ₹{order_data['amount']})")

    # Authorize test signature from backend
    auth_res = requests.post(f"{BASE_URL}/api/payments/test-authorize", json={
        "booking_id": b_id,
        "razorpay_order_id": ord_id
    })
    assert auth_res.status_code == 200, f"Failed test-authorize: {auth_res.text}"
    auth_data = auth_res.json()
    assert "razorpay_signature" in auth_data
    print(f"   ✅ Server generated cryptographic test signature for payment {auth_data['razorpay_payment_id']}")

    # Submit verification
    verify_res = requests.post(f"{BASE_URL}/api/payments/verify", json=auth_data)
    assert verify_res.status_code == 200, f"Failed verify: {verify_res.text}"
    verify_data = verify_res.json()
    assert verify_data["paymentStatus"] == "PAID"
    assert verify_data["bookingStatus"] == "Confirmed"
    print(f"   ✅ Payment verified with HMAC-SHA256 signature! Status = PAID, Booking = Confirmed")

    # Cleanup test 1
    requests.delete(f"{BASE_URL}/api/bookings/{b_id}")
    print("   🧹 Test 1 booking cleaned up")

    # Test 2: Admin Dashboard 'Pay Now / Settle' Endpoint
    print("\n2. Testing Admin Dashboard 'Pay Now / Settle' Action...")
    admin_booking_payload = {
        "guestName": "Desk Walkin Guest",
        "guestEmail": "walkin@example.com",
        "guestPhone": "+91 91234 56789",
        "roomId": "nova-suite",
        "roomType": "The Nova Suite",
        "roomNumber": "101",
        "checkIn": "2026-11-10",
        "checkOut": "2026-11-12",
        "nights": 2,
        "guests": 2,
        "baseRate": 28000,
        "taxes": 10080,
        "totalAmount": 66080,
        "bookingStatus": "Pending",
        "paymentStatus": "Pending",
        "source": "Front Desk Direct"
    }
    b_res = requests.post(f"{BASE_URL}/api/bookings", json=admin_booking_payload)
    assert b_res.status_code == 200, f"Failed to create admin booking: {b_res.text}"
    created_b = b_res.json()
    admin_b_id = created_b["id"]
    print(f"   ✅ Created pending reservation {admin_b_id} (Status: {created_b['bookingStatus']}, Payment: {created_b['paymentStatus']})")

    # Staff clicks 'Pay Now'
    settle_res = requests.post(f"{BASE_URL}/api/payments/settle", json={
        "booking_id": admin_b_id,
        "method": "POS Card Terminal"
    })
    assert settle_res.status_code == 200, f"Failed settle: {settle_res.text}"
    settle_data = settle_res.json()
    assert settle_data["paymentStatus"] == "PAID"
    print(f"   ✅ Settle / Pay Now succeeded: Payment marked as PAID, Payment ID: {settle_data['paymentId']}")

    # Authenticate as admin to verify protected booking endpoint
    admin_pw = os.environ.get("ADMIN_PASSWORD", "NovaAdmin#Executive2026")
    login_res = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "admin@novahouse.com",
        "password": admin_pw
    })
    admin_token = login_res.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Verify booking in database
    get_res = requests.get(f"{BASE_URL}/api/bookings/{admin_b_id}", headers=admin_headers)
    assert get_res.status_code == 200, f"Failed get booking: {get_res.text}"
    b_detail = get_res.json()
    assert b_detail["paymentStatus"] == "PAID"
    assert b_detail["bookingStatus"] == "Confirmed"
    print(f"   ✅ Database state verified: paymentStatus = {b_detail['paymentStatus']}, bookingStatus = {b_detail['bookingStatus']}")

    # Cleanup test 2
    requests.delete(f"{BASE_URL}/api/bookings/{admin_b_id}", headers=admin_headers)
    print("   🧹 Test 2 booking cleaned up")

    print("\n🎉 ALL PAY NOW ENDPOINTS & WORKFLOWS VERIFIED 100% OPERATIONAL!")

if __name__ == "__main__":
    test_pay_now_website_and_admin()
