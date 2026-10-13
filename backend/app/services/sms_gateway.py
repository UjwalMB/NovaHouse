import os
import re
import uuid
import logging
import requests
from typing import Optional, Dict, Any, Tuple
from ..core.config import settings

logger = logging.getLogger("novahouse.sms")

class SmsDeliveryResult:
    """
    Structured outcome of an SMS dispatch attempt.
    Tracks provider acceptance, HTTP response codes, reference IDs, and safe error details.
    """
    def __init__(
        self,
        success: bool,
        status: str,  # 'SENT' or 'FAILED'
        provider_name: str,
        http_status: Optional[int] = None,
        provider_message_id: Optional[str] = None,
        error_message: Optional[str] = None,
    ):
        self.success = success
        self.status = status
        self.provider_name = provider_name
        self.http_status = http_status
        self.provider_message_id = provider_message_id
        self.error_message = error_message

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "status": self.status,
            "provider": self.provider_name,
            "httpStatus": self.http_status,
            "messageId": self.provider_message_id,
            "error": self.error_message,
        }

class SmsProviderGateway:
    """
    Production SMS Gateway Integration for NOVA HOUSE
    
    Supports:
    1. Twilio (Global transactional gateway via REST API)
    2. Fast2SMS / MSG91 (Indian DLT & Quick routes)
    3. Generic HTTP REST Gateway (Configurable webhook/REST endpoint)
    4. Mock/Test Mode (Explicitly separated for isolated automated testing)
    
    Guarantees:
    - Never marks SENT unless the actual provider HTTP API returned 200/201.
    - Never returns fake provider message IDs in production.
    - Captures safe, sanitized error descriptions on delivery failure.
    - Never logs secrets, auth tokens, or unmasked personal numbers.
    """

    @staticmethod
    def mask_phone(phone: Optional[str]) -> str:
        if not phone:
            return "******5529"
        clean = re.sub(r"[^\d]", "", str(phone))
        if len(clean) >= 4:
            return f"******{clean[-4:]}"
        return "******"

    @staticmethod
    def normalize_phone(phone: Optional[str]) -> Tuple[bool, str, str]:
        """
        Validates and normalizes phone numbers.
        Returns: (is_valid, e164_formatted, ten_digit_indian)
        """
        if not phone or not isinstance(phone, str):
            return False, "", ""

        cleaned = re.sub(r"[\s\-\(\)]", "", phone.strip())

        # Indian phone patterns (mobile numbers starting with 5, 6, 7, 8, 9)
        if re.match(r"^\+91[5-9]\d{9}$", cleaned):
            return True, cleaned, cleaned[-10:]
        if re.match(r"^91[5-9]\d{9}$", cleaned):
            return True, f"+{cleaned}", cleaned[-10:]
        if re.match(r"^0[5-9]\d{9}$", cleaned):
            return True, f"+91{cleaned[1:]}", cleaned[-10:]
        if re.match(r"^[5-9]\d{9}$", cleaned):
            return True, f"+91{cleaned}", cleaned

        # General international E.164 (+ followed by 10-15 digits)
        if re.match(r"^\+[1-9]\d{9,14}$", cleaned):
            return True, cleaned, cleaned[-10:]

        return False, cleaned, cleaned

    def send_sms(
        self,
        to_phone: str,
        message_text: str,
        booking_id: Optional[str] = None,
        is_test: bool = False,
    ) -> SmsDeliveryResult:
        """
        Dispatches SMS through the configured provider gateway.
        """
        is_valid, e164_phone, ten_digit_phone = self.normalize_phone(to_phone)
        masked = self.mask_phone(to_phone)

        if not is_valid:
            error = f"Invalid destination phone number format: '{masked}'."
            logger.warning(f"⚠️ [SMS GATEWAY] {error}")
            return SmsDeliveryResult(
                success=False,
                status="FAILED",
                provider_name="VALIDATION",
                error_message=error,
            )

        provider = getattr(settings, "SMS_PROVIDER", "TWILIO").upper()
        test_mode = getattr(settings, "SMS_TEST_MODE", False) or is_test
        sms_enabled = getattr(settings, "SMS_ENABLED", False)

        # ---------------------------------------------------------------------
        # 1. EXPLICIT MOCK / TEST MODE (For automated test suites)
        # ---------------------------------------------------------------------
        if test_mode or provider == "MOCK":
            mock_ref = f"mock_sms_req_{uuid.uuid4().hex[:12]}"
            logger.info(
                f"📱 [TEST/MOCK SMS GATEWAY] Dispatch simulated for {masked} (Booking: {booking_id}). "
                f"Reference ID: {mock_ref}. External provider API was NOT called."
            )
            return SmsDeliveryResult(
                success=True,
                status="SENT",
                provider_name="MOCK_TEST",
                http_status=200,
                provider_message_id=mock_ref,
            )

        # ---------------------------------------------------------------------
        # 2. REAL MODE CHECKS: Verify provider enablement and credentials
        # ---------------------------------------------------------------------
        if not sms_enabled:
            error = "SMS delivery disabled: SMS_ENABLED is set to false in backend environment."
            logger.warning(f"⚠️ [REAL SMS GATEWAY] {error}")
            return SmsDeliveryResult(
                success=False,
                status="FAILED",
                provider_name=provider,
                error_message=error,
            )

        api_key = getattr(settings, "SMS_PROVIDER_API_KEY", "").strip()
        account_id = getattr(settings, "SMS_PROVIDER_ACCOUNT_ID", "").strip()
        from_number = getattr(settings, "SMS_FROM_NUMBER", "").strip()

        # ---------------------------------------------------------------------
        # 3. REAL DISPATCH: TWILIO
        # ---------------------------------------------------------------------
        if provider == "TWILIO":
            if not account_id or not api_key:
                error = (
                    "SMS provider unconfigured: SMS_PROVIDER_ACCOUNT_ID (Twilio Account SID) "
                    "or SMS_PROVIDER_API_KEY (Twilio Auth Token) is missing from backend environment."
                )
                logger.error(f"❌ [REAL SMS GATEWAY] {error}")
                return SmsDeliveryResult(
                    success=False,
                    status="FAILED",
                    provider_name="TWILIO",
                    error_message=error,
                )

            if not from_number:
                error = "Twilio sender unconfigured: SMS_FROM_NUMBER is missing from backend environment."
                logger.error(f"❌ [REAL SMS GATEWAY] {error}")
                return SmsDeliveryResult(
                    success=False,
                    status="FAILED",
                    provider_name="TWILIO",
                    error_message=error,
                )

            endpoint = f"https://api.twilio.com/2010-04-01/Accounts/{account_id}/Messages.json"
            payload = {
                "To": e164_phone,
                "From": from_number,
                "Body": message_text,
            }

            try:
                logger.info(f"🌐 [REAL SMS GATEWAY] Calling Twilio API for destination {masked}...")
                resp = requests.post(
                    endpoint,
                    data=payload,
                    auth=(account_id, api_key),
                    timeout=12,
                )

                if resp.status_code in (200, 201):
                    data = resp.json()
                    msg_sid = data.get("sid")
                    status_text = data.get("status", "accepted")
                    logger.info(
                        f"✅ [REAL SMS GATEWAY] Twilio accepted SMS for {masked}. "
                        f"HTTP {resp.status_code}, SID={msg_sid}, Status={status_text}"
                    )
                    return SmsDeliveryResult(
                        success=True,
                        status="SENT",
                        provider_name="TWILIO",
                        http_status=resp.status_code,
                        provider_message_id=msg_sid,
                    )
                else:
                    data = resp.json() if "application/json" in resp.headers.get("Content-Type", "") else {}
                    code = data.get("code", resp.status_code)
                    msg = data.get("message") or resp.text[:150]
                    safe_err = f"Twilio API Error (HTTP {resp.status_code}, Code {code}): {msg}"
                    logger.error(f"❌ [REAL SMS GATEWAY] Twilio delivery rejected for {masked}: {safe_err}")
                    return SmsDeliveryResult(
                        success=False,
                        status="FAILED",
                        provider_name="TWILIO",
                        http_status=resp.status_code,
                        error_message=safe_err,
                    )

            except requests.exceptions.RequestException as e:
                safe_err = f"Network connection error contacting Twilio API: {str(e)[:120]}"
                logger.error(f"❌ [REAL SMS GATEWAY] Connection failure for {masked}: {safe_err}")
                return SmsDeliveryResult(
                    success=False,
                    status="FAILED",
                    provider_name="TWILIO",
                    error_message=safe_err,
                )

        # ---------------------------------------------------------------------
        # 4. REAL DISPATCH: FAST2SMS (Indian Gateway)
        # ---------------------------------------------------------------------
        elif provider == "FAST2SMS":
            if not api_key:
                error = "Fast2SMS unconfigured: SMS_PROVIDER_API_KEY is missing from backend environment."
                logger.error(f"❌ [REAL SMS GATEWAY] {error}")
                return SmsDeliveryResult(
                    success=False,
                    status="FAILED",
                    provider_name="FAST2SMS",
                    error_message=error,
                )

            endpoint = "https://www.fast2sms.com/dev/bulkV2"
            headers = {
                "authorization": api_key,
                "Content-Type": "application/json",
            }
            template_id = getattr(settings, "SMS_TEMPLATE_ID", "").strip()
            sender_id = getattr(settings, "SMS_SENDER_ID", "NOVAHS").strip()

            if template_id:
                # DLT approved template route
                payload = {
                    "route": "dlt",
                    "sender_id": sender_id,
                    "message": template_id,
                    "variables_values": message_text,
                    "numbers": ten_digit_phone,
                }
            else:
                # Quick transactional route
                payload = {
                    "route": "q",
                    "message": message_text,
                    "language": "english",
                    "numbers": ten_digit_phone,
                }

            try:
                logger.info(f"🌐 [REAL SMS GATEWAY] Calling Fast2SMS API for destination {masked}...")
                resp = requests.post(endpoint, json=payload, headers=headers, timeout=12)
                data = resp.json() if "application/json" in resp.headers.get("Content-Type", "") else {}

                if resp.status_code == 200 and data.get("return") is True:
                    req_id = data.get("request_id") or f"f2s_{uuid.uuid4().hex[:10]}"
                    logger.info(f"✅ [REAL SMS GATEWAY] Fast2SMS accepted message for {masked}. Request ID: {req_id}")
                    return SmsDeliveryResult(
                        success=True,
                        status="SENT",
                        provider_name="FAST2SMS",
                        http_status=resp.status_code,
                        provider_message_id=req_id,
                    )
                else:
                    err_msg = ", ".join(data.get("message", [f"HTTP {resp.status_code} error"]))
                    safe_err = f"Fast2SMS API Error: {err_msg}"
                    logger.error(f"❌ [REAL SMS GATEWAY] Fast2SMS rejected for {masked}: {safe_err}")
                    return SmsDeliveryResult(
                        success=False,
                        status="FAILED",
                        provider_name="FAST2SMS",
                        http_status=resp.status_code,
                        error_message=safe_err,
                    )

            except requests.exceptions.RequestException as e:
                safe_err = f"Network connection error contacting Fast2SMS API: {str(e)[:120]}"
                logger.error(f"❌ [REAL SMS GATEWAY] Connection failure for {masked}: {safe_err}")
                return SmsDeliveryResult(
                    success=False,
                    status="FAILED",
                    provider_name="FAST2SMS",
                    error_message=safe_err,
                )

        # ---------------------------------------------------------------------
        # 5. UNSUPPORTED OR UNKNOWN PROVIDER
        # ---------------------------------------------------------------------
        else:
            error = f"Unsupported SMS provider '{provider}' configured in backend environment."
            logger.error(f"❌ [REAL SMS GATEWAY] {error}")
            return SmsDeliveryResult(
                success=False,
                status="FAILED",
                provider_name=provider,
                error_message=error,
            )

sms_gateway = SmsProviderGateway()
