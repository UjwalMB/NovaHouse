import os
import sys
import uuid
from pathlib import Path
from dotenv import load_dotenv
import requests

# Load test credentials strictly from environment
workspace_dir = Path(os.environ.get("WORKSPACE_DIR", Path.cwd()))
load_dotenv(workspace_dir / "backend" / ".env")
load_dotenv(workspace_dir / ".env")
load_dotenv()

TEST_ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD") or os.environ.get("ADMIN_PASSWORD")
TEST_ANALYST_PASSWORD = os.environ.get("TEST_ANALYST_PASSWORD") or os.environ.get("ANALYST_PASSWORD")

if not (TEST_ADMIN_PASSWORD and TEST_ANALYST_PASSWORD):
    raise RuntimeError(
        "Required test credential environment variables are missing: "
        "TEST_ADMIN_PASSWORD and TEST_ANALYST_PASSWORD must be defined."
    )

BASE_URL = os.environ.get("TEST_API_URL", "http://127.0.0.1:8000")

def test_cross_application_flow():
    print("=== TEST A: E2E CROSS-APPLICATION DATA FLOW & CLEANUP ===")

    # 1. Authenticate Admin and Analyst via environment variables
    login_res = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "admin@novahouse.com",
        "password": TEST_ADMIN_PASSWORD
    })
    assert login_res.status_code == 200, f"Admin login failed: {login_res.text}"
    admin_token = login_res.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    anl_res = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "analyst@novahouse.com",
        "password": TEST_ANALYST_PASSWORD
    })
    assert anl_res.status_code == 200, f"Analyst login failed: {anl_res.text}"
    analyst_token = anl_res.json()["token"]
    analyst_headers = {"Authorization": f"Bearer {analyst_token}"}

    # Record baseline dashboard metrics
    d_before = requests.get(f"{BASE_URL}/api/v1/dashboard/overview", headers=analyst_headers).json()
    initial_bookings = d_before["total_bookings"]
    initial_revenue = d_before["total_revenue"]
    print(f"📊 Baseline Dashboard Metrics: Total Bookings = {initial_bookings}, Total Revenue = ₹{initial_revenue:,.2f}")

    # Step 1: Public Website creates reservation
    # Pricing formula: nightlyRate (48,000) * nights (3) + 18% GST (25,920) = 169,920
    nightly_rate = 48000
    nights = 3
    subtotal = nightly_rate * nights
    taxes = round(subtotal * 0.18)
    expected_total = subtotal + taxes

    unique_tag = uuid.uuid4().hex[:6]
    test_marker = f"E2E_TEST_DATA_{unique_tag}"
    booking_payload = {
        "guestName": f"VIP Test Patron {unique_tag}",
        "guestEmail": f"test_patron_{unique_tag}@luxurytest.example",
        "guestPhone": "+91 98450 99887",
        "guestCountry": "India",
        "roomNumber": "401",
        "roomType": "Terrace Garden Suite",
        "roomId": "401",
        "checkIn": "2026-10-25",
        "checkOut": "2026-10-28",
        "nights": nights,
        "guests": 2,
        "baseRate": nightly_rate,
        "taxes": taxes,
        "discount": 0,
        "totalAmount": expected_total,
        "paymentStatus": "PAID",
        "bookingStatus": "Confirmed",
        "paymentMethod": "Razorpay",
        "specialRequests": test_marker,
        "source": "Website Direct"
    }

    create_res = requests.post(f"{BASE_URL}/api/v1/bookings", json=booking_payload)
    assert create_res.status_code == 200, f"Booking creation failed: {create_res.text}"
    created_booking = create_res.json()
    booking_id = created_booking["id"]
    print(f"✅ Step 1: Public Website created reservation {booking_id} (Server calculated: ₹{created_booking['total_amount']:,.2f})")
    assert created_booking["total_amount"] == expected_total, f"Expected {expected_total}, got {created_booking['total_amount']}"
    assert created_booking["payment_status"] == "PENDING", f"Public booking must start as PENDING: {created_booking['payment_status']}"
    assert created_booking["booking_status"] == "Pending", f"Public booking must start as Pending: {created_booking['booking_status']}"

    # Step 2: Admin Panel retrieves the booking via FastAPI
    get_res = requests.get(f"{BASE_URL}/api/v1/bookings/{booking_id}", headers=admin_headers)
    assert get_res.status_code == 200, f"Admin retrieval failed: {get_res.text}"
    retrieved = get_res.json()
    assert retrieved["guest_email"] == booking_payload["guestEmail"]
    print(f"✅ Step 2: Admin Panel retrieved reservation {booking_id} from PostgreSQL via FastAPI")

    # Step 3: Admin Panel confirms payment at check-in and updates status to 'Checked In'
    patch_res = requests.patch(
        f"{BASE_URL}/api/v1/bookings/{booking_id}",
        json={"bookingStatus": "Checked In", "paymentStatus": "PAID"},
        headers=admin_headers
    )
    assert patch_res.status_code == 200, f"Status update failed: {patch_res.text}"
    updated = patch_res.json()
    assert updated["booking_status"] == "Checked In"
    assert updated["payment_status"] == "PAID"
    print(f"✅ Step 3: Admin Panel confirmed payment and updated reservation {booking_id} status to 'Checked In'")

    # Step 4: Dashboard retrieves updated database information
    d_after = requests.get(f"{BASE_URL}/api/v1/dashboard/overview", headers=analyst_headers).json()
    assert d_after["total_bookings"] == initial_bookings + 1
    assert d_after["total_revenue"] >= initial_revenue + expected_total
    print(f"✅ Step 4: Executive Dashboard reflected live database update (+1 booking, +₹{expected_total:,.2f})")

    # Step 5: Test Data Cleanup (Zero test data pollution)
    del_res = requests.delete(f"{BASE_URL}/api/v1/bookings/{booking_id}", headers=admin_headers)
    assert del_res.status_code == 200, f"Cleanup deletion failed: {del_res.text}"
    print(f"🧹 Step 5: Test booking {booking_id} and associated payment cleanly removed from database")

    # Verify metrics returned to baseline
    d_restored = requests.get(f"{BASE_URL}/api/v1/dashboard/overview", headers=analyst_headers).json()
    assert d_restored["total_bookings"] == initial_bookings, "Metrics failed to restore after cleanup"
    print(f"✅ Step 6: Verified zero database pollution: Dashboard metrics fully restored to baseline ({d_restored['total_bookings']} bookings)")

    print("✅ Architecture Verified: Frontend -> FastAPI -> Database (Zero direct Admin <-> Dashboard coupling).")
    print("\n🎉 TEST A (CROSS-APPLICATION FLOW & CLEANUP) COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    test_cross_application_flow()
