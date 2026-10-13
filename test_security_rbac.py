import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import requests

# Load test credentials strictly from environment / .env file
workspace_dir = Path(os.environ.get("WORKSPACE_DIR", Path.cwd()))
load_dotenv(workspace_dir / "backend" / ".env")
load_dotenv(workspace_dir / ".env")
load_dotenv()

TEST_ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD") or os.environ.get("ADMIN_PASSWORD")
TEST_MANAGER_PASSWORD = os.environ.get("TEST_MANAGER_PASSWORD") or os.environ.get("MANAGER_PASSWORD")
TEST_ANALYST_PASSWORD = os.environ.get("TEST_ANALYST_PASSWORD") or os.environ.get("ANALYST_PASSWORD")

if not (TEST_ADMIN_PASSWORD and TEST_MANAGER_PASSWORD and TEST_ANALYST_PASSWORD):
    raise RuntimeError(
        "Required test credential environment variables are missing: "
        "TEST_ADMIN_PASSWORD, TEST_MANAGER_PASSWORD, and TEST_ANALYST_PASSWORD must be defined."
    )

BASE_URL = os.environ.get("TEST_API_URL", "http://127.0.0.1:8000")

def run_tests():
    print("=== STARTING NOVA HOUSE SECURITY & RBAC SUITE ===")

    # 1. Health check
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    print("✅ Health check passed:", res.json()["status"])

    # 2. Invalid password rejection test
    res = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "admin@novahouse.com",
        "password": "invalid_wrong_test_password_here"
    })
    assert res.status_code == 401, f"Expected 401 for invalid password, got {res.status_code}"
    print("✅ Invalid password correctly rejected with 401 Unauthorized")

    # 3. Valid Login for ADMIN via environment variable
    res = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "admin@novahouse.com",
        "password": TEST_ADMIN_PASSWORD
    })
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    admin_data = res.json()
    admin_token = admin_data["token"]
    assert admin_data["user"]["role"] == "ADMIN"
    print("✅ Admin login successful (role: ADMIN, password from environment)")

    # 4. Valid Login for MANAGER via environment variable
    res = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "manager@novahouse.com",
        "password": TEST_MANAGER_PASSWORD
    })
    assert res.status_code == 200, f"Manager login failed: {res.text}"
    manager_data = res.json()
    manager_token = manager_data["token"]
    assert manager_data["user"]["role"] == "MANAGER"
    print("✅ Manager login successful (role: MANAGER, password from environment)")

    # 5. Valid Login for ANALYST via environment variable
    res = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "analyst@novahouse.com",
        "password": TEST_ANALYST_PASSWORD
    })
    assert res.status_code == 200, f"Analyst login failed: {res.text}"
    analyst_data = res.json()
    analyst_token = analyst_data["token"]
    assert analyst_data["user"]["role"] == "ANALYST"
    print("✅ Analyst login successful (role: ANALYST, password from environment)")

    # 6. Unauthenticated requests to protected endpoints must return 401
    res = requests.get(f"{BASE_URL}/api/v1/bookings")
    assert res.status_code == 401, f"Expected 401 without auth, got {res.status_code}"
    res = requests.get(f"{BASE_URL}/api/v1/guests")
    assert res.status_code == 401, f"Expected 401 without auth, got {res.status_code}"
    res = requests.get(f"{BASE_URL}/api/v1/payments/stats")
    assert res.status_code == 401, f"Expected 401 without auth, got {res.status_code}"
    res = requests.get(f"{BASE_URL}/api/v1/dashboard/overview")
    assert res.status_code == 401, f"Expected 401 without auth, got {res.status_code}"
    print("✅ Unauthenticated access to protected endpoints correctly blocked with 401 Unauthorized")

    # 6B. Malformed & Expired token rejection tests
    res = requests.get(f"{BASE_URL}/api/v1/bookings", headers={"Authorization": "Bearer malformed.invalid.token"})
    assert res.status_code == 401, f"Expected 401 for malformed token, got {res.status_code}"

    # Expired token (exp timestamp in the past)
    expired_header = "eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9"
    expired_payload = "eyJzdWIiOiAidXNyXzAxIiwgInJvbGUiOiAiQURNSU4iLCAiZXhwIjogMTAwMDAwMDAwMH0"
    res = requests.get(f"{BASE_URL}/api/v1/bookings", headers={"Authorization": f"Bearer {expired_header}.{expired_payload}.invalidsig"})
    assert res.status_code == 401, f"Expected 401 for expired token, got {res.status_code}"
    print("✅ Malformed and expired tokens correctly rejected with 401 Unauthorized")

    # 7. Role enforcement: ANALYST must NOT be able to modify bookings (403 Forbidden)
    analyst_headers = {"Authorization": f"Bearer {analyst_token}"}
    res = requests.put(f"{BASE_URL}/api/v1/bookings/NH-1024", json={"bookingStatus": "Cancelled"}, headers=analyst_headers)
    assert res.status_code == 403, f"Expected 403 Forbidden for Analyst modifying booking, got {res.status_code}"
    print("✅ Analyst role forbidden from Admin operational changes (returned 403 Forbidden)")

    # 8. Role enforcement: ANALYST CAN access Dashboard endpoints (200 OK)
    res = requests.get(f"{BASE_URL}/api/v1/dashboard/overview", headers=analyst_headers)
    assert res.status_code == 200, f"Analyst overview failed: {res.status_code}"
    print("✅ Analyst successfully accessed Dashboard overview (200 OK)")

    # 9. Role enforcement: MANAGER CAN access Admin operations
    manager_headers = {"Authorization": f"Bearer {manager_token}"}
    res = requests.get(f"{BASE_URL}/api/v1/bookings", headers=manager_headers)
    assert res.status_code == 200, f"Manager bookings failed: {res.status_code}"
    print("✅ Manager successfully accessed Admin bookings (200 OK)")

    # 10. Role enforcement: ADMIN CAN access all operations
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    res = requests.get(f"{BASE_URL}/api/v1/guests", headers=admin_headers)
    assert res.status_code == 200, f"Admin guests failed: {res.status_code}"
    print("✅ Admin successfully accessed Admin guests (200 OK)")

    # 11. Strict Date Validation Check (checkout <= checkin rejected with 400)
    invalid_dates_payload = {
        "guestName": "Date Validation Test Guest",
        "guestEmail": "date_val@novahouse.example",
        "roomId": "101",
        "checkIn": "2026-10-25",
        "checkOut": "2026-10-25",  # Invalid: checkout == checkin
        "guests": 2
    }
    res = requests.post(f"{BASE_URL}/api/v1/bookings", json=invalid_dates_payload)
    assert res.status_code == 400, f"Expected 400 for checkout == checkin, got {res.status_code}"

    invalid_backwards_payload = {
        "guestName": "Date Validation Test Guest",
        "guestEmail": "date_val@novahouse.example",
        "roomId": "101",
        "checkIn": "2026-10-25",
        "checkOut": "2026-10-20",  # Invalid: checkout < checkin
        "guests": 2
    }
    res = requests.post(f"{BASE_URL}/api/v1/bookings", json=invalid_backwards_payload)
    assert res.status_code == 400, f"Expected 400 for checkout < checkin, got {res.status_code}"
    print("✅ Backend date validation independently verified: checkout <= checkin rejected with 400 Bad Request")

    # 12. Public Endpoints verification without auth token
    res = requests.get(f"{BASE_URL}/api/v1/rooms")
    assert res.status_code == 200, f"Public rooms failed: {res.status_code}"
    res = requests.post(f"{BASE_URL}/api/v1/availability/check", json={"checkIn": "2026-10-20", "checkOut": "2026-10-22", "guests": 2})
    assert res.status_code == 200, f"Public availability check failed: {res.status_code}"
    print("✅ Public room catalog and availability check endpoints fully accessible without token")

    # 13. Verify all 7 Dashboard analytics endpoints with Analyst token
    endpoints = ["overview", "revenue", "bookings", "occupancy", "rooms", "guests", "payments"]
    for ep in endpoints:
        res = requests.get(f"{BASE_URL}/api/v1/dashboard/{ep}", headers=analyst_headers)
        assert res.status_code == 200, f"Dashboard {ep} failed: {res.status_code}"
    print("✅ All 7 Dashboard API endpoints verified successfully with Analyst token")

    print("\n🎉 ALL SECURITY & RBAC VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
